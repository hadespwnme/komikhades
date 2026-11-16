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

  const sorted = [...chapters].reverse();
  const filtered = search
    ? sorted.filter((c) => c.number.includes(search))
    : sorted;

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Cari chapter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Resume banner */}
      {progress && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-accentglow border border-accent/25 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-accent text-base">▶</span>
            <div>
              <p className="text-xs text-muted">Lanjutkan membaca</p>
              <p className="text-sm text-text font-medium">Chapter {progress.lastChapterNum} · Halaman {progress.lastPage + 1}</p>
            </div>
          </div>
          <Link
            href={`/comic/${comicSlug}/${progress.lastChapter}`}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent2 transition-colors"
          >
            Lanjut →
          </Link>
        </div>
      )}

      {/* Chapter rows */}
      <div className="rounded-2xl overflow-hidden border border-border bg-surface">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted text-sm">
            Tidak ada chapter yang cocok
          </div>
        ) : (
          filtered.map((ch, i) => {
            const isCurrent = progress?.lastChapter === ch.slug;
            return (
              <Link
                key={ch.slug}
                href={`/comic/${comicSlug}/${ch.slug}`}
                className={`flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-surface2 cursor-pointer ${
                  i !== 0 ? "border-t border-border" : ""
                } ${isCurrent ? "bg-accentglow" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  )}
                  <span className={isCurrent ? "text-accent font-semibold" : "text-text font-medium"}>
                    Chapter {ch.number}
                  </span>
                </div>
                <span className="text-muted text-xs">{ch.date}</span>
              </Link>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted text-center mt-3">
          {filtered.length} chapter
        </p>
      )}
    </div>
  );
}
