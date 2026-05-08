import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

// We analyze the first ~60k chars (≈10k words) — enough to extract characters
// and find 3–5 strong action scenes without blowing token budgets.
const MAX_TEXT = 60_000;

const SYSTEM = `You are a cinematic script analyst helping a video producer extract characters and action scenes from a manuscript for short-form cinematic video production.

Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

function buildPrompt(title: string, text: string) {
  const excerpt = text.slice(0, MAX_TEXT);
  return `Analyze this manuscript excerpt and extract characters and action scenes for cinematic video production.

MANUSCRIPT TITLE: ${title}

TEXT:
${excerpt}

Return a JSON object with this exact structure:
{
  "characters": [
    {
      "name": "Full character name",
      "age": "Age or age range as string",
      "role": "Brief role description (e.g. Protagonist / ORION Agent)",
      "appearance": {
        "hair": "Hair description",
        "eyes": "Eye description",
        "height": "Height",
        "build": "Physical build",
        "distinguishing": "Distinguishing features",
        "clothing": "Typical clothing"
      },
      "personality": ["Trait 1", "Trait 2", "Trait 3", "Trait 4"],
      "voiceStyle": "Voice description for TTS (e.g. Deep male, American, commanding)"
    }
  ],
  "scenes": [
    {
      "title": "Scene title",
      "chapter": "Chapter reference (e.g. Chapter 1)",
      "location": "Specific location",
      "summary": "2–3 sentence summary of what happens",
      "actionLevel": "high" or "medium" or "low" or "extreme",
      "emotionalTone": "e.g. Tense, Triumphant, Desperate",
      "characters": ["Character name 1", "Character name 2"],
      "shotBreakdown": [
        {
          "order": 1,
          "type": "wide" or "medium" or "close-up" or "aerial" or "tracking",
          "angle": "eye-level" or "low-angle" or "high-angle" or "bird-eye",
          "description": "What is visible in this shot",
          "action": "What is happening / motion",
          "lighting": "Lighting description",
          "duration": 8,
          "characters": ["Character name"],
          "prompt": "Detailed image generation prompt for this shot (style, lighting, composition, mood)"
        }
      ]
    }
  ]
}

Rules:
- Extract 3–8 main characters who appear most prominently
- Extract 3–6 action-heavy or dramatically intense scenes best suited for 60–90 second cinematic videos
- Each scene should have 5–8 shots in the shotBreakdown
- Write image generation prompts that are vivid and cinematic (lighting, angle, mood, visual details)
- actionLevel "extreme" = gunfights, explosions, hand-to-hand combat; "high" = chases, confrontations; "medium" = tense dialogue, infiltration; "low" = setup/character moments
- Return ONLY the JSON object, nothing else`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured. Add it to your environment variables." },
      { status: 503 }
    );
  }

  try {
    const { title, text } = await request.json() as { title: string; text: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 8192,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(title, text) }],
    });

    const raw = (response.content[0] as { text: string }).text.trim();

    // Strip any accidental markdown fences
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const data = JSON.parse(jsonStr) as { characters: unknown[]; scenes: unknown[] };

    if (!Array.isArray(data.characters) || !Array.isArray(data.scenes)) {
      throw new Error("Invalid response structure from AI");
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
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
