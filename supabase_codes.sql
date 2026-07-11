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

-- To hand out a GIVEAWAY code manually, insert one directly, e.g.:
--   insert into slapp_codes (code, source) values ('SLAP-GIFT-2026', 'giveaway');
