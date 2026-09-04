# SlapMania — project context

A QWOP-style 3D slapping-contest game. You control a slapper's body with four
keys and try to launch a county-fair volunteer as far as possible. Absurd,
skill-based, built to be shared. (Renamed from "SLAPP!"; internal storage keys
and the `window.__slapp` debug handle still use the `slapp` prefix — **do not
rename them**, the Supabase table `slapp_scores` depends on it.)

Moved to its own repo (`~/slap-game`) on 2026-07-07, out of the old
`speech-practice` working dir.

## Run it

Static site, **no build step** — three.js 0.160 + cannon-es 0.20 via a CDN
import map. ES modules require HTTP (not `file://`):

```bash
python3 -m http.server 8994 -d .    # then open http://localhost:8994
```

There's a `.claude/launch.json` entry named `slap-game` for the preview tooling.

## Repo layout

| File | Role |
|---|---|
| `index.html` | Canvas, HUD, title/pick/result cards, CSS, import map, `window.SLAPP_CONFIG`, touch pad, social meta |
| `js/main.js` | Game loop + state machine, power formula, chain grading, milestones, camera director, input, touch wiring, `window.__slapp` debug handle |
| `js/player.js` | The slapper: articulated joint sim (S/L/A/P), physique, balance/foul, ascension; `SLAPPERS` roster |
| `js/opponent.js` | The volunteer: braced ragdoll, contact test, launch; `ROSTER` of 8 volunteers |
| `js/ragdoll.js` | cannon-es world + ragdoll factory; `createWorld`, `createRagdoll`, `addSolids` |
| `js/scene.js` | three.js farm world, crowd, animals, birds, FX, camera; exports `stage.*` incl. `solids` |
| `js/audio.js` | WebAudio-synthesized SFX (no assets): whoosh, crack, moo, crash, fanfare, choir, squawk |
| `js/ui.js` | HUD, chain chips, banners, commentary, leaderboard, brag text |
| `js/net.js` | Supabase PostgREST leaderboard (read/write); degrades gracefully when unconfigured |
| `supabase.sql` | Leaderboard table schema (RLS + CHECK caps) |
| `og.jpg` | 1200×630 social card (staged impact frame) |
| `README.md` | Deployment / launch checklist |

## The core mechanic — the S/L/A/P kinetic chain

Pre-contact the slapper is **not** physics-engine driven: each joint is a scalar
angle integrated with key-held torques (in `player.js`). The four keys form a
**gated chain** tuned for human tempo, not twitch reflexes:

1. **S — coil.** Hold to twist the torso back (spine `k=16`, torque `+75`,
   caps ~1s to full coil). On release the body **holds** the coiled pose,
   leaking only `0.55 rad/s`, waiting for you.
2. **L — hips.** Fires the whip: a forward lunge + spine unlock. This is the
   trigger; the held coil is spent now. Firing L while still deeply coiled tips
   you over (a foul).
3. **A — arm.** Unlocks the shoulder; the torso's forward speed at this instant
   slings into the arm.
4. **P — palm.** Unlocks elbow+wrist and **opens the fist into a palm**. A
   closed palm never registers contact (the contact test in `opponent.js`
   requires `pUnlocked`) — so slow fingers whiff, they don't foul.

A fresh **S** after a spent/whiffed swing re-arms the whole chain
(`player.rearm()` + `resetChain()`) — every S is an independent attempt within
the shot clock (**30s standard**, **20s** for time-limited bosses; `arch.shotClock`).

## Power & grading (see `main.js` `onContact` for exact code)

```
power = 12.5 × strength × balF × coilF × gradeL × gradeA × gradeP × sweetspot
power = min(power, 30 × strength)           // cap scales with muscle
power *= momentumF                          // hand mass × speed clamp (pre-cap)
power *= cq                                  // contact flushness 0.88–1.12 (head, pre-cap)
power *= extF                                // arm-extension bell (POST-cap: under-extension can't reach the ceiling)
```

The **on-screen CHAIN % is only `coilF·gradeL·gradeA·gradeP/1.8`** — it does **not**
include balF, cq, extF, sweetspot or momentum. So identical chains give different
distances; the result card now shows the full lever breakdown (CHAIN · BALANCE ·
FLUSH · REACH) + the weakest link, keyed off `slap.chain.{pct,bal,cq,extPct}`.

- `strength` = the slapper's `power` stat. `balF = 1 − 0.45·min(1,|lean|/1.05)²`
  — a teetering stance delivers up to 45% less force (real slap physics), and a
  big lean also tilts the arc off the cheek, so off-balance slaps miss or become
  body blows. `sweetspot` = 1.35 head / 0.6 torso.
- **Deterministic**: mash ≈ 1m, careful-but-imperfect ≈ 15–21m, flawless ≈ 90m+.
  Launch jitter is tight (±4%) so flights are earned by technique, not dice.
- **Grading** (all speed-invariant so the HUD cues never lie):
  `gradeL` = crispness of L after the S release (PERFECT ≈ −0.10..0.35s);
  `gradeA` = spine forward velocity when A fires (≥6 rad/s = PERFECT);
  `gradeP` = spine **phase** when P fires (PERFECT window ≈140ms wide).
- Chain % shown to the player = `product / 1.8` (how close to theoretical max).

## Playable slappers (physique is real — `SLAPPERS` in `player.js`)

`height` scales the model **and the strike plane** (short slappers slap *upward*
→ steeper launch arcs → the longest flights on light volunteers). `arm` scales
reach + stance offset `baseX = 0.73·(1−h·arm)`. `power` multiplies force and the
cap (so muscle only pays off against heavy volunteers). Hand/palm color derives
from each slapper's skin (skin lerped 14% toward white) — **never hardcode it**.

| Slapper | ht / arm / pwr | Note |
|---|---|---|
| SLAPPIN' CHARLIE | 0.93 / 0.97 / 1.00 | short king — best flights on featherweights |
| FARMHAND FRAN | 1.00 / 1.06 / 0.92 | blonde pigtails, plaid dress, long reach |
| UNCLE BUCK | 0.98 / 0.95 / 1.06 | afro, deer tee |
| RODEO ROY | 1.08 / 1.08 / 1.20 | Black cowboy, heavyweight specialist (most power) |
| VICTOR SEPUP | 0.99 / 1.00 / 1.02 | the user's avatar (blue shirt; rejected title "architect" → "JUST VICTOR") |
| MADAM MEI | 0.90 / 0.93 / 0.88 | Asian woman, long hair/earrings/skirt/bust — sky-launcher |

## Volunteers (`ROSTER` in `opponent.js`)

`mass` drives knockback (`knockback = mass^0.75`) AND the score multiplier
(`pts = dist × mass × 10`), so heavy folk barely move but pay big. Perfect-chain
ceilings noted (with landing-zone solids in play).

| Volunteer | w / h / mass | Tag | ~ceiling |
|---|---|---|---|
| SLIM PETE | 0.6 / 1.08 / 0.4 | Featherweight | ~90–115m (skinny, flies like a dart) |
| HAYSEED HANK | 1.0 / 1.0 / 1.0 | Middleweight | ~95m, ~950 pts (the points king) |
| RAVIN' RAY | 1.35 / 0.98 / 1.8 | Heavyweight | striped tee, shades, no stache |
| MULE-KICK MABEL | 0.95 / 1.0 / 0.95 | Middleweight | sun hat |
| BIG HOSS | 1.75 / 1.1 / 2.6 | Super-heavy | ~26m — pure points pick |
| BIG BERTHA | 1.42 / 0.96 / 1.9 | Heavyweight | ~40m (moo + duel fire on her) |
| GRANDPA CLETUS | 0.9 / 0.93 / 0.75 | Veteran | white hair, suspenders |
| TREMENDOUS DON | 1.15 / 1.03 / 1.3 | Executive | suit/red tie/blonde swoop/orange skin, **long sleeves**, hatless. A **volunteer, not a playable slapper** — an original parody character |

Collar-shrug fix (`opponent.js checkHit`): torso contacts above
`torsoY + rTorso·0.5` are ignored so wide victims' collarbones don't silently
turn PERFECT chains into 0.6× body blows. A body blow now means genuinely low
contact only.

## World, containment & the reward ladder

**Open world, no fake walls.** The only hard physics edges are a forest
perimeter (dead catch, restitution 0.06) at `x=117 / x=−22 / z=±37`, dressed
with instanced conifers exactly on those lines — nobody ever hits invisible air.
Side rails only near the ring (`x −15..20`). Solid colliders (`stage.solids →
addSolids()` in `ragdoll.js`) back every visible structure (barn, silo, windmill,
tractor, trees, hay, farmhouses, outhouse, scarecrows, orchard trunks), so bodies
bounce off them instead of clipping through — which shortens the longest Slim
flights to ~92m.

**Reward ladder** (thresholds in `main.js`; recalibrated for open-world
distances). Milestones fire mid-flight; the **SLAPMASTER / SLAP EMPEROR
ceremonies fire at landing** (`showResult`), not mid-air, so the player sees
where the body lands first. The result card is deferred via `pendingCard` /
`cardDelay` (1.1s normal, 2.8s master, 4.0s emperor); `advance()` blocks while a
card is pending.

| Distance | Reward |
|---|---|
| 20m | Smash through the barricade |
| 30m | Cow moos, kids celebrate |
| 40m | Slap angel vs slap devil duel |
| **62m** | **SLAPMASTER** — cleared the hay wall; spirits smile from the sky |
| 80m | Crossed the COUNTY LINE |
| **85m + ≥90% chain** | **SLAP EMPEROR** — hand glows, slapper ascends into heaven |

Commentary tiers at >62m (corn), >80m (county line), >95m (left the county).
World content along the lane: in-lane cornfield (x64–96), apple orchard (NE),
orange grove (S), 4 parametric farmhouses (SLAPP ACRES at 96,19), pond (40,24),
county-line sign (80, 5.5), scarecrows, outhouse, clothesline, sunflowers, birds
(fly through the flock → `scareBirds` + feathers + `sfx.squawk`), distant hills.
Distance markers to 100m.

## Camera, touch, audio

- **Camera** stays with the flyer in FLIGHT (rises with high arcs, slides with
  drift). On the opponent-pick screen the slapper steps to `x=−2.6` so he isn't
  hugging the volunteer.
- **Touch controls** (`#touchPad`): left thumb S/L, right thumb A/P. Buttons
  dispatch synthetic `KeyboardEvent`s so all rules stay in one path. Shown via
  `syncTouchPad()` during play states only; `body.touch` raises the meters.
- **Audio** is fully synthesized in `audio.js` — no asset files.

## Debug & test harness — `window.__slapp`

This is how you test/tune without a human. **Prefer it over setTimeout-scripted
playtests**, which are unreliable under hidden-tab timer throttling.

- `.drive(events, seconds)` — steps the sim **synchronously at 60fps** with a
  scripted key timeline `[[ms, 'KeyS', true], ...]`. Returns `{log, peak,
  contactSpeed, state, attempts, dist, ...}`.
- `.freeze(on)` — pause/resume for freeze-frame screenshots.
- Getters: `state`, `pickIndex`, `attempts`, `keys`, `milestones`, `bestScore`,
  `chainState`; methods `player()`, `opponent()`, `dist()`, `animals()`.

**Testing gotchas (these have bitten every session):**
1. Key events during **FACEOFF** (~2.4s) are ignored — wait ~2.6s after
   confirming an opponent before scripting a swing.
2. `goToTitle` / `startAttempt` do **not** release held keys — every scripted
   swing must dispatch keyups or the next run inherits stuck `aUnlocked`/
   `pUnlocked`. When in doubt, `keyup` S/L/A/P before starting.
3. Pressing the digit of the **already-highlighted** pick card **confirms** it —
   for scripted navigation, walk with `ArrowRight` until `__slapp.pickIndex`
   matches, then `Enter`.
4. A real (isTrusted) keypress **auto-unfreezes** a frozen game — so if the user
   is playing live, your `freeze`/`drive` state can be interrupted.
5. Browser caches ES modules — after editing a `js/` file,
   `fetch(url,{cache:'no-cache'})` each edited file, **then** reload.

## Supabase leaderboard

`net.js` talks to Supabase PostgREST directly (no SDK). Credentials live in
`window.SLAPP_CONFIG` in `index.html` — **already filled in and live**. The anon
key is public by design; row-level security + CHECK caps protect the data.
Everything degrades gracefully to a **local-only** board when unconfigured
(the "POST MY SCORE" box and global panel simply hide).

- Table `slapp_scores` (`supabase.sql`): RLS allows select + insert only (no
  delete/update for anon). CHECK caps: `pts ≤ 2500`, `dist ≤ 130` — sized for
  open-world scores (a real featherweight flies ~110m) while still blocking
  forgeries. **If you change the distance/points ceilings, update these caps** or
  real scores get rejected.
- `net.configured()`, `net.fetchTop(n)`, `net.submit({name,pts,dist,opp})`.

## Conventions & state

- **localStorage keys**: `slapp_board` (top-5), `slapp_name`, `slapp_master`,
  `slapp_emperor`. Keep the `slapp` prefix.
- **Working alongside a live player**: the user often plays during dev sessions.
  Before scoring test runs, capture `localStorage.slapp_board` JSON, and restore
  the user's real entries + reload afterward. **Never wipe their achievements** —
  they earned SLAP EMPEROR legitimately.
- Credits: made by Victor Tan, © 2026, YouTube `@VictorTan`, coffee
  `buymeacoffee.com/victortanws`.

## Launch state & remaining to-dos

**Done:** core game, open-world + recalibrated ladder, physique, balance→power,
deferred ceremonies, solid collisions, touch controls, OG image + favicon +
social meta, Supabase leaderboard wired and verified live (read + write + caps).

**Left for the user:**
- Delete the `SETUPTEST` test row from the Supabase Table Editor (leftover from
  the write-test; anon can't delete it).
- After choosing a domain, make the `og:image` / `twitter:image` URLs
  **absolute** in `index.html` (crawlers require it).
- Pick a static host (GitHub Pages / Netlify / Vercel) and deploy.

## Post-launch additions (2026-07-07 → 07-10) — supersedes stale bits above

- **Live at `https://slapmania.org`** (GitHub Pages, repo `victortanws/slapmania`,
  custom domain + HTTPS enforced; old github.io URL 301s). OG URLs are absolute.
  Analytics: Cloudflare Web Analytics beacon + PostHog (funnel events:
  slapper_selected, match_started, slap_landed, slapmaster/emperor_reached,
  match_completed, score_posted, share_clicked, challenge_opened/result).
- **Key labels renamed** to spell S·L·A·P: SWIVEL / LUNGE / ARM / PALM
  (mechanics unchanged; internal ids like `cl-coil` kept).
- **DLC roster** (`locked: true, price` in `SLAPPERS`): dynamite, bruceslee,
  chucknorth, earl, reverend, auntie. Gated by `DLC_LIVE` in main.js — a master
  kill switch that overrides `localStorage.slapp_unlocks`, the SLAPDEV dev code
  and `?unlockall=1`. **Keep false until Stripe checkout ships**, then flip.
  `?preview=<key>` showcases any slapper or volunteer (hides the card dock).
- **Volunteers**: ROSTER has 11 incl. THE INFLUENCER, but the public pick uses
  the `PICKABLE` export (9 — `boss: true` excluded). The two **bosses** are
  **campaign-only**, summoned by tour challenges via `chosenArch`: BOULDER BOB
  (mass 4.0, w 2.15 / h 1.28 — barely moves, pays ×4; stony skin, unibrow,
  handlebar stache, champion's belt) and DODGY DALE (`weave: true` — a
  fixed-rhythm boxer's slip in `Opponent.update`, 1.5s pocket / 1.5s
  ducked-and-back that beats even the rebound flail; frizzy gray hair).
  `?preview=<bossKey>` still showcases bosses directly.
- **Reach fairness**: `strikeLift` upper clamp is 0.9 (was 0.5) so the shortest
  slappers can cheek the tallest volunteers; launch arc unaffected (dir.y
  saturates at lift 0.33). Verified via sim matrix.
- **Weekly leaderboards + matchup boards + challenge links**: `net.js` has
  `weekKey()/supportsSeasons()/fetchChampion()/fetchMatchup()`; falls back to
  legacy all-time board until `supabase_migrate_weekly.sql` is run (adds `week`,
  `slapper` columns). Challenge URL params: `?cpts=&copp=<oppKey>&csl=<slKey>&cby=`
  → banner + preselects + verdict on the match card; the share button emits one.
- **County board** is lost-update-safe (read-modify-write + `storage` sync) and
  reclaims worldwide posts under the saved name via `net.fetchByName`.
- **Campaigns** in `js/campaign.js` (`TOURS`): two storylines × 3 acts × 3
  challenges — "The Legend of the Open Palm" (ids a1c1..a3c3; Bob + Dale as
  capstones) and "Save the Fair" (ids f1c1..f3c3; the four exam bosses below).
  Goals judged per attempt from existing numbers (dist/pts/head/chain%),
  tier-calibrated (Act I casual / II good / III expert), progress in
  `localStorage.slapp_tour` (read once at module load — reload after editing
  it in tests), acts unlock sequentially per tour. **Hidden from the public**:
  `CAMPAIGN_LIVE = false`; reachable only via `?tour=1`. Test hooks:
  `__slapp.tour`, `__slapp.tourReset()`.
- **Boss mechanics** (arch flags, composable): `shotClock` (THE JUDGE, 5s),
  `grease` (GREASED PETE — non-PERFECT palm ⇒ power ×0.45, "IT SLID OFF!"),
  `chainGate` (IRON-JAW McGRAW 70 / GRANNY THUNDER 60 — below the posted
  chain% ⇒ power ×0.12, "NO-SOLD!"), `weave` (Dale, Granny). Feedback bursts
  go through `ui.slapBurst` (the **banner**, not `#smack` — don't confuse them
  when testing). New look flags: `ironJaw` (steel chin), `brow`, `frizz` hair.
- **Judge Pennywhistle** officiates every campaign match: a REF_LINES one-liner
  (main.js) during FACEOFF, then `sfx.whistle('start')` — one long blast, vs
  the 3-pip foul whistle — fires at the exact FACEOFF→SWING frame the shot
  clock starts. Campaign-only (`campaign.active`); public matches untouched.
  He turns out corrupt in the Save the Fair EPILOGUE (act 4) and becomes the
  final boss (`pennywhistle`: shotClock 6 + chainGate 50 + whistleProp look).
- **Technique↔matchup depth (verified)**: perfecting the chain gains ~+1% vs
  SLIM (speed-cap saturation) but +64% vs BERTHA — precision pays on tonnage.
  Micro-timing: ±45ms on P swings ±14%; lazy L (-36%) via coil leak; holding
  the coil past full costs nothing (leak starts at release).
- **Contact quality (`cq`, public engine)**: head hits are graded on vertical
  flushness (|pt.y−center.y| over 45% of the hit envelope, weighted 0.7) plus
  velocity-into-cheek incidence (0.3) → multiplier 0.88–1.12 on the sweet spot,
  pre-cap, head-only. Stored as `slap.chain.cq` (100 = square); the result card
  appends `FLUSH +n%` / `GRAZE −n%`. All volunteers now BREATHE (±5cm head sine,
  ~4.5s period, deterministic, in `Opponent.update`; weave bosses excluded —
  their slip replaces it). Timing the breath vs BERTHA measured 29.2m mistimed
  vs 42.1m flush-timed with the same swing. Study note: first-frame contact
  always lands near the envelope RIM (offFrac .74–.98) — raw centering is
  approach geometry, not skill; the vertical component is the real signal.
- **Volunteers 13** (public pick 11): + SCHOOLMARM SUSIE (glasses flag now on
  the opponent builder too) and MAESTRO FORTISSIMO (`cello: true` — rides the
  torso mesh, flies with him; visual only, no collider).
- **Worlds (public)**: title button cycles 🌞 DAY / 🌙 NIGHT / ❄️ FROZEN LAKE
  (`localStorage.slapp_world`). `stage.setWorldTheme(name)` retints/relights the
  one farm (night adds lanterns + stars; ice swaps ground maps for snow);
  `phys.setIce(on)` (ragdoll.js) drops ground friction to 0.03 → bodies GLIDE
  (Bertha 36→44.6m same swing). Forest perimeter still caps ~117m < DB cap 130.
- **Dialogue everywhere**: slappers have QUIPS (main.js, faceoff coach line,
  public; the judge takes that slot in campaign), volunteers have deep taunt
  pools (MORE_TAUNTS merge in opponent.js). Campaign **cutscenes** in
  `js/dialogue.js` + `campaign.CUTSCENES` ({who,text,shot:'player'|'opp'|'wide'},
  'YOU' → slapper name): played once per challenge (localStorage.slapp_seen)
  over the FROZEN faceoff — tick() early-returns while dlg.isActive(), runs the
  close-up camera, world keeps breathing. Any key advances, Escape/SKIP ends.
- **Pick dock** is one horizontally-scrollable row (roster can grow forever;
  the 3D preview stays visible).
- **Campaign v2**: locked acts render SEALED (title + 🔒 only — no story or
  challenge spoilers). Every challenge opens with a cutscene (all 20 in
  `campaign.CUTSCENES`): named-opponent scenes launch the match first (opp
  close-ups need the spawn), "anybody" scenes play over the open farm then hand
  off to the pick — their shots must be player/wide only. Master Slee is a
  disembodied spirit (👻 nameplate); BRUCE SLEE cameos in Scroll II/III as the
  DLC tease. Judge/quip lines moved off the coach slot to `ui.refBar` (low
  bottom bar) so the intro name plate stays readable. Slap-angel duel spawns
  x+20 ahead, scaled 1.9, life 7s so the chase camera flies through it.
  Orchard ground apples are intentional windfall fruit (scene.js fruitTree).
- **Cinema v2**: cutscenes run in a `body.cine` letterbox (bars + ALL HUD incl.
  bubble hidden); `playScene()` in main.js wraps dlg.play and stages the cast —
  Master Slee's translucent ghost + a ringside Judge figure live in scene.js
  (`setSpirit/setJudge/cinePoints`), with 'spirit'/'judge' camera shots. Every
  campaign challenge names its volunteer (no free pick in tours) and cleared
  challenges are replayable (↻, no re-clear). VICTOR SEPUP: black cap with a
  ▽ mark (player 'cap' hat + capMark flag) + black jacket.
- **SHOP IS LIVE (2026-07-10)**: `DLC_LIVE = true`, `SHOP_LIVE = true`; the
  SLAPDEV code and `?unlockall=1` backdoors are REMOVED (comments only remain).
  Unlock paths: verified Stripe purchase (`slapp_pack`) or future server codes.
  create-checkout reads `STRIPE_PRICE_ID` from env (falls back to the test
  price) — going fully live = swap STRIPE_SECRET_KEY to sk_live, add live
  STRIPE_PRICE_ID secret, redeploy both functions from supabase/functions/.
  World selection is three explicit buttons (.worldOpt, active wears red).
  slap-preview moved to port 8996 (8995 collided with another session).
- **Frozen Lake winter kit v2 (2026-07-10)**: `setWorldTheme('ice')` REPLACES
  the farm, not just retints it — farmhouses hide and **igloos** stand on their
  exact spots (physics boxes unchanged, so flyers still bounce off the "buried
  homes"); ALL fences hide (`fenceBits`, incl. the x26-74 rustic rail fence)
  with snow drifts along the old lines; laundry cloths hide; the 20m plank
  barricade swaps for a **pile of snow boulders** (`summerBarricade` /
  `snowBarricade` visibility pairs — the boulders are pushed into
  `barricade.pieces`, so breakBarricade blasts them and resetBarricade restacks).
  Wildlife in `winterG` animated in updateAmbient's snow block: 3 **reindeer**
  (red-nosed leader circles (29,14), one circles (60,20), one grazes at
  (48,-17) over a dug patch), 2 **polar bears** (ivory 0xe9e2cf — pure white
  was invisible on snow; amble x14-50@z29.5, x30-68@z-20), 2 skaters on the
  pond, 3 snowmen (eyes must sit OUTSIDE the head sphere r=.25 — buried eyes
  bite), snow-kids + snowballs (blue-gray 0xd4dfe9 to read on snow), mountains.
  **Conifers get instanced white snow caps** (`coniferCaps`, same matrices,
  cap center y=3.2+1.75·sy, scale (sc·.55, sy·.5)). Barn roof gets snow-load
  slabs. Crowd swaps to **muted colored winter coats** (COATS palette — all
  white read as snowmen). Frost system (`winterMat`/`winterIM`/`setFrost`):
  hay→snow (shared hayMat/hayEnd = bales AND 62m crash wall), corn→straw,
  canopies/fruit→snow-white, pumpkins→frosted, hills white, sunflowers dead,
  reeds straw. Summer colors save lazily; restore verified both directions.
  **Register any NEW greenery/structure with the frost system or a visibility
  pair, or it will sit summer-fresh on the lake.** Wan sun = tint 0xcfdce6 @0.6.
- **Layout guardrails**: quip/judge lines live on `ui.refBar` (bottom:158px,
  196px mobile) and `#meters` reach that height on mobile (`body.touch`
  bottom:100px + column layout) — so refBar is **faceoff-only**: it is cleared
  in tick() at the exact FACEOFF→SWING frame (with bubble/intro). Never show
  refBar during SWING/FLIGHT. All other overlay bars (coach/challengeBar/intro/
  clock) are top-anchored and safe.
- **LIL' DYNAMITE giant arm**: new `slapArm: <num>` look flag scales ONLY the
  weapon arm (shoulder ball, ua, sleeve, elbow, fa; hand scales 1+(n−1)·0.3,
  wristband ·0.8) — `bigArms` still scales both. Dynamite = 3.4 (biggest in
  game; Bruce 1.9, Chuck/Earl 2.3). Physics untouched — visual gag only.
- **Player pose NaN (fixed, don't regress)**: `armLift/_armed/strikeLift` are
  initialized in the constructor before the first `pose()` — they used to be
  set only in `reset()`, so `armLift += …` was NaN and the ENTIRE weapon arm
  vanished on title/pick/`?preview=` screens (matches were fine — startAttempt
  resets). `makeTextTexture` has maxWidth 500 (long signs squeezed, not
  clipped). Farmhouse gable = geometry-rotated prism (rotateY(π) then
  rotateX(π/2), apex up, ridge along z) — mesh euler + scale gave bat wings.
- **Influencer selfie stick**: braced-arm eulers are positive (ez 0.5/0.45,
  shoulder→elbow→hand chain) — negative eulers scatter the limb into a "third
  arm". Stick is black 0x15151c, r 0.02 (pale gray vanished against the sky and
  the phone read as floating).
- **`__slapp.stage` is exposed** for visual debugging. Freeze-frame screenshot
  recipe: `__slapp.freeze(true)` stops the render loop entirely and a single
  manual render doesn't survive to a screenshot (no preserveDrawingBuffer), so
  run `setInterval(() => { stage.camera.position.set(...); stage.camera.lookAt(...);
  stage.renderer.render(stage.scene, stage.camera); }, 60)` and screenshot while
  it loops (first frame may still be blank — retake). Remember the game camera
  overwrites camera state every frame while unfrozen.
- **WORLDS ENGINE v2 (2026-07-11, branch worlds-expansion)**: 10 worlds. Public:
  day, night, ice, desert, jungle. DLC (Supporter Pack): lava, dojo, therapy,
  heaven, hell. A world = ONE `WORLD_THEMES` entry (palette + declarative flags:
  group/biome/crowd/pond/sunTint/hideFarm/hideFences/hideCloths/hideBarn/
  barricade) + a prop kit in `WORLD_GROUPS` (+ optional `WORLD_FX`). Retints via
  `biomeMat(mat,{ice,desert,lava,…})`/`biomeIM` variant maps applied by
  `setBiome(key)` (base colors restore for unknown keys); crowd wardrobe via
  `setCrowdPalette` (CROWD_PALETTES). Every non-farm world re-dresses the SAME
  `perimSpots` perimeter (BELT_WORLDS hides the pines). Barricade variants join
  `barricade.pieces` (burst+restack): planks/snow/barrels/bamboo/shoji/boulders/
  cloud/redtape/books. Physics quirks via `phys.setGround`/`setGravity`, applied
  ONLY through main.js `setWorldFull(key)` (selector + tour pin + title restore —
  visuals and physics never drift). Quirks: ice glide, jungle springmoss BOING
  (rest .62, sim 93.9m<117), heaven gravity −8.8 (sim 96.2m<117), lava DONENESS
  stamp, therapy DIAGNOSIS stamp, hell INVERTED CROWD (fouls celebrated) — text
  quirks live in showResult keyed off slapp_world. World selector = generated
  chips (`WORLDS` list in main.js; DLC chips 🔒 → unlock modal; saved DLC world
  falls back to day without the pack). **WORLD LOCALS**: ROSTER entries with
  `world:'<key>'` appear in the opp pick only in that world (OPP_LIST/oppListNow)
  — percival(jungle), flambeau(lava), wally(dojo), inkblot Ian(therapy),
  halo hal(heaven), larry(hell). New look flags: horns, halo, wings, inkblot.
  Campaign order: wonders→fair→secondwind(dlc, world:'dojo')→palm; tour `world:`
  pins apply via setWorldFull and restore on title.
- **CAMPAIGN VERDICT + MOVEMENT WAVE (2026-07-11)**: campaign MATCH_END is a
  VERDICT card (`ui.showMatch({tour})`): goal restated, CHALLENGE CLEARED ✔ /
  FAILED ✘, boards+share hidden; fail → RETRY button relaunches the SAME
  challenge via `startTourChallenge(ch)` (ESC = title), clear → `campaign.WINS`
  beat (per-prefix pools, rotated by `winIdx`) or the outro for finales. Element
  ids: matchTag/matchHint/matchShare. **Movement volunteers** (dlc:true —
  public pick only with pack, campaigns summon by key): POGO McPHEE `hop`
  (parabolic bounce, strike the touchdown; springShoes look), NAMASTE NADINE
  `sway` (fore/aft sun salutation, strike the lean-in; yogaMat), HEAD-TURNING
  HORTON `headTurn` (head yaws on a 2.4s metronome; power × `headFacing()`
  0.56–1.1 — turned-away 29.8m vs flush 81.4m on the 30m headdist goal; hat:'top',
  tails, bowtie look flags). Challenges w1c4/w2c4/w3c4; goal type `headdist`.
  **o3c3 = skiRun** (replaced skiEscape): Ava parks 9m down the lane, whistle →
  `beginEscape()`, skis past the player at 1.7 m/s (45% brake through the ring
  pocket = the catch window), `escaped()` past exitX −8 → instant `foul('escape')`
  + dedicated `campaign.ESCAPE_FAIL` beat (not the FAILS.o rotation); goal 6m.
  **Contact integrity**: hand envelope 0.14 (true palm) + SWEPT test — main.js
  keeps `prevHandSeg` and also tests tip/heel travel segments (fixes 60fps
  tunneling at 14 m/s); wrap-around palms ≥3.5 m/s driving into the cheek count
  (velDir.x gate exception; speed taper prices them). Deep matchups (Roy×Hoss)
  are breath-phase sensitive BY DESIGN now — near-misses look like near-misses.
  `checkAttempt` clears on replays too (verdict correct; done[] not re-pushed).
  Retunes: o3c2 50m, t3c1 45m, v2c2 450, t2c2 50m. Portraits use
  `temp.headMesh.getWorldPosition` (the 1.52·h estimate framed shirts).
  8 tours in TOUR_ORDER; unknown keys sink (tourRank).

## Trailer renderer + SLAP CAM (2026-07-25)

- **`tools/movie.js` — offline cinematic renderer.** Not in the game bundle
  (index.html never loads it); load from the console of a running game:
  `const M = await import('/tools/movie.js'); await M.boot(); await M.runNext(3)`.
  It drives the REAL engine through a new `__slapp.drive(events, seconds, onStep)`
  seam — `onStep(simMs, i)` runs after every stepped frame with rendering still
  suppressed, so the renderer places its own camera, renders, composites trailer
  overlays (letterbox, name plates, captions, title cards, speed lines, flash)
  onto a 2D canvas, and POSTs the JPEG to `tools/framesink.py` (a CORS sink on
  :8998). Nothing is faked — every slap is the real kinetic chain on a real
  ragdoll. `M.probe(specs)` renders candidate framings as stills for a contact
  sheet; `M.resume(cursor, frameIdx)` re-shoots a tail without redoing good
  footage (frames are named by index). 60fps sim → capture every 2nd frame for
  30fps output; capturing EVERY frame inside a `slow:` window gives 2× slow-mo.
- **`tools/score.js`** renders the whole music+SFX bed in an OfflineAudioContext
  and POSTs a 16-bit WAV (same house rule as audio.js: zero asset files).
  Dialogue is macOS `say` (voices cast per character, `[[pbas nn]]` for pitch —
  MIRACLE MIRA's baritone is Ralph at pbas 22) and ffmpeg mixes it in.
- **Camera facts learned the hard way (reuse these, don't re-derive):**
  the ring's action centre is ~`(0.5, 1.5, 0)`; the engine's own faceoff frame is
  `(0.4, 1.95, 4.2)` @ fov 55. **Front-on lenses below y≈1.2 shoot into the backs
  of the rail crowd** — low angles must come in from the OPEN LANE SIDE (θ≈55–80°).
  The slapper faces +x, so a lens at θ≈150° is what catches his FACE; anything
  behind him films his hair. A camera parked exactly on `opponent.headPos()`
  renders the INSIDE of the victim's skull (black frame) — offset ~0.30m toward
  the slapper. `stage.cinePoints.cat` (and spirit/judge/bruce) are **getter
  FUNCTIONS**; reading `.x` off one yields NaN and the whole frame goes black.
  The therapy cat sits at ~(28.6, 4.7, 8.6) — frame it from inside the room
  (≈(21, 2.7, 3.8)), not from outside, or you film the exterior wall.
- **SLAP CAM (shipped gameplay feature).** The instant replay used to run one
  fixed pair of angles, so nobody pressed the button twice. `SLAP_CAMS` in
  main.js now holds five broadcast packages — HERO / CHEEK / WORM / RINGSIDE /
  CRANE — each with its own SWING framing, FLIGHT framing and `shotFov` (a new
  `shotFov` local overrides the state-driven 55/44/39 lens). `chooseSlapCam(card)`
  picks to flatter the slap: `dist ≥ 70 → crane`, `chain ≥ 88 → cheek`,
  `mass ≥ 1.8 && dist < 45 → worm`, else rotate so repeat presses always differ.
  `ui.camTag(name)` burns in a `📷 CHEEK CAM` chip (top-left, top-anchored =
  safe per the layout guardrails) AND owns `body.replaycam` (7vh letterbox +
  keysbar/meters/coach hidden) so the bars can never outlive the tag.
  **The replay button only appears at `dist ≥ 30`** (`replayable` in showResult),
  so heavyweights that barely move have no replay at all — when testing, drive
  ≥16s so a 90m flight actually lands and the card appears, or you will measure
  a stale tag and think the director is broken.
- **Volunteer added:** `dario` — DARIO SLAPMODE, RESPONSIBLE SCALING,
  `world: 'techcampus'` (joins vance/mira/slopberg/marswell as a world local).
- **Deliverables:** rendered trailers live in `media/` (gitignored — the repo is
  the Pages source and 44MB binaries would ship to slapmania.org for nothing),
  with the inbox copy under the global naming rule.
- **Heads-up:** a nightly automation auto-commits AND pushes this repo, so
  work-in-progress can reach production before you explicitly push.

## The executive branch — three presidential worlds (2026-07-25)

- **THE SLAP HOUSE** (`slaphouse`), **MAR-A-SLAPO** (`maraslapo`), **SLAP TOWER**
  (`slaptower`) — all DLC chips in the `WORLDS` list. Invented institutions and
  invented addresses, same parody rule as TREMENDOUS DON (who is the ideal
  opponent in all three: "My cheek pays NO taxes.").
  - SLAP HOUSE: portico + six columns + pediment + balcony, two wings, lawn
    fountain, press podium with flags, parked motorcade, 1600 SLAPSYLVANIA AVE.
  - MAR-A-SLAPO: stucco range with a terracotta roof and an arcade of arches,
    gilded ballroom doors, cupola, pool with striped parasols and loungers, and
    a **palm belt** on the perimeter. Crowd palette `resort` (linen + pastels).
  - SLAP TOWER: a black-and-gold **street canyon** belt, brass colonnade atrium,
    the gold escalator, brass fountain, velvet rope down the lane. Crowd palette
    `suits`. Night world.
- **BELT GOTCHA — this cost a debugging round.** `mkBelt()` builds the perimeter
  group, sets `g.visible = false` and adds it to the scene; the kit then
  re-parents it with `kitG.add(mkBelt(...))`. Because three.js visibility is
  hierarchical, **the kit must switch its own belt back on**:
  `kitG.children[0].visible = true;` — every existing kit does this
  (`techG.children[0].visible = true`, etc.). Miss it and the belt is silently
  invisible: `WORLD_GROUPS` only toggles the TOP-level group. Symptom is a world
  with no horizon; the meshes exist and report as present, just never render.
- **Decorative props must stay OUT of the flight corridor** (`|z| >= 17`). World
  kits carry no colliders, so anything sitting in the lane has bodies sail
  through it. Both signature buildings are wrapped in a sub-group offset to
  `z ≈ -23` for exactly this reason. Verified: corridor occupancy is 35
  (maraslapo) and 8 (slaptower) against the base farm's own 94, and a Slim
  flight measures 92.1 / 92.1 / 92.9m across maraslapo / slaptower / day.
- **Fog tuning matters more than it looks.** SLAP TOWER first shipped with fog
  `0x14121a` — a near-black haze against a black sky, which made 864 perimeter
  tower meshes completely invisible even though they were lit and unoccluded.
  A city night glows: the haze needs warmth (`0x3a2c3a`) for silhouettes to
  read. MAR-A-SLAPO had the opposite problem — fog starting at 70 bleached the
  terracotta, fixed by pushing `near` out to 105.

## HAIL TO THE CHEEK + the polish pass (2026-07-25, late)

- **🦅 HAIL TO THE CHEEK** (`executive`, dlc, prefix `p`, slapper charlie): the
  SLAP HOUSE declares the county's records FAKE DISTANCE; Charlie defends them
  through all three executive worlds. Act I slaphouse (influencer press pool →
  jury subcommittee → don's executive order), Act II maraslapo (maestro → vinnie
  → don_ceo poolside renegotiation), Act III slaptower (hoss the doorman →
  marvel the anonymous donor → **COMMANDER-IN-CHEEK**, new boss `commander`:
  don look + gold tie, shotClock 12 + chainGate 60 'VETOED!'). Goals RETUNED TO
  MEASURED values (standard swing: don 28.5m, vinnie 363, don_ceo 378, hoss 306,
  commander 361 → goals 24/330/350/270/330; placeholders had FOUR challenges
  above the competent ceiling). Veto verified: lazy chain 25.8m → 1.2m. Mash
  scores 0 on all nine. 25 cutscene beats + outro_p3c3 + WINS.p/FAILS.p.
- **QUIPS deepened** (main.js): every slapper pool was exactly 2 lines — the
  second faceoff of a session already repeated. Now 3–5 per slapper, same
  voices. Taunt pools were already deep via MORE_TAUNTS — an early `~2 lines`
  measurement was a sed artifact; verify before writing more dialogue.
- **Executive worlds finished to kit convention**: FACEOFF_OPENERS (state
  portrait / poolside low / escalator descent + pitch's broadcast blimp),
  WORLD_ROSTERS allow-lists (don headlines all three), and ambient animation —
  slaphouse flags flutter + fountain jet pulses, maraslapo parasols sway,
  **the slaptower escalator RUNS** (steps ride a parametric slot `userData.k`,
  wrap at 12 — deterministic, film-safe).

## Context split, reactive crowd, persistence (2026-07-25, later)

- **UI CONTEXTS** (main.js `syncContext`): every overlay belongs to one of
  `menu | match | roam | cine | replay`, published as a single `ctx-*` class on
  `<body>` from the `setState` choke point. `uiContext() = ctxForced ||
  STATE_CONTEXT[state]`; `setContext(name|null)` forces/releases.
  **THE RULE: contexts SUBTRACT, NEVER ADD.** A context may hide what the game
  would otherwise show; it never forces anything visible. That is what let this
  land on a shipped game with zero regressions — every existing show/hide path
  stays authoritative for its own element. `body.cine` and `body.replaycam` are
  now DERIVED in syncContext, not set independently (they used to stack — a
  replay ran as `replaycam smackon`, and ui.camTag owned the letterbox from
  another file). `window.__slappCtx.get/set` is the roam seam for the film tools.
  Boot calls `syncContext()` directly because `state` is initialised at module
  load and `goBack()` skips `goToTitle()` when already on the title.
  - **Real defect this found:** an instant replay runs a real attempt underneath,
    so `startAttempt()` walks it through FACEOFF and re-raises the volunteer's
    NAME PLATE + TAUNT BUBBLE + REF LINE over the letterboxed cinematic —
    measured visible for the first 2.4s of every replay. Now structurally
    impossible via `body.ctx-replay`.
  - Validate HUD refactors with a **golden trace**: capture the visibility of
    every absolutely/fixed-positioned element across TITLE/FACEOFF/SWING/IMPACT/
    FLIGHT/RESULT/REPLAY before and after, and diff. Make the check
    ancestor-aware (a child of a hidden parent is not visible). `#flash` is an
    opacity-transition overlay and will show spurious diffs from run ordering.
- **REACTIVE CROWD** (`stage.scatterCrowd(x, z, radius, strength)`): spectators
  dive clear of a body passing low/landing near the rail, then walk home to
  `spot.hx/hz`. Deliberately NOT routed through actor.js — the crowd is an
  InstancedMesh whose `spot.x/z` `updateCrowd` already reads live every frame, so
  shoving the spot is both cheapest and most direct, and navigate.js consumes the
  same spots as blockers so a scattered spectator is a moved obstacle for free.
  Wired in the FLIGHT tick, rate-limited (0.25s), reset per attempt.
- **PERSISTENCE** (`stage.leaveBody / clearBodies / restingBodies`): launched
  volunteers stay where they landed, in the arch's own shirt/skin/pants colours.
  **Scenery + nav blocker ONLY — never a cannon collider**, or every tuned
  distance in the game would silently change. Capped at 7 (oldest recycled),
  swept by `goToTitle`. `restingBodies` is `{x,z,r}` so it drops straight into
  `createNav({actors})`. Verified: 4 attempts → 4 bodies, 10 → capped at 7,
  walkers keep 1.03m clearance, distances 43.9/41.1/40.9/40.6 (unchanged).

## THE HUB (2026-07-25, later still)

- **`js/hub.js` + the `ROAM` state**: walk the fairground, six volunteers wait at
  stations, walk up and press **[E]** (or tap them) to challenge. Finishing that
  match returns you to the hub, not the menu. Title button `#roamBtn`
  (🚶 WALK THE FAIRGROUND); ESC leaves. Test seams: `__slapp.enterHub()`,
  `__slapp.hub()` (`.goTo/.pos/.challenge/.count`).
- Movement is BOTH: WASD/arrows (screen-relative, gated on `state === 'ROAM'` so
  KeyS/KeyA keep meaning SWIVEL/ARM everywhere else) and click/tap-to-route via
  `actor.goTo` — the latter is the only scheme that works once the touch pad is
  hidden.
- **STATIONS are verified walkable**, not guessed: x≈9–37 off the centre line.
  A first pass put hoss at x=58 and he measured **unreachable**; the full six-stop
  circuit now walks in 15.2s.
- **Standees are NOT Opponent instances.** Every Opponent builds a cannon ragdoll
  at START_X, so six would stack six rigs on the ring and need a `placeAt()` plus
  a fix to `animateShowcase` (which hardcodes START_X for the beckoning arm).
  `stage.makeStandee(arch,x,z,ry)` is a physics-free posed figure carrying the
  arch's colours + hat/hair. NB a scouting pass measured that real Opponents
  would NOT perturb physics (ragdoll bodies are `collisionFilterGroup 2 / mask 1`,
  static-only) — so the reason to prefer standees is ~20 draw calls each vs ~6,
  not contamination.
- **Name boards are parented to the SCENE, not the figure.** A billboard that is
  a child of a rotating group cannot be aimed by copying the camera's WORLD
  quaternion into its LOCAL one — the parent rotation is still applied on top.
- **The hub camera carries its own damped yaw.** Built straight off
  `me.heading`, a sharp turn (which tap-to-walk produces constantly) whips the
  camera a quarter circle through the character — measured 5m out of position.
- **`#hubPrompt` is its own element.** Reusing `#refBar` failed silently because
  `ctx-roam` correctly hides refBar (it is faceoff furniture) — the text was set
  and invisible. When a context hides something you want, add an element; do not
  weaken the context.

### Two regressions worth never repeating
- **`Player.reset()` calls `standPose()`.** Putting the walking arm-relax
  (disarm + joint rewrite) into `standPose` therefore un-armed the player on
  every attempt, immediately after reset armed him: EVERY slap in the game fell
  from ~41m to ~9m by landing on the torso instead of the cheek, with hand speed
  unchanged (9.2 m/s). Walking idle now lives in a separate `idlePose()`.
  **Anything `reset()` touches must stay match-safe.** Also: `grep -v player.js`
  is how the caller stayed hidden — do not exclude the file you are editing.
- **`drive(events, seconds, onStep)` leaked `skipRender`.** The loop only clears
  it on the last frame `if (!onStep)`, so any instrumented run left the game
  permanently un-rendered — which is why freeze-frame screenshots kept needing a
  manual `setInterval` render. `drive` now always restores it, and `freeze(false)`
  clears it too.

## Content pass (2026-09-04)

- **Spoken numbers must follow retuned goals.** Goals were retuned to measured
  values in several passes (`goal.v` + card `desc` updated), but 64 cutscene
  beats still QUOTED the old, higher number ("fifty meters" for a 45m goal,
  "ninety percent" for 81). Fixed by script: `/tmp/slapaudit/fixnums.mjs`
  (number-words → `goal.v`, preserves sentence case / ALL CAPS / Ray's
  "four-ten" slang) and verified with a linear scanner (645 lines, 0 real
  mismatches — "a seventy-seven" and "four-ten" are parser artifacts). **When
  you retune a goal, grep its cutscene for the number-words too.** NB the
  olympic cutscenes are (validly) indented 4 spaces inside `CUTSCENES` — a
  2-space region regex silently skips them.
- **Hub volunteers talk.** `hub.js` hands `onPrompt(arch, line)` a taunt from
  `arch.taunts` (rotated per station, `near.said`), `ui.hubPrompt(text, line)`
  renders it as `.hubSay` (italic yellow) above the `.hubCta` line. The pools
  were already deep via MORE_TAUNTS; the faceoff only ever showed one line per
  match, so this was free depth.
- **Line pools measured, not guessed.** WINS/FAILS were exactly 2 scenes per
  storyline (a 9-challenge tour showed each win beat 4–5×) — now 4 each, in
  voice, via `campaign.WINS/FAILS`. Public volunteers with 2 taunts (13: the
  movement trio, chuckles, and the 9 world locals) now have 4; campaign bosses
  stay at 2–3 (one match each). Measure a pool before writing for it:
  `node --input-type=module -e "import * as C from '/tmp/slapaudit/campaign.mjs'; …"`
  works because campaign.js has no three.js import; opponent.js does, so
  measure taunts in the browser (`ROSTER[].taunts.length` after MORE_TAUNTS).
  `__slapp.scene(beats, opts)` plays any beat array on the spot (test seam).
