import { getChapterPages, getComic } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; chapter: string }> }
) {
  const { slug, chapter } = await params;
  const comic = await getComic(slug);
  if (!comic || !comic.chapters.some((item) => item.slug === chapter)) {
    return Response.json({ error: "Chapter tidak ditemukan" }, { status: 404 });
  }

  return Response.json({ pages: await getChapterPages(slug, chapter) });
}
