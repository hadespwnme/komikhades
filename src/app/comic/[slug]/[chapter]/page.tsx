import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getComic, getChapterPages, getComicList } from "@/lib/data";
import ReaderClient from "@/components/ReaderClient";

interface Props {
  params: Promise<{ slug: string; chapter: string }>;
}

export async function generateStaticParams() {
  // Only pre-render the first few chapters of each comic to avoid huge builds.
  // The rest will be rendered on-demand (ISR).
  const comics = await getComicList();
  const params: { slug: string; chapter: string }[] = [];
  for (const c of comics) {
    // We don't have full chapter slugs in the index, skip static generation here.
    // Pages will SSR/ISR on first access.
    void c;
  }
  return params;
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
  const prevChapter =
    chapterIndex > 0 ? comic.chapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < comic.chapters.length - 1
      ? comic.chapters[chapterIndex + 1]
      : null;

  const pages = await getChapterPages(slug, chapter);

  return (
    <ReaderClient
      comicSlug={slug}
      comicTitle={comic.title}
      chapter={chapterObj}
      pages={pages}
      prevChapter={prevChapter ?? undefined}
      nextChapter={nextChapter ?? undefined}
    />
  );
}
