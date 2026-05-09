import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

const GALAXY_API = "https://api.galaxy.ai/api/v1"

// ── Output extractors ────────────────────────────────────────────────────────

function extractVideoUrl(output: unknown): string | null {
  if (!output || typeof output !== "object") return null
  const o = output as Record<string, unknown>
  if (typeof o.videoUrl === "string") return o.videoUrl
  if (typeof o.url === "string") return o.url
  if (o.video && typeof (o.video as Record<string, unknown>).url === "string") {
    return (o.video as Record<string, unknown>).url as string
  }
  if (Array.isArray(o.videos) && o.videos.length > 0) {
    const first = o.videos[0] as Record<string, unknown>
    if (typeof first.url === "string") return first.url
  }
  if (o.output && typeof o.output === "object") return extractVideoUrl(o.output)
  return null
}

function extractImageUrl(output: unknown): string | null {
  if (!output || typeof output !== "object") return null
  const o = output as Record<string, unknown>
  // { images: [{ url }] }
  if (Array.isArray(o.images) && o.images.length > 0) {
    const first = o.images[0] as Record<string, unknown>
    if (typeof first.url === "string") return first.url
    if (typeof first.imageUrl === "string") return first.imageUrl
  }
  if (typeof o.imageUrl === "string") return o.imageUrl
  if (typeof o.url === "string") return o.url
  if (o.image && typeof (o.image as Record<string, unknown>).url === "string") {
    return (o.image as Record<string, unknown>).url as string
  }
  if (o.output && typeof o.output === "object") return extractImageUrl(o.output)
  return null
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.GALAXY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { status: "error", error: "GALAXY_API_KEY is not set." },
      { status: 503 }
    )
  }

  let runId = ""
  let assetType: "video" | "image" = "video"
  try {
    const body = await request.json() as { requestId: string; type?: "video" | "image" }
    runId = body.requestId
    assetType = body.type ?? "video"
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
      if (assetType === "image") {
        const imageUrl = extractImageUrl(data.output)
        if (!imageUrl) {
          return NextResponse.json({
            status: "error",
            error: "Image generation completed but no URL found in output",
          })
        }
        return NextResponse.json({ status: "completed", imageUrl })
      } else {
        const videoUrl = extractVideoUrl(data.output)
        if (!videoUrl) {
          return NextResponse.json({
            status: "error",
            error: "Video generation completed but no URL found in output",
          })
        }
        return NextResponse.json({ status: "completed", videoUrl })
      }
    }

    if (data.status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: data.error ?? `${assetType} generation failed on Galaxy AI`,
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
