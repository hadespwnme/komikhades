/**
 * Server-side data helpers.
 * Reads pre-scraped JSON from public/data/ and can proxy chapter image fetching.
 */
import { promises as fs } from "fs";
import path from "path";
import type { Comic, ComicSummary } from "@/types/comic";

const DATA_DIR = path.join(process.cwd(), "public", "data");

export async function getComicList(): Promise<ComicSummary[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "comics.json"), "utf-8");
    return JSON.parse(raw) as ComicSummary[];
  } catch {
    return [];
  }
}

export async function getComic(slug: string): Promise<Comic | null> {
  try {
    const raw = await fs.readFile(
      path.join(DATA_DIR, `${slug}.json`),
      "utf-8"
    );
    return JSON.parse(raw) as Comic;
  } catch {
    return null;
  }
}

export async function getChapterPages(
  comicSlug: string,
  chapterSlug: string
): Promise<string[]> {
  const comic = await getComic(comicSlug);
  if (!comic) return [];

  const chapter = comic.chapters.find((c) => c.slug === chapterSlug);
  if (!chapter) return [];

  // If pages already scraped and stored, return them
  if (chapter.pages && chapter.pages.length > 0) {
    return chapter.pages;
  }

  // Use source field to determine which CDN to fetch from
  const source = (comic as Comic & { source?: string }).source ?? "komiku";
  return fetchChapterPagesLive(chapterSlug, source);
}

async function fetchChapterPagesLive(chapterSlug: string, source = "komiku"): Promise<string[]> {
  // If source is kiryuu, fetch from kiryuu CDN
  if (source === "kiryuu") {
    const m = chapterSlug.match(/^(.+)-chapter-([\d.]+)$/);
    if (m) {
      const kiryuuUrl = `https://v7.kiryuu.to/manga/${m[1]}/chapter-${m[2]}/`;
      try {
        const res = await fetch(kiryuuUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          next: { revalidate: 3600 },
        });
        if (res.ok) {
          const html = await res.text();
          const matches = html.matchAll(
            /(https:\/\/cdn\.kiryuu\.io\/D\/[^\s"'<>]+\.(?:webp|jpg|jpeg|png))/gi
          );
          const pages: string[] = [];
          const seen = new Set<string>();
          for (const m of matches) {
            if (!seen.has(m[1])) { seen.add(m[1]); pages.push(m[1]); }
          }
          if (pages.length > 0) return pages;
        }
      } catch { /* ignore */ }
    }
    return [];
  }

  // Default: fetch from komiku.org
  const url = `https://komiku.org/${chapterSlug}/`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const matches = html.matchAll(
      /data-src="(https:\/\/img\.komiku\.org\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi
    );
    const pages: string[] = [];
    for (const m of matches) pages.push(m[1]);
    if (pages.length > 0) return pages;

    const dataMatch = html.match(/var chapterData\s*=\s*\{id:(\d+)[^}]*jumlahgambar:(\d+)/);
    if (dataMatch) {
      const id = dataMatch[1];
      const count = parseInt(dataMatch[2], 10);
      return Array.from({ length: count }, (_, i) =>
        `https://img.komiku.org/uploads/${id}-${i + 1}.jpg`
      );
    }
  } catch { /* ignore */ }
  return [];
}
