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

Return this JSON structure — keep ALL string values SHORT (under 100 chars) to avoid truncation:
{
  "characters": [
    {
      "name": "Full name",
      "age": "Age",
      "role": "Role",
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
      "summary": "One sentence summary.",
      "actionLevel": "high",
      "emotionalTone": "Tense",
      "characters": ["Exact character name"],
      "shotBreakdown": [
        {
          "order": 1,
          "type": "wide",
          "angle": "eye-level",
          "description": "Short shot desc",
          "action": "What happens",
          "lighting": "Lighting type",
          "duration": 10,
          "characters": ["Character name"],
          "prompt": "Cinematic image prompt under 100 chars",
          "dialogue": [
            { "characterName": "Exact name", "line": "Spoken line under 100 chars", "type": "spoken" }
          ]
        }
      ]
    }
  ]
}

STRICT RULES:
- Extract 3–5 main characters only
- Extract 2–3 best action/dramatic scenes only  
- Each scene: exactly 8 shots (8 shots × 10s = 80s per scene, close to the 1–2 min target)
- All string values: under 100 characters
- summary: 1 sentence max
- actionLevel: one of "low" "medium" "high" "extreme"
- shot type: one of "wide" "medium" "close-up" "aerial" "tracking"
- shot angle: one of "eye-level" "low-angle" "high-angle" "bird-eye"
- scene characters must be exact names from the characters array
- dialogue: extract 0-2 actual spoken lines per shot from the manuscript text; use [] if the shot has no dialogue
- dialogue.type: "spoken" for direct speech, "narration" for voice-over/internal monologue
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
      max_tokens: 8192,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(title, text) }],
    });

    const raw = (response.content[0] as { text: string }).text.trim();

    // Strip accidental markdown fences
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Try direct parse first
    let data: { characters: unknown[]; scenes: unknown[] };
    try {
      data = JSON.parse(jsonStr) as { characters: unknown[]; scenes: unknown[] };
    } catch {
      // Attempt repair for truncated responses
      const repaired = repairJson(jsonStr);
      try {
        data = JSON.parse(repaired) as { characters: unknown[]; scenes: unknown[] };
        console.warn(`JSON was repaired (stop_reason: ${response.stop_reason}, original length: ${jsonStr.length})`);
      } catch (finalErr) {
        console.error("JSON parse failed after repair. Stop reason:", response.stop_reason);
        console.error("Response tail (last 300):", raw.slice(-300));
        return NextResponse.json(
          {
            error: `AI returned incomplete JSON. stop_reason=${response.stop_reason}. Try uploading just the first 3 chapters of your manuscript.`,
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
        { error: "Analysis timed out. Try uploading just the first 3 chapters." },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}

/**
 * Best-effort JSON repair for truncated responses.
 * Handles both mid-string and mid-object truncation.
 */
function repairJson(s: string): string {
  let inString = false;
  let escape = false;
  let lastCompletePos = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') {
      if (!inString) { inString = true; }
      else { inString = false; lastCompletePos = i + 1; }
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") { /* push handled below */ }
    if (ch === "}" || ch === "]") lastCompletePos = i + 1;
  }

  // Truncate to last safe position (after a closed string or structure)
  let result = s.slice(0, lastCompletePos).trimEnd();

  // Remove dangling key-value prefix: ,"key": or ,"key" (value missing)
  result = result.replace(/,\s*"[^"]+"\s*:\s*$/, "");
  result = result.replace(/,\s*"[^"]+"\s*$/, "");
  result = result.replace(/,\s*$/, "");

  // Recount open structures in the truncated result
  const stack: string[] = [];
  let inS = false;
  let esc = false;
  for (const ch of result) {
    if (esc) { esc = false; continue; }
    if (ch === "\\" && inS) { esc = true; continue; }
    if (ch === '"') { inS = !inS; continue; }
    if (inS) continue;
    if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    if (ch === "}" || ch === "]") stack.pop();
  }
  while (stack.length > 0) result += stack.pop();

  return result;
}
