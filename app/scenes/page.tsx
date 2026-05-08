"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Film, Zap, MapPin, Users, ChevronRight, Loader2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScenes } from "@/hooks/use-data-store";
import { cn } from "@/lib/utils";
import Link from "next/link";

const actionLevelConfig = {
  low: { label: "Low Action", color: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/20", dot: "bg-green-400" },
  medium: { label: "Medium Action", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/20", dot: "bg-yellow-400" },
  high: { label: "High Action", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/20", dot: "bg-orange-400" },
  extreme: { label: "Extreme Action", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/20", dot: "bg-red-400" },
};

export default function ScenesPage() {
  const { scenes, loading } = useScenes();
  const [selectedSceneId, setSelectedSceneId] = useState<string>("");

  // Once scenes finish loading, auto-select the first one
  useEffect(() => {
    if (!loading && scenes.length > 0 && !selectedSceneId) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [loading, scenes, selectedSceneId]);

  const selected = scenes.find((s) => s.id === selectedSceneId);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs mb-3">
          <Film className="w-3 h-3 mr-1" />
          Scene Selector
        </Badge>
        <h1 className="text-3xl font-bold text-white mb-2">Choose Your Scene</h1>
        <p className="text-white/50 text-sm max-w-lg">
          Pick which part of your manuscript becomes the 2-minute cinematic video. Each scene has been analyzed for action level, emotional tone, and shot potential.
        </p>
      </motion.div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="col-span-3 h-96 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        </div>
      )}

      {/* Empty state — no scenes yet */}
      {!loading && scenes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-white/20" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No scenes yet</h2>
          <p className="text-white/40 text-sm max-w-sm mb-6">
            Upload a manuscript and run AI analysis to extract action scenes. They&apos;ll appear here automatically.
          </p>
          <Link href="/">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm">
              Go to Manuscripts
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Scene list + detail */}
      {!loading && scenes.length > 0 && (
        <div className="grid grid-cols-5 gap-6">
          {/* Scene list */}
          <div className="col-span-2 space-y-3">
            {scenes.map((scene, i) => {
              const levelCfg = actionLevelConfig[scene.actionLevel] ?? actionLevelConfig.medium;
              const isSelected = selectedSceneId === scene.id;
              return (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setSelectedSceneId(scene.id)}
                  className={cn(
                    "rounded-xl border p-4 cursor-pointer transition-all",
                    isSelected
                      ? "border-orange-500/40 bg-orange-500/10"
                      : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", levelCfg.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{scene.title}</p>
                      <p className="text-xs text-white/40 mb-2">{scene.chapter}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs border", levelCfg.bg, levelCfg.color, levelCfg.border)}>
                          {levelCfg.label}
                        </Badge>
                        {scene.shotBreakdown && (
                          <span className="text-xs text-white/30">{scene.shotBreakdown.length} shots</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Scene detail */}
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="col-span-3 bg-white/3 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">{selected.title}</h2>
                  <p className="text-xs text-white/40">{selected.chapter}</p>
                </div>
                {(() => {
                  const cfg = actionLevelConfig[selected.actionLevel] ?? actionLevelConfig.medium;
                  return (
                    <Badge className={cn("text-xs border", cfg.bg, cfg.color, cfg.border)}>
                      {cfg.label}
                    </Badge>
                  );
                })()}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-white/30" />
                    <p className="text-xs text-white/30">Location</p>
                  </div>
                  <p className="text-xs text-white/70">{selected.location}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-white/30" />
                    <p className="text-xs text-white/30">Tone</p>
                  </div>
                  <p className="text-xs text-white/70">{selected.emotionalTone}</p>
                </div>
              </div>

              {/* Characters */}
              {selected.characters && selected.characters.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users className="w-3.5 h-3.5 text-white/30" />
                    <p className="text-xs text-white/40">Characters in scene</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.characters.map((charId) => (
                      <span key={charId} className="text-xs bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full text-blue-300">
                        {charId.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mb-5">
                <p className="text-xs text-white/30 mb-2">Scene Summary</p>
                <p className="text-sm text-white/70 leading-relaxed">{selected.summary}</p>
              </div>

              {/* Shot breakdown */}
              {selected.shotBreakdown && selected.shotBreakdown.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Film className="w-3.5 h-3.5 text-orange-400" />
                    <p className="text-xs text-white/40">
                      Director&apos;s Shot Breakdown ({selected.shotBreakdown.length} shots)
                    </p>
                  </div>
                  <div className="space-y-2">
                    {selected.shotBreakdown.map((shot) => (
                      <div key={shot.id} className="flex items-start gap-3 bg-black/20 rounded-lg p-3">
                        <div className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-400">
                          {shot.order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-white/80">{shot.type?.toUpperCase()}</span>
                            <span className="text-xs text-white/30">·</span>
                            <span className="text-xs text-white/40">{shot.angle}</span>
                            <span className="text-xs text-white/30 ml-auto">{shot.duration}s</span>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed">{shot.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <Link href={`/generate?scene=${selected.id}`}>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Generate Video from This Scene
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
