import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const elKey = process.env.ELEVENLABS_API_KEY
  if (!elKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not set. Add it to your Vercel environment variables." },
      { status: 503 }
    )
  }

  let text = ""
  let voiceId = ""
  let stability = 0.5
  let similarityBoost = 0.75
  let styleExaggeration = 0

  try {
    const body = await request.json() as {
      text: string
      voiceId: string
      stability?: number
      similarityBoost?: number
      styleExaggeration?: number
    }
    text = body.text
    voiceId = body.voiceId
    stability = body.stability ?? 0.5
    similarityBoost = body.similarityBoost ?? 0.75
    styleExaggeration = body.styleExaggeration ?? 0
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!text || !voiceId) {
    return NextResponse.json({ error: "text and voiceId are required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": elKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style: styleExaggeration,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json(
        { error: `ElevenLabs TTS failed (${response.status}): ${errText}` },
        { status: 500 }
      )
    }

    const audioBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(audioBuffer).toString("base64")

    return NextResponse.json({ audioUrl: `data:audio/mpeg;base64,${base64}` })
  } catch (err) {
    return NextResponse.json(
      { error: `TTS error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
