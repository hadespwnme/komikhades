"use client";

import Link from "next/link";
import type { ComicSummary, ReadingProgress } from "@/types/comic";

interface Props {
  comic: ComicSummary;
  progress?: ReadingProgress;
  updatedAgo?: string;
}

export default function ComicCard({ comic, progress, updatedAgo }: Props) {
  return (
    <Link href={`/comic/${comic.slug}`} className="group block card-hover">
      {/* Cover */}
      <div className="relative aspect-[2/3] rounded-[14px] overflow-hidden bg-surface2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={comic.thumbnail}
          alt={comic.title}
          className="absolute inset-0 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ height: "100%" }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Type badge */}
        <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/90 text-white backdrop-blur-sm">
          {comic.type}
        </span>

        {/* Status badge */}
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
          comic.status === "End"
            ? "bg-black/60 text-muted border border-border"
            : "bg-green-900/80 text-green-300"
        }`}>
          {comic.status === "End" ? "Tamat" : "Ongoing"}
        </span>

        {/* Bottom overlay: title + info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3
            className="text-sm font-normal text-white leading-tight line-clamp-2 mb-1"
            style={{ fontFamily: "'Righteous', sans-serif" }}
          >
            {comic.title}
          </h3>

          {/* Chapter + relative time */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] text-accent font-semibold">
              Ch. {comic.latest_chapter}
            </span>
            {updatedAgo && (
              <span className="text-[10px] text-white/50 truncate">
                {updatedAgo}
              </span>
            )}
          </div>

          {/* Reading progress badge */}
          {progress && (
            <div className="mt-1.5 text-[10px] rounded-md bg-accent/15 border border-accent/25 px-2 py-0.5 text-accent font-medium flex items-center gap-1">
              <span>▶</span>
              <span>Ch. {progress.lastChapterNum} · Hal. {progress.lastPage + 1}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
