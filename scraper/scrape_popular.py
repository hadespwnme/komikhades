#!/usr/bin/env python3
"""Fetch Popular Today from v7.kiryuu.to and save to public/data/popular-today.json"""

import json, re, urllib.request
from pathlib import Path
from bs4 import BeautifulSoup

OUT = Path(__file__).parent.parent / "public" / "data" / "popular-today.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://v7.kiryuu.to/",
}

def fetch_popular():
    req = urllib.request.Request("https://v7.kiryuu.to/", headers=HEADERS)
    html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", errors="ignore")

    pop_match = re.search(r"Popular Today(.*?)(?:Project Updates|Latest Updates)", html, re.S)
    if not pop_match:
        print("Popular Today section not found")
        return []

    soup = BeautifulSoup(pop_match.group(1), "html.parser")
    items = []
    seen = set()

    for a in soup.find_all("a", href=re.compile(r"/manga/")):
        href = a["href"]
        m = re.search(r"/manga/([^/]+)/", href)
        if not m:
            continue
        slug = m.group(1)
        if slug in seen:
            continue
        seen.add(slug)

        h3 = a.find("h3")
        raw_title = h3.get_text(strip=True) if h3 else a.get_text(strip=True)
        score_m = re.search(r"(\d+\.\d+)$", raw_title)
        score = float(score_m.group(1)) if score_m else 0.0
        title = re.sub(r"\d+\.\d+$", "", raw_title).strip()

        img = a.find("img")
        thumbnail = img.get("src", "") if img else ""

        items.append({
            "slug": slug,
            "title": title,
            "score": score,
            "thumbnail": thumbnail,
        })

    return items

if __name__ == "__main__":
    items = fetch_popular()
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2))
    print(f"Saved {len(items)} items to {OUT}")
    for item in items:
        print(f"  {item['score']:.2f} | {item['title'][:40]:40} | {item['slug']}")
