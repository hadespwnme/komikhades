# Shinigami Home Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and display Shinigami recommendations and all-time rankings alongside daily and weekly rankings.

**Architecture:** Extend the existing offline scraper to fetch the two Shinigami endpoints, map their manga IDs to local slugs, and write one four-key JSON artifact. Extend the existing `PopularToday` tab union and homepage fallback shape; no new component or runtime API dependency is needed.

**Tech Stack:** Python scraper, Next.js 16 App Router, React 19, TypeScript, static JSON data.

---

### Task 1: Extend ranking data generation

**Files:**
- Modify: `scraper/scrape_popular.py`
- Test: one-off Python assertions against generated JSON and live API responses

- [ ] **Step 1: Write the failing data-shape check**

Run a Python assertion requiring `recommendation` and `all_time` keys; it must fail against the current two-key JSON.

- [ ] **Step 2: Add the two API fetches**

Fetch `/v1/manga/recommendation/lists/home` and use its `data.mangas` array; fetch all-time with `/v1/manga/top?filter=all_time&limit=16`. Pass both arrays through the existing `build_ranking_items` function and include both keys in the generated `rankings` object.

- [ ] **Step 3: Run the scraper**

Run `python3 scraper/scrape_popular.py`; confirm all four arrays are written and missing manga receive local slugs.

- [ ] **Step 4: Verify the generated artifact**

Assert keys are exactly `recommendation`, `daily`, `weekly`, `all_time`, every item rank equals its 1-based array index, and every item has a slug.

### Task 2: Add the tabs to the existing UI

**Files:**
- Modify: `src/components/PopularToday.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update the TypeScript shapes**

Add `recommendation` and `all_time` arrays to `Rankings`, extend `Period`, and add labels `Rekomendasi` and `All Time`.

- [ ] **Step 2: Set the homepage fallback shape**

Initialize the fallback rankings object with all four arrays so a missing data file still satisfies the component contract.

- [ ] **Step 3: Verify the build**

Run `npm run build`; expect TypeScript compilation and static generation to succeed.

### Task 3: Ship the generated data and UI

**Files:**
- Modify: generated files under `public/data/`

- [ ] **Step 1: Run checks**

Run `python3 -m py_compile scraper/scrape_popular.py`, `npm run build`, and `git diff --check`.

- [ ] **Step 2: Commit and push**

Commit the scraper, UI, spec, plan, and generated data with `feat: add Shinigami recommendation and all-time tabs`, then push `main`.

- [ ] **Step 3: Deploy and verify**

Run `vercel --prod --yes`, confirm `READY`, then request the production homepage and verify it contains the four tab labels.
