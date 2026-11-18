"use client";

import { useState, useMemo, useEffect } from "react";
import ComicCard from "./ComicCard";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import type { ComicSummary } from "@/types/comic";

const PER_PAGE_MOBILE = 12;
const PER_PAGE_DESKTOP = 15;

/** Parse DD/MM/YYYY → Date. Returns epoch 0 if invalid. */
function parseDate(str: string): Date {
  if (!str) return new Date(0);
  const [d, m, y] = str.split("/");
  if (!d || !m || !y) return new Date(0);
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/** "2 jam lalu", "3 hari lalu", etc. */
function relativeTime(str: string): string {
  const date = parseDate(str);
  if (date.getTime() === 0) return "";
  const now = Date.now();
  const diff = now - date.getTime(); // ms
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  if (weeks < 5) return `${weeks} minggu lalu`;
  if (months < 12) return `${months} bulan lalu`;
  return `${years} tahun lalu`;
}

interface Props {
  comics: ComicSummary[];
}

export default function ComicGrid({ comics }: Props) {
  const { getProgress } = useReadingProgress();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE_MOBILE);

  // Detect desktop (>= 1024px) on mount and resize
  useEffect(() => {
    const update = () => setPerPage(window.innerWidth >= 1024 ? PER_PAGE_DESKTOP : PER_PAGE_MOBILE);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Sort by latest_date descending (newest chapter first)
  const sorted = useMemo(() => {
    return [...comics].sort(
      (a, b) => parseDate(b.latest_date).getTime() - parseDate(a.latest_date).getTime()
    );
  }, [comics]);

  const filtered = useMemo(() => {
    setPage(1);
    if (!query.trim()) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.alt_title?.toLowerCase().includes(q) ||
        c.author?.toLowerCase().includes(q) ||
        c.genres?.some((g) => g.toLowerCase().includes(q))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, query]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {query && (
          <button onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface2 flex items-center justify-center text-muted hover:text-text transition-colors"
            aria-label="Hapus pencarian">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Result info — only show when searching */}
      <div className="flex items-center justify-between mb-4"
        style={{ fontFamily: "'Poppins', sans-serif" }}>
        <p className="text-xs text-muted">
          {query
            ? <>{filtered.length} hasil untuk &ldquo;<span className="text-accent">{query}</span>&rdquo;</>
            : null
          }
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-muted">
            Halaman <span className="text-text font-medium">{page}</span> / {totalPages}
          </p>
        )}
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface2 flex items-center justify-center text-2xl">🔍</div>
          <div className="text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <p className="text-text font-medium mb-1">Komik tidak ditemukan</p>
            <p className="text-sm">Coba kata kunci lain</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {paginated.map((comic) => (
            <ComicCard
              key={comic.slug}
              comic={comic}
              progress={getProgress(comic.slug)}
              updatedAgo={relativeTime(comic.latest_date)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8"
          style={{ fontFamily: "'Poppins', sans-serif" }}>
          <button onClick={() => goTo(page - 1)} disabled={page === 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface border border-border text-muted hover:text-text hover:border-accent/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
            const showDot = (p === 2 && page > 3) || (p === totalPages - 1 && page < totalPages - 2);
            if (!show && !showDot) return null;
            if (showDot && !show) return <span key={p} className="text-muted text-sm px-1">…</span>;
            return (
              <button key={p} onClick={() => goTo(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                  p === page ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "bg-surface border border-border text-muted hover:text-text hover:border-accent/40"
                }`}>
                {p}
              </button>
            );
          })}

          <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface border border-border text-muted hover:text-text hover:border-accent/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
