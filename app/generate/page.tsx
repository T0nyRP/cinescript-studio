"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Zap, Copy, Check, ChevronDown, ChevronUp, Volume2, MessageSquare, AlertCircle, Film, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCharacters, useScenes } from "@/hooks/use-data-store"
import { cn } from "@/lib/utils"
import type { Shot, ShotDialogue, Scene } from "@/types"

const STYLES = [
  { id: "cinematic", label: "Cinematic", color: "orange", desc: "4K filmic, shallow DOF, dramatic lighting" },
  { id: "gritty", label: "Gritty", color: "red", desc: "Raw, handheld, desaturated realism" },
  { id: "epic", label: "Epic", color: "blue", desc: "Grand scale, sweeping score, IMAX wide" },
  { id: "noir", label: "Neo-Noir", color: "purple", desc: "Deep shadows, neon accents, rain-slicked streets" },
  { id: "realistic", label: "Hyper-Real", color: "green", desc: "Documentary realism, natural light" },
  { id: "comic-book", label: "Comic Book", color: "yellow", desc: "Bold outlines, graphic panel transitions" },
]

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

// Inner component that uses useSearchParams (must be inside Suspense)
function GeneratePageInner() {
  const searchParams = useSearchParams()
  const { characters } = useCharacters()
  const { scenes, loading, updateScene } = useScenes()
  const [selectedSceneId, setSelectedSceneId] = useState<string>("")
  const [selectedStyle, setSelectedStyle] = useState("cinematic")
  const [copied, setCopied] = useState(false)

  // Once scenes load, set selected scene from URL param or default to first scene
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
      shotBreakdown: (scene.shotBreakdown ?? []).map((s) => s.id === shotId ? { ...s, dialogue } : s)
    }
    updateScene(updated)
  }

  const generationBrief = useMemo(() => {
    if (!scene) return ""
    const style = STYLES.find((s) => s.id === selectedStyle)
    const charLines = sceneCharacters.map((c) => {
      const voice = c.voice?.id ? `Voice: ${c.voice.name ?? c.voice.id} (ElevenLabs ${c.voice.id})` : "Voice: Not assigned"
      const refs = (c.referenceImages?.length ?? 0) > 0 ? `${c.referenceImages!.length} reference image(s)` : "No reference images"
      return `• ${c.name} — ${voice} — ${refs}`
    }).join("\n")

    const shotLines = (scene.shotBreakdown ?? []).map((shot) => {
      const d = (shot.dialogue ?? []).map((l) => `    ${l.characterName} [${l.type}]: "${l.line}"`).join("\n")
      return `Shot ${shot.order} (${shot.type}, ${shot.duration}s): ${shot.description}${d ? "\n" + d : ""}`
    }).join("\n")

    return `GENERATION BRIEF
══════════════════════════════════════════
Scene: ${scene.title}
Chapter: ${scene.chapter}
Location: ${scene.location}
Style: ${style?.label} — ${style?.desc}
Format: 16:9 Facebook, 720p
Duration: ~${((scene.shotBreakdown?.length ?? 8) * 10)}s (${scene.shotBreakdown?.length ?? 8} shots × 10s)

CHARACTERS & VOICES
${charLines || "No characters assigned to this scene"}

SHOT BREAKDOWN & DIALOGUE
${shotLines || "No shots defined"}

INSTRUCTIONS
- Use gpt-image-2-edit with character reference images for all character shots
- Animate each still with seedance-2.0-fast-image-to-video at 10s, 720p, native audio on
- Generate TTS for each dialogue line using the character's assigned ElevenLabs voice
- Mix dialogue audio into each clip before merging
- Merge in batches of 4, then join halves
- Generate orchestral film score with lyria3-pro (no spy/action keywords)
- Mix score at 18% volume, 3s fade out
- Update Videos page with final URL
══════════════════════════════════════════`
  }, [scene, selectedStyle, sceneCharacters])

  const handleCopy = () => {
    navigator.clipboard.writeText(generationBrief)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Loading state
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

  // No scenes
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

  return (
    <div className="min-h-screen p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs mb-3">
          <Zap className="w-3 h-3 mr-1" />Generate Video
        </Badge>
        <h1 className="text-3xl font-bold text-white mb-2">Video Generation</h1>
        <p className="text-white/50 text-sm max-w-lg">Configure your scene, assign dialogue, then copy the brief into the AI chat to generate your video.</p>
      </motion.div>

      <Tabs defaultValue="setup" className="space-y-6">
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
          <TabsTrigger value="brief" className="text-xs rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">Brief</TabsTrigger>
        </TabsList>

        {/* ── SETUP TAB ── */}
        <TabsContent value="setup" className="space-y-6">
          {/* Scene selector */}
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

          {/* Style */}
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

          {/* Characters */}
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

        {/* ── BRIEF TAB ── */}
        <TabsContent value="brief">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/50">Copy this brief and paste it into the AI chat to generate your video.</p>
              <Button size="sm" className={cn("text-xs h-8 gap-1.5", copied ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600")} onClick={handleCopy}>
                {copied ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy Brief</>}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Film, label: "Shots", value: scene.shotBreakdown?.length ?? 0 },
                { icon: MessageSquare, label: "Dialogue Lines", value: (scene.shotBreakdown ?? []).reduce((n, s) => n + (s.dialogue?.length ?? 0), 0) },
                { icon: Volume2, label: "Voices Assigned", value: sceneCharacters.filter(c => c.voice?.id).length + "/" + sceneCharacters.length },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
                  <Icon className="w-4 h-4 text-white/30 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-xs text-white/40">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-black/40 border border-white/8 rounded-xl p-4 font-mono text-xs text-white/60 leading-relaxed whitespace-pre overflow-auto max-h-96">
              {generationBrief}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
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
