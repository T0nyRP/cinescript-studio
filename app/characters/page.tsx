"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Mic, Star, Plus, X, Check, Save, Clipboard, ClipboardCheck, ChevronDown, ChevronUp, Images, Volume2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCharacters } from "@/hooks/use-data-store"
import { isSupabaseConfigured } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { Character, VoiceProfile } from "@/types"

const roleColors: Record<string, { bg: string; border: string; badge: string; ring: string; dot: string; icon: string; iconText: string }> = {
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", badge: "bg-orange-500/15 text-orange-400 border-orange-500/20", ring: "ring-orange-500/40", dot: "bg-orange-400", icon: "bg-orange-500/20", iconText: "text-orange-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", badge: "bg-blue-500/15 text-blue-400 border-blue-500/20", ring: "ring-blue-500/40", dot: "bg-blue-400", icon: "bg-blue-500/20", iconText: "text-blue-400" },
  red: { bg: "bg-red-500/10", border: "border-red-500/20", badge: "bg-red-500/15 text-red-400 border-red-500/20", ring: "ring-red-500/40", dot: "bg-red-400", icon: "bg-red-500/20", iconText: "text-red-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", badge: "bg-purple-500/15 text-purple-400 border-purple-500/20", ring: "ring-purple-500/40", dot: "bg-purple-400", icon: "bg-purple-500/20", iconText: "text-purple-400" },
}

function getRoleColor(role: string) {
  if (role.includes("Protagonist")) return "orange"
  if (role.includes("Senior")) return "blue"
  if (role.includes("Antagonist")) return "red"
  if (role.includes("Scientist")) return "purple"
  return "orange"
}

function VoiceEditor({ character, onSave, onClose }: { character: Character; onSave: (voice: VoiceProfile) => void; onClose: () => void }) {
  const [voice, setVoice] = useState<VoiceProfile>(character.voice ?? {
    gender: character.voiceStyle.toLowerCase().includes("female") ? "female" : "male",
    ageRange: character.voiceStyle.toLowerCase().includes("young") ? "young" : "mid",
    accent: "American",
    tone: "intense",
  })
  const [copied, setCopied] = useState(false)

  const chatPrompt = `Assign an ElevenLabs voice to ${character.name}. Profile: ${voice.gender ?? ""} voice, ${voice.ageRange ?? ""}, ${voice.accent ?? ""} accent, ${voice.tone ?? ""} tone. Character: ${character.voiceStyle}. Show me options from the voice library.`

  const handleCopy = () => {
    navigator.clipboard.writeText(chatPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <h3 className="text-sm font-bold text-white">Voice Profile — {character.name}</h3>
            <p className="text-xs text-white/40 mt-0.5">Set voice attributes, then use the AI chat to assign a specific voice</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Voice ID (manual entry) */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">ElevenLabs Voice ID <span className="text-white/20">(set via AI chat, or enter manually)</span></label>
            <div className="flex gap-2">
              <Input
                value={voice.id ?? ""}
                onChange={(e) => setVoice({ ...voice, id: e.target.value })}
                placeholder="e.g. pNInz6obpgDQGcFmaJgB"
                className="bg-white/5 border-white/10 text-white text-xs h-8 font-mono"
              />
              {voice.id && <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0"><Check className="w-3.5 h-3.5 text-green-400" /></div>}
            </div>
          </div>
          {voice.id && (
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Voice Name</label>
              <Input value={voice.name ?? ""} onChange={(e) => setVoice({ ...voice, name: e.target.value })} placeholder="e.g. Adam" className="bg-white/5 border-white/10 text-white text-xs h-8" />
            </div>
          )}

          {/* Attributes grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Gender</label>
              <Select value={voice.gender} onValueChange={(v) => setVoice({ ...voice, gender: v as VoiceProfile["gender"] })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  <SelectItem value="male" className="text-white text-xs">Male</SelectItem>
                  <SelectItem value="female" className="text-white text-xs">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Age Range</label>
              <Select value={voice.ageRange} onValueChange={(v) => setVoice({ ...voice, ageRange: v as VoiceProfile["ageRange"] })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  <SelectItem value="young" className="text-white text-xs">Young (18–30)</SelectItem>
                  <SelectItem value="mid" className="text-white text-xs">Mid (30–50)</SelectItem>
                  <SelectItem value="senior" className="text-white text-xs">Senior (50+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Accent</label>
              <Input value={voice.accent ?? ""} onChange={(e) => setVoice({ ...voice, accent: e.target.value })} placeholder="American, British, Arabic…" className="bg-white/5 border-white/10 text-white text-xs h-8" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Tone</label>
              <Input value={voice.tone ?? ""} onChange={(e) => setVoice({ ...voice, tone: e.target.value })} placeholder="intense, warm, cold…" className="bg-white/5 border-white/10 text-white text-xs h-8" />
            </div>
          </div>

          {/* AI Chat prompt */}
          <div className="p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl">
            <p className="text-xs text-white/50 mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3 h-3 text-orange-400" />
              <span>To assign a real ElevenLabs voice, copy this prompt into the AI chat:</span>
            </p>
            <p className="text-xs text-white/70 font-mono leading-relaxed mb-3 bg-black/30 rounded-lg p-2">{chatPrompt}</p>
            <Button size="sm" variant="outline" className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs h-7 gap-1.5" onClick={handleCopy}>
              {copied ? <><ClipboardCheck className="w-3 h-3" />Copied!</> : <><Clipboard className="w-3 h-3" />Copy Prompt</>}
            </Button>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <Button variant="outline" className="flex-1 border-white/15 text-white/60 text-xs h-8" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1.5" onClick={() => { onSave(voice); onClose() }}>
            <Save className="w-3 h-3" />Save Voice Profile
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function CharacterCard({ character, onUpdate }: { character: Character; onUpdate: (c: Character) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editingVoice, setEditingVoice] = useState(false)
  const [activeRef, setActiveRef] = useState(0)
  const color = getRoleColor(character.role)
  const c = roleColors[color]
  const refs = character.referenceImages ?? (character.imageUrl ? [character.imageUrl] : [])
  const hasVoice = !!(character.voice?.id)

  return (
    <>
      <div className={cn("rounded-2xl border transition-all", c.bg, c.border)}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Reference photo */}
            {refs.length > 0 ? (
              <div className="relative flex-shrink-0">
                <div className={cn("w-16 h-16 rounded-xl overflow-hidden ring-2", c.ring)}>
                  <img src={refs[activeRef]} alt={character.name} className="w-full h-full object-cover object-top" />
                </div>
                {refs.length > 1 && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {refs.map((_, i) => (
                      <button key={i} onClick={() => setActiveRef(i)} className={cn("w-2 h-2 rounded-full transition-all", i === activeRef ? c.dot : "bg-white/20 hover:bg-white/40")} />
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
                      <p className="text-xs text-white/40 truncate">{[character.voice?.gender, character.voice?.ageRange, character.voice?.accent].filter(Boolean).join(" · ")}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-white/50 truncate">{character.voiceStyle.split(",")[0]}</p>
                      <p className="text-xs text-orange-400/70">No voice assigned</p>
                    </>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" className={cn("flex-shrink-0 text-xs h-7 gap-1 ml-2", hasVoice ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-orange-500/30 text-orange-400 hover:bg-orange-500/10")} onClick={() => setEditingVoice(true)}>
                <Mic className="w-3 h-3" />
                {hasVoice ? "Edit" : "Assign"}
              </Button>
            </div>
          </div>

          {/* Expand */}
          <button className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Hide details" : "Show full profile"}
          </button>
        </div>

        {expanded && (
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
          <VoiceEditor character={character} onSave={(voice) => onUpdate({ ...character, voice })} onClose={() => setEditingVoice(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

export default function CharactersPage() {
  const { characters, loading, updateCharacter } = useCharacters()

  return (
    <div className="min-h-screen p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs mb-3">
          <Users className="w-3 h-3 mr-1" />Character Library
        </Badge>
        <h1 className="text-3xl font-bold text-white mb-2">Characters</h1>
        <p className="text-white/50 text-sm max-w-lg">
          Auto-extracted from your manuscript. Each character has locked reference photos and a voice profile. Assign ElevenLabs voices to enable dialogue in future videos.
        </p>
      </motion.div>

      {/* Storage indicator */}
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
          {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl bg-white/3 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {characters.map((char, i) => (
            <motion.div key={char.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
              <CharacterCard character={char} onUpdate={updateCharacter} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Voice instructions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 p-5 bg-orange-500/5 border border-orange-500/15 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Volume2 className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">How Voice Assignment Works</p>
            <p className="text-xs text-white/50 leading-relaxed">
              1. Click <strong className="text-white/70">Assign</strong> on any character to set their voice attributes. <br />
              2. Copy the generated prompt and paste it into the AI chat — it will show you voice options from the ElevenLabs library. <br />
              3. Pick a voice. The AI will save the Voice ID back to this character automatically. <br />
              4. On your next video, characters will speak their scripted lines in their assigned voices.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
