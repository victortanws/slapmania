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

// ---- weekly seasons ----
// ISO-8601 week key, e.g. "2026-W28". The week IS the season: boards filter on
// it, so "resets" need no server cron — a new week simply starts a fresh board.
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y0) / 864e5 + 1) / 7)).padStart(2, '0')}`;
}
export function prevWeekKey() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return weekKey(d);
}

// Does the live table have the week/slapper columns yet? (They arrive via
// supabase_migrate_weekly.sql.) Probed once; before the migration everything
// falls back to the legacy all-time behavior instead of erroring.
let _seasonsP = null;
export function supportsSeasons() {
  if (!configured()) return Promise.resolve(false);
  if (!_seasonsP) {
    _seasonsP = fetch(
      `${cfg().supabaseUrl}/rest/v1/slapp_scores?select=week&limit=1`,
      { headers: headers() }
    ).then((r) => r.ok).catch(() => false);
  }
  return _seasonsP;
}

export async function fetchTop(n = 10) {
  const seasonal = await supportsSeasons();
  const filter = seasonal ? `&week=eq.${weekKey()}` : '';
  const r = await fetch(
    `${cfg().supabaseUrl}/rest/v1/slapp_scores?select=name,pts,dist,opp&order=pts.desc&limit=${n}${filter}`,
    { headers: headers() }
  );
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  return r.json();
}

// the all-time greats — unfiltered by week, shown alongside the weekly race
export async function fetchAllTime(n = 5) {
  const r = await fetch(
    `${cfg().supabaseUrl}/rest/v1/slapp_scores?select=name,pts,dist,opp&order=pts.desc&limit=${n}`,
    { headers: headers() }
  );
  if (!r.ok) throw new Error(`fetchAllTime ${r.status}`);
  return r.json();
}

// last week's #1 — the reigning county champion, shown atop this week's board
export async function fetchChampion() {
  if (!(await supportsSeasons())) return null;
  const r = await fetch(
    `${cfg().supabaseUrl}/rest/v1/slapp_scores?select=name,pts,dist,opp&week=eq.${prevWeekKey()}&order=pts.desc&limit=1`,
    { headers: headers() }
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0] || null;
}

// all-time top scores for one exact slapper-vs-volunteer pairing — apples to apples
export async function fetchMatchup(slapper, opp, n = 5) {
  if (!slapper || !opp || !(await supportsSeasons())) return null;
  const q = `&slapper=eq.${encodeURIComponent(String(slapper).slice(0, 20))}&opp=eq.${encodeURIComponent(String(opp).slice(0, 20))}`;
  const r = await fetch(
    `${cfg().supabaseUrl}/rest/v1/slapp_scores?select=name,pts,dist&order=pts.desc&limit=${n}${q}`,
    { headers: headers() }
  );
  if (!r.ok) return null;
  return r.json();
}

// THE DAILY VOLUNTEER: today's scores against today's seeded matchup — no new
// columns, just "rows created since UTC midnight vs this volunteer". Every
// daily play is also a normal weekly/all-time post; this is a VIEW, not a fork.
export async function fetchDaily(oppName, n = 10) {
  if (!configured()) return null;
  const day = new Date().toISOString().slice(0, 10);
  const q = `&opp=eq.${encodeURIComponent(String(oppName).slice(0, 20))}&created_at=gte.${day}T00:00:00Z`;
  const r = await fetch(
    `${cfg().supabaseUrl}/rest/v1/slapp_scores?select=name,pts,dist,opp&order=pts.desc&limit=${n}${q}`,
    { headers: headers() }
  );
  if (!r.ok) return null;
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

export async function submit({ name, pts, dist, opp, slapper }) {
  const row = {
    name: String(name).trim().slice(0, 12).toUpperCase(),
    pts: Math.round(pts),
    dist: Math.round(dist * 10) / 10,
    opp: String(opp).slice(0, 20),
  };
  // stamp the season + matchup once the migrated columns exist
  if (await supportsSeasons().catch(() => false)) {
    row.week = weekKey();
    row.slapper = String(slapper || '').slice(0, 20);
  }
  const r = await fetch(`${cfg().supabaseUrl}/rest/v1/slapp_scores`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(`submit ${r.status}`);
}
