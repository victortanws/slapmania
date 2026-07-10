# SlapMania — Overnight Multi-Agent Polish Run

Started 2026-07-10 (late), branch `overnight-polish` (NOT pushed to production —
review + merge in the morning; the live site at slapmania.org is untouched).

## GOAL (the north star)

Create an **expansion** of the game and **improve its mechanics meaningfully** in
a way that **keeps the game compiling/running**, while improving the **roster**,
the **campaign-mode story**, the **appearance**, and the **viral shareability** —
all while **preserving its unique, quirky, viral energy**. Every change is judged
against this: does it expand or deepen the game, does it still run, and does it
protect the quirk?

## The discipline being applied (from gacha-sim / vibe-coder-sim)

- **Causality is the prime directive (A1):** every outcome, reward, animation,
  world element, and story beat must have a cause the player can perceive —
  "the player saw X, therefore Y." Orphans get a cause or get cut/re-classed as
  ambient "weather."
- **Fix the level below the symptom (E3):** when something feels wrong, name the
  underlying cause, not the surface note.
- **Validator gates + dispositions:** every finding gets a SEVERITY
  (BLOCKER/MAJOR/MINOR) and a disposition (FIXED / SCHEDULED / CUT /
  ACCEPTED-WITH-REASON). Findings without a disposition block the run.
- **Adversarial validation before returning to the director (C1):** an
  independent agent roasts the work; fixes are applied before reporting.

## The fleet (the director's 7 roles)

| # | Role | Agent | Preview server | Status |
|---|------|-------|----------------|--------|
| 1 | Physicality & reality validator | PHYS | slap-phys :8990 | ✅ reported |
| 2 | Game-design validator (confirms/disconfirms #1) | GDES | — | queued (after #1) |
| 3 | Visual & appearance critic | ART | slap-art :8991 | running |
| 4 | Story & causality / believability critic | STORY | slap-story :8993 | ✅ reported |
| 5 | UI/UX blocking critic | UIUX | slap-uiux :8992 | ✅ reported → FIXES SHIPPED (branch) |
| 6 | Environments & bosses ideator (desert+) | WORLD | slap-game :8994 | ✅ reported |
| 7 | Roast → feedback → re-code orchestrator | (me + roast agent) | slap-preview :8996 | active |
| 8 | Camera & cinematography validator | CAMERA | slap-cam :8988 | running |
| 9 | Scene & boss-arena designer | ARENA | slap-arena :8989 | ✅ reported |
| 10 | Character creator (bosses/volunteers/slappers) | CREATOR | — | queued (synthesizes all others) |

## Consolidated findings & dispositions

_(filled as agents report; each finding tagged with severity + disposition)_

### STORY (role 4) — VERDICT: FIX-FIRST — reported

Campaign causal-spine audit. All dispositions PLANNED (implement in batch phase).

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| S1 | MAJOR | Two characters both called "the Judge" (Act I boss THE JUDGE vs JUDGE PENNYWHISTLE) blurs the Fair twist | PLANNED — rename Act I boss → THE ASSESSOR, strip court/session language (opponent.js:121, campaign.js:55/162) |
| S2 | MAJOR | Pennywhistle's betrayal under-planted — only a *random* faceoff ref-line foreshadows it | PLANNED — plant deliberately in Act III (lone 6–1 dissenter IS Pennywhistle; recurring "gavel in the shop" tic) |
| S3 | MAJOR | "The Fourth Form" grail is promised in prologue, never counted-to or named again (only 3 scrolls) | PLANNED — name it in a3c3/outro_a3c3 as the finale payoff |
| S4 | MAJOR | Mabel waits "fifty years" for a master "forty years dead" / "since '86" — 10yr contradiction | PLANNED — change "fifty"→"forty" (campaign.js:111), one word |
| S5 | MINOR | Palm outro "in the letting go" tips into fortune-cookie | PLANNED — concrete rephrase tied to Slee dying gripping the swing |
| S6 | MINOR | Bruce Slee's refusal set up, never resolved | PLANNED — one outro line acknowledging the stranger did what he wouldn't |
| S7 | MINOR | Mabel's owed "good" promised, never delivered on-screen | CONSIDER — 2-line coda (bittersweet button is defensible) |
| S8 | MINOR | Epilogue blueprint dating loose ("three weeks ago" vs "before the assessment") | PLANNED — unify wording |
| S9 | MINOR | Avatar accepts ghost-master with zero friction | CONSIDER — one disbelief beat |
| S11 | MINOR | Boulder Bob beaten on points, not his immovability thesis | NOTE (arena/mechanic agents may address) |
| S12 | MINOR | Victor's `'For the county!'` quip is generic filler | PLANNED — swap to his "I built this fair" register |

Top-3 ROI (STORY): S4 (one word) → S1 (rename un-blurs the twist) → S3 (one line pays the grail).
Structural note: rebuild the Fair betrayal as a real ladder — plant the corruption across Acts I–III so slapping His Honor is catharsis, not a punchline.

### WORLD (role 6) — DESERT world + new cast — reported (design brief)

**Prerequisite refactor (do FIRST):** the ice retint system is binary. Generalize
`winterMat(mat,hex)`/`winterIM(im,n,hex)`/`setFrost(on)` →
`biomeMat(mat,{ice,desert})` + `biomeIM(...)` + `setBiome(name)` storing a variant
map (`{ice:…, desert:…}`, fall back to base). ~30 mechanical call-sites. Keep the
existing calls working by making `winterMat(m,hex)` a thin alias = `biomeMat(m,{ice:hex})`.

**`WORLD_THEMES.desert`** (drop into the themes object):
`{ fog:[0xead4a8,60,185], skyTint:0xf2ddb4, hemi:[0xffe8bf,0xc79a5a,1.05], sun:[0xfff0cf,2.2], fill:0.24, cloud:0xfff2df, maps:false, grass:0xd8b878, lane:0xc79a5e, night:false, sunFace:true }`

**`setWorldTheme` desert branch** mirrors the ice block: toggle `desertG.visible`,
`dustDevil`, `parasol` (ringGirl shade, furG analog); hide farmhouses (show adobe/
ghost-town shacks on same footprints); `desertBarricade` (whiskey barrels+planks,
pushed into `barricade.pieces` so it still breaks/restacks) vs summer/snow; hide the
conifer forest, show `cactusBelt` (saguaro+red-rock InstancedMesh on the SAME `spots[]`
perimeter → invariant physics edge); pond→dried mud `0xa8895a`; `setCrowdDesert`
(dusty earth tones); `setBiome('desert')`; `sunMood('meh')` (the existing sweating sun).

**`desertG` contents:** mesas/buttes (flat-top `CylinderGeometry(rTop≈0.75·rBot,…,6)`
terracotta `0xb5623a` + strata band, reuse the 10 `mtn()` positions); saguaro+rock belt;
**tumbleweeds** (pool of ~6 wiry spheres rolling +x in `updateAmbient`, respawn at x=−20;
SIGNATURE HOOK: make 1–2 real cannon-es dynamic bodies mass~0.3 so flyers bowl through
them — the desert's "scare the birds"); dust devil (`Points` tan motes, snow analog);
buzzards (retint birds dark + red head, reuse scareBirds); roadrunner (ground sprinter,
reindeer analog, `sfx.squawk` meep); cattle skulls on the scarecrow posts. Retints: barn→
"LAST CHANCE SALOON" grey-brown, silo→rusted water tower, corn→dead tan `0xcbb187`,
orchards→olive-drab, reeds→dead brown.

**Signature physics hooks (pick per world):** desert = tumbleweed dynamic obstacles;
**MOON world (#2 ROI)** = `phys.setGravity(low)` flip in ragdoll.js (parallel to setIce)
→ 2.5–3× hangtime; reuse `stars`, add Earth disc plane, regolith retint, craters. NOTE:
Moon distances may blow past the DB dist cap 130 — gate/scale before enabling.
Other candidates ranked: Desert > Moon > Bayou (gator + mud friction) > Autumn (leaves via
the snow particle system; too close to Day — event only).

**New cast (WORLD):**
- Volunteers (public ROSTER): DUSTY DAN the prospector (featherweight dart, w.8/h1/mass.7);
  RODEO CLOWN CHUCKLES (padded bouncer, redNose, mass 1.1); SIDEWINDER SID snake-oil grifter
  (checked suit — desert cousin of Don, mass 1.0).
- Bosses (campaign-only): **SANDSTORM SAL** — NEW `sandblast` mechanic = the **L-timing exam**
  (non-PERFECT lunge ⇒ power ×0.40, "SANDBLASTED!"), mirrors grease's P-exam in onContact;
  completes the S·L·A·P exam set. **BOOTHILL BURT** undead sheriff = composite `shotClock:4` +
  super-mass 3.4 (all shipped flags). **GATOR McGRAW** (bayou) — NEW `chomp` = temporal weave
  (1.2s clamped ×0.12 "CHOMPED!" / 0.9s open), reuses the weave scaffold.
- Mechanic-set insight: sandblast(L) + grease(P) + chainGate(whole) leaves clean slots for an
  A-exam and S-exam boss → a future "school of slapping" act.

### ARENA (role 9) — boss arenas + always-on scenes — reported (design brief)

**Converges with WORLD on the refactor:** factor the palette half of `setWorldTheme`
into `applyPalette(t)` (fog/sky/hemi/sun/fill/cloud/ground/sunFace) so worlds AND arenas
share one path. Do the biomeMat refactor (WORLD) + applyPalette refactor (ARENA) together.

**Arena SYSTEM:** boss archetypes get an optional `arena:'quarry'` field. `ARENAS` registry
in scene.js (parallel to WORLD_THEMES): `{ palette, group, hideFair:[...] }`. Each `group`
(`quarryG`,`ringG`,`courtG`,`penG`) built once at init, `visible=false`. New
`stage.setArena(name)`: records `lastWorld` at top of setWorldTheme; setArena(name) applies
palette + shows group + dims fair bits (bunting/cloths/sunFace); setArena(null) restores
`lastWorld`. Wire: `startAttempt()` → `stage.setArena(arch.arena||null)`; `goToTitle()` +
campaign-clear in showResult → `stage.setArena(null)`. **HARD CONSTRAINT: arena geometry only
at x<-1 (behind opp), z±3..10 (flanks), or y>6 (overhead) — NEVER in the +x flight lane, never
touch the forest perimeter or solids.** Distances/caps stay invariant. 3–4 arenas cover 7 bosses
by theme-sharing.

**Arena specs (buildable):**
- **QUARRY PIT** (boulder, ironjaw): overcast grey palette, sunFace OFF; boulder amphitheatre
  behind ring, cracked-earth root ring under boss, ×4 stone plinths, iron-chain swags for bunting,
  bent barbell prop, dust motes. Sells MASS/immovability.
- **FIGHT TENT** (dale, granny): dark tent + single hot key-light; a real roped boxing ring
  (4 posts + 3 ropes red/white), canvas floor pad, 2 overhead spotlights, dense roaring ringside
  crowd (hot-tinted InstancedMesh), corner stools + bucket + brass bell, "FIGHT NIGHT" banner.
  Sells the bob-and-weave thesis.
- **KANGAROO COURT** (pennywhistle, judge/assessor): cold stadium glare + red-carpet lane;
  towering judge's bench + oversized gavel behind, fake-Greek columns (reuse farmhouse gable prism),
  a visibly TILTED scales of justice with a money bag, a bribed jury (identical gold-tie suits, some
  asleep), red velvet-rope stanchions, "COURT IN SESSION" sign. Sells institutional rigging (6s + 50%).
- **GREASED-PIG PEN** (grease, cheap gag): muddy daylight, sunFace ON; rail-fence pen, feed trough +
  slop puddles, hay, 3–4 milling low-poly pigs, mud splats. Sells "slides off."

**Always-on scenes (not arena-gated, raise every match; behind perimeter / overhead, no colliders):**
- **Fairground midway** (z −22..−32, x 8..30): a rotating Ferris wheel (Torus rim + spokes + 8 gondolas,
  animated like the windmill fan), a striped big-top tent, a swing ride. Finally makes it read "COUNTY FAIR".
- **Drifting hot-air balloon** (y 28..34): striped envelope + basket, slow drift loop (reuse cloud logic) —
  fills the sky during SLAPMASTER/EMPEROR arcs.

### PHYS (role 1) — VERDICT: SHIP — reported

Core verified SOLID: no NaN/tunneling/stuck ragdolls/camera loss; all 66 public matchups hit
HEAD (reach fair via strikeLift 0.9 clamp); launch capped 34 m/s → true max ~97m < 117m perimeter
< 130 DB cap; height→arc believable; fouls correct; ice glide realistic; all 7 bosses clean.

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| P1 | MINOR | "Deterministic" is false — launch jitter (`ragdoll.js:191-200` Math.random per-body) gives ~7% run-to-run spread (Charlie×Hank 63.8–75.5m); challenge links imply reproducible scores | PLANNED — seed a per-attempt PRNG from `attempts.length`+oppKey, tighten band ±2% (keeps repeatability for leaderboard integrity) |
| P2 | MINOR | Power fully decoupled from contact speed — 2.2 m/s graze → ~50m vs weave bosses (grades locked from earlier fast frame); reads broken though speed-invariance is by-design | HOLD for GDES — a soft `power*=clamp(speed/6,.5,1)` fixes the immersion break but touches the deliberate speed-invariant grading philosophy; GDES adjudicates |
| P3 | MINOR | Heavy volunteers (Hoss 2.6, Boulder 4.0) can defer result card to the 20s hard fallback (grounded but sliding) | PLANNED — faster settle for high-mass: `maxSpeed<2.0` once `pelY<0.6 && tState>6` |
| P4 | MINOR | `punch` foul is dead code (`main.js:551` — onContact only runs when pUnlocked, so foulType always null) | PLANNED — delete the unreachable branch (closed-fist whiff is correct + intended) |

## Improvements implemented

### Batch 1 — UI/UX mobile blockers (UIUX U1/U2/U3/U4/U5) — DONE + verified
- **U1+U2 BLOCKERs:** `.card{overflow-y:auto}` + mobile `#title,#match{justify-content:flex-start;
  padding}` — tall cards now scroll & top-align instead of clipping off both ends. VERIFIED at 375×812:
  MATCH_END score moved from top −234 (off-screen) → +76 (visible); card scrolls (1467>812) so the
  boards, name input, POST, all 4 share buttons, coffee, and the next-prompt are reachable (screenshots).
  TITLE h1 no longer clipped; world buttons reachable by scroll.
- **U2:** `#creditBar{display:none}` on mobile/short viewports (it sat under the world buttons).
- **U3 MAJOR:** mobile `#challengeBar` clamped to 2 lines + smaller font; `#distance{top:104px}` — the
  flight number + coach line no longer swallowed by the challenge banner in campaign/challenge play.
- **U4 (re-regression guard):** `ui.showMeters(true)` now also calls `refBar(null)` — makes the just-fixed
  refBar-over-meters overlap structurally impossible to reintroduce.
- **U5:** mobile `h1{font-size:46px;letter-spacing:0}` + `.tourHead` wrap — less edge clipping.
- Files: index.html (CSS), js/ui.js (showMeters). NOTE: preview reload gotcha — `location.assign('/')`
  reads a different HTTP-cache key than `fetch('index.html')`; must cache-bust the *document* URL.

## Left for the director

_(morning: what to review, what needs a human decision, what to merge)_
