import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

// Uses Kling v1.6 image-to-video via fal.ai queue (async job submission)
const MODEL = "fal-ai/kling-video/v1.6/standard/image-to-video"

export async function POST(request: NextRequest) {
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return NextResponse.json(
      { error: "FAL_KEY is not set. Add it to your Vercel environment variables." },
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

  try {
    // Submit to fal.ai queue — returns a requestId immediately, no waiting
    const response = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt,
        duration: duration <= 5 ? "5" : "10",
        aspect_ratio: "16:9",
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json(
        { error: `fal.ai video submission failed (${response.status}): ${errText}` },
        { status: 500 }
      )
    }

    const result = await response.json() as { request_id: string }
    if (!result.request_id) {
      return NextResponse.json({ error: "No request_id returned from fal.ai" }, { status: 500 })
    }

    return NextResponse.json({ requestId: result.request_id, model: MODEL })
  } catch (err) {
    return NextResponse.json(
      { error: `Video submission error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
