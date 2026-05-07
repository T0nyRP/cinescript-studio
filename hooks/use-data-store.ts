"use client"

import { useState, useEffect, useCallback } from "react"
import * as store from "@/lib/data-store"
import type { Character, Scene, VideoRecord } from "@/types"

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    store.getCharacters().then((data) => {
      setCharacters(data)
      setLoading(false)
    })
  }, [])

  const updateCharacter = useCallback(async (updated: Character) => {
    await store.saveCharacter(updated)
    setCharacters((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    )
  }, [])

  const addCharacter = useCallback(async (char: Character) => {
    await store.saveCharacter(char)
    setCharacters((prev) => [...prev, char])
  }, [])

  return { characters, loading, updateCharacter, addCharacter }
}

export function useScenes() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    store.getScenes().then((data) => {
      setScenes(data)
      setLoading(false)
    })
  }, [])

  const updateScene = useCallback(async (updated: Scene) => {
    await store.saveScene(updated)
    setScenes((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    )
  }, [])

  return { scenes, loading, updateScene }
}

export function useVideos() {
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    store.getVideos().then((data) => {
      setVideos(data)
      setLoading(false)
    })
  }, [])

  const addVideo = useCallback(async (video: VideoRecord) => {
    await store.addVideo(video)
    setVideos((prev) => [video, ...prev.filter((v) => v.id !== video.id)])
  }, [])

  return { videos, loading, addVideo }
}
