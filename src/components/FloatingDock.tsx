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
  const [speed, setSpeed] = useState(2);
  const [searchVal, setSearchVal] = useState("");
  // Infinity chapter
  const [infinityOn, setInfinityOn] = useState(false);
  const [infinityDelay, setInfinityDelay] = useState<"instant" | 3 | 5>("instant");
  const infinityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rafRef = useRef<number | null>(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  const goNextChapter = useCallback(() => {
    if (nextChapterSlug) {
      router.push(`/comic/${comicSlug}/${nextChapterSlug}`);
    }
  }, [router, comicSlug, nextChapterSlug]);

  const autoScroll = useCallback(() => {
    window.scrollBy({ top: speed, behavior: "instant" });

    const atBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 10;

    if (atBottom) {
      setPlaying(false);
      // Infinity chapter handled by scroll listener below
      return;
    }
    rafRef.current = requestAnimationFrame(autoScroll);
  }, [speed, infinityOn, infinityDelay, nextChapterSlug, goNextChapter]);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(autoScroll);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (infinityTimer.current) clearTimeout(infinityTimer.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (infinityTimer.current) clearTimeout(infinityTimer.current);
    };
  }, [playing, autoScroll]);

  // ── Infinity chapter on manual scroll ───────────────────────────────────
  useEffect(() => {
    if (!infinityOn || !nextChapterSlug) return;

    let triggered = false;

    const handleScroll = () => {
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;

      if (atBottom && !triggered) {
        triggered = true;
        if (infinityDelay === "instant") {
          router.push(`/comic/${comicSlug}/${nextChapterSlug}`);
        } else {
          infinityTimer.current = setTimeout(() => {
            router.push(`/comic/${comicSlug}/${nextChapterSlug}`);
          }, infinityDelay * 1000);
        }
      }

      if (!atBottom && triggered) {
        triggered = false;
        if (infinityTimer.current) {
          clearTimeout(infinityTimer.current);
          infinityTimer.current = null;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Also check immediately in case page is already at bottom
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (infinityTimer.current) {
        clearTimeout(infinityTimer.current);
        infinityTimer.current = null;
      }
    };
  }, [infinityOn, infinityDelay, nextChapterSlug, comicSlug, router]);

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
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-surface/95 backdrop-blur-md border border-border rounded-full px-2 py-1.5 shadow-2xl transition-all duration-300 w-[90vw] max-w-sm ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <button
          data-dock
          onClick={(e) => { e.stopPropagation(); router.push(`/comic/${comicSlug}`); }}
          aria-label="Kembali ke daftar chapter"
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface2 text-muted hover:text-accent transition-colors flex-shrink-0"
        >
          {/* Back arrow */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1 flex-1 min-w-0 justify-center">
          <span className="text-muted text-xs truncate max-w-[25vw]">{comicTitle}</span>
          <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-text text-xs font-medium flex-shrink-0 whitespace-nowrap">Ch. {chapterNumber}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-border flex-shrink-0" />

        {/* Home */}
        <button
          data-dock
          onClick={(e) => { e.stopPropagation(); router.push("/"); }}
          aria-label="Kembali ke beranda"
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface2 text-muted hover:text-accent transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
        </button>
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
          className="bg-surface border border-border rounded-2xl px-4 py-4 shadow-2xl w-72 space-y-4"
        >
          {/* Auto-scroll speed */}
          <div>
            <p className="text-xs text-muted mb-2 text-center uppercase tracking-wide">Kecepatan Scroll</p>
            <div className="flex justify-between gap-1">
              {([1, 2, 3, 5] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    speed === s
                      ? "text-white"
                      : "bg-surface2 text-muted hover:text-text border border-border"
                  }`}
                  style={speed === s ? {
                    background: "linear-gradient(135deg, #f97316, #f5c518)",
                    boxShadow: "0 2px 8px rgba(249,115,22,0.35)"
                  } : {}}
                >
                  {speedLabels[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Infinity Chapter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-text font-semibold">∞ Infinity Chapter</p>
                <p className="text-[10px] text-muted mt-0.5">Auto pindah chapter saat halaman habis</p>
              </div>
              {/* Toggle */}
              <button
                data-dock
                onClick={(e) => { e.stopPropagation(); setInfinityOn(v => !v); }}
                className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                style={infinityOn ? {
                  background: "linear-gradient(135deg, #f97316, #f5c518)",
                  boxShadow: "0 2px 8px rgba(249,115,22,0.4)"
                } : { background: "#2a2a30" }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                  style={{ left: infinityOn ? "calc(100% - 1.375rem)" : "0.125rem" }}
                />
              </button>
            </div>

            {/* Delay options — only shown when infinity is on */}
            {infinityOn && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-2">Jeda antar chapter</p>
                {(["instant", 5, 3] as const).map((d) => (
                  <button
                    key={String(d)}
                    data-dock
                    onClick={(e) => { e.stopPropagation(); setInfinityDelay(d); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all border"
                    style={infinityDelay === d ? {
                      background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(245,197,24,0.1))",
                      borderColor: "#f5c518",
                      color: "#f5c518",
                    } : {
                      background: "transparent",
                      borderColor: "rgba(255,255,255,0.08)",
                      color: "#8a8f98"
                    }}
                  >
                    <span className="font-medium">
                      {d === "instant" ? "⚡ Instan" : d === 5 ? "⏱ 5 detik" : "⏳ 3 detik"}
                    </span>
                    {infinityDelay === d && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main dock — individual circle buttons ──────────────────────── */}
      <div
        data-dock
        onClick={stopProp}
        className={`flex items-center gap-2.5 transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        {/* Prev chapter */}
        {prevChapterSlug ? (
          <DockBtn onClick={(e) => { e.stopPropagation(); router.push(`/comic/${comicSlug}/${prevChapterSlug}`); }} label="Chapter Sebelumnya">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </DockBtn>

        {/* Play / Pause */}
        <DockBtn
          onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); setActivePanel("none"); }}
          label={playing ? "Pause" : "Auto Scroll"}
          active={playing}
          accent={playing}
          large
        >
          {playing ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </DockBtn>

        {/* Settings */}
        <DockBtn onClick={togglePanel("settings")} label="Kecepatan Scroll" active={activePanel === "settings"}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </DockBtn>

        {/* Next chapter OR Home */}
        {nextChapterSlug ? (
          <DockBtn onClick={(e) => { e.stopPropagation(); router.push(`/comic/${comicSlug}/${nextChapterSlug}`); }} label="Chapter Berikutnya">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </DockBtn>
        ) : (
          <DockBtn onClick={(e) => { e.stopPropagation(); router.push("/"); }} label="Kembali ke Beranda">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </DockBtn>
        )}
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

      {/* ── Scroll buttons — fixed right side ─────────────────────────── */}
      <div
        data-dock
        className={`fixed right-4 bottom-24 z-50 flex flex-col gap-2 transition-all duration-300 ${
          visible ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-4 pointer-events-none"
        }`}
      >
        <button
          data-dock
          onClick={toTop}
          aria-label="Ke atas"
          className="w-12 h-12 rounded-full bg-surface/95 backdrop-blur-md border border-border flex items-center justify-center text-muted hover:text-text hover:border-accent/40 transition-all active:scale-90 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          data-dock
          onClick={toBottom}
          aria-label="Ke bawah"
          className="w-12 h-12 rounded-full bg-surface/95 backdrop-blur-md border border-border flex items-center justify-center text-muted hover:text-text hover:border-accent/40 transition-all active:scale-90 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
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
  large,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  label: string;
  active?: boolean;
  accent?: boolean;
  disabled?: boolean;
  large?: boolean;
}) {
  return (
    <button
      data-dock
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 shadow-lg backdrop-blur-md border ${
        large ? "w-14 h-14" : "w-12 h-12"
      } ${
        disabled
          ? "cursor-not-allowed bg-surface/80 border-border"
          : accent
          ? "text-white border-transparent"
          : active
          ? "bg-surface border-accent/50 text-accent"
          : "bg-surface/95 border-border text-muted hover:text-text hover:border-accent/40"
      }`}
      style={accent ? {
        background: "linear-gradient(135deg, #f97316, #f5c518)",
        boxShadow: "0 4px 16px rgba(249,115,22,0.4)"
      } : {}}
    >
      {children}
    </button>
  );
}
