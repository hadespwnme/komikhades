#!/usr/bin/env python3
"""
Fetch ranking from shinigami API (daily, weekly, all_time)
and save to public/data/rankings.json
Auto-scrape any missing comics.
"""

import json, re, time, urllib.request
from pathlib import Path
from dataclasses import dataclass, field, asdict

OUT = Path(__file__).parent.parent / "public" / "data"
API = "https://api.shinigami.io"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://s1.shinigami.mx",
    "Referer": "https://s1.shinigami.mx/",
}


def api_get(path):
    req = urllib.request.Request(f"{API}{path}", headers=HEADERS)
    d = json.load(urllib.request.urlopen(req, timeout=15))
    if d.get("retcode") != 0:
        raise ValueError(d.get("message"))
    return d["data"]


def slug_from_title(title):
    for sep in ["|", ",", ";"]:
        if sep in title:
            title = title.split(sep)[0]
    title = title.strip()
    s = title.lower().encode('ascii', 'ignore').decode('ascii')
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:60] if len(s) >= 3 else re.sub(r"[^a-zA-Z0-9]", "-", title)[:40].lower()


def get_existing_manga_ids():
    """Map shinigami_manga_id -> slug for existing comics."""
    idx = OUT / "comics.json"
    if not idx.exists():
        return {}
    comics = json.loads(idx.read_text())
    return {c.get("shinigami_manga_id", ""): c["slug"] for c in comics if c.get("shinigami_manga_id")}


def scrape_shinigami_comic(manga_id):
    """Minimal scrape for ranking entry — no chapter pages needed."""
    from scrape_shinigami import scrape_manga, save_comic
    comic = scrape_manga(manga_id, with_pages=False)
    save_comic(comic)
    return comic.slug


def fetch_ranking(period, limit=16):
    return api_get(f"/v1/manga/top?period={period}&limit={limit}")


def build_ranking_items(data, existing_ids):
    items = []
    for m in data:
        manga_id = m.get("manga_id", "")
        slug = existing_ids.get(manga_id, "")
        items.append({
            "manga_id": manga_id,
            "slug": slug,
            "title": m.get("title", ""),
            "thumbnail": m.get("cover_portrait_url") or m.get("cover_image_url", ""),
            "rank": m.get("rank", 0),
            "score": m.get("weighted_score", m.get("user_rate", 0)),
            "latest_chapter": str(m.get("latest_chapter_number", "")),
            "total_chapters": m.get("total_chapters", 0),
        })
    return items


if __name__ == "__main__":
    print("Fetching shinigami rankings...")

    existing_ids = get_existing_manga_ids()

    rankings = {}
    for period in ["daily", "weekly", "all_time"]:
        data = fetch_ranking(period, limit=16)
        items = build_ranking_items(data, existing_ids)

        # Auto-scrape missing comics
        import sys
        sys.path.insert(0, str(Path(__file__).parent))
        missing = [item for item in items if not item["slug"]]
        if missing:
            print(f"  Auto-scraping {len(missing)} missing comics for {period}...")
            # Re-import after path fix
            from scrape_shinigami import scrape_manga, save_comic
            existing_ids = get_existing_manga_ids()
            for item in missing:
                try:
                    from scrape_shinigami import scrape_manga, save_comic
                    comic = scrape_manga(item["manga_id"], with_pages=False)
                    save_comic(comic)
                    item["slug"] = comic.slug
                    existing_ids[item["manga_id"]] = comic.slug
                    print(f"    ✓ {comic.title}")
                    time.sleep(0.5)
                except Exception as e:
                    print(f"    ✗ {item['manga_id']}: {e}")

        rankings[period] = items
        print(f"  {period}: {len(items)} items | #{items[0]['rank']} {items[0]['title'][:30]}")
        time.sleep(0.3)

    (OUT / "rankings.json").write_text(json.dumps(rankings, ensure_ascii=False, indent=2))
    print(f"\nSaved rankings.json")

    # Also keep popular-today.json for backward compat (use daily ranking)
    popular = [{"slug": i["slug"], "title": i["title"], "score": i["score"], "thumbnail": i["thumbnail"]}
               for i in rankings["daily"] if i["slug"]]
    (OUT / "popular-today.json").write_text(json.dumps(popular, ensure_ascii=False, indent=2))
    print(f"Updated popular-today.json ({len(popular)} items)")
