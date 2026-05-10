import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

const GALAXY_API = "https://api.galaxy.ai/api/v1"
const MODEL = "gpt_image_2"

const STYLE_SUFFIX: Record<string, string> = {
  cinematic: "cinematic lighting, dramatic shadows, 4K film quality, shallow depth of field",
  gritty: "raw handheld camera, desaturated realism, gritty texture",
  epic: "sweeping wide angle, epic grand scale, cinematic composition",
  noir: "deep noir shadows, neon accents, high contrast, moody atmosphere",
  realistic: "documentary natural lighting, photorealistic, authentic",
  "comic-book": "bold outlines, graphic novel style, vivid saturated colors",
}

interface CharacterAppearance {
  hair?: string
  eyes?: string
  height?: string
  build?: string
  distinguishing?: string
  clothing?: string
}

interface CharacterRef {
  name: string
  age?: string
  role?: string
  appearance?: CharacterAppearance
  personality?: string[]
}

/** Build a detailed appearance description from the full character library record */
function buildCharacterDesc(chars: CharacterRef[]): string {
  return chars.map((c) => {
    const a = c.appearance ?? {}
    const parts = [
      c.name,
      c.age ? `${c.age}-year-old` : "",
      a.build ?? "",
      a.height ?? "",
      a.hair ? `${a.hair} hair` : "",
      a.eyes ? `${a.eyes} eyes` : "",
      a.distinguishing ?? "",
      a.clothing ?? "",
    ].filter(Boolean)
    return parts.join(", ")
  }).join("; ")
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GALAXY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GALAXY_API_KEY is not set. Add it in Vercel → Project → Settings → Environment Variables." },
      { status: 503 }
    )
  }

  let prompt = ""
  let style = "cinematic"
  let characters: CharacterRef[] = []
  try {
    const body = await request.json() as {
      prompt: string
      style?: string
      characters?: CharacterRef[]   // full character objects from the library
    }
    prompt = body.prompt ?? ""
    style = body.style ?? "cinematic"
    characters = body.characters ?? []
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const styleTag = STYLE_SUFFIX[style] ?? STYLE_SUFFIX.cinematic
  const charDesc = characters.length > 0 ? `, featuring ${buildCharacterDesc(characters)}` : ""
  const fullPrompt =
    `${prompt}${charDesc}, ${styleTag}, 16:9 widescreen, professional film photography, high detail`

  try {
    const submitRes = await fetch(`${GALAXY_API}/nodes/${MODEL}/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: fullPrompt,
          size: "1536x1024",
          quality: "High",
          output_format: "JPEG",
        },
      }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      console.error(`[generate-shot-image] Galaxy AI rejected (${submitRes.status}):`, errText)
      const msg =
        submitRes.status === 401 || submitRes.status === 403
          ? "GALAXY_API_KEY is invalid or unauthorised."
          : submitRes.status === 404
          ? `Galaxy AI node not found (${submitRes.status}): ${errText}`
          : `Galaxy AI error (${submitRes.status}): ${errText}`
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const { runId } = await submitRes.json() as { runId: string }
    if (!runId) return NextResponse.json({ error: "No runId returned from Galaxy AI" }, { status: 500 })

    return NextResponse.json({ requestId: runId, model: MODEL })
  } catch (err) {
    return NextResponse.json(
      { error: `Image submission error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
