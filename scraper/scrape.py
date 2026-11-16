#!/usr/bin/env python3
"""
Komiku scraper - fetches comic metadata and chapter page lists.
Outputs data to public/data/ as JSON files consumed by the Next.js app.

Usage:
  python scraper/scrape.py
  python scraper/scrape.py --comics gosu,study-group
"""

import json
import re
import time
import argparse
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://komiku.org"
THUMBNAIL_CDN = "https://thumbnail.komiku.org"
IMG_CDN = "https://img.komiku.org"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
}

OUT_DIR = Path(__file__).parent.parent / "public" / "data"


@dataclass
class Chapter:
    slug: str           # e.g. "gosu-chapter-1"
    number: str         # e.g. "1" or "86.5"
    date: str           # e.g. "14/07/2020"
    chapter_id: int     # numeric id from chapterData JS var (for image URLs)
    page_count: int     # jumlahgambar
    pages: list[str] = field(default_factory=list)  # image URLs


@dataclass
class Comic:
    slug: str
    title: str
    thumbnail: str
    alt_title: str
    type: str           # Manhwa / Manga / Manhua
    genres: list[str]
    author: str
    status: str
    synopsis: str
    chapters: list[Chapter] = field(default_factory=list)


def get(url: str, retries: int = 3) -> requests.Response:
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            r.raise_for_status()
            return r
        except Exception as e:
            if attempt == retries - 1:
                raise
            print(f"  Retry {attempt + 1}/{retries} for {url}: {e}")
            time.sleep(2 ** attempt)


def scrape_manga_page(slug: str) -> Comic:
    """Parse /manga/{slug}/ to get comic info + chapter list."""
    url = f"{BASE_URL}/manga/{slug}/"
    print(f"Scraping manga: {url}")
    soup = BeautifulSoup(get(url).text, "html.parser")

    title_el = soup.find("h1") or soup.find("h2")
    title = title_el.get_text(separator=" ", strip=True) if title_el else slug

    # Remove "Komik " prefix komiku adds
    if title.lower().startswith("komik "):
        title = title[6:]

    # Thumbnail from og:image
    og_img = soup.find("meta", property="og:image")
    thumbnail = og_img["content"] if og_img else ""

    # Info table rows
    info: dict[str, str] = {}
    for row in soup.select("table tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) >= 2:
            key = cells[0].get_text(strip=True).rstrip(":")
            info[key] = cells[1].get_text(strip=True)

    genres = [a.get_text(strip=True) for a in soup.select("a[href*='/genre/']")]

    # Synopsis — get <p> directly after the first <h2>Sinopsis</h2>
    synopsis = ""
    for h2 in soup.find_all("h2"):
        if h2.get_text(strip=True) == "Sinopsis":
            p = h2.find_next_sibling("p")
            if p:
                synopsis = p.get_text(separator=" ", strip=True)
            break
    # Fallback to meta description if not found
    if not synopsis:
        desc = soup.find("meta", attrs={"name": "description"})
        synopsis = desc["content"] if desc else ""

    # Chapter list — table.1 has rows with class judulseries / tanggalseries
    chapters: list[Chapter] = []
    for row in soup.select("tr[itemprop='itemListElement']"):
        link = row.find("a", href=True)
        date_td = row.find("td", class_="tanggalseries")
        if not link:
            continue
        href = link["href"].strip("/")
        # href is like "/gosu-chapter-1/" → slug is "gosu-chapter-1"
        slug_ch = href.split("/")[-1] if "/" in href else href
        # Extract chapter number: "gosu-chapter-86-5" → "86.5", "gosu-chapter-1" → "1"
        m = re.search(r"-chapter-(.+)$", slug_ch)
        if m:
            raw_num = m.group(1)
            # Only convert last hyphen if it looks like a decimal (single digit after last -)
            parts = raw_num.rsplit("-", 1)
            if len(parts) == 2 and parts[1].isdigit() and len(parts[1]) <= 1:
                number = f"{parts[0]}.{parts[1]}"
            else:
                number = raw_num.replace("-", ".")
        else:
            number = slug_ch
        date_str = date_td.get_text(strip=True) if date_td else ""
        chapters.append(Chapter(
            slug=slug_ch,
            number=number,
            date=date_str,
            chapter_id=0,
            page_count=0,
        ))

    # Reverse to ascending order
    chapters.reverse()

    return Comic(
        slug=slug,
        title=title,
        thumbnail=thumbnail,
        alt_title=info.get("Judul Alternatif", ""),
        type=info.get("Tipe", ""),
        genres=genres,
        author=info.get("Author", ""),
        status=info.get("Status", ""),
        synopsis=synopsis,
        chapters=chapters,
    )


def scrape_chapter_pages(chapter: Chapter) -> list[str]:
    """Fetch chapter page and extract image URLs from data-src attributes."""
    url = f"{BASE_URL}/{chapter.slug}/"
    print(f"  Scraping chapter {chapter.number}: {url}")
    html = get(url).text
    soup = BeautifulSoup(html, "html.parser")

    # Extract chapterData JS var
    m = re.search(r"var chapterData\s*=\s*(\{.*?\});", html)
    if m:
        raw = m.group(1)
        # Convert JS object to valid JSON
        raw = re.sub(r"(\w+):", r'"\1":', raw)
        raw = re.sub(r"'", '"', raw)
        raw = re.sub(r'"\\/([^"]+)"', r'"/\1"', raw)
        try:
            data = json.loads(raw)
            chapter.chapter_id = int(data.get('"id"', data.get("id", 0)))
            chapter.page_count = int(data.get('"jumlahgambar"', data.get("jumlahgambar", 0)))
        except Exception as e:
            print(f"    Warning: could not parse chapterData: {e}")

    # Collect image URLs from data-src — match ALL img.komiku.org paths
    pages = []
    for img in soup.select("img[data-src]"):
        src = img.get("data-src", "")
        if src and "img.komiku.org" in src:
            pages.append(src)

    # Fallback: generate from chapter_id if we have it and page_count
    if not pages and chapter.chapter_id and chapter.page_count:
        for i in range(1, chapter.page_count + 1):
            pages.append(f"{IMG_CDN}/wp-content/uploads/{chapter.chapter_id}-{i}.jpg")

    chapter.pages = pages
    return pages


def run(slugs: list[str], scrape_pages: bool = True, delay: float = 0.5):
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    all_comics = []

    for slug in slugs:
        try:
            comic = scrape_manga_page(slug)
        except Exception as e:
            print(f"Error scraping {slug}: {e}")
            continue

        if scrape_pages:
            for chapter in comic.chapters:
                try:
                    scrape_chapter_pages(chapter)
                    time.sleep(delay)
                except Exception as e:
                    print(f"  Error scraping chapter {chapter.number}: {e}")

        # Save per-comic data
        comic_data = asdict(comic)
        out = OUT_DIR / f"{slug}.json"
        out.write_text(json.dumps(comic_data, ensure_ascii=False, indent=2))
        print(f"  Saved {out}")

        # Strip chapters for index (keep light)
        summary = {k: v for k, v in comic_data.items() if k != "chapters"}
        summary["chapter_count"] = len(comic.chapters)
        summary["latest_chapter"] = comic.chapters[-1].number if comic.chapters else ""
        summary["latest_date"] = comic.chapters[-1].date if comic.chapters else ""
        all_comics.append(summary)

    # Save index
    index_out = OUT_DIR / "comics.json"
    # Merge with existing index if present
    if index_out.exists():
        existing = json.loads(index_out.read_text())
        existing_map = {c["slug"]: c for c in existing}
        for c in all_comics:
            existing_map[c["slug"]] = c
        all_comics = list(existing_map.values())

    index_out.write_text(json.dumps(all_comics, ensure_ascii=False, indent=2))
    print(f"Saved index: {index_out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape komiku.org comics")
    parser.add_argument(
        "--comics",
        default="gosu",
        help="Comma-separated list of comic slugs (default: gosu)",
    )
    parser.add_argument(
        "--no-pages",
        action="store_true",
        help="Skip scraping individual chapter pages (faster, metadata only)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.5,
        help="Delay in seconds between requests (default: 0.5)",
    )
    args = parser.parse_args()

    slugs = [s.strip() for s in args.comics.split(",")]
    run(slugs, scrape_pages=not args.no_pages, delay=args.delay)
