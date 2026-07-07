-- SlapMania worldwide leaderboard schema.
-- Setup (once):
--   1. Create a free project at https://supabase.com
--   2. Paste this whole file into the SQL Editor and run it
--   3. Copy Project Settings → API → "Project URL" and "anon public" key
--      into window.SLAPP_CONFIG in slap-game/index.html
--
-- The CHECK constraints are sanity caps that block lazy forgeries without
-- rejecting real scores. In the open-world build a flawless chain sends a
-- featherweight ~115m, and the points ceiling is a middleweight around
-- ~95m x 1.0 x 10 ≈ 950, so 130m / 2500 pts leave headroom over anything real.

create table public.slapp_scores (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 12),
  pts integer not null check (pts >= 0 and pts <= 2500),
  dist real not null check (dist >= 0 and dist <= 130),
  opp text not null check (char_length(opp) <= 20)
);

alter table public.slapp_scores enable row level security;

create policy "anyone can read scores"
  on public.slapp_scores for select using (true);

create policy "anyone can post a score"
  on public.slapp_scores for insert with check (true);
