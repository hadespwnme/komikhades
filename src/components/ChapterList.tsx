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
        className="w-full mb-3 px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
      />

      {progress && (
        <div className="mb-3 flex items-center gap-2 text-sm bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg px-3 py-2">
          <span className="text-[var(--accent)] font-medium">▶</span>
          <span>
            Lanjutkan membaca:{" "}
            <Link
              href={`/comic/${comicSlug}/${progress.lastChapter}`}
              className="text-[var(--accent)] hover:underline font-medium"
            >
              Chapter {progress.lastChapterNum}
            </Link>
          </span>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-[var(--border)] divide-y divide-[var(--border)]">
        {filtered.map((ch) => {
          const isCurrent = progress?.lastChapter === ch.slug;
          return (
            <Link
              key={ch.slug}
              href={`/comic/${comicSlug}/${ch.slug}`}
              className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--surface2)] transition-colors ${
                isCurrent
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--text)]"
              }`}
            >
              <span className="font-medium">Chapter {ch.number}</span>
              <span className="text-[var(--muted)] text-xs">{ch.date}</span>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-[var(--muted)] text-sm">
            Tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
