#!/usr/bin/env python3
"""
Fetch Popular Today from v7.kiryuu.to, save to public/data/popular-today.json,
and auto-scrape any comics that appear in Popular Today but don't exist in our database.
"""

import json, re, urllib.request, time
from pathlib import Path
from bs4 import BeautifulSoup

BASE = Path(__file__).parent.parent / "public" / "data"
KIRYUU = "https://v7.kiryuu.to"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://v7.kiryuu.to/",
}

def get(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            return urllib.request.urlopen(req, timeout=20).read().decode("utf-8", errors="ignore")
        except Exception as e:
            if i == retries - 1: raise
            print(f"  Retry {i+1}: {e}")
            time.sleep(2 ** i)

def fetch_popular():
    html = get(f"{KIRYUU}/")
    pop_match = re.search(r"Popular Today(.*?)(?:Project Updates|Latest Updates)", html, re.S)
    if not pop_match:
        print("Popular Today not found")
        return []

    soup = BeautifulSoup(pop_match.group(1), "html.parser")
    items, seen = [], set()

    for a in soup.find_all("a", href=re.compile(r"/manga/")):
        m = re.search(r"/manga/([^/]+)/", a["href"])
        if not m: continue
        slug = m.group(1)
        if slug in seen: continue
        seen.add(slug)

        h3 = a.find("h3")
        raw = h3.get_text(strip=True) if h3 else a.get_text(strip=True)
        score_m = re.search(r"(\d+\.\d+)$", raw)
        score = float(score_m.group(1)) if score_m else 0.0
        title = re.sub(r"\d+\.\d+$", "", raw).strip()
        img = a.find("img")
        thumb = img.get("src", "") if img else ""

        items.append({"slug": slug, "title": title, "score": score, "thumbnail": thumb})

    return items

def scrape_kiryuu_comic(slug):
    """Scrape a single comic from kiryuu and return summary dict."""
    from dataclasses import dataclass, field, asdict

    @dataclass
    class Chapter:
        slug: str; number: str; date: str
        chapter_id: int = 0; page_count: int = 0; pages: list = field(default_factory=list)

    url = f"{KIRYUU}/manga/{slug}/"
    print(f"  Auto-scraping: {url}")
    html = get(url)
    soup = BeautifulSoup(html, "html.parser")

    h1 = soup.find("h1")
    title = h1.get_text(separator=" ", strip=True) if h1 else slug
    title = re.sub(r'^baca\s+', '', title, flags=re.I)
    title = re.sub(r'\s+bahasa indonesia.*$', '', title, flags=re.I).strip()

    og = soup.find("meta", property="og:image")
    thumb = og["content"] if og else ""

    genres = [a.get_text(strip=True) for a in soup.select("a[href*='/genre/']")]

    synopsis = ""
    for tag in soup.find_all(["h2","h3","b"]):
        if "sinopsis" in tag.get_text(strip=True).lower():
            p = tag.find_next("p")
            if p: synopsis = p.get_text(separator=" ", strip=True)
            break

    info = {}
    for row in soup.select("table tr"):
        cells = row.find_all(["td","th"])
        if len(cells) >= 2:
            info[cells[0].get_text(strip=True).rstrip(":")] = cells[1].get_text(strip=True)

    chapters, seen_ch = [], set()
    for a in soup.find_all("a", href=re.compile(r"/chapter-[\d]")):
        m = re.search(r"chapter-([\d]+(?:\.[\d]+)?)", a["href"].rstrip("/").split("/")[-1])
        if not m: continue
        number = m.group(1)
        if number in seen_ch: continue
        seen_ch.add(number)
        parent = a.find_parent(["li","div","tr"])
        date_el = parent.find(class_=re.compile(r"date|time|updated")) if parent else None
        date_str = date_el.get_text(strip=True) if date_el else ""
        chapters.append(Chapter(f"{slug}-chapter-{number}", number, date_str))

    chapters.reverse()
    data = {
        "slug": slug, "title": title, "thumbnail": thumb, "alt_title": "",
        "type": info.get("Type", info.get("Tipe", "Manga")), "genres": genres[:10],
        "author": info.get("Author",""), "status": info.get("Status",""),
        "synopsis": synopsis, "source": "kiryuu", "chapters": [asdict(c) for c in chapters],
    }

    (BASE / f"{slug}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"    Saved {slug}.json ({len(chapters)} chapters)")
    return slug

if __name__ == "__main__":
    items = fetch_popular()
    (BASE / "popular-today.json").write_text(json.dumps(items, ensure_ascii=False, indent=2))
    print(f"Popular Today: {len(items)} items")

    # Check which are missing from our database
    existing = set()
    idx = BASE / "comics.json"
    if idx.exists():
        existing = {c["slug"] for c in json.loads(idx.read_text())}

    missing = [item["slug"] for item in items if item["slug"] not in existing]
    print(f"\nMissing from DB: {len(missing)}")
    for s in missing:
        print(f"  - {s}")

    # Auto-scrape missing comics
    if missing:
        print(f"\nAuto-scraping {len(missing)} comics...")
        new_slugs = []
        for slug in missing:
            try:
                scrape_kiryuu_comic(slug)
                new_slugs.append(slug)
                time.sleep(0.5)
            except Exception as e:
                print(f"  ERROR {slug}: {e}")

        # Update index
        if new_slugs and idx.exists():
            comics = json.loads(idx.read_text())
            for slug in new_slugs:
                data = json.loads((BASE / f"{slug}.json").read_text())
                summary = {k: v for k, v in data.items() if k != "chapters"}
                summary["chapter_count"] = len(data["chapters"])
                summary["latest_chapter"] = data["chapters"][-1]["number"] if data["chapters"] else ""
                summary["latest_date"] = data["chapters"][-1].get("date","") if data["chapters"] else ""
                comics.append(summary)
            idx.write_text(json.dumps(comics, ensure_ascii=False, indent=2))
            print(f"\nIndex updated: {len(comics)} total comics")
