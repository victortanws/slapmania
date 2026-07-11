// Redeems a DLC unlock code. The code is the portable proof of purchase — it
// stays valid so a buyer can unlock on every device they own (no per-code device
// lock; the code is unguessable and only unlocks cosmetic DLC). Also accepts
// hand-issued 'giveaway' codes. Reads via the SERVICE ROLE (RLS is closed to
// anon, so codes can't be enumerated from the browser).
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
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    let code = new URL(req.url).searchParams.get('code') ?? '';
    if (!code && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      code = body.code ?? '';
    }
    code = code.trim().toUpperCase();
    if (!code) return json({ ok: false, error: 'no code' }, 400);

    const { data } = await db.from('slapp_codes').select('code, pack, redeemed_at').eq('code', code).maybeSingle();
    if (!data) return json({ ok: false });

    // stamp the first redeem (informational only — the code stays valid)
    if (!data.redeemed_at) {
      await db.from('slapp_codes').update({ redeemed_at: new Date().toISOString() }).eq('code', code);
    }
    return json({ ok: true, pack: data.pack ?? 'supporter' });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 400);
  }
});
