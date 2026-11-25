"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { removeBookmark, removeReadlist } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface BookmarkRow { id: string; comic_slug: string; comic_title: string; thumbnail: string; created_at: string; }
interface ReadlistRow { id: string; comic_slug: string; comic_title: string; thumbnail: string; created_at: string; }
interface HistoryRow  { id: string; comic_slug: string; comic_title: string; thumbnail: string; chapter_slug: string; chapter_num: string; last_page: number; read_at: string; }

interface Props {
  bookmarks: BookmarkRow[];
  readlist:  ReadlistRow[];
  history:   HistoryRow[];
}

type Tab = "bookmark" | "readlist" | "history";

export default function LibraryClient({ bookmarks, readlist, history }: Props) {
  const [tab, setTab] = useState<Tab>("bookmark");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "bookmark", label: "Bookmark",  count: bookmarks.length },
    { key: "readlist", label: "Read List", count: readlist.length },
    { key: "history",  label: "History",   count: history.length },
  ];

  const handleRemoveBookmark = (slug: string) => {
    startTransition(async () => { await removeBookmark(slug); router.refresh(); });
  };
  const handleRemoveReadlist = (slug: string) => {
    startTransition(async () => { await removeReadlist(slug); router.refresh(); });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl text-text" style={{ fontFamily: "'Righteous', sans-serif" }}>
          Library
        </h1>
        <p className="text-muted text-sm mt-1">Koleksi komik kamu</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "btn-gold shadow-md"
                : "text-muted hover:text-text"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-white/20" : "bg-surface2"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "bookmark" && (
        <ComicList
          items={bookmarks}
          emptyText="Belum ada bookmark"
          emptyHint="Tap tombol Bookmark di halaman komik untuk menyimpannya di sini."
          onRemove={handleRemoveBookmark}
          pending={pending}
        />
      )}
      {tab === "readlist" && (
        <ComicList
          items={readlist}
          emptyText="Read List kosong"
          emptyHint="Tambahkan komik ke Read List dari halaman detail komik."
          onRemove={handleRemoveReadlist}
          pending={pending}
        />
      )}
      {tab === "history" && (
        <HistoryList items={history} />
      )}
    </div>
  );
}

// ── Comic list (Bookmark / Read List) ─────────────────────────────────────
function ComicList({
  items, emptyText, emptyHint, onRemove, pending
}: {
  items: { comic_slug: string; comic_title: string; thumbnail: string }[];
  emptyText: string; emptyHint: string;
  onRemove: (slug: string) => void;
  pending: boolean;
}) {
  if (items.length === 0) return <EmptyState text={emptyText} hint={emptyHint} />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.comic_slug} className="relative group">
          <Link href={`/comic/${item.comic_slug}`}
            className="block rounded-xl overflow-hidden bg-surface border border-border hover:border-accent/40 transition-all card-hover">
            <div className="relative aspect-[2/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.thumbnail} alt={item.comic_title} className="w-full object-cover" style={{height:"100%"}} referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold line-clamp-2 leading-tight">
                {item.comic_title}
              </p>
            </div>
          </Link>
          {/* Remove button */}
          <button
            onClick={() => onRemove(item.comic_slug)}
            disabled={pending}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
            aria-label="Hapus"
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── History list ───────────────────────────────────────────────────────────
function HistoryList({ items }: { items: HistoryRow[] }) {
  if (items.length === 0) return <EmptyState text="Belum ada history" hint="History akan tercatat otomatis saat kamu membaca komik." />;
  return (
    <div className="flex flex-col divide-y divide-border rounded-2xl overflow-hidden border border-border bg-surface">
      {items.map((item) => (
        <Link
          key={item.comic_slug}
          href={`/comic/${item.comic_slug}/${item.chapter_slug}`}
          className="flex items-center gap-3 px-4 py-3 hover:bg-surface2 transition-colors"
        >
          <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail} alt={item.comic_title} className="w-full object-cover" style={{height:"100%"}} referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text text-sm font-medium truncate">{item.comic_title}</p>
            <p className="text-accent text-xs mt-0.5">Chapter {item.chapter_num} · Hal. {item.last_page + 1}</p>
            <p className="text-muted text-[11px] mt-0.5">
              {new Date(item.read_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ text, hint }: { text: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface2 flex items-center justify-center text-2xl">📚</div>
      <p className="text-text font-medium">{text}</p>
      <p className="text-muted text-sm max-w-xs">{hint}</p>
    </div>
  );
}
