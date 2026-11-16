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
      <div className="text-center py-24 text-muted">
        <p className="text-5xl mb-4">📚</p>
        <p>Belum ada komik. Jalankan scraper dulu.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
