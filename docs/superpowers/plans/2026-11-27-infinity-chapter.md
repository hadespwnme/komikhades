# Infinity Chapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append successive chapter pages in the reader when Infinity Chapter is enabled, with no delay settings.

**Architecture:** A dynamic route handler reuses the existing server-side `getChapterPages` helper. `ReaderClient` observes a sentinel and appends fetched chapter sections; `FloatingDock` controls the lifted infinity state and retains ordinary navigation.

**Tech Stack:** Next.js 16 App Router route handler, React 19 client state/effects, TypeScript.

---

### Task 1: Add the chapter-page route

**Files:**
- Create: `src/app/api/comic/[slug]/[chapter]/pages/route.ts`
- Test: route/build verification

- [ ] **Step 1: Write the failing route check**

Assert the route file does not exist yet and the reader has no append endpoint.

- [ ] **Step 2: Implement `GET`**

Resolve the dynamic `slug` and `chapter` params, load the comic, return `404` when the comic/chapter is missing, call `getChapterPages`, and return `{ pages }` as JSON.

### Task 2: Implement append-on-scroll

**Files:**
- Modify: `src/components/ReaderClient.tsx`
- Modify: `src/components/FloatingDock.tsx`

- [ ] **Step 1: Add failing behavior assertions**

Assert the component source has no `infinityDelay`, `3 detik`, or `5 detik`, and includes an append endpoint reference.

- [ ] **Step 2: Lift infinity state**

Keep `infinityOn` in `ReaderClient`; pass it and an `onInfinityChange` callback to `FloatingDock`. Remove delay state, timer, UI, and delay-dependent navigation.

- [ ] **Step 3: Append sections**

Render the initial section, observe a bottom sentinel only while infinity is enabled, fetch the next chapter through the route, append its pages, and show retry/error state without discarding loaded pages.

- [ ] **Step 4: Preserve normal mode and progress**

When infinity is disabled, render only the initial chapter. Track visible chapter/page by data attributes and use that position for existing local/Supabase progress saves.

### Task 3: Verify and ship

**Files:**
- Modify: generated/none; no data files required

- [ ] **Step 1: Run checks**

Run the source assertions, `npm run build`, and `git diff --check`.

- [ ] **Step 2: Commit and push**

Commit with `feat: make infinity reader append chapters`, then push `main`.

- [ ] **Step 3: Deploy**

Run `vercel --prod --yes`, confirm `READY`, and request the production reader route.
