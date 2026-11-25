#!/usr/bin/env python3
"""
Backfill missing chapter pages for komiku comics.
Skips chapters that already have pages (resume-safe).
Run after scrape.py to fill in any new chapters.
"""

import json, re, time, urllib.request, glob, argparse
from pathlib import Path

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
BASE = Path(__file__).parent.parent / "public" / "data"


def scrape_pages(slug, retries=2):
    url = f"https://komiku.org/{slug}/"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')
            imgs = re.findall(r'data-src="(https://img\.komiku\.org/[^"]+\.(?:jpg|jpeg|png|webp))"', html, re.I)
            return imgs
        except Exception as e:
            if attempt == retries - 1:
                return []
            time.sleep(1)


def run(delay=0.3):
    fixed = 0
    for f in sorted(glob.glob(str(BASE / "*.json"))):
        if "comics.json" in f or "popular-today.json" in f:
            continue
        try:
            d = json.load(open(f))
        except Exception:
            continue

        if d.get("source", "komiku") == "kiryuu":
            continue  # kiryuu fetches live from CDN

        missing = [c for c in d.get("chapters", []) if not c.get("pages")]
        if not missing:
            continue

        print(f"{d['title']}: {len(missing)} chapters missing pages")
        changed = False

        for ch in missing:
            pages = scrape_pages(ch["slug"])
            if pages:
                ch["pages"] = pages
                ch["page_count"] = len(pages)
                changed = True
                fixed += 1
                print(f"  ✓ {ch['slug']} ({len(pages)} pages)")
            else:
                print(f"  ✗ {ch['slug']} — no images found")
            time.sleep(delay)

        if changed:
            with open(f, "w") as out:
                json.dump(d, out, ensure_ascii=False, indent=2)

    print(f"\nTotal fixed: {fixed} chapters")
    return fixed


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--delay", type=float, default=0.3)
    args = p.parse_args()
    run(delay=args.delay)
