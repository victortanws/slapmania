// Confirms a returning checkout session was actually PAID — the client only
// unlocks on our server's word, never on a URL parameter alone.
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const sid = new URL(req.url).searchParams.get('session_id') ?? '';
    const session = await stripe.checkout.sessions.retrieve(sid);
    return new Response(JSON.stringify({ paid: session.payment_status === 'paid' }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ paid: false, error: String(e) }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
