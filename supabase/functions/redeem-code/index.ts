// Redeems a DLC unlock code via the atomic redeem_code() SQL function (run
// supabase_codes.sql first). PURCHASE codes stay multi-use — the portable proof
// of purchase a buyer redeems on every device they own. GIVEAWAY codes carry a
// usage cap (max_uses), enforced race-safe in one UPDATE, so a leaked/streamed
// code can't unlock the pack for everyone. All access is via the SERVICE ROLE
// (RLS is closed to anon, so codes can't be enumerated or minted from the browser).
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

    // one atomic statement: increments uses + returns the pack IF the code is
    // valid and not used up; returns null for unknown / exhausted codes.
    const { data, error } = await db.rpc('redeem_code', { p_code: code });
    if (error) return json({ ok: false, error: String(error.message ?? error) }, 400);
    if (!data) return json({ ok: false });   // unknown code, or a giveaway code that's used up
    return json({ ok: true, pack: data });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 400);
  }
});
