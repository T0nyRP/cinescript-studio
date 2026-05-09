import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// ─────────────────────────────────────────────
// Runtime health state
// ─────────────────────────────────────────────
// null  = not yet tested
// true  = healthy (last check succeeded)
// false = unhealthy (permanently disabled for this session)
let _supabaseHealthy: boolean | null = null
let _healthCheckPromise: Promise<boolean> | null = null

/** Permanently disable Supabase for this browser session and log a clear message. */
export function markSupabaseUnhealthy(reason: string) {
  if (_supabaseHealthy === false) return // already marked — don't repeat
  _supabaseHealthy = false
  console.error(
    `[CineScript] Supabase disabled for this session — ${reason}\n` +
    `  If the tables don't exist yet, run this SQL in Supabase → SQL Editor:\n\n` +
    `    CREATE TABLE IF NOT EXISTS characters (\n` +
    `      id TEXT PRIMARY KEY, name TEXT NOT NULL, age TEXT, role TEXT,\n` +
    `      appearance JSONB, personality TEXT[], voice_style TEXT, voice JSONB,\n` +
    `      image_url TEXT, reference_images TEXT[], manuscript_source TEXT,\n` +
    `      created_at TIMESTAMPTZ DEFAULT NOW()\n` +
    `    );\n` +
    `    CREATE TABLE IF NOT EXISTS scenes (\n` +
    `      id TEXT PRIMARY KEY, title TEXT, chapter TEXT, start_line INT,\n` +
    `      end_line INT, text TEXT, summary TEXT, action_level TEXT,\n` +
    `      emotional_tone TEXT, location TEXT, characters TEXT[],\n` +
    `      shot_breakdown JSONB, manuscript_source TEXT,\n` +
    `      created_at TIMESTAMPTZ DEFAULT NOW()\n` +
    `    );\n` +
    `    CREATE TABLE IF NOT EXISTS videos (\n` +
    `      id TEXT PRIMARY KEY, title TEXT, subtitle TEXT, video_url TEXT,\n` +
    `      thumbnail_url TEXT, duration TEXT, shots INT, scene TEXT, style TEXT,\n` +
    `      characters TEXT[], reference_images JSONB,\n` +
    `      generated_at TIMESTAMPTZ DEFAULT NOW(),\n` +
    `      facebook_ready BOOLEAN DEFAULT TRUE, tags TEXT[],\n` +
    `      has_voice BOOLEAN DEFAULT FALSE\n` +
    `    );\n` +
    `    ALTER TABLE characters ENABLE ROW LEVEL SECURITY;\n` +
    `    ALTER TABLE scenes    ENABLE ROW LEVEL SECURITY;\n` +
    `    ALTER TABLE videos    ENABLE ROW LEVEL SECURITY;\n` +
    `    CREATE POLICY "Allow all" ON characters FOR ALL USING (true) WITH CHECK (true);\n` +
    `    CREATE POLICY "Allow all" ON scenes    FOR ALL USING (true) WITH CHECK (true);\n` +
    `    CREATE POLICY "Allow all" ON videos    FOR ALL USING (true) WITH CHECK (true);\n\n` +
    `  Your data is safe in localStorage.`
  )
}

/** Returns true only when Supabase is configured AND the last health check passed. */
export function isSupabaseReady(): boolean {
  return _supabaseHealthy === true
}

/**
 * One-time connection health check per browser session.
 *
 * Uses a real SELECT LIMIT 1 (not HEAD) so it detects:
 *  - Wrong API key (401)
 *  - Table not found / schema error (500 / 404)
 *  - RLS blocking reads (empty data is OK, error is not)
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  // Already checked — return cached result immediately
  if (_supabaseHealthy !== null) return _supabaseHealthy
  // Another call already started the check — wait for it
  if (_healthCheckPromise) return _healthCheckPromise

  if (!isSupabaseConfigured || !supabase) {
    _supabaseHealthy = false
    return false
  }

  _healthCheckPromise = (async () => {
    try {
      // Real query with order — matches what getCharacters() will run.
      // This catches table-not-found (500) that HEAD requests miss.
      const { error } = await supabase
        .from("characters")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)

      if (error) {
        const msg = error.message ?? ""
        const isAuthError =
          error.code === "PGRST301" ||
          msg.toLowerCase().includes("jwt") ||
          msg.toLowerCase().includes("api key") ||
          msg.toLowerCase().includes("unauthorized")

        const hint = isAuthError
          ? "Check that NEXT_PUBLIC_SUPABASE_ANON_KEY is correct in Vercel env vars."
          : `Supabase error (${error.code ?? "unknown"}): ${msg}`

        markSupabaseUnhealthy(hint)
        return false
      }

      _supabaseHealthy = true
      return true
    } catch (e) {
      markSupabaseUnhealthy(`Exception: ${e instanceof Error ? e.message : String(e)}`)
      return false
    } finally {
      _healthCheckPromise = null
    }
  })()

  return _healthCheckPromise
}

// --- Full Supabase SQL schema — run once in Supabase SQL Editor ---
// (shown in the markSupabaseUnhealthy() message above)
