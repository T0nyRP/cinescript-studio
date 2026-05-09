import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const STYLE_SUFFIX: Record<string, string> = {
  cinematic: "cinematic lighting, dramatic shadows, 4K film quality, shallow depth of field",
  gritty: "raw handheld camera, desaturated realism, gritty texture",
  epic: "sweeping wide angle, epic grand scale, cinematic composition",
  noir: "deep noir shadows, neon accents, high contrast, moody atmosphere",
  realistic: "documentary natural lighting, photorealistic, authentic",
  "comic-book": "bold outlines, graphic novel style, vivid saturated colors",
}

export async function POST(request: NextRequest) {
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return NextResponse.json(
      { error: "FAL_KEY is not set. Go to your Vercel Dashboard → Project → Settings → Environment Variables and add FAL_KEY with your fal.ai API key." },
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
    const response = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: false,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json(
        { error: `fal.ai image generation failed (${response.status}): ${errText}` },
        { status: 500 }
      )
    }

    const result = await response.json() as { images: { url: string }[] }
    const imageUrl = result.images?.[0]?.url
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL returned from fal.ai" }, { status: 500 })
    }

    return NextResponse.json({ imageUrl })
  } catch (err) {
    return NextResponse.json(
      { error: `Image generation error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
