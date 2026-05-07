"use client";

import { cn } from "@/lib/utils";
import type { VideoStyle } from "@/types";

interface StyleSelectorProps {
  selectedStyle: VideoStyle;
  onSelect: (style: VideoStyle) => void;
}

const styles: { id: VideoStyle; label: string; description: string; emoji: string; palette: string[] }[] = [
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Hollywood blockbuster lighting, dramatic depth of field",
    emoji: "🎬",
    palette: ["#1a1a2e", "#e8b86d", "#c0c0c0"],
  },
  {
    id: "gritty",
    label: "Gritty",
    description: "High contrast, desaturated, raw and intense",
    emoji: "⚡",
    palette: ["#1c1c1c", "#8b0000", "#cccccc"],
  },
  {
    id: "epic",
    label: "Epic",
    description: "Grand scale, sweeping vistas, mythic tone",
    emoji: "🔥",
    palette: ["#0d0d1a", "#ff6b35", "#ffd700"],
  },
  {
    id: "realistic",
    label: "Hyper-Realistic",
    description: "Photorealistic rendering, documentary feel",
    emoji: "📷",
    palette: ["#2d2d2d", "#4a7c59", "#e8e8e8"],
  },
  {
    id: "noir",
    label: "Neo-Noir",
    description: "Deep shadows, rain-slicked streets, moody",
    emoji: "🌧️",
    palette: ["#0a0a0a", "#1a3a5c", "#c8c8c8"],
  },
  {
    id: "comic-book",
    label: "Comic Book",
    description: "Bold colors, strong outlines, graphic-novel style",
    emoji: "💥",
    palette: ["#ffffff", "#ff0000", "#0000ff"],
  },
];

export function StyleSelector({ selectedStyle, onSelect }: StyleSelectorProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">Visual Style</h3>
      <div className="grid grid-cols-3 gap-2.5">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={cn(
              "relative rounded-xl border p-3 text-left transition-all hover:scale-[1.02]",
              selectedStyle === style.id
                ? "border-orange-500/50 bg-orange-500/10"
                : "border-white/8 bg-white/3 hover:border-white/15"
            )}
          >
            {/* Color palette preview */}
            <div className="flex gap-1 mb-2.5">
              {style.palette.map((color, i) => (
                <div
                  key={i}
                  className="h-3 flex-1 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-sm mb-0.5">
              <span className="mr-1.5">{style.emoji}</span>
              <span className={cn("font-semibold", selectedStyle === style.id ? "text-orange-300" : "text-white")}>
                {style.label}
              </span>
            </p>
            <p className="text-xs text-white/40 leading-tight">{style.description}</p>
            {selectedStyle === style.id && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
