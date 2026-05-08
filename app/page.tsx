"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, BookOpen, Zap, Users, Film, ChevronRight,
  Star, X, Trash2, Plus, AlertCircle, CheckCircle, Sparkles, Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ManuscriptCard } from "@/components/manuscript-card";
import {
  getManuscripts, saveManuscript, deleteManuscript,
  saveCharacter, saveScene, saveAllCharacters
} from "@/lib/data-store";
import type { Manuscript, Character, Scene, Shot } from "@/types";

// ─── Title guesser ────────────────────────────────────────────────────────
function guessTitle(text: string, filename: string): string {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (line.length > 3 && line.length < 80) return line;
  }
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Paste Text Modal ────────────────────────────────────────────────────
function PasteModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (title: string, text: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-2xl flex flex-col gap-4"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Paste Manuscript Text</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>
        <input
          type="text"
          placeholder="Manuscript title (e.g. The Eastern Front)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-500/50"
        />
        <textarea
          placeholder="Paste your manuscript text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/80 placeholder-white/30 text-sm focus:outline-none focus:border-orange-500/50 resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">{text.length.toLocaleString()} characters</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="border-white/15 text-white/60 hover:text-white">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => { if (!text.trim()) return; onSave(title.trim() || "Untitled Manuscript", text.trim()); }}
              disabled={!text.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add & Analyze
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function ManuscriptsPage() {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = () => setManuscripts(getManuscripts());
  useEffect(() => { reload(); }, []);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 8000);
  };

  // ── Analyze a manuscript with AI ─────────────────────────────────────
  const analyzeManuscript = useCallback(async (manuscript: Manuscript) => {
    setAnalyzingId(manuscript.id);
    setProcessingStep("Sending to AI for analysis…");

    try {
      const res = await fetch("/api/analyze-manuscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: manuscript.title, text: manuscript.text }),
      });

      // Always try to parse JSON, fall back to text for error diagnosis
      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        showToast("error", `Analysis failed (HTTP ${res.status}): ${text.slice(0, 200) || "No response body"}`);
        return;
      }

      if (!res.ok) {
        showToast("error", String(data.error ?? `Analysis failed (HTTP ${res.status})`));
        return;
      }

      const rawChars = (data.characters as Array<Record<string, unknown>>) ?? [];
      const rawScenes = (data.scenes as Array<Record<string, unknown>>) ?? [];

      setProcessingStep(`Saving ${rawChars.length} characters and ${rawScenes.length} scenes…`);

      // ── Step 1: Build Character objects with unique IDs ───────────────
      const extractedChars: Character[] = rawChars.map((raw) => ({
        id: makeId("char"),
        name: String(raw.name ?? "Unknown"),
        age: String(raw.age ?? "Unknown"),
        role: String(raw.role ?? ""),
        appearance: {
          hair: String((raw.appearance as Record<string, unknown>)?.hair ?? ""),
          eyes: String((raw.appearance as Record<string, unknown>)?.eyes ?? ""),
          height: String((raw.appearance as Record<string, unknown>)?.height ?? ""),
          build: String((raw.appearance as Record<string, unknown>)?.build ?? ""),
          distinguishing: String((raw.appearance as Record<string, unknown>)?.distinguishing ?? ""),
          clothing: String((raw.appearance as Record<string, unknown>)?.clothing ?? ""),
        },
        personality: Array.isArray(raw.personality) ? raw.personality.map(String) : [],
        voiceStyle: String(raw.voiceStyle ?? ""),
        manuscriptSource: manuscript.title,
        createdAt: new Date().toISOString(),
      }));

      // Build name → ID map so scenes can reference characters by ID
      // Match both exact names and lowercase variants
      const nameToId = new Map<string, string>();
      for (const char of extractedChars) {
        nameToId.set(char.name, char.id);
        nameToId.set(char.name.toLowerCase(), char.id);
        // Also index by first name only (e.g. "Zara" → id of "Zara Malik")
        const firstName = char.name.split(" ")[0];
        if (firstName && !nameToId.has(firstName)) {
          nameToId.set(firstName, char.id);
          nameToId.set(firstName.toLowerCase(), char.id);
        }
      }

      // Save all characters at once
      for (const char of extractedChars) {
        await saveCharacter(char);
      }

      // ── Step 2: Build Scene objects, mapping character names → IDs ────
      for (const raw of rawScenes) {
        const rawShots = Array.isArray(raw.shotBreakdown)
          ? (raw.shotBreakdown as Array<Record<string, unknown>>)
          : [];

        const shots: Shot[] = rawShots.map((s, i) => ({
          id: makeId("shot"),
          order: Number(s.order ?? i + 1),
          type: (s.type as Shot["type"]) ?? "medium",
          angle: (s.angle as Shot["angle"]) ?? "eye-level",
          description: String(s.description ?? ""),
          action: String(s.action ?? ""),
          lighting: String(s.lighting ?? ""),
          duration: Number(s.duration ?? 8),
          // Map shot-level character names to IDs too
          characters: Array.isArray(s.characters)
            ? s.characters.map((n) => nameToId.get(String(n)) ?? nameToId.get(String(n).toLowerCase()) ?? String(n))
            : [],
          prompt: String(s.prompt ?? ""),
        }));

        // Map scene character names → IDs
        const sceneCharIds = Array.isArray(raw.characters)
          ? raw.characters
              .map((n) => nameToId.get(String(n)) ?? nameToId.get(String(n).toLowerCase()) ?? String(n))
          : [];

        const scene: Scene = {
          id: makeId("scene"),
          title: String(raw.title ?? "Untitled Scene"),
          chapter: String(raw.chapter ?? ""),
          startLine: 0,
          endLine: 0,
          text: "",
          summary: String(raw.summary ?? ""),
          actionLevel: (raw.actionLevel as Scene["actionLevel"]) ?? "medium",
          emotionalTone: String(raw.emotionalTone ?? ""),
          location: String(raw.location ?? ""),
          characters: sceneCharIds,
          shotBreakdown: shots,
          manuscriptSource: manuscript.title,
        };
        await saveScene(scene);
      }

      // ── Step 3: Update manuscript record with extracted data ──────────
      const updatedMs: Manuscript = {
        ...manuscript,
        characters: extractedChars,
        scenes: [],
      };
      saveManuscript(updatedMs);
      reload();

      showToast(
        "success",
        `✓ Extracted ${rawChars.length} characters and ${rawScenes.length} action scenes — go to Scenes to pick one!`
      );
    } catch (err) {
      console.error("analyzeManuscript error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast("error", `Analysis error: ${msg}`);
    } finally {
      setAnalyzingId(null);
      setProcessingStep("");
    }
  }, []);

  // ── File processing ───────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");
    if (!isPdf && !isTxt) { showToast("error", "Only PDF and TXT files are supported."); return; }

    setProcessingStep(`Reading ${file.name}…`);

    try {
      let text = "";
      if (isPdf) {
        setProcessingStep("Extracting PDF text…");
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/parse-pdf", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) { showToast("error", json.error ?? "PDF parsing failed."); return; }
        text = json.text ?? "";
        setProcessingStep(`Extracted ${json.pages} pages…`);
      } else {
        text = await file.text();
      }

      if (!text.trim()) { showToast("error", "No text found in file."); return; }

      const manuscript: Manuscript = {
        id: makeId("ms"),
        title: guessTitle(text, file.name),
        author: "Unknown",
        uploadedAt: new Date().toISOString(),
        text: text.slice(0, 300_000),
        characters: [],
        scenes: [],
      };

      saveManuscript(manuscript);
      reload();
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Auto-analyze immediately after upload
      await analyzeManuscript(manuscript);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to read the file. Please try again.");
    } finally {
      setProcessingStep("");
    }
  }, [analyzeManuscript]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const handleDelete = (id: string) => {
    deleteManuscript(id); reload();
    showToast("success", "Manuscript removed.");
  };
  const handlePasteSave = async (title: string, text: string) => {
    const manuscript: Manuscript = {
      id: makeId("ms"),
      title,
      author: "Unknown",
      uploadedAt: new Date().toISOString(),
      text: text.slice(0, 300_000),
      characters: [],
      scenes: [],
    };
    saveManuscript(manuscript);
    reload();
    setShowPaste(false);
    await analyzeManuscript(manuscript);
  };

  const isProcessing = !!processingStep || !!analyzingId;
  const totalChars = manuscripts.reduce((s, m) => s + (m.characters?.length ?? 0), 0);
  const totalScenes = manuscripts.reduce((s, m) => s + (m.scenes?.length ?? 0), 0);

  return (
    <div className="min-h-screen p-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl max-w-sm ${
              toast.type === "success" ? "bg-green-500/15 border-green-500/30 text-green-300" : "bg-red-500/15 border-red-500/30 text-red-300"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaste && <PasteModal onClose={() => setShowPaste(false)} onSave={handlePasteSave} />}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs">
            <Zap className="w-3 h-3 mr-1" />AI-Powered Studio
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Manuscript Studio</h1>
        <p className="text-white/50 text-base max-w-xl">
          Upload a PDF or TXT — AI will automatically extract characters, action scenes, and shot breakdowns ready for video generation.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Characters Found", value: totalChars.toString(), icon: Users, color: "blue" },
          { label: "Action Scenes", value: totalScenes.toString(), icon: Film, color: "orange" },
          { label: "Manuscripts Loaded", value: manuscripts.length.toString(), icon: BookOpen, color: "green" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color === "blue" ? "bg-blue-500/15" : stat.color === "orange" ? "bg-orange-500/15" : "bg-green-500/15"}`}>
              <stat.icon className={`w-5 h-5 ${stat.color === "blue" ? "text-blue-400" : stat.color === "orange" ? "text-orange-400" : "text-green-400"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Upload Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            isDragging ? "border-orange-500 bg-orange-500/10" : "border-white/10 hover:border-white/25 bg-white/2 hover:bg-white/4"
          } ${isProcessing ? "cursor-not-allowed opacity-75" : ""}`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-orange-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-white font-medium">{processingStep || "Analyzing…"}</p>
              <p className="text-white/40 text-sm">AI is extracting characters, scenes and shot breakdowns</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Upload className="w-7 h-7 text-white/40" />
              </div>
              <p className="text-white font-semibold text-lg mb-1">{isDragging ? "Drop to upload & analyze" : "Drop a PDF or TXT here"}</p>
              <p className="text-white/40 text-sm mb-5">AI will automatically extract characters, scenes and shot breakdowns</p>
              <div className="flex gap-3 justify-center" onClick={(e) => e.stopPropagation()}>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="border-white/20 text-white/70 hover:text-white hover:border-white/40">
                  <Upload className="w-4 h-4 mr-2" />Upload PDF / TXT
                </Button>
                <Button onClick={() => setShowPaste(true)} variant="outline" className="border-white/20 text-white/70 hover:text-white hover:border-white/40">
                  <FileText className="w-4 h-4 mr-2" />Paste Text
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Manuscript List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Loaded Manuscripts</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={reload}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Refresh list"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white/40" />
            </button>
            <Badge className="bg-green-500/15 text-green-400 border border-green-500/20 text-xs">
              <Star className="w-3 h-3 mr-1 fill-green-400" />{manuscripts.length} loaded
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {manuscripts.map((ms) => (
            <div key={ms.id} className="relative group">
              <ManuscriptCard
                manuscript={ms}
                isAnalyzing={analyzingId === ms.id}
                onAnalyze={() => analyzeManuscript(ms)}
              />
              {ms.id !== "ember-istanbul-protocol" && (
                <button
                  onClick={() => handleDelete(ms.id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500/15 hover:bg-red-500/30 border border-red-500/20 rounded-lg"
                  title="Remove manuscript"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 grid grid-cols-3 gap-4">
        {[
          { href: "/characters", icon: Users, label: "View Characters", desc: `${totalChars} characters extracted`, color: "blue" },
          { href: "/scenes", icon: Film, label: "Select Scene", desc: `${totalScenes} scenes available`, color: "orange" },
          { href: "/generate", icon: Zap, label: "Generate Video", desc: "Start creating now", color: "red" },
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <div className={`group relative overflow-hidden rounded-xl border p-5 cursor-pointer transition-all hover:scale-[1.02] ${
              action.color === "blue" ? "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10" :
              action.color === "orange" ? "border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10" :
              "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
            }`}>
              <action.icon className={`w-6 h-6 mb-3 ${action.color === "blue" ? "text-blue-400" : action.color === "orange" ? "text-orange-400" : "text-red-400"}`} />
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
