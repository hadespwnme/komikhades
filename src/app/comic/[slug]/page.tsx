import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getComic, getComicList } from "@/lib/data";
import ChapterList from "@/components/ChapterList";
import LibraryButtons from "@/components/LibraryButtons";
import ContinueButton from "@/components/ContinueButton";

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
    openGraph: {
      images: [comic.thumbnail],
    },
  };
}

export default async function ComicPage({ params }: Props) {
  const { slug } = await params;
  const comic = await getComic(slug);
  if (!comic) notFound();

  const latestChapter = comic.chapters[comic.chapters.length - 1];
  const firstChapter = comic.chapters[0];
  // Only send chapter metadata to the client, not every page image URL.
  const chapterList = comic.chapters.map(
    ({ slug: chapterSlug, number, date, chapter_id, page_count }) => ({
      slug: chapterSlug,
      number,
      date,
      chapter_id,
      page_count,
    })
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero — full width with blurred backdrop */}
      <div className="relative border-b border-border overflow-hidden">
        {/* Blurred background cover */}
        <div className="absolute inset-0 opacity-15 blur-2xl scale-110">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={comic.thumbnail} alt="" className="w-full object-cover" style={{ height: "100%" }} referrerPolicy="no-referrer" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/80 to-bg" />

        <div className="relative max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted mb-6"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Link href="/" className="hover:text-accent transition-colors">Beranda</Link>
            <span>/</span>
            <span className="text-text">{comic.title}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
            {/* Cover */}
            <div className="relative w-36 sm:w-40 flex-shrink-0 rounded-2xl overflow-hidden aspect-[2/3] shadow-2xl ring-1 ring-white/10 mx-auto sm:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={comic.thumbnail}
                alt={comic.title}
                className="w-full object-cover"
                style={{ height: "100%" }}
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3 flex-1 min-w-0 w-full">
              <div>
                <h1
                  className="text-2xl sm:text-3xl text-text leading-tight"
                  style={{ fontFamily: "'Righteous', sans-serif" }}
                >
                  {comic.title}
                </h1>
                {comic.alt_title && (
                  <p className="text-muted text-sm mt-0.5">{comic.alt_title}</p>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5">
                {comic.genres.map((g) => (
                  <span key={g}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface2 text-muted border border-border"
                    style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {g}
                  </span>
                ))}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm"
                style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div>
                  <span className="text-muted text-xs uppercase tracking-wide">Author</span>
                  <p className="text-text font-medium">{comic.author || "—"}</p>
                </div>
                <div>
                  <span className="text-muted text-xs uppercase tracking-wide">Status</span>
                  <p className={comic.status === "End" ? "text-muted font-medium" : "text-green-400 font-medium"}>
                    {comic.status === "End" ? "Tamat" : comic.status}
                  </p>
                </div>
                <div>
                  <span className="text-muted text-xs uppercase tracking-wide">Tipe</span>
                  <p className="text-text font-medium">{comic.type}</p>
                </div>
                <div>
                  <span className="text-muted text-xs uppercase tracking-wide">Chapter</span>
                  <p className="text-accent font-semibold">{comic.chapters.length}</p>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-2 mt-1">
                {firstChapter && (
                  <ContinueButton
                    comicSlug={slug}
                    firstChapterSlug={firstChapter.slug}
                  />
                )}
                {latestChapter && (
                  <Link href={`/comic/${slug}/${latestChapter.slug}`}
                    className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-surface2 border border-border text-sm text-muted hover:text-text hover:border-accent/40 transition-all"
                    style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Ch. Terbaru
                  </Link>
                )}
              </div>

              {/* Library buttons */}
              <LibraryButtons
                comicSlug={slug}
                comicTitle={comic.title}
                thumbnail={comic.thumbnail}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Synopsis */}
        {comic.synopsis && (
          <div className="bg-surface rounded-2xl p-5 border border-border">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-3"
              style={{ fontFamily: "'Poppins', sans-serif" }}>
              Sinopsis
            </h2>
            <p className="text-muted text-sm leading-relaxed"
              style={{ fontFamily: "'Poppins', sans-serif" }}>
              {comic.synopsis}
            </p>
          </div>
        )}

        {/* Chapter list */}
        <div>
          <h2 className="text-lg text-text mb-4"
            style={{ fontFamily: "'Righteous', sans-serif" }}>
            Daftar Chapter
          </h2>
          <ChapterList chapters={chapterList} comicSlug={slug} />
        </div>
      </div>
    </div>
  );
}
