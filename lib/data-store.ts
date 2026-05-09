/**
 * Dual-mode data store.
 *
 * STORAGE STRATEGY:
 * - localStorage is ALWAYS written first (instant, never fails silently)
 * - Supabase is synced in the background when configured
 * - Reads MERGE localStorage + Supabase (union by ID, Supabase wins for conflicts)
 *
 * This prevents the data-loss bug where getX() would overwrite localStorage
 * with stale Supabase data, nuking any newly-extracted characters/scenes that
 * hadn't yet been synced to Supabase.
 */

import { supabase, checkSupabaseHealth, isSupabaseReady, markSupabaseUnhealthy } from "@/lib/supabase"
import { EMBER_CHARACTERS, EMBER_SCENES, DEFAULT_VIDEOS } from "@/lib/default-data"
import type { Character, Scene, VideoRecord } from "@/types"

// ─────────────────────────────────────────────
// Per-session back-fill lock
// ─────────────────────────────────────────────
// Tracks IDs that have been attempted for back-fill this session so we
// never retry a failing upsert on every page load — one attempt per session.
const _backfillAttempted = {
  characters: new Set<string>(),
  scenes: new Set<string>(),
}

// Once we see a schema error (400) we disable writes for the rest of the session
// so we don't spam the console, and log the SQL fix exactly once.
let _schemaErrorLogged = false

function handleSchemaError(table: string, error: { code?: string; message?: string }) {
  const msg = error.message ?? ""
  const isSchema =
    msg.toLowerCase().includes("column") ||
    msg.toLowerCase().includes("schema") ||
    msg.toLowerCase().includes("does not exist") ||
    error.code === "42703" // PostgreSQL: undefined_column
  if (isSchema && !_schemaErrorLogged) {
    _schemaErrorLogged = true
    console.error(
      `[CineScript] Supabase schema mismatch on table "${table}" — run the following SQL in your Supabase SQL editor:\n\n` +
      `  ALTER TABLE characters ADD COLUMN IF NOT EXISTS manuscript_source TEXT;\n` +
      `  ALTER TABLE scenes    ADD COLUMN IF NOT EXISTS manuscript_source TEXT;\n\n` +
      `  Or drop and recreate the tables using the schema in lib/supabase.ts.\n` +
      `  Your data is safe in localStorage.`
    )
    return true
  }
  return false
}

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
// Merge helper — union by ID, remote wins for conflicts
// ─────────────────────────────────────────────
function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>()
  // Local first (establishes order and captures local-only items)
  local.forEach((item) => map.set(item.id, item))
  // Remote overwrites matching IDs (Supabase is source of truth for existing records)
  remote.forEach((item) => map.set(item.id, item))
  return Array.from(map.values())
}

// ─────────────────────────────────────────────
// Characters
// ─────────────────────────────────────────────
export async function getCharacters(): Promise<Character[]> {
  // Always read localStorage first — it has the freshest local writes
  const localChars = lsGet<Character[]>("ember_characters", EMBER_CHARACTERS)

  if ((await checkSupabaseHealth()) && supabase) {
    try {
      const { data, error } = await supabase.from("characters").select("*").order("created_at")
      if (!error && data) {
        const remoteChars = data.map(rowToCharacter)
        // Merge: union by ID. Remote wins for existing IDs, local-only items preserved.
        const merged = mergeById(localChars, remoteChars)
        lsSet("ember_characters", merged)

        // Back-fill Supabase with any local-only characters it's missing
        // — skip IDs already attempted this session to avoid retry loops
        const remoteIds = new Set(remoteChars.map((c) => c.id))
        const localOnly = localChars.filter(
          (c) => !remoteIds.has(c.id) && !_backfillAttempted.characters.has(c.id)
        )
        if (localOnly.length > 0) {
          localOnly.forEach((c) => _backfillAttempted.characters.add(c.id))
          supabase
            .from("characters")
            .upsert(localOnly.map(characterToRow))
            .then(({ error: e }) => {
              if (e) {
                if (!handleSchemaError("characters", e)) {
                  console.warn("Supabase back-fill characters error:", e.message)
                }
              } else {
                console.log(`Back-filled ${localOnly.length} local-only characters to Supabase`)
              }
            })
        }

        return merged
      }
      if (error) { markSupabaseUnhealthy(`getCharacters failed: ${error.message}`); }
    } catch (e) {
      markSupabaseUnhealthy(`getCharacters exception: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return localChars
}

export async function saveCharacter(char: Character): Promise<void> {
  // 1. ALWAYS write to localStorage first — this is instant and reliable
  const all = lsGet<Character[]>("ember_characters", EMBER_CHARACTERS)
  const idx = all.findIndex((c) => c.id === char.id)
  const updated = idx >= 0 ? [...all.slice(0, idx), char, ...all.slice(idx + 1)] : [...all, char]
  lsSet("ember_characters", updated)

  // 2. Background-sync to Supabase (non-blocking, errors logged not thrown)
  if (isSupabaseReady() && supabase && !_schemaErrorLogged) {
    try {
      const { error } = await supabase.from("characters").upsert(characterToRow(char))
      if (error) {
        if (!handleSchemaError("characters", error)) {
          console.warn("Supabase saveCharacter error (data saved to localStorage):", error.message)
        }
      }
    } catch (e) {
      console.warn("Supabase saveCharacter exception:", e)
    }
  }
}

export async function saveAllCharacters(chars: Character[]): Promise<void> {
  // 1. Write to localStorage
  lsSet("ember_characters", chars)

  // 2. Sync to Supabase
  if (isSupabaseReady() && supabase && !_schemaErrorLogged) {
    try {
      const { error } = await supabase.from("characters").upsert(chars.map(characterToRow))
      if (error) {
        if (!handleSchemaError("characters", error)) {
          console.warn("Supabase saveAllCharacters error:", error.message)
        }
      }
    } catch (e) {
      console.warn("Supabase saveAllCharacters exception:", e)
    }
  }
}

export async function deleteCharacter(id: string): Promise<void> {
  const all = lsGet<Character[]>("ember_characters", EMBER_CHARACTERS)
  const updated = all.filter((c) => c.id !== id)
  lsSet("ember_characters", updated)

  if (isSupabaseReady() && supabase) {
    try {
      const { error } = await supabase.from("characters").delete().eq("id", id)
      if (error) console.warn("Supabase deleteCharacter error:", error.message)
    } catch (e) {
      console.warn("Supabase deleteCharacter exception:", e)
    }
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
  // Always read localStorage first
  const localScenes = lsGet<Scene[]>("ember_scenes", EMBER_SCENES)

  if ((await checkSupabaseHealth()) && supabase) {
    try {
      const { data, error } = await supabase.from("scenes").select("*").order("created_at")
      if (!error && data) {
        const remoteScenes = data.map(rowToScene)
        // Merge: union by ID. Remote wins for existing IDs, local-only items preserved.
        const merged = mergeById(localScenes, remoteScenes)
        lsSet("ember_scenes", merged)

        // Back-fill Supabase with any local-only scenes it's missing
        // — skip IDs already attempted this session to avoid retry loops on schema errors
        const remoteIds = new Set(remoteScenes.map((s) => s.id))
        const localOnly = localScenes.filter(
          (s) => !remoteIds.has(s.id) && !_backfillAttempted.scenes.has(s.id)
        )
        if (localOnly.length > 0) {
          localOnly.forEach((s) => _backfillAttempted.scenes.add(s.id))
          supabase
            .from("scenes")
            .upsert(localOnly.map(sceneToRow))
            .then(({ error: e }) => {
              if (e) {
                if (!handleSchemaError("scenes", e)) {
                  console.warn("Supabase back-fill scenes error:", e.message)
                }
              } else {
                console.log(`Back-filled ${localOnly.length} local-only scenes to Supabase`)
              }
            })
        }

        return merged
      }
      if (error) { markSupabaseUnhealthy(`getScenes failed: ${error.message}`); }
    } catch (e) {
      markSupabaseUnhealthy(`getScenes exception: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return localScenes
}

export async function saveScene(scene: Scene): Promise<void> {
  // 1. ALWAYS write to localStorage first
  const all = lsGet<Scene[]>("ember_scenes", EMBER_SCENES)
  const idx = all.findIndex((s) => s.id === scene.id)
  const updated = idx >= 0 ? [...all.slice(0, idx), scene, ...all.slice(idx + 1)] : [...all, scene]
  lsSet("ember_scenes", updated)

  // 2. Background-sync to Supabase
  if (isSupabaseReady() && supabase && !_schemaErrorLogged) {
    try {
      const { error } = await supabase.from("scenes").upsert(sceneToRow(scene))
      if (error) {
        if (!handleSchemaError("scenes", error)) {
          console.warn("Supabase saveScene error (saved to localStorage):", error.message)
        }
      }
    } catch (e) {
      console.warn("Supabase saveScene exception:", e)
    }
  }
}

/**
 * After a character merge, rewrite all scene.characters arrays so the
 * deleted IDs are replaced with the surviving primary ID.
 */
export async function replaceCharacterIdsInScenes(
  oldIds: string[],
  newId: string
): Promise<void> {
  const oldSet = new Set(oldIds)
  const all = lsGet<Scene[]>("ember_scenes", EMBER_SCENES)

  let changed = false
  const updated = all.map((scene) => {
    const original = scene.characters
    const replaced = Array.from(
      new Set(original.map((id) => (oldSet.has(id) ? newId : id)))
    )
    const didChange =
      replaced.length !== original.length ||
      replaced.some((id, i) => id !== original[i])
    if (didChange) changed = true
    return didChange ? { ...scene, characters: replaced } : scene
  })

  if (!changed) return

  lsSet("ember_scenes", updated)

  if (isSupabaseReady() && supabase && !_schemaErrorLogged) {
    const dirty = updated.filter((scene) => {
      const orig = all.find((s) => s.id === scene.id)
      return orig && orig.characters !== scene.characters
    })
    for (const scene of dirty) {
      supabase
        .from("scenes")
        .upsert(sceneToRow(scene))
        .then(({ error: e }) => {
          if (e) {
            if (!handleSchemaError("scenes", e)) {
              console.warn("Supabase replaceCharacterIds error:", e.message)
            }
          }
        })
    }
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
    manuscript_source: s.manuscriptSource ?? null,
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
    manuscriptSource: row.manuscript_source as string | undefined,
  }
}

// ─────────────────────────────────────────────
// Videos
// ─────────────────────────────────────────────
export async function getVideos(): Promise<VideoRecord[]> {
  const localVideos = lsGet<VideoRecord[]>("ember_videos", DEFAULT_VIDEOS)

  if ((await checkSupabaseHealth()) && supabase) {
    try {
      const { data, error } = await supabase.from("videos").select("*").order("generated_at", { ascending: false })
      if (!error && data) {
        const remoteVideos = data.map(rowToVideo)
        const merged = mergeById(localVideos, remoteVideos)
        lsSet("ember_videos", merged)
        return merged
      }
      if (error) { markSupabaseUnhealthy(`getVideos failed: ${error.message}`); }
    } catch (e) {
      markSupabaseUnhealthy(`getVideos exception: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return localVideos
}

export async function addVideo(video: VideoRecord): Promise<void> {
  // 1. Write to localStorage
  const all = lsGet<VideoRecord[]>("ember_videos", DEFAULT_VIDEOS)
  lsSet("ember_videos", [video, ...all.filter((v) => v.id !== video.id)])

  // 2. Sync to Supabase
  if (isSupabaseReady() && supabase) {
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
