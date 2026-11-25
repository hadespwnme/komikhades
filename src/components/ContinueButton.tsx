"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Props {
  comicSlug: string;
  firstChapterSlug: string;
}

export default function ContinueButton({ comicSlug, firstChapterSlug }: Props) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "continue"; chapterSlug: string; chapterNum: string }
    | { status: "start" }
  >({ status: "loading" });

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // Logged in — fetch from Supabase (cross-device source of truth)
        const { data } = await supabase
          .from("reading_history")
          .select("chapter_slug, chapter_num")
          .eq("user_id", user.id)
          .eq("comic_slug", comicSlug)
          .maybeSingle();

        if (data) {
          setState({ status: "continue", chapterSlug: data.chapter_slug, chapterNum: data.chapter_num });
          return;
        }
      } else {
        // Not logged in — check localStorage
        try {
          const raw = localStorage.getItem("komikhades_progress");
          if (raw) {
            const map = JSON.parse(raw);
            const entry = map[comicSlug];
            if (entry?.lastChapter) {
              setState({ status: "continue", chapterSlug: entry.lastChapter, chapterNum: entry.lastChapterNum });
              return;
            }
          }
        } catch {
          // ignore
        }
      }
      setState({ status: "start" });
    });
  }, [comicSlug]);

  if (state.status === "loading") {
    return <div className="h-9 w-28 rounded-xl bg-surface2 animate-pulse" />;
  }

  if (state.status === "continue") {
    return (
      <Link
        href={`/comic/${comicSlug}/${state.chapterSlug}`}
        className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl btn-gold text-sm"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Lanjutkan Ch. {state.chapterNum}
      </Link>
    );
  }

  return (
    <Link
      href={`/comic/${comicSlug}/${firstChapterSlug}`}
      className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl btn-gold text-sm"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      Baca
    </Link>
  );
}
