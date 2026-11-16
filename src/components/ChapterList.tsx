"use client";

import Link from "next/link";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import type { Chapter } from "@/types/comic";
import { useState } from "react";

interface Props {
  chapters: Chapter[];
  comicSlug: string;
}

export default function ChapterList({ chapters, comicSlug }: Props) {
  const { getProgress } = useReadingProgress();
  const progress = getProgress(comicSlug);
  const [search, setSearch] = useState("");

  // Display newest first
  const sorted = [...chapters].reverse();
  const filtered = search
    ? sorted.filter((c) => c.number.includes(search) || c.slug.includes(search))
    : sorted;

  return (
    <div>
      <input
        type="text"
        placeholder="Cari chapter..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-3 px-3 py-2 rounded-lg bg-surface2 border border-border text-sm placeholder:text-muted focus:outline-none focus:border-accent"
      />

      {progress && (
        <div className="mb-3 flex items-center gap-2 text-sm bg-accent/10 border border-accent/30 rounded-lg px-3 py-2">
          <span className="text-accent font-medium">▶</span>
          <span>
            Lanjutkan membaca:{" "}
            <Link
              href={`/comic/${comicSlug}/${progress.lastChapter}`}
              className="text-accent hover:underline font-medium"
            >
              Chapter {progress.lastChapterNum}
            </Link>
          </span>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-border divide-y divide-border">
        {filtered.map((ch) => {
          const isCurrent = progress?.lastChapter === ch.slug;
          return (
            <Link
              key={ch.slug}
              href={`/comic/${comicSlug}/${ch.slug}`}
              className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-surface2 transition-colors ${
                isCurrent ? "bg-accent/10 text-accent" : "text-text"
              }`}
            >
              <span className="font-medium">Chapter {ch.number}</span>
              <span className="text-muted text-xs">{ch.date}</span>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-muted text-sm">
            Tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
