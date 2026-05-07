"use client";

import { useState } from "react";
import { User, Mic, ChevronDown, ChevronUp, Check, Images, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";

interface CharacterCardProps {
  character: Character;
  isSelected?: boolean;
  onSelect?: () => void;
}

const roleColors: Record<string, string> = {
  "Protagonist": "orange",
  "Senior ORION Agent": "blue",
  "Primary Antagonist": "red",
  "Lead SYNAPSE Scientist": "purple",
};

function getRoleColor(role: string) {
  for (const [key, color] of Object.entries(roleColors)) {
    if (role.includes(key.split(" ")[0])) return color;
  }
  return "gray";
}

export function CharacterCard({ character, isSelected, onSelect }: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeRef, setActiveRef] = useState(0);
  const color = getRoleColor(character.role);
  const refs = character.referenceImages ?? (character.imageUrl ? [character.imageUrl] : []);

  const colorClasses = {
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", badge: "bg-orange-500/15 text-orange-400 border-orange-500/20", icon: "bg-orange-500/20", iconColor: "text-orange-400", dot: "bg-orange-400", ring: "ring-orange-500/40" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", badge: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: "bg-blue-500/20", iconColor: "text-blue-400", dot: "bg-blue-400", ring: "ring-blue-500/40" },
    red: { bg: "bg-red-500/10", border: "border-red-500/20", badge: "bg-red-500/15 text-red-400 border-red-500/20", icon: "bg-red-500/20", iconColor: "text-red-400", dot: "bg-red-400", ring: "ring-red-500/40" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", badge: "bg-purple-500/15 text-purple-400 border-purple-500/20", icon: "bg-purple-500/20", iconColor: "text-purple-400", dot: "bg-purple-400", ring: "ring-purple-500/40" },
    gray: { bg: "bg-white/5", border: "border-white/10", badge: "bg-white/10 text-white/50 border-white/10", icon: "bg-white/10", iconColor: "text-white/50", dot: "bg-white/40", ring: "ring-white/20" },
  };
  const c = colorClasses[color as keyof typeof colorClasses];

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all cursor-pointer",
        c.bg, c.border,
        isSelected && "ring-1 ring-white/30"
      )}
      onClick={onSelect}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Reference image / avatar */}
          {refs.length > 0 ? (
            <div className="relative flex-shrink-0">
              {/* Main reference photo */}
              <div className={cn("w-16 h-16 rounded-xl overflow-hidden ring-2", c.ring)}>
                <img
                  src={refs[activeRef]}
                  alt={`${character.name} reference`}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {/* Multi-ref indicator */}
              {refs.length > 1 && (
                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                  {refs.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setActiveRef(i); }}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === activeRef ? c.dot : "bg-white/20 hover:bg-white/40"
                      )}
                    />
                  ))}
                </div>
              )}
              {/* Lock badge */}
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500/90 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M3 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="1.5" y="5" width="9" height="6.5" rx="1.5" fill="currentColor" opacity="0.3"/>
                  <rect x="1.5" y="5" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="6" cy="8.25" r="1" fill="currentColor"/>
                </svg>
              </div>
            </div>
          ) : (
            <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0", c.icon)}>
              <User className={cn("w-7 h-7", c.iconColor)} />
            </div>
          )}

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="text-sm font-bold text-white">{character.name}</h3>
                <p className="text-xs text-white/40">Age: {character.age}</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <Badge className={cn("text-xs border", c.badge)}>{character.role.split(" / ")[0]}</Badge>
            {refs.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1">
                <Images className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">{refs.length} reference{refs.length > 1 ? "s" : ""} locked</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick appearance */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: "Hair", value: character.appearance.hair.split(",")[0] },
            { label: "Eyes", value: character.appearance.eyes.split(",")[0] },
            { label: "Build", value: character.appearance.build.split(",")[0] },
            { label: "Height", value: character.appearance.height },
          ].map((item) => (
            <div key={item.label} className="bg-black/20 rounded-lg px-3 py-2">
              <p className="text-xs text-white/30 mb-0.5">{item.label}</p>
              <p className="text-xs text-white/70 font-medium truncate">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Voice */}
        <div className="mt-3 flex items-start gap-2 p-3 bg-black/20 rounded-lg">
          <Mic className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-white/30 mb-0.5">Voice Style</p>
            <p className="text-xs text-white/60">{character.voiceStyle}</p>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Hide details" : "Show full profile"}
        </button>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
          {/* All reference images strip */}
          {refs.length > 1 && (
            <div>
              <p className="text-xs text-white/30 mb-2">Reference Photos</p>
              <div className="flex gap-2">
                {refs.map((url, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveRef(i); }}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden ring-1 transition-all",
                      i === activeRef ? `ring-2 ${c.ring}` : "ring-white/10 hover:ring-white/25"
                    )}
                  >
                    <img src={url} alt={`Ref ${i + 1}`} className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-white/30 mb-2">Personality Traits</p>
            <div className="flex flex-wrap gap-1.5">
              {character.personality.map((trait) => (
                <span key={trait} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/60">
                  {trait}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-white/30 mb-2">Distinguishing Features</p>
            <p className="text-xs text-white/60 leading-relaxed">{character.appearance.distinguishing}</p>
          </div>
          <div>
            <p className="text-xs text-white/30 mb-2">Typical Clothing</p>
            <p className="text-xs text-white/60 leading-relaxed">{character.appearance.clothing}</p>
          </div>
        </div>
      )}
    </div>
  );
}
