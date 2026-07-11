// Recovers a lost DLC code from the email the buyer paid with — a lost code is
// never a lost purchase. The lookup is inherently purchase-gated: a code row only
// exists because verify-checkout minted it from a PAID Stripe session and stamped
// that session's email on it. So "email → code" only ever returns codes that a
// real payment created. (Buyers who never hit the success screen can still
// recover via their Stripe receipt link — its session_id re-runs verify-checkout.)
// Reads via the SERVICE ROLE; RLS is closed to anon so codes can't be enumerated.
import { createClient } from 'npm:@supabase/supabase-js@2';

const db = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { data } = await db.from('slapp_codes').select('code').eq('email', email);
    const codes = (data ?? []).map((r) => r.code);
    return json({ ok: codes.length > 0, codes });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 400);
  }
});
