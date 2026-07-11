# Content package 2: Dark Night, Divine Comedy, Slopberg (2026-07-11)

I've read everything required: DESIGN-LESSONS.md, CONTENT-PACKAGE.md (both pages), campaign.js in full (all 1051 lines — TOURS, CUTSCENES, FAILS/WINS/ESCAPE_FAIL, the stamping code), the full ROSTER idiom + gimmick handling in opponent.js, SLAPPERS in player.js, startTourChallenge/advanceScreens/setWorldFull in main.js, and WORLD_THEMES in scene.js. Everything below is paste-ready in the file's exact idiom (single quotes; double quotes when the line contains an apostrophe; emoji only inside content strings).

**Plumbing confirmation requested in the brief:** `startTourChallenge` (main.js:532) already reads the per-challenge field — `if (ch.world && stage.hasWorld(ch.world)) setWorldFull(ch.world);` — **but** campaign.js's stamping loop (line 958) **clobbers it**: `c.world = tour.world || null;` overwrites any `world:` set on a challenge row. Per-challenge world pins need this one-line tweak:

```js
// campaign.js, in the stamping forEach (line ~958):
c.world = c.world || tour.world || null;   // per-challenge pins win over the tour pin
```

That single edit powers deliverables 1 and 2. (Title restore already works: `goToTitle` re-applies `homeWorld`, so pins never leak.)

---

# 1. THE DARK NIGHT OF THE SOUL — Slap Therapy Act IV

Append to the `slaptherapy` tour's `acts` array. Goals are in the verified band: Joe (mass 0.95, no gimmick) at `headdist 30` matches the w3c4 tier-III precedent; Tony (mass 0.35) at 70m sits under his established 75m clear (n2c3); the Reaper capstone reuses the proven-clearable `pts 500` from n3c3 (mass 1.35 → 37m through a 7s shot clock + 65 chain gate). Reaper rematch is canon — cleared challenges are replayable, and this is a different tour's progress track.

```js
{
  act: 'SESSION IV — THE DARK NIGHT OF THE SOUL',
  story: 'The last patient left cured. The doctor stayed. At midnight the Haunted Fair opened its gate for him — and his shadow walked in alongside. Unattached. Unbilled. Physician, analyze thyself.',
  challenges: [
    { id: 't4c1', title: 'THE PERSONA', desc: "A flush cheek strike on JACK O'LANTERN JOE at 30m — the mask must be met head-on", opp: 'joe', world: 'haunted', goal: { type: 'headdist', v: 30 } },
    { id: 't4c2', title: 'MEMENTO MORI', desc: 'Send BONY TONY 70m — what remains, once everything is stripped away, had better fly', opp: 'tony', world: 'haunted', goal: { type: 'dist', v: 70 } },
    { id: 't4c3', title: '☗ BOSS: THE SHADOW AT DAWN', desc: 'Score 500 off THE GREEN REAPER — 7 seconds a swing, 65% form, and this appointment cannot be deferred again', opp: 'reaper', world: 'haunted', goal: { type: 'pts', v: 500 } },
  ],
},
```

Cutscenes (add to `CUTSCENES`). The act opener rides t4c1 per the established plumbing (there is no per-act scene slot); Joe is spawned first, so opp shots are safe. Carl stays clinical first-person; couch/cat/Red Book are load-bearing.

```js
// ===== SLAP THERAPY, SESSION IV — the analyst analyzes himself =====
t4c1: [
  { who: 'YOU', text: 'Session notes, midnight. The fair is closed. The Haunted Fair is not. I came to study the night terrors of others and found, at the gate, an opening in my own schedule.', shot: 'player' },
  { who: 'YOU', text: 'My shadow arrived separately. It is standing to my left. I did not authorize this. Fifty years I interpreted shadows — tonight mine has requested a session. The couch is en route. The cat walked here. The cat KNEW.', shot: 'player' },
  { who: "🎃 JACK O'LANTERN JOE", text: "Evenin', doc. First visit? Face like yours — fixed smile, professional, nothin' behind the eyes — you'll fit right in. Mine's carved on too.", shot: 'opp' },
  { who: 'YOU', text: 'The persona, literalized in gourd. Patient presents as a mask that GREW here. Flush on the carved cheek, thirty meters — and note, in red ink: when I strike the mask, we find out whose face I kept underneath mine.', shot: 'player' },
],
t4c2: [
  { who: '💀 BONY TONY', text: "Heard there's a doctor on the grounds! Forty years dead and my back still hurts. What's your rate?", shot: 'opp' },
  { who: 'YOU', text: 'The subtraction case. No license, no tenure, no boat. I have spent fifty years dreading the day I become him — and he is standing here CHEERFUL.', shot: 'player' },
  { who: '💀 BONY TONY', text: "Cheerful? Doc, I'm UNBURDENED. No lungs, no drag, no fear. You want to know what's left when everything's stripped away? Seventy meters. Watch what's left FLY.", shot: 'opp' },
  { who: 'YOU', text: 'Prescription: altitude. Note for the Red Book — the bones, freed of the flesh of the curriculum vitae, remain aerodynamic. There is hope for the profession.', shot: 'player' },
],
t4c3: [
  { who: 'YOU', text: 'Dawn is near. One appointment remains, and it is my own. The shadow did not come here to be analyzed. It came to be MET.', shot: 'player' },
  { who: '💀 THE GREEN REAPER', text: "Doctor. I was your next slide all along — every hourglass in your books, every boat you couldn't afford. Four hundred years I keep this lawn, and tonight, apparently, I'm a METAPHOR. I charge extra for metaphor.", shot: 'opp' },
  { who: 'YOU', text: 'You are the appointment every analyst defers, groundskeeper. I have written three books about avoiding you, and billed for all three. Tonight I settle the invoice — five hundred points, form legible, before your shift ends.', shot: 'player' },
  { who: '💀 THE GREEN REAPER', text: 'Seven seconds a swing, sixty-five percent, and doctor — the lawn takes cancellations. It does not GIVE them.', shot: 'opp' },
],
outro_t4c3: [
  { who: '💀 THE GREEN REAPER', text: '...slapped. By my own analyst. On my own lawn. That integration was FLUSH, doctor. What do I owe you?', shot: 'opp' },
  { who: 'YOU', text: 'Nothing. The patient tonight was never you.', shot: 'player' },
  { who: 'YOU', text: 'The sun is up. The shadow is back at my heels — attached, quiet, where a shadow belongs. Diagnosis: the analyst avoided himself for fifty years. Treatment: one night at the Haunted Fair. Outcome: integrated.', shot: 'player' },
  { who: 'YOU', text: 'The bill is drafted. "Dr. C. Gustav, for services rendered unto Dr. C. Gustav: one (1) dark night of the soul, plus couch freight. Payable to myself, in full." I am my own least cooperative patient, and my finest result. The cat has countersigned.', shot: 'player' },
  { who: 'YOU', text: 'NEXT PATIENT.', shot: 'player' },
],
```

Extra FAILS.t rotation pair, dark-night voice (append to the existing `t` array — pool rotation across the whole tour is fine, as briefed):

```js
[{ who: 'YOU', text: 'A miss. At midnight. In front of my own shadow. It is taking notes now — in MY notation.', shot: 'player' },
 { who: 'YOU', text: 'Countertransference with an entire fairground. Fascinating. Unbillable. Again.', shot: 'player' }],
```

---

# 2. THE DIVINE COMEDY — key `'commedia'`, DLC

**FAILS prefix check (grepped):** live keys are `a f w b n t v o`; predecessor reserved `d g p`. **`c` is free — confirmed.** All challenge ids below start with `c`, so `FAILS[ch.id[0]]` routing works untouched.

**Slapper decision:** `earl` exists (BIG EARL McSLAPP — shirtless strongman, nothing Dante about him), so no mashup. New DLC slapper, pinned to the tour (free campaign use per the bruceslee precedent):

```js
// SLAPPERS, js/player.js — DLC block
{
  key: 'dante', name: 'DANTE THE PILGRIM', desc: 'Halfway through the journey. Fully through with it.',
  skin: 0xe0b088, shirt: 0x8a1f2e, pants: 0x6e1a26,   // the red robe reads through shirt+pants
  hair: 'flat', hairCol: 0x2a1f18,
  robe: true,        // PORT from the opponent builder (hal/mantis/reaper idiom — the skullFace-port precedent)
  laurel: 0x2e7d4f,  // NEW look flag: traveler's laurel wreath, a thin leaf ring above the hairline
  height: 1.0, arm: 1.02, power: 0.96,   // an everyman — the campaign is about honesty, not tonnage
  locked: true, price: 4,
},
```

**PURGATORIO decision:** ship Act II on **`'lava'` re-dressed by dialogue** as the mountain's smoking foothills (Dante's Purgatory is literally the earth displaced by Hell's pit — the fiction holds). Zero new engine surface. Two flags: (1) lava's DONENESS result stamp will fire during Canticle II — either accept it as the trial-by-fire gag or gate the stamp on `campaign.active`; orchestrator should also confirm whether the showResult quirk reads the live `activeWorld` or `localStorage.slapp_world` (tour pins don't persist to localStorage, so it may not fire at all — check before "fixing"). (2) A true minimal `purgatorio` WORLD_THEMES entry (pre-dawn slate/rose palette, reuse `biome: 'desert'` tints + `barricade: 'boulders'` + `crowd: 'therapy'`, new kit: terraced switchback mountain, a queue of waiting souls, a gate arch) costs roughly a full scene.js session plus the frost/visibility guardrail pass — and DESIGN-LESSONS #1 says a world is a PLACE, so a cheap one shouldn't ship. Defer it; the dialogue carries Act II.

Two new ROSTER entries, both bosses, both composed from existing arch flags (Act I's boss is a zero-cost reuse gag — Pennywhistle doing community service in Hell, which his epilogue canon fully earns):

```js
// ROSTER, js/opponent.js — commedia bosses
{
  key: 'cato', name: 'CUSTODIAN CATO', tag: 'BOSS · THE MOUNTAIN GATE', boss: true,
  w: 1.35, h: 1.06, mass: 1.5, chainGate: 65, brow: true, robe: true, noStache: true,
  skin: 0xc9a06a, shirt: 0x8a8578, pants: 0x6e6a5e, whiteBeard: true,
  hair: 'bun', hairCol: 0xdcd6ca,
  broomProp: true,   // NEW look flag (optional, cheap): push-broom held on the Reaper's scythe mount
  pickLine: 'Sweeps the mountain gate. Sloppy form is litter, and he does not abide litter.',
  taunts: ['The mountain does not do appeals.', 'Sixty-five percent, or back down the switchbacks.', 'I swept out better form this morning.'],
},
{
  key: 'virgil', name: '👻 VIRGIL', tag: 'BOSS · THE RETIRED SURVEYOR', boss: true,
  w: 0.9, h: 1.0, mass: 0.9, weave: true, chainGate: 60, noStache: true,
  skin: 0xdcc4a8, shirt: 0x8a8f98, pants: 0x5a5f6a, suit: true, tie: 0x6e5a3a,
  hat: 'straw', whiteBeard: true,   // OUR Virgil: a county surveyor, not a toga
  pickLine: 'Guided everyone through. Never crossed his own line. Time the sidestep.',
  taunts: ['I surveyed this dodge in 1911.', 'You are three feet east of the truth, poet.', 'The stake moves. The stake is me.'],
},
```

**Goal calibration:** Don pts 400 = 30.8m (f4c1 precedent, verified). Pennywhistle pts 360 = 31.3m through his 6s clock + 50 gate (below the cleared f4c2 tier). Ray (1.8) at 32m sits under his ~40m ceiling. Cato mirrors the ironjaw template (mass 1.6/gate 70/28m) at mass 1.5/gate 65/28m. Heaven's −8.8 gravity flatters Act III: Hal at 60m pays off his own canon taunt ("I get my wings if you clear 60"), Cletus (0.75) at 45m is comfortable-expert, Virgil at 40m matches the Dale weave-40 precedent with gravity assist. Tour block:

```js
{
  key: 'commedia', title: '📜 THE DIVINE COMEDY',
  dlc: true,
  slapper: 'dante',
  blurb: 'Three worlds. Nine stops. In every circle, one soul waits on exactly one honest slap. A retired county surveyor knows the way.',
  acts: [
    {
      act: 'CANTICLE I — INFERNO',
      story: "Midway upon the journey of the county fair, the poet took a wrong turn at the parking lot and came out underneath everything. The good news: there's a guide. The better news: everyone down here is one honest slap from moving on.",
      challenges: [
        { id: 'c1c1', title: 'ABANDON ALL WHIFF', desc: 'A clean head slap on LOW-LEVEL LARRY — 400 years in complaints, one witnessed slap from his transfer', opp: 'larry', world: 'hell', goal: { type: 'head' } },
        { id: 'c1c2', title: 'THE FOURTH CIRCLE', desc: 'Score 400 off TREMENDOUS DON — he is not damned, he is INVESTED', opp: 'don', world: 'hell', goal: { type: 'pts', v: 400 } },
        { id: 'c1c3', title: '☗ BOSS: THE HONORABLE DAMNED', desc: 'Score 360 off JUDGE PENNYWHISTLE — community service, six seconds a swing, and nothing down here is expedited', opp: 'pennywhistle', world: 'hell', goal: { type: 'pts', v: 360 } },
      ],
    },
    {
      act: 'CANTICLE II — PURGATORIO',
      story: 'Out of the pit and onto the smoking foothills of the mountain. Every terrace holds a volunteer working off one last thing, and the custodian at the gate does not abide sloppy form.',
      challenges: [
        { id: 'c2c1', title: 'THE TERRACE OF PRIDE', desc: 'An 85% chain before MAESTRO FORTISSIMO — one honest slap, in tempo, releases him upward', opp: 'maestro', world: 'lava', goal: { type: 'chain', v: 85 } },
        { id: 'c2c2', title: 'THE TERRACE OF SLOTH', desc: "Send RAVIN' RAY 32m — on this terrace, momentum counts as hustle", opp: 'ravinray', world: 'lava', goal: { type: 'dist', v: 32 } },
        { id: 'c2c3', title: '☗ BOSS: THE MOUNTAIN GATE', desc: 'Move CUSTODIAN CATO 28m — below 65% form you are litter, and he sweeps litter DOWN', opp: 'cato', world: 'lava', goal: { type: 'dist', v: 28 } },
      ],
    },
    {
      act: 'CANTICLE III — PARADISO',
      story: 'The cloud country. Floaty gravity, gentle souls, and paperwork all the way up. At the very top, the guide who walked everyone home discovers the one line he never crossed: his own.',
      challenges: [
        { id: 'c3c1', title: 'FLIGHT APTITUDE', desc: 'Send HALO HAL 60m — clear him for his wings; he highlighted the relevant paragraph', opp: 'hal', world: 'heaven', goal: { type: 'dist', v: 60 } },
        { id: 'c3c2', title: 'CLOSEST TO THE DOOR', desc: 'Send GRANDPA CLETUS 45m — the nearest to flying an old man gets', opp: 'cletus', world: 'heaven', goal: { type: 'dist', v: 45 } },
        { id: 'c3c3', title: "☗ FINAL BOSS: THE SURVEYOR'S LINE", desc: 'Slap VIRGIL 40m — 60% form minimum, and mind the sidestep; he invented the sidestep', opp: 'virgil', world: 'heaven', goal: { type: 'dist', v: 40 } },
      ],
    },
  ],
},
```

Cutscenes. **Shot rule:** Virgil-as-guide scenes use `wide`/`player` only — `shot: 'spirit'` stages Master Slee's ghost model via `setSpirit` and must never be used for Virgil. In c3c3/outro he's the summoned opp, so `opp` shots frame him properly. The prologue rides c1c1 (Larry is spawned, opp shots safe, but the prologue itself stays player/wide).

```js
// ===== THE DIVINE COMEDY (Dante the Pilgrim; Virgil, county surveyor, ret.) =====
commedia_prologue: [
  { who: 'YOU', text: 'Midway upon the journey of this county fair, I found myself within a parking lot so dark that the straightforward path to the pie stand was wholly lost.', shot: 'player' },
  { who: '👻 VIRGIL', text: "Evenin'. Virgil. County surveyor, retired. I've staked every acre of the hereafter — the pit, the mountain, the cloud country. All of it is off by three feet, and nobody will hear it from me.", shot: 'wide' },
  { who: 'YOU', text: 'A guide! Sent by providence!', shot: 'player' },
  { who: '👻 VIRGIL', text: "Sent by boredom. Here's the survey, poet: three worlds, nine stops, and at every one of 'em somebody's stuck — waiting on exactly one honest slap to move along. You bring the palm. I'll bring the map.", shot: 'wide' },
  { who: 'YOU', text: 'Then downward first, that I may afterward ascend! I shall compose one hundred cantos upon it!', shot: 'player' },
  { who: '👻 VIRGIL', text: "Keep it to three acts. Trust me. I've read the long version.", shot: 'wide' },
],
c1c1: [
  { who: '👻 VIRGIL', text: "First stop: the complaints department. Larry's transfer request has been pending four hundred years — it needs a witnessed slap, and nobody down here gives an HONEST one.", shot: 'wide' },
  { who: 'LOW-LEVEL LARRY', text: "You're my appeal? Cheek's right here. One clean strike, notarized by the sting, and I finally get promoted to Purgatory. Mail room. It's a step UP.", shot: 'opp' },
  { who: 'YOU', text: 'Abandon all whiff, ye who slap through here.', shot: 'player' },
],
c1c2: [
  { who: 'YOU', text: 'The fourth circle — the hoarders, straining at great weights for all eternity. And there, atop the largest weight... no. It cannot be.', shot: 'player' },
  { who: 'TREMENDOUS DON', text: "Timeshare! It's a TIMESHARE. Beautiful circle. Very exclusive. The flames are gold-plated — I had them done.", shot: 'opp' },
  { who: '👻 VIRGIL', text: "He's not damned, exactly. He toured the place and made an offer. Four hundred points, poet — down here that's a security deposit.", shot: 'wide' },
  { who: 'YOU', text: 'Even in the pit, he closes.', shot: 'player' },
],
c1c3: [
  { who: 'JUDGE PENNYWHISTLE', text: 'Order! ORDER IN THE UNDERWORLD! ...Community service. Six thousand hours. It transpires that accepting blueprints in a gavel case is frowned upon in EVERY jurisdiction.', shot: 'opp' },
  { who: 'YOU', text: 'The corrupt judge, condemned to judge the condemned. The poetry writes itself. I shall not attempt to improve upon it.', shot: 'player' },
  { who: 'JUDGE PENNYWHISTLE', text: 'One honest slap reduces my sentence, champ — form 666-B, I checked. Six seconds a swing, half your form minimum, and NOTHING in this circle is expedited. I filed a complaint. It joined the queue.', shot: 'opp' },
],
c2c1: [
  { who: '👻 VIRGIL', text: "Out of the pit and onto the foothills. Still smokin', but it's UP from here — the mountain works in terraces. First terrace: pride.", shot: 'wide' },
  { who: 'MAESTRO FORTISSIMO', text: 'I am here VOLUNTARILY. Purging the sin of pride. It is taking DECADES, because — and I say this humbly — mine is the finest pride on the mountain.', shot: 'opp' },
  { who: 'YOU', text: 'Eighty-five percent, maestro, every link in tune. Not for the terrace. For the tempo.', shot: 'player' },
  { who: 'MAESTRO FORTISSIMO', text: 'For the TEMPO! You see? He learns. One honest slap, in time, and I ascend — to the next terrace, where I shall be humble about THAT.', shot: 'opp' },
],
c2c2: [
  { who: "RAVIN' RAY", text: "Sloth terrace, man. The penance is you gotta HUSTLE, forever. They put me here 'cause I sleep all day. That's not sloth. That's SCHEDULING.", shot: 'opp' },
  { who: '👻 VIRGIL', text: "He's appealed it three times. The mountain don't do appeals. It does do momentum — thirty-two meters counts as hustle, and up he goes.", shot: 'wide' },
  { who: 'YOU', text: 'Then rise, nocturnal one, upon the wings of a single honest slap!', shot: 'player' },
  { who: "RAVIN' RAY", text: 'See, THAT guy gets it. Drop it on the downbeat.', shot: 'opp' },
],
c2c3: [
  { who: 'CUSTODIAN CATO', text: 'VIRGIL. Still telling folk my gate is three feet east?', shot: 'opp' },
  { who: '👻 VIRGIL', text: 'It IS three feet east, Cato. I have the stakes.', shot: 'wide' },
  { who: 'CUSTODIAN CATO', text: 'The GATE decides where the gate is. Pilgrim — sixty-five percent form, twenty-eight meters, and I open it. Anything less is litter, and litter gets swept DOWN.', shot: 'opp' },
  { who: 'YOU', text: 'Two old men and a property line. Even Purgatory is a county.', shot: 'player' },
],
c3c1: [
  { who: 'HALO HAL', text: "Poet! You made it! Big news: my wings review is TODAY. If a visitor clears me sixty meters, that's 'demonstrated flight aptitude.' It's in the manual. I highlighted it.", shot: 'opp' },
  { who: '👻 VIRGIL', text: 'The cloud country runs on paperwork too. Told you. Everything is a county.', shot: 'wide' },
  { who: 'YOU', text: 'Then soar, apprentice! One honest slap, and heaven itself must file your promotion!', shot: 'player' },
],
c3c2: [
  { who: 'GRANDPA CLETUS', text: "Sonny. Been visitin' up here since '61 — they let me nap on the clouds, on account of I'm 'closest to the door.' Their words. I choose to take it kindly.", shot: 'opp' },
  { who: 'YOU', text: 'The veteran, serene upon the summit of all things. Why volunteer, elder?', shot: 'player' },
  { who: 'GRANDPA CLETUS', text: "Forty-five meters, up HERE, with the floaty gravity? That's the closest to flyin' an old man gets while still buyin' green bananas. Mind the suspenders.", shot: 'opp' },
],
c3c3: [
  { who: '👻 VIRGIL', text: "Well. Here's the top. Everyone I ever guided went through that gate. Job's done, poet — I'll just wait here. Like always. Somebody's got to mind the stakes.", shot: 'wide' },
  { who: 'YOU', text: 'Guide. In every circle, one soul waits on a single honest slap. You surveyed all three worlds — and never once crossed your own line. Whose slap do YOU await?', shot: 'player' },
  { who: '👻 VIRGIL', text: "...seven hundred years of boundaries, and the poet finds the one I drew around myself. Fine. FINE. But I stand still for nobody — sixty percent form, forty meters, and mind the sidestep. I invented the sidestep.", shot: 'opp' },
  { who: 'YOU', text: 'Then hold still exactly as much as you are able, old friend. This canto ends with you THROUGH the gate.', shot: 'player' },
],
outro_c3c3: [
  { who: '👻 VIRGIL', text: "...I'm through. I'm THROUGH the gate. The far side of my own property line. You know what's over here, poet? Three more feet. I KNEW it.", shot: 'opp' },
  { who: 'HALO HAL', text: 'Wings came through! I filed his transfer myself — first stamp of the new job. Welcome home, Mr. Virgil!', shot: 'wide' },
  { who: 'YOU', text: 'And thus the surveyor was moved — the final measurement, taken upon his own cheek. I shall write one hundred cantos!', shot: 'player' },
  { who: '👻 VIRGIL', text: 'Three acts, poet. We talked about this.', shot: 'opp' },
  { who: 'YOU', text: 'The love that moves the sun, the other stars, and — chiefly — the open palm. Very well. Three acts. But the epilogue rhymes.', shot: 'player' },
],
```

FAILS.c / WINS.c:

```js
// FAILS
c: [
  [{ who: '👻 VIRGIL', text: "Missed by three feet. I'd know — measuring is the whole job.", shot: 'wide' },
   { who: 'YOU', text: 'Midway upon the journey of that swing, the straightforward path was lost. Again!', shot: 'player' }],
  [{ who: 'YOU', text: 'O muse, o high genius, aid me now! ...The muse says my hips fired early.', shot: 'player' },
   { who: '👻 VIRGIL', text: 'The muse is right. Hips, THEN hands, poet. Same as the last seven centuries.', shot: 'wide' }],
],
// WINS
c: [
  [{ who: 'YOU', text: 'And one soul, freed by a single honest slap, moved on! I shall render it in eleven syllables!', shot: 'player' },
   { who: '👻 VIRGIL', text: 'Render it in eight. Onward — the map says up.', shot: 'wide' }],
  [{ who: '👻 VIRGIL', text: 'Clean strike. Surveyed it myself: flush, square, and three feet farther than you needed. Showoff.', shot: 'wide' },
   { who: 'YOU', text: 'The poem demanded a margin.', shot: 'player' }],
],
```

TOUR_ORDER: append `'commedia'` after `'slopvalley'`.

---

# 3. SLOP VALLEY: THE SLOPBERG SCENES

Parody-idiom note: Mark Slopberg follows the Tremendous Don / Miracle Mira precedent — archetypal name-parody, jokes strictly on public-persona iconography (cows, smoked meats, wakeboarding, BJJ, VR, "normal guy") and on billionaire-mansion institutions. No appearance-mockery, no private-life material.

## 3a. Volunteer + boss (`ROSTER`, ava/avaskis two-entry precedent)

```js
{
  key: 'slopberg', name: 'MARK SLOPBERG', tag: 'JUST A NORMAL GUY', world: 'techcampus',
  w: 0.95, h: 1.02, mass: 1.0, noStache: true,
  skin: 0xf0dcc2, shirt: 0x8a8f98, pants: 0x4a6fa5,   // sunscreen-pale, gray tee, jeans
  hair: 'frizz', hairCol: 0x4a3018,                    // tight curls
  pickLine: 'Owns the valley, the mansion, and nine cows. Will mention the cows.',
  taunts: [
    'Have you met my cows? Their names are longer than yours.',
    'I smoke my own meats. The meats are grass-fed. The grass is also mine.',
    "Just a normal guy. Normal house. Forty bathrooms. Normal.",
    'I wakeboard at dawn holding a flag. It tested well.',
    "My cows have never been slapped. It's a culture thing.",
    'The tee is gray because choices are friction. Also I own the color.',
  ],
},
{
  key: 'slopbergboss', name: 'MARK SLOPBERG', tag: 'BOSS · BLUE BELT, TWO STRIPES', boss: true,
  w: 0.95, h: 1.02, mass: 1.0, noStache: true,
  skin: 0xf0dcc2, shirt: 0x8a8f98, pants: 0x4a6fa5,
  hair: 'frizz', hairCol: 0x4a3018,
  vrHeadset: 0xe8e8ee,                          // NEW look flag: chunky pale visor over the eyes (reuse the goggles mount, scaled up)
  bjj: { period: 3.0, reach: 1.2, telegraph: 0.35 },   // NEW mechanic — see spec
  pickLine: "He took up BJJ 'for fun.' The fun is takedowns.",
  taunts: ['My coach says I am coachable. At my net worth, that means TERRIFYING.', 'Reach is a gift. I reach every three seconds.', 'This is round one. I have acquired all subsequent rounds.'],
},
```

## 3b. The `bjj` mechanic spec (learnable, weave-family)

```
bjj: { period: 3.0, reach: 1.2, telegraph: 0.35 }
t = this.time % period, per Opponent.update (gimmick branch, alongside weave/hop/sway):
  [0.00, 1.45)  NEUTRAL   — normal braced pose; contact resolves normally
  [1.45, 1.80)  TELEGRAPH — both arms lerp braced→extended over 0.35s + a slight crouch
                (POSITIVE eulers only — the influencer selfie-stick lesson; negatives scatter the limb)
  [1.80, 3.00)  REACH     — arms fully extended toward the slapper, torso leans in +0.12
New method: Opponent.inReach() → true ONLY during REACH (telegraph is the safe warning).
main.js onContact: if (opponent.arch.bjj && opponent.inReach()) → TAKEDOWN:
  cancel the launch, consume the attempt via the existing foul path, 3-pip sfx.whistle(),
  ui.slapBurst('TAKEDOWN!', "HE'S BEEN TRAINING FOR THIS")   // the banner, NOT #smack
  tookTakedown = true  // module-level, reset in startAttempt — mirrors surgeFired
advanceScreens fail branch (next to the skiRun escapeBeat):
  const takedownBeat = chosenArch && chosenArch.bjj && tookTakedown;
  const fail = takedownBeat ? campaign.TAKEDOWN_FAIL : escapeBeat ? campaign.ESCAPE_FAIL : …
```

Learnability check: 1.8s of every 3.0s cycle is safe; a fresh S-coil (~1s to full) started as his arms drop fits the whole S→L→A→P chain inside one safe window, and the 0.35s telegraph warns before the 1.2s danger. This is deliberately more forgiving than weave's 1.5/1.5 because failure costs the whole attempt, not just the hit.

```js
// campaign.js — the one fail that isn't a whiff: Mark caught the slap mid-REACH.
// Played directly by main.js instead of rotating FAILS.v — the ESCAPE_FAIL idiom.
export const TAKEDOWN_FAIL = [
  { who: 'MARK SLOPBERG', text: "Single-leg. Side control. It is done. My coach makes me say 'it is done' — it builds the brand.", shot: 'opp' },
  { who: 'YOU', text: '...he folded me like a term sheet.', shot: 'player' },
  { who: 'MARK SLOPBERG', text: "You okay? Here, water — it's from the ranch. The water is also grass-fed. Go again. I need the reps.", shot: 'opp' },
];
```

## 3c. Reworked SPRINT III (replaces the `slopvalley` act III block wholesale)

One new mansion challenge (`v3c3g`, prefix-`v` keeps FAILS routing) + `v3c4` final boss appended after v3c3; v3c3 demoted from FINAL BOSS to BOSS. Goals: Slopberg volunteer (mass 1.0, no gimmick) at 45m = the g3c1/hank tier-III precedent; boss at 40m matches the Dale weave-40 gimmick-boss precedent.

```js
{
  act: 'SPRINT III — THE AGI REVEAL',
  story: 'Out of money, out of founders, out of excuses, Vance announces AGI is already here — and wheels out a robot the size of a shed. It mostly generates apologies. And when the dust settles, the man who owns the whole valley invites you up the hill to meet his cows.',
  challenges: [
    { id: 'v3c1', title: 'HUMAN EVAL', desc: 'An 88% chain before SCHOOLMARM SUSIE — the opposite of slop, every link handwritten', opp: 'susie', goal: { type: 'chain', v: 88 } },
    { id: 'v3c2', title: 'THE LAST PIVOT', desc: 'Send VISIONARY VANCE 75m — the most authentic content this valley has ever produced', opp: 'vance', goal: { type: 'dist', v: 75 } },
    { id: 'v3c3', title: '☗ BOSS: S.L.O.P. UNIT-1', desc: 'Score 480 off the robot — 6 seconds of compute a swing; sub-70% slaps get discarded as training data', opp: 'slopunit', goal: { type: 'pts', v: 480 } },
    { id: 'v3c3g', title: 'THE GARDEN TOUR', desc: 'Send MARK SLOPBERG 45m over his own palm trees — he wants to see the herd from above', opp: 'slopberg', goal: { type: 'dist', v: 45 } },
    { id: 'v3c4', title: '☗ FINAL BOSS: MARK SLOPBERG', desc: 'Slap MARK SLOPBERG 40m — when the arms come UP he is reaching, and a slap into the reach gets TAKEN DOWN', opp: 'slopbergboss', goal: { type: 'dist', v: 40 } },
  ],
},
```

Cutscenes:

```js
v3c3g: [
  { who: 'MARK SLOPBERG', text: "Hey. Mark. I bought the crater. And SynerCorn. And the robot — it does birthdays now. Come up to the house, I'll show you the cows. This is my normal voice.", shot: 'opp' },
  { who: 'YOU', text: 'The house has a gate, a guard, and a pool that pretends the horizon works for it.', shot: 'player' },
  { who: 'MARK SLOPBERG', text: "Infinity pool. Technically it never ends, which the lawyers love. Look — the valley says your slap can't be acquired. I respect that SO much I'd like to acquire the experience. Forty-five meters, over the palms. I want to see my herd from above.", shot: 'opp' },
],
v3c4: [
  { who: 'MARK SLOPBERG', text: 'Welcome to the living room. Normal living room. The couch seats forty. The fireplace is load-bearing content.', shot: 'opp' },
  { who: 'YOU', text: 'Why the headset?', shot: 'player' },
  { who: 'MARK SLOPBERG', text: "I'm in both rooms right now — this one, and a better one where I've already won. Also, full disclosure, it's a legal thing: I've been training BJJ for two years. Blue belt. Two stripes. My coach says I'm coachable, which at my level of wealth means terrifying.", shot: 'opp' },
  { who: 'MARK SLOPBERG', text: 'House rules: when my arms come UP, I am reaching. Reach means takedown. Between reaches I am just a normal guy with a normal cheek. ...You should meet the cows after this. Henrietta does a trick.', shot: 'opp' },
  { who: 'YOU', text: 'Swing between the reaches. Understood. Your move, normal guy.', shot: 'player' },
],
outro_v3c4: [
  { who: 'MARK SLOPBERG', text: "The headset came off. I'm only in ONE room now. Huh. It's a good room. Nobody has landed a hand on me since the board meeting of 2019 — and that was a handshake.", shot: 'opp' },
  { who: 'YOU', text: 'You held the reach a half-second too long.', shot: 'player' },
  { who: 'MARK SLOPBERG', text: "Coach is going to clip that. It's fine. It's FINE. I'm fine. ...Hey. Do you want to see the cows? Nobody ever wants to see the cows. They just want the term sheet.", shot: 'opp' },
  { who: 'YOU', text: 'I genuinely want to see the cows.', shot: 'player' },
  { who: 'MARK SLOPBERG', text: "THIS is why your slap can't be acquired. Henrietta first — she does a trick. And take some smoked meats for the road. I smoked them myself, at 4 a.m., on the wakeboard. Don't ask how. It tested well.", shot: 'opp' },
],
```

## 3d. Mansion scene-kit addendum (prose for scene.js, modest — lives inside `techG`)

Kit-internal props only show in techcampus, so they need **no** biome/frost registration (that guardrail covers shared farm props); techcampus already sets `hideFarm`. Recipe mirrors the igloo trick — dress an existing footprint, leave physics boxes alone:

- **Mansion facade** on the SLAPP ACRES farmhouse footprint at (96,19): two stacked white-stucco slabs, floor-to-ceiling "glass" as dark low-emissive panels, flat roof slab, wide shallow steps. Flyers keep bouncing off the existing farmhouse collider — the mansion is skin.
- **Palm trees**: instanced, 8–10 along the lane edge x≈70–95 — gently bent cylinder trunks + 6-frond stars (frond green distinct from the tech canopy tint 0x4f9e4f so they read as landscaping, not orchard).
- **Infinity pool**: glossy flat plane in the pond blue (0x2a8ae0) with a raised white lip on three sides and the downhill edge open (the "infinity" read), two lounge chairs, offset toward the camera side so the chase cam catches it.
- **Security gate**: two stone piers + a black bar gate across a driveway stub + an intercom post with a pin-camera; sign via makeTextTexture (mind maxWidth 500): `SLOP RANCH — PRIVATE (BUT NORMAL)`.
- **The cows** (the payoff): 2–3 background cows behind a low gray rail near the mansion — reuse the farm cow builder. Henrietta gets a name plank.
- v3c4 is fought "inside" via dialogue only; world stays techcampus, no interior build.

---

# 4. CUTSCENE QUALITY REVIEW (all 47 scenes read)

Overall: the set is strong — Wonders and Second Wind are the high bar (every scene has a voice, a joke, and a mechanic read), Therapy and Night of Slaps close behind. The weaknesses cluster in the two oldest tours (Palm, Fair), which predate the "every scene earns its beat" standard.

**Five weakest, one-line diagnosis each:**

1. **a3c2** — Two beats, zero jokes; "Again with the honest work" is a shrug where the act's penultimate lesson should live.
2. **f2c2** — Pure goal plumbing; the Judge states the number twice and Hoss's one good line ("Folks do love watchin' me not move") carries the whole scene alone.
3. **o3c2** — Two functional lines; the record-book premise deserves a Hank beat and instead gets a spelling request.
4. **a2c2** — "Hill. He is a hill." lands, but the scene ends before it starts; no third beat, no reason Hoss agreed to this.
5. **f1c1** — Exposition-heavy campaign opener: four lines of plot delivery, and Bertha's closer is generic pep rather than her voice.

**Drop-in replacements for the worst 3:**

```js
a3c2: [
  { who: '👻 MASTER SLEE', text: 'Anyone can throw a feather over the county line. The Third Scroll throws HANK. No featherweights, no wind, no excuses.', shot: 'spirit' },
  { who: 'HAYSEED HANK', text: "Seventy-five meters. My scarecrow is gonna think I'm showin' off.", shot: 'opp' },
  { who: '👻 MASTER SLEE', text: 'Tell the scarecrow it is next.', shot: 'spirit' },
],
f2c2: [
  { who: 'JUDGE PENNYWHISTLE', text: 'Legal defense funds grow on points, champ — and our biggest draw is the big man. Folks pay just to watch him not move.', shot: 'judge' },
  { who: 'BIG HOSS', text: "Twenty years I've been the fair's north wall, sugar. Tonight I'm the fundraiser.", shot: 'opp' },
  { who: 'JUDGE PENNYWHISTLE', text: 'Five hundred points. If Hoss travels, the county opens its wallet out of sheer disbelief.', shot: 'judge' },
],
o3c2: [
  { who: '🏅 COMMISSIONER QUIBBLE', text: 'Every Olympic sport arrives with a record for the next generation to chase. Set one. Officially. I have brought the good clipboard.', shot: 'wide' },
  { who: 'HAYSEED HANK', text: "A world record. Me. Ma said this cheek would go places — she meant CHURCH.", shot: 'opp' },
  { who: 'YOU', text: 'Fifty meters, Hank. The book will spell it H-A-N-K.', shot: 'player' },
],
```

**Stale-reference / contradiction flags (all verified against the live file):**

- **campaign.js:291** (olympicbid Ring III `story`): `'Ava\'s "evaluation" has 400 million views…'` — **Ava→Eileen rename leftover** in player-visible text. Fix: `Eileen's`.
- **b2c1 cutscene vs goal**: challenge is **40m**; Bruce's line says "forty-five meters" (line 537). Stale retune number.
- **b3c1 cutscene vs goal**: challenge is **50m**; the scene says "county line" (Slee), "Eighty meters" (Hank), and "Eighty meters is only a long exhale" (Bruce) — three stale spots from the 80→50 retune.
- **t3c1 cutscene vs desc**: challenge desc says **45m**; Carl's line says "requires seventy meters" (line 681). Stale.
- Comment-only (harmless but worth sweeping): line 829 FAILS comment lists only `'a' 'f' 'w' 'b'` (six keys missing); line 884 "Ava made the exit gate"; line 511 block header still says "THE SECOND WIND" post-retitle. The tour title itself (BRUCE VS CHUCK: THE LAST LEGEND) and the b3c3 challenge title "THE SECOND WIND" are consistent — the mechanic is still called Second Wind, so only the comments are stale.
- **w2c3 + its desc** reference the current coilExam mechanic ("wind the coil past 85%") — internally consistent today, but the predecessor's Tick-Tock v2 rework (CONTENT-PACKAGE §5) replaces both; whoever implements v2 must swap desc and scene together.
- **Curated-roster audit**: clean. Haunted scenes use only joe/tony/cletus/ravinray/maestro (+reaper boss) — all on the haunted list; Therapy uses the canon client list; the dojo tour's non-boss cast (hank/slim/susie) is inside the dojo curation; bosses are summon-by-key everywhere, per the rule. No scene stages a volunteer in a world that excludes them.

---

## Implementation-surface summary (for the orchestrator)

- **One-line plumbing fix (required for #1 and #2):** campaign.js stamping loop → `c.world = c.world || tour.world || null;`. main.js already honors `ch.world` (line 532); title restore already reverts pins.
- **New tour keys/prefixes:** `commedia` (`c` — collision-checked against live `a f w b n t v o` and reserved `d g p`); Slap Therapy Act IV rides existing `t`; Slopberg rides existing `v`. TOUR_ORDER: add `'commedia'`.
- **New ROSTER entries:** `cato` (chainGate 65 — existing mechanic), `virgil` (weave + chainGate 60 — existing mechanics), `slopberg` (plain volunteer, world techcampus), `slopbergboss` (new `bjj` mechanic).
- **New SLAPPERS entry:** `dante` (DLC, price 4, pinned to commedia).
- **New mechanic:** `bjj {period 3.0, reach 1.2, telegraph 0.35}` + `Opponent.inReach()` + main.js takedown foul path (`tookTakedown` mirrors `surgeFired`) + `TAKEDOWN_FAIL` export wired beside the `skiRun` escapeBeat. Feedback via `ui.slapBurst` (banner, not `#smack`).
- **New look flags:** `laurel` (player), `robe` port to player builder (skullFace-port precedent), `vrHeadset` (reuse goggles mount, scaled), `broomProp` (optional — Reaper's scythe mount).
- **No new worlds, no new goal types.** Act IV reuses `haunted`; commedia reuses `hell`/`lava`/`heaven` (heaven's −8.8 gravity and hell's inverted crowd are free flavor). Purgatorio ships as lava re-dressed by dialogue; a real `purgatorio` world is specced but recommended deferred (~a scene.js session, and DESIGN-LESSONS #1 forbids a cheap one).
- **Open checks for the orchestrator:** (1) whether lava's DONENESS stamp reads `activeWorld` or `localStorage.slapp_world` — tour pins don't persist, so it may silently not fire during Canticle II; decide keep/gate. (2) v3c3's title demotion from FINAL BOSS to BOSS ships with the act III block above. (3) The four stale-number/rename fixes in the review are one-word edits — safe to batch.

All content self-audited against DESIGN-LESSONS: mechanics are story beats (the takedown, Virgil's own line, the shadow), bosses have payoff loops (headset off, gate crossed, dawn + self-invoice), parody stays on situations and institutions, and no kids, ethnicities, or real-person biography anywhere.