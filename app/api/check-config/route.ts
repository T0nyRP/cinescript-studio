import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * GET /api/check-config
 * Submits a real low-cost image job and polls until done (or 55s).
 * Shows the EXACT status strings + output shape returned by Galaxy AI.
 * REMOVE OR PROTECT THIS ENDPOINT BEFORE GOING PUBLIC.
 */
export async function GET() {
  const apiKey = process.env.GALAXY_API_KEY ?? ""
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

  const result: Record<string, unknown> = {
    env: {
      GALAXY_API_KEY: apiKey
        ? `✓ set (${apiKey.slice(0, 8)}...${apiKey.slice(-4)})`
        : "✗ MISSING",
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || "✗ MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnon
        ? `✓ set (${supabaseAnon.slice(0, 12)}...)`
        : "✗ MISSING",
    },
    submit: null as unknown,
    pollLog: [] as unknown[],
    finalStatus: null as unknown,
  }

  if (!apiKey) {
    result.submit = "skipped — GALAXY_API_KEY not set"
    return NextResponse.json(result)
  }

  // ── 1. Submit a cheap test image ──────────────────────────────────────────
  let runId = ""
  try {
    const submitRes = await fetch(
      "https://api.galaxy.ai/api/v1/nodes/gpt_image_2/run",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { prompt: "a red circle on white background", size: "1024x1024", quality: "Low", output_format: "JPEG" },
        }),
        signal: AbortSignal.timeout(15_000),
      }
    )
    const raw = await submitRes.text()
    let parsed: unknown = raw
    try { parsed = JSON.parse(raw) } catch { /* keep raw */ }

    result.submit = { httpStatus: submitRes.status, ok: submitRes.ok, body: parsed }

    if (submitRes.ok && typeof parsed === "object" && parsed !== null) {
      runId = (parsed as Record<string, unknown>).runId as string ?? ""
    }
  } catch (err) {
    result.submit = { error: err instanceof Error ? err.message : String(err) }
  }

  if (!runId) {
    result.finalStatus = "Could not get runId — see submit error above"
    return NextResponse.json(result)
  }

  // ── 2. Poll until done or 55s deadline ───────────────────────────────────
  const pollLog: unknown[] = []
  const deadline = Date.now() + 55_000

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4_000))
    try {
      const pollRes = await fetch(
        `https://api.galaxy.ai/api/v1/nodes/runs/${runId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        }
      )
      const raw = await pollRes.text()
      let parsed: unknown = raw
      try { parsed = JSON.parse(raw) } catch { /* keep raw */ }

      const entry = { httpStatus: pollRes.status, body: parsed }
      pollLog.push(entry)

      if (pollRes.ok && typeof parsed === "object" && parsed !== null) {
        const p = parsed as Record<string, unknown>
        // Stop on any terminal status
        const st = (p.status as string ?? "").toLowerCase(); if (st && !["pending","queued","running","processing"].includes(st)) {
          result.finalStatus = `TERMINAL — status="${p.status}", output=${JSON.stringify(p.output ?? null).slice(0, 300)}`
          break
        }
      }
    } catch (err) {
      pollLog.push({ error: err instanceof Error ? err.message : String(err) })
    }
  }

  if (!result.finalStatus) {
    result.finalStatus = "Timed out after 55s — still processing (last poll in pollLog)"
  }

  result.pollLog = pollLog
  return NextResponse.json(result, { status: 200 })
}
