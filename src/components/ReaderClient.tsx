"use client";

import { useEffect, useRef, useState } from "react";
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
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Save progress whenever the visible page changes
  useEffect(() => {
    setChapterProgress(comicSlug, {
      lastChapter: chapter.slug,
      lastChapterNum: chapter.number,
      lastPage: currentPage,
      updatedAt: Date.now(),
    });
  }, [comicSlug, chapter, currentPage, setChapterProgress]);

  // Track which page is in view using IntersectionObserver
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
      { threshold: 0.4 }
    );
    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pages]);

  return (
    <div className="max-w-3xl mx-auto px-2 pb-16 pt-4">
      {/* Top nav */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-xl text-sm mb-4">
        <Link
          href={`/comic/${comicSlug}`}
          className="text-muted hover:text-text transition-colors text-xs"
        >
          ← {comicTitle}
        </Link>
        <span className="font-semibold">Chapter {chapter.number}</span>
        <span className="text-muted text-xs">
          {pages.length > 0 ? `${currentPage + 1} / ${pages.length}` : ""}
        </span>
      </div>

      {/* Chapter navigation */}
      <div className="flex gap-2 mb-4">
        {prevChapter ? (
          <Link
            href={`/comic/${comicSlug}/${prevChapter.slug}`}
            className="flex-1 text-center py-2 rounded-lg bg-surface2 border border-border text-sm hover:border-accent transition-colors"
          >
            ← Ch. {prevChapter.number}
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextChapter ? (
          <Link
            href={`/comic/${comicSlug}/${nextChapter.slug}`}
            className="flex-1 text-center py-2 rounded-lg bg-surface2 border border-border text-sm hover:border-accent transition-colors"
          >
            Ch. {nextChapter.number} →
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Pages */}
      {pages.length === 0 ? (
        <div className="text-center py-24 text-muted">
          <p className="text-4xl mb-3">⚠️</p>
          <p>Gagal memuat gambar chapter ini.</p>
          <p className="text-xs mt-1">Coba refresh halaman.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {pages.map((src, idx) => (
            <div
              key={idx}
              ref={(el) => { pageRefs.current[idx] = el; }}
              className="relative w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Page ${idx + 1}`}
                className="reader-img"
                loading={idx < 3 ? "eager" : "lazy"}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-xl text-sm mt-6">
        {prevChapter ? (
          <Link
            href={`/comic/${comicSlug}/${prevChapter.slug}`}
            className="text-muted hover:text-accent transition-colors"
          >
            ← Ch. {prevChapter.number}
          </Link>
        ) : (
          <span />
        )}
        <Link
          href={`/comic/${comicSlug}`}
          className="text-xs text-muted hover:text-text transition-colors"
        >
          Daftar Chapter
        </Link>
        {nextChapter ? (
          <Link
            href={`/comic/${comicSlug}/${nextChapter.slug}`}
            className="text-accent hover:text-accent-hover transition-colors font-medium"
          >
            Ch. {nextChapter.number} →
          </Link>
        ) : (
          <span className="text-muted text-xs">Selesai 🎉</span>
        )}
      </div>
    </div>
  );
}
