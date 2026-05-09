import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

const GALAXY_API = "https://api.galaxy.ai/api/v1"

function extractVideoUrl(output: unknown): string | null {
  if (!output || typeof output !== "object") return null
  const o = output as Record<string, unknown>
  // { videoUrl }
  if (typeof o.videoUrl === "string") return o.videoUrl
  // { url }
  if (typeof o.url === "string") return o.url
  // { video: { url } }
  if (o.video && typeof (o.video as Record<string, unknown>).url === "string") {
    return (o.video as Record<string, unknown>).url as string
  }
  // { videos: [{ url }] }
  if (Array.isArray(o.videos) && o.videos.length > 0) {
    const first = o.videos[0] as Record<string, unknown>
    if (typeof first.url === "string") return first.url
  }
  // { output: { url } } — nested
  if (o.output && typeof o.output === "object") {
    return extractVideoUrl(o.output)
  }
  return null
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GALAXY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { status: "error", error: "GALAXY_API_KEY is not set." },
      { status: 503 }
    )
  }

  let runId = ""
  try {
    const body = await request.json() as { requestId: string }
    runId = body.requestId
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid request body" }, { status: 400 })
  }

  if (!runId) {
    return NextResponse.json({ status: "error", error: "requestId is required" }, { status: 400 })
  }

  try {
    const res = await fetch(`${GALAXY_API}/nodes/runs/${runId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    })

    if (!res.ok) {
      return NextResponse.json({
        status: "error",
        error: `Galaxy AI status check failed (${res.status})`,
      })
    }

    const data = await res.json() as {
      id: string
      nodeType: string
      status: string
      output?: unknown
      error?: string
    }

    if (data.status === "completed") {
      const videoUrl = extractVideoUrl(data.output)
      if (!videoUrl) {
        return NextResponse.json({
          status: "error",
          error: "Video generation completed but no URL found in output",
        })
      }
      return NextResponse.json({ status: "completed", videoUrl })
    }

    if (data.status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: data.error ?? "Video generation failed on Galaxy AI",
      })
    }

    // pending / running
    return NextResponse.json({ status: "processing" })
  } catch (err) {
    return NextResponse.json({
      status: "error",
      error: `Poll error: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
}
