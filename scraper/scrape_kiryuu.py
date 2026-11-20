#!/usr/bin/env python3
"""
Kiryuu (v7.kiryuu.to) scraper — fetches manga metadata, chapter list, and
chapter page image URLs. Output is written to public/data/ so the existing
Next.js app can read it without any code changes.

Default target: https://v7.kiryuu.to/manga/detective-conan/

Usage:
  python scraper/scrape_kiryuu.py                      # Detective Conan + pages
  python scraper/scrape_kiryuu.py --no-pages            # metadata + chapters only
  python scraper/scrape_kiryuu.py --limit 10            # try 10 chapters only
  python scraper/scrape_kiryuu.py --force-pages         # re-scrape stored pages
  python scraper/scrape_kiryuu.py --url https://v7.kiryuu.to/manga/one-piece/
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

from scrapling.fetchers import Fetcher, FetcherSession

DEFAULT_URL = "https://v7.kiryuu.to/manga/detective-conan/"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
REQUEST_TIMEOUT = 60
RETRIES = 3


@dataclass
class Chapter:
    slug: str           # e.g. "chapter-1145.826884"
    number: str         # e.g. "1145"
    date: str           # e.g. "22/10/2026"
    chapter_id: int     # numeric id from the URL, e.g. 826884
    page_count: int
    pages: list[str] = field(default_factory=list)


@dataclass
class Comic:
    slug: str
    title: str
    thumbnail: str
    alt_title: str
    type: str
    genres: list[str]
    author: str
    status: str
    synopsis: str
    chapters: list[Chapter] = field(default_factory=list)


# --------------------------------------------------------------------------- #
# Fetch helpers
# --------------------------------------------------------------------------- #

def fetch(url: str, session=None, retries: int = RETRIES):
    """GET a URL through Scrapling, with simple exponential back-off."""
    last_error: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            if session is not None:
                response = session.get(url, timeout=REQUEST_TIMEOUT)
            else:
                response = Fetcher.get(
                    url, impersonate="chrome", timeout=REQUEST_TIMEOUT
                )
            if response.status is not None and response.status >= 400:
                raise RuntimeError(f"HTTP {response.status}")
            return response
        except Exception as exc:  # noqa: BLE001 - retry any request failure
            last_error = exc
            if attempt == retries:
                break
            wait = 2 ** (attempt - 1)
            print(f"    retry {attempt}/{retries - 1} in {wait}s: {exc}")
            time.sleep(wait)

    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def text_of(element) -> str:
    if element is None:
        return ""
    parts = element.css("::text").getall()
    return re.sub(r"\s+", " ", " ".join(p.strip() for p in parts if p.strip())).strip()


# --------------------------------------------------------------------------- #
# Parsing
# --------------------------------------------------------------------------- #

def _comic_jsonld(page) -> dict:
    """Return the Book/ComicSeries JSON-LD object, if present."""
    for raw in page.css('script[type="application/ld+json"]::text').getall():
        try:
            data = json.loads(raw)
        except (TypeError, ValueError):
            continue
        types = data.get("@type")
        types = types if isinstance(types, list) else [types]
        if "ComicSeries" in types or "Book" in types:
            return data
    return {}


def _clean_synopsis(text: str) -> str:
    """Drop the "More.../Show less" toggle text that sits inside the paragraph."""
    text = re.sub(r"\s*(?:Show less|More\.\.\.)\s*$", "", text.strip())
    return text.strip()


def _full_synopsis(page) -> str:
    """The visible truncated description is data-show=true; the full one is false."""
    blocks = page.css('div[itemprop="description"]')
    for block in blocks:
        if block.attrib.get("data-show") == "false":
            text = _clean_synopsis(text_of(block))
            if text:
                return text
    for block in blocks:
        text = _clean_synopsis(text_of(block))
        if text:
            return text
    return ""


def _parse_date(raw: str) -> str:
    """ISO datetime from <time datetime> -> DD/MM/YYYY (matches existing data)."""
    if not raw:
        return ""
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.strftime("%d/%m/%Y")
    except ValueError:
        return raw[:10]


def _split_slug(slug: str) -> tuple[str, int]:
    """'chapter-1145.826884' -> ('1145', 826884).

    Kiryuu puts the chapter number before a dot and an internal id after it.
    A decimal chapter would look like 'chapter-12.5.123456'.
    """
    match = re.match(r"^chapter-(.+)$", slug)
    if not match:
        return slug, 0
    raw = match.group(1)
    number, dot, tail = raw.rpartition(".")
    if not dot or not tail.isdigit():
        return raw, 0
    return number, int(tail)


def parse_comic(url: str) -> tuple[Comic, str]:
    """Parse a manga page. Returns (comic, slug)."""
    print(f"Fetching manga page: {url}")
    page = fetch(url)

    path = url.split("?")[0].rstrip("/")
    slug = path.split("/")[-1]
    ld = _comic_jsonld(page)

    title = (ld.get("name") or "").strip()
    if not title:
        title = text_of(page.css("h1[itemprop='name']"))
    if not title:
        title = slug

    # Cover
    thumbnail = ""
    og_image = page.css('meta[property="og:image"]::attr(content)').get()
    if og_image:
        thumbnail = og_image.strip()
    elif isinstance(ld.get("image"), dict):
        thumbnail = ld["image"].get("url", "")

    # Alternate title
    alt_title = ld.get("alternateName") or ""
    if not alt_title:
        alt_title = text_of(page.css("h1[itemprop='name'] + div"))

    # Genres (JSON-LD first, then the genre links)
    genres = ld.get("genre") or []
    if isinstance(genres, str):
        genres = [genres]
    genres = [g.strip() for g in genres if isinstance(g, str) and g.strip()]
    if not genres:
        genres = [
            text_of(a)
            for a in page.css("a[itemprop='genre']")
            if text_of(a)
        ]

    # Author
    author = ""
    ld_author = ld.get("author")
    if isinstance(ld_author, dict):
        author = ld_author.get("name", "")
    elif isinstance(ld_author, list) and ld_author:
        author = ld_author[0].get("name", "") if isinstance(ld_author[0], dict) else ""

    # Status
    if ld.get("isCompleted") is True:
        status = "End"
    else:
        status = ld.get("creativeWorkStatus") or "Ongoing"

    # Synopsis
    synopsis = _full_synopsis(page)
    if not synopsis:
        synopsis = (ld.get("description") or "").replace("[&hellip;]", "…").strip()

    # Chapters
    chapters: dict[str, Chapter] = {}
    for item in page.css("div[data-chapter-number]"):
        href = item.css("a[href*='/chapter-']::attr(href)").get()
        if not href:
            continue
        chapter_slug = href.split("?")[0].rstrip("/").split("/")[-1]
        if not chapter_slug:
            continue

        number = (item.attrib.get("data-chapter-number") or "").strip()
        if not number:
            number, _ = _split_slug(chapter_slug)
        _, chapter_id = _split_slug(chapter_slug)

        raw_date = item.css("time::attr(datetime)").get() or ""
        chapters[chapter_slug] = Chapter(
            slug=chapter_slug,
            number=number,
            date=_parse_date(raw_date),
            chapter_id=chapter_id,
            page_count=0,
        )

    def sort_key(chapter: Chapter):
        try:
            return float(chapter.number), chapter.chapter_id
        except ValueError:
            return float("inf"), chapter.chapter_id

    comic = Comic(
        slug=slug,
        title=title,
        thumbnail=thumbnail,
        alt_title=alt_title,
        type="Manga",
        genres=genres,
        author=author,
        status=status,
        synopsis=synopsis,
        chapters=sorted(chapters.values(), key=sort_key),
    )
    print(f"Found {len(comic.chapters)} chapters for {title}")
    return comic, slug


def parse_chapter_pages(chapter: Chapter, comic_slug: str, session=None) -> None:
    """Fetch one chapter and store its page image URLs."""
    url = f"https://v7.kiryuu.to/manga/{comic_slug}/{chapter.slug}/"
    page = fetch(url, session=session)

    pages: list[str] = []
    for img in page.css("section[data-image-data] img"):
        src = (img.attrib.get("data-src") or img.attrib.get("src") or "").strip()
        if not src:
            continue
        if src.startswith("//"):
            src = "https:" + src
        if not src.startswith("http"):
            continue
        pages.append(src)

    chapter.pages = pages
    chapter.page_count = len(pages)


# --------------------------------------------------------------------------- #
# Output
# --------------------------------------------------------------------------- #

def load_existing(path: Path) -> Optional[dict]:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"Warning: could not read {path}: {exc}")
        return None


def apply_existing(comic: Comic, existing: Optional[dict], force_pages: bool) -> None:
    """Keep already-scraped page lists so re-runs are cheap (unless forced)."""
    if not existing:
        return
    old_chapters = {
        c.get("slug"): c for c in existing.get("chapters", []) if c.get("slug")
    }
    for chapter in comic.chapters:
        old = old_chapters.get(chapter.slug)
        if not old or force_pages:
            continue
        old_pages = old.get("pages") or []
        if old_pages:
            chapter.pages = old_pages
            chapter.page_count = len(old_pages)
        elif old.get("page_count"):
            chapter.page_count = int(old["page_count"])


def scrape_chapter_batch(
    chapters: list[Chapter],
    comic_slug: str,
    delay: float,
    progress: dict,
) -> int:
    failures = 0
    with FetcherSession(impersonate="chrome") as session:
        for chapter in chapters:
            try:
                parse_chapter_pages(chapter, comic_slug, session=session)
            except Exception as exc:  # noqa: BLE001 - keep going on one bad chapter
                failures += 1
                print(f"    ! chapter {chapter.number} ({chapter.slug}): {exc}")
            finally:
                with progress["lock"]:
                    progress["done"] += 1
                    done = progress["done"]
                if done % 25 == 0 or done == progress["total"]:
                    print(f"  ... {done}/{progress['total']} chapters processed")
                time.sleep(delay)
    return failures


def scrape_pages(
    comic: Comic,
    only: list[Chapter],
    workers: int,
    delay: float,
) -> int:
    if not only:
        return 0
    print(f"Scraping {len(only)} chapter pages with {workers} worker(s)...")
    progress = {"done": 0, "total": len(only), "lock": threading.Lock()}
    workers = max(1, min(workers, len(only)))
    chunks = [only[i::workers] for i in range(workers)]
    failures = 0
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [
            executor.submit(scrape_chapter_batch, chunk, comic.slug, delay, progress)
            for chunk in chunks
            if chunk
        ]
        for future in as_completed(futures):
            failures += future.result()
    return failures


def update_index(comic: Comic, out_dir: Path) -> None:
    index_path = out_dir / "comics.json"
    existing = load_existing(index_path) or []
    if not isinstance(existing, list):
        existing = []

    summary = {
        "slug": comic.slug,
        "title": comic.title,
        "thumbnail": comic.thumbnail,
        "alt_title": comic.alt_title,
        "type": comic.type,
        "genres": comic.genres,
        "author": comic.author,
        "status": comic.status,
        "synopsis": comic.synopsis,
        "chapter_count": len(comic.chapters),
        "latest_chapter": comic.chapters[-1].number if comic.chapters else "",
        "latest_date": comic.chapters[-1].date if comic.chapters else "",
    }

    # Replace only this comic's entry; keep every other entry untouched.
    for i, item in enumerate(existing):
        if isinstance(item, dict) and item.get("slug") == comic.slug:
            existing[i] = summary
            break
    else:
        existing.append(summary)

    index_path.write_text(
        json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Updated index: {index_path}")


def save(comic: Comic, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{comic.slug}.json"
    out.write_text(
        json.dumps(asdict(comic), ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Saved comic: {out}")
    update_index(comic, out_dir)
    return out


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #

def main() -> None:
    # Keep the per-request INFO logs out of the progress output.
    logging.getLogger("scrapling").setLevel(logging.WARNING)

    parser = argparse.ArgumentParser(
        description="Scrape a manga from v7.kiryuu.to into public/data/"
    )
    parser.add_argument("--url", default=DEFAULT_URL, help="Manga page URL")
    parser.add_argument(
        "--no-pages",
        action="store_true",
        help="Skip chapter pages (metadata + chapter list only)",
    )
    parser.add_argument(
        "--force-pages",
        action="store_true",
        help="Re-scrape pages even if they are already stored",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=3,
        help="Parallel chapter requests (default: 3)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.5,
        help="Delay between chapter requests per worker (default: 0.5s)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only scrape the first N chapters (0 = all)",
    )
    parser.add_argument(
        "--out-dir",
        default=str(OUT_DIR),
        help="Output directory (default: public/data)",
    )
    args = parser.parse_args()

    comic, _ = parse_comic(args.url)
    out_dir = Path(args.out_dir).resolve()

    if not comic.chapters:
        raise SystemExit("No chapters found — aborting.")

    if args.limit > 0:
        comic.chapters = comic.chapters[: args.limit]
        print(f"Limiting to first {len(comic.chapters)} chapters")

    existing = load_existing(out_dir / f"{comic.slug}.json")
    apply_existing(comic, existing, force_pages=args.force_pages)

    if not args.no_pages:
        pending = [c for c in comic.chapters if not c.pages]
        if pending:
            failures = scrape_pages(comic, pending, args.workers, args.delay)
            if failures:
                print(f"Warning: {failures} chapter(s) failed to scrape")
        else:
            print("All chapter pages already stored — skipping.")

    save(comic, out_dir)
    print("Done.")


if __name__ == "__main__":
    main()
