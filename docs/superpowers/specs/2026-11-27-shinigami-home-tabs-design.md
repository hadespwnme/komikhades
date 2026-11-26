# Shinigami Home Tabs

## Goal

Add Shinigami-backed `Rekomendasi` and `All Time` tabs beside the existing daily and weekly rankings.

## Design

- The scraper fetches recommendations from `/v1/manga/recommendation/lists/home` and all-time rankings from `/v1/manga/top?filter=all_time&limit=16`.
- Both responses use the existing ranking-item shape. Array order is stored as the local `rank`; the API's global `rank` field is ignored.
- Missing manga are auto-scraped using the existing Shinigami flow so every displayed item has a local slug.
- `public/data/rankings.json` contains `recommendation`, `daily`, `weekly`, and `all_time` arrays.
- The existing client carousel gains two tabs and keeps the same interaction and card layout.

## Failure behavior

- If an API call fails, the scraper exits without writing a partial ranking file.
- Empty recommendation or ranking arrays are valid; the corresponding tab has no cards.

## Verification

- Assert the four generated keys, sequential local ranks, and non-empty slugs.
- Compare generated daily, weekly, and all-time titles with the API response.
- Run Python compilation, Next.js build, and production deployment verification.
