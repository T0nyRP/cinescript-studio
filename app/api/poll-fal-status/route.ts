import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return NextResponse.json({ status: "error", error: "FAL_KEY is not set." }, { status: 503 })
  }

  let requestId = ""
  let model = ""
  try {
    const body = await request.json() as { requestId: string; model: string }
    requestId = body.requestId
    model = body.model
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid request body" }, { status: 400 })
  }

  if (!requestId || !model) {
    return NextResponse.json({ status: "error", error: "requestId and model are required" }, { status: 400 })
  }

  try {
    // Check queue status
    const statusRes = await fetch(
      `https://queue.fal.run/${model}/requests/${requestId}/status`,
      { headers: { "Authorization": `Key ${falKey}` } }
    )

    if (!statusRes.ok) {
      return NextResponse.json({ status: "error", error: `Status check failed: ${statusRes.status}` })
    }

    const statusData = await statusRes.json() as { status: string; error?: string }

    if (statusData.status === "COMPLETED") {
      // Fetch the result
      const resultRes = await fetch(
        `https://queue.fal.run/${model}/requests/${requestId}`,
        { headers: { "Authorization": `Key ${falKey}` } }
      )

      if (!resultRes.ok) {
        return NextResponse.json({ status: "error", error: "Failed to fetch result" })
      }

      const result = await resultRes.json() as {
        video?: { url: string; content_type?: string; file_size?: number }
        images?: { url: string }[]
      }

      const videoUrl = result.video?.url
      const imageUrl = result.images?.[0]?.url

      if (!videoUrl && !imageUrl) {
        return NextResponse.json({ status: "error", error: "No URL in completed result" })
      }

      return NextResponse.json({ status: "completed", videoUrl: videoUrl ?? imageUrl })
    }

    if (statusData.status === "FAILED") {
      return NextResponse.json({
        status: "failed",
        error: statusData.error ?? "Generation failed on fal.ai",
      })
    }

    // IN_QUEUE or IN_PROGRESS
    return NextResponse.json({ status: "processing" })
  } catch (err) {
    return NextResponse.json({
      status: "error",
      error: `Poll error: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
}
