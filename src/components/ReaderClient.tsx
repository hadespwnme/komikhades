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

interface LoadedChapter {
  slug: string;
  number: string;
  pages: string[];
}

interface ReadingPosition {
  chapterSlug: string;
  chapterNumber: string;
  page: number;
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
  const initialSection = { slug: chapter.slug, number: chapter.number, pages };
  const [sections, setSections] = useState<LoadedChapter[]>([initialSection]);
  const [position, setPosition] = useState<ReadingPosition>({
    chapterSlug: chapter.slug,
    chapterNumber: chapter.number,
    page: 0,
  });
  const [infinityOn, setInfinityOn] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const pageRefs = useRef(new Map<string, HTMLDivElement>());
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialIndex = allChapters.findIndex((item) => item.slug === chapter.slug);
  const nextToLoad = allChapters[initialIndex + sections.length];
  const activeIndex = allChapters.findIndex((item) => item.slug === position.chapterSlug);
  const activeNextSlug = allChapters[activeIndex + 1]?.slug ?? nextChapter?.slug;

  // Save progress locally + to Supabase (debounced 2s to avoid spam)
  useEffect(() => {
    setChapterProgress(comicSlug, {
      lastChapter: position.chapterSlug,
      lastChapterNum: position.chapterNumber,
      lastPage: position.page,
      updatedAt: Date.now(),
    });

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      import("@/lib/actions").then(({ upsertHistory }) => {
        upsertHistory(
          comicSlug,
          comicTitle,
          thumbnail,
          position.chapterSlug,
          position.chapterNumber,
          position.page
        ).catch(() => {});
      });
    }, 2000);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [comicSlug, comicTitle, thumbnail, position, setChapterProgress]);

  // Track the chapter and page currently visible.
  useEffect(() => {
    if (sections.every((section) => section.pages.length === 0)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLDivElement;
          setPosition({
            chapterSlug: element.dataset.chapterSlug ?? chapter.slug,
            chapterNumber: element.dataset.chapterNumber ?? chapter.number,
            page: Number(element.dataset.page ?? 0),
          });
        });
      },
      { threshold: 0.3 }
    );
    pageRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [chapter.number, chapter.slug, sections]);

  const loadNextChapter = async () => {
    if (!nextToLoad || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingNext(true);
    setLoadError(false);
    try {
      const response = await fetch(
        `/api/comic/${encodeURIComponent(comicSlug)}/${encodeURIComponent(nextToLoad.slug)}/pages`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Failed to load chapter");
      const data = (await response.json()) as { pages?: string[] };
      setSections((current) => [
        ...current,
        { slug: nextToLoad.slug, number: nextToLoad.number, pages: data.pages ?? [] },
      ]);
    } catch {
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      setLoadingNext(false);
    }
  };

  // Load the next chapter before the reader reaches the end.
  useEffect(() => {
    if (!infinityOn || !nextToLoad || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      () => { void loadNextChapter(); },
      { rootMargin: "800px 0px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [infinityOn, nextToLoad?.slug, sections.length]);

  const handleInfinityChange = (enabled: boolean) => {
    setInfinityOn(enabled);
    if (!enabled) {
      setSections([initialSection]);
      setPosition({ chapterSlug: chapter.slug, chapterNumber: chapter.number, page: 0 });
      setLoadError(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {sections[0].pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-muted px-4">
          <div className="w-14 h-14 rounded-2xl bg-surface2 flex items-center justify-center text-2xl">⚠️</div>
          <div className="text-center">
            <p className="text-text font-medium mb-1">Gagal memuat gambar</p>
            <p className="text-sm">Coba refresh halaman</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {sections.map((section) => (
            <section key={section.slug} aria-label={`Chapter ${section.number}`}>
              {section.pages.map((src, idx) => {
                const refKey = `${section.slug}:${idx}`;
                return (
                  <div
                    key={refKey}
                    ref={(element) => {
                      if (element) pageRefs.current.set(refKey, element);
                      else pageRefs.current.delete(refKey);
                    }}
                    data-chapter-slug={section.slug}
                    data-chapter-number={section.number}
                    data-page={idx}
                    className="relative w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Chapter ${section.number}, halaman ${idx + 1}`}
                      className="reader-img"
                      loading={idx < 2 && section === sections[0] ? "eager" : "lazy"}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                );
              })}
              <div className="h-32" />
            </section>
          ))}

          {infinityOn && nextToLoad && (
            <div ref={loadMoreRef} className="min-h-16 flex items-center justify-center px-4 pb-24 text-xs text-muted">
              {loadError ? (
                <button onClick={() => void loadNextChapter()} className="text-accent hover:underline">
                  Gagal memuat chapter berikutnya · Coba lagi
                </button>
              ) : loadingNext ? (
                <span>Memuat chapter {nextToLoad.number}...</span>
              ) : null}
            </div>
          )}
        </div>
      )}

      <FloatingDock
        comicSlug={comicSlug}
        comicTitle={comicTitle}
        chapterNumber={position.chapterNumber}
        prevChapterSlug={prevChapter?.slug}
        nextChapterSlug={activeNextSlug}
        allChapters={allChapters}
        infinityOn={infinityOn}
        onInfinityChange={handleInfinityChange}
      />
    </div>
  );
}
