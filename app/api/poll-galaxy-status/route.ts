import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

const GALAXY_API = "https://api.galaxy.ai/api/v1"

// ── Output extractors ────────────────────────────────────────────────────────

function extractVideoUrl(output: unknown): string | null {
  if (!output || typeof output !== "object") return null
  const o = output as Record<string, unknown>
  // { result: ["https://...mp4"] }  — actual Galaxy AI shape
  if (Array.isArray(o.result) && o.result.length > 0) {
    for (const item of o.result) {
      if (typeof item === "string" && item.startsWith("http")) return item
    }
  }
  if (typeof o.videoUrl === "string") return o.videoUrl
  if (typeof o.video_url === "string") return o.video_url
  if (typeof o.url === "string" && (o.url as string).startsWith("http")) return o.url as string
  if (o.video && typeof o.video === "object") {
    const v = o.video as Record<string, unknown>
    if (typeof v.url === "string") return v.url
  }
  if (Array.isArray(o.videos) && o.videos.length > 0) {
    const first = o.videos[0] as Record<string, unknown>
    if (typeof first.url === "string") return first.url
  }
  if (o.output && typeof o.output === "object") return extractVideoUrl(o.output)
  return null
}

function extractImageUrl(output: unknown): string | null {
  if (!output) return null
  // Array of strings: ["https://..."]
  if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === "string" && item.startsWith("http")) return item
      const nested = extractImageUrl(item)
      if (nested) return nested
    }
    return null
  }
  if (typeof output !== "object") return null
  const o = output as Record<string, unknown>
  // { imageUrl } or { image_url }
  if (typeof o.imageUrl === "string") return o.imageUrl
  if (typeof o.image_url === "string") return o.image_url
  // { url }
  if (typeof o.url === "string" && (o.url as string).startsWith("http")) return o.url as string
  // { images: [{ url } | "https://..."] }
  if (Array.isArray(o.images) && o.images.length > 0) {
    for (const item of o.images) {
      if (typeof item === "string" && item.startsWith("http")) return item
      if (typeof item === "object" && item !== null) {
        const i = item as Record<string, unknown>
        if (typeof i.url === "string") return i.url
        if (typeof i.imageUrl === "string") return i.imageUrl
        if (typeof i.image_url === "string") return i.image_url
      }
    }
  }
  // { data: [{ url }] }  — OpenAI image format
  if (Array.isArray(o.data) && o.data.length > 0) {
    const first = o.data[0] as Record<string, unknown>
    if (typeof first.url === "string") return first.url
    if (typeof first.b64_json === "string") return `data:image/jpeg;base64,${first.b64_json}`
  }
  // { image: { url } }
  if (o.image && typeof o.image === "object") {
    const i = o.image as Record<string, unknown>
    if (typeof i.url === "string") return i.url
  }
  // { result: ["https://..."] }  — Galaxy AI actual shape
  if (Array.isArray(o.result) && o.result.length > 0) {
    for (const item of o.result) {
      if (typeof item === "string" && item.startsWith("http")) return item
    }
  }
  // { output: { ... } } — nested wrapper
  if (o.output && typeof o.output === "object") return extractImageUrl(o.output)
  // { result: { ... } }
  if (o.result && typeof o.result === "object") return extractImageUrl(o.result)
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

    // Galaxy AI returns uppercase statuses: QUEUED, RUNNING, COMPLETED, FAILED
    const status = (data.status ?? "").toLowerCase()

    if (status === "completed") {
      if (assetType === "image") {
        const imageUrl = extractImageUrl(data.output)
        if (!imageUrl) {
          // Log for Vercel Function Logs and return raw output for diagnosis
          console.error("[poll-galaxy-status] extractImageUrl failed. Raw output:", JSON.stringify(data.output))
          return NextResponse.json({
            status: "error",
            error: `Image completed but URL not found. Raw output: ${JSON.stringify(data.output).slice(0, 500)}`,
          })
        }
        return NextResponse.json({ status: "completed", imageUrl })
      } else {
        const videoUrl = extractVideoUrl(data.output)
        if (!videoUrl) {
          console.error("[poll-galaxy-status] extractVideoUrl failed. Raw output:", JSON.stringify(data.output))
          return NextResponse.json({
            status: "error",
            error: `Video completed but URL not found. Raw output: ${JSON.stringify(data.output).slice(0, 500)}`,
          })
        }
        return NextResponse.json({ status: "completed", videoUrl })
      }
    }

    if (status === "failed") {
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
