// Recovers a DLC code from the email the buyer paid with — including RETROACTIVE
// purchases made before codes existed. Flow: look up any code already minted for
// this email; then scan Stripe for PAID checkout sessions on this email and mint
// a code for any that don't have one yet (idempotent, one code per session). So a
// pre-system buyer just types their purchase email and gets a working code.
// Reads/writes via the SERVICE ROLE (RLS closed to anon). Needs STRIPE_SECRET_KEY.
import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
const db = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode(): string {
  const b = crypto.getRandomValues(new Uint8Array(8));
  let s = '';
  for (const x of b) s += ALPHABET[x % ALPHABET.length];
  return `SLAP-${s.slice(0, 4)}-${s.slice(4, 8)}`;
}
async function codeForSession(sessionId: string, email: string | null): Promise<string> {
  const found = await db.from('slapp_codes').select('code').eq('session_id', sessionId).maybeSingle();
  if (found.data?.code) return found.data.code;
  for (let i = 0; i < 6; i++) {
    const code = newCode();
    const ins = await db.from('slapp_codes').insert({ code, session_id: sessionId, email, pack: 'supporter', source: 'purchase' });
    if (!ins.error) return code;
    const again = await db.from('slapp_codes').select('code').eq('session_id', sessionId).maybeSingle();
    if (again.data?.code) return again.data.code;
  }
  throw new Error('mint failed');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    let email = new URL(req.url).searchParams.get('email') ?? '';
    if (!email && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      email = body.email ?? '';
    }
    email = email.trim().toLowerCase();
    if (!email || !email.includes('@')) return json({ ok: false, error: 'no email' }, 400);

    const codes = new Set<string>();
    // 1) codes already minted for this email
    const existing = await db.from('slapp_codes').select('code').eq('email', email);
    (existing.data ?? []).forEach((r) => codes.add(r.code));

    // 2) RETROACTIVE backfill — scan recent Stripe checkout sessions for PAID ones
    //    on this email and mint a code for any not yet in the table
    let starting_after: string | undefined;
    for (let page = 0; page < 5; page++) {
      const list = await stripe.checkout.sessions.list({ limit: 100, starting_after });
      for (const s of list.data) {
        const e = (s.customer_details?.email ?? s.customer_email ?? '').toLowerCase();
        if (e === email && s.payment_status === 'paid') {
          codes.add(await codeForSession(s.id, email));
        }
      }
      if (!list.has_more) break;
      starting_after = list.data[list.data.length - 1]?.id;
    }

    const out = [...codes];
    return json({ ok: out.length > 0, codes: out });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 400);
  }
});
