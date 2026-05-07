"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Users, Film, Clapperboard, Play, Zap, Download, Upload, Database, CheckCircle, XCircle, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { isSupabaseConfigured } from "@/lib/supabase"
import { exportAllData, importAllData } from "@/lib/data-store"

const NAV = [
  { href: "/", icon: BookOpen, label: "Manuscripts" },
  { href: "/characters", icon: Users, label: "Characters" },
  { href: "/scenes", icon: Film, label: "Scenes" },
  { href: "/generate", icon: Zap, label: "Generate" },
  { href: "/videos", icon: Play, label: "My Videos" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [syncOpen, setSyncOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const text = await file.text()
    const ok = await importAllData(text)
    setImportMsg(ok ? "✓ Data imported" : "✗ Import failed")
    setImporting(false)
    setTimeout(() => setImportMsg(""), 3000)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <aside className="w-56 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/8 bg-[#0a0a0f]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">EMBER Studio</p>
            <p className="text-xs text-white/30">Manuscript → Video</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all", active ? "bg-orange-500/15 text-orange-400 font-medium" : "text-white/50 hover:text-white hover:bg-white/5")}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sync & Data */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3 space-y-1">
        {/* Sync status toggle */}
        <button
          onClick={() => setSyncOpen(!syncOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5" />
            <span>Data & Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isSupabaseConfigured ? (
              <CheckCircle className="w-3 h-3 text-green-400" />
            ) : (
              <XCircle className="w-3 h-3 text-yellow-400" />
            )}
            <ChevronDown className={cn("w-3 h-3 transition-transform", syncOpen && "rotate-180")} />
          </div>
        </button>

        <AnimatePresence>
          {syncOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pt-2 pb-1 space-y-3">
                {/* Sync status */}
                <div className={cn("flex items-start gap-2 p-2.5 rounded-lg text-xs", isSupabaseConfigured ? "bg-green-500/10 border border-green-500/20" : "bg-yellow-500/10 border border-yellow-500/20")}>
                  {isSupabaseConfigured ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-green-400 leading-relaxed">Supabase connected — syncing across all devices</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-yellow-400 leading-relaxed">Using browser storage. Add Supabase keys to sync across devices.</span>
                    </>
                  )}
                </div>

                {/* Export */}
                <button
                  onClick={exportAllData}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/8 text-xs text-white/60 hover:text-white transition-all"
                >
                  <Download className="w-3 h-3" />
                  Export backup (.json)
                </button>

                {/* Import */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={importing}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/8 text-xs text-white/60 hover:text-white transition-all disabled:opacity-50"
                >
                  <Upload className="w-3 h-3" />
                  {importing ? "Importing…" : importMsg || "Import backup (.json)"}
                </button>
                <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}
