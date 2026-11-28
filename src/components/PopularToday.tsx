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
  recommendation: RankItem[];
  daily: RankItem[];
  weekly: RankItem[];
  all_time: RankItem[];
}

interface Props { rankings: Rankings; }
type Period = "recommendation" | "daily" | "weekly" | "all_time";

const PERIOD_LABELS: Record<Period, string> = {
  recommendation: "Rekomendasi",
  daily: "Harian",
  weekly: "Mingguan",
  all_time: "All Time",
};

export default function PopularToday({ rankings }: Props) {
  const [period, setPeriod] = useState<Period>("recommendation");
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [heroWidth, setHeroWidth] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const swipeStart = useRef<number | null>(null);
  const items = (rankings[period] ?? []).filter((item) => item.slug);
  const isReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => setCurrent(0), [period]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const updateWidth = () => setHeroWidth(hero.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || isReducedMotion || items.length < 2) return;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % items.length), 4500);
    return () => window.clearInterval(timer);
  }, [isReducedMotion, items.length, paused, period]);

  if (!items.length) return null;

  const small = heroWidth > 0 && heroWidth < 640;
  const gap = small ? 118 : heroWidth < 900 ? 170 : 200;
  const cardWidth = small ? 150 : 200;
  const cardHeight = small ? 220 : 292;
  const move = (amount: number) => {
    setCurrent((index) => (index + amount + items.length) % items.length);
    setPaused(true);
  };

  return (
    <section className="mb-10" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Pilihan Shinigami</p>
          <h2 className="mt-1 text-xl text-text" style={{ fontFamily: "'Righteous', sans-serif" }}>Ranking Komik</h2>
        </div>
        <span className="text-xs text-muted">{current + 1}/{items.length}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((option) => <button key={option} type="button" onClick={() => setPeriod(option)} className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${period === option ? "bg-accent text-black shadow-[0_2px_12px_rgba(249,115,22,0.3)]" : "bg-surface text-muted hover:text-text"}`}>{PERIOD_LABELS[option]}</button>)}
      </div>

      <section
        ref={heroRef}
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label={`${PERIOD_LABELS[period]} komik`}
        className="relative h-[360px] overflow-hidden rounded-2xl bg-surface outline-none sm:h-[410px] focus-visible:ring-2 focus-visible:ring-accent"
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setPaused(true); }}
        onPointerLeave={(event) => { if (event.pointerType === "mouse") setPaused(false); }}
        onPointerDown={(event) => { swipeStart.current = event.clientX; }}
        onPointerUp={(event) => {
          if (swipeStart.current !== null && Math.abs(event.clientX - swipeStart.current) > 50) {
            move(event.clientX < swipeStart.current ? 1 : -1);
          }
          swipeStart.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(249,115,22,0.28),_transparent_68%)]" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-surface via-transparent to-surface opacity-80" />

        {items.map((item, index) => {
          let offset = index - current;
          if (offset > items.length / 2) offset -= items.length;
          if (offset < -items.length / 2) offset += items.length;
          const distance = Math.abs(offset);
          const x = offset === 0 ? 0 : Math.sign(offset) * (gap * 0.62 + (distance - 1) * gap * 0.88 + gap * 0.38);
          const scale = offset === 0 ? 1.12 : Math.max(0.78, 1 - distance * 0.08);
          const isHidden = distance > 3;

          return (
            <Link
              key={`${period}-${item.slug}`}
              href={`/comic/${item.slug}`}
              aria-label={`${item.title}, peringkat ${index + 1}`}
              className="absolute left-1/2 top-1/2 overflow-hidden rounded-xl bg-surface2 shadow-2xl transition-[transform,opacity,filter] duration-500 ease-out focus-visible:z-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              style={{
                width: cardWidth,
                height: cardHeight,
                transform: `translate(calc(-50% + ${x}px), -50%) scale(${scale})`,
                zIndex: 20 - distance,
                opacity: isHidden ? 0 : 1,
                filter: offset === 0 ? "none" : "brightness(0.58) saturate(0.9)",
                pointerEvents: isHidden ? "none" : "auto",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.thumbnail} alt="" className="h-full w-full object-cover" loading={distance < 2 ? "eager" : "lazy"} referrerPolicy="no-referrer" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-black/20" />
              <span className="absolute left-2.5 top-2.5 rounded-md bg-black/55 px-2 py-1 text-[10px] font-bold backdrop-blur-sm">#{index + 1}</span>
              {item.score > 0 && <span className="absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold backdrop-blur-sm"><span className="text-accent">★</span> {item.score.toFixed(1)}</span>}
              <span className="absolute bottom-3 left-3 right-3 line-clamp-2 text-lg font-bold leading-tight text-white drop-shadow-lg sm:text-2xl">{item.title}</span>
            </Link>
          );
        })}

        <button type="button" aria-label="Komik sebelumnya" onClick={() => move(-1)} className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-2xl text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:flex">‹</button>
        <button type="button" aria-label="Komik berikutnya" onClick={() => move(1)} className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-2xl text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:flex">›</button>
      </section>

      <div className="mt-3 flex justify-center gap-1.5 overflow-hidden px-4" aria-label="Pilih slide">
        {items.map((item, index) => <button key={`${item.slug}-dot`} type="button" aria-label={`Buka ${item.title}`} aria-current={index === current} onClick={() => { setCurrent(index); setPaused(true); }} className={`h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${index === current ? "w-7 bg-accent" : "w-2 bg-border hover:bg-muted"}`} />)}
      </div>

    </section>
  );
}
