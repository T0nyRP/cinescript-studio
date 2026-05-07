"use client";

import { X, Download, Share, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title?: string;
}

export function VideoPlayerModal({ isOpen, onClose, videoUrl, title }: VideoPlayerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="w-full max-w-3xl bg-[#111118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div>
                  <p className="text-sm font-semibold text-white">{title || "Generated Video"}</p>
                  <p className="text-xs text-white/40">2:00 · 1080p · Facebook Ready</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Player area */}
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full aspect-video bg-black"
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-orange-900/20 to-red-900/20 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/80">Video rendering…</p>
                    <p className="text-xs text-white/40 mt-1">Your video is being processed. Check back shortly.</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 px-5 py-4 border-t border-white/8">
                {videoUrl ? (
                  <>
                    <a href={videoUrl} download>
                      <Button size="sm" variant="outline" className="border-white/20 text-white/70 hover:text-white gap-1.5 text-xs h-8">
                        <Download className="w-3.5 h-3.5" />
                        Download MP4
                      </Button>
                    </a>
                    <Button size="sm" variant="outline" className="border-white/20 text-white/70 hover:text-white gap-1.5 text-xs h-8">
                      <Share className="w-3.5 h-3.5" />
                      Share
                    </Button>
                    <a href={videoUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="border-white/20 text-white/70 hover:text-white gap-1.5 text-xs h-8">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in new tab
                      </Button>
                    </a>
                  </>
                ) : (
                  <p className="text-xs text-white/30">Video URL will appear here once generation completes.</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
