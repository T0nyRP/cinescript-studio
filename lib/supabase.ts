import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

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
