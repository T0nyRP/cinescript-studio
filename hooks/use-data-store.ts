"use client"

import { useState, useEffect, useCallback } from "react"
import * as store from "@/lib/data-store"
import type { Character, Scene, VideoRecord } from "@/types"

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Re-run loader whenever localStorage is written (same-tab) or this tab
 *  regains focus (cross-tab / page re-visit via Next.js router cache). */
function useStoreSubscription(loader: () => void) {
  useEffect(() => {
    loader()
    // Re-read when this tab's store is updated
    window.addEventListener("ember-store-updated", loader)
    // Re-read when the user switches back to this tab
    window.addEventListener("focus", loader)
    return () => {
      window.removeEventListener("ember-store-updated", loader)
      window.removeEventListener("focus", loader)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ─── useCharacters ────────────────────────────────────────────────────────────

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    store.getCharacters().then((data) => {
      setCharacters(data)
      setLoading(false)
    })
  }, [])

  useStoreSubscription(load)

  const updateCharacter = useCallback(async (updated: Character) => {
    await store.saveCharacter(updated)
    // Hook will refresh automatically via the ember-store-updated event
  }, [])

  const addCharacter = useCallback(async (char: Character) => {
    await store.saveCharacter(char)
  }, [])

  return { characters, loading, updateCharacter, addCharacter }
}

// ─── useScenes ───────────────────────────────────────────────────────────────

export function useScenes() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    store.getScenes().then((data) => {
      setScenes(data)
      setLoading(false)
    })
  }, [])

  useStoreSubscription(load)

  const updateScene = useCallback(async (updated: Scene) => {
    await store.saveScene(updated)
  }, [])

  return { scenes, loading, updateScene }
}

// ─── useVideos ────────────────────────────────────────────────────────────────

export function useVideos() {
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    store.getVideos().then((data) => {
      setVideos(data)
      setLoading(false)
    })
  }, [])

  useStoreSubscription(load)

  const addVideo = useCallback(async (video: VideoRecord) => {
    await store.addVideo(video)
  }, [])

  return { videos, loading, addVideo }
}
