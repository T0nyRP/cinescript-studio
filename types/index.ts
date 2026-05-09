export interface VoiceProfile {
  id?: string           // ElevenLabs voice ID (assigned via AI chat)
  name?: string         // e.g. "Adam", "Rachel"
  gender?: "male" | "female"
  ageRange?: "young" | "mid" | "senior"
  accent?: string       // "American", "British", "Arabic", etc.
  tone?: string         // "intense", "warm", "authoritative", "clinical"
  previewUrl?: string   // Audio preview URL
  provider?: "elevenlabs" | "minimax"
  // ElevenLabs generation settings (0–100 scale)
  stability?: number          // 65–80 recommended for commanding voices
  similarityBoost?: number    // 75–90 for sharp, authoritative delivery
  styleExaggeration?: number  // 10–25 for subtle intensity
}

export interface VoiceRecommendation {
  id: string            // ElevenLabs voice ID
  name: string
  tone: string          // e.g. "Deep, authoritative, controlled"
  whyItFits: string     // Short fit rationale
  characterFeel: string // e.g. "Confident, decisive"
  rank: number          // 1 = best
  stabilityRange: [number, number]
  similarityRange: [number, number]
  styleRange: [number, number]
}

export interface Character {
  id: string
  name: string
  age: string
  role: string
  appearance: {
    hair: string
    eyes: string
    height: string
    build: string
    distinguishing: string
    clothing: string
  }
  personality: string[]
  voiceStyle: string   // Text description (always present)
  voice?: VoiceProfile // Actual assigned voice (optional, set via chat)
  imageUrl?: string
  referenceImages?: string[]
  manuscriptSource: string
  createdAt: string
}

export interface ShotDialogue {
  characterId: string
  characterName: string
  line: string
  type: "spoken" | "internal" | "narration"
}

export interface Shot {
  id: string
  order: number
  type: "wide" | "medium" | "close-up" | "extreme-close" | "aerial" | "tracking"
  angle: "eye-level" | "low-angle" | "high-angle" | "dutch" | "bird-eye"
  description: string
  duration: number
  characters: string[]
  action: string
  lighting: string
  dialogue?: ShotDialogue[]
  prompt?: string
  imageUrl?: string
  videoUrl?: string
}

export interface Scene {
  id: string
  title: string
  chapter: string
  startLine: number
  endLine: number
  text: string
  summary: string
  actionLevel: "low" | "medium" | "high" | "extreme"
  emotionalTone: string
  location: string
  characters: string[]
  shotBreakdown?: Shot[]
  manuscriptSource?: string  // Which manuscript this scene was extracted from
}

export interface VideoRecord {
  id: string
  title: string
  subtitle: string
  videoUrl: string
  thumbnailUrl: string
  duration: string
  shots: number
  scene: string
  style: string
  characters: string[]
  referenceImages: { name: string; url: string }[]
  generatedAt: string
  facebookReady: boolean
  tags: string[]
  hasVoice?: boolean
}

export interface VideoProject {
  id: string
  title: string
  manuscriptTitle: string
  sceneId: string
  status: "draft" | "generating" | "complete" | "failed"
  style: VideoStyle
  shots: Shot[]
  characters: Character[]
  audioUrl?: string
  finalVideoUrl?: string
  duration: number
  createdAt: string
  facebookReady: boolean
}

export type VideoStyle = "cinematic" | "gritty" | "comic-book" | "realistic" | "noir" | "epic"

export interface Manuscript {
  id: string
  title: string
  author: string
  uploadedAt: string
  text: string
  pdfUrl?: string
  characters: Character[]
  scenes: Scene[]
}

export interface GenerationStatus {
  stage: string
  progress: number
  message: string
  currentShot?: number
  totalShots?: number
}
