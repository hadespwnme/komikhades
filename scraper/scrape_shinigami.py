#!/usr/bin/env python3
"""
Shinigami scraper - fetches comic metadata from api.shinigami.io
No auth required. API is public.

Usage:
  python scraper/scrape_shinigami.py --manga-id 73a836fe-373e-4645-a5d9-a517922be4d3
  python scraper/scrape_shinigami.py --manga-id <id1>,<id2>
  python scraper/scrape_shinigami.py --search "solo leveling"
"""

import json, re, time, argparse, urllib.request
from pathlib import Path
from dataclasses import dataclass, field, asdict

OUT = Path(__file__).parent.parent / "public" / "data"
API = "https://api.shinigami.io"
CDN = "https://cdn.shinigami.gg"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://s1.shinigami.mx",
    "Referer": "https://s1.shinigami.mx/",
    "Accept": "application/json",
}


@dataclass
class Chapter:
    slug: str
    number: str
    date: str
    chapter_id: int = 0
    page_count: int = 0
    pages: list = field(default_factory=list)
    # Store shinigami chapter_id for fetching images
    shinigami_chapter_id: str = ""


@dataclass
class Comic:
    slug: str
    title: str
    thumbnail: str
    alt_title: str
    type: str
    genres: list
    author: str
    status: str
    synopsis: str
    source: str = "shinigami"
    shinigami_manga_id: str = ""
    chapters: list = field(default_factory=list)


def api_get(path, retries=3):
    url = f"{API}{path}"
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            resp = urllib.request.urlopen(req, timeout=15)
            d = json.load(resp)
            if d.get("retcode") != 0:
                raise ValueError(f"API error: {d.get('message')}")
            return d["data"]
        except Exception as e:
            if i == retries - 1:
                raise
            print(f"  Retry {i+1}: {e}")
            time.sleep(1.5 ** i)


def slug_from_title(title: str) -> str:
    # Take only the first part before | or ,
    for sep in ["|", ",", ";"]:
        if sep in title:
            title = title.split(sep)[0]
    title = title.strip()
    s = title.lower()
    # Remove all non-ascii first
    s = s.encode('ascii', 'ignore').decode('ascii')
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s).strip("-")
    # Fallback if slug is too short or empty
    if len(s) < 3:
        s = re.sub(r"[^a-zA-Z0-9]", "-", title)[:40].strip("-").lower()
    return s[:60]


def get_all_chapters(manga_id: str) -> list:
    """Fetch all chapters using cursor pagination."""
    chapters = []
    cursor = None
    page = 1
    while True:
        url = f"/v1/chapter/{manga_id}/list?sort_by=chapter_number&sort_order=asc&limit=200"
        if cursor:
            url += f"&cursor={cursor}"
        data = api_get(url)
        chapters.extend(data)
        # Check pagination from last response meta
        req = urllib.request.Request(f"{API}{url}", headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=15)
        raw = json.load(resp)
        meta = raw.get("meta", {})
        if not meta.get("has_next"):
            break
        cursor = meta.get("next_cursor")
        page += 1
        time.sleep(0.3)
    return chapters


def get_all_chapters_v2(manga_id: str) -> list:
    """Simpler: fetch up to 2000 at once (usually enough)."""
    return api_get(f"/v1/chapter/{manga_id}/list?sort_by=chapter_number&sort_order=asc&limit=2000")


def get_chapter_pages(chapter_id: str) -> list[str]:
    """Get image URLs for a chapter."""
    data = api_get(f"/v1/chapter/detail/{chapter_id}")
    base = data.get("base_url", CDN)
    ch = data.get("chapter", {})
    path = ch.get("path", "")
    files = ch.get("data", [])
    return [f"{base}{path}{f}" for f in files]


def scrape_manga(manga_id: str, with_pages=False) -> Comic:
    print(f"Fetching manga: {manga_id}")
    manga = api_get(f"/v1/manga/detail/{manga_id}")

    title = manga.get("title", "")
    slug = slug_from_title(title)

    # Avoid slug collision — use numeric suffix instead of alt_title
    idx_path = OUT / "comics.json"
    if idx_path.exists():
        existing = {c["slug"] for c in json.loads(idx_path.read_text())}
        # Only add suffix if it's truly a different manga (not a re-scrape)
        if slug in existing:
            existing_file = OUT / f"{slug}.json"
            is_rescrape = False
            if existing_file.exists():
                try:
                    ed = json.load(open(existing_file))
                    if ed.get("shinigami_manga_id") == manga_id:
                        is_rescrape = True
                except: pass
            if not is_rescrape:
                suffix = 2
                while f"{slug}-{suffix}" in existing:
                    suffix += 1
                slug = f"{slug}-{suffix}"

    taxonomy = manga.get("taxonomy", {})
    genres = [g["name"] for g in taxonomy.get("Genre", [])]
    authors = [a["name"] for a in taxonomy.get("Author", [])]
    formats = [f["name"] for f in taxonomy.get("Format", [])]
    comic_type = formats[0] if formats else "Manga"

    synopsis = manga.get("description", "")
    alt_title = manga.get("alternative_title", "")
    status = manga.get("status", "")
    thumbnail = manga.get("cover_image_url", "")

    # Map status
    status_map = {"ongoing": "Ongoing", "completed": "End", "hiatus": "Hiatus"}
    status = status_map.get(str(status).lower(), status)

    print(f"  Title: {title} | Chapters: fetching...")
    raw_chapters = get_all_chapters_v2(manga_id)
    print(f"  Chapters: {len(raw_chapters)}")

    chapters = []
    for ch in raw_chapters:
        ch_id = ch["chapter_id"]
        num = str(ch["chapter_number"])
        date_raw = ch.get("release_date", "")
        # Convert ISO date to DD/MM/YYYY
        date_str = ""
        if date_raw:
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(date_raw.replace("Z", "+00:00"))
                date_str = dt.strftime("%d/%m/%Y")
            except Exception:
                date_str = date_raw[:10]

        pages = []
        if with_pages:
            try:
                pages = get_chapter_pages(ch_id)
                time.sleep(0.2)
            except Exception as e:
                print(f"    Error ch {num}: {e}")

        chapters.append(Chapter(
            slug=f"{slug}-chapter-{num}",
            number=num,
            date=date_str,
            page_count=len(pages),
            pages=pages,
            shinigami_chapter_id=ch_id,
        ))

    return Comic(
        slug=slug,
        title=title,
        thumbnail=thumbnail,
        alt_title=alt_title,
        type=comic_type,
        genres=genres,
        author=", ".join(authors),
        status=status,
        synopsis=synopsis,
        source="shinigami",
        shinigami_manga_id=manga_id,
        chapters=chapters,
    )


def save_comic(comic: Comic):
    OUT.mkdir(parents=True, exist_ok=True)
    data = asdict(comic)
    (OUT / f"{comic.slug}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"  Saved {comic.slug}.json")

    # Update index
    idx = OUT / "comics.json"
    existing = json.loads(idx.read_text()) if idx.exists() else []
    m = {c["slug"]: c for c in existing}
    summary = {k: v for k, v in data.items() if k != "chapters"}
    summary["chapter_count"] = len(comic.chapters)
    summary["latest_chapter"] = comic.chapters[-1].number if comic.chapters else ""
    summary["latest_date"] = comic.chapters[-1].date if comic.chapters else ""
    m[comic.slug] = summary
    idx.write_text(json.dumps(list(m.values()), ensure_ascii=False, indent=2))
    print(f"  Index updated ({len(m)} total)")


def search_manga(query: str) -> list:
    """Search for manga by title."""
    import urllib.parse
    q = urllib.parse.quote(query)
    data = api_get(f"/v1/manga/search?q={q}&limit=10")
    if isinstance(data, list):
        return data
    return data.get("mangas", data.get("results", []))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--manga-id", help="Comma-separated manga UUIDs")
    p.add_argument("--search", help="Search manga by title")
    p.add_argument("--with-pages", action="store_true", help="Also scrape chapter page images")
    args = p.parse_args()

    if args.search:
        results = search_manga(args.search)
        print(f"Results for '{args.search}':")
        for r in results[:10]:
            print(f"  {r.get('id') or r.get('manga_id')} | {r.get('title')}")

    elif args.manga_id:
        ids = [i.strip() for i in args.manga_id.split(",")]
        for manga_id in ids:
            try:
                comic = scrape_manga(manga_id, with_pages=args.with_pages)
                save_comic(comic)
            except Exception as e:
                print(f"Error {manga_id}: {e}")
    else:
        p.print_help()
