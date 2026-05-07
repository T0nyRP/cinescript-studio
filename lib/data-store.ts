/**
 * Dual-mode data store.
 * - If NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set → Supabase (syncs across devices)
 * - Otherwise → localStorage (browser-local, zero config)
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { EMBER_CHARACTERS, EMBER_SCENES, DEFAULT_VIDEOS } from "@/lib/default-data"
import type { Character, Scene, VideoRecord } from "@/types"

// ─────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
function lsSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// ─────────────────────────────────────────────
// Characters
// ─────────────────────────────────────────────
export async function getCharacters(): Promise<Character[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("characters").select("*").order("created_at")
    if (!error && data && data.length > 0) {
      return data.map(rowToCharacter)
    }
    // First run: seed from defaults
    await seedCharacters()
    return EMBER_CHARACTERS
  }
  return lsGet<Character[]>("ember_characters", EMBER_CHARACTERS)
}

export async function saveCharacter(char: Character): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("characters").upsert(characterToRow(char))
    return
  }
  const all = lsGet<Character[]>("ember_characters", EMBER_CHARACTERS)
  const idx = all.findIndex((c) => c.id === char.id)
  const updated = idx >= 0 ? [...all.slice(0, idx), char, ...all.slice(idx + 1)] : [...all, char]
  lsSet("ember_characters", updated)
}

export async function saveAllCharacters(chars: Character[]): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("characters").upsert(chars.map(characterToRow))
    return
  }
  lsSet("ember_characters", chars)
}

async function seedCharacters() {
  if (!supabase) return
  await supabase.from("characters").upsert(EMBER_CHARACTERS.map(characterToRow))
}

function characterToRow(c: Character) {
  return {
    id: c.id,
    name: c.name,
    age: c.age,
    role: c.role,
    appearance: c.appearance,
    personality: c.personality,
    voice_style: c.voiceStyle,
    voice: c.voice ?? null,
    image_url: c.imageUrl ?? null,
    reference_images: c.referenceImages ?? [],
    manuscript_source: c.manuscriptSource,
    created_at: c.createdAt,
  }
}

function rowToCharacter(row: Record<string, unknown>): Character {
  return {
    id: row.id as string,
    name: row.name as string,
    age: row.age as string,
    role: row.role as string,
    appearance: row.appearance as Character["appearance"],
    personality: row.personality as string[],
    voiceStyle: row.voice_style as string,
    voice: row.voice as Character["voice"],
    imageUrl: row.image_url as string | undefined,
    referenceImages: row.reference_images as string[] | undefined,
    manuscriptSource: row.manuscript_source as string,
    createdAt: row.created_at as string,
  }
}

// ─────────────────────────────────────────────
// Scenes
// ─────────────────────────────────────────────
export async function getScenes(): Promise<Scene[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("scenes").select("*").order("created_at")
    if (!error && data && data.length > 0) {
      return data.map(rowToScene)
    }
    await seedScenes()
    return EMBER_SCENES
  }
  return lsGet<Scene[]>("ember_scenes", EMBER_SCENES)
}

export async function saveScene(scene: Scene): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("scenes").upsert(sceneToRow(scene))
    return
  }
  const all = lsGet<Scene[]>("ember_scenes", EMBER_SCENES)
  const idx = all.findIndex((s) => s.id === scene.id)
  const updated = idx >= 0 ? [...all.slice(0, idx), scene, ...all.slice(idx + 1)] : [...all, scene]
  lsSet("ember_scenes", updated)
}

async function seedScenes() {
  if (!supabase) return
  await supabase.from("scenes").upsert(EMBER_SCENES.map(sceneToRow))
}

function sceneToRow(s: Scene) {
  return {
    id: s.id,
    title: s.title,
    chapter: s.chapter,
    start_line: s.startLine,
    end_line: s.endLine,
    text: s.text,
    summary: s.summary,
    action_level: s.actionLevel,
    emotional_tone: s.emotionalTone,
    location: s.location,
    characters: s.characters,
    shot_breakdown: s.shotBreakdown ?? null,
    created_at: new Date().toISOString(),
  }
}

function rowToScene(row: Record<string, unknown>): Scene {
  return {
    id: row.id as string,
    title: row.title as string,
    chapter: row.chapter as string,
    startLine: row.start_line as number,
    endLine: row.end_line as number,
    text: row.text as string,
    summary: row.summary as string,
    actionLevel: row.action_level as Scene["actionLevel"],
    emotionalTone: row.emotional_tone as string,
    location: row.location as string,
    characters: row.characters as string[],
    shotBreakdown: row.shot_breakdown as Scene["shotBreakdown"],
  }
}

// ─────────────────────────────────────────────
// Videos
// ─────────────────────────────────────────────
export async function getVideos(): Promise<VideoRecord[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("videos").select("*").order("generated_at", { ascending: false })
    if (!error && data && data.length > 0) {
      return data.map(rowToVideo)
    }
    await seedVideos()
    return DEFAULT_VIDEOS
  }
  return lsGet<VideoRecord[]>("ember_videos", DEFAULT_VIDEOS)
}

export async function addVideo(video: VideoRecord): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("videos").upsert(videoToRow(video))
    return
  }
  const all = lsGet<VideoRecord[]>("ember_videos", DEFAULT_VIDEOS)
  lsSet("ember_videos", [video, ...all.filter((v) => v.id !== video.id)])
}

async function seedVideos() {
  if (!supabase) return
  await supabase.from("videos").upsert(DEFAULT_VIDEOS.map(videoToRow))
}

function videoToRow(v: VideoRecord) {
  return {
    id: v.id,
    title: v.title,
    subtitle: v.subtitle,
    video_url: v.videoUrl,
    thumbnail_url: v.thumbnailUrl,
    duration: v.duration,
    shots: v.shots,
    scene: v.scene,
    style: v.style,
    characters: v.characters,
    reference_images: v.referenceImages,
    generated_at: v.generatedAt,
    facebook_ready: v.facebookReady,
    tags: v.tags,
    has_voice: v.hasVoice ?? false,
  }
}

function rowToVideo(row: Record<string, unknown>): VideoRecord {
  return {
    id: row.id as string,
    title: row.title as string,
    subtitle: row.subtitle as string,
    videoUrl: row.video_url as string,
    thumbnailUrl: row.thumbnail_url as string,
    duration: row.duration as string,
    shots: row.shots as number,
    scene: row.scene as string,
    style: row.style as string,
    characters: row.characters as string[],
    referenceImages: row.reference_images as VideoRecord["referenceImages"],
    generatedAt: row.generated_at as string,
    facebookReady: row.facebook_ready as boolean,
    tags: row.tags as string[],
    hasVoice: row.has_voice as boolean,
  }
}

// ─────────────────────────────────────────────
// Export / Import
// ─────────────────────────────────────────────
export async function exportAllData() {
  const [characters, scenes, videos] = await Promise.all([getCharacters(), getScenes(), getVideos()])
  const blob = new Blob(
    [JSON.stringify({ characters, scenes, videos, exportedAt: new Date().toISOString() }, null, 2)],
    { type: "application/json" }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `ember-studio-${new Date().toISOString().split("T")[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importAllData(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json)
    if (data.characters) await saveAllCharacters(data.characters)
    if (data.scenes) for (const s of data.scenes) await saveScene(s)
    if (data.videos) for (const v of data.videos) await addVideo(v)
    return true
  } catch {
    return false
  }
}
