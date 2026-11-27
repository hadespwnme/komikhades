# Shinigami Format Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display the Shinigami `Format` taxonomy as each comic's type.

**Architecture:** Change one scraper mapping and re-run it for existing Shinigami manga IDs, preserving all chapter data and leaving other sources untouched.

### Task 1: Fix and regenerate

**Files:** `scraper/scrape_shinigami.py`, `public/data/*` with `source: "shinigami"`

- [ ] Assert the current mapping fails for a Shinigami record whose API format is `Manhwa`.
- [ ] Read `taxonomy["Format"]`, fallback to `Manga`, and save the first format name.
- [ ] Re-scrape existing Shinigami IDs with `--no-pages` and verify types are only `Manhwa`, `Manhua`, or `Manga`.
- [ ] Run `py_compile`, Next build, commit, push, and deploy.
