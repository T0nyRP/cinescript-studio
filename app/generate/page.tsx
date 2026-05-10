"use client"

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Zap, ChevronDown, ChevronUp, Volume2, MessageSquare, AlertCircle,
  Film, Loader2, Play, Image as ImageIcon, Save, Check, X, RefreshCw,
  Clapperboard,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useCharacters, useScenes, useVideos } from "@/hooks/use-data-store"
import { cn } from "@/lib/utils"
import type { Shot, ShotDialogue, Scene, VideoRecord, Character } from "@/types"

// ─── Style Definitions ────────────────────────────────────────────────────────

const STYLES = [
  { id: "cinematic", label: "Cinematic", color: "orange", desc: "4K filmic, shallow DOF, dramatic lighting" },
  { id: "gritty", label: "Gritty", color: "red", desc: "Raw, handheld, desaturated realism" },
  { id: "epic", label: "Epic", color: "blue", desc: "Grand scale, sweeping score, IMAX wide" },
  { id: "noir", label: "Neo-Noir", color: "purple", desc: "Deep shadows, neon accents, rain-slicked streets" },
  { id: "realistic", label: "Hyper-Real", color: "green", desc: "Documentary realism, natural light" },
  { id: "comic-book", label: "Comic Book", color: "yellow", desc: "Bold outlines, graphic panel transitions" },
]

// ─── Dialogue Components ──────────────────────────────────────────────────────

function DialogueLine({ line, onUpdate, onRemove }: { line: ShotDialogue; onUpdate: (l: ShotDialogue) => void; onRemove: () => void }) {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-shrink-0 w-24">
        <div className="text-xs text-white/60 font-medium truncate">{line.characterName}</div>
        <select
          value={line.type}
          onChange={(e) => onUpdate({ ...line, type: e.target.value as ShotDialogue["type"] })}
          className="text-xs bg-white/5 border-0 text-white/40 rounded w-full mt-0.5 outline-none"
        >
          <option value="spoken">spoken</option>
          <option value="internal">internal</option>
          <option value="narration">narration</option>
        </select>
      </div>
      <Textarea
        value={line.line}
        onChange={(e) => onUpdate({ ...line, line: e.target.value })}
        placeholder={`${line.characterName}'s line…`}
        className="flex-1 bg-white/5 border-white/10 text-white text-xs resize-none min-h-0 h-14 py-2"
      />
      <button onClick={onRemove} className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 mt-1">×</button>
    </div>
  )
}

function ShotCard({ shot, sceneCharacters, onUpdateDialogue }: { shot: Shot; sceneCharacters: string[]; onUpdateDialogue: (dialogue: ShotDialogue[]) => void }) {
  const [expanded, setExpanded] = useState(false)
  const dialogue = shot.dialogue ?? []

  const addLine = (charId: string, charName: string) => {
    onUpdateDialogue([...dialogue, { characterId: charId, characterName: charName, line: "", type: "spoken" }])
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-white/60">{shot.order}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/70 leading-relaxed line-clamp-2">{shot.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/30">{shot.type} · {shot.duration}s</span>
            {dialogue.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <MessageSquare className="w-2.5 h-2.5" />{dialogue.length} line{dialogue.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white/60">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-2">
          {dialogue.map((line, i) => (
            <DialogueLine key={i} line={line} onUpdate={(l) => { const d = [...dialogue]; d[i] = l; onUpdateDialogue(d) }} onRemove={() => onUpdateDialogue(dialogue.filter((_, j) => j !== i))} />
          ))}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sceneCharacters.map((cId) => {
              const cName = cId.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
              return (
                <button key={cId} onClick={() => addLine(cId, cName)} className="text-xs bg-white/5 border border-white/10 hover:border-orange-500/30 hover:text-orange-400 text-white/50 px-2 py-0.5 rounded-full transition-colors">
                  + {cName}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Generation Types ─────────────────────────────────────────────────────────

type Phase = "pending" | "loading" | "polling" | "done" | "error"

interface ShotGenState {
  shotId: string
  order: number
  description: string
  imagePhase: Phase
  imageUrl?: string
  imageRequestId?: string   // runId while polling for image
  imageError?: string
  videoPhase: Phase
  videoUrl?: string
  videoRequestId?: string
  videoModel?: string
  videoError?: string
  audioUrl?: string         // TTS audio for this shot's dialogue
}

type PipelinePhase = "idle" | "running" | "done" | "partial"

// ─── Shot Progress Card ───────────────────────────────────────────────────────

function ShotProgressCard({ state, onRetry }: { state: ShotGenState; onRetry: () => void }) {
  const imageOk = state.imagePhase === "done"
  const videoOk = state.videoPhase === "done"
  const hasError = state.imagePhase === "error" || state.videoPhase === "error"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white/3 border rounded-xl overflow-hidden",
        hasError ? "border-red-500/30" : videoOk ? "border-green-500/20" : "border-white/8"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <div className="w-6 h-6 rounded-md bg-white/8 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white/50">{state.order}</span>
        </div>
        <p className="flex-1 text-xs text-white/60 line-clamp-1">{state.description}</p>
        {state.audioUrl && <Volume2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
        {videoOk && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
        {hasError && (
          <button onClick={onRetry} className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300">
            <RefreshCw className="w-3 h-3" />Retry
          </button>
        )}
      </div>

      <div className="flex gap-3 p-3">
        {/* Image cell */}
        <div className="flex-1">
          <p className="text-xs text-white/30 mb-2 flex items-center gap-1">
            <ImageIcon className="w-2.5 h-2.5" />Still
          </p>
          <div className="w-full aspect-video rounded-lg bg-white/5 overflow-hidden flex items-center justify-center relative">
            {state.imagePhase === "pending" && <div className="text-white/15 text-xs">waiting…</div>}
            {(state.imagePhase === "loading" || state.imagePhase === "polling") && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                <p className="text-xs text-white/30">{state.imagePhase === "loading" ? "Submitting…" : "Generating…"}</p>
              </div>
            )}
            {state.imagePhase === "error" && (
              <div className="flex flex-col items-center gap-1 p-2 text-center">
                <X className="w-4 h-4 text-red-400" />
                <p className="text-xs text-red-400/80 line-clamp-2">{state.imageError}</p>
              </div>
            )}
            {imageOk && state.imageUrl && (
              <img src={state.imageUrl} alt="Shot still" className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* Video cell */}
        <div className="flex-1">
          <p className="text-xs text-white/30 mb-2 flex items-center gap-1">
            <Film className="w-2.5 h-2.5" />Video clip
          </p>
          <div className="w-full aspect-video rounded-lg bg-white/5 overflow-hidden flex items-center justify-center relative">
            {(state.videoPhase === "pending" || !imageOk) && <div className="text-white/15 text-xs">waiting…</div>}
            {(state.videoPhase === "loading" || state.videoPhase === "polling") && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                <p className="text-xs text-white/30">{state.videoPhase === "loading" ? "Submitting…" : "Generating…"}</p>
              </div>
            )}
            {state.videoPhase === "error" && (
              <div className="flex flex-col items-center gap-1 p-2 text-center">
                <X className="w-4 h-4 text-red-400" />
                <p className="text-xs text-red-400/80 line-clamp-2">{state.videoError}</p>
              </div>
            )}
            {videoOk && state.videoUrl && (
              <video
                src={state.videoUrl}
                className="w-full h-full object-cover"
                controls
                muted
                loop
                playsInline
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function GeneratePageInner() {
  const searchParams = useSearchParams()
  const { characters } = useCharacters()
  const { scenes, loading, updateScene } = useScenes()
  const { addVideo } = useVideos()

  const [selectedSceneId, setSelectedSceneId] = useState<string>("")
  const [selectedStyle, setSelectedStyle] = useState("cinematic")
  const [activeTab, setActiveTab] = useState("setup")

  // Generation state
  const [pipeline, setPipeline] = useState<PipelinePhase>("idle")
  const [shotStates, setShotStates] = useState<ShotGenState[]>([])
  const [saved, setSaved] = useState(false)
  const pollingRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const abortRef = useRef(false)

  // Set scene from URL param
  useEffect(() => {
    if (!loading && scenes.length > 0) {
      const paramScene = searchParams.get("scene")
      if (paramScene && scenes.find((s) => s.id === paramScene)) {
        setSelectedSceneId(paramScene)
      } else if (!selectedSceneId) {
        setSelectedSceneId(scenes[0].id)
      }
    }
  }, [loading, scenes, searchParams, selectedSceneId])

  const scene = scenes.find((s) => s.id === selectedSceneId) ?? scenes[0]
  const sceneCharacters = characters.filter((c) => scene?.characters?.includes(c.id))
  const unassignedVoices = sceneCharacters.filter((c) => !c.voice?.id)

  const updateShotDialogue = (shotId: string, dialogue: ShotDialogue[]) => {
    if (!scene) return
    const updated: Scene = {
      ...scene,
      shotBreakdown: (scene.shotBreakdown ?? []).map((s) => s.id === shotId ? { ...s, dialogue } : s),
    }
    updateScene(updated)
  }

  // ── Update a single shot's generation state ──
  const updateShot = useCallback((shotId: string, patch: Partial<ShotGenState>) => {
    setShotStates((prev) => prev.map((s) => s.shotId === shotId ? { ...s, ...patch } : s))
  }, [])

  // ── Poll Galaxy AI for image status ──
  const pollImage = useCallback(
    (shotId: string, requestId: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const deadline = Date.now() + 6 * 60 * 1000 // 6-minute max
        let attempts = 0
        const attempt = async () => {
          if (abortRef.current) { reject(new Error("Aborted")); return }
          if (Date.now() > deadline) {
            reject(new Error("Image generation timed out after 6 minutes. Try retrying this shot."))
            return
          }
          attempts++
          try {
            const res = await fetch("/api/poll-galaxy-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requestId, type: "image" }),
            })
            if (!res.ok) {
              pollingRef.current[`img_${shotId}`] = setTimeout(attempt, 10000)
              return
            }
            const data = await res.json() as { status: string; imageUrl?: string; error?: string }

            if (data.status === "completed" && data.imageUrl) {
              resolve(data.imageUrl)
            } else if (data.status === "failed" || data.status === "error") {
              reject(new Error(data.error ?? "Image generation failed"))
            } else {
              const delay = attempts <= 3 ? 5000 : 8000
              pollingRef.current[`img_${shotId}`] = setTimeout(attempt, delay)
            }
          } catch {
            pollingRef.current[`img_${shotId}`] = setTimeout(attempt, 10000)
          }
        }
        attempt()
      })
    },
    []
  )

  // ── Poll Galaxy AI for video status — returns URL on success or null on failure ──
  const pollVideo = useCallback(
    (shotId: string, requestId: string, model: string): Promise<string | null> => {
      return new Promise((resolve) => {
        const deadline = Date.now() + 10 * 60 * 1000 // 10-minute max for video
        const attempt = async () => {
          if (abortRef.current) { resolve(null); return }
          if (Date.now() > deadline) {
            updateShot(shotId, { videoPhase: "error", videoError: "Video generation timed out after 10 minutes. Try retrying this shot." })
            resolve(null)
            return
          }
          try {
            const res = await fetch("/api/poll-galaxy-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requestId, type: "video" }),
            })
            if (!res.ok) {
              pollingRef.current[shotId] = setTimeout(attempt, 10000)
              return
            }
            const data = await res.json() as { status: string; videoUrl?: string; error?: string }

            if (data.status === "completed") {
              updateShot(shotId, { videoPhase: "done", videoUrl: data.videoUrl })
              resolve(data.videoUrl ?? null)
            } else if (data.status === "failed" || data.status === "error") {
              updateShot(shotId, { videoPhase: "error", videoError: data.error ?? "Generation failed" })
              resolve(null)
            } else {
              pollingRef.current[shotId] = setTimeout(attempt, 8000)
            }
          } catch {
            pollingRef.current[shotId] = setTimeout(attempt, 10000)
          }
        }
        attempt()
      })
    },
    [updateShot]
  )

  // ── Poll for merge completion (called from handleSaveToVideos) ──
  const pollForMerge = useCallback(async (runId: string): Promise<string | null> => {
    const deadline = Date.now() + 8 * 60 * 1000  // 8-minute deadline — merging 8 clips takes time
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 6000))
      try {
        const res = await fetch("/api/poll-galaxy-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: runId, type: "merge" }),
        })
        if (!res.ok) continue
        const data = await res.json() as { status: string; videoUrl?: string; error?: string }
        if (data.status === "completed" && data.videoUrl) return data.videoUrl
        if (data.status === "failed" || data.status === "error") return null
        // processing — keep polling
      } catch {
        // network hiccup — keep polling
      }
    }
    return null
  }, [])

  // ── Generate TTS audio for a shot's dialogue (non-fatal if no voices set) ──
  const generateShotTTS = useCallback(async (shot: Shot, shotChars: Character[]) => {
    const spokenLines = (shot.dialogue ?? []).filter(
      (l) => (l.type === "spoken" || l.type === "narration") && l.line.trim()
    )
    if (!spokenLines.length) return

    // Find a character with a voice assigned — prefer the first speaker
    // Josh (ElevenLabs) — deep cinematic narrator, used when no character voice assigned
    const FALLBACK_NARRATOR_VOICE_ID = "TxGEqnHWrfWFTfGW9XjX"
    let voiceId: string = FALLBACK_NARRATOR_VOICE_ID
    let stability = 65          // 0-100 scale (matching VoiceProfile)
    let similarityBoost = 80    // 0-100 scale
    let styleExaggeration = 10  // 0-100 scale

    for (const line of spokenLines) {
      const char = shotChars.find(
        (c) => c.name === line.characterName || c.id === line.characterId
      )
      if (char?.voice?.id) {
        voiceId = char.voice.id
        stability = char.voice.stability ?? 65
        similarityBoost = char.voice.similarityBoost ?? 80
        styleExaggeration = char.voice.styleExaggeration ?? 10
        break
      }
    }

    // voiceId defaults to FALLBACK_NARRATOR_VOICE — always generates audio

    // Combine all spoken text for this shot into one TTS call
    const combinedText = spokenLines.map((l) => l.line).join(" … ")
    if (!combinedText.trim()) return

    try {
      const res = await fetch("/api/generate-dialogue-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: combinedText,
          voiceId,
          stability: stability / 100,      // normalize 0-100 → 0-1
          similarityBoost: similarityBoost / 100,
          styleExaggeration: styleExaggeration / 100,
        }),
      })
      const data = await res.json() as { audioUrl?: string; error?: string }
      if (data.audioUrl) {
        updateShot(shot.id, { audioUrl: data.audioUrl })
      }
    } catch {
      // TTS is non-fatal — video generation still proceeds without audio
    }
  }, [updateShot])

  // ── Generate a single shot ──
  const generateShot = useCallback(
    async (shot: Shot) => {
      if (abortRef.current) return

      // ── FIX: Only include characters explicitly listed for THIS shot ──
      // If shot.characters is empty, fall back to all scene characters.
      const shotCharNames = shot.characters ?? []
      const shotChars = sceneCharacters.filter((c) =>
        shotCharNames.length === 0 || shotCharNames.includes(c.name)
      )

      // Collect reference photos from the character library (character consistency)
      const referenceImageUrls = shotChars
        .flatMap((c) => [c.imageUrl, ...(c.referenceImages ?? [])])
        .filter((u): u is string => typeof u === "string" && u.startsWith("http"))
        .slice(0, 4)
      const characterNames = shotChars.map((c) => c.name)

      // ── Step 1: Submit image job (async — GPT Image 2 takes 60-90s) ──
      updateShot(shot.id, { imagePhase: "loading" })
      try {
        const imgRes = await fetch("/api/generate-shot-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: (shot as Shot & { prompt?: string }).prompt || shot.description,
            style: selectedStyle,
            characters: shotChars.map((c) => ({
              name: c.name,
              age: c.age,
              role: c.role,
              appearance: c.appearance,
              personality: c.personality,
            })),
          }),
        })
        const imgData = await imgRes.json() as { requestId?: string; model?: string; error?: string }
        if (!imgRes.ok || imgData.error) throw new Error(imgData.error || "Image submission failed")
        if (!imgData.requestId) throw new Error("No requestId from Galaxy AI")

        updateShot(shot.id, { imagePhase: "polling", imageRequestId: imgData.requestId })

        if (abortRef.current) return

        // ── Step 2: Poll until image is ready ──
        const imageUrl = await pollImage(shot.id, imgData.requestId)
        updateShot(shot.id, { imagePhase: "done", imageUrl, videoPhase: "loading" })

        if (abortRef.current) return

        // ── Step 3: Submit video job ──
        const vidRes = await fetch("/api/generate-shot-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            prompt: (shot as Shot & { prompt?: string }).prompt || shot.description,
            duration: shot.duration ?? 10,
            referenceImageUrls,
            characterNames,
          }),
        })
        const vidData = await vidRes.json() as { requestId?: string; model?: string; error?: string }
        if (!vidRes.ok || vidData.error) throw new Error(vidData.error || "Video submission failed")
        if (!vidData.requestId) throw new Error("No requestId from Galaxy AI")

        updateShot(shot.id, {
          videoPhase: "polling",
          videoRequestId: vidData.requestId,
          videoModel: vidData.model,
        })

        // ── Step 4: Poll until video done — get the URL back ──
        const videoUrl = await pollVideo(shot.id, vidData.requestId, vidData.model ?? "")

        // ── Step 5: Generate TTS for this shot's dialogue (non-fatal) ──
        if (videoUrl && shot.dialogue && shot.dialogue.length > 0) {
          await generateShotTTS(shot, shotChars)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setShotStates((prev) => prev.map((s) => {
          if (s.shotId !== shot.id) return s
          const imagePhase: Phase = s.imagePhase === "loading" || s.imagePhase === "polling" ? "error" : s.imagePhase
          const imageError = imagePhase === "error" && s.imagePhase !== "done" ? msg : s.imageError
          const videoPhase: Phase = s.videoPhase === "loading" || s.videoPhase === "polling" ? "error" : s.videoPhase
          const videoError = s.videoPhase === "loading" || s.videoPhase === "polling" ? msg : s.videoError
          return { ...s, imagePhase, imageError, videoPhase, videoError }
        }))
      }
    },
    [sceneCharacters, scene, selectedStyle, updateShot, pollImage, pollVideo, generateShotTTS]
  )

  // ── Start full pipeline ──
  const handleGenerate = useCallback(async () => {
    if (!scene?.shotBreakdown?.length) return
    abortRef.current = false
    setSaved(false)

    const initial: ShotGenState[] = scene.shotBreakdown.map((shot) => ({
      shotId: shot.id,
      order: shot.order,
      description: shot.description,
      imagePhase: "pending",
      videoPhase: "pending",
    }))
    setShotStates(initial)
    setPipeline("running")
    setActiveTab("generate")

    // Process shots sequentially (prevents rate-limiting)
    for (const shot of scene.shotBreakdown) {
      if (abortRef.current) break
      await generateShot(shot)
    }
  }, [scene, generateShot])

  // ── Retry a failed shot ──
  const handleRetry = useCallback(
    (shot: Shot) => {
      updateShot(shot.id, {
        imagePhase: "pending",
        imageUrl: undefined,
        imageRequestId: undefined,
        imageError: undefined,
        videoPhase: "pending",
        videoUrl: undefined,
        videoRequestId: undefined,
        videoError: undefined,
        audioUrl: undefined,
      })
      generateShot(shot)
    },
    [generateShot, updateShot]
  )

  // ── Stop generation ──
  const handleStop = () => {
    abortRef.current = true
    Object.values(pollingRef.current).forEach(clearTimeout)
    pollingRef.current = {}
    setPipeline("partial")
  }

  // ── Save to Videos (merge clips + collect audio) ──
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string>("Merging clips…")
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSaveToVideos = async () => {
    const completedClips = shotStates.filter((s) => s.videoPhase === "done" && s.videoUrl)
    if (!completedClips.length || !scene) return

    setSaving(true)
    setSaveError(null)

    const videoUrls = completedClips.map((s) => s.videoUrl!)
    const thumbnailUrl = completedClips[0].imageUrl ?? ""
    const styleName = STYLES.find((s) => s.id === selectedStyle)?.label ?? selectedStyle
    const totalSecs = completedClips.reduce((acc, s) => {
      const shot = scene.shotBreakdown?.find((sh) => sh.id === s.shotId)
      return acc + (shot?.duration ?? 10)
    }, 0)

    // ── Step A: Merge all video clips into one ──
    let finalVideoUrl = videoUrls[0]
    let mergeWarning: string | null = null

    if (videoUrls.length > 1) {
      setSaveStatus("Submitting merge job…")
      try {
        const mergeRes = await fetch("/api/merge-clips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrls }),
        })
        const mergeData = await mergeRes.json() as {
          runId?: string
          videoUrl?: string
          error?: string
        }

        if (mergeData.videoUrl) {
          // Single clip — already done
          finalVideoUrl = mergeData.videoUrl
        } else if (mergeData.runId) {
          // Async merge — poll until complete
          setSaveStatus("Merging clips… (this may take a few minutes)")
          const mergedUrl = await pollForMerge(mergeData.runId)
          if (mergedUrl) {
            finalVideoUrl = mergedUrl
          } else {
            mergeWarning = "Merge timed out — saved first clip only"
          }
        } else {
          mergeWarning = mergeData.error ?? "Merge failed — saved first clip"
        }
      } catch (err) {
        mergeWarning = `Merge error: ${err instanceof Error ? err.message : String(err)}`
      }
    }

    // ── Step B: Collect TTS audio URLs from shot states ──
    const audioUrls = completedClips
      .map((s) => s.audioUrl)
      .filter((u): u is string => Boolean(u))

    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    const durationLabel = mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`

    const record: VideoRecord = {
      id: `video-${Date.now()}`,
      title: scene.title,
      subtitle: mergeWarning
        ? `${styleName} · ${completedClips.length} clips (${mergeWarning})`
        : `${styleName} · ${completedClips.length} clips merged`,
      videoUrl: finalVideoUrl,
      thumbnailUrl,
      duration: durationLabel,
      shots: completedClips.length,
      scene: scene.title,
      style: styleName,
      characters: sceneCharacters.map((c) => c.name),
      referenceImages: sceneCharacters
        .filter((c) => c.imageUrl)
        .map((c) => ({ name: c.name, url: c.imageUrl! })),
      generatedAt: new Date().toISOString(),
      facebookReady: true,
      tags: ["cinescript", selectedStyle, scene.chapter ?? ""].filter(Boolean),
      hasVoice: audioUrls.length > 0,
      audioUrls: audioUrls.length > 0 ? audioUrls : undefined,
    }

    await addVideo(record)
    setSaving(false)
    setSaved(true)
  }

  // ── Derived stats ──
  const doneCount = shotStates.filter((s) => s.videoPhase === "done").length
  const totalShots = shotStates.length
  const progressPct = totalShots > 0 ? Math.round((doneCount / totalShots) * 100) : 0
  const allDone = totalShots > 0 && shotStates.every((s) => s.videoPhase === "done" || s.videoPhase === "error")

  useEffect(() => {
    if (pipeline === "running" && allDone) {
      const anyError = shotStates.some((s) => s.imagePhase === "error" || s.videoPhase === "error")
      setPipeline(anyError ? "partial" : "done")
    }
  }, [allDone, pipeline, shotStates])

  // ── Loading / empty states ──
  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/40">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading scenes…</p>
        </div>
      </div>
    )
  }

  if (!loading && scenes.length === 0) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-sm mb-3">No scenes found. Upload and analyze a manuscript first.</p>
          <a href="/" className="text-orange-400 text-sm underline">Go to Manuscripts →</a>
        </div>
      </div>
    )
  }

  if (!scene) return null

  // ── Render ──
  return (
    <div className="min-h-screen p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs mb-3">
          <Zap className="w-3 h-3 mr-1" />Generate Video
        </Badge>
        <h1 className="text-3xl font-bold text-white mb-2">Video Generation</h1>
        <p className="text-white/50 text-sm max-w-lg">Configure your scene and style, then generate video clips for each shot automatically.</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/8 p-1 rounded-xl">
          <TabsTrigger value="setup" className="text-xs rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">Setup</TabsTrigger>
          <TabsTrigger value="dialogue" className="text-xs rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Dialogue
            {(scene.shotBreakdown ?? []).reduce((n, s) => n + (s.dialogue?.length ?? 0), 0) > 0 && (
              <span className="ml-1.5 w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                {(scene.shotBreakdown ?? []).reduce((n, s) => n + (s.dialogue?.length ?? 0), 0)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="generate" className="text-xs rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Generate
            {pipeline === "done" && <Check className="ml-1.5 w-3 h-3 text-green-300" />}
            {pipeline === "running" && <Loader2 className="ml-1.5 w-3 h-3 animate-spin" />}
          </TabsTrigger>
        </TabsList>

        {/* ── SETUP TAB ── */}
        <TabsContent value="setup" className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Scene</h3>
            <div className="space-y-2">
              {scenes.map((s) => (
                <button key={s.id} onClick={() => setSelectedSceneId(s.id)} className={cn("w-full text-left p-4 rounded-xl border transition-all", selectedSceneId === s.id ? "bg-orange-500/10 border-orange-500/30" : "bg-white/3 border-white/8 hover:border-white/15")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{s.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{s.chapter}</p>
                    </div>
                    <Badge className={cn("text-xs border flex-shrink-0", s.actionLevel === "extreme" ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-blue-500/15 text-blue-400 border-blue-500/20")}>{s.actionLevel}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Visual Style</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STYLES.map((style) => (
                <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={cn("p-3 rounded-xl border text-left transition-all", selectedStyle === style.id ? "bg-orange-500/10 border-orange-500/30" : "bg-white/3 border-white/8 hover:border-white/15")}>
                  <p className={cn("text-xs font-semibold mb-0.5", selectedStyle === style.id ? "text-orange-400" : "text-white")}>{style.label}</p>
                  <p className="text-xs text-white/30 leading-tight">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Characters in This Scene</h3>
            {sceneCharacters.length === 0 ? (
              <p className="text-xs text-white/30 italic">No characters matched for this scene.</p>
            ) : (
              <div className="space-y-2">
                {sceneCharacters.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl">
                    {c.imageUrl && <img src={c.imageUrl} alt={c.name} className="w-9 h-9 rounded-lg object-cover object-top flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-white/40 truncate">{c.role.split(" / ")[0]}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {c.voice?.id ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                          <Volume2 className="w-2.5 h-2.5" />{c.voice.name ?? "Voice set"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-orange-400/70 bg-orange-500/8 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-2.5 h-2.5" />No voice
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {unassignedVoices.length > 0 && (
              <p className="mt-2 text-xs text-orange-400/70 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                {unassignedVoices.map(c => c.name).join(", ")} {unassignedVoices.length === 1 ? "has" : "have"} no voice assigned — go to Characters to assign.
              </p>
            )}
          </div>

          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-11 gap-2"
            onClick={() => setActiveTab("generate")}
          >
            <Clapperboard className="w-4 h-4" />
            Continue to Generate
          </Button>
        </TabsContent>

        {/* ── DIALOGUE TAB ── */}
        <TabsContent value="dialogue" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/50">Click a shot to expand it and add dialogue lines per character. Lines are saved automatically.</p>
          </div>
          {(scene.shotBreakdown ?? []).map((shot) => (
            <ShotCard key={shot.id} shot={shot} sceneCharacters={scene.characters ?? []} onUpdateDialogue={(d) => updateShotDialogue(shot.id, d)} />
          ))}
          {(!scene.shotBreakdown || scene.shotBreakdown.length === 0) && (
            <div className="p-8 text-center text-white/30 text-sm">No shots defined for this scene.</div>
          )}
        </TabsContent>

        {/* ── GENERATE TAB ── */}
        <TabsContent value="generate" className="space-y-6">

          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-blue-300">Required: Add API Keys to Vercel</p>
            <p className="text-xs text-blue-300/70">
              In your Vercel Dashboard → Project → Settings → Environment Variables, add:
            </p>
            <ul className="text-xs text-blue-300/60 space-y-0.5 ml-3 list-disc">
              <li><code className="font-mono">GALAXY_API_KEY</code> — from <a href="https://galaxy.ai" target="_blank" rel="noreferrer" className="underline">galaxy.ai</a> (image, video &amp; voice generation)</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/3 border border-white/8 rounded-xl p-3">
              <p className="text-xs text-white/30 mb-1">Scene</p>
              <p className="text-sm font-semibold text-white line-clamp-2">{scene.title}</p>
              <p className="text-xs text-white/40 mt-0.5">{scene.shotBreakdown?.length ?? 0} shots</p>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-xl p-3">
              <p className="text-xs text-white/30 mb-1">Style</p>
              <p className="text-sm font-semibold text-white">{STYLES.find(s => s.id === selectedStyle)?.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{STYLES.find(s => s.id === selectedStyle)?.desc}</p>
            </div>
          </div>

          {pipeline !== "idle" && totalShots > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50">{doneCount} / {totalShots} clips complete</p>
                <p className="text-xs text-white/50">{progressPct}%</p>
              </div>
              <Progress value={progressPct} className="h-1.5 bg-white/8" />
            </div>
          )}

          <div className="flex gap-3">
            {pipeline === "idle" || pipeline === "partial" ? (
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold h-11 gap-2"
                onClick={handleGenerate}
                disabled={!scene.shotBreakdown?.length}
              >
                <Clapperboard className="w-4 h-4" />
                {pipeline === "partial" ? "Regenerate" : "Generate Video"}
              </Button>
            ) : pipeline === "running" ? (
              <Button
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-semibold h-11 gap-2"
                onClick={handleStop}
              >
                <X className="w-4 h-4" />Stop
              </Button>
            ) : null}

            {(pipeline === "done" || pipeline === "partial") && doneCount > 0 && (
              <Button
                className={cn("flex-1 font-semibold h-11 gap-2", saved ? "bg-green-600 hover:bg-green-700" : saving ? "bg-orange-500/50 cursor-wait" : "bg-white/10 hover:bg-white/15 text-white border border-white/15")}
                onClick={handleSaveToVideos}
                disabled={saved || saving}
              >
                {saved ? <><Check className="w-4 h-4" />Saved!</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" />{saveStatus}</> : <><Save className="w-4 h-4" />Save to Videos</>}
              </Button>
            )}
          </div>

          <AnimatePresence>
            {shotStates.map((state) => {
              const shot = scene.shotBreakdown?.find((s) => s.id === state.shotId)
              return (
                <ShotProgressCard
                  key={state.shotId}
                  state={state}
                  onRetry={() => shot && handleRetry(shot)}
                />
              )
            })}
          </AnimatePresence>

          {pipeline === "idle" && (
            <div className="border border-dashed border-white/10 rounded-xl p-10 text-center">
              <Clapperboard className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/30">Click <strong className="text-white/50">Generate Video</strong> to start.</p>
              <p className="text-xs text-white/20 mt-1">Each shot will be rendered as a still image, then animated into a video clip.</p>
            </div>
          )}

          {pipeline === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center"
            >
              <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-300">All {doneCount} clips generated!</p>
              <p className="text-xs text-green-400/60 mt-1">
                {saved ? "Saved to Videos page." : saving ? saveStatus : "Click Save to Videos to merge clips and add to your library."}
              </p>
            </motion.div>
          )}

          {pipeline === "partial" && doneCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-4 text-center"
            >
              <AlertCircle className="w-5 h-5 text-orange-400 mx-auto mb-2" />
              <p className="text-sm text-orange-300">{doneCount} of {totalShots} clips completed — some failed. Use Retry on failed shots.</p>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/40">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    }>
      <GeneratePageInner />
    </Suspense>
  )
}
