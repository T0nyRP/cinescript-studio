import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const GALAXY_API = "https://api.galaxy.ai/api/v1"
const MODEL = "elevenlabs-v3-tts"

function extractAudioUrl(output: unknown): string | null {
  if (!output || typeof output !== "object") return null
  const o = output as Record<string, unknown>
  // { audioUrl }
  if (typeof o.audioUrl === "string") return o.audioUrl
  // { url }
  if (typeof o.url === "string") return o.url
  // { audio: { url } }
  if (o.audio && typeof (o.audio as Record<string, unknown>).url === "string") {
    return (o.audio as Record<string, unknown>).url as string
  }
  // { audio_url }
  if (typeof o.audio_url === "string") return o.audio_url
  return null
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GALAXY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GALAXY_API_KEY is not set. Add it to your Vercel environment variables." },
      { status: 503 }
    )
  }

  let text = ""
  let voiceId = ""
  let stability = 0.5
  let similarityBoost = 0.75
  let styleExaggeration = 0
  let speed = 1.0

  try {
    const body = await request.json() as {
      text: string
      voiceId: string
      stability?: number
      similarityBoost?: number
      styleExaggeration?: number
      speed?: number
    }
    text = body.text
    voiceId = body.voiceId
    stability = body.stability ?? 0.5
    similarityBoost = body.similarityBoost ?? 0.75
    styleExaggeration = body.styleExaggeration ?? 0
    speed = body.speed ?? 1.0
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!text || !voiceId) {
    return NextResponse.json({ error: "text and voiceId are required" }, { status: 400 })
  }

  try {
    // Submit job to Galaxy AI
    const submitRes = await fetch(`${GALAXY_API}/nodes/${MODEL}/run`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        stability,
        similarityBoost,
        style: styleExaggeration,
        speed,
      }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      return NextResponse.json(
        { error: `Galaxy AI TTS submission failed (${submitRes.status}): ${errText}` },
        { status: 500 }
      )
    }

    const submitData = await submitRes.json() as { runId?: string; id?: string }
    const runId = submitData.runId ?? submitData.id
    if (!runId) {
      return NextResponse.json({ error: "No runId returned from Galaxy AI" }, { status: 500 })
    }

    // Poll synchronously — max 55 s
    const deadline = Date.now() + 55_000
    const pollInterval = 2_000

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, pollInterval))

      const pollRes = await fetch(`${GALAXY_API}/nodes/runs/${runId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      })

      if (!pollRes.ok) continue

      const pollData = await pollRes.json() as {
        status: string
        output?: unknown
        error?: string
      }

      if (pollData.status === "completed") {
        const audioUrl = extractAudioUrl(pollData.output)
        if (!audioUrl) {
          return NextResponse.json(
            { error: "TTS completed but no audio URL found in output" },
            { status: 500 }
          )
        }
        return NextResponse.json({ audioUrl })
      }

      if (pollData.status === "failed") {
        return NextResponse.json(
          { error: `TTS generation failed: ${pollData.error ?? "unknown error"}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: "TTS generation timed out after 55 seconds. Try shorter text or retry." },
      { status: 504 }
    )
  } catch (err) {
    return NextResponse.json(
      { error: `TTS error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
