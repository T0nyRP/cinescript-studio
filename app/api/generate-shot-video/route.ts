import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

const GALAXY_API = "https://api.galaxy.ai/api/v1"

// Use reference model when character photos are available — locks subject appearance
const MODEL_WITH_REF  = "seedance_2_0_fast_reference"
// Fall back to standard model when no reference images exist
const MODEL_BASE      = "seedance_2_0_fast"

export async function POST(request: NextRequest) {
  const apiKey = process.env.GALAXY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "GALAXY_API_KEY not set" }, { status: 503 })
  }

  let imageUrl = ""
  let prompt = ""
  let duration = 10
  let referenceImageUrls: string[] = []
  let characterNames: string[] = []

  try {
    const body = await request.json() as {
      imageUrl: string
      prompt: string
      duration?: number
      referenceImageUrls?: string[]   // character library photos for visual consistency
      characterNames?: string[]       // used to label references in the prompt (@Image1 = Name)
    }
    imageUrl = body.imageUrl
    prompt = body.prompt
    duration = body.duration ?? 10
    referenceImageUrls = (body.referenceImageUrls ?? []).filter(Boolean).slice(0, 4)
    characterNames = body.characterNames ?? []
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!imageUrl || !prompt) {
    return NextResponse.json({ error: "imageUrl and prompt are required" }, { status: 400 })
  }

  const clampedDuration = Math.max(4, Math.min(15, Math.round(duration)))
  const useReference = referenceImageUrls.length > 0
  const MODEL = useReference ? MODEL_WITH_REF : MODEL_BASE

  // When using reference model, label each reference image in the prompt
  // so the model knows which @Image tag maps to which character
  let finalPrompt = prompt
  if (useReference && characterNames.length > 0) {
    const labels = referenceImageUrls
      .map((_, i) => `@Image${i + 1} is ${characterNames[i] ?? `Character ${i + 1}`}`)
      .join(", ")
    finalPrompt = `${prompt} (${labels})`
  }

  try {
    const input: Record<string, unknown> = {
      image_url: imageUrl,
      prompt: finalPrompt,
      duration: clampedDuration,
      resolution: "720p",
      generate_audio: false,
    }

    if (useReference) {
      input.reference_image_urls = referenceImageUrls
    }

    const submitRes = await fetch(`${GALAXY_API}/nodes/${MODEL}/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      console.error(`[generate-shot-video] Galaxy AI rejected (${submitRes.status}):`, errText)

      // If reference model fails, retry with base model
      if (useReference) {
        console.warn("[generate-shot-video] Reference model failed, retrying with base model")
        const fallbackRes = await fetch(`${GALAXY_API}/nodes/${MODEL_BASE}/run`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ input: { image_url: imageUrl, prompt, duration: clampedDuration, resolution: "720p", generate_audio: false } }),
        })
        if (fallbackRes.ok) {
          const { runId } = await fallbackRes.json() as { runId: string }
          if (runId) return NextResponse.json({ requestId: runId, model: MODEL_BASE })
        }
      }

      return NextResponse.json(
        { error: `Galaxy AI video submission failed (${submitRes.status}): ${errText}` },
        { status: 500 }
      )
    }

    const { runId } = await submitRes.json() as { runId: string }
    if (!runId) return NextResponse.json({ error: "No runId from Galaxy AI" }, { status: 500 })

    return NextResponse.json({ requestId: runId, model: MODEL })
  } catch (err) {
    return NextResponse.json(
      { error: `Video submission error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
