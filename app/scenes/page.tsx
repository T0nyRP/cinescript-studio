"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Zap, MapPin, Users, ChevronRight, Loader2, Inbox, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScenes, useCharacters } from "@/hooks/use-data-store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Scene, Character } from "@/types";

const actionLevelConfig = {
  low: { label: "Low Action", color: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/20", dot: "bg-green-400" },
  medium: { label: "Medium Action", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/20", dot: "bg-yellow-400" },
  high: { label: "High Action", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/20", dot: "bg-orange-400" },
  extreme: { label: "Extreme Action", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/20", dot: "bg-red-400" },
};

const EMBER_SOURCE = "CODENAME: EMBER — Book 1: The Istanbul Protocol";

function SceneDetail({ scene, charMap }: { scene: Scene; charMap: Map<string, string> }) {
  const levelCfg = actionLevelConfig[scene.actionLevel] ?? actionLevelConfig.medium;
  return (
    <motion.div
      key={scene.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="col-span-3 bg-white/3 border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">{scene.title}</h2>
          <p className="text-xs text-white/40">{scene.chapter}</p>
          {scene.manuscriptSource && (
            <p className="text-xs text-orange-400/60 mt-0.5 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />{scene.manuscriptSource}
            </p>
          )}
        </div>
        <Badge className={cn("text-xs border flex-shrink-0", levelCfg.bg, levelCfg.color, levelCfg.border)}>
          {levelCfg.label}
        </Badge>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-black/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-white/30" />
            <p className="text-xs text-white/30">Location</p>
          </div>
          <p className="text-xs text-white/70">{scene.location}</p>
        </div>
        <div className="bg-black/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-white/30" />
            <p className="text-xs text-white/30">Tone</p>
          </div>
          <p className="text-xs text-white/70">{scene.emotionalTone}</p>
        </div>
      </div>

      {/* Characters */}
      {scene.characters && scene.characters.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-white/30" />
            <p className="text-xs text-white/40">Characters in scene</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {scene.characters.map((charId) => (
              <span key={charId} className="text-xs bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full text-blue-300">
                {charMap.get(charId) ?? charId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-5">
        <p className="text-xs text-white/30 mb-2">Scene Summary</p>
        <p className="text-sm text-white/70 leading-relaxed">{scene.summary}</p>
      </div>

      {/* Shot breakdown */}
      {scene.shotBreakdown && scene.shotBreakdown.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <Film className="w-3.5 h-3.5 text-orange-400" />
            <p className="text-xs text-white/40">
              Director&apos;s Shot Breakdown ({scene.shotBreakdown.length} shots)
            </p>
          </div>
          <div className="space-y-2">
            {scene.shotBreakdown.map((shot) => (
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
      <Link href={`/generate?scene=${scene.id}`}>
        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
          Generate Video from This Scene
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
}

function ManuscriptGroup({
  title,
  scenes,
  selectedSceneId,
  onSelect,
  defaultOpen,
}: {
  title: string;
  scenes: Scene[];
  selectedSceneId: string;
  onSelect: (id: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      {/* Group header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left mb-1"
      >
        <BookOpen className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-white/70 flex-1 truncate">{title}</span>
        <span className="text-xs text-white/30 flex-shrink-0">{scenes.length} scene{scenes.length !== 1 ? "s" : ""}</span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pl-1">
              {scenes.map((scene, i) => {
                const levelCfg = actionLevelConfig[scene.actionLevel] ?? actionLevelConfig.medium;
                const isSelected = selectedSceneId === scene.id;
                return (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => onSelect(scene.id)}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ScenesPage() {
  const { scenes, loading } = useScenes();
  const { characters } = useCharacters();
  const charMap = new Map<string, string>(characters.map((c) => [c.id, c.name]));
  const [selectedSceneId, setSelectedSceneId] = useState<string>("");

  // Once scenes finish loading, auto-select the first one
  useEffect(() => {
    if (!loading && scenes.length > 0 && !selectedSceneId) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [loading, scenes, selectedSceneId]);

  const selected = scenes.find((s) => s.id === selectedSceneId);

  // Group scenes by manuscriptSource
  const groups = scenes.reduce<Record<string, Scene[]>>((acc, scene) => {
    const key = scene.manuscriptSource ?? EMBER_SOURCE;
    if (!acc[key]) acc[key] = [];
    acc[key].push(scene);
    return acc;
  }, {});
  const groupKeys = Object.keys(groups);
  const isGrouped = groupKeys.length > 1;

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
          {/* Scene list — grouped or flat */}
          <div className="col-span-2 overflow-y-auto max-h-[80vh] pr-1">
            {isGrouped ? (
              groupKeys.map((key, gi) => (
                <ManuscriptGroup
                  key={key}
                  title={key}
                  scenes={groups[key]}
                  selectedSceneId={selectedSceneId}
                  onSelect={setSelectedSceneId}
                  defaultOpen={gi === 0}
                />
              ))
            ) : (
              // Single source — flat list (no group header)
              <div className="space-y-3">
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
            )}
          </div>

          {/* Scene detail */}
          {selected && <SceneDetail scene={selected} charMap={charMap} />}
        </div>
      )}
    </div>
  );
}
