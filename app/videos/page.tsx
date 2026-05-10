"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Download, ExternalLink, Clock, Film, Layers, Loader2, X, Images, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useVideos } from "@/hooks/use-data-store"
import type { VideoRecord } from "@/types"

// ─── Video Player Modal ───────────────────────────────────────────────────────

function VideoPlayerModal({ video, onClose }: { video: VideoRecord; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-[#111118] rounded-2xl border border-white/10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div>
              <h2 className="text-sm font-bold text-white">{video.title}</h2>
              <p className="text-xs text-white/40 mt-0.5">{video.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Video player */}
          <div className="relative bg-black aspect-video">
            <video
              src={video.videoUrl}
              controls
              autoPlay
              className="w-full h-full"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{video.duration}</span>
              <span className="flex items-center gap-1"><Film className="w-3 h-3" />{video.shots} shot{video.shots !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{video.style}</span>
            </div>
            <div className="flex gap-2">
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />Open
              </a>
              <a
                href={video.videoUrl}
                download
                className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />Download
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Video Card ───────────────────────────────────────────────────────────────

function VideoCard({ video, onClick }: { video: VideoRecord; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white/3 border border-white/8 hover:border-orange-500/30 rounded-xl overflow-hidden cursor-pointer transition-all"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Film className="w-8 h-8 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-orange-500/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white/80 text-xs px-1.5 py-0.5 rounded">
            {video.duration}
          </div>
        )}
        {video.facebookReady && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-blue-500/80 text-white border-0 text-xs px-1.5 py-0">
              <Zap className="w-2.5 h-2.5 mr-1" />FB Ready
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-1">{video.title}</h3>
        <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{video.subtitle}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
          <span className="flex items-center gap-1"><Film className="w-3 h-3" />{video.shots} shots</span>
          <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{video.style}</span>
          {video.hasVoice && <span className="text-green-400">🎙 Voice</span>}
        </div>
        {video.characters?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {video.characters.slice(0, 3).map((c) => (
              <span key={c} className="text-xs bg-white/5 text-white/40 px-1.5 py-0.5 rounded-full">{c}</span>
            ))}
            {video.characters.length > 3 && (
              <span className="text-xs text-white/30">+{video.characters.length - 3}</span>
            )}
          </div>
        )}
        {video.referenceImages?.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-white/30">
            <Images className="w-3 h-3" />{video.referenceImages.length} reference image{video.referenceImages.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VideosPage() {
  const { videos, loading } = useVideos()
  const [selected, setSelected] = useState<VideoRecord | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/40">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading videos…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Videos</h1>
        <p className="text-sm text-white/40 mt-1">
          {videos.length} video{videos.length !== 1 ? "s" : ""} generated
        </p>
      </div>

      {/* Grid */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-white/20" />
          </div>
          <h2 className="text-white/50 font-medium mb-2">No videos yet</h2>
          <p className="text-white/30 text-sm max-w-sm">
            Generate clips from a scene and click "Save to My Videos" to see them here.
          </p>
          <a href="/generate" className="mt-4 text-orange-400 text-sm hover:text-orange-300 underline">
            Go to Generate →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onClick={() => setSelected(video)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <VideoPlayerModal video={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
