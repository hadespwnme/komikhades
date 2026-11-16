-- Library tables for Komikhades
-- Bookmarks, Read List, and Reading History per user

-- ── Bookmarks ─────────────────────────────────────────────────────────────
create table if not exists public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  comic_slug  text not null,
  comic_title text not null,
  thumbnail   text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_id, comic_slug)
);

alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks"
  on public.bookmarks for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- ── Read List ──────────────────────────────────────────────────────────────
create table if not exists public.readlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  comic_slug  text not null,
  comic_title text not null,
  thumbnail   text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_id, comic_slug)
);

alter table public.readlist enable row level security;

create policy "Users can view own readlist"
  on public.readlist for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can insert own readlist"
  on public.readlist for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete own readlist"
  on public.readlist for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- ── Reading History ────────────────────────────────────────────────────────
create table if not exists public.reading_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  comic_slug    text not null,
  comic_title   text not null,
  thumbnail     text not null default '',
  chapter_slug  text not null,
  chapter_num   text not null,
  last_page     int  not null default 0,
  read_at       timestamptz not null default now(),
  unique (user_id, comic_slug)
);

alter table public.reading_history enable row level security;

create policy "Users can view own history"
  on public.reading_history for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can upsert own history"
  on public.reading_history for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can update own history"
  on public.reading_history for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete own history"
  on public.reading_history for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- ── Indexes ────────────────────────────────────────────────────────────────
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists readlist_user_id_idx  on public.readlist(user_id);
create index if not exists history_user_id_idx   on public.reading_history(user_id);
create index if not exists history_read_at_idx   on public.reading_history(user_id, read_at desc);
