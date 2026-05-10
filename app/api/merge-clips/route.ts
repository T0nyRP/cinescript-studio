import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

const GALAXY_API = "https://api.galaxy.ai/api/v1"

function extractVideoUrl(output: unknown): string | null {
  if (!output || typeof output !== "object") return null
  const o = output as Record<string, unknown>
  if (Array.isArray(o.result) && o.result.length > 0) {
    for (const item of o.result) {
      if (typeof item === "string" && item.startsWith("http")) return item
    }
  }
  if (typeof o.videoUrl === "string") return o.videoUrl
  if (typeof o.video_url === "string") return o.video_url
  if (typeof o.url === "string" && (o.url as string).startsWith("http")) return o.url as string
  if (o.output && typeof o.output === "object") return extractVideoUrl(o.output)
  return null
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GALAXY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "GALAXY_API_KEY not set" }, { status: 503 })
  }

  let videoUrls: string[] = []
  try {
    const body = await request.json() as { videoUrls: string[] }
    videoUrls = body.videoUrls ?? []
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (videoUrls.length < 2) {
    // Nothing to merge — return the single clip as-is
    return NextResponse.json({ videoUrl: videoUrls[0] ?? null })
  }

  // Galaxy AI merge_videos takes up to 10 clips
  const clipped = videoUrls.slice(0, 10)

  try {
    // Submit merge job
    const submitRes = await fetch(`${GALAXY_API}/nodes/merge_videos/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          video_urls: clipped,
          transition: "none",   // clean cut — no dissolve between action clips
        },
      }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      console.error("[merge-clips] Galaxy AI rejected merge:", errText)
      // Fall back: return first clip rather than failing entirely
      return NextResponse.json({ videoUrl: videoUrls[0], warning: `Merge failed (${submitRes.status}), returning first clip` })
    }

    const { runId } = await submitRes.json() as { runId: string }
    if (!runId) {
      return NextResponse.json({ videoUrl: videoUrls[0], warning: "No runId from merge — returning first clip" })
    }

    // Poll up to 55s
    const deadline = Date.now() + 55_000
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 4_000))

      const pollRes = await fetch(`${GALAXY_API}/nodes/runs/${runId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (!pollRes.ok) continue

      const data = await pollRes.json() as { status: string; output?: unknown; error?: string }
      const status = (data.status ?? "").toLowerCase()

      if (status === "completed") {
        const mergedUrl = extractVideoUrl(data.output)
        if (mergedUrl) return NextResponse.json({ videoUrl: mergedUrl })
        // Extraction failed — log and fall back
        console.error("[merge-clips] extractVideoUrl failed. Raw output:", JSON.stringify(data.output))
        return NextResponse.json({ videoUrl: videoUrls[0], warning: "Merged but URL not found, returning first clip" })
      }

      if (status === "failed") {
        console.error("[merge-clips] merge failed:", data.error)
        return NextResponse.json({ videoUrl: videoUrls[0], warning: `Merge failed: ${data.error ?? "unknown"}, returning first clip` })
      }
    }

    // Timed out — return first clip as fallback
    return NextResponse.json({ videoUrl: videoUrls[0], warning: "Merge timed out, returning first clip" })
  } catch (err) {
    console.error("[merge-clips] exception:", err)
    return NextResponse.json({ videoUrl: videoUrls[0], warning: `Merge error: ${err instanceof Error ? err.message : String(err)}` })
  }
}
