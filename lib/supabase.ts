import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// ─────────────────────────────────────────────
// Runtime connection health check
// ─────────────────────────────────────────────
// Tested once per browser session. Resolves to true only if the anon key
// is valid and accepted by the Supabase project. If the key is wrong/missing
// (HTTP 401) we disable Supabase for the rest of the session so we don't
// spam the console with 401 errors on every data read.
// ─────────────────────────────────────────────
let _supabaseHealthy: boolean | null = null
let _healthCheckPromise: Promise<boolean> | null = null

export async function checkSupabaseHealth(): Promise<boolean> {
  // Already checked this session — return cached result
  if (_supabaseHealthy !== null) return _supabaseHealthy

  // If another tab/call already started the check, wait for it
  if (_healthCheckPromise) return _healthCheckPromise

  if (!isSupabaseConfigured || !supabase) {
    _supabaseHealthy = false
    return false
  }

  _healthCheckPromise = (async () => {
    try {
      // Use a lightweight HEAD-style query: count only, no rows returned
      const { error } = await supabase
        .from("characters")
        .select("id", { count: "exact", head: true })

      if (error) {
        if (error.code === "PGRST301" || error.message?.toLowerCase().includes("jwt") || error.message?.toLowerCase().includes("api key") || error.message?.toLowerCase().includes("unauthorized")) {
          console.warn(
            "[CineScript] Supabase auth failed — check that NEXT_PUBLIC_SUPABASE_ANON_KEY is correct in your Vercel env vars.\n" +
            "  1. Go to supabase.com → your project → Project Settings → API\n" +
            "  2. Copy the 'anon public' key\n" +
            "  3. Paste it as NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Project → Settings → Environment Variables\n" +
            "  4. Redeploy your Vercel project\n" +
            "  Falling back to localStorage — your data is safe."
          )
          _supabaseHealthy = false
        } else {
          // Some other error (network, RLS, etc.) — still mark unhealthy to avoid spam
          console.warn("[CineScript] Supabase connection error:", error.message, "— using localStorage fallback.")
          _supabaseHealthy = false
        }
        return false
      }

      _supabaseHealthy = true
      return true
    } catch (e) {
      console.warn("[CineScript] Supabase connection exception:", e, "— using localStorage fallback.")
      _supabaseHealthy = false
      return false
    } finally {
      _healthCheckPromise = null
    }
  })()

  return _healthCheckPromise
}

/** Returns true only when Supabase is configured AND the last health check passed. */
export function isSupabaseReady(): boolean {
  return _supabaseHealthy === true
}

// --- Supabase SQL schema (run this in your Supabase SQL editor) ---
//
// CREATE TABLE IF NOT EXISTS characters (
//   id TEXT PRIMARY KEY,
//   name TEXT NOT NULL,
//   age TEXT,
//   role TEXT,
//   appearance JSONB,
//   personality TEXT[],
//   voice_style TEXT,
//   voice JSONB,
//   image_url TEXT,
//   reference_images TEXT[],
//   manuscript_source TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE IF NOT EXISTS scenes (
//   id TEXT PRIMARY KEY,
//   title TEXT,
//   chapter TEXT,
//   start_line INT,
//   end_line INT,
//   text TEXT,
//   summary TEXT,
//   action_level TEXT,
//   emotional_tone TEXT,
//   location TEXT,
//   characters TEXT[],
//   shot_breakdown JSONB,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE IF NOT EXISTS videos (
//   id TEXT PRIMARY KEY,
//   title TEXT,
//   subtitle TEXT,
//   video_url TEXT,
//   thumbnail_url TEXT,
//   duration TEXT,
//   shots INT,
//   scene TEXT,
//   style TEXT,
//   characters TEXT[],
//   reference_images JSONB,
//   generated_at TIMESTAMPTZ DEFAULT NOW(),
//   facebook_ready BOOLEAN DEFAULT TRUE,
//   tags TEXT[],
//   has_voice BOOLEAN DEFAULT FALSE
// );
//
// -- Enable Row Level Security (optional but recommended)
// ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
// ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
// ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
//
// -- Allow all operations for anon key (single-user app)
// CREATE POLICY "Allow all" ON characters FOR ALL USING (true) WITH CHECK (true);
// CREATE POLICY "Allow all" ON scenes FOR ALL USING (true) WITH CHECK (true);
// CREATE POLICY "Allow all" ON videos FOR ALL USING (true) WITH CHECK (true);
