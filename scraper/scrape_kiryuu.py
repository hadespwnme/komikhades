#!/usr/bin/env python3
"""
Kiryuu scraper - fetches comic metadata from v7.kiryuu.to
Outputs data to public/data/ as JSON files.

Usage:
  python scraper/scrape_kiryuu.py
  python scraper/scrape_kiryuu.py --comics detective-conan,one-piece
"""

import json, re, time, argparse
from pathlib import Path
from dataclasses import dataclass, field, asdict

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://v7.kiryuu.to"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://v7.kiryuu.to/",
}
OUT_DIR = Path(__file__).parent.parent / "public" / "data"


@dataclass
class Chapter:
    slug: str
    number: str
    date: str
    chapter_id: int = 0
    page_count: int = 0
    pages: list = field(default_factory=list)


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
    source: str = "kiryuu"
    chapters: list = field(default_factory=list)


def get(url, retries=3):
    for i in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            r.raise_for_status()
            return r
        except Exception as e:
            if i == retries - 1: raise
            print(f"  Retry {i+1}: {e}")
            time.sleep(2 ** i)


def scrape_manga(slug):
    url = f"{BASE_URL}/manga/{slug}/"
    print(f"Scraping: {url}")
    soup = BeautifulSoup(get(url).text, "html.parser")

    # Title - clean up "Baca X Bahasa Indonesia"
    h1 = soup.find("h1")
    title = h1.get_text(separator=" ", strip=True) if h1 else slug
    title = re.sub(r'^baca\s+', '', title, flags=re.I)
    title = re.sub(r'\s+bahasa indonesia.*$', '', title, flags=re.I).strip()

    # Thumbnail
    og = soup.find("meta", property="og:image")
    thumbnail = og["content"] if og else ""

    # Genres
    genres = [a.get_text(strip=True) for a in soup.select("a[href*='/genre/']")]

    # Synopsis - first <p> after Sinopsis heading
    synopsis = ""
    for tag in soup.find_all(["h2","h3","b"]):
        if "sinopsis" in tag.get_text(strip=True).lower():
            p = tag.find_next("p")
            if p: synopsis = p.get_text(separator=" ", strip=True)
            break

    # Info table
    info = {}
    for row in soup.select("table tr"):
        cells = row.find_all(["td","th"])
        if len(cells) >= 2:
            info[cells[0].get_text(strip=True).rstrip(":")] = cells[1].get_text(strip=True)

    # Chapters - links like /manga/slug/chapter-1145.826884/
    chapters, seen = [], set()
    for a in soup.find_all("a", href=re.compile(r"/chapter-[\d]")):
        href = a["href"].rstrip("/")
        part = href.split("/")[-1]  # "chapter-1145.826884"
        m = re.search(r"chapter-([\d]+(?:\.[\d]+)?)", part)
        if not m: continue
        number = m.group(1)
        if number in seen: continue
        seen.add(number)
        parent = a.find_parent(["li","div","tr"])
        date_el = parent.find(class_=re.compile(r"date|time|updated")) if parent else None
        date_str = date_el.get_text(strip=True) if date_el else ""
        chapters.append(Chapter(
            slug=f"{slug}-chapter-{number}",
            number=number,
            date=date_str,
        ))

    chapters.reverse()  # ascending

    return Comic(
        slug=slug, title=title, thumbnail=thumbnail,
        alt_title="", type=info.get("Type", info.get("Tipe", "Manga")),
        genres=genres[:10], author=info.get("Author",""),
        status=info.get("Status",""), synopsis=synopsis,
        source="kiryuu", chapters=chapters,
    )


def scrape_chapter_images(slug, chapter_number):
    """Fetch images from kiryuu chapter page. CDN pattern: cdn.kiryuu.io/D/{slug}/{num}/{page}.webp"""
    url = f"{BASE_URL}/manga/{slug}/chapter-{chapter_number}/"
    try:
        html = get(url).text
        imgs = re.findall(r'(https://cdn\.kiryuu\.io/D/[^\s"\'<>]+\.(?:webp|jpg|jpeg|png))', html)
        # deduplicate
        seen, result = set(), []
        for img in imgs:
            if img not in seen:
                seen.add(img)
                result.append(img)
        return result
    except Exception as e:
        print(f"  Error ch {chapter_number}: {e}")
        return []


def run(slugs, scrape_pages=False, delay=0.5):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    summaries = []

    for slug in slugs:
        try:
            comic = scrape_manga(slug)
        except Exception as e:
            print(f"Error: {slug}: {e}")
            continue

        if scrape_pages:
            for ch in comic.chapters:
                pages = scrape_chapter_images(slug, ch.number)
                ch.pages = pages
                ch.page_count = len(pages)
                time.sleep(delay)

        data = asdict(comic)
        (OUT_DIR / f"{slug}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2))
        print(f"  Saved {slug}.json ({len(comic.chapters)} chapters)")

        s = {k: v for k, v in data.items() if k != "chapters"}
        s["chapter_count"] = len(comic.chapters)
        s["latest_chapter"] = comic.chapters[-1].number if comic.chapters else ""
        s["latest_date"] = comic.chapters[-1].date if comic.chapters else ""
        summaries.append(s)

    # Merge index
    idx = OUT_DIR / "comics.json"
    existing = json.loads(idx.read_text()) if idx.exists() else []
    m = {c["slug"]: c for c in existing}
    for s in summaries:
        m[s["slug"]] = s
    idx.write_text(json.dumps(list(m.values()), ensure_ascii=False, indent=2))
    print(f"Index: {idx} ({len(m)} total)")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--comics", default="detective-conan")
    p.add_argument("--scrape-pages", action="store_true")
    p.add_argument("--delay", type=float, default=0.5)
    args = p.parse_args()
    run([s.strip() for s in args.comics.split(",")], args.scrape_pages, args.delay)
