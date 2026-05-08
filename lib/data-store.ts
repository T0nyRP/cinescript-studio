/**
 * Dual-mode data store.
 *
 * STORAGE STRATEGY:
 * - localStorage is ALWAYS written first (instant, never fails silently)
 * - Supabase is synced in the background when configured
 * - Reads prefer Supabase when available, fall back to localStorage
 *
 * This prevents the silent-data-loss bug where a Supabase upsert error
 * (e.g. wrong schema, RLS block) would cause new data to disappear.
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
  try {
    localStorage.setItem(key, JSON.stringify(value))
    // Notify all hooks in this tab that the store changed
    window.dispatchEvent(new CustomEvent("ember-store-updated", { detail: { key } }))
  } catch (e) {
    console.error("localStorage write failed:", e)
  }
}

// ─────────────────────────────────────────────
// Characters
// ─────────────────────────────────────────────
export async function getCharacters(): Promise<Character[]> {
  // Try Supabase first if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("characters").select("*").order("created_at")
      if (!error && data && data.length > 0) {
        const chars = data.map(rowToCharacter)
        // Keep localStorage in sync with Supabase
        lsSet("ember_characters", chars)
        return chars
      }
      if (error) console.warn("Supabase getCharacters error:", error.message)
    } catch (e) {
      console.warn("Supabase getCharacters exception:", e)
    }
  }
  // Always fall back to localStorage
  return lsGet<Character[]>("ember_characters", EMBER_CHARACTERS)
}

export async function saveCharacter(char: Character): Promise<void> {
  // 1. ALWAYS write to localStorage first — this is instant and reliable
  const all = lsGet<Character[]>("ember_characters", EMBER_CHARACTERS)
  const idx = all.findIndex((c) => c.id === char.id)
  const updated = idx >= 0 ? [...all.slice(0, idx), char, ...all.slice(idx + 1)] : [...all, char]
  lsSet("ember_characters", updated)

  // 2. Background-sync to Supabase (non-blocking, errors logged not thrown)
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("characters").upsert(characterToRow(char))
      if (error) console.warn("Supabase saveCharacter error (data saved to localStorage):", error.message)
    } catch (e) {
      console.warn("Supabase saveCharacter exception:", e)
    }
  }
}

export async function saveAllCharacters(chars: Character[]): Promise<void> {
  // 1. Write to localStorage
  lsSet("ember_characters", chars)

  // 2. Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("characters").upsert(chars.map(characterToRow))
      if (error) console.warn("Supabase saveAllCharacters error:", error.message)
    } catch (e) {
      console.warn("Supabase saveAllCharacters exception:", e)
    }
  }
}

async function seedCharacters() {
  if (!supabase) return
  try {
    await supabase.from("characters").upsert(EMBER_CHARACTERS.map(characterToRow))
  } catch (e) {
    console.warn("Supabase seedCharacters failed:", e)
  }
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
    try {
      const { data, error } = await supabase.from("scenes").select("*").order("created_at")
      if (!error && data && data.length > 0) {
        const scenes = data.map(rowToScene)
        lsSet("ember_scenes", scenes)
        return scenes
      }
      if (error) console.warn("Supabase getScenes error:", error.message)
    } catch (e) {
      console.warn("Supabase getScenes exception:", e)
    }
  }
  return lsGet<Scene[]>("ember_scenes", EMBER_SCENES)
}

export async function saveScene(scene: Scene): Promise<void> {
  // 1. ALWAYS write to localStorage first
  const all = lsGet<Scene[]>("ember_scenes", EMBER_SCENES)
  const idx = all.findIndex((s) => s.id === scene.id)
  const updated = idx >= 0 ? [...all.slice(0, idx), scene, ...all.slice(idx + 1)] : [...all, scene]
  lsSet("ember_scenes", updated)

  // 2. Background-sync to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("scenes").upsert(sceneToRow(scene))
      if (error) console.warn("Supabase saveScene error (saved to localStorage):", error.message)
    } catch (e) {
      console.warn("Supabase saveScene exception:", e)
    }
  }
}

async function seedScenes() {
  if (!supabase) return
  try {
    await supabase.from("scenes").upsert(EMBER_SCENES.map(sceneToRow))
  } catch (e) {
    console.warn("Supabase seedScenes failed:", e)
  }
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
    try {
      const { data, error } = await supabase.from("videos").select("*").order("generated_at", { ascending: false })
      if (!error && data && data.length > 0) {
        const videos = data.map(rowToVideo)
        lsSet("ember_videos", videos)
        return videos
      }
      if (error) console.warn("Supabase getVideos error:", error.message)
    } catch (e) {
      console.warn("Supabase getVideos exception:", e)
    }
  }
  return lsGet<VideoRecord[]>("ember_videos", DEFAULT_VIDEOS)
}

export async function addVideo(video: VideoRecord): Promise<void> {
  // 1. Write to localStorage
  const all = lsGet<VideoRecord[]>("ember_videos", DEFAULT_VIDEOS)
  lsSet("ember_videos", [video, ...all.filter((v) => v.id !== video.id)])

  // 2. Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("videos").upsert(videoToRow(video))
      if (error) console.warn("Supabase addVideo error:", error.message)
    } catch (e) {
      console.warn("Supabase addVideo exception:", e)
    }
  }
}

function videoToRow(v: VideoRecord) {
  return {
    id: v.id, title: v.title, subtitle: v.subtitle,
    video_url: v.videoUrl, thumbnail_url: v.thumbnailUrl,
    duration: v.duration, shots: v.shots, scene: v.scene,
    style: v.style, characters: v.characters,
    reference_images: v.referenceImages, generated_at: v.generatedAt,
    facebook_ready: v.facebookReady, tags: v.tags, has_voice: v.hasVoice ?? false,
  }
}

function rowToVideo(row: Record<string, unknown>): VideoRecord {
  return {
    id: row.id as string, title: row.title as string, subtitle: row.subtitle as string,
    videoUrl: row.video_url as string, thumbnailUrl: row.thumbnail_url as string,
    duration: row.duration as string, shots: row.shots as number, scene: row.scene as string,
    style: row.style as string, characters: row.characters as string[],
    referenceImages: row.reference_images as VideoRecord["referenceImages"],
    generatedAt: row.generated_at as string, facebookReady: row.facebook_ready as boolean,
    tags: row.tags as string[], hasVoice: row.has_voice as boolean,
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
  a.href = url; a.download = `ember-studio-${new Date().toISOString().split("T")[0]}.json`
  a.click(); URL.revokeObjectURL(url)
}

export async function importAllData(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json)
    if (data.characters) await saveAllCharacters(data.characters)
    if (data.scenes) for (const s of data.scenes) await saveScene(s)
    if (data.videos) for (const v of data.videos) await addVideo(v)
    return true
  } catch { return false }
}

// ─────────────────────────────────────────────
// Manuscripts (localStorage only — content too large for Supabase free tier)
// ─────────────────────────────────────────────
import type { Manuscript } from "@/types"
import { EMBER_MANUSCRIPT } from "@/lib/default-data"

export function getManuscripts(): Manuscript[] {
  const saved = lsGet<Manuscript[]>("ember_manuscripts", [])
  const hasEmber = saved.some((m) => m.id === EMBER_MANUSCRIPT.id)
  return hasEmber ? saved : [EMBER_MANUSCRIPT, ...saved]
}

export function saveManuscript(manuscript: Manuscript): void {
  const all = lsGet<Manuscript[]>("ember_manuscripts", [])
  const idx = all.findIndex((m) => m.id === manuscript.id)
  const updated = idx >= 0 ? [...all.slice(0, idx), manuscript, ...all.slice(idx + 1)] : [...all, manuscript]
  lsSet("ember_manuscripts", updated)
}

export function deleteManuscript(id: string): void {
  if (id === EMBER_MANUSCRIPT.id) return
  const all = lsGet<Manuscript[]>("ember_manuscripts", [])
  lsSet("ember_manuscripts", all.filter((m) => m.id !== id))
}
