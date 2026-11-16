"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Props {
  comicSlug: string;
  comicTitle: string;
  chapterNumber: string;
  prevChapterSlug?: string;
  nextChapterSlug?: string;
  /** chapter slugs list sorted ascending for search navigation */
  allChapters: { slug: string; number: string }[];
}

type Panel = "none" | "search" | "settings";

export default function FloatingDock({
  comicSlug,
  comicTitle,
  chapterNumber,
  prevChapterSlug,
  nextChapterSlug,
  allChapters,
}: Props) {
  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2); // px per frame
  const [searchVal, setSearchVal] = useState("");

  const rafRef = useRef<number | null>(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  const autoScroll = useCallback(() => {
    window.scrollBy({ top: speed, behavior: "instant" });

    // Stop at bottom
    const atBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 10;
    if (atBottom) {
      setPlaying(false);
      return;
    }
    rafRef.current = requestAnimationFrame(autoScroll);
  }, [speed]);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(autoScroll);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, autoScroll]);

  // ── Tap-to-toggle dock ───────────────────────────────────────────────────
  useEffect(() => {
    const handleTap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-dock]")) return; // ignore taps on dock itself
      setVisible((v) => !v);
      // close panels when hiding
      if (visible) setActivePanel("none");
    };
    document.addEventListener("click", handleTap);
    return () => document.removeEventListener("click", handleTap);
  }, [visible]);

  // ── Scroll shortcuts ─────────────────────────────────────────────────────
  const toTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toBottom = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  const togglePanel = (panel: Panel) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePanel((p) => (p === panel ? "none" : panel));
  };

  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  const speedLabels: Record<number, string> = { 1: "Lambat", 2: "Sedang", 3: "Cepat", 5: "Sangat Cepat" };

  return (
    <>
      {/* ── Top floating bar ───────────────────────────────────────────── */}
      <div
        data-dock
        onClick={stopProp}
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-surface/95 backdrop-blur-md border border-border rounded-full px-3 py-2 shadow-2xl text-sm transition-all duration-300 max-w-[90vw] ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <button
          data-dock
          onClick={(e) => { e.stopPropagation(); router.push(`/comic/${comicSlug}`); }}
          aria-label="Kembali ke daftar chapter"
          className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-surface2 text-muted hover:text-accent transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-muted text-xs flex-shrink-0 truncate max-w-[40vw]">{comicTitle}</span>
        <span className="text-border text-xs flex-shrink-0">›</span>
        <span className="text-text text-xs font-medium flex-shrink-0">Chapter {chapterNumber}</span>
      </div>

      {/* ── Bottom dock container ──────────────────────────────────────── */}
      <div data-dock className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
        style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* ── Pop-up panels ──────────────────────────────────────────────── */}
      {visible && activePanel === "search" && (
        <div
          data-dock
          onClick={stopProp}
          className="bg-surface border border-border rounded-2xl shadow-2xl w-64 overflow-hidden"
        >
          <div className="px-3 pt-3 pb-2">
            <input
              autoFocus
              type="number"
              min="0"
              placeholder="Ketik nomor chapter..."
              value={searchVal}
              onChange={(e) => { setSearchVal(e.target.value); }}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-all"
            />
          </div>
          {/* Live results */}
          <div className="max-h-48 overflow-y-auto divide-y divide-border">
            {searchVal === "" ? (
              <p className="text-xs text-muted text-center py-3">Ketik angka untuk cari chapter</p>
            ) : (() => {
              const results = allChapters.filter((c) => c.number.includes(searchVal));
              if (results.length === 0) return (
                <p className="text-xs text-muted text-center py-3">Tidak ada chapter yang cocok</p>
              );
              return results.map((c) => (
                <button
                  key={c.slug}
                  data-dock
                  onClick={(e) => { e.stopPropagation(); router.push(`/comic/${comicSlug}/${c.slug}`); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-surface2 hover:text-accent transition-colors flex items-center justify-between group"
                >
                  <span>Chapter <span className="font-semibold">{c.number}</span></span>
                  <svg className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ));
            })()}
          </div>
        </div>
      )}

      {visible && activePanel === "settings" && (
        <div
          data-dock
          onClick={stopProp}
          className="bg-surface border border-border rounded-2xl px-4 py-3 shadow-2xl w-64"
        >
          <p className="text-xs text-muted mb-2 text-center">Kecepatan Auto-Scroll</p>
          <div className="flex justify-between gap-1">
            {([1, 2, 3, 5] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  speed === s
                    ? "bg-accent text-white"
                    : "bg-surface2 text-muted hover:text-text border border-border"
                }`}
              >
                {speedLabels[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main dock bar ──────────────────────────────────────────────── */}
      <div
        data-dock
        onClick={stopProp}
        className={`flex items-center gap-1 bg-surface/95 backdrop-blur-md border border-border rounded-full px-2 py-2 shadow-2xl transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        {/* Scroll to top */}
        <DockBtn onClick={toTop} label="Atas">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </DockBtn>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Prev chapter */}
        {prevChapterSlug ? (
          <DockBtn onClick={(e) => { e.stopPropagation(); router.push(`/comic/${comicSlug}/${prevChapterSlug}`); }} label="Chapter Sebelumnya">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </DockBtn>
        ) : (
          <DockBtn disabled label="Sudah chapter pertama">
            <svg className="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </DockBtn>
        )}

        {/* Search */}
        <DockBtn onClick={togglePanel("search")} label="Cari Chapter" active={activePanel === "search"}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </DockBtn>

        {/* Play / Pause */}
        <DockBtn
          onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); setActivePanel("none"); }}
          label={playing ? "Pause" : "Auto Scroll"}
          active={playing}
          accent={playing}
        >
          {playing ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </DockBtn>

        {/* Settings */}
        <DockBtn onClick={togglePanel("settings")} label="Kecepatan Scroll" active={activePanel === "settings"}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </DockBtn>

        {/* Next chapter OR Home */}
        {nextChapterSlug ? (
          <DockBtn onClick={(e) => { e.stopPropagation(); router.push(`/comic/${comicSlug}/${nextChapterSlug}`); }} label="Chapter Berikutnya">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </DockBtn>
        ) : (
          <DockBtn onClick={(e) => { e.stopPropagation(); router.push("/"); }} label="Kembali ke Beranda">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </DockBtn>
        )}

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Scroll to bottom */}
        <DockBtn onClick={toBottom} label="Bawah">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </DockBtn>
      </div>

      {/* Chapter indicator pill */}
      {visible && (
        <div
          data-dock
          onClick={stopProp}
          className="text-[10px] text-muted bg-surface/80 border border-border rounded-full px-3 py-0.5 backdrop-blur-sm"
        >
          Chapter {chapterNumber}
        </div>
      )}
    </div>
    </>
  );
}

// ── Helper button component ───────────────────────────────────────────────
function DockBtn({
  children,
  onClick,
  label,
  active,
  accent,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  label: string;
  active?: boolean;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      data-dock
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 ${
        disabled
          ? "cursor-not-allowed"
          : accent
          ? "bg-accent text-white shadow-lg shadow-accent/30"
          : active
          ? "bg-surface2 text-accent border border-accent/40"
          : "text-muted hover:text-text hover:bg-surface2"
      }`}
    >
      {children}
    </button>
  );
}
