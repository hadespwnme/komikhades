"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProgressMap, ReadingProgress } from "@/types/comic";

const STORAGE_KEY = "komikhades_progress";

function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveProgress(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

export function useReadingProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});

  // Load on mount
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const getProgress = useCallback(
    (comicSlug: string): ReadingProgress | undefined => {
      return progress[comicSlug];
    },
    [progress]
  );

  const setChapterProgress = useCallback(
    (comicSlug: string, entry: ReadingProgress) => {
      setProgress((prev) => {
        const next = { ...prev, [comicSlug]: entry };
        saveProgress(next);
        return next;
      });
    },
    []
  );

  const clearProgress = useCallback((comicSlug: string) => {
    setProgress((prev) => {
      const next = { ...prev };
      delete next[comicSlug];
      saveProgress(next);
      return next;
    });
  }, []);

  return { progress, getProgress, setChapterProgress, clearProgress };
}
