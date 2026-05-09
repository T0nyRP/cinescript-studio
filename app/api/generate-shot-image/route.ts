import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const GALAXY_API = "https://api.galaxy.ai/api/v1"
const MODEL = "gpt-image-2-text"

const STYLE_SUFFIX: Record<string, string> = {
  cinematic: "cinematic lighting, dramatic shadows, 4K film quality, shallow depth of field",
  gritty: "raw handheld camera, desaturated realism, gritty texture",
  epic: "sweeping wide angle, epic grand scale, cinematic composition",
  noir: "deep noir shadows, neon accents, high contrast, moody atmosphere",
  realistic: "documentary natural lighting, photorealistic, authentic",
  "comic-book": "bold outlines, graphic novel style, vivid saturated colors",
}

function extractImageUrl(output: unknown): string | null {
  if (!output || typeof output !== "object") return null
  const o = output as Record<string, unknown>
  // { images: [{ url }] }
  if (Array.isArray(o.images) && o.images.length > 0) {
    const first = o.images[0] as Record<string, unknown>
    if (typeof first.url === "string") return first.url
  }
  // { imageUrl }
  if (typeof o.imageUrl === "string") return o.imageUrl
  // { url }
  if (typeof o.url === "string") return o.url
  // { image: { url } }
  if (o.image && typeof (o.image as Record<string, unknown>).url === "string") {
    return (o.image as Record<string, unknown>).url as string
  }
  return null
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
    // Submit job to Galaxy AI
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
      // Log the full response so it appears in Vercel Function Logs for diagnosis
      console.error(`[generate-shot-image] Galaxy AI rejected request (${submitRes.status}):`, errText)
      const userMsg =
        submitRes.status === 401 || submitRes.status === 403
          ? "GALAXY_API_KEY is invalid or unauthorised. Check your Vercel env vars."
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

    // Poll synchronously — max 55 s to stay within Vercel's 60s limit
    const deadline = Date.now() + 55_000
    const pollInterval = 2_000

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, pollInterval))

      const pollRes = await fetch(`${GALAXY_API}/nodes/runs/${runId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      })

      if (!pollRes.ok) {
        continue // transient error — keep trying
      }

      const pollData = await pollRes.json() as {
        status: string
        output?: unknown
        error?: string
      }

      if (pollData.status === "completed") {
        const imageUrl = extractImageUrl(pollData.output)
        if (!imageUrl) {
          return NextResponse.json({ error: "Image generation completed but no URL found in output" }, { status: 500 })
        }
        return NextResponse.json({ imageUrl })
      }

      if (pollData.status === "failed") {
        return NextResponse.json(
          { error: `Image generation failed: ${pollData.error ?? "unknown error"}` },
          { status: 500 }
        )
      }

      // pending / running — keep polling
    }

    return NextResponse.json(
      { error: "Image generation timed out after 55 seconds. Try a simpler prompt or retry." },
      { status: 504 }
    )
  } catch (err) {
    return NextResponse.json(
      { error: `Image generation error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
