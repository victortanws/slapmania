// SlapMania Supporter Pack — creates a Stripe Checkout session (test mode
// until the live key is swapped in). Deploy via Supabase Dashboard → Edge
// Functions; requires the STRIPE_SECRET_KEY secret. The price id is public
// info and lives here on purpose (one less secret to manage).
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
const PRICE_ID = 'price_1TrZ04EQTIgrDf8XdgVNX54t'; // Supporter Pack $6.99

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: 'https://slapmania.org/?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://slapmania.org/',
    });
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
