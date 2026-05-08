import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

// 20K chars ≈ first 3–4 chapters — enough for solid extraction
const MAX_TEXT = 20_000;

const SYSTEM = `You are a cinematic script analyst. Extract characters and action scenes from manuscripts for short-form video production.

CRITICAL: Return ONLY a valid, COMPLETE JSON object. No markdown. No explanation. No code fences. The JSON MUST be fully closed and parseable by JSON.parse(). Never truncate mid-string or mid-array.`;

function buildPrompt(title: string, text: string) {
  const excerpt = text.slice(0, MAX_TEXT);
  return `Analyze this manuscript and extract characters and scenes.

TITLE: ${title}

TEXT:
${excerpt}

Return this JSON structure — keep descriptions SHORT (under 80 chars each) to avoid truncation:
{
  "characters": [
    {
      "name": "Full name",
      "age": "Age",
      "role": "Role (e.g. Protagonist)",
      "appearance": {
        "hair": "Short desc",
        "eyes": "Short desc",
        "height": "e.g. 6ft",
        "build": "e.g. Athletic",
        "distinguishing": "Short desc",
        "clothing": "Short desc"
      },
      "personality": ["Trait1", "Trait2", "Trait3"],
      "voiceStyle": "e.g. Deep male, American, commanding"
    }
  ],
  "scenes": [
    {
      "title": "Scene title",
      "chapter": "Chapter X",
      "location": "Location",
      "summary": "One or two sentence summary.",
      "actionLevel": "high",
      "emotionalTone": "Tense",
      "characters": ["Exact character name"],
      "shotBreakdown": [
        {
          "order": 1,
          "type": "wide",
          "angle": "eye-level",
          "description": "Short shot description",
          "action": "What happens",
          "lighting": "Lighting type",
          "duration": 8,
          "characters": ["Character name"],
          "prompt": "Cinematic image prompt, under 120 chars"
        }
      ]
    }
  ]
}

STRICT RULES — follow exactly or the response is unusable:
- Extract 3–5 main characters only
- Extract 3–4 best action/dramatic scenes only
- Each scene: exactly 4 shots (no more)
- All string values: under 120 characters
- summary: 1–2 sentences max
- actionLevel: one of "low" "medium" "high" "extreme"
- shot type: one of "wide" "medium" "close-up" "aerial" "tracking"
- shot angle: one of "eye-level" "low-angle" "high-angle" "bird-eye"
- scene characters must be exact names from the characters array
- Return ONLY the JSON — fully closed, no trailing content`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it in Vercel Dashboard → Project → Settings → Environment Variables." },
      { status: 503 }
    );
  }

  let title = "";
  let text = "";
  try {
    const body = await request.json() as { title: string; text: string };
    title = body.title ?? "";
    text = body.text ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text?.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,        // raised from 4096 — prevents JSON truncation
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(title, text) }],
    });

    const raw = (response.content[0] as { text: string }).text.trim();

    // Strip accidental markdown fences
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Attempt repair: if JSON is truncated, close any open structures
    let data: { characters: unknown[]; scenes: unknown[] };
    try {
      data = JSON.parse(jsonStr) as { characters: unknown[]; scenes: unknown[] };
    } catch {
      // Try to repair truncated JSON by closing open arrays/objects
      const repaired = repairJson(jsonStr);
      try {
        data = JSON.parse(repaired) as { characters: unknown[]; scenes: unknown[] };
      } catch (finalErr) {
        console.error("JSON parse failed. First 500 chars of response:", raw.slice(0, 500));
        console.error("Last 200 chars:", raw.slice(-200));
        return NextResponse.json(
          {
            error: `AI returned incomplete JSON (response was cut off). This usually means the manuscript produced too much output. Try uploading just the first 3 chapters.`,
            debug: {
              responseLength: raw.length,
              stopReason: response.stop_reason,
              parseError: finalErr instanceof Error ? finalErr.message : String(finalErr),
            }
          },
          { status: 500 }
        );
      }
    }

    if (!Array.isArray(data.characters) || !Array.isArray(data.scenes)) {
      return NextResponse.json(
        { error: "AI response missing characters or scenes arrays" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      characters: data.characters,
      scenes: data.scenes,
      charactersFound: data.characters.length,
      scenesFound: data.scenes.length,
    });
  } catch (err) {
    console.error("Analysis error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";

    if (msg.includes("timed out") || msg.includes("timeout") || msg.includes("FUNCTION_INVOCATION_TIMEOUT")) {
      return NextResponse.json(
        { error: "Analysis timed out. Try uploading just the first 3 chapters of your manuscript." },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}

/**
 * Best-effort JSON repair for truncated responses.
 * Counts open braces/brackets and closes them in reverse order.
 */
function repairJson(s: string): string {
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of s) {
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    if (ch === "}" || ch === "]") stack.pop();
  }

  // Trim to last complete value — remove trailing comma if any
  let result = s.trimEnd().replace(/,\s*$/, "");

  // Close all open structures
  while (stack.length > 0) {
    result += stack.pop();
  }

  return result;
}
