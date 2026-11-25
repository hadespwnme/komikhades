"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || items.length === 0) return;

    let animId: number;

    const scroll = () => {
      if (!paused && container) {
        container.scrollLeft += 0.5;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(scroll);
    };

    animId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animId);
  }, [paused, items.length]);

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 2000)}
    >
      <div className="flex items-center mb-4">
        <span className="text-xs text-accent font-semibold uppercase tracking-widest">
          🔥 Populer Hari Ini
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {[...items, ...items].map((item, idx) => (
          <Link
            key={`${item.slug}-${idx}`}
            href={`/comic/${item.slug}`}
            className="group flex-shrink-0 w-28 sm:w-32"
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

              <span className="absolute top-1.5 left-1.5 text-sm font-bold text-white drop-shadow-lg"
                style={{ fontFamily: "'Righteous', sans-serif" }}>
                #{(idx % items.length) + 1}
              </span>

              <span className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm text-black" style={{background:"linear-gradient(135deg,#f97316,#f5c518)"}}>
                {item.score.toFixed(1)}
              </span>

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
