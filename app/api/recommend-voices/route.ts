import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { VoiceRecommendation } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

// ─── Curated ElevenLabs voice catalog ────────────────────────────────────────
// These are stable, widely-available ElevenLabs voices with known characteristics.
const VOICE_CATALOG = [
  // Male voices
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam",    gender: "male",   age: "mid",    accent: "American", tone: "Deep, authoritative, controlled",       notes: "Classic commanding voice, natural leader energy, effortlessly in control" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh",    gender: "male",   age: "mid",    accent: "American", tone: "Mid, grounded, firm",                   notes: "Slightly more human and relatable while still commanding, trusted leader" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold",  gender: "male",   age: "mid",    accent: "American", tone: "Deep, resonant, intense",               notes: "Strong presence and weight, great for high-intensity scenes, can feel heavy if overused" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam",     gender: "male",   age: "mid",    accent: "American", tone: "Mid, smooth, controlled",               notes: "Flexible, can lean into calm authority or intensity, strategic and composed" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni",  gender: "male",   age: "young",  accent: "American", tone: "Mid, precise, clean",                   notes: "Excellent for controlled deliberate speech, tactical and calculated" },
  { id: "GBv7mTt0atIp3Br8iCZE", name: "Thomas",  gender: "male",   age: "mid",    accent: "American", tone: "Calm, measured, thoughtful",            notes: "Intellectual gravitas, good for analytical or strategic characters" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum",  gender: "male",   age: "mid",    accent: "Transatlantic", tone: "Intense, dramatic, cinematic",      notes: "High cinematic energy, strong for action scenes and dramatic reveals" },
  { id: "ODq5zmih8GrVes37Dy39", name: "Patrick",  gender: "male",   age: "senior", accent: "Irish",    tone: "Deep, weathered, authoritative",        notes: "Weight of experience, gravitas and world-weariness, mentor/veteran roles" },
  { id: "D38z5RcWu1voky8WS1ja", name: "Fin",     gender: "male",   age: "mid",    accent: "Irish",    tone: "Gruff, weathered, intense",             notes: "Street-level grit, works well for morally complex or dangerous characters" },
  { id: "SOYHLrjzK2X1ezoPC6cr", name: "Harry",   gender: "male",   age: "young",  accent: "British",  tone: "Confident, energetic, clear",           notes: "Youthful authority, works for ambitious or driven younger characters" },
  { id: "flq6f7yk4E4fJM5XTYuZ", name: "Michael", gender: "male",   age: "mid",    accent: "American", tone: "Warm, professional, trustworthy",       notes: "News-anchor quality clarity, great for narration or exposition-heavy roles" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male",   age: "young",  accent: "Australian", tone: "Casual, confident, energetic",        notes: "Relaxed authority, good for charismatic anti-hero or field operative types" },
  // Female voices
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel",  gender: "female", age: "mid",    accent: "American", tone: "Warm, professional, clear",             notes: "Versatile narration voice, trustworthy and composed" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi",    gender: "female", age: "young",  accent: "American", tone: "Strong, confident, expressive",         notes: "Assertive female voice, good for leadership or action roles" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella",   gender: "female", age: "young",  accent: "American", tone: "Soft, warm, engaging",                  notes: "Empathetic and approachable, good for scientist or analyst characters" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli",    gender: "female", age: "young",  accent: "American", tone: "Bright, clear, precise",                notes: "Intelligence and focus, good for technical or strategic female roles" },
  { id: "ThT5KcBeYPX3keUQqHPh", name: "Dorothy", gender: "female", age: "senior", accent: "British",  tone: "Pleasant, composed, authoritative",     notes: "Refined authority, good for experienced intelligence or command roles" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "female", age: "mid",  accent: "Swedish-American", tone: "Authoritative, precise, strong", notes: "Ice-cold authority, perfect for antagonists or strict commanders" },
];

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not set." },
        { status: 500 }
      );
    }

    const { character } = await req.json();
    if (!character) {
      return NextResponse.json({ error: "Character data required" }, { status: 400 });
    }

    const catalogJson = JSON.stringify(VOICE_CATALOG, null, 2);

    const prompt = `You are a voice casting director for a cinematic action film. Analyze this character profile and recommend the 5 best-fit voices from the catalog below.

CHARACTER:
Name: ${character.name}
Age: ${character.age}
Role: ${character.role}
Personality: ${Array.isArray(character.personality) ? character.personality.join(", ") : character.personality}
Voice Style Description: ${character.voiceStyle}
Appearance: ${character.appearance?.distinguishing ?? ""}

VOICE CATALOG:
${catalogJson}

Return ONLY a valid JSON array of exactly 5 recommendations, ranked 1 (best) to 5. Each object must have this exact shape:
{
  "id": "<voice_id from catalog>",
  "name": "<voice name>",
  "tone": "<tone from catalog>",
  "whyItFits": "<1-2 sentence specific fit rationale for THIS character>",
  "characterFeel": "<3-5 word descriptor — e.g. Confident, decisive, in control>",
  "rank": <1-5>,
  "stabilityRange": [<min 0-100>, <max 0-100>],
  "similarityRange": [<min 0-100>, <max 0-100>],
  "styleRange": [<min 0-100>, <max 0-100>]
}

Setting guidelines:
- stabilityRange: 60-70 for expressive/emotional characters, 70-85 for controlled/authoritative
- similarityRange: 70-85 for natural delivery, 80-90 for precise/sharp delivery
- styleRange: 0-15 for subtle, 15-30 for moderate, 30-50 for intense/dramatic

Return ONLY the JSON array. No markdown, no explanation.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const recommendations: VoiceRecommendation[] = JSON.parse(cleaned);

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("recommend-voices error:", err);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
