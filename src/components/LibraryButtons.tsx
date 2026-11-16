"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addBookmark, removeBookmark, addReadlist, removeReadlist } from "@/lib/actions";

interface Props {
  comicSlug: string;
  comicTitle: string;
  thumbnail: string;
}

export default function LibraryButtons({ comicSlug, comicTitle, thumbnail }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReadlisted, setIsReadlisted] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setLoggedIn(true);
      const [b, r] = await Promise.all([
        supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("comic_slug", comicSlug).maybeSingle(),
        supabase.from("readlist").select("id").eq("user_id", user.id).eq("comic_slug", comicSlug).maybeSingle(),
      ]);
      setIsBookmarked(!!b.data);
      setIsReadlisted(!!r.data);
    });
  }, [comicSlug]);

  if (!loggedIn) return null;

  const handleBookmark = () => {
    startTransition(async () => {
      if (isBookmarked) {
        await removeBookmark(comicSlug);
        setIsBookmarked(false);
      } else {
        await addBookmark(comicSlug, comicTitle, thumbnail);
        setIsBookmarked(true);
      }
    });
  };

  const handleReadlist = () => {
    startTransition(async () => {
      if (isReadlisted) {
        await removeReadlist(comicSlug);
        setIsReadlisted(false);
      } else {
        await addReadlist(comicSlug, comicTitle, thumbnail);
        setIsReadlisted(true);
      }
    });
  };

  return (
    <div className="flex gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        disabled={pending}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
          isBookmarked
            ? "bg-accent/15 border-accent/40 text-accent"
            : "bg-surface2 border-border text-muted hover:text-text hover:border-accent/30"
        }`}
      >
        <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </button>

      {/* Read List */}
      <button
        onClick={handleReadlist}
        disabled={pending}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
          isReadlisted
            ? "bg-accent/15 border-accent/40 text-accent"
            : "bg-surface2 border-border text-muted hover:text-text hover:border-accent/30"
        }`}
      >
        <svg className="w-4 h-4" fill={isReadlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {isReadlisted ? "Di Read List" : "Read List"}
      </button>
    </div>
  );
}
