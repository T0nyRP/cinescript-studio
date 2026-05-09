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

export async function POST(request: NextRequest) {
  const apiKey = process.env.GALAXY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GALAXY_API_KEY is not set. Go to your Vercel Dashboard → Project → Settings → Environment Variables and add GALAXY_API_KEY (starts with gx_)." },
      { status: 503 }
    )
  }

  let prompt = ""
  let style = "cinematic"
  let characterDesc = ""
  try {
    const body = await request.json() as { prompt: string; style?: string; characterDesc?: string }
    prompt = body.prompt ?? ""
    style = body.style ?? "cinematic"
    characterDesc = body.characterDesc ?? ""
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const styleTag = STYLE_SUFFIX[style] ?? STYLE_SUFFIX.cinematic
  const charTag = characterDesc ? `, featuring ${characterDesc}` : ""
  const fullPrompt = `${prompt}${charTag}, ${styleTag}, 16:9 widescreen, professional film photography, high detail`

  try {
    // Submit job — do NOT poll here; GPT Image 2 takes 60-90s which exceeds
    // Vercel's function timeout. Return runId so the frontend can poll async.
    const submitRes = await fetch(`${GALAXY_API}/nodes/${MODEL}/run`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
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
      console.error(`[generate-shot-image] Galaxy AI rejected request (${submitRes.status}):`, errText)
      const userMsg =
        submitRes.status === 401 || submitRes.status === 403
          ? "GALAXY_API_KEY is invalid or unauthorised. Check your Vercel env vars."
          : submitRes.status === 404
          ? `Galaxy AI node not found (${submitRes.status}): ${errText}`
          : submitRes.status === 422 || submitRes.status === 400
          ? `Galaxy AI rejected input (${submitRes.status}): ${errText}`
          : `Galaxy AI error (${submitRes.status}): ${errText}`
      return NextResponse.json({ error: userMsg }, { status: 500 })
    }

    const submitData = await submitRes.json() as { runId: string }
    const runId = submitData.runId
    if (!runId) {
      return NextResponse.json({ error: "No runId returned from Galaxy AI" }, { status: 500 })
    }

    // Return runId — frontend polls /api/poll-galaxy-status?type=image
    return NextResponse.json({ requestId: runId, model: MODEL })
  } catch (err) {
    return NextResponse.json(
      { error: `Image submission error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
