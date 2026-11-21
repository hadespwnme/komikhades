"use client";

import { useState, useMemo, useEffect } from "react";
import ComicCard from "./ComicCard";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import type { ComicSummary } from "@/types/comic";

const PER_PAGE_MOBILE = 12;
const PER_PAGE_DESKTOP = 15;

type Tab = "all" | "Manhwa" | "Manhua" | "Manga";

interface Props {
  comics: ComicSummary[];
}

export default function ComicGrid({ comics }: Props) {
  const { getProgress } = useReadingProgress();
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE_MOBILE);

  useEffect(() => {
    const update = () => setPerPage(window.innerWidth >= 1024 ? PER_PAGE_DESKTOP : PER_PAGE_MOBILE);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Filter by type tab
  const byTab = useMemo(() => {
    if (tab === "all") return comics;
    return comics.filter((c) => c.type === tab);
  }, [comics, tab]);

  // Sort by latest_date descending
  const sorted = useMemo(() => {
    return [...byTab].sort((a, b) => {
      const da = a.latest_date ? new Date(a.latest_date.split("/").reverse().join("-")).getTime() : 0;
      const db = b.latest_date ? new Date(b.latest_date.split("/").reverse().join("-")).getTime() : 0;
      return db - da;
    });
  }, [byTab]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  // Reset page when tab changes
  useEffect(() => { setPage(1); }, [tab]);

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "Manhwa", label: "Manhwa" },
    { key: "Manhua", label: "Manhua" },
    { key: "Manga", label: "Manga" },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Tab filter */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-accent text-white shadow-md"
                : "text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Page info */}
      {totalPages > 1 && (
        <p className="text-xs text-muted mb-4">
          Halaman <span className="text-text font-medium">{page}</span> / {totalPages}
        </p>
      )}

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface2 flex items-center justify-center text-2xl">📚</div>
          <div className="text-center">
            <p className="text-text font-medium mb-1">Tidak ada komik</p>
            <p className="text-sm">Belum ada komik untuk kategori ini.</p>
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
        <div className="flex items-center justify-center gap-2 mt-8">
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

function relativeTime(str: string): string {
  if (!str) return "";
  const parts = str.split("/");
  if (parts.length !== 3) return "";
  const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  if (date.getTime() === 0) return "";
  const diff = Date.now() - date.getTime();
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
