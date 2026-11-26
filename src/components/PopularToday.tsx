"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface RankItem {
  slug: string;
  title: string;
  rank: number;
  score: number;
  thumbnail: string;
  latest_chapter: string;
  total_chapters: number;
}

interface Rankings {
  daily: RankItem[];
  weekly: RankItem[];
  all_time: RankItem[];
}

interface Props {
  rankings: Rankings;
}

type Period = "daily" | "weekly" | "all_time";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  all_time: "Sepanjang Masa",
};

export default function PopularToday({ rankings }: Props) {
  const [period, setPeriod] = useState<Period>("daily");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const items = (rankings[period] ?? []).filter((i) => i.slug);

  // Reset scroll position when tab changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [period]);

  // Auto-scroll
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
  }, [paused, items.length, period]);

  if (!items.length) return null;

  return (
    <div className="mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <span className="text-xs text-accent font-semibold uppercase tracking-widest">
          🏆 Ranking Komik
        </span>

        {/* Period tabs */}
        <div className="flex gap-1 p-1 bg-surface rounded-xl w-fit">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p ? "text-black" : "text-muted hover:text-text"
              }`}
              style={period === p ? {
                background: "linear-gradient(135deg, #f97316, #f5c518)",
                boxShadow: "0 2px 8px rgba(249,115,22,0.3)"
              } : {}}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 2000)}
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

              {/* Rank badge */}
              <span
                className="absolute top-1.5 left-1.5 text-sm font-bold drop-shadow-lg"
                style={{
                  fontFamily: "'Righteous', sans-serif",
                  color: (idx % items.length) < 3 ? "#f5c518" : "white",
                  textShadow: (idx % items.length) < 3 ? "0 0 8px rgba(245,197,24,0.8)" : "none",
                }}
              >
                #{(idx % items.length) + 1}
              </span>

              {/* Score */}
              {item.score > 0 && (
                <span className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-black backdrop-blur-sm"
                  style={{ background: "linear-gradient(135deg, #f97316, #f5c518)" }}>
                  {typeof item.score === 'number' ? item.score.toFixed(1) : item.score}
                </span>
              )}

              {/* Title */}
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
