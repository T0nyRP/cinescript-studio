"use client";

import { BookOpen, Users, Film, FileText, ChevronRight, AlignLeft, Zap, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Manuscript } from "@/types";
import Link from "next/link";

interface ManuscriptCardProps {
  manuscript: Manuscript;
  isAnalyzing?: boolean;
  onAnalyze?: () => void;
}

export function ManuscriptCard({ manuscript, isAnalyzing = false, onAnalyze }: ManuscriptCardProps) {
  const hasAnalysis = manuscript.characters.length > 0 || manuscript.scenes.length > 0;
  const wordCount = manuscript.text
    ? Math.round(manuscript.text.split(/\s+/).filter(Boolean).length)
    : 0;
  const uploadedDate = manuscript.uploadedAt
    ? new Date(manuscript.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className={`bg-gradient-to-r from-white/3 to-white/1 border rounded-2xl p-6 transition-all ${
      isAnalyzing ? "border-orange-500/40 bg-orange-500/3" : "border-white/10 hover:border-white/20"
    }`}>
      <div className="flex items-start gap-5">
        {/* Icon */}
        <div className={`w-14 h-14 min-w-[56px] rounded-lg border flex items-center justify-center ${
          isAnalyzing
            ? "bg-orange-500/20 border-orange-500/40"
            : "bg-gradient-to-br from-orange-500/30 to-red-600/30 border-orange-500/30"
        }`}>
          {isAnalyzing
            ? <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
            : <BookOpen className="w-7 h-7 text-orange-400" />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{manuscript.title}</h3>
              {manuscript.author && manuscript.author !== "Unknown" && (
                <p className="text-sm text-white/50 mt-0.5">by {manuscript.author}</p>
              )}
              {uploadedDate && (
                <p className="text-xs text-white/30 mt-0.5">Added {uploadedDate}</p>
              )}
            </div>
            <Badge className={
              isAnalyzing
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs flex-shrink-0"
                : hasAnalysis
                  ? "bg-green-500/15 text-green-400 border border-green-500/20 text-xs flex-shrink-0"
                  : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 text-xs flex-shrink-0"
            }>
              {isAnalyzing ? "Analyzing…" : hasAnalysis ? "✓ Analyzed" : "Uploaded"}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {hasAnalysis && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>{manuscript.characters.length} characters</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <Film className="w-3.5 h-3.5 text-orange-400" />
                  <span>{manuscript.scenes.length} scenes</span>
                </div>
              </>
            )}
            {wordCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <AlignLeft className="w-3.5 h-3.5 text-white/30" />
                <span>{wordCount.toLocaleString()} words</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <FileText className="w-3.5 h-3.5 text-white/30" />
              <span>Text ready</span>
            </div>
          </div>

          {/* Character tags */}
          {manuscript.characters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {manuscript.characters.slice(0, 5).map((char, i) => (
                <span key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/60">
                  {char.name}
                </span>
              ))}
            </div>
          )}

          {/* Analyzing progress text */}
          {isAnalyzing && (
            <p className="text-xs text-orange-400/70 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              AI is reading your manuscript and building character profiles and scene breakdowns…
            </p>
          )}

          {/* Text preview if not analyzed */}
          {!hasAnalysis && !isAnalyzing && manuscript.text && (
            <p className="text-xs text-white/30 mb-4 line-clamp-2 leading-relaxed">
              {manuscript.text.slice(0, 220)}…
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasAnalysis ? (
              <>
                <Link href="/scenes">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8">
                    Select Scene <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
                <Link href="/characters">
                  <Button size="sm" variant="outline" className="border-white/15 text-white/60 hover:text-white hover:border-white/30 text-xs h-8">
                    <Users className="w-3 h-3 mr-1" />Characters
                  </Button>
                </Link>
                <Link href="/generate">
                  <Button size="sm" variant="outline" className="border-white/15 text-white/60 hover:text-white hover:border-white/30 text-xs h-8">
                    <Zap className="w-3 h-3 mr-1" />Generate
                  </Button>
                </Link>
              </>
            ) : !isAnalyzing && onAnalyze ? (
              <>
                <Button
                  size="sm"
                  onClick={onAnalyze}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Analyze with AI
                </Button>
                <Link href="/generate">
                  <Button size="sm" variant="outline" className="border-white/15 text-white/60 hover:text-white hover:border-white/30 text-xs h-8">
                    <Zap className="w-3 h-3 mr-1" />Generate Brief
                  </Button>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
