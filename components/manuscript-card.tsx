"use client";

import { BookOpen, Users, Film, FileText, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Manuscript } from "@/types";
import Link from "next/link";

interface ManuscriptCardProps {
  manuscript: Manuscript;
}

export function ManuscriptCard({ manuscript }: ManuscriptCardProps) {
  return (
    <div className="bg-gradient-to-r from-white/3 to-white/1 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
      <div className="flex items-start gap-5">
        {/* Book icon */}
        <div className="w-14 h-18 min-w-[56px] rounded-lg bg-gradient-to-br from-orange-500/30 to-red-600/30 border border-orange-500/30 flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-orange-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{manuscript.title}</h3>
              <p className="text-sm text-white/50 mt-0.5">by {manuscript.author}</p>
            </div>
            <Badge className="bg-green-500/15 text-green-400 border border-green-500/20 text-xs flex-shrink-0">
              Analyzed
            </Badge>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{manuscript.characters.length} characters</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Film className="w-3.5 h-3.5 text-orange-400" />
              <span>{manuscript.scenes.length} scenes</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <FileText className="w-3.5 h-3.5 text-white/30" />
              <span>PDF loaded</span>
            </div>
          </div>

          {/* Character previews */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {manuscript.characters.slice(0, 4).map((char) => (
              <span key={char.id} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/60">
                {char.name}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/scenes">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8">
                Select Scene
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            <Link href="/characters">
              <Button size="sm" variant="outline" className="border-white/15 text-white/60 hover:text-white hover:border-white/30 text-xs h-8">
                View Characters
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
