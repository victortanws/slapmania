-- SlapMania: weekly seasons + per-matchup boards.
-- Run ONCE in the Supabase SQL Editor (the game auto-detects the new columns;
-- until then it gracefully falls back to the legacy all-time board).
--
--   week    — ISO week key like '2026-W28'; stamped client-side on submit.
--             The weekly board filters on the current key, so a new week is
--             automatically a fresh board and last week's #1 is the champion.
--   slapper — who threw the slap, enabling apples-to-apples matchup boards
--             (same slapper vs same volunteer).

alter table public.slapp_scores add column if not exists week text
  check (week is null or char_length(week) <= 10);
alter table public.slapp_scores add column if not exists slapper text
  check (slapper is null or char_length(slapper) <= 20);

create index if not exists slapp_scores_week_idx on public.slapp_scores (week);
create index if not exists slapp_scores_matchup_idx on public.slapp_scores (slapper, opp);
