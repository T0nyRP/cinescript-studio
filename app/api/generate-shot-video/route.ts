import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

const GALAXY_API = "https://api.galaxy.ai/api/v1"
const MODEL = "seedance-2.0-fast-image-to-video"

export async function POST(request: NextRequest) {
  const apiKey = process.env.GALAXY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GALAXY_API_KEY is not set. Add it to your Vercel environment variables." },
      { status: 503 }
    )
  }

  let imageUrl = ""
  let prompt = ""
  let duration = 10
  try {
    const body = await request.json() as { imageUrl: string; prompt: string; duration?: number }
    imageUrl = body.imageUrl
    prompt = body.prompt
    duration = body.duration ?? 10
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!imageUrl || !prompt) {
    return NextResponse.json({ error: "imageUrl and prompt are required" }, { status: 400 })
  }

  // Clamp duration to Galaxy AI's accepted range (4–15 seconds)
  const clampedDuration = Math.max(4, Math.min(15, Math.round(duration)))

  try {
    // Submit async job — Galaxy AI returns a runId immediately
    const submitRes = await fetch(`${GALAXY_API}/nodes/${MODEL}/run`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt,
        duration: clampedDuration,
        resolution: "720p",
        generate_audio: false,
      }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      return NextResponse.json(
        { error: `Galaxy AI video submission failed (${submitRes.status}): ${errText}` },
        { status: 500 }
      )
    }

    const result = await submitRes.json() as { runId?: string; id?: string }
    const runId = result.runId ?? result.id
    if (!runId) {
      return NextResponse.json({ error: "No runId returned from Galaxy AI" }, { status: 500 })
    }

    // Return the runId so the frontend can poll via /api/poll-galaxy-status
    return NextResponse.json({ requestId: runId, model: MODEL })
  } catch (err) {
    return NextResponse.json(
      { error: `Video submission error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
