"use client";

import { useState, useMemo } from "react";
import ComicCard from "./ComicCard";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import type { ComicSummary } from "@/types/comic";

interface Props {
  comics: ComicSummary[];
}

export default function ComicGrid({ comics }: Props) {
  const { getProgress } = useReadingProgress();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return comics;
    const q = query.toLowerCase();
    return comics.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.alt_title?.toLowerCase().includes(q) ||
        c.author?.toLowerCase().includes(q) ||
        c.genres?.some((g) => g.toLowerCase().includes(q))
    );
  }, [comics, query]);

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Cari judul, author, genre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        />
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface2 flex items-center justify-center text-muted hover:text-text transition-colors"
            aria-label="Hapus pencarian"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Result count */}
      {query && (
        <p className="text-xs text-muted mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {filtered.length} hasil untuk &ldquo;<span className="text-accent">{query}</span>&rdquo;
        </p>
      )}

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface2 flex items-center justify-center text-2xl">🔍</div>
          <div className="text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <p className="text-text font-medium mb-1">Komik tidak ditemukan</p>
            <p className="text-sm">Coba kata kunci lain</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filtered.map((comic) => (
            <ComicCard
              key={comic.slug}
              comic={comic}
              progress={getProgress(comic.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
