"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, BookOpen, Zap, Users, Film, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EMBER_CHARACTERS, EMBER_SCENES } from "@/lib/manuscript-data";
import { EMBER_MANUSCRIPT } from "@/lib/default-data";
import Link from "next/link";
import { ManuscriptCard } from "@/components/manuscript-card";

export default function ManuscriptsPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs">
            <Zap className="w-3 h-3 mr-1" />
            AI-Powered Studio
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Manuscript Studio</h1>
        <p className="text-white/50 text-base max-w-xl">
          Transform your manuscript into a 2-minute cinematic action video. Upload a PDF or paste your text to extract characters, scenes, and generate Facebook-ready video content.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        {[
          { label: "Characters Extracted", value: EMBER_MANUSCRIPT.characters.length.toString(), icon: Users, color: "blue" },
          { label: "Scenes Available", value: EMBER_MANUSCRIPT.scenes.length.toString(), icon: Film, color: "orange" },
          { label: "Manuscripts Loaded", value: "1", icon: BookOpen, color: "green" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stat.color === "blue" ? "bg-blue-500/15" :
              stat.color === "orange" ? "bg-orange-500/15" : "bg-green-500/15"
            }`}>
              <stat.icon className={`w-5 h-5 ${
                stat.color === "blue" ? "text-blue-400" :
                stat.color === "orange" ? "text-orange-400" : "text-green-400"
              }`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-orange-500 bg-orange-500/10"
              : "border-white/10 hover:border-white/20 bg-white/2 hover:bg-white/4"
          }`}
        >
          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
              <p className="text-white font-medium">Analyzing manuscript...</p>
              <p className="text-white/40 text-sm">Extracting characters, scenes, and action sequences</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Upload className="w-7 h-7 text-white/40" />
              </div>
              <p className="text-white font-semibold text-lg mb-1">Drop your manuscript PDF here</p>
              <p className="text-white/40 text-sm mb-5">or paste text directly into the editor below</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="border-white/20 text-white/70 hover:text-white hover:border-white/40">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF
                </Button>
                <Button variant="outline" className="border-white/20 text-white/70 hover:text-white hover:border-white/40">
                  <FileText className="w-4 h-4 mr-2" />
                  Paste Text
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Loaded Manuscripts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Loaded Manuscripts</h2>
          <Badge className="bg-green-500/15 text-green-400 border border-green-500/20 text-xs">
            <Star className="w-3 h-3 mr-1 fill-green-400" />
            Auto-analyzed
          </Badge>
        </div>
        <ManuscriptCard manuscript={EMBER_MANUSCRIPT} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid grid-cols-3 gap-4"
      >
        {[
          { href: "/characters", icon: Users, label: "View Characters", desc: "4 characters extracted", color: "blue" },
          { href: "/scenes", icon: Film, label: "Select Scene", desc: "4 scenes available", color: "orange" },
          { href: "/generate", icon: Zap, label: "Generate Video", desc: "Start creating now", color: "red" },
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <div className={`group relative overflow-hidden rounded-xl border p-5 cursor-pointer transition-all hover:scale-[1.02] ${
              action.color === "blue" ? "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10" :
              action.color === "orange" ? "border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10" :
              "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
            }`}>
              <action.icon className={`w-6 h-6 mb-3 ${
                action.color === "blue" ? "text-blue-400" :
                action.color === "orange" ? "text-orange-400" : "text-red-400"
              }`} />
              <p className="text-sm font-semibold text-white mb-0.5">{action.label}</p>
              <p className="text-xs text-white/40">{action.desc}</p>
              <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
