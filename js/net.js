// Worldwide leaderboard via Supabase's PostgREST API — no SDK needed.
// Fill in window.SLAPP_CONFIG (index.html) to enable; everything degrades
// gracefully when unconfigured or offline.

const cfg = () => window.SLAPP_CONFIG || {};

export const configured = () =>
  !!(cfg().supabaseUrl && cfg().supabaseAnonKey);

function headers() {
  const k = cfg().supabaseAnonKey;
  return {
    apikey: k,
    Authorization: `Bearer ${k}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchTop(n = 10) {
  const r = await fetch(
    `${cfg().supabaseUrl}/rest/v1/slapp_scores?select=name,pts,dist,opp&order=pts.desc&limit=${n}`,
    { headers: headers() }
  );
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  return r.json();
}

// scores you've posted worldwide under a given name — used to reclaim entries
// (e.g. a score a stale tab clobbered locally) back into the county board.
export async function fetchByName(name, n = 20) {
  const clean = String(name).trim().slice(0, 12).toUpperCase();
  if (!clean) return [];
  const r = await fetch(
    `${cfg().supabaseUrl}/rest/v1/slapp_scores?select=pts,dist,opp,created_at&name=eq.${encodeURIComponent(clean)}&order=pts.desc&limit=${n}`,
    { headers: headers() }
  );
  if (!r.ok) throw new Error(`fetchByName ${r.status}`);
  return r.json();
}

export async function submit({ name, pts, dist, opp }) {
  const row = {
    name: String(name).trim().slice(0, 12).toUpperCase(),
    pts: Math.round(pts),
    dist: Math.round(dist * 10) / 10,
    opp: String(opp).slice(0, 20),
  };
  const r = await fetch(`${cfg().supabaseUrl}/rest/v1/slapp_scores`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(`submit ${r.status}`);
}
