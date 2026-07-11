# Comedy + geopolitics content package (agent deliverable, 2026-07-11)

I've read `campaign.js` in full (TOURS/CUTSCENES/FAILS/WINS/ESCAPE_FAIL formats), the `ROSTER` flag idiom in `opponent.js`, `SLAPPERS` in `player.js`, `CLAUDE.md`, and `DESIGN-LESSONS.md`. Everything below is paste-ready in those exact formats, validated against the twelve principles (esp. #2 curated rosters, #3 boss payoff loop, #4 mechanic-is-the-beat, #5 slapper choice matters, #11 warm archetypal parody, #12 every fair is somebody's story). All read-only; the orchestrator implements.

Used tour prefixes are `a f w b n t v o` — new tours below take `d` (desert), `g` (gym), `p` (playground). String style follows the file: single quotes, double quotes when the line contains an apostrophe.

---

# 1. MR. SLAPPINGTON + THE NIGHT OF SLAPS rewrite

## 1a. The slapper (`SLAPPERS`, js/player.js — DLC block)

```js
{
  key: 'slappington', name: 'MR. SLAPPINGTON', desc: 'The Fright Impresario. Bored of booing.',
  skin: 0xf2efe6, shirt: 0x1b1b22, pants: 0x1b1b22,   // skull-white head, midnight pinstripe
  hair: null, hairCol: 0x1b1b22, beard: null,
  suit: true, tails: true, tie: 0x6e2231,             // reuse Horton's tailcoat idiom
  pinstripe: 0x8a8fa0,   // NEW look flag: thin vertical stripes on suit torso/legs
  skullFace: true,       // PORT from opponent builder (Bony Tony idiom) — same as glasses was ported the other way
  batBow: true,          // NEW look flag: the bow tie is a tiny bat, wings twitch on PERFECT chains
  height: 1.10, arm: 1.15, power: 0.84,
  locked: true, price: 4,
},
```

**Rationale.** Tall-thin theatrical build: longest arm in the game (1.15 > Roy's 1.08), tallest strike plane, weakest full-size power — a reach-and-finesse featherweight specialist, which is exactly what his own campaign rewards (Bony Tony, mass 0.35, distance goals). Look reuses `skullFace`/`suit`/`tails`; only `pinstripe` and `batBow` are new. Pinning him to the tour grants free campaign use of the locked DLC, per the `bruceslee`/`secondwind` precedent.

## 1b. Reworked tour entry (replaces `nightofslaps` in `TOURS`)

Same ids/opponents/goals — progress and FAILS/WINS keying (`n`) are untouched; only the frame changes from "locked-in visitor" to "the impresario's own story" (principle #12).

```js
{
  key: 'nightofslaps', title: '🎃 THE NIGHT OF SLAPS',
  dlc: true,
  world: 'haunted',
  slapper: 'slappington', // pin the impresario — the 'YOU' voice is his; grants free campaign use of the DLC
  blurb: 'Three hundred years of fright. Zero screams left. The impresario of the Night Fair discovers the one scare the living never tire of.',
  acts: [
    {
      act: 'ACT I — THE NEW ACT',
      story: 'Three hundred seasons of BOO and the graveyard is bored. The lurch is dead, the wail is retired, the ooze tested poorly. Tonight the impresario retools the Fright Show around the county\'s freshest art form: the slap.',
      challenges: [
        { id: 'n1c1', title: 'THE NIGHT GREETER', desc: "A clean slap on JACK O'LANTERN JOE — the greeter volunteers as Act One. Aim for the face, it's the big orange one", opp: 'joe', goal: { type: 'head' } },
        { id: 'n1c2', title: 'THE LIVING GUEST STAR', desc: 'Send GRANDPA CLETUS 25m — he fell asleep in the outhouse at closing. Again. The night crowd adores him.', opp: 'cletus', goal: { type: 'dist', v: 25 } },
        { id: 'n1c3', title: 'TOP OF THE POSTER', desc: "Send JACK O'LANTERN JOE 30m into the pumpkin patch — don't worry, he grows back", opp: 'joe', goal: { type: 'dist', v: 30 } },
      ],
    },
    {
      act: 'ACT II — THE BONE ZONE',
      story: 'The new act drew the whole graveyard. Now the regulars want IN — starting with a skeleton who has waited forty years to be aerodynamic.',
      challenges: [
        { id: 'n2c1', title: 'THE AERODYNAMICIST', desc: 'Send BONY TONY 60m — no lungs, no drag, no fear', opp: 'tony', goal: { type: 'dist', v: 60 } },
        { id: 'n2c2', title: 'GRAVEYARD RAVE', desc: "Score 450 off RAVIN' RAY — the skeletons are already glowsticks", opp: 'ravinray', goal: { type: 'pts', v: 450 } },
        { id: 'n2c3', title: 'THE FLIGHT OF BONY TONY', desc: 'Send BONY TONY 75m — the record wall says CLETUS, 1961. Tonight it says TONY.', opp: 'tony', goal: { type: 'dist', v: 75 } },
      ],
    },
    {
      act: 'ACT III — MOWING TIME',
      story: 'The show got loud enough to stop the mower. When the mower stops, the groundskeeper is listening — and everything on his lawn gets mowed at dawn.',
      challenges: [
        { id: 'n3c1', title: 'DUET WITH A HAUNTED ORGAN', desc: 'An 88% chain before MAESTRO FORTISSIMO — the organ must NEVER win', opp: 'maestro', goal: { type: 'chain', v: 88 } },
        { id: 'n3c2', title: 'OVER THE MOWER', desc: "Send JACK O'LANTERN JOE 65m — and whatever you do, don't land him on the lawn", opp: 'joe', goal: { type: 'dist', v: 65 } },
        { id: 'n3c3', title: '☗ BOSS: MOWING TIME', desc: 'Score 500 off THE GREEN REAPER — 7 seconds a swing, and sloppy form gets re-mowed', opp: 'reaper', goal: { type: 'pts', v: 500 } },
      ],
    },
  ],
},
```

## 1c. Reworked cutscenes (replace the `nightofslaps` block in `CUTSCENES`)

```js
// ===== THE NIGHT OF SLAPS (Mr. Slappington, the melancholy impresario) =====
nightofslaps_prologue: [
  { who: 'YOU', text: 'Three hundred years I ran the Fright Show. I invented the lurch. I perfected the wail. I retired the ooze at its peak. And tonight — silence. The dead have seen every scare I own.', shot: 'player' },
  { who: "🎃 JACK O'LANTERN JOE", text: "Boss, the skeletons aren't scared of anything. They're BONES. But you shoulda seen 'em last week — some farmer slapped a man clean over the hay wall, and the graveyard talked about nothing else for six nights.", shot: 'wide' },
  { who: 'YOU', text: 'Slapped... over a wall. No fog. No organ. Just a palm, a cheek, and honest physics. Joe — I felt my heart move. I do not HAVE a heart. THAT is showmanship.', shot: 'player' },
  { who: "🎃 JACK O'LANTERN JOE", text: 'Night Fair opens at midnight, boss. One show. If it lands, we headline it forever.', shot: 'wide' },
  { who: 'YOU', text: 'Then tonight the Fright Show dies, and the SLAP show is born. Places, everyone. The living tire of every scare but one.', shot: 'player' },
],
n1c1: [
  { who: 'YOU', text: 'Joe. My oldest colleague. Three hundred seasons of BOO, and I open the new era with... a slap. Tell me honestly. Is it beneath us?', shot: 'player' },
  { who: "🎃 JACK O'LANTERN JOE", text: "Boss, this face has taken frost, crows, and a mower. A slap from YOU would be the nicest thing to ever happen to it. Aim well — it's the big orange one.", shot: 'opp' },
  { who: 'YOU', text: 'Then places. Act One: sincerity. The rarest fright of all.', shot: 'player' },
],
n1c2: [
  { who: 'GRANDPA CLETUS', text: "Fell asleep in the outhouse at closin'. Again. Forty years of it. You runnin' the show now, bone man?", shot: 'opp' },
  { who: 'YOU', text: 'Running it? Sir, I am REINVENTING it. The lurch is dead. The wail is retired. Tonight, we perform PHYSICS — and you, our beloved living guest star, receive top billing.', shot: 'player' },
  { who: 'GRANDPA CLETUS', text: "The skeletons got no eyelids — they physically cannot stop watchin' me. Twenty-five meters, maestro, and mind the suspenders. They're my good pair.", shot: 'opp' },
],
n1c3: [
  { who: "🎃 JACK O'LANTERN JOE", text: 'Billing question, boss. How far can you send your own greeter? Thirty meters puts you top of the poster.', shot: 'opp' },
  { who: 'YOU', text: 'I have spent three centuries ON that poster, Joe. Tonight I want the poster to be TRUE. To the pumpkin patch — where you will, I trust, plant yourself.', shot: 'player' },
  { who: "🎃 JACK O'LANTERN JOE", text: "By Tuesday there's more of me. It's a living. Technically it isn't. Swing.", shot: 'opp' },
],
n2c1: [
  { who: '💀 BONY TONY', text: "Forty years I watched the living get launched over that hay wall, boss, and I kept sayin': one night, ME. No lungs. No drag. No fear.", shot: 'opp' },
  { who: 'YOU', text: 'Tony. In three hundred years of fright, no one ever ASKED to be in the show. Did you hear that sound backstage? Every skeleton in the graveyard, leaning in.', shot: 'player' },
  { who: '💀 BONY TONY', text: "I'm a paper airplane with ambitions. Sixty meters. Make the bones SOAR.", shot: 'opp' },
],
n2c2: [
  { who: "RAVIN' RAY", text: "Oh, I'm not trapped here, man. I BOOKED this. Only venue in the county open during my hours, and the skeletons are ALREADY glowsticks.", shot: 'opp' },
  { who: 'YOU', text: 'A living man. At MY fair. Voluntarily. Joe, note the date — the Fright Show never once sold a ticket to someone who came back twice.', shot: 'player' },
  { who: "RAVIN' RAY", text: 'The crowd goes dead quiet right before the drop, bone man. That quiet is YOUR cue. Four-fifty.', shot: 'opp' },
],
n2c3: [
  { who: '💀 BONY TONY', text: 'Sixty was a warm-up. The record wall says CLETUS, 1961, "unassisted." Tonight we chisel in TONY.', shot: 'opp' },
  { who: 'GRANDPA CLETUS', text: 'Wind-aided! That record was wind-aided and I will fight the wall that says otherwise!', shot: 'wide' },
  { who: 'YOU', text: 'Gentlemen. Three centuries I begged this graveyard for one scream — and tonight the dead are arguing about BILLING. This is the finest show I have ever run. Seventy-five meters, Tony. Fly.', shot: 'player' },
],
n3c1: [
  { who: 'MAESTRO FORTISSIMO', text: 'Your haunted organ plays my Requiem BADLY. Every night. In the wrong key. The finale needs PERCUSSION.', shot: 'opp' },
  { who: 'YOU', text: 'The organ was my finest scare of 1897, Maestro. Time humbles every act — I would know. Eighty-eight percent, in tempo. And when the organ falters, we do not gloat. We CRESCENDO.', shot: 'player' },
  { who: 'MAESTRO FORTISSIMO', text: 'Crescendo, forte, SLAP. The organ must NEVER win.', shot: 'opp' },
],
n3c2: [
  { who: "🎃 JACK O'LANTERN JOE", text: '...boss. The mower stopped. The mower NEVER stops. He is LISTENING to the show.', shot: 'opp' },
  { who: 'YOU', text: 'Four hundred years that man has mowed through plague, drought, and my entire 1743 season. And MY show made him idle. Joe — we are being reviewed. Sixty-five meters, clean over the mower.', shot: 'player' },
  { who: "🎃 JACK O'LANTERN JOE", text: 'And boss — whatever happens — do NOT land me on his lawn.', shot: 'opp' },
],
n3c3: [
  { who: '💀 THE GREEN REAPER', text: "Four hundred years I've kept these grounds. Kings begged pardon at forty paces. Ghosts file around me. Even the skeletons wave from across the lawn — and they have NO sense of self-preservation. They are the least preserved people I know.", shot: 'opp' },
  { who: 'YOU', text: 'I know you, old colleague. We worked the same nights — you mowed, I moaned. And in four centuries, no one touched either of us. Fright, it turns out, is a lonely act.', shot: 'player' },
  { who: '💀 THE GREEN REAPER', text: 'The scythe is for the LAWN — we get that a lot. Rules, impresario: sloppy form gets re-mowed, seven seconds a swing, my shift ends at dawn. And swing like I am ANYBODY. That is an order.', shot: 'opp' },
  { who: 'YOU', text: 'That is precisely my discovery, groundskeeper. The slap is the one scare the living never tire of — because it is the only one that TOUCHES. Tonight, the repertoire extends to the dead.', shot: 'player' },
],
outro_n3c3: [
  { who: '💀 THE GREEN REAPER', text: '...you slapped me. You actually — HA! Four hundred years. Plagues tipped their hats. Lightning apologized in \'09. And the bone showman just walked up and slapped me. On my own lawn.', shot: 'opp' },
  { who: 'YOU', text: 'Say it with me, colleague. You have earned the line.', shot: 'player' },
  { who: '💀 THE GREEN REAPER', text: 'EVEN THE DEAD CAN BE SLAPPED. The living get weather, taxes, and slaps — and I still qualify for one of the three. I have never felt so INCLUDED.', shot: 'opp' },
  { who: 'YOU', text: 'Three hundred years I hunted a new scare, Joe, and it was never a scare at all. It was a touch. The one the living never tire of — and the dead, it turns out, were only ever waiting their turn.', shot: 'player' },
  { who: "🎃 JACK O'LANTERN JOE", text: "Dawn's up, boss! Poster's printed — we used your good side. The skull. You're the headliner. Forever, probably.", shot: 'wide' },
  { who: 'YOU', text: 'Forever is the only run I know. Same time tomorrow night, everyone. Places.', shot: 'player' },
],
```

## 1d. Refreshed FAILS.n / WINS.n (his voice)

```js
n: [
  [{ who: "🎃 JACK O'LANTERN JOE", text: "Oof. The skeletons are laughing, boss. They laugh at everything, but STILL.", shot: 'wide' },
   { who: 'YOU', text: "A flop. Magnificent. I haven't felt this alive since I died. Again — from the top.", shot: 'player' }],
  [{ who: '💀 THE GREEN REAPER', text: "I've seen the mower do better, and the mower does not have hands.", shot: 'wide' },
   { who: 'YOU', text: 'Note for the playbill: the impresario is humbled, not finished. Once more before mowing time.', shot: 'player' }],
],
```

```js
n: [
  [{ who: "🎃 JACK O'LANTERN JOE", text: 'The skeletons are on their FEET! Which is the entire ovation — bones slip on the clap part.', shot: 'wide' },
   { who: 'YOU', text: 'Hold for applause. Hold... hold. Three hundred years, Joe. I finally hear it.', shot: 'player' }],
  [{ who: "🎃 JACK O'LANTERN JOE", text: 'HEADLINER MATERIAL! The banshee wants to know if you do private events. Her venue is a well.', shot: 'wide' },
   { who: 'YOU', text: 'Tell her the show is nightly, the venue is the night itself, and the impresario is HOME.', shot: 'player' }],
],
```

## 1e. Zombie fair direction notes (scene.js work, prose)

- **Announcer + fan lady**: swap their crowd materials to sickly zombie greens (skin ~`0x9ab07a`/`0xa8bc8a` — the usher palette below) with tattered gray-violet clothes; announcer booth gets cobweb sheets and a flickering lantern. Same figures, same spots — "the night shift of the same fair."
- **Thriller-parody figure — SMOOTH CADAVER** (better than "Michael Thriller": it parodies the *song title*, not the man's name): background performer near the crowd, red jacket `0xc0202a` with black trim (`suit` + new `oneGlove: 0xf4f0ea` tinting one hand), `skullFace` makeup, occasionally leads 3–4 crowd zombies in an eight-count synchronized shuffle. Non-slappable set dressing, no voice lines — the parody stays on the music-video iconography (jacket, glove, dance), never on the person. See sensitivity sweep in §2c.
- **Bats**: instanced like the birds — figure-eight loops over the flight lane at y≈6–9; a flyer passing through scatters them (`scareBirds` idiom) with a leathery flutter + `sfx.squawk` pitched down.
- **High-contrast lighting**: hard moonlight key (steel-blue `0xaebcd8`) with deep shadows, orange lantern rim light near structures, purple-teal grade on the hills. Register every new prop with the frost/biome system per the CLAUDE.md guardrail.

## 1f. Zombie-usher volunteer pair (`ROSTER`, world:'haunted')

```js
{
  key: 'zeb', name: 'USHER ZEB', tag: 'NIGHT STAFF', world: 'haunted',
  w: 0.9, h: 1.02, mass: 0.8, noStache: true,
  skin: 0x9ab07a, shirt: 0x6e2231, pants: 0x2a2a33, suit: true, tie: 0xd8b13c,
  pillbox: 0x6e2231,   // NEW look flag: usher's pillbox hat, chin strap
  pickLine: 'Died mid-shift in 1962. Never clocked out. Will still seat you.',
  taunts: ['Sir. This is a NO-WHIFF section.', 'Your seat is in row F. F for FLYING.'],
},
{
  key: 'myrtle', name: 'USHERETTE MYRTLE', tag: 'NIGHT STAFF', world: 'haunted',
  w: 0.85, h: 1.0, mass: 0.75, female: true, noStache: true,
  skin: 0xa8bc8a, shirt: 0x6e2231, pants: 0x2a2a33, skirt: 0x571c26,
  hair: 'bun', hairCol: 0xd8d2c6, trayProp: 0xe8dcc0,   // NEW look flag: popcorn tray on a neck strap (rides the torso like the cello)
  pickLine: 'Popcorn, candy, complimentary screaming. Works on tips and tradition.',
  taunts: ["Popcorn's a dollar, the slap is free. ONE of those is a bargain.", 'Aim past the tray, dear. The tray stays.'],
},
```

**Rationale.** The pair completes the "night crew as coworkers" comedy: they're not monsters, they're *staff*. `trayProp` reuses the Maestro-cello rides-the-torso idiom.

---

# 2. DESERT WORLD + OIL CAMPAIGN — "THE DRY COUNTY GUSHER"

## 2a. Desert volunteers + bosses (`ROSTER`)

Proposed new look flags: `turban: <color>` (a wrapped **sun-wrap** — county work-wear against the sun, deliberately never paired with religious signifiers), `shawl: <color>` (sun-shawl over shoulders/head), reusing existing `robe: true`. Both flags are climate gear worn across genders.

```js
{
  key: 'wiley', name: 'WELLDIGGER WILEY', tag: 'DEEP OPTIMIST', world: 'desert',
  w: 0.95, h: 1.0, mass: 0.95,
  skin: 0xc98a58, shirt: 0xdfd4b2, pants: 0x8a6a48,
  turban: 0xe8dcc0,   // NEW: wrapped sun-wrap, work-wear against the Dry County sun
  pickLine: "Forty years of dry wells. Struck something black under the pie stand on Tuesday.",
  taunts: ['I dig all day. You dug ONE hole and stood in it.', "That swing needed another forty feet o' depth."],
},
{
  key: 'pike', name: 'PROSPECTOR PIKE', tag: 'MAP SALESMAN', world: 'desert',
  w: 0.8, h: 0.98, mass: 0.7,
  skin: 0xe0a878, shirt: 0x8a4a2e, pants: 0x5a4632, hat: 'cowboy', bigHat: true,
  pickLine: 'Sells maps to the strike. Every map leads to his hat.',
  taunts: ['Two dollars says you miss.', "I've panned rivers with better follow-through."],
},
{
  key: 'marge', name: 'MIRAGE MARGE', tag: 'FUTURES & DINER', world: 'desert',
  w: 0.9, h: 1.0, mass: 0.85, female: true,
  skin: 0xdba26e, shirt: 0xc2683a, pants: 0x6e5a3a, skirt: 0x9a5a30,
  shawl: 0xf0e2c0, hair: 'bun', hairCol: 0x3a2a1a,   // NEW: sun-shawl over shoulders + head
  pickLine: 'Sold the pond twice. There is no pond. Ask about the specials.',
  taunts: ['That slap was a mirage, hon.', 'I can sell ANYTHING. Except that swing.'],
},
{
  key: 'sybil', name: 'CISTERN SYBIL', tag: 'HEAVYWEIGHT NOTARY', world: 'desert',
  w: 1.38, h: 1.0, mass: 1.85, female: true,
  skin: 0xb87848, shirt: 0x7a5a8a, pants: 0x5a4a6a, skirt: 0x5a4a6a,
  shawl: 0xe8d8b8, robe: true, hair: 'bun', hairCol: 0x1f1a14,
  pickLine: 'Hauls the county water. Notarizes the county truth. Budges for neither.',
  taunts: ['Nothing spills on MY watch. Including you.', "I carry two full cisterns. You couldn't carry that swing."],
},
// -- Dry County bosses (campaign-only) --
{
  key: 'rita', name: 'RUBBER-STAMP RITA', tag: 'BOSS · FORM 88-C', boss: true,
  w: 0.9, h: 0.98, mass: 1.0, female: true, shotClock: 5, glasses: true,
  skin: 0xe2b688, shirt: 0x8a8f98, pants: 0x5a5f6a, skirt: 0x5a5f6a,
  shawl: 0xc9b98a, hair: 'bun', hairCol: 0xb8b0a0,
  stampProp: true,   // NEW look flag: the never-used stamp, held like a gavel
  pickLine: 'One stamp. Forty years. Never used. Impress her in five seconds a swing.',
  taunts: ['Your form is missing a form.', 'The window is closed. The window was ALWAYS closed.', 'NEXT. There is no next. NEXT.'],
},
{
  key: 'gusher', name: 'THE GUSHER', tag: 'BOSS · SWEET CRUDE', boss: true,
  w: 1.6, h: 1.18, mass: 2.4, noStache: true, grease: true, brow: true,
  // mid-tone strongman UNDER a visibly separate slick: use Greased Pete's sheen-streak
  // idiom, cranked — glossy dark streaks over the skin, never a darkened skin tone
  skin: 0xd6a878, shirt: 0xd6a878, pants: 0x2a2a33, beltCol: 0x7a1f24,
  slickCoat: 0x241812,   // NEW look flag: heavy glossy streak overlay (molasses, not paint, not skin)
  pickLine: 'Climbed out of the well slicked head to heel. Only a PERFECT palm grips.',
  taunts: ['The slick is POWER.', 'You cannot grip the GUSHER.', 'It is DEFINITELY oil. Stop smelling it.'],
},
```

## 2b. Tour + cutscenes + FAILS.d + WINS.d

```js
{
  key: 'oilfever', title: '🛢️ THE DRY COUNTY GUSHER',
  dlc: true, world: 'desert',
  blurb: "Something black burbled up under the pie stand, and Dry County has not been the same since Tuesday. Forty years without rain — and now THIS.",
  acts: [
    {
      act: 'ACT I — THE STRIKE',
      story: "The pie stand's tent peg came up black and shiny. By noon there were seventeen speculators, four hats bigger than tents, and one man selling maps to the thing everyone was already standing on.",
      challenges: [
        { id: 'd1c1', title: 'THE FIRST WITNESS', desc: 'A clean head slap on WELLDIGGER WILEY — he struck it, and in Dry County the witness check is a slap', opp: 'wiley', goal: { type: 'head' } },
        { id: 'd1c2', title: 'CLAIM JUMPER', desc: 'Send SLIM PETE 25m — he staked a claim on the LEMONADE stand', opp: 'slim', goal: { type: 'dist', v: 25 } },
        { id: 'd1c3', title: 'THE MAP SALESMAN', desc: 'Send PROSPECTOR PIKE 35m — every map he sells leads to his own hat', opp: 'pike', goal: { type: 'dist', v: 35 } },
      ],
    },
    {
      act: 'ACT II — THE PERMIT TENT',
      story: 'Nobody drills, digs, or dreams without form 88-C. The permit office is a tent, the line is four days long, and the clerk owns a stamp she has never once used.',
      challenges: [
        { id: 'd2c1', title: 'EXPEDITED PROCESSING', desc: 'Score 450 off BIG HOSS — he IS the line; move him and the line moves', opp: 'hoss', goal: { type: 'pts', v: 450 } },
        { id: 'd2c2', title: 'NOTARIZED', desc: 'An 80% chain before CISTERN SYBIL — form 88-C requires a witnessed demonstration of intent', opp: 'sybil', goal: { type: 'chain', v: 80 } },
        { id: 'd2c3', title: '☗ BOSS: FORM 88-C', desc: 'Score 400 off RUBBER-STAMP RITA — five seconds a swing; the office closes CONSTANTLY', opp: 'rita', goal: { type: 'pts', v: 400 } },
      ],
    },
    {
      act: 'ACT III — THE GUSHER',
      story: 'The well blew at dawn, and out of it climbed a strongman slicked head to heel who has decided the fairground is his derrick now. One detail bothers Wiley: whatever the man is covered in... smells like a bake sale.',
      challenges: [
        { id: 'd3c1', title: 'SPECULATION BUBBLE', desc: 'Send MIRAGE MARGE 45m — she sold futures on YOUR slap. Prepaid. Deliver them.', opp: 'marge', goal: { type: 'dist', v: 45 } },
        { id: 'd3c2', title: 'DIVIDEND DAY', desc: "Score 500 off CISTERN SYBIL — every family's share of the strike rides in her buckets", opp: 'sybil', goal: { type: 'pts', v: 500 } },
        { id: 'd3c3', title: '☗ FINAL BOSS: THE GUSHER', desc: 'Slap THE GUSHER 30m — only a PERFECT palm grips the slick', opp: 'gusher', goal: { type: 'dist', v: 30 } },
      ],
    },
  ],
},
```

```js
// ===== THE DRY COUNTY GUSHER =====
oilfever_prologue: [
  { who: 'WELLDIGGER WILEY', text: "Forty years I dug wells in Dry County and hit nothing but opinions. This morning the pie stand's tent peg came up BLACK.", shot: 'wide' },
  { who: 'YOU', text: 'Black like...?', shot: 'player' },
  { who: 'WELLDIGGER WILEY', text: 'Shiny black, friend. By noon there were seventeen speculators, four hats bigger than my tent, and a line at a permit office that did not exist at breakfast.', shot: 'wide' },
  { who: 'PROSPECTOR PIKE', text: 'MAPS! Maps to the strike! Genuine! Hand-drawn! Going FAST!', shot: 'wide' },
  { who: 'YOU', text: "We're standing ON the strike.", shot: 'player' },
  { who: 'PROSPECTOR PIKE', text: "And ain't you glad you know it! That knowledge was FREE, friend. The map is two dollars.", shot: 'wide' },
],
d1c1: [
  { who: 'WELLDIGGER WILEY', text: "Before Dry County believes anything, it checks the witness. Out here the check is a slap. Clean, on the cheek. If I'm lyin', I'll wobble.", shot: 'opp' },
  { who: 'YOU', text: "That's the whole legal system?", shot: 'player' },
  { who: 'WELLDIGGER WILEY', text: "Rain court's been adjourned forty years. Slap court works fine.", shot: 'opp' },
],
d1c2: [
  { who: 'SLIM PETE', text: "I staked a claim! On the lemonade stand! It's the only liquid in the county — that's PRACTICALLY oil!", shot: 'opp' },
  { who: 'YOU', text: "Pete, you can't claim a lemonade stand.", shot: 'player' },
  { who: 'SLIM PETE', text: 'Then relocate my claim, friend. Twenty-five meters. The market will decide.', shot: 'opp' },
],
d1c3: [
  { who: 'PROSPECTOR PIKE', text: 'Every map I sell leads somewhere REAL. Mostly to my hat. The hat has a false bottom. The bottom has a smaller hat—', shot: 'opp' },
  { who: 'YOU', text: 'How far to the honest part of this conversation?', shot: 'player' },
  { who: 'PROSPECTOR PIKE', text: 'Thirty-five meters, by my own map. Care to check my work?', shot: 'opp' },
],
d2c1: [
  { who: 'BIG HOSS', text: "They opened a permit office. It's a tent. The line's four days long, and sugar — I AM the line.", shot: 'opp' },
  { who: 'YOU', text: "You're first?", shot: 'player' },
  { who: 'BIG HOSS', text: "First, second, and most of third. Move me, and the whole line moves.", shot: 'opp' },
],
d2c2: [
  { who: 'CISTERN SYBIL', text: 'I haul water and I notarize. Same job: nothing spills, nothing fudged. Form 88-C wants a witnessed demonstration of intent — eighty percent, every link legible.', shot: 'opp' },
  { who: 'YOU', text: 'And if it spills?', shot: 'player' },
  { who: 'CISTERN SYBIL', text: 'Then you get back in the line. And the line has HOSS in it.', shot: 'opp' },
],
d2c3: [
  { who: 'RUBBER-STAMP RITA', text: 'Welcome to the Permit Office. Office hours: yes and no. Your form is missing a form. The missing form requires a permit.', shot: 'opp' },
  { who: 'YOU', text: 'I want to look at what is under my own fairground, Rita.', shot: 'player' },
  { who: 'RUBBER-STAMP RITA', text: "Everyone does, hon. Stamp's right here. Forty years, never used it — nothing's ever been worth the ink. Impress me. Five seconds a swing. The office closes CONSTANTLY.", shot: 'opp' },
],
d3c1: [
  { who: 'MIRAGE MARGE', text: 'While you stood in line, I sold futures. On your slap. Forty-five meters, prepaid. Also I sold the pond. There is no pond. That is called a mirage-backed security.', shot: 'opp' },
  { who: 'YOU', text: 'Is ANY of this legal?', shot: 'player' },
  { who: 'MIRAGE MARGE', text: 'Hon, legal is whatever Rita stamps, and Rita likes you now. Deliver my futures.', shot: 'opp' },
],
d3c2: [
  { who: 'CISTERN SYBIL', text: 'Every family in Dry County bought one share of the strike. I carry the certificates in the left bucket and the doubts in the right.', shot: 'opp' },
  { who: 'YOU', text: 'Which is heavier?', shot: 'player' },
  { who: 'CISTERN SYBIL', text: 'Five hundred points, and we find out.', shot: 'opp' },
],
d3c3: [
  { who: 'THE GUSHER', text: 'The well spoke, and it said MINE. I went down a strongman and came up a DERRICK. Slicked head to heel — no palm grips me, no county claims me!', shot: 'opp' },
  { who: 'YOU', text: 'What IS that you are covered in? It smells like a bake sale.', shot: 'player' },
  { who: 'THE GUSHER', text: 'IRRELEVANT. The slick is power. The slick is wealth. The slick is... fine, it is a little sweet. THE SLICK IS SWEET WEALTH.', shot: 'opp' },
  { who: 'WELLDIGGER WILEY', text: "...friend, that ain't crude. That's the county molasses reserve. Buried in '37, for a rainy day.", shot: 'wide' },
  { who: 'THE GUSHER', text: 'There has BEEN no rainy day!', shot: 'opp' },
  { who: 'YOU', text: "Then it's due. Thirty meters — a perfect palm grips even molasses.", shot: 'player' },
],
outro_d3c3: [
  { who: 'THE GUSHER', text: '...I have been slapped. THROUGH the slick. Nothing has ever touched me through the slick. I built my entire personality on that.', shot: 'opp' },
  { who: 'RUBBER-STAMP RITA', text: 'For the record: mineral rights do not apply. It is FOOD. Jurisdiction: the pie stand. Always was.', shot: 'wide' },
  { who: 'RUBBER-STAMP RITA', text: 'Forty years I saved this stamp. APPROVED — one (1) county taffy pull. ...Oh, that IS satisfying. No wonder everyone wants one.', shot: 'wide' },
  { who: 'MIRAGE MARGE', text: "Market update, hon: oil is out, taffy is UP. Everybody's rich in the only currency Dry County ever respected — dessert.", shot: 'wide' },
  { who: 'WELLDIGGER WILEY', text: "Forty years dry, and the strike of the century is molasses. Best thing I ever dug. First pull's on the well.", shot: 'wide' },
],
```

```js
// FAILS
d: [
  [{ who: 'PROSPECTOR PIKE', text: 'Missed! I got a map for that too — "Routes Your Palm Meant To Take." Two dollars.', shot: 'wide' },
   { who: 'YOU', text: 'Keep the map. I know the way. Again.', shot: 'player' }],
  [{ who: 'RUBBER-STAMP RITA', text: 'That attempt has been filed under NO. The file is a bucket. Refile at your convenience — the window never closes. Or opens.', shot: 'wide' },
   { who: 'YOU', text: 'Then stamp THIS one. Again.', shot: 'player' }],
],
// WINS
d: [
  [{ who: 'WELLDIGGER WILEY', text: "Now THAT hit somethin'. Forty years diggin', and the richest strike in Dry County is your palm.", shot: 'wide' },
   { who: 'YOU', text: 'Keep digging, Wiley. The county runs on hope and pie.', shot: 'player' }],
  [{ who: 'MIRAGE MARGE', text: 'Sold the replay rights already, hon. Twice. To the same man. He knows.', shot: 'wide' },
   { who: 'YOU', text: 'Charge him double the third time. He will thank you.', shot: 'player' }],
],
```

**Rationale.** The arc punches exclusively at oil fever, speculation, and bureaucracy — the three cutscene villains are a *market*, a *tent*, and a *stamp*. The molasses reveal converts the "resource" into community dessert, which is the warmest possible landing for a resource-rush story (principle #11 and the Tremendous Don naming precedent — RITA is Pennywhistle's spiritual sister, THE GUSHER is Boulder Bob's carnival-strongman idiom).

## 2c. GEOPOLITICS PASS (self-audit of everything above, plus a sweep of the other deliverables)

Things that could read as ethnic caricature, and the fixes (already applied in the text above):

1. **Turban.** Risk: reads as religious/ethnic dress. Fix applied: exactly one character wears it (Wiley), it's framed as a *sun-wrap* (functional work-wear, like the existing straw hat), fair-cloth colored, never combined with robes/beards/accent writing/religious language, and worn by the county's most salt-of-the-earth archetype. Recommend the pickable card tag never says "turban" — copy says sun-wrap.
2. **Names.** Risk: real-language personal names code the cast to a real region (an early draft name like "Salma" would have). Fix applied: all Dry County names are occupational county-fair names (Welldigger, Prospector, Mirage, Cistern, Rubber-Stamp) — the same idiom as Hayseed Hank.
3. **THE GUSHER's slick.** Risk: a "dark-slicked strongman" could misread as darkened skin. Fix applied: mid-tone skin (`0xd6a878`, same family as Chuck North) with a separate glossy `slickCoat` streak overlay per the Greased Pete sheen precedent — the coating must visibly sit ON him, and the script names it molasses. Implementation note for the orchestrator: never tint the skin material itself.
4. **Setting.** Risk: any oil-under-the-sand story drifting toward petro-state parody. Fix applied: the strike is under *the county's own pie stand*, the speculators are 1849-gold-rush Americana archetypes, no nations, sheikhs, camel-riding cast, daggers, veils, or accents exist anywhere in the copy. Camels in the desert *scenery* (per DESIGN-LESSONS backlog) are fine as wildlife — keep them background fauna like the reindeer, never mounts for characters.
5. **Dialect.** Wiley's "somethin'/diggin'" is the same county twang Hank and Mabel already speak — consistent voice, not an ethnic marker. Keep it identical to the farm register.
6. **Sweep of other deliverables**: §1 SMOOTH CADAVER parodies a music video's *iconography* (red jacket, one glove, shuffle), carries no voice lines, no name resemblance, no biography or appearance jokes about the real man — keep him non-slappable set dressing. §4: kids are a chorus and must **never** be volunteers or slappable (see curation table). §6: see the flag on the "United States of America" line in section 6.

---

# 3. GYM BRO CAMPAIGN — "THE PUMP HOUSE"

## 3a. Volunteers + boss (`ROSTER`, world:'gym')

New look flags proposed: `stringer: true` (stringer tank), `jugProp: <color>` (gallon jug, never set down), `slimLegs: true` (comically thin legs), `chalkHands: true` (chalked palms + chalk puff on contact). New **mechanic** flag: `brace`.

```js
{
  key: 'greg', name: 'GALLON GREG', tag: 'PRE-WORKOUT', world: 'gym',
  w: 1.1, h: 1.04, mass: 1.2, noStache: true,
  skin: 0xdca878, shirt: 0x2fd4c4, pants: 0x2a2a33, stringer: true,
  hair: 'buzz', hairCol: 0x2a1f14, jugProp: 0x3a86ff,
  pickLine: 'Drinks a gallon an hour. The jug has a name. The name is Greg Two.',
  taunts: ['Hydrate or dominate, bro. You did neither.', 'That swing skipped breakfast.'],
},
{
  key: 'mirrormax', name: 'MIRROR MAX', tag: 'AESTHETIC', world: 'gym',
  w: 1.05, h: 1.02, mass: 1.0, noStache: true,
  headTurn: { period: 2.8, arc: 0.9 },   // reuses Horton's gimmick: forever finding his angle
  skin: 0xe8b888, shirt: 0xff3d88, pants: 0x17171d, stringer: true,
  hair: 'flat', hairCol: 0x14100c, shades: true,
  pickLine: 'Not looking at you. Looking PAST you, at himself, in the barn window.',
  taunts: ['Get my left. No — my OTHER left.', 'This cheek has never had a bad angle. Prove me wrong.'],
},
{
  key: 'titus', name: 'TOOTHPICK TITUS', tag: 'NEVER-LEG-DAY', world: 'gym',
  w: 1.25, h: 1.02, mass: 0.75, noStache: true, bigArms: 1.6, slimLegs: true,
  skin: 0xd9a066, shirt: 0xf0c030, pants: 0x2f6fe0, stringer: true,
  hair: 'frizz', hairCol: 0x6e4a2c,
  pickLine: 'Upper body of an ox. Legs of a birthday candle. Flies like a kite in a tailwind.',
  taunts: ["Leg day's on the calendar. The calendar's lost.", 'These arms have a fan account.'],
},
{
  key: 'onereprex', name: 'ONE-REP REX', tag: 'BOSS · MAX-OUT DAY', boss: true,
  w: 1.7, h: 1.15, mass: 2.8, noStache: true, brawn: true, brow: true,
  // NEW mechanic — brace: belted powerlifter stance. Below gate% chain the slap is
  // no-sold ("DIDN'T COUNT" via ui.slapBurst, power ×weak); at/above gate the brace
  // releases stored elastic and he flies ×launch — the biggest single boss flight in the game.
  brace: { gate: 80, weak: 0.08, launch: 1.45 },
  skin: 0xc98a58, shirt: 0x8a1f2e, pants: 0x2a2a33, beltCol: 0xd8b13c, chalkHands: true,
  pickLine: 'Respects exactly one thing: FORM. Below 80% he will not even exhale.',
  taunts: ["DIDN'T COUNT.", 'Brace. Breathe. Denied.', 'Where was the hip drive, bro?'],
},
```

**Rationale.** `brace` is chainGate with a *payoff* instead of just a wall (principle #3): failure is a comedy beat, success is the hugest flight a boss allows — the gimmick IS the reward. Titus is a physics joke the engine already tells for free (big `w`, low `mass` = top-heavy kite). Gym-bro comedy stays warm: these bros are *aggressively supportive* — nobody is mocked for trying.

## 3b. Tour

```js
{
  key: 'pumphouse', title: '💪 THE PUMP HOUSE',
  dlc: true, world: 'gym',   // proposed world: tin-roof lean-to behind the grandstand, tractor-part dumbbells, chalk everywhere
  blurb: 'The fair built a gym behind the grandstand. The gym built a brotherhood. The brotherhood has one question: do you even coil, bro?',
  acts: [
    {
      act: 'DAY I — ORIENTATION',
      story: 'The Pump House does not sell day passes. It awards them — to anyone who can demonstrate one honest rep of the county\'s oldest lift: the slap.',
      challenges: [
        { id: 'g1c1', title: 'THE FORM CHECK', desc: 'A clean head slap on GALLON GREG — one honest rep, and pride is pre-workout', opp: 'greg', goal: { type: 'head' } },
        { id: 'g1c2', title: 'THE FREE TRIAL', desc: 'Send HAYSEED HANK 25m — he came for the free trial and stayed for the culture', opp: 'hank', goal: { type: 'dist', v: 25 } },
        { id: 'g1c3', title: 'PROGRESSIVE OVERLOAD', desc: 'Score 400 off BIG HOSS — the sign leaning on him says HOSS: 1 REP MAX', opp: 'hoss', goal: { type: 'pts', v: 400 } },
      ],
    },
    {
      act: 'DAY II — THE SPLIT',
      story: 'Chest day, back day, cheek day. The regulars want personal bests, the mirror wants angles, and somebody skipped leg day so hard the wind filed a claim.',
      challenges: [
        { id: 'g2c1', title: 'GOLDEN HOUR', desc: 'A flush cheek strike on MIRROR MAX at 25m — catch the face between angles', opp: 'mirrormax', goal: { type: 'headdist', v: 25 } },
        { id: 'g2c2', title: 'TAILWIND', desc: 'Send TOOTHPICK TITUS 55m — all mast, no keel', opp: 'titus', goal: { type: 'dist', v: 55 } },
        { id: 'g2c3', title: "SPOTTER'S HONOR", desc: 'An 85% chain before GALLON GREG — he only counts CLEAN reps', opp: 'greg', goal: { type: 'chain', v: 85 } },
      ],
    },
    {
      act: 'DAY III — MAX-OUT DAY',
      story: 'Once a season the Pump House chalks the platform for ONE-REP REX. Four county records live in his belt. He judges one rep per person, per lifetime — and below eighty percent form, the rep does not exist.',
      challenges: [
        { id: 'g3c1', title: 'THE OPENER', desc: 'Send HAYSEED HANK 45m — never max cold', opp: 'hank', goal: { type: 'dist', v: 45 } },
        { id: 'g3c2', title: '☗ FINAL BOSS: ONE-REP REX', desc: 'Slap ONE-REP REX 32m — below 80% chain he no-sells; at 80+, the brace lets go and he FLIES', opp: 'onereprex', goal: { type: 'dist', v: 32 } },
      ],
    },
  ],
},
```

## 3c. Cutscenes + FAILS.g + WINS.g

```js
// ===== THE PUMP HOUSE =====
pumphouse_prologue: [
  { who: 'GALLON GREG', text: 'Whoa whoa whoa. You walked PAST the Pump House? Bro. BRO. Come in. We have chalk. We have a bench made of tractor parts. We have a QUESTION.', shot: 'wide' },
  { who: 'YOU', text: 'What question?', shot: 'player' },
  { who: 'GALLON GREG', text: 'Do you even coil, bro?', shot: 'wide' },
  { who: 'YOU', text: "I... yes. It's most of what I do.", shot: 'player' },
  { who: 'GALLON GREG', text: 'HE COILS. MAX! TITUS! HE SAYS HE COILS! Get the day pass! Get the GOOD clipboard!', shot: 'wide' },
],
g1c1: [
  { who: 'GALLON GREG', text: "Form check, bro. One honest rep. Cheek's right here. And listen — whatever happens? We're proud of you. That's Pump House policy.", shot: 'opp' },
  { who: 'YOU', text: "You're proud of me BEFORE the slap?", shot: 'player' },
  { who: 'GALLON GREG', text: 'Pride is pre-workout, bro.', shot: 'opp' },
],
g1c2: [
  { who: 'HAYSEED HANK', text: "Came for the free trial. Stayed because they cheer when I drink water. NOBODY has ever cheered when I drink water.", shot: 'opp' },
  { who: 'YOU', text: "They're going to cheer a lot harder in about twenty-five meters, Hank.", shot: 'player' },
  { who: 'HAYSEED HANK', text: "Fifth legend this year. Ma's stopped askin'.", shot: 'opp' },
],
g1c3: [
  { who: 'BIG HOSS', text: "They wrote HOSS: ONE REP MAX on a sign and leaned it on me. I've been the equipment since June.", shot: 'opp' },
  { who: 'GALLON GREG', text: "He's rack, bench, AND cardio. Cardio is walkin' around him. Four hundred points, bro — progressive overload.", shot: 'wide' },
],
g2c1: [
  { who: 'MIRROR MAX', text: 'One sec. One SEC. The light hits the barn window at 6:40 and my left side becomes... unbearable. Okay. OKAY. Go. No wait. NOW go.', shot: 'opp' },
  { who: 'YOU', text: 'Your face keeps moving.', shot: 'player' },
  { who: 'MIRROR MAX', text: "It's called FINDING YOUR ANGLE. Catch the angle, catch the cheek — flush, at twenty-five. Make my right side famous too.", shot: 'opp' },
],
g2c2: [
  { who: 'TOOTHPICK TITUS', text: 'Before you swing: the arms are insured, the calves are a rumor, and if I catch air, I RIDE it. It is the one perk.', shot: 'opp' },
  { who: 'GALLON GREG', text: "We don't shame legs at the Pump House. The legs are on their own journey.", shot: 'wide' },
  { who: 'YOU', text: 'The journey appears to be fifty-five meters.', shot: 'player' },
],
g2c3: [
  { who: 'GALLON GREG', text: "Spotter's honor, bro: I only count CLEAN reps. Eighty-five percent. Full coil, full lockout, no bounce at the bottom.", shot: 'opp' },
  { who: 'YOU', text: "And if it's eighty-four?", shot: 'player' },
  { who: 'GALLON GREG', text: "Then it didn't count, and we hug, and you go again. That's the system. The system WORKS.", shot: 'opp' },
],
g3c1: [
  { who: 'GALLON GREG', text: "Max-out day, bro. Rule one: never max cold. Hank's your opener.", shot: 'wide' },
  { who: 'HAYSEED HANK', text: "I'm the WARM-UP now? I used to be the whole legend.", shot: 'opp' },
  { who: 'YOU', text: "You're the foundation, Hank. Forty-five meters of it.", shot: 'player' },
],
g3c2: [
  { who: 'ONE-REP REX', text: 'I have pulled tractors. I have braced against WEATHER. Four county records live in this belt. You get what everyone gets: one rep, judged.', shot: 'opp' },
  { who: 'YOU', text: 'And below eighty percent?', shot: 'player' },
  { who: 'ONE-REP REX', text: "DIDN'T COUNT.", shot: 'opp' },
  { who: 'GALLON GREG', text: 'He means it, bro. A tornado came through last summer at sixty percent form and he logged it as a warm-up.', shot: 'wide' },
  { who: 'ONE-REP REX', text: 'But land the real thing — full chain, full intent — and I give you what nobody has earned since the belt: FLIGHT. A max is a gift, rookie. Unwrap it properly.', shot: 'opp' },
],
outro_g3c2: [
  { who: 'ONE-REP REX', text: 'COUNTED. ...It counted. Rack everything, brothers. The rookie maxed out.', shot: 'opp' },
  { who: 'GALLON GREG', text: "I'M NOT CRYING. THE PRE-WORKOUT IS LEAKING.", shot: 'wide' },
  { who: 'MIRROR MAX', text: 'Even my left side is happy for you. That NEVER happens.', shot: 'wide' },
  { who: 'YOU', text: 'So do I get a membership?', shot: 'player' },
  { who: 'ONE-REP REX', text: 'Rookie. You get a HOOK. For your chalk bag. That is higher than membership. Same time next season — the belt remembers.', shot: 'opp' },
],
```

```js
// FAILS
g: [
  [{ who: 'GALLON GREG', text: "That one didn't count, bro. But YOU count. Come here. Hug it out, re-rack, go again.", shot: 'wide' },
   { who: 'YOU', text: 'One more set. For the hook.', shot: 'player' }],
  [{ who: 'ONE-REP REX', text: "DIDN'T COUNT.", shot: 'wide' },
   { who: 'GALLON GREG', text: 'He says that to everyone, bro. He said it at his own wedding. Again — hips, THEN hands.', shot: 'wide' }],
],
// WINS
g: [
  [{ who: 'GALLON GREG', text: 'CLEAN REP! Somebody chalk the board! Somebody chalk EVERYTHING!', shot: 'wide' },
   { who: 'YOU', text: 'Log it. Next set.', shot: 'player' }],
  [{ who: 'MIRROR MAX', text: "Honestly? The follow-through was giving. It was GIVING. I'd frame that swing.", shot: 'wide' },
   { who: 'YOU', text: 'Frame the landing instead. It went farther.', shot: 'player' }],
],
```

---

# 4. DON PLAYGROUND CAMPAIGN — "NOT OUR PLAYGROUND" + quicksand mechanic

## 4a. Tour (new, unpinned — the quicksand challenge is *why* it's unpinned; principle #5)

```js
{
  key: 'playground', title: '🛝 NOT OUR PLAYGROUND',
  world: 'playground',   // proposed world: swing set, big slide, sandbox lane, chalk hopscotch, juice-box stand
  blurb: 'Don is back, the bulldozers are back, and the playground is "underperforming." The kids have retained counsel: your palm.',
  acts: [
    {
      act: 'ACT I — THE ANNOUNCEMENT',
      story: 'Tremendous Don parked a gold bulldozer on the hopscotch and announced a billion-dollar world headquarters for the United Nations of Don. Membership: one. Dues: tremendous. The kids have organized. The kids have SIGNS.',
      challenges: [
        { id: 'p1c1', title: 'PERMIT? WHAT PERMIT?', desc: "A clean head slap on SURVEYOR SID — he's measuring the swing set for demolition and feels bad at a professional distance", opp: 'sid', goal: { type: 'head' } },
        { id: 'p1c2', title: 'READ THE SIGNS', desc: 'An 80% chain before SCHOOLMARM SUSIE — the kids made protest signs; she is grading their kerning AND your form', opp: 'susie', goal: { type: 'chain', v: 80 } },
        { id: 'p1c3', title: 'THE FOCUS GROUP', desc: 'Send THE INFLUENCER 50m — Don hired her to rebrand the playground as "a pre-parking experience"', opp: 'influencer', goal: { type: 'dist', v: 50 } },
      ],
    },
    {
      act: 'ACT II — THE SANDBOX',
      story: "Don's crew dug the foundation straight through the sandbox and hit the one thing this county has in abundance: consequences. The pit is quicksand. And Sid just fell in.",
      challenges: [
        { id: 'p2c1', title: '⏳ THE SANDBOX RESCUE', desc: 'SURVEYOR SID is SINKING — slap him OUT before he goes under. The cheek drops for 8 seconds. Bring a LOW palm.', opp: 'sidsink', goal: { type: 'dist', v: 12 } },
        { id: 'p2c2', title: '☗ FINAL BOSS: ZONING IS FOR LOSERS', desc: 'Score 450 off TREMENDOUS DON — the kids are watching, and this time nobody is saving him', opp: 'don', goal: { type: 'pts', v: 450 } },
      ],
    },
  ],
},
```

## 4b. Sid + the sink variant (`ROSTER`) and the mechanic spec

```js
{
  key: 'sid', name: 'SURVEYOR SID', tag: 'DEMOLITION SURVEY', world: 'playground',
  w: 0.9, h: 1.0, mass: 0.85, noStache: true,
  skin: 0xe0b48e, shirt: 0xf0c030, pants: 0x4a6fa5, hat: 'cap', hatCol: 0xf0c030,
  vest: 0xff8c1a,   // NEW look flag: hi-vis vest over the shirt
  pickLine: 'Measures things for Don. Feels bad about it at a fully professional distance.',
  taunts: ['Per my measurements: you missed.', "Don't shoot the surveyor. Slapping is fine, apparently."],
},
{
  // p2c1 summons this variant by key — same Sid, chest-deep and going down
  key: 'sidsink', name: 'SURVEYOR SID', tag: 'SINKING · 8 SECONDS', boss: true,
  w: 0.9, h: 1.0, mass: 0.85, noStache: true,
  // NEW mechanic — sink: the whole braced pose descends `depth` units over `duration`
  // seconds (Opponent.update offsets body y, like hop/weave but monotonic). The head
  // hitbox rides down with it. At t=duration the head submerges: attempt fouls
  // ("GLUB." via ui.slapBurst) and main.js plays SINK_FAIL instead of rotating FAILS.p.
  // WHY SHORT WINS: `height` scales the slapper's strike plane, so the descending
  // cheek exits a tall slapper's envelope ~4s in but stays reachable to a 0.85–0.93
  // slapper until ~7s. strikeLift's lower range does the rest. Charlie / Mei /
  // Auntie / Lil' Dynamite are the roster's answer — the challenge is unpinned
  // on purpose so the player makes that call (DESIGN-LESSONS #4 and #5).
  sink: { duration: 8, depth: 1.35 },
  skin: 0xe0b48e, shirt: 0xf0c030, pants: 0x4a6fa5, vest: 0xff8c1a,
  pickLine: 'He measured the sandbox. The sandbox measured back.',
  taunts: ['I APPROVE THIS RESCUE!', 'The permit for sinking was NOT filed!'],
},
```

## 4c. Cutscenes (kids as chorus — kids are never slappable; see §7)

```js
// ===== NOT OUR PLAYGROUND =====
playground_prologue: [
  { who: 'TREMENDOUS DON', text: "Beautiful playground. Terrible numbers. Zero revenue. Infinite sand. So we're building UP: the billion-dollar world headquarters of the United Nations of Don. Membership: me. Dues: tremendous.", shot: 'wide' },
  { who: '🧒 THE KIDS', text: 'NO! NOT OUR PLAYGROUND!', shot: 'wide' },
  { who: 'TREMENDOUS DON', text: 'The kids love it. Listen to that excitement.', shot: 'wide' },
  { who: 'YOU', text: "You'd need a zoning variance, Don. This is parkland.", shot: 'player' },
  { who: 'TREMENDOUS DON', text: 'Zoning is for losers. I said it at the hearing. There WAS no hearing — I skipped it. Winners skip hearings.', shot: 'wide' },
  { who: '🧒 THE KIDS', text: 'SLAP-PER! SLAP-PER! SLAP-PER!', shot: 'wide' },
  { who: 'YOU', text: '...well. You heard opening arguments.', shot: 'player' },
],
p1c1: [
  { who: 'SURVEYOR SID', text: 'Just doing my job, pal. Measuring the swing set for the... for the...', shot: 'opp' },
  { who: '🧒 THE KIDS', text: 'SAY IT!', shot: 'wide' },
  { who: 'SURVEYOR SID', text: '...for the demolition. Look, I have a mortgage and a very precise tape measure.', shot: 'opp' },
  { who: 'YOU', text: 'Then measure this precisely: one slap, on the cheek, per county custom. Invoice Don.', shot: 'player' },
  { who: 'SURVEYOR SID', text: 'Oh, I invoice Don for EVERYTHING. Line 12: "getting slapped (foreseeable)."', shot: 'opp' },
],
p1c2: [
  { who: 'SCHOOLMARM SUSIE', text: "The children made protest signs. NOT OUR PLAYGROUND — good letterform, strong message discipline. Petey drew the bulldozer crying. That's called RHETORIC, dear.", shot: 'opp' },
  { who: 'YOU', text: 'And my part?', shot: 'player' },
  { who: 'SCHOOLMARM SUSIE', text: 'The signs say the county cares. Your chain PROVES it. Eighty percent — the children are watching, so show your work.', shot: 'opp' },
],
p1c3: [
  { who: 'THE INFLUENCER', text: "Okay so Don paid me to rebrand this as a 'pre-parking experience,' and the check cleared, and I feel TERRIBLE—", shot: 'opp' },
  { who: '🧒 THE KIDS', text: 'BOOOOO!', shot: 'wide' },
  { who: 'THE INFLUENCER', text: "—I KNOW. So here's the pivot: slap me fifty meters, I post the flight, caption: THE PLAYGROUND FIGHTS BACK. The check stays cashed, the kids get the narrative. Everybody wins. Mostly me. But ALSO the kids.", shot: 'opp' },
],
p2c1: [
  { who: '🧒 THE KIDS', text: "MISTER! MISTER! SID FELL IN THE HOLE! THE HOLE'S EATING HIM!", shot: 'wide' },
  { who: 'SURVEYOR SID', text: 'The foundation pit is QUICKSAND! Nobody surveyed the— okay. I was supposed to survey the sand. This one is on me. GLUB.', shot: 'opp' },
  { who: '🧒 THE KIDS', text: 'The sand takes the TALL reach first! Get somebody LOW! The short ones slap down HERE!', shot: 'wide' },
  { who: 'YOU', text: "The kid's right. That cheek is going DOWN, and every second it sinks, only a lower palm can reach it. This is a job for whoever lives closest to the ground.", shot: 'player' },
  { who: 'SURVEYOR SID', text: "EIGHT SECONDS, whoever you send! I've measured worse! ...That's a lie. This is the worst.", shot: 'opp' },
],
p2c2: [
  { who: 'TREMENDOUS DON', text: 'The pit ate my surveyor. Tremendous pit. Anyway — we pour concrete Tuesday.', shot: 'opp' },
  { who: 'YOU', text: 'Your own crew, Don.', shot: 'player' },
  { who: 'TREMENDOUS DON', text: 'He gets a plaque! SID: PARTIALLY ABSORBED FOR THE BRAND. Nobody honors people like me.', shot: 'opp' },
  { who: '🧒 THE KIDS', text: 'NOT! OUR! PLAYGROUND!', shot: 'wide' },
  { who: 'TREMENDOUS DON', text: 'Four hundred and fifty points says the kids learn a valuable lesson about market forces.', shot: 'opp' },
  { who: 'YOU', text: "They're about to learn one about follow-through.", shot: 'player' },
],
outro_p2c2: [
  { who: 'TREMENDOUS DON', text: 'FINE. FINE! The headquarters goes somewhere else. Somewhere with valet. The United Nations of Don will convene... in my car.', shot: 'opp' },
  { who: '🧒 THE KIDS', text: 'OUR PLAYGROUND! OUR PLAYGROUND!', shot: 'wide' },
  { who: 'SURVEYOR SID', text: 'For the record, I re-measured: the playground is underperforming at NOTHING. It is at one hundred percent capacity. Of kids.', shot: 'wide' },
  { who: 'YOU', text: 'Send Don the invoice, Sid.', shot: 'player' },
  { who: 'SURVEYOR SID', text: 'Line 13: "witnessing justice (tremendous)." Already filed.', shot: 'wide' },
],
```

```js
// FAILS
p: [
  [{ who: '🧒 THE KIDS', text: "It's okay mister!! Even the big slide took us THREE tries!!", shot: 'wide' },
   { who: 'YOU', text: 'The playground deserves my best swing. Again.', shot: 'player' }],
  [{ who: 'TREMENDOUS DON', text: 'Missed! Weak palm. Low energy. The bulldozer never misses, and the bulldozer is warming up.', shot: 'wide' },
   { who: 'YOU', text: 'Neither do I. Twice.', shot: 'player' }],
],
// WINS
p: [
  [{ who: '🧒 THE KIDS', text: 'DID YOU SEE THAT?! DO IT AGAIN! DO IT AT MY BIRTHDAY!', shot: 'wide' },
   { who: 'YOU', text: 'One county emergency at a time.', shot: 'player' }],
  [{ who: 'SCHOOLMARM SUSIE', text: 'Gold star, dear. The children are learning civics at an alarming rate.', shot: 'wide' },
   { who: 'YOU', text: 'Best classroom in the county.', shot: 'player' }],
],
// the one fail that isn't a whiff: Sid went under (played directly by main.js
// when sink.duration elapses — the ESCAPE_FAIL idiom)
export const SINK_FAIL = [
  { who: '🧒 THE KIDS', text: "HE WENT UNDER! ...It's okay!! The sand spit him back out! It says he tastes like PERMITS!", shot: 'wide' },
  { who: 'SURVEYOR SID', text: '(sand-muffled) RE-MEASURING. RECOMMEND: A SHORTER PALM. AND SOONER.', shot: 'wide' },
];
```

**Rationale.** The mechanic is the story beat (#4): the sink timer *is* the drama, and the kids deliver the design hint diegetically. The moral stays warm — the county rescues *Don's own crew*, and Don loses to physics and paperwork, not cruelty. "United Nations of Don" keeps the requested UN gag while parodying Don's grandiosity rather than the actual institution.

---

# 5. TICK-TOCK TOM v2

## 5a. ROSTER patch (replaces the `clockwork` entry's gimmick + taunts)

```js
{
  key: 'clockwork', name: 'TICK-TOCK TOM', tag: 'BOSS · UNSLAPPABLE (SELF-DECLARED)', boss: true,
  w: 1.1, h: 1.02, mass: 1.3,
  bounce: { period: 0.8, height: 0.16 },   // v2: bounces in place — a confidence display, not a dodge
  // NEW mechanic — bulwark: cumulative points across attempts fill a hidden meter.
  // The HUD chip shows the inverse: 'IMMOVABILITY: 97%'. Each landed slap drains it
  // by pts/threshold. Transform stages (DESIGN-LESSONS #3): 100–75% smug; 74–40%
  // paint chips + the wind key wobbles; 39–1% rattling, grin cracks, bounce stutters;
  // at 0% the mainspring lets go — he BLOWS AWAY downrange on a stored, threshold-
  // sized impulse with full fanfare. Goal type 'bulwark' = met when the meter zeroes.
  bulwark: { threshold: 1400, label: 'IMMOVABILITY' },
  skin: 0xc9a24b, shirt: 0x9a7a34, pants: 0x6e5626,
  windKey: true, paintedGrin: 0xc0202a, brow: true,
  pickLine: 'Declares himself UNSLAPPABLE. The meter disagrees. Slowly.',
  taunts: [
    'UNSLAPPABLE. I had it engraved. On myself.',
    'Tick. Tock. Still here.',
    'I absorbed that one. I absorb ALL of them. It is called posture.',
    'Was that a slap or a suggestion?',
    'Ninety-seven percent immovable. The three percent is paint.',
    'Hear the mainspring laughing? Tick. Tick. That is laughter.',
    'Bouncing is not dodging. Bouncing is CONFIDENCE.',
    'The last man to move me was a licensed piano mover. He had a DOLLY.',
  ],
},
```

Challenge patch (wonders, w2c3): `desc: "Drain TICK-TOCK TOM's IMMOVABILITY to zero — every point you land stays landed", goal: { type: 'bulwark' }`.

On-screen meter label (chip under `challengeBar`, top-anchored per the layout guardrails): **`IMMOVABILITY: 97%`** — counts down on landing; at 0% it flashes **`SPRUNG!`** and the key spins backward.

## 5b. Cutscene + outro (replace `w2c3`, add `outro_w2c3`)

```js
w2c3: [
  { who: '🎬 DIRECTOR VANE', text: 'The Institute loaned us their crown specimen, Charlie. It has declared itself — its word — UNSLAPPABLE. It has been declaring it since 1911. To everyone. At length.', shot: 'wide' },
  { who: 'TICK-TOCK TOM', text: 'UNSLAPPABLE! Note the bounce. A lesser machine stands still. I bounce because I have ENERGY TO SPARE. Slap me all day, biologist — the mainspring keeps the change.', shot: 'opp' },
  { who: 'YOU', text: 'Fascinating. The specimen advertises its own invulnerability. Rhythmically. In nature this is called a display. In science, it is called a hypothesis.', shot: 'player' },
  { who: 'TICK-TOCK TOM', text: 'The meter reads ONE HUNDRED PERCENT IMMOVABLE. The meter is riveted to my chest. I also am riveted. Everything about me is riveted!', shot: 'opp' },
  { who: 'YOU', text: 'Then we test it to zero. Every point stays landed, specimen. Science is patient, and the meter is honest. Roll camera.', shot: 'player' },
],
outro_w2c3: [
  { who: 'TICK-TOCK TOM', text: 'REVISION! REVISION TO THE ENGRAVING! Unslappable, ASTERISK: cumulatively, over time, by a PROFESSIONAL—', shot: 'opp' },
  { who: '🎬 DIRECTOR VANE', text: "HE'S AIRBORNE! The crown specimen is AIRBORNE, Charlie! A hundred and fifteen years of tick and the spring finally said TOCK! Say something for the film! Something HISTORIC!", shot: 'wide' },
  { who: 'YOU', text: '...', shot: 'player' },
  { who: 'YOU', text: 'And as we can see, everything can in fact be slapped.', shot: 'player' },
  { who: '🎬 DIRECTOR VANE', text: "...that's the poster. That's the POSTER, Charlie.", shot: 'wide' },
  { who: 'TICK-TOCK TOM', text: '(distant) STILL! NINETY! PERCENT! PAINT!', shot: 'wide' },
],
```

**Rationale.** Full boss payoff loop: trash talk (8 rotating bounce taunts), visible telegraph (bounce + wind key + meter), transformation stages, dramatic payoff (the stored blow-away), story punchline (Charlie's requested line, verbatim, with the deadpan '...' beat as its own cutscene line so the pause is real).

---

# 6. AVA NATIONALITY SCENE

**Slot decision: append to `outro_o3c3`** (after Quibble's current final line). No new plumbing — it rides the existing outro playScene — and it makes the campaign's final word its thesis. A separate beat would need a new trigger; not worth it.

```js
// append to outro_o3c3:
{ who: 'JUDGE PENNYWHISTLE', text: 'And for the record — YES! That is one for the United States of America! I have alerted the anthem committee. Both anthems. ALL the anthems.', shot: 'judge' },
{ who: 'YOU', text: 'American or not... does it matter, your honor?', shot: 'player' },
{ who: 'JUDGE PENNYWHISTLE', text: '...', shot: 'judge' },
{ who: '⛷️ AVALANCHE AVA', text: 'Slapping has no nationality, boys. The cheek does not check your passport. That is the whole sport — I get it now.', shot: 'opp' },
{ who: '🏅 COMMISSIONER QUIBBLE', text: 'The Committee will be quoting that. On the rings. In eleven languages. Provisionally.', shot: 'wide' },
```

**Voice notes.** Pennywhistle's overreach is podium jingoism played as his usual bureaucratic maximalism ("ALL the anthems"); Victor (the pinned `YOU`) delivers the requested line; the '...' is a standalone judge-shot line so the awkward beat gets a real camera hold; Ava lands the thesis and Quibble files it.

**Sensitivity flag (my call as validator).** This is the first real-nation reference in a game that otherwise lives entirely in a fictional county. The scene *works* precisely because Ava punctures the claim — the joke is on podium nationalism, not on any country. If the owner prefers to keep the fiction sealed, the drop-in alternative is: `'...that is one for the greatest county on God's green earth!'` — same rhythm, zero real-nation reference, and Victor's line still lands. Ship either; flag raised.

---

# 7. PER-WORLD VOLUNTEER CURATION (→ OPP gating)

Proposed export for `opponent.js` (public pick = `PICKABLE` ∩ world list; DLC specimens still gated by pack; campaigns summon by key regardless, per the established rule; **bosses and kids never appear in any pick**):

```js
export const WORLD_ROSTERS = {
  day:        ['slim','hank','ravinray','mabel','hoss','bertha','cletus','don','influencer','susie','maestro','chuckles','pogo','nadine','horton'],
  night:      ['slim','hank','ravinray','mabel','hoss','bertha','cletus','don','influencer','maestro','chuckles','pogo','horton'],
  ice:        ['slim','hank','mabel','hoss','bertha','cletus','chuckles','pogo'],
  desert:     ['wiley','pike','marge','sybil','slim','hank','hoss','cletus','pogo'],
  jungle:     ['percival','slim','hank','hoss','mabel','nadine'],
  haunted:    ['joe','tony','zeb','myrtle','cletus','ravinray','maestro'],
  dojo:       ['wally','hank','slim','susie','nadine'],
  lava:       ['flambeau','chuckles','ravinray','hoss'],
  therapy:    ['inkblot','don','influencer','bertha','slim','hank','maestro'],
  heaven:     ['hal','cletus','mabel','susie'],
  hell:       ['larry','don','ravinray','maestro'],
  techcampus: ['vance','mira','influencer','don','susie','slim'],
  gym:        ['greg','mirrormax','titus','hoss','pogo','hank'],
  playground: ['sid','don','influencer','susie','chuckles','hank'],
};
```

| World |

---

| World | Allowed (reasoning) | Notable exclusions | Proposed new locals (0–2) |
|---|---|---|---|
| day | Full farm cast — it's home | — | — |
| night | Same fair after dark; Ray belongs here MOST | susie (school night), nadine (sun salutation needs sun) | FIREFLY FIONA — jar of fireflies, glows on PERFECT chains |
| ice | Hardy farm folk in coats (COATS palette precedent) | influencer (crop top — wardrobe is the place, #2), nadine (mat freezes), horton (tails on ice = comedy but tailcoat reads summer-formal), don (no valet) | TRIPLE-AXEL AXEL — skater, `weave`-lite slip on skates |
| desert | New Dry County four + travelers who'd plausibly follow the pie stand | maestro (cello varnish, he'd never), bertha (her sun dress stays home — Sybil is the desert's Bertha), **ava never in desert** (boss-only anyway; noted per prompt) | (the four new entries are the locals) |
| jungle | Percival + hardy hikers; nadine (outdoor yoga tracks) | don/susie/horton (suits and chalkboards don't trek), influencer (no signal — she'd leave) | CANOPY CALLIE — vine researcher, `sway` gimmick reuse |
| haunted | Canon night crew: joe, tony, new ushers; cletus (outhouse canon), ravinray (booked the gig, n2c2), maestro (organ feud, n3c1) | everyone else — the Night Fair is for the locked-in and the dead | zeb + myrtle (delivered in §1f) |
| dojo | wally (local), hank/slim (canon pebbles), susie (discipline tourism — sign-in sheet canon), nadine (flexibility seminar) | don (bought a black belt once, denied), influencer (no phones in the dojo) | GONG-KEEPER GUS — strikes the gong, rates your chain in gong hits |
| lava | Sideshow kin only: flambeau, chuckles, ravinray (fire rave), hoss (heat-proof by sheer thermal mass) | anyone in flammable formalwear | CINDER SYD — coal-walker, soles of regret |
| therapy | The canon client list: inkblot, don (t2c1), influencer (t2c2), bertha (t1c3), slim (t1c2), hank (t3c1), maestro (unresolved organ feelings) | cletus (nothing left to unpack — he's fine, genuinely) | — (the couch is full) |
| heaven | hal + the gentle: cletus (closest to the door, he'd say so himself), mabel, susie | don (admissions review pending — warm joke, not damnation), ravinray (noise ordinance) | CHOIR-BOY CHESTER — 400 years in the choir, wants ONE solo flight |
| hell | larry + don (reserved parking), ravinray (residency, obviously), maestro (the organ is FROM here) | mabel/susie/cletus (no business being there) | H.O.A. HELEN — hell's HOA president, clipboard of eternal violations |
| techcampus | vance, mira, influencer (content), don (investor), susie (grading the machine, v3c1), slim (gig courier) | bertha/hoss (won't badge in), maestro (refuses the open office) | — (vance + mira carry it) |
| gym (new) | greg, mirrormax, titus + hoss (he IS the equipment), pogo (cardio), hank (free trial) | cletus (his hip; he supervises from a folding chair), susie (grades from outside) | (the three new entries are the locals) |
| playground (new) | sid, don, influencer, susie, chuckles (birthday clown), hank (built the swings) | **KIDS — never volunteers, never slappable, chorus only. Hard rule.** | — (sid is the local) |

**Rationale.** Principle #2 verbatim: no global pool, volunteers wear the place, and every exclusion has a story reason a player could guess. The table doubles as the `WORLD_ROSTERS` reasoning record.

---

# 8. THERAPY SCRIPT GARNISH (couch / cat / Red Book / persona-shadow)

Five insertions, each anchored to an exact existing line so the orchestrator can place them without guessing. All in Carl Gustav's clinical first-person.

**8a. `slaptherapy_prologue` — insert after line 2 ("The board revoked my license..."):**
```js
{ who: 'YOU', text: "The tent came furnished. One couch, sized for the county's collective unconscious. One cat, the size of a hay wagon. The cat is not mine. The cat attends. Analysis observes — the cat out-observes.", shot: 'player' },
```

**8b. `t1c1` — insert before Carl's final line ("A cheek, Ian..."):**
```js
{ who: 'YOU', text: 'The Red Book is open to a fresh page, Ian. Whatever you are about to become, it will be recorded — in red ink, and better handwriting than the board deserves.', shot: 'player' },
```

**8c. `t2c3` (the Rorschach retest) — insert after Ian's "But I gotta know it wasn't a fluke.":**
```js
{ who: 'YOU', text: 'Note for the record: at your first session, your shadow flinched before your face did. Today the shadow stands still. That is progress, Ian. Measurable. Billable.', shot: 'player' },
```

**8d. `t3c2` (Freudenschade) — insert after Carl's "How is your Tuesday man? Still on the boat dream?":**
```js
{ who: 'YOU', text: 'You wear the persona of a skeptic, colleague, but your shadow has been taking notes since you walked in. Mind the couch on your way down. It was built for exactly this.', shot: 'player' },
```

**8e. FAILS.t — add a third rotation pair (delivers the requested 'your shadow ducked; you did not' line):**
```js
[{ who: 'YOU', text: 'Curious. Your shadow ducked; you did not. The slap followed the shadow. We resume when the two of you reconcile.', shot: 'player' },
 { who: 'YOU', text: 'The cat saw everything. The cat is withholding judgment. The cat is better at this than I am. Again.', shot: 'player' }],
```

**Rationale.** Each new prop (giant couch, cat, Red Book) now carries a joke and a function — the couch is where patients *land* (already canon in `outro_t3c2`: "the patients need somewhere to land"), the cat is the silent supervisor, the Red Book is the case file, and persona/shadow language threads through intake → retest → the rival-school duel, so the set is load-bearing in the script, not decoration.

---

## Summary of proposed new flags/mechanics (implementation surface for the orchestrator)

- **Look flags (opponent builder)**: `pillbox`, `trayProp`, `turban`, `shawl`, `stampProp`, `slickCoat` (glossy overlay — never tint skin), `stringer`, `jugProp`, `slimLegs`, `chalkHands`, `vest`, `oneGlove` (Smooth Cadaver, scenery figure).
- **Look flags (player builder)**: `pinstripe`, `batBow`, plus **port `skullFace`** from the opponent builder for Mr. Slappington.
- **Mechanics (arch flags, composable per the existing idiom)**: `brace {gate, weak, launch}` (One-Rep Rex), `sink {duration, depth}` (Sid, + `SINK_FAIL` export played like `ESCAPE_FAIL`), `bulwark {threshold, label}` + `bounce {period, height}` (Tick-Tock v2; new goal type `'bulwark'`, HUD chip `IMMOVABILITY: n%` top-anchored per layout guardrails).
- **Gating**: `WORLD_ROSTERS` export in `opponent.js`; kids are chorus-only, never pickable; bosses stay campaign-only.
- **New tour prefixes**: `d` (oilfever), `g` (pumphouse), `p` (playground) — no collision with existing `a f w b n t v o`.
- **Worlds proposed**: `gym` and `playground` need `WORLD_THEMES`/`WORLD_GROUPS` entries + frost/biome registration per the CLAUDE.md guardrail; haunted gets bats, Smooth Cadaver, zombie announcer/fan-lady retints, hard moonlight grade.
- **Open sensitivity flags for the owner**: (1) the "United States of America" line in §6 — works as written because Ava punctures it, but a sealed-fiction alternative is provided; (2) THE GUSHER's slick must be implemented as an overlay material, never a skin tint; (3) turban is styled/written as a sun-wrap and should stay uncombined with any religious signifier.

All key files referenced: `/Users/victortan/slap-game/js/campaign.js`, `/Users/victortan/slap-game/js/opponent.js`, `/Users/victortan/slap-game/js/player.js`, `/Users/victortan/slap-game/DESIGN-LESSONS.md`.