// Confirms a returning checkout session was actually PAID — the client only
// unlocks on our server's word, never on a URL parameter alone — AND mints the
// buyer's unique unlock CODE (idempotent: one code per session). The code is the
// portable proof of purchase: redeem it on any device, recover it by email.
// Needs secrets: STRIPE_SECRET_KEY. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are
// injected into every edge function automatically. Run supabase_codes.sql first.
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

// unambiguous alphabet — no 0/O/1/I/L, so codes are easy to read out and type
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode(): string {
  const b = crypto.getRandomValues(new Uint8Array(8));
  let s = '';
  for (const x of b) s += ALPHABET[x % ALPHABET.length];
  return `SLAP-${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

// one code per session (idempotent): return the existing one, or insert a fresh
// unique code, retrying only on the rare code-collision
async function codeForSession(sessionId: string, email: string | null): Promise<string> {
  const found = await db.from('slapp_codes').select('code').eq('session_id', sessionId).maybeSingle();
  if (found.data?.code) return found.data.code;
  for (let i = 0; i < 6; i++) {
    const code = newCode();
    const ins = await db.from('slapp_codes').insert({ code, session_id: sessionId, email, pack: 'supporter', source: 'purchase' });
    if (!ins.error) return code;
    // session_id already claimed (a race) → return whatever code that session got
    const again = await db.from('slapp_codes').select('code').eq('session_id', sessionId).maybeSingle();
    if (again.data?.code) return again.data.code;
    // otherwise it was a code (PK) collision → loop and try a new code
  }
  throw new Error('could not mint a code');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const sid = new URL(req.url).searchParams.get('session_id') ?? '';
    const session = await stripe.checkout.sessions.retrieve(sid);
    const paid = session.payment_status === 'paid';
    if (!paid) {
      return new Response(JSON.stringify({ paid: false }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    const email = (session.customer_details?.email ?? session.customer_email ?? '').toLowerCase() || null;
    const code = await codeForSession(sid, email);
    return new Response(JSON.stringify({ paid: true, code, email }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ paid: false, error: String(e) }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
