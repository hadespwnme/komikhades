"use client";

import { useEffect, useRef, useState } from "react";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import FloatingDock from "@/components/FloatingDock";
import type { Chapter } from "@/types/comic";

interface Props {
  comicSlug: string;
  comicTitle: string;
  thumbnail: string;
  chapter: Chapter;
  pages: string[];
  prevChapter?: Chapter;
  nextChapter?: Chapter;
  allChapters: { slug: string; number: string }[];
}

export default function ReaderClient({
  comicSlug,
  comicTitle,
  thumbnail,
  chapter,
  pages,
  prevChapter,
  nextChapter,
  allChapters,
}: Props) {
  const { setChapterProgress } = useReadingProgress();
  const [currentPage, setCurrentPage] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Save progress locally + to Supabase history (fire and forget)
  useEffect(() => {
    setChapterProgress(comicSlug, {
      lastChapter: chapter.slug,
      lastChapterNum: chapter.number,
      lastPage: currentPage,
      updatedAt: Date.now(),
    });
    import("@/lib/actions").then(({ upsertHistory }) => {
      upsertHistory(comicSlug, comicTitle, thumbnail, chapter.slug, chapter.number, currentPage).catch(() => {});
    });
  }, [comicSlug, comicTitle, thumbnail, chapter, currentPage, setChapterProgress]);

  // Track current page via IntersectionObserver
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

  return (
    <div
      className="min-h-screen bg-bg"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Page images — full width, no padding */}
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-muted px-4">
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

          {/* End of chapter spacer so dock doesn't cover last page */}
          <div className="h-32" />
        </div>
      )}

      {/* Floating Dock */}
      <FloatingDock
        comicSlug={comicSlug}
        comicTitle={comicTitle}
        chapterNumber={chapter.number}
        prevChapterSlug={prevChapter?.slug}
        nextChapterSlug={nextChapter?.slug}
        allChapters={allChapters}
      />
    </div>
  );
}
