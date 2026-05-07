"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Download, ExternalLink, Clock, Film, Layers, Zap, X, Images } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VideoEntry {
  id: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  shots: number;
  scene: string;
  style: string;
  characters: string[];
  referenceImages: { name: string; url: string }[];
  generatedAt: string;
  facebookReady: boolean;
  tags: string[];
}

const VIDEOS: VideoEntry[] = [
  {
    id: "v2",
    title: "The Istanbul Warehouse Raid",
    subtitle: "Reference-consistent 8-shot cinematic cut",
    videoUrl: "https://galaxy-prod.tlcdn.com/gen/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/83e3d5d3-e3fa-49e9-848d-d133ad579c25.mp4",
    thumbnailUrl: "https://galaxy-prod.tlcdn.com/gen/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/c3fee0ee-ed41-44b0-975d-697d6d7dfe7f.png",
    duration: "1:13",
    shots: 8,
    scene: "Chapter 6: The Infiltration",
    style: "Cinematic",
    characters: ["Jace Maddox", "Alex Torres", "Omar Al-Rashid"],
    referenceImages: [
      { name: "Jace Maddox", url: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/918a05f01df6412a8c67422987284e77.jpg" },
      { name: "Alex Torres", url: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/bbd0c74c9dea4dd0af8305995871f2a9.jpg" },
      { name: "Omar Al-Rashid", url: "https://cdn.galaxy.ai/user_36cCqh2jHHMI3sNTjlQM2JQrUTU/615fce761d554bcbaf92ec2a7f04b442.jpg" },
    ],
    generatedAt: new Date().toISOString(),
    facebookReady: true,
    tags: ["Action", "Istanbul", "SYNAPSE", "AI Battle", "Reference-Locked"]
  }
];

function VideoPlayerModal({ video, onClose }: { video: VideoEntry; onClose: () => void }) {
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
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Video player */}
          <div className="relative bg-black">
            <video
              controls
              autoPlay
              className="w-full max-h-[60vh] object-contain"
              src={video.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{video.duration}</span>
              <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" />{video.shots} shots</span>
              <span className="flex items-center gap-1.5"><Images className="w-3 h-3 text-green-400" /><span className="text-green-400">Reference-locked</span></span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/15 text-white/60 hover:text-white text-xs h-8 gap-1.5"
                onClick={() => window.open(video.videoUrl, "_blank")}
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </Button>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1.5"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = video.videoUrl;
                  a.download = `${video.title.replace(/\s+/g, "_")}.mp4`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <Download className="w-3 h-3" />
                Download
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function VideosPage() {
  const [playingVideo, setPlayingVideo] = useState<VideoEntry | null>(null);

  return (
    <div className="min-h-screen p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs mb-3">
          <Film className="w-3 h-3 mr-1" />
          My Videos
        </Badge>
        <h1 className="text-3xl font-bold text-white mb-2">Generated Videos</h1>
        <p className="text-white/50 text-sm max-w-lg">
          Facebook-ready cinematic videos generated from your manuscripts. All characters are reference-locked for visual consistency.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {VIDEOS.map((video, i) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all group"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-black overflow-hidden cursor-pointer" onClick={() => setPlayingVideo(video)}>
              <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
              {/* Duration badge */}
              <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 rounded-md text-xs text-white font-medium">
                {video.duration}
              </div>
              {/* Facebook ready badge */}
              {video.facebookReady && (
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-blue-600/90 rounded-md text-xs text-white font-medium flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  Facebook Ready
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">{video.title}</h3>
                  <p className="text-xs text-white/40">{video.scene}</p>
                </div>
                <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/20 text-xs flex-shrink-0">{video.style}</Badge>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-4 text-xs text-white/40">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{video.duration}</span>
                <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{video.shots} shots</span>
              </div>

              {/* Reference images */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Images className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Reference-locked characters</span>
                </div>
                <div className="flex gap-2">
                  {video.referenceImages.map((ref) => (
                    <div key={ref.name} className="relative group/ref">
                      <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-green-500/30">
                        <img src={ref.url} alt={ref.name} className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white/50 opacity-0 group-hover/ref:opacity-100 transition-opacity pointer-events-none">
                        {ref.name.split(" ")[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {video.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-white/5 border border-white/8 px-2 py-0.5 rounded-full text-white/50">{tag}</span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1.5"
                  onClick={() => setPlayingVideo(video)}
                >
                  <Play className="w-3 h-3 fill-white" />
                  Watch
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/15 text-white/60 hover:text-white text-xs h-8 gap-1.5"
                  onClick={() => window.open(video.videoUrl, "_blank")}
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/15 text-white/60 hover:text-white text-xs h-8 gap-1.5"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = video.videoUrl;
                    a.download = `${video.title.replace(/\s+/g, "_")}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Player modal */}
      {playingVideo && (
        <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  );
}
