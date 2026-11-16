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
      if (!user) {
        setState({ status: "start" });
        return;
      }
      const { data } = await supabase
        .from("reading_history")
        .select("chapter_slug, chapter_num")
        .eq("user_id", user.id)
        .eq("comic_slug", comicSlug)
        .maybeSingle();

      if (data) {
        setState({ status: "continue", chapterSlug: data.chapter_slug, chapterNum: data.chapter_num });
      } else {
        setState({ status: "start" });
      }
    });
  }, [comicSlug]);

  if (state.status === "loading") {
    return (
      <div className="h-9 w-28 rounded-xl bg-surface2 animate-pulse" />
    );
  }

  if (state.status === "continue") {
    return (
      <Link
        href={`/comic/${comicSlug}/${state.chapterSlug}`}
        className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent2 transition-colors shadow-lg shadow-accent/20"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <span>Lanjutkan Ch. {state.chapterNum}</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/comic/${comicSlug}/${firstChapterSlug}`}
      className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent2 transition-colors shadow-lg shadow-accent/20"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      Baca
    </Link>
  );
}
