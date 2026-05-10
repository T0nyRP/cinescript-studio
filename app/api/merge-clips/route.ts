import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30   // Only submits the job now — no internal polling

const GALAXY_API = "https://api.galaxy.ai/api/v1"

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

  if (videoUrls.length === 0) {
    return NextResponse.json({ error: "No video URLs provided" }, { status: 400 })
  }

  // Single clip — nothing to merge, return it directly
  if (videoUrls.length === 1) {
    return NextResponse.json({ videoUrl: videoUrls[0] })
  }

  // Galaxy AI merge_videos accepts up to 10 clips
  const clipped = videoUrls.slice(0, 10)

  const submitRes = await fetch(`${GALAXY_API}/nodes/merge_videos/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        video_urls: clipped,
        transition: "none",   // clean cuts for action sequences
      },
    }),
  })

  if (!submitRes.ok) {
    const errText = await submitRes.text()
    console.error("[merge-clips] Galaxy AI rejected merge:", errText)
    return NextResponse.json(
      { error: `Merge submission failed (${submitRes.status}): ${errText}` },
      { status: 500 }
    )
  }

  const submitData = await submitRes.json() as { runId: string }
  if (!submitData.runId) {
    return NextResponse.json({ error: "No runId from Galaxy AI merge" }, { status: 500 })
  }

  // Return the runId — frontend polls /api/poll-galaxy-status with type:"merge"
  return NextResponse.json({ runId: submitData.runId })
}
