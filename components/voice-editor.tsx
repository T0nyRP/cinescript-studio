"use client";

import { useState } from "react";
import { Mic, Volume2, Play, Sliders } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Character } from "@/types";

interface VoiceEditorProps {
  characters: Character[];
}

interface VoiceSettings {
  speed: number;
  pitch: number;
  emotion: string;
  intensity: number;
}

const EMOTIONS = ["Neutral", "Intense", "Calm", "Desperate", "Commanding", "Afraid", "Determined"];

export function VoiceEditor({ characters }: VoiceEditorProps) {
  const [settings, setSettings] = useState<Record<string, VoiceSettings>>(
    Object.fromEntries(
      characters.map((c) => [c.id, { speed: 1.0, pitch: 1.0, emotion: "Intense", intensity: 75 }])
    )
  );
  const [playing, setPlaying] = useState<string | null>(null);

  const updateSetting = (charId: string, key: keyof VoiceSettings, value: number | string) => {
    setSettings((prev) => ({
      ...prev,
      [charId]: { ...prev[charId], [key]: value },
    }));
  };

  const playPreview = (charId: string) => {
    setPlaying(charId);
    setTimeout(() => setPlaying(null), 2500);
  };

  if (characters.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <Mic className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No characters in this scene</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/40 mb-4">
        Fine-tune each character's voice performance. These settings affect all dialogue lines spoken by each character in the final video.
      </p>

      {characters.map((char) => {
        const s = settings[char.id] || { speed: 1.0, pitch: 1.0, emotion: "Intense", intensity: 75 };
        return (
          <div key={char.id} className="bg-white/3 border border-white/8 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{char.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{char.voiceStyle}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-white/15 text-white/50 hover:text-white text-xs h-7 gap-1.5"
                onClick={() => playPreview(char.id)}
                disabled={playing === char.id}
              >
                {playing === char.id ? (
                  <>
                    <Volume2 className="w-3 h-3 animate-pulse text-orange-400" />
                    <span className="text-orange-400">Playing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Preview
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="text-xs text-white/40">Speed</p>
                  <span className="text-xs text-white/60">{s.speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  value={s.speed}
                  onChange={(e) => updateSetting(char.id, "speed", parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-orange-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="text-xs text-white/40">Pitch</p>
                  <span className="text-xs text-white/60">{s.pitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  value={s.pitch}
                  onChange={(e) => updateSetting(char.id, "pitch", parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs text-white/40 mb-2">Emotional Delivery</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOTIONS.map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => updateSetting(char.id, "emotion", emotion)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      s.emotion === emotion
                        ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                        : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                    }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <p className="text-xs text-white/40">Emotional Intensity</p>
                <span className="text-xs text-white/60">{s.intensity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={s.intensity}
                onChange={(e) => updateSetting(char.id, "intensity", parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-orange-500 cursor-pointer"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
