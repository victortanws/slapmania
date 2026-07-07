# SLAPMANIA

A QWOP-style slapping contest: four keys (**S · L · A · P** — coil, hips, arm, snap),
one open palm, and a county-fair volunteer headed for the corn. Pure static site —
three.js + cannon-es from CDN, no build step, no backend required.

## Run locally

```bash
python3 -m http.server 8994 -d slap-game
# open http://localhost:8994
```

(Any static file server works. `file://` does NOT — ES module imports need http.)

## Launch checklist

1. **Buy Me a Coffee** — links point to `https://buymeacoffee.com/victortanws`. ✓ set.

2. **Global leaderboard (optional but recommended)** — without it the game quietly
   falls back to the local-only county leaderboard.
   - Create a free project at supabase.com.
   - Open the SQL editor, paste and run `supabase.sql` (creates the `slapp_scores`
     table with row-level security and sanity caps).
   - In `index.html`, fill `window.SLAPP_CONFIG` with **Project Settings → API →
     Project URL** and the **anon public** key. The anon key is safe to ship —
     that's what it's for; RLS and the CHECK constraints do the policing.

3. **Social preview** — `og.jpg` is referenced by the `og:image` / `twitter:image`
   meta tags. Crawlers require an **absolute URL**: once you know your domain,
   change `content="og.jpg"` to `content="https://yourdomain/og.jpg"` (two tags).

4. **Host it** — any static host. GitHub Pages: push this folder to a repo,
   Settings → Pages → deploy from branch, done. Netlify/Vercel/Cloudflare Pages:
   drag the folder in. There is no server code.

## Controls

- **Desktop:** S (hold to coil, release to fire) → L (hips) → A (arm) → P (snap).
  Enter/click advances screens, Escape returns to the title, 1–8 pick from docks.
- **Touch:** on-screen thumb pads appear during play (S/L left thumb, A/P right).
  Everything else is tappable.

## Notes for future maintenance

- `window.__slapp` is a debug/verification handle (deterministic replay via
  `.drive(events, seconds)`, `freeze()`, milestone flags). Harmless to ship.
- localStorage keys are prefixed `slapp_` (board, name, master, emperor).
- Tremendous Don is an original parody character. He stays slappable.
