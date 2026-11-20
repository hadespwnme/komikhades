#!/usr/bin/env python3
"""
Backfill chapter page image URLs for existing Komiku data.

Why this exists: the reader can fall back to fetching a chapter page live from
komiku.org, but that request fails from some hosting environments (Cloudflare
returns 403 to Vercel). Storing the image URLs in public/data/ makes the reader
independent of the host's network.

The script is resume-safe: chapters that already have `pages` are skipped, so
running it daily only fetches newly added chapters.

Usage:
  python scraper/backfill_pages.py
  python scraper/backfill_pages.py --comics gosu,study-group
  python scraper/backfill_pages.py --workers 6 --delay 0.2
  python scraper/backfill_pages.py --limit 5          # test only
"""

from __future__ import annotations

import argparse
import json
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://komiku.org"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
}

_local = threading.local()


def get_session() -> requests.Session:
    session = getattr(_local, "session", None)
    if session is None:
        session = requests.Session()
        session.headers.update(HEADERS)
        _local.session = session
    return session


def fetch(url: str, retries: int = 3) -> requests.Response:
    session = get_session()
    last_error: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            response = session.get(url, timeout=25)
            response.raise_for_status()
            return response
        except Exception as exc:  # noqa: BLE001 - retry request failures
            last_error = exc
            if attempt == retries:
                break
            time.sleep(2 ** (attempt - 1))
    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def parse_chapter_pages(html: str) -> tuple[list[str], int, int]:
    """Return (image_urls, chapter_id, page_count)."""
    soup = BeautifulSoup(html, "html.parser")

    pages: list[str] = []
    seen: set[str] = set()
    for img in soup.select("img[data-src], img[src]"):
        src = (img.get("data-src") or img.get("src") or "").strip()
        if "img.komiku.org" not in src or src in seen:
            continue
        seen.add(src)
        pages.append(src)

    chapter_id = 0
    page_count = 0
    match = re.search(r"var chapterData\s*=\s*(\{.*?\});", html, re.S)
    if match:
        raw = match.group(1)
        raw = re.sub(r"(\w+):", r'"\1":', raw)
        raw = re.sub(r"'", '"', raw)
        raw = re.sub(r'"\\/([^"]+)"', r'"/\1"', raw)
        try:
            data = json.loads(raw)
            chapter_id = int(data.get("id", 0) or 0)
            page_count = int(data.get("jumlahgambar", 0) or 0)
        except (TypeError, ValueError):
            pass

    return pages, chapter_id, page_count


def scrape_chapter(chapter: dict, delay: float) -> bool:
    """Fetch one chapter page and mutate the chapter dict in place."""
    url = f"{BASE_URL}/{chapter['slug']}/"
    try:
        html = fetch(url).text
    except Exception as exc:  # noqa: BLE001 - keep going on one bad chapter
        print(f"    ! {chapter['slug']}: {exc}")
        return False
    finally:
        time.sleep(delay)

    pages, chapter_id, page_count = parse_chapter_pages(html)
    if not pages:
        print(f"    ! {chapter['slug']}: no images found")
        return False

    chapter["pages"] = pages
    chapter["page_count"] = page_count or len(pages)
    if chapter_id:
        chapter["chapter_id"] = chapter_id
    return True


def comic_files(out_dir: Path, wanted: list[str]) -> list[Path]:
    files = sorted(
        path for path in out_dir.glob("*.json") if path.name != "comics.json"
    )
    if not wanted:
        return files
    wanted_set = set(wanted)
    return [path for path in files if path.stem in wanted_set]


def process_comic(
    path: Path,
    workers: int,
    delay: float,
    limit: int,
) -> tuple[int, int, int]:
    """Returns (missing, filled, remaining)."""
    data = json.loads(path.read_text(encoding="utf-8"))
    chapters = data.get("chapters") or []
    pending = [chapter for chapter in chapters if not chapter.get("pages")]

    if limit > 0:
        pending = pending[:limit]

    total_missing = sum(1 for chapter in chapters if not chapter.get("pages"))
    if not pending:
        print(f"{path.stem}: already complete")
        return total_missing, 0, total_missing

    print(
        f"{path.stem}: {len(pending)}/{len(chapters)} chapters missing pages "
        f"({workers} workers)"
    )

    filled = 0
    lock = threading.Lock()

    def task(chapter: dict) -> bool:
        nonlocal filled
        ok = scrape_chapter(chapter, delay)
        with lock:
            if ok:
                filled += 1
            done = filled + failed[0]
            if done % 25 == 0 or done == len(pending):
                print(f"  ... {done}/{len(pending)}")
            if not ok:
                failed[0] += 1
        return ok

    failed = [0]
    with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
        futures = [executor.submit(task, chapter) for chapter in pending]
        for future in as_completed(futures):
            future.result()

    # Keep the JSON readable/stable for git diffs.
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    remaining = total_missing - filled
    print(f"  saved {path.name}: {filled} filled, {remaining} still missing")
    return total_missing, filled, remaining


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill missing chapter image URLs from komiku.org"
    )
    parser.add_argument(
        "--comics",
        default="",
        help="Comma-separated slugs (default: all files in public/data)",
    )
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--delay", type=float, default=0.25)
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only fetch N missing chapters per comic (0 = all, for testing)",
    )
    parser.add_argument("--out-dir", default=str(OUT_DIR))
    args = parser.parse_args()

    out_dir = Path(args.out_dir).resolve()
    wanted = [slug.strip() for slug in args.comics.split(",") if slug.strip()]
    files = comic_files(out_dir, wanted)
    if not files:
        raise SystemExit("No comic data files matched.")

    total_missing = total_filled = 0
    for path in files:
        missing, filled, _ = process_comic(
            path, args.workers, args.delay, args.limit
        )
        total_missing += missing
        total_filled += filled

    print(
        f"Done. {total_filled} chapter(s) filled, "
        f"{total_missing - total_filled} still missing."
    )


if __name__ == "__main__":
    main()
