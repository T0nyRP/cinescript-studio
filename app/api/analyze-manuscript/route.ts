import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

// Reduced to 25K chars — enough for 3–6 good scenes without hitting timeouts
const MAX_TEXT = 25_000;

const SYSTEM = `You are a cinematic script analyst helping a video producer extract characters and action scenes from a manuscript for short-form cinematic video production.

Return ONLY valid JSON — no markdown, no explanation, no code fences. The JSON must be parseable by JSON.parse() with no modifications.`;

function buildPrompt(title: string, text: string) {
  const excerpt = text.slice(0, MAX_TEXT);
  return `Analyze this manuscript excerpt and extract characters and action scenes for cinematic video production.

MANUSCRIPT TITLE: ${title}

TEXT:
${excerpt}

Return a JSON object with this EXACT structure (no extra fields, no comments):
{
  "characters": [
    {
      "name": "Full character name",
      "age": "Age or age range as string",
      "role": "Brief role description",
      "appearance": {
        "hair": "Hair description",
        "eyes": "Eye description",
        "height": "Height",
        "build": "Physical build",
        "distinguishing": "Distinguishing features",
        "clothing": "Typical clothing"
      },
      "personality": ["Trait 1", "Trait 2", "Trait 3"],
      "voiceStyle": "Voice description for TTS (e.g. Deep male, American, commanding)"
    }
  ],
  "scenes": [
    {
      "title": "Scene title",
      "chapter": "Chapter reference",
      "location": "Specific location",
      "summary": "2-3 sentence summary",
      "actionLevel": "high",
      "emotionalTone": "Tense",
      "characters": ["Exact character name from characters array"],
      "shotBreakdown": [
        {
          "order": 1,
          "type": "wide",
          "angle": "eye-level",
          "description": "What is visible in this shot",
          "action": "What is happening",
          "lighting": "Lighting description",
          "duration": 8,
          "characters": ["Character name"],
          "prompt": "Detailed cinematic image generation prompt"
        }
      ]
    }
  ]
}

Rules:
- Extract 3–6 main characters who appear most prominently
- Extract 3–5 action-heavy or dramatically intense scenes
- Each scene needs 4–6 shots in shotBreakdown
- actionLevel must be one of: "low", "medium", "high", "extreme"
- shot type must be one of: "wide", "medium", "close-up", "aerial", "tracking"
- shot angle must be one of: "eye-level", "low-angle", "high-angle", "bird-eye"
- characters in scenes must be EXACT names from the characters array above
- Return ONLY the JSON object, nothing else`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in Vercel environment variables. Go to Vercel Dashboard → Project → Settings → Environment Variables and add it." },
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

    // Use claude-3-5-haiku for speed — avoids Vercel serverless timeout on free tier
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(title, text) }],
    });

    const raw = (response.content[0] as { text: string }).text.trim();

    // Strip any accidental markdown fences
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let data: { characters: unknown[]; scenes: unknown[] };
    try {
      data = JSON.parse(jsonStr) as { characters: unknown[]; scenes: unknown[] };
    } catch (parseErr) {
      console.error("JSON parse error. Raw response:", raw.slice(0, 500));
      return NextResponse.json(
        { error: `AI returned malformed JSON: ${parseErr instanceof Error ? parseErr.message : "parse error"}` },
        { status: 500 }
      );
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

    // Distinguish timeout from other errors
    if (msg.includes("timed out") || msg.includes("timeout") || msg.includes("FUNCTION_INVOCATION_TIMEOUT")) {
      return NextResponse.json(
        { error: "Analysis timed out. Try uploading a shorter excerpt (first 3 chapters) or upgrade to Vercel Pro for longer function execution." },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
