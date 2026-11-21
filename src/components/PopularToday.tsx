"use client";

import Link from "next/link";

interface PopularItem {
  slug: string;
  title: string;
  score: number;
  thumbnail: string;
}

interface Props {
  items: PopularItem[];
}

export default function PopularToday({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-accent font-semibold uppercase tracking-widest">
          🔥 Populer Hari Ini
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scroll-smooth snap-x">
        {items.map((item, idx) => (
          <Link
            key={item.slug}
            href={`/comic/${item.slug}`}
            className="group flex-shrink-0 w-28 sm:w-32 snap-start"
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface2 card-hover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ height: "100%" }}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

              {/* Rank number */}
              <span className="absolute top-1.5 left-1.5 text-sm font-bold text-white drop-shadow-lg"
                style={{ fontFamily: "'Righteous', sans-serif" }}>
                #{idx + 1}
              </span>

              {/* Score badge */}
              <span className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/90 text-white backdrop-blur-sm">
                {item.score.toFixed(1)}
              </span>

              {/* Title at bottom */}
              <p className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-medium line-clamp-2 leading-tight">
                {item.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
