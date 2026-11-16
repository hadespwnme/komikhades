import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getComic, getComicList } from "@/lib/data";
import ChapterList from "@/components/ChapterList";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const comics = await getComicList();
  return comics.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const comic = await getComic(slug);
  if (!comic) return {};
  return {
    title: comic.title,
    description: comic.synopsis?.slice(0, 160),
  };
}

export default async function ComicPage({ params }: Props) {
  const { slug } = await params;
  const comic = await getComic(slug);
  if (!comic) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="flex gap-6 mb-8">
        <div className="relative w-32 sm:w-44 flex-shrink-0 rounded-xl overflow-hidden aspect-[2/3] shadow-xl">
          <Image
            src={comic.thumbnail}
            alt={comic.title}
            fill
            sizes="176px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold leading-tight">{comic.title}</h1>
          {comic.alt_title && (
            <p className="text-[var(--muted)] text-sm">{comic.alt_title}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {comic.genres.map((g) => (
              <span
                key={g}
                className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface2)] text-[var(--muted)]"
              >
                {g}
              </span>
            ))}
          </div>
          <div className="text-sm text-[var(--muted)] space-y-0.5 mt-1">
            <p>
              <span className="text-[var(--text)]">Tipe:</span> {comic.type}
            </p>
            <p>
              <span className="text-[var(--text)]">Author:</span> {comic.author}
            </p>
            <p>
              <span className="text-[var(--text)]">Status:</span> {comic.status}
            </p>
            <p>
              <span className="text-[var(--text)]">Chapters:</span>{" "}
              {comic.chapters.length}
            </p>
          </div>
        </div>
      </div>

      {/* Synopsis */}
      {comic.synopsis && (
        <div className="mb-8 bg-[var(--surface)] rounded-xl p-4 text-sm text-[var(--muted)] leading-relaxed">
          <h2 className="text-[var(--text)] font-semibold mb-2">Sinopsis</h2>
          {comic.synopsis}
        </div>
      )}

      {/* Chapter list */}
      <div>
        <h2 className="font-semibold text-lg mb-3">Daftar Chapter</h2>
        <ChapterList chapters={comic.chapters} comicSlug={slug} />
      </div>
    </div>
  );
}
