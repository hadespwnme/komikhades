"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import type { Chapter } from "@/types/comic";

interface Props {
  comicSlug: string;
  comicTitle: string;
  chapter: Chapter;
  pages: string[];
  prevChapter?: Chapter;
  nextChapter?: Chapter;
}

export default function ReaderClient({
  comicSlug,
  comicTitle,
  chapter,
  pages,
  prevChapter,
  nextChapter,
}: Props) {
  const { setChapterProgress } = useReadingProgress();
  const [currentPage, setCurrentPage] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Save progress
  useEffect(() => {
    setChapterProgress(comicSlug, {
      lastChapter: chapter.slug,
      lastChapterNum: chapter.number,
      lastPage: currentPage,
      updatedAt: Date.now(),
    });
  }, [comicSlug, chapter, currentPage, setChapterProgress]);

  // Track current page
  useEffect(() => {
    if (pages.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = pageRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) setCurrentPage(idx);
          }
        });
      },
      { threshold: 0.3 }
    );
    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pages]);

  // Auto-hide header on scroll down
  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setHeaderVisible(y < lastScrollY || y < 60);
    setLastScrollY(y);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const progress = pages.length > 0 ? ((currentPage + 1) / pages.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Sticky header — auto-hides on scroll */}
      <div
        className={`sticky top-14 z-40 transition-transform duration-300 ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="bg-surface/95 backdrop-blur-md border-b border-border">
          <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
            <Link
              href={`/comic/${comicSlug}`}
              className="flex items-center gap-1.5 text-muted hover:text-accent transition-colors text-xs flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{comicTitle}</span>
              <span className="sm:hidden">Kembali</span>
            </Link>

            <span
              className="text-text font-normal text-sm truncate"
              style={{ fontFamily: "'Righteous', sans-serif" }}
            >
              Chapter {chapter.number}
            </span>

            <span className="text-muted text-xs flex-shrink-0">
              {pages.length > 0 ? `${currentPage + 1}/${pages.length}` : "—"}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-surface2">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chapter nav */}
      <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
        {prevChapter ? (
          <Link
            href={`/comic/${comicSlug}/${prevChapter.slug}`}
            className="flex-1 text-center py-2.5 rounded-xl bg-surface border border-border text-sm text-muted hover:text-text hover:border-accent/40 transition-all"
          >
            ← Ch. {prevChapter.number}
          </Link>
        ) : <div className="flex-1" />}
        {nextChapter ? (
          <Link
            href={`/comic/${comicSlug}/${nextChapter.slug}`}
            className="flex-1 text-center py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent2 transition-colors"
          >
            Ch. {nextChapter.number} →
          </Link>
        ) : <div className="flex-1" />}
      </div>

      {/* Pages */}
      <div className="max-w-3xl mx-auto">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted">
            <div className="w-14 h-14 rounded-2xl bg-surface2 flex items-center justify-center text-2xl">⚠️</div>
            <div className="text-center">
              <p className="text-text font-medium mb-1">Gagal memuat gambar</p>
              <p className="text-sm">Coba refresh halaman</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {pages.map((src, idx) => (
              <div
                key={idx}
                ref={(el) => { pageRefs.current[idx] = el; }}
                className="relative w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Halaman ${idx + 1}`}
                  className="reader-img"
                  loading={idx < 2 ? "eager" : "lazy"}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          {prevChapter ? (
            <Link href={`/comic/${comicSlug}/${prevChapter.slug}`}
              className="flex-1 text-center py-3 rounded-xl bg-surface border border-border text-sm text-muted hover:text-text hover:border-accent/40 transition-all">
              ← Ch. {prevChapter.number}
            </Link>
          ) : <div className="flex-1" />}
          {nextChapter ? (
            <Link href={`/comic/${comicSlug}/${nextChapter.slug}`}
              className="flex-1 text-center py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent2 transition-colors shadow-lg shadow-accent/20">
              Ch. {nextChapter.number} →
            </Link>
          ) : (
            <div className="flex-1 flex items-center justify-center py-3 rounded-xl bg-surface border border-border text-sm text-muted">
              🎉 Selesai
            </div>
          )}
        </div>
        <Link
          href={`/comic/${comicSlug}`}
          className="block w-full text-center py-3 rounded-xl bg-surface2 border border-border text-sm text-muted hover:text-text transition-colors"
        >
          ☰ Daftar Chapter
        </Link>
      </div>
    </div>
  );
}
