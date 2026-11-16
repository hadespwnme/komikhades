"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProgressMap, ReadingProgress } from "@/types/comic";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "komikhades_progress";

function loadLocalProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveLocalProgress(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

export function useReadingProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});

  // On mount: load localStorage first, then merge with Supabase if logged in
  useEffect(() => {
    const local = loadLocalProgress();
    setProgress(local);

    // Try to fetch from Supabase and merge (Supabase is source of truth for logged-in)
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: rows } = await supabase
        .from("reading_history")
        .select("comic_slug, chapter_slug, chapter_num, last_page, read_at")
        .eq("user_id", user.id);

      if (!rows || rows.length === 0) return;

      // Build progress map from Supabase data
      const supabaseMap: ProgressMap = {};
      for (const row of rows) {
        supabaseMap[row.comic_slug] = {
          lastChapter: row.chapter_slug,
          lastChapterNum: row.chapter_num,
          lastPage: row.last_page,
          updatedAt: new Date(row.read_at).getTime(),
        };
      }

      // Merge: take whichever has the newer updatedAt per comic
      setProgress((prev) => {
        const merged: ProgressMap = { ...prev };
        for (const [slug, supaEntry] of Object.entries(supabaseMap)) {
          const localEntry = prev[slug];
          if (!localEntry || supaEntry.updatedAt > localEntry.updatedAt) {
            merged[slug] = supaEntry;
          }
        }
        saveLocalProgress(merged);
        return merged;
      });
    });
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
        saveLocalProgress(next);
        return next;
      });
    },
    []
  );

  const clearProgress = useCallback((comicSlug: string) => {
    setProgress((prev) => {
      const next = { ...prev };
      delete next[comicSlug];
      saveLocalProgress(next);
      return next;
    });
  }, []);

  return { progress, getProgress, setChapterProgress, clearProgress };
}
