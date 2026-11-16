"use client";

import Link from "next/link";
import Image from "next/image";
import type { ComicSummary, ReadingProgress } from "@/types/comic";

interface Props {
  comic: ComicSummary;
  progress?: ReadingProgress;
}

export default function ComicCard({ comic, progress }: Props) {
  return (
    <Link
      href={`/comic/${comic.slug}`}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:-translate-y-1 shadow-lg"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={comic.thumbnail}
          alt={comic.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
        {/* Status badge */}
        <span
          className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            comic.status === "End"
              ? "bg-gray-700 text-gray-300"
              : "bg-green-700 text-green-200"
          }`}
        >
          {comic.status || "Ongoing"}
        </span>
        {/* Type badge */}
        <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
          {comic.type}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {comic.title}
        </h3>
        <p className="text-xs text-[var(--muted)]">{comic.author}</p>

        <div className="mt-auto pt-2 flex items-center justify-between text-xs">
          <span className="text-[var(--muted)]">
            {comic.chapter_count} chapter
          </span>
          <span className="text-[var(--accent)]">
            Ch. {comic.latest_chapter}
          </span>
        </div>

        {/* Reading progress */}
        {progress && (
          <div className="mt-1 text-[10px] rounded-md bg-[var(--surface2)] px-2 py-1 text-[var(--muted)]">
            Lanjut Ch. {progress.lastChapterNum} · Hal. {progress.lastPage + 1}
          </div>
        )}
      </div>
    </Link>
  );
}
