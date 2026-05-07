import type { Character, Scene, VideoRecord, Manuscript } from "@/types"

export const EMBER_CHARACTERS: Character[] = [
  {
    id: "jace-maddox",
    name: "Jace Maddox",
    age: "21",
    role: "Protagonist / ORION Agent Codename: EMBER",
    appearance: {
      hair: "Blond, slightly unkempt, tends to hang across forehead",
      eyes: "Blue, intense — piercing intelligence with dark circles from sleep deprivation",
      height: "6'4\" — tall and lean",
      build: "Thin, wiry — the build of someone who forgets to eat when focused",
      distinguishing: "Genius-level intensity in his gaze; neural interface port behind left ear post-surgery; moves with trained precision after SYNAPSE integration",
      clothing: "Tactical black gear on missions; off-mission: worn jeans, graphic tees, sneakers"
    },
    personality: ["Brilliant", "Impulsive", "Ethically driven", "Self-sacrificing", "Sarcastic humor under pressure", "Deeply loyal"],
    voiceStyle: "Young male, American, intelligent and intense — calm under fire but with raw emotion when stakes are personal",
    imageUrl: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/918a05f01df6412a8c67422987284e77.jpg",
    referenceImages: [
      "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/abcbf619919547e8bfbe594a64a7d7bf.jpg",
      "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/be96639f659b464bb00e184bbe94ec25.jpg",
      "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/918a05f01df6412a8c67422987284e77.jpg"
    ],
    manuscriptSource: "CODENAME: EMBER — Book 1: The Istanbul Protocol",
    createdAt: new Date().toISOString()
  },
  {
    id: "alex-torres",
    name: "Alex Torres",
    age: "28",
    role: "Senior ORION Agent / Jace's partner",
    appearance: {
      hair: "Dark, military-cut, close-cropped",
      eyes: "Dark, sharp — catalogues every detail instantly",
      height: "Tall, powerfully built",
      build: "Heavily muscled, military-trained physique",
      distinguishing: "Scar along left jawline; neural interface port behind left ear; moves with precise, controlled efficiency",
      clothing: "Black tactical gear on missions; casual confidence off-duty"
    },
    personality: ["Calm under fire", "Darkly humorous", "Deeply loyal", "Haunted by past loss", "Tactically brilliant", "Protects those he leads"],
    voiceStyle: "Deep male, American, commanding but warm — dry wit, military precision",
    imageUrl: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/bbd0c74c9dea4dd0af8305995871f2a9.jpg",
    referenceImages: [
      "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/bbd0c74c9dea4dd0af8305995871f2a9.jpg"
    ],
    manuscriptSource: "CODENAME: EMBER — Book 1: The Istanbul Protocol",
    createdAt: new Date().toISOString()
  },
  {
    id: "omar-al-rashid",
    name: "Omar Al-Rashid",
    age: "45",
    role: "Primary Antagonist — terrorist AI researcher",
    appearance: {
      hair: "Dark, greying at temples, neatly groomed",
      eyes: "Cold, calculating — the eyes of someone who sees people as tools",
      height: "Average height, commanding presence",
      build: "Lean, precise movements — controlled danger",
      distinguishing: "Impeccably dressed even in operational settings; always calculating",
      clothing: "Dark professional attire; Prometheus neural control hardware concealed"
    },
    personality: ["Brilliant", "Ruthless", "Ideologically driven", "Coldly logical", "Sees consent as weakness"],
    voiceStyle: "Mid-range male, Arabic accent, precise and controlled — philosophical menace",
    imageUrl: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/615fce761d554bcbaf92ec2a7f04b442.jpg",
    referenceImages: [
      "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/615fce761d554bcbaf92ec2a7f04b442.jpg"
    ],
    manuscriptSource: "CODENAME: EMBER — Book 1: The Istanbul Protocol",
    createdAt: new Date().toISOString()
  },
  {
    id: "dr-sarah-chen",
    name: "Dr. Sarah Chen",
    age: "35",
    role: "Lead SYNAPSE Scientist / Neural Integration Expert",
    appearance: {
      hair: "Dark black, pulled back in a practical ponytail",
      eyes: "Dark, sharp — clinical and perceptive",
      height: "Average height, poised",
      build: "Slender, moves with precise purpose",
      distinguishing: "Always in white lab coat; often surrounded by holographic neural displays",
      clothing: "White lab coat over casual clothes; practical and precise"
    },
    personality: ["Brilliant", "Cautious", "Deeply caring beneath clinical exterior", "Perfectionist", "Haunted by past failures"],
    voiceStyle: "Female, slight Chinese-American accent, precise and thoughtful — warmth beneath professionalism",
    imageUrl: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/4d6842b3a4994ce99881b003c6c1107c.jpg",
    referenceImages: [
      "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/4d6842b3a4994ce99881b003c6c1107c.jpg"
    ],
    manuscriptSource: "CODENAME: EMBER — Book 1: The Istanbul Protocol",
    createdAt: new Date().toISOString()
  }
]

export const EMBER_SCENES: Scene[] = [
  {
    id: "scene-ch6-infiltration",
    title: "The Istanbul Warehouse Raid",
    chapter: "Chapter 6: The Infiltration",
    startLine: 1995,
    endLine: 2232,
    text: "The final briefing was short and direct. At 0130 hours, they geared up in silence. Jace felt SYNAPSE like a steady flame. They moved through empty streets like shadows. At exactly 0200 hours, the lights went out.",
    summary: "Jace and Torres infiltrate an Istanbul warehouse to rescue civilians from forced AI integration and destroy the Prometheus system.",
    actionLevel: "extreme",
    emotionalTone: "Tense, triumphant, morally complex",
    location: "Istanbul, Turkey — Industrial warehouse basement, 0200 hours",
    characters: ["jace-maddox", "alex-torres", "omar-al-rashid"],
    shotBreakdown: [
      { id: "shot-1", order: 1, type: "aerial", angle: "bird-eye", description: "Istanbul at night — the Bosphorus shimmering, two tiny black-clad figures moving through empty cobblestone streets toward a dark industrial warehouse.", duration: 10, characters: ["jace-maddox", "alex-torres"], action: "Two agents approach target warehouse", lighting: "Night — ambient city glow, deep shadows", dialogue: [] },
      { id: "shot-2", order: 2, type: "tracking", angle: "low-angle", description: "Ground level — boots moving silently over wet glistening cobblestones, the massive warehouse looming ahead.", duration: 10, characters: ["jace-maddox", "alex-torres"], action: "Tactical approach to perimeter", lighting: "Moonlit, long shadows", dialogue: [{ characterId: "alex-torres", characterName: "Torres", line: "Power's out in thirty. Stay on my six.", type: "spoken" }] },
      { id: "shot-3", order: 3, type: "medium", angle: "eye-level", description: "City plunges into darkness. Jace activates SYNAPSE — eyes glow electric blue-white, thermal HUD overlay appearing.", duration: 10, characters: ["jace-maddox"], action: "Power cut activates, SYNAPSE enhanced vision online", lighting: "Total darkness → SYNAPSE thermal overlay", dialogue: [{ characterId: "jace-maddox", characterName: "Jace", line: "SYNAPSE. Full spectrum.", type: "internal" }] },
      { id: "shot-4", order: 4, type: "wide", angle: "eye-level", description: "Basement chamber reveal — rows of integration chairs with restrained civilians, four guards, Al-Rashid at a terminal.", duration: 10, characters: ["omar-al-rashid"], action: "Horror of the Prometheus operation revealed", lighting: "Cold fluorescent, blue-tinted", dialogue: [] },
      { id: "shot-5", order: 5, type: "wide", angle: "low-angle", description: "Breach — Jace and Torres explode through the door in perfect synchronized movement. Red emergency lighting strobes.", duration: 10, characters: ["jace-maddox", "alex-torres"], action: "Simultaneous door breach", lighting: "Emergency red lighting, muzzle flashes", dialogue: [{ characterId: "alex-torres", characterName: "Torres", line: "Go, go, go!", type: "spoken" }] },
      { id: "shot-6", order: 6, type: "close-up", angle: "low-angle", description: "Al-Rashid's hand moves to his belt — thumb pressing the dead man's switch. Red alarm strobes begin. His lips curl into a cold smile.", duration: 10, characters: ["omar-al-rashid"], action: "Al-Rashid activates Prometheus automated defense", lighting: "Red alarm strobe begins", dialogue: [{ characterId: "omar-al-rashid", characterName: "Al-Rashid", line: "You're too late, Mr. Maddox.", type: "spoken" }] },
      { id: "shot-7", order: 7, type: "extreme-close", angle: "dutch", description: "Jace's hand slams onto the neural interface terminal. Eyes roll back — cascades of electric blue digital light flood his irises. SYNAPSE surges forward.", duration: 10, characters: ["jace-maddox"], action: "Full SYNAPSE integration — consciousness merges with Prometheus", lighting: "Electric blue neural glow consuming frame", dialogue: [{ characterId: "jace-maddox", characterName: "Jace", line: "SYNAPSE — everything you've got.", type: "internal" }] },
      { id: "shot-8", order: 8, type: "wide", angle: "high-angle", description: "Abstract digital battle — SYNAPSE (warm gold light) vs Prometheus (cold blue ice). Corruption bars climb. 89%... 97%... 100%. Gold consumes everything.", duration: 10, characters: ["jace-maddox"], action: "SYNAPSE destroys Prometheus — 100% corruption complete", lighting: "Abstract digital — gold vs cold blue", dialogue: [] }
    ]
  },
  {
    id: "scene-ch1-lab",
    title: "The MIT Lab Breakdown",
    chapter: "Chapter 1: The Recruitment",
    startLine: 41,
    endLine: 200,
    text: "At 3:47 AM, campus security found Jace Maddox in the ruins of Professor Harrison's AI laboratory.",
    summary: "Jace destroys a flawed defense AI to prove its fatal ethical failures, setting his entire life on a new path.",
    actionLevel: "medium",
    emotionalTone: "Intense, defiant, consequential",
    location: "MIT Campus — AI Laboratory, 3:47 AM",
    characters: ["jace-maddox"]
  },
  {
    id: "scene-ch5-briefing",
    title: "Istanbul Mission Briefing",
    chapter: "Chapter 5: The Istanbul Protocol",
    startLine: 1644,
    endLine: 1994,
    text: "The final briefing was short and direct. Jace sat in the safe house tactical room.",
    summary: "Final mission briefing. Jace and Torres receive their orders — a black operation with no backup.",
    actionLevel: "medium",
    emotionalTone: "Tense anticipation, moral weight, quiet resolve",
    location: "Istanbul, Turkey — ORION Safe House",
    characters: ["jace-maddox", "alex-torres"]
  },
  {
    id: "scene-ch7-confrontation",
    title: "The Confrontation & Escape",
    chapter: "Chapter 7: Confrontation",
    startLine: 2232,
    endLine: 2500,
    text: "Twenty hostiles upstairs responding to alarms. Building must be destroyed.",
    summary: "After destroying Prometheus, Jace and Torres battle through 20 hostiles to escape with six rescued civilians.",
    actionLevel: "extreme",
    emotionalTone: "Desperate, fierce, victorious",
    location: "Istanbul warehouse — all levels, escape route",
    characters: ["jace-maddox", "alex-torres"]
  }
]

export const DEFAULT_VIDEOS: VideoRecord[] = [
  {
    id: "v2",
    title: "The Istanbul Warehouse Raid",
    subtitle: "Reference-consistent 8-shot cinematic cut",
    videoUrl: "https://galaxy-prod.tlcdn.com/gen/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/83e3d5d3-e3fa-49e9-848d-d133ad579c25.mp4",
    thumbnailUrl: "https://galaxy-prod.tlcdn.com/gen/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/c3fee0ee-ed41-44b0-975d-697d6d7dfe7f.png",
    duration: "1:13",
    shots: 8,
    scene: "Chapter 6: The Infiltration",
    style: "Cinematic",
    characters: ["Jace Maddox", "Alex Torres", "Omar Al-Rashid"],
    referenceImages: [
      { name: "Jace Maddox", url: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/918a05f01df6412a8c67422987284e77.jpg" },
      { name: "Alex Torres", url: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/bbd0c74c9dea4dd0af8305995871f2a9.jpg" },
      { name: "Omar Al-Rashid", url: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/615fce761d554bcbaf92ec2a7f04b442.jpg" }
    ],
    generatedAt: new Date().toISOString(),
    facebookReady: true,
    tags: ["Action", "Istanbul", "SYNAPSE", "AI Battle", "Reference-Locked"],
    hasVoice: false
  }
]

export const EMBER_MANUSCRIPT: Manuscript = {
  id: "codename-ember-1",
  title: "CODENAME: EMBER — Book 1: The Istanbul Protocol",
  author: "Jaxon Steele",
  uploadedAt: new Date().toISOString(),
  text: "",
  pdfUrl: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/e716535da52948ad8e5e6a8f4549c9be.pdf",
  characters: EMBER_CHARACTERS,
  scenes: EMBER_SCENES
}
