"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Auth ──────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://komikhades-hadespwnme.vercel.app"}/auth/callback`,
    },
  });
  if (error || !data.url) return { error: error?.message ?? "Unknown error" };
  return { url: data.url };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

// ── Bookmarks ─────────────────────────────────────────────────────────────

export async function addBookmark(comic_slug: string, comic_title: string, thumbnail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };
  const { error } = await supabase.from("bookmarks").upsert(
    { user_id: user.id, comic_slug, comic_title, thumbnail },
    { onConflict: "user_id,comic_slug" }
  );
  revalidatePath("/library");
  return { error: error?.message };
}

export async function removeBookmark(comic_slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };
  const { error } = await supabase.from("bookmarks")
    .delete().eq("user_id", user.id).eq("comic_slug", comic_slug);
  revalidatePath("/library");
  return { error: error?.message };
}

// ── Read List ─────────────────────────────────────────────────────────────

export async function addReadlist(comic_slug: string, comic_title: string, thumbnail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };
  const { error } = await supabase.from("readlist").upsert(
    { user_id: user.id, comic_slug, comic_title, thumbnail },
    { onConflict: "user_id,comic_slug" }
  );
  revalidatePath("/library");
  return { error: error?.message };
}

export async function removeReadlist(comic_slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };
  const { error } = await supabase.from("readlist")
    .delete().eq("user_id", user.id).eq("comic_slug", comic_slug);
  revalidatePath("/library");
  return { error: error?.message };
}

// ── History ───────────────────────────────────────────────────────────────

export async function upsertHistory(
  comic_slug: string,
  comic_title: string,
  thumbnail: string,
  chapter_slug: string,
  chapter_num: string,
  last_page: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };
  const { error } = await supabase.from("reading_history").upsert(
    { user_id: user.id, comic_slug, comic_title, thumbnail, chapter_slug, chapter_num, last_page, read_at: new Date().toISOString() },
    { onConflict: "user_id,comic_slug" }
  );
  return { error: error?.message };
}
