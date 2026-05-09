"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Mic, Star, Plus, X, Check, Save, Clipboard, ClipboardCheck,
  ChevronDown, ChevronUp, Images, Volume2, Merge, Camera, Link2, Upload,
  AlertCircle, Sparkles, Loader2, CheckSquare, Settings2, SlidersHorizontal
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCharacters } from "@/hooks/use-data-store"
import { isSupabaseConfigured } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { Character, VoiceProfile, VoiceRecommendation } from "@/types"

// ─── Role colors ──────────────────────────────────────────────────────────────

const roleColors: Record<string, { bg: string; border: string; badge: string; ring: string; dot: string; icon: string; iconText: string; selectedRing: string }> = {
  orange: {
    bg: "bg-orange-500/10", border: "border-orange-500/20", badge: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    ring: "ring-orange-500/40", dot: "bg-orange-400", icon: "bg-orange-500/20", iconText: "text-orange-400",
    selectedRing: "ring-2 ring-orange-500"
  },
  blue: {
    bg: "bg-blue-500/10", border: "border-blue-500/20", badge: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    ring: "ring-blue-500/40", dot: "bg-blue-400", icon: "bg-blue-500/20", iconText: "text-blue-400",
    selectedRing: "ring-2 ring-blue-500"
  },
  red: {
    bg: "bg-red-500/10", border: "border-red-500/20", badge: "bg-red-500/15 text-red-400 border-red-500/20",
    ring: "ring-red-500/40", dot: "bg-red-400", icon: "bg-red-500/20", iconText: "text-red-400",
    selectedRing: "ring-2 ring-red-500"
  },
  purple: {
    bg: "bg-purple-500/10", border: "border-purple-500/20", badge: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    ring: "ring-purple-500/40", dot: "bg-purple-400", icon: "bg-purple-500/20", iconText: "text-purple-400",
    selectedRing: "ring-2 ring-purple-500"
  },
}

function getRoleColor(role: string) {
  if (role.includes("Protagonist")) return "orange"
  if (role.includes("Senior")) return "blue"
  if (role.includes("Antagonist")) return "red"
  if (role.includes("Scientist")) return "purple"
  return "orange"
}

// ─── Settings slider ──────────────────────────────────────────────────────────

function SettingSlider({
  label,
  hint,
  value,
  min,
  max,
  recommendedMin,
  recommendedMax,
  onChange,
}: {
  label: string
  hint: string
  value: number
  min: number
  max: number
  recommendedMin: number
  recommendedMax: number
  onChange: (v: number) => void
}) {
  const recLeft = `${recommendedMin}%`
  const recWidth = `${recommendedMax - recommendedMin}%`
  const inRange = value >= recommendedMin && value <= recommendedMax

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white/70">{label}</span>
          <span className={cn("text-xs font-mono", inRange ? "text-green-400" : "text-white/40")}>{value}</span>
          {inRange && <span className="text-xs text-green-400/60">✓ recommended</span>}
        </div>
        <span className="text-xs text-white/25">{hint}</span>
      </div>
      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="absolute w-full h-1.5 bg-white/10 rounded-full" />
        {/* Recommended range highlight */}
        <div
          className="absolute h-1.5 bg-orange-500/25 rounded-full"
          style={{ left: recLeft, width: recWidth }}
        />
        {/* Slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-xs text-white/20">{min}</span>
        <span className="text-xs text-orange-400/50">rec: {recommendedMin}–{recommendedMax}</span>
        <span className="text-xs text-white/20">{max}</span>
      </div>
    </div>
  )
}

// ─── Voice recommendation card ────────────────────────────────────────────────

const RANK_LABELS = ["", "Best Fit", "Great Fit", "Good Fit", "Solid Pick", "Alternative"]
const RANK_COLORS = ["", "bg-orange-500 text-white", "bg-blue-500/80 text-white", "bg-white/15 text-white/70", "bg-white/10 text-white/60", "bg-white/5 text-white/50"]

function VoiceCard({
  rec,
  isSelected,
  onSelect,
}: {
  rec: VoiceRecommendation
  isSelected: boolean
  onSelect: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(rec.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rec.rank - 1) * 0.06 }}
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-3.5 cursor-pointer transition-all",
        isSelected
          ? "border-orange-500/50 bg-orange-500/10 ring-1 ring-orange-500/30"
          : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
          <div className={cn("text-xs font-bold px-2 py-0.5 rounded-md", RANK_COLORS[rec.rank])}>
            {RANK_LABELS[rec.rank]}
          </div>
          {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-white">{rec.name}</span>
            <button
              onClick={copyId}
              className="text-xs text-white/25 hover:text-white/60 font-mono transition-colors flex items-center gap-1"
            >
              {copied ? <><ClipboardCheck className="w-3 h-3 text-green-400" /><span className="text-green-400">copied</span></> : <><Clipboard className="w-3 h-3" />{rec.id.slice(0, 8)}…</>}
            </button>
          </div>
          <p className="text-xs text-white/50 mb-1.5">{rec.tone}</p>
          <p className="text-xs text-white/70 leading-relaxed mb-1.5">{rec.whyItFits}</p>
          <div className="flex flex-wrap gap-1">
            {rec.characterFeel.split(",").map((f) => (
              <span key={f} className="text-xs bg-white/5 border border-white/8 px-1.5 py-0.5 rounded-full text-white/50">{f.trim()}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Voice Editor Modal ───────────────────────────────────────────────────────

function VoiceEditor({
  character,
  onSave,
  onClose,
}: {
  character: Character
  onSave: (voice: VoiceProfile) => void
  onClose: () => void
}) {
  const [voice, setVoice] = useState<VoiceProfile>(character.voice ?? {
    stability: 75,
    similarityBoost: 80,
    styleExaggeration: 15,
  })
  const [recommendations, setRecommendations] = useState<VoiceRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedRec, setSelectedRec] = useState<VoiceRecommendation | null>(null)
  const [tab, setTab] = useState<"pick" | "settings" | "manual">("pick")
  const hasSearched = recommendations.length > 0

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/recommend-voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Unknown error")
      setRecommendations(data.recommendations)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get recommendations")
    } finally {
      setLoading(false)
    }
  }, [character])

  const handleSelectRec = (rec: VoiceRecommendation) => {
    setSelectedRec(rec)
    setVoice((v) => ({
      ...v,
      id: rec.id,
      name: rec.name,
      tone: rec.tone,
      provider: "elevenlabs",
      stability: Math.round((rec.stabilityRange[0] + rec.stabilityRange[1]) / 2),
      similarityBoost: Math.round((rec.similarityRange[0] + rec.similarityRange[1]) / 2),
      styleExaggeration: Math.round((rec.styleRange[0] + rec.styleRange[1]) / 2),
    }))
    setTab("settings")
  }

  const stability = voice.stability ?? 75
  const similarityBoost = voice.similarityBoost ?? 80
  const styleExaggeration = voice.styleExaggeration ?? 15

  const recStabilityMin = selectedRec?.stabilityRange[0] ?? 65
  const recStabilityMax = selectedRec?.stabilityRange[1] ?? 80
  const recSimilarityMin = selectedRec?.similarityRange[0] ?? 75
  const recSimilarityMax = selectedRec?.similarityRange[1] ?? 90
  const recStyleMin = selectedRec?.styleRange[0] ?? 10
  const recStyleMax = selectedRec?.styleRange[1] ?? 25

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-[#111118] rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-orange-400" />
              Voice Casting — {character.name}
            </h3>
            <p className="text-xs text-white/40 mt-0.5">{character.voiceStyle}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8 flex-shrink-0">
          {[
            { id: "pick" as const, label: "AI Recommendations", icon: Sparkles },
            { id: "settings" as const, label: "Voice Settings", icon: SlidersHorizontal },
            { id: "manual" as const, label: "Manual Entry", icon: Settings2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2",
                tab === id
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-white/40 hover:text-white/60"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
              {id === "pick" && voice.id && <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-0.5" />}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5">

          {/* ── TAB: AI Recommendations ── */}
          {tab === "pick" && (
            <div className="space-y-4">
              {!hasSearched && !loading && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-7 h-7 text-orange-400" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">Find the perfect voice</p>
                  <p className="text-xs text-white/40 max-w-xs mx-auto mb-4">
                    AI will analyze {character.name}&apos;s profile and rank the best ElevenLabs voices with fit rationale and recommended settings.
                  </p>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                    onClick={handleSearch}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Find Recommended Voices
                  </Button>
                </div>
              )}

              {loading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-orange-400/80 mb-3">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing {character.name}&apos;s character profile…
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {hasSearched && !loading && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/40">Top voices for <span className="text-white/60">{character.name}</span></p>
                    <button
                      onClick={handleSearch}
                      className="text-xs text-orange-400/70 hover:text-orange-400 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />Re-run
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recommendations.map((rec) => (
                      <VoiceCard
                        key={rec.id}
                        rec={rec}
                        isSelected={voice.id === rec.id}
                        onSelect={() => handleSelectRec(rec)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB: Voice Settings ── */}
          {tab === "settings" && (
            <div className="space-y-5">
              {voice.id ? (
                <div className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{voice.name ?? "Voice selected"}</p>
                    <p className="text-xs text-white/40 font-mono">{voice.id}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-yellow-400/80 bg-yellow-500/8 border border-yellow-500/15 rounded-xl p-3">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  No voice selected — pick one from AI Recommendations or enter manually
                </div>
              )}

              <div className="space-y-5">
                <SettingSlider
                  label="Stability"
                  hint="Consistency vs. expressiveness"
                  value={stability}
                  min={0}
                  max={100}
                  recommendedMin={recStabilityMin}
                  recommendedMax={recStabilityMax}
                  onChange={(v) => setVoice({ ...voice, stability: v })}
                />
                <SettingSlider
                  label="Clarity / Similarity"
                  hint="Precision of voice match"
                  value={similarityBoost}
                  min={0}
                  max={100}
                  recommendedMin={recSimilarityMin}
                  recommendedMax={recSimilarityMax}
                  onChange={(v) => setVoice({ ...voice, similarityBoost: v })}
                />
                <SettingSlider
                  label="Style Exaggeration"
                  hint="Adds intensity / character"
                  value={styleExaggeration}
                  min={0}
                  max={100}
                  recommendedMin={recStyleMin}
                  recommendedMax={recStyleMax}
                  onChange={(v) => setVoice({ ...voice, styleExaggeration: v })}
                />
              </div>

              {selectedRec && (
                <div className="p-3 bg-white/3 border border-white/8 rounded-xl text-xs text-white/50 leading-relaxed">
                  <p className="font-medium text-white/70 mb-1">Why these settings for {selectedRec.name}?</p>
                  {selectedRec.whyItFits}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Manual Entry ── */}
          {tab === "manual" && (
            <div className="space-y-4">
              <p className="text-xs text-white/40">Enter a voice ID directly if you already know which ElevenLabs voice to use.</p>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">ElevenLabs Voice ID</label>
                <div className="flex gap-2">
                  <Input
                    value={voice.id ?? ""}
                    onChange={(e) => setVoice({ ...voice, id: e.target.value })}
                    placeholder="e.g. pNInz6obpgDQGcFmaJgB"
                    className="bg-white/5 border-white/10 text-white text-xs h-8 font-mono"
                  />
                  {voice.id && (
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    </div>
                  )}
                </div>
              </div>
              {voice.id && (
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Voice Name <span className="text-white/20">(optional label)</span></label>
                  <Input
                    value={voice.name ?? ""}
                    onChange={(e) => setVoice({ ...voice, name: e.target.value })}
                    placeholder="e.g. Adam"
                    className="bg-white/5 border-white/10 text-white text-xs h-8"
                  />
                </div>
              )}
              <div className="p-3 bg-white/3 border border-white/8 rounded-xl text-xs text-white/50">
                Find voice IDs at{" "}
                <a href="https://elevenlabs.io/voice-library" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">
                  elevenlabs.io/voice-library
                </a>
                {" "}— click any voice → copy the ID from the URL or voice card.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8 flex gap-2 flex-shrink-0">
          <Button variant="outline" className="flex-1 border-white/15 text-white/60 text-xs h-8" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1.5"
            onClick={() => { onSave(voice); onClose() }}
          >
            <Save className="w-3 h-3" />
            {voice.id ? `Save — ${voice.name ?? "Voice"}` : "Save Settings"}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Add Photo Modal ──────────────────────────────────────────────────────────

function AddPhotoModal({
  character,
  onSave,
  onClose,
}: {
  character: Character
  onSave: (urls: string[]) => void
  onClose: () => void
}) {
  const [urlInput, setUrlInput] = useState("")
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const existing = character.referenceImages ?? (character.imageUrl ? [character.imageUrl] : [])

  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    try { new URL(trimmed) } catch { setError("Invalid URL — must start with https://"); return }
    if (previews.includes(trimmed) || existing.includes(trimmed)) { setError("Already added"); return }
    setPreviews((p) => [...p, trimmed])
    setUrlInput("")
    setError("")
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    setUploading(true)
    setError("")
    const readers: Promise<string>[] = []
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) { setError("Only image files accepted"); return }
      if (file.size > 4 * 1024 * 1024) { setError(`${file.name} is over 4 MB — try a smaller file`); return }
      readers.push(new Promise((resolve) => {
        const fr = new FileReader()
        fr.onload = (e) => resolve(e.target?.result as string)
        fr.readAsDataURL(file)
      }))
    })
    Promise.all(readers).then((dataUrls) => {
      setPreviews((p) => [...p, ...dataUrls])
      setUploading(false)
    })
  }

  const removePreview = (i: number) => setPreviews((p) => p.filter((_, idx) => idx !== i))

  const handleSave = () => {
    if (previews.length === 0) { onClose(); return }
    onSave([...existing, ...previews])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#111118] rounded-2xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h3 className="text-sm font-bold text-white">Add Reference Photos — {character.name}</h3>
            <p className="text-xs text-white/40 mt-0.5">These photos keep the character visually consistent across shots</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5"><Upload className="w-3 h-3" />Upload from device <span className="text-white/20">(max 4 MB each)</span></label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-white/15 rounded-xl py-6 text-xs text-white/40 hover:border-white/30 hover:text-white/60 hover:bg-white/3 transition-all flex flex-col items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Click to select images
            </button>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5"><Link2 className="w-3 h-3" />Or paste an image URL</label>
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setError("") }}
                onKeyDown={(e) => e.key === "Enter" && addUrl()}
                placeholder="https://example.com/photo.jpg"
                className="bg-white/5 border-white/10 text-white text-xs h-8"
              />
              <Button size="sm" variant="outline" className="border-white/15 text-white/60 text-xs h-8 px-3 flex-shrink-0" onClick={addUrl}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />{error}
            </div>
          )}

          {existing.length > 0 && (
            <div>
              <p className="text-xs text-white/30 mb-2">Already saved ({existing.length})</p>
              <div className="flex flex-wrap gap-2">
                {existing.map((url, i) => (
                  <div key={i} className="w-14 h-14 rounded-lg overflow-hidden ring-1 ring-green-500/30 relative">
                    <img src={url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/10">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previews.length > 0 && (
            <div>
              <p className="text-xs text-white/30 mb-2">Adding {previews.length} new photo{previews.length !== 1 ? "s" : ""}</p>
              <div className="flex flex-wrap gap-2">
                {previews.map((url, i) => (
                  <div key={i} className="relative group">
                    <div className="w-14 h-14 rounded-lg overflow-hidden ring-1 ring-orange-500/40">
                      <img src={url} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => removePreview(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && <p className="text-xs text-white/40">Reading files…</p>}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <Button variant="outline" className="flex-1 border-white/15 text-white/60 text-xs h-8" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1.5"
            onClick={handleSave}
            disabled={previews.length === 0}
          >
            <Save className="w-3 h-3" />Save {previews.length > 0 ? `${previews.length} Photo${previews.length !== 1 ? "s" : ""}` : "Photos"}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Merge Modal ──────────────────────────────────────────────────────────────

function MergeModal({
  selected,
  characters,
  onConfirm,
  onClose,
}: {
  selected: string[]
  characters: Character[]
  onConfirm: (primaryId: string, idsToDelete: string[]) => void
  onClose: () => void
}) {
  const selectedChars = characters.filter((c) => selected.includes(c.id))
  const [primaryId, setPrimaryId] = useState(selected[0])

  const primary = selectedChars.find((c) => c.id === primaryId)!
  const toDelete = selected.filter((id) => id !== primaryId)

  const allRefs = Array.from(new Set(
    selectedChars.flatMap((c) => c.referenceImages ?? (c.imageUrl ? [c.imageUrl] : []))
  ))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#111118] rounded-2xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h3 className="text-sm font-bold text-white">Merge {selectedChars.length} Characters</h3>
            <p className="text-xs text-white/40 mt-0.5">Choose which character to keep. All reference photos will be combined.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-white/40 mb-2">Select primary character <span className="text-white/20">(this record will be kept)</span></p>
            <div className="space-y-2">
              {selectedChars.map((char) => {
                const isPrimary = char.id === primaryId
                return (
                  <button
                    key={char.id}
                    onClick={() => setPrimaryId(char.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      isPrimary ? "border-orange-500/40 bg-orange-500/10" : "border-white/8 bg-white/3 hover:border-white/15"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0", isPrimary ? "border-orange-500 bg-orange-500" : "border-white/30")}>
                      {isPrimary && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{char.name}</p>
                      <p className="text-xs text-white/40">{char.role} · {char.manuscriptSource}</p>
                    </div>
                    {isPrimary && <Badge className="text-xs bg-orange-500/15 text-orange-400 border border-orange-500/20 flex-shrink-0">Primary</Badge>}
                  </button>
                )
              })}
            </div>
          </div>

          {allRefs.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Combined reference photos ({allRefs.length})</p>
              <div className="flex flex-wrap gap-2">
                {allRefs.map((url, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg overflow-hidden ring-1 ring-white/10">
                    <img src={url} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
            <p className="text-xs text-red-400/80">
              <strong className="text-red-400">Will be deleted:</strong>{" "}
              {selectedChars.filter((c) => c.id !== primaryId).map((c) => c.name).join(", ")}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <Button variant="outline" className="flex-1 border-white/15 text-white/60 text-xs h-8" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1.5"
            onClick={() => { onConfirm(primaryId, toDelete); onClose() }}
          >
            <Merge className="w-3 h-3" />Merge into {primary?.name}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Character Card ───────────────────────────────────────────────────────────

function CharacterCard({
  character,
  onUpdate,
  mergeMode,
  isSelected,
  onToggleSelect,
}: {
  character: Character
  onUpdate: (c: Character) => void
  mergeMode: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editingVoice, setEditingVoice] = useState(false)
  const [addingPhoto, setAddingPhoto] = useState(false)
  const [activeRef, setActiveRef] = useState(0)
  const color = getRoleColor(character.role)
  const c = roleColors[color]
  const refs = character.referenceImages ?? (character.imageUrl ? [character.imageUrl] : [])
  const hasVoice = !!(character.voice?.id)

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border transition-all relative",
          c.bg, c.border,
          mergeMode && isSelected && "ring-2 ring-orange-500",
          mergeMode && "cursor-pointer"
        )}
        onClick={mergeMode ? () => onToggleSelect(character.id) : undefined}
      >
        {mergeMode && (
          <div className="absolute top-3 right-3 z-10">
            <div className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
              isSelected ? "bg-orange-500 border-orange-500" : "bg-black/40 border-white/30"
            )}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start gap-4">
            {refs.length > 0 ? (
              <div className="relative flex-shrink-0">
                <div className={cn("w-16 h-16 rounded-xl overflow-hidden ring-2", c.ring)}>
                  <img src={refs[activeRef]} alt={character.name} className="w-full h-full object-cover object-top" />
                </div>
                {refs.length > 1 && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {refs.map((_, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); setActiveRef(i) }} className={cn("w-2 h-2 rounded-full transition-all", i === activeRef ? c.dot : "bg-white/20 hover:bg-white/40")} />
                    ))}
                  </div>
                )}
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500/90 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            ) : (
              <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0", c.icon)}>
                <Users className={cn("w-7 h-7", c.iconText)} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white mb-0.5">{character.name}</h3>
              <p className="text-xs text-white/40 mb-1.5">Age: {character.age}</p>
              <Badge className={cn("text-xs border", c.badge)}>{character.role.split(" / ")[0]}</Badge>
              {refs.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1">
                  <Images className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">{refs.length} ref{refs.length > 1 ? "s" : ""} locked</span>
                </div>
              )}
            </div>
          </div>

          {/* Voice section */}
          <div className={cn("mt-4 p-3 rounded-xl border transition-all", hasVoice ? "bg-green-500/5 border-green-500/20" : "bg-white/3 border-white/8")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", hasVoice ? "bg-green-500/20" : "bg-white/8")}>
                  <Volume2 className={cn("w-3.5 h-3.5", hasVoice ? "text-green-400" : "text-white/30")} />
                </div>
                <div className="min-w-0">
                  {hasVoice ? (
                    <>
                      <p className="text-xs font-semibold text-white truncate">{character.voice?.name ?? "Voice Assigned"}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-white/40 truncate">{[character.voice?.gender, character.voice?.ageRange, character.voice?.accent].filter(Boolean).join(" · ")}</p>
                        {character.voice?.stability !== undefined && (
                          <span className="text-xs text-white/25">S:{character.voice.stability} C:{character.voice.similarityBoost} E:{character.voice.styleExaggeration}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-white/50 truncate">{character.voiceStyle.split(",")[0]}</p>
                      <p className="text-xs text-orange-400/70">No voice assigned</p>
                    </>
                  )}
                </div>
              </div>
              {!mergeMode && (
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("flex-shrink-0 text-xs h-7 gap-1 ml-2", hasVoice ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-orange-500/30 text-orange-400 hover:bg-orange-500/10")}
                  onClick={(e) => { e.stopPropagation(); setEditingVoice(true) }}
                >
                  <Mic className="w-3 h-3" />
                  {hasVoice ? "Edit" : "Assign"}
                </Button>
              )}
            </div>
          </div>

          {/* Add Photo + Expand row */}
          {!mergeMode && (
            <div className="mt-3 flex items-center gap-3">
              <button
                className="flex items-center gap-1.5 text-xs text-blue-400/70 hover:text-blue-400 transition-colors"
                onClick={(e) => { e.stopPropagation(); setAddingPhoto(true) }}
              >
                <Camera className="w-3 h-3" />
                {refs.length > 0 ? "Edit Photos" : "Add Photos"}
              </button>
              <span className="text-white/15">·</span>
              <button
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "Hide details" : "Show full profile"}
              </button>
            </div>
          )}
        </div>

        {expanded && !mergeMode && (
          <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
            {refs.length > 1 && (
              <div>
                <p className="text-xs text-white/30 mb-2">Reference Photos</p>
                <div className="flex gap-2">
                  {refs.map((url, i) => (
                    <button key={i} onClick={() => setActiveRef(i)} className={cn("w-14 h-14 rounded-lg overflow-hidden ring-1 transition-all", i === activeRef ? `ring-2 ${c.ring}` : "ring-white/10 hover:ring-white/25")}>
                      <img src={url} alt={`Ref ${i + 1}`} className="w-full h-full object-cover object-top" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-white/30 mb-2">Appearance</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[["Hair", character.appearance.hair.split(",")[0]], ["Eyes", character.appearance.eyes.split(",")[0]], ["Build", character.appearance.build.split(",")[0]], ["Height", character.appearance.height]].map(([label, value]) => (
                  <div key={label} className="bg-black/20 rounded-lg px-2.5 py-1.5">
                    <p className="text-xs text-white/25">{label}</p>
                    <p className="text-xs text-white/60 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-2">Personality</p>
              <div className="flex flex-wrap gap-1.5">
                {character.personality.map((t) => <span key={t} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/60">{t}</span>)}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-1">Distinguishing Features</p>
              <p className="text-xs text-white/50 leading-relaxed">{character.appearance.distinguishing}</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingVoice && (
          <VoiceEditor
            character={character}
            onSave={(voice) => onUpdate({ ...character, voice })}
            onClose={() => setEditingVoice(false)}
          />
        )}
        {addingPhoto && (
          <AddPhotoModal
            character={character}
            onSave={(urls) => onUpdate({ ...character, referenceImages: urls })}
            onClose={() => setAddingPhoto(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CharactersPage() {
  const { characters, loading, updateCharacter, removeCharacter } = useCharacters()
  const [mergeMode, setMergeMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showMergeModal, setShowMergeModal] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const handleMergeConfirm = async (primaryId: string, idsToDelete: string[]) => {
    const primary = characters.find((c) => c.id === primaryId)!
    const others = characters.filter((c) => idsToDelete.includes(c.id))

    const allRefs = Array.from(new Set([
      ...(primary.referenceImages ?? (primary.imageUrl ? [primary.imageUrl] : [])),
      ...others.flatMap((c) => c.referenceImages ?? (c.imageUrl ? [c.imageUrl] : [])),
    ]))

    await updateCharacter({ ...primary, referenceImages: allRefs })

    for (const id of idsToDelete) {
      await removeCharacter(id)
    }

    setSelectedIds([])
    setMergeMode(false)
  }

  const cancelMerge = () => {
    setMergeMode(false)
    setSelectedIds([])
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs mb-3">
          <Users className="w-3 h-3 mr-1" />Character Library
        </Badge>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Characters</h1>
            <p className="text-white/50 text-sm max-w-lg">
              Auto-extracted from your manuscript. Add reference photos for visual consistency, assign voices for dialogue.
            </p>
          </div>
          {!loading && characters.length >= 2 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {mergeMode ? (
                <>
                  <Button variant="outline" size="sm" className="border-white/15 text-white/60 text-xs h-8" onClick={cancelMerge}>
                    <X className="w-3 h-3 mr-1" />Cancel
                  </Button>
                  {selectedIds.length >= 2 && (
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1.5" onClick={() => setShowMergeModal(true)}>
                      <Merge className="w-3 h-3" />Merge {selectedIds.length} Characters
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs h-8 gap-1.5" onClick={() => setMergeMode(true)}>
                  <Merge className="w-3 h-3" />Merge Duplicates
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {mergeMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-2 px-4 py-3 bg-orange-500/8 border border-orange-500/20 rounded-xl text-xs text-orange-300"
        >
          <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
          Select 2 or more duplicate characters to merge them. The primary character&apos;s name and profile will be kept; all reference photos will be combined.
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6 flex items-center gap-2 text-xs">
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border", isSupabaseConfigured ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400")}>
          <div className={cn("w-1.5 h-1.5 rounded-full", isSupabaseConfigured ? "bg-green-400" : "bg-yellow-400")} />
          {isSupabaseConfigured ? "Syncing to Supabase" : "Saved to browser (localStorage)"}
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/3 border border-white/8 rounded-full text-white/50">
          <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
          CODENAME: EMBER — Book 1: The Istanbul Protocol
        </span>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-2xl bg-white/3 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {characters.map((char, i) => (
            <motion.div key={char.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
              <CharacterCard
                character={char}
                onUpdate={updateCharacter}
                mergeMode={mergeMode}
                isSelected={selectedIds.includes(char.id)}
                onToggleSelect={toggleSelect}
              />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showMergeModal && (
          <MergeModal
            selected={selectedIds}
            characters={characters}
            onConfirm={handleMergeConfirm}
            onClose={() => setShowMergeModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
