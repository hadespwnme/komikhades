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

  const source = (comic as Comic & { source?: string }).source ?? "komiku";

  // Shinigami: fetch from API using stored chapter_id
  if (source === "shinigami") {
    const shinId = (chapter as Record<string, unknown>)["shinigami_chapter_id"] as string | undefined;
    if (shinId) {
      try {
        const res = await fetch(`https://api.shinigami.io/v1/chapter/detail/${shinId}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Origin": "https://s1.shinigami.mx",
            "Referer": "https://s1.shinigami.mx/",
          },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const baseUrl: string = data?.data?.base_url ?? "https://cdn.shinigami.gg";
          const ch = data?.data?.chapter ?? {};
          const path: string = ch.path ?? "";
          const files: string[] = ch.data ?? [];
          if (files.length > 0) return files.map((f: string) => `${baseUrl}${path}${f}`);
        }
      } catch { /* ignore */ }
    }
    return [];
  }

  return fetchChapterPagesLive(chapterSlug, source);
}

async function fetchChapterPagesLive(chapterSlug: string, source = "komiku"): Promise<string[]> {
  // If source is shinigami, fetch from shinigami API
  if (source === "shinigami") {
    const m = chapterSlug.match(/^(.+)-chapter-([\d.]+)$/);
    if (m) {
      // Find the shinigami_chapter_id from the comic data
      const comic = await getComic(comicSlug);
      const chapter = comic?.chapters.find((c) => c.slug === chapterSlug) as (typeof comic extends null ? never : (typeof comic)["chapters"][0] & { shinigami_chapter_id?: string }) | undefined;
      const shinChapterId = (chapter as { shinigami_chapter_id?: string } | undefined)?.shinigami_chapter_id;
      if (shinChapterId) {
        try {
          const res = await fetch(`https://api.shinigami.io/v1/chapter/detail/${shinChapterId}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Origin": "https://s1.shinigami.mx",
              "Referer": "https://s1.shinigami.mx/",
            },
            cache: "no-store",
          });
          if (res.ok) {
            const data = await res.json();
            const baseUrl = data?.data?.base_url ?? "https://cdn.shinigami.gg";
            const ch = data?.data?.chapter ?? {};
            const path = ch.path ?? "";
            const files: string[] = ch.data ?? [];
            if (files.length > 0) return files.map((f: string) => `${baseUrl}${path}${f}`);
          }
        } catch { /* ignore */ }
      }
    }
    return [];
  }

  // If source is kiryuu, fetch from kiryuu CDN
  if (source === "kiryuu") {
    const m = chapterSlug.match(/^(.+)-chapter-([\d.]+)$/);
    if (m) {
      const kiryuuUrl = `https://v7.kiryuu.to/manga/${m[1]}/chapter-${m[2]}/`;
      try {
        const res = await fetch(kiryuuUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://v7.kiryuu.to/",
          },
          cache: "no-store",
        });
        if (res.ok) {
          const html = await res.text();
          // Match all known kiryuu CDN hosts
          const matches = html.matchAll(
            /(https?:\/\/(?:cdn\.kiryuu\.io|yuucdn\.com|cdnkuma\.my\.id|img\.kiryuu\.to)\/[^\s"'<>]+\.(?:webp|jpg|jpeg|png))/gi
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
      cache: "no-store",
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
