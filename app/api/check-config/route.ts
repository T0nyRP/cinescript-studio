import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/check-config
 * Returns a JSON report of env-var status and a live Galaxy AI connectivity test.
 * Use this to diagnose 500 errors on generate-shot-image.
 *
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
    galaxyAI: null as unknown,
  }

  // Quick Galaxy AI connectivity test (no credits used — just a bad-prompt dry-run
  // that will fail validation fast so we can confirm auth works)
  if (apiKey) {
    try {
      const testRes = await fetch(
        "https://api.galaxy.ai/api/v1/nodes/gpt-image-2-text/run",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: { prompt: "test", size: "Auto", quality: "Low" },
          }),
          signal: AbortSignal.timeout(12_000),
        }
      )

      const text = await testRes.text()
      let parsed: unknown = text
      try { parsed = JSON.parse(text) } catch { /* keep raw text */ }

      result.galaxyAI = {
        httpStatus: testRes.status,
        ok: testRes.ok,
        response: parsed,
      }
    } catch (err) {
      result.galaxyAI = {
        error: err instanceof Error ? err.message : String(err),
      }
    }
  } else {
    result.galaxyAI = "skipped — GALAXY_API_KEY not set"
  }

  return NextResponse.json(result, { status: 200 })
}
