"use client";

import ComicCard from "./ComicCard";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import type { ComicSummary } from "@/types/comic";

interface Props {
  comics: ComicSummary[];
}

export default function ComicGrid({ comics }: Props) {
  const { getProgress } = useReadingProgress();

  if (comics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center text-3xl">
          📚
        </div>
        <div className="text-center">
          <p className="font-semibold text-text mb-1">Belum ada komik</p>
          <p className="text-sm">Jalankan scraper untuk menambah komik.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {comics.map((comic) => (
        <ComicCard
          key={comic.slug}
          comic={comic}
          progress={getProgress(comic.slug)}
        />
      ))}
    </div>
  );
}
