import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getComic, getChapterPages, getComicList } from "@/lib/data";
import ReaderClient from "@/components/ReaderClient";

interface Props {
  params: Promise<{ slug: string; chapter: string }>;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapter } = await params;
  const comic = await getComic(slug);
  if (!comic) return {};
  const ch = comic.chapters.find((c) => c.slug === chapter);
  return {
    title: `${comic.title} Chapter ${ch?.number ?? ""}`,
  };
}

export default async function ReaderPage({ params }: Props) {
  const { slug, chapter } = await params;

  const comic = await getComic(slug);
  if (!comic) notFound();

  const chapterObj = comic.chapters.find((c) => c.slug === chapter);
  if (!chapterObj) notFound();

  const chapterIndex = comic.chapters.findIndex((c) => c.slug === chapter);
  const prevChapter = chapterIndex > 0 ? comic.chapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < comic.chapters.length - 1
      ? comic.chapters[chapterIndex + 1]
      : null;

  const pages = await getChapterPages(slug, chapter);

  // Pass lightweight list for search (number + slug only)
  const allChapters = comic.chapters.map((c) => ({
    slug: c.slug,
    number: c.number,
  }));

  return (
    <ReaderClient
      comicSlug={slug}
      comicTitle={comic.title}
      chapter={chapterObj}
      pages={pages}
      prevChapter={prevChapter ?? undefined}
      nextChapter={nextChapter ?? undefined}
      allChapters={allChapters}
    />
  );
}
