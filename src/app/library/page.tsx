import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LibraryClient from "@/components/LibraryClient";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: bookmarks }, { data: readlist }, { data: history }] = await Promise.all([
    supabase.from("bookmarks").select("*").order("created_at", { ascending: false }),
    supabase.from("readlist").select("*").order("created_at", { ascending: false }),
    supabase.from("reading_history").select("*").order("read_at", { ascending: false }),
  ]);

  return (
    <LibraryClient
      bookmarks={bookmarks ?? []}
      readlist={readlist ?? []}
      history={history ?? []}
    />
  );
}
