-- SlapMania — DLC unlock CODES
-- Run once in the Supabase SQL editor (Project → SQL → New query → Run).
--
-- Each paid Stripe checkout session mints ONE unique, human-friendly code
-- (SLAP-XXXX-XXXX). The code is the portable proof of purchase: it unlocks the
-- Supporter Pack on ANY device (frictionless, no account), and it's recoverable
-- by the email the buyer paid with (so a lost code is never a lost purchase).
--
-- All access goes through the edge functions (verify-checkout / redeem-code /
-- recover-code), which use the SERVICE ROLE and bypass RLS. RLS is ON with NO
-- anon policies, so the anon key CANNOT read/enumerate codes from the browser.

create table if not exists slapp_codes (
  code        text primary key,                 -- SLAP-XXXX-XXXX (unambiguous alphabet)
  session_id  text unique,                      -- the Stripe checkout session that paid for it (one code per session)
  email       text,                             -- Stripe customer email, lowercased — used for recovery
  pack        text not null default 'supporter',
  source      text not null default 'purchase', -- 'purchase' | 'giveaway' (hand-issued promo codes)
  created_at  timestamptz not null default now(),
  redeemed_at timestamptz                        -- first redeem (informational; codes stay valid for multi-device)
);

create index if not exists slapp_codes_email_idx   on slapp_codes (email);
create index if not exists slapp_codes_session_idx on slapp_codes (session_id);

alter table slapp_codes enable row level security;
-- (no policies on purpose: only service-role edge functions may touch this table)

-- ============================================================================
-- SINGLE-USE GIVEAWAY CODES  (added 2026-07-13)
-- Re-running this whole file is safe (every statement is idempotent).
--
-- Purchase codes stay MULTI-USE (a buyer unlocks on every device they own).
-- Giveaway codes get a USAGE CAP so a code you DM to an influencer can't unlock
-- the pack for everyone the moment it's shown on stream or pasted in a Discord.
-- ============================================================================

alter table slapp_codes add column if not exists max_uses int;                  -- NULL = unlimited (purchase codes); N = giveaway cap
alter table slapp_codes add column if not exists uses     int not null default 0;

-- Atomic redeem. A single UPDATE increments `uses` ONLY when the code still has
-- redemptions left, so two people racing the last use can't both win (Postgres
-- re-checks the WHERE against the locked row). Returns the pack when redeemable,
-- else NULL (not found / used up). Purchase codes (max_uses IS NULL) never cap.
create or replace function public.redeem_code(p_code text)
returns text
language sql
security definer
set search_path = public
as $$
  update slapp_codes
     set uses = uses + 1,
         redeemed_at = coalesce(redeemed_at, now())
   where code = upper(p_code)
     and (max_uses is null or uses < max_uses)
  returning pack;
$$;
-- only the service-role edge function may redeem (never the browser's anon key)
revoke all on function public.redeem_code(text) from public, anon, authenticated;
grant execute on function public.redeem_code(text) to service_role;

-- GENERATE-AT-WILL: mint N giveaway codes, each good for p_max_uses redeems
-- (default 1 = single use). Run it in the SQL editor whenever you want codes:
--   select * from mint_giveaway_codes(5, 2);   -- 5 codes, each usable twice
--   select * from mint_giveaway_codes(1);      -- one single-use code
-- It is NOT granted to anon/service_role, so it can't be called through the API
-- (an exposed minter = infinite free codes) — only you, here in the SQL editor.
create or replace function public.mint_giveaway_codes(n int default 1, p_max_uses int default 1)
returns table(code text, max_uses int)
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   -- no 0/O/1/I/L
  i int; j int; c text;
begin
  for i in 1..greatest(n, 1) loop
    <<mint>> loop
      c := 'SLAP-';
      for j in 1..8 loop
        if j = 5 then c := c || '-'; end if;
        c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      end loop;
      begin
        insert into slapp_codes (code, source, pack, max_uses, uses)
        values (c, 'giveaway', 'supporter', greatest(p_max_uses, 1), 0);
        exit mint;                                  -- inserted OK
      exception when unique_violation then
        -- astronomically rare code collision → spin a new one
      end;
    end loop;
    code := c; max_uses := greatest(p_max_uses, 1); return next;
  end loop;
end;
$$;
revoke all on function public.mint_giveaway_codes(int, int) from public, anon, authenticated;

-- To cap a giveaway code you already handed out (they default to unlimited):
--   update slapp_codes set max_uses = 1 where code = 'SLAP-GIFT-2026';
-- To hand out a fixed vanity code:
--   insert into slapp_codes (code, source, max_uses) values ('SLAP-GIFT-2026', 'giveaway', 1);
