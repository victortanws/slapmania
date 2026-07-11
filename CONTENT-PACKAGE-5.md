# Content package 5: dialogue audit + Don arrival + X Marswell (2026-07-11)

I have everything I need. Here are the three deliverables, paste-ready.

---

# 1. REPEATED-LINE AUDIT

I grepped every `CUTSCENES`/`WINS`/`FAILS`/`story`/`desc` entry for signature phrases and stock beats. Findings split into **FIX** (genuine cross-scene dupes, incl. both lines the user flagged) and **KEEP** (intentional per-campaign runners that pay off — flagged for transparency so nobody "fixes" them by accident).

### Fixes — exact old → new

| # | Repeated phrase | Locations | Action |
|---|---|---|---|
| A | **"the fair stands (a little) taller"** (user-flagged) | `WINS.f[0]` YOU (L1107) + `outro_f4c2` Penny (L482) | Keep the finale ("The fair stands." is the payoff); rewrite the WIN so it stops pre-echoing it. |
| B | **"the palm was/is listening — wrong/RIGHT instructions"** (user-flagged) | `FAILS.a[1]` YOU (L1022) + `WINS.a[1]` YOU (L1103) | Keep the FAIL; rewrite the WIN off a fresh image (the Slee line above it already covers "the whole chain spoke in one sentence"). |
| C | **"Ma said this cheek would go places"** — same campaign twice | `o1c1` Hank (L829) + `o3c2` Hank (L872) | Rewrite `o3c2`. |
| D | **"keep the tears in a jar / four hundred palms"** | `a3c3` Dale (L407) + `b2c1` Dale (L596) | Rewrite `b2c1`. |
| E | **"Roll camera"** ×3 | `wonders_prologue` Vane (L491, keep) + `w2c3` YOU (L543) + `w3c3` YOU (L559) | Rewrite the two YOU uses. |
| F | **"Mind the suspenders"** | `w1c3` Cletus (L507) + `c3c2` Cletus (L977) | Rewrite `c3c2`. |
| G | **"never (once) given an A"** | `f3c1` Susie (L451) + `o2c1` Susie (L845) | Rewrite `o2c1`. |
| H | **"Six fairs"** | `a2c1` Bertha (L382) + `t1c3` Bertha (L716) | Rewrite `t1c3`. |
| I | **"three feet"** used as win/fail metric | `FAILS.c[0]` (L1073, keep) + `WINS.c[1]` (L1150) | Rewrite the WIN so the number stays special for the prologue/`c2c3` callback. |
| J | **"Hold still"** — same character/campaign twice | `t1c1` Gustav (L707) + `t2c3` Gustav (L737) | Rewrite `t2c3`. |
| K | **"a single honest slap"** — YOU says variants 3× in one campaign | `c2c2` (L960), `WINS.c[0]` (L1148); keep `c3c3` L981 (thematic climax) | Rewrite `c2c2` and `WINS.c[0]`. |

**A —** `WINS.f[0]`, YOU:
- OLD: `The fair stands a little taller, your honor.`
- NEW: `Read it into the record, your honor: this county cares. Loudly.`

**B —** `WINS.a[1]`, YOU:
- OLD: `The palm is finally listening. To the RIGHT instructions this time.`
- NEW: `That one landed exactly where I sent it. First time my hand and I agreed on anything.`

**C —** `o3c2`, HAYSEED HANK:
- OLD: `A world record. Me. Ma said this cheek would go places — she meant CHURCH.`
- NEW: `A world record. With my name spelled right. Ma wanted me in the hymn book — she'll settle for the record book.`

**D —** `b2c1`, DODGY DALE:
- OLD: `I taught Chuck the slip. Or he taught me — the story changes at every fair. Four hundred palms, zero landings. I keep the tears in a jar.`
- NEW: `I taught Chuck the slip. Or he taught me — the story changes at every fair. Four hundred palms came for this grin. It is still on my face.`

**E —** `w2c3`, YOU:
- OLD: `We shall learn whose voice stays flat when the other cracks the air. Roll camera.`
- NEW: `We shall learn whose voice stays flat when the other cracks the air. Begin.`

`w3c3`, YOU (last line of the scene):
- OLD: `Then we test it to zero. Every point stays landed, specimen. Science is patient, and the meter is honest. Roll camera.`
- NEW: `Then we test it to zero. Every point stays landed, specimen. Science is patient, and the meter is honest. Start the tape.`

**F —** `c3c2`, GRANDPA CLETUS:
- OLD: `Forty-five meters, up HERE, with the floaty gravity? That's the closest to flyin' an old man gets while still buyin' green bananas. Mind the suspenders.`
- NEW: `Forty-five meters, up HERE, with the floaty gravity? That's the closest to flyin' an old man gets while still buyin' green bananas. Gentle on the halo — it's a rental.`

**G —** `o2c1`, SCHOOLMARM SUSIE:
- OLD: `Eighty percent, dear, and DIAGRAM every link. I sign nothing I have not graded, and I have never once given an A.`
- NEW: `Eighty percent, dear, and DIAGRAM every link. I sign nothing I have not graded, and my red pen has never once run dry.`

**H —** `t1c3`, BIG BERTHA:
- OLD: `Doc, I carry this whole county. Six fairs, four bake sales, everybody's troubles. I can't put a single one of 'em down.`
- NEW: `Doc, I carry this whole county. Every bake sale, every busted heart, everybody's troubles. I can't put a single one of 'em down.`

**I —** `WINS.c[1]`, VIRGIL:
- OLD: `Clean strike. Surveyed it myself: flush, square, and three feet farther than you needed. Showoff.`
- NEW: `Clean strike. Surveyed it myself: flush, square, and a good yard past where you needed. Showoff.`

**J —** `t2c3`, YOU (last line):
- OLD: `A butterfly, Ian. You were never a moth. Hold still.`
- NEW: `A butterfly, Ian. You were never a moth. Now — once more, for the record, and do not flinch.`

**K —** `c2c2`, YOU:
- OLD: `Then rise, nocturnal one, upon the wings of a single honest slap!`
- NEW: `Then rise, nocturnal one — on this terrace, momentum itself counts as virtue!`

`WINS.c[0]`, YOU:
- OLD: `And one soul, freed by a single honest slap, moved on! I shall render it in eleven syllables!`
- NEW: `And one soul, unstuck at last, moved on to the next stamp! I shall render it in eleven syllables!`

### Keep (intentional runners — do NOT dedupe)
- **"strike in the QUIET" / "the quiet"** (Second Wind): the campaign's central mechanic/mantra; repetition is the through-line.
- **"one honest slap"** as commedia's *premise* in different mouths (Virgil, Maestro, Judge) — only the YOU-spoken repeats (fix K) were blunting it; `c3c3` L981 is the climax and keeps it.
- **"Everything is a county" / "Even Purgatory is a county"** (`c2c3`→`c3c1`): a deliberate setup-then-"Told you" callback. Works.
- **Virgil "three feet"** in `commedia_prologue` + `c2c3` (the Cato callback): the character's signature; fix I just stops the generic WIN from spending it.
- **"NEXT PATIENT"** (Gustav, ×4): his sign-off catchphrase — intentional, spaced across sessions.
- **"for science"**: only ONE instance (L547) — no repeat, no action.
- **WINS/FAILS keyed per tour prefix** — I confirmed no two prefixes share identical text; the only cross-read issue was signature phrases leaking between a WIN/FAIL and an outro (fixes A, B, I), all handled.

---

# 2. SAVE THE FAIR — Don arrives, and has a reason

**The motive (threaded through all four acts):** Parking Structure Seven is the *cover story*. The real target is 40 square feet — the patch where the 1962 livestock tent stood. There, a young judge named **Pennywhistle** disqualified a boy's prize hog, **Sir Bacon-a-lot**, for being "over-greased" (ties Greased Pete), and pinned the blue ribbon on a **Hayseed** pig instead (ties Hank). Don has spent forty years and a real-estate empire to pave that exact spot — and he bought his old nemesis Pennywhistle specifically to make him *notarize the revenge*. This retro-justifies why the beloved judge is corrupt, and pays off the existing blueprints-in-the-gavel-case reveal.

### f1c1 — the arrival (full replacement)
Adds: gold bulldozer + motorcade + helicopter, a ribbon-cutting he crashes, a concrete parking motive AND the planted pig grudge, and a four-way ensemble reaction (kid, vendor, Bertha, judge). New nameplates `🎈 A FAIR KID` / `🌭 THE HOT DOG VENDOR` use `shot:'wide'` (no cast figure required).

```js
  f1c1: [
    { who: '🎈 A FAIR KID', text: "It's the SIXTIETH season! The mayor's cutting the ribbon and — is that a HELICOPTER? Why is the helicopter GOLD?", shot: 'wide' },
    { who: '🌭 THE HOT DOG VENDOR', text: "That's a helicopter, a motorcade, AND a gold bulldozer, kid. Nobody brings a bulldozer to a ribbon-cutting unless he brought his OWN ribbon to cut instead.", shot: 'wide' },
    { who: 'TREMENDOUS DON', text: "SORRY I'M LATE — I was cutting a BETTER ribbon. Beautiful fairground. Terrible fairground. My people are paving it: Parking Structure Seven, the last unpaved lot between my two garages. The greatest of the sevens.", shot: 'wide' },
    { who: 'BIG BERTHA', text: 'Over my sixty seasons, sugar. This county does not sell.', shot: 'opp' },
    { who: 'TREMENDOUS DON', text: "It's not about the money, Bertha — I have all of it. It's about... that banner. 'LIVESTOCK & BLUE RIBBONS.' Pave that corner FIRST. No reason. Sportsman's whim.", shot: 'wide' },
    { who: 'JUDGE PENNYWHISTLE', text: "Mr. Don proposes a WAGER — his lawyers drafted it on the bulldozer's hood. The county names one champion. Clear every trial and he tears the permit ON CAMERA. Fail one... Structure Seven. I notarized it. The pen was gold. I did not look him in the eye.", shot: 'judge' },
    { who: 'YOU', text: 'Give me the contract.', shot: 'player' },
    { who: 'TREMENDOUS DON', text: "Clause one, champ: prove anyone CARES. Cameras are rolling — MY cameras. When the county's favorite aunt roars, the county roars. Wave for the drone, Bertha.", shot: 'wide' },
    { who: 'BIG BERTHA', text: 'For the fair? Sugar, swing like you mean it.', shot: 'opp' },
  ],
```

### Tour blurb (L49) — replacement
```js
    blurb: "Tremendous Don rolled up in a gold bulldozer and crashed the fair's sixtieth ribbon-cutting. The cover story: Parking Structure Seven. The REAL story is forty years old and has a curly tail. He drafted a public WAGER on the bulldozer's hood — signed, notarized, and rigged.",
```

### ACT I story (L53) — replacement
```js
        story: 'Don arrived by helicopter, motorcade, AND bulldozer, then made the whole county watch him NOT cut the ribbon. The wager: name one champion, clear every trial, and Don tears the paving permit ON CAMERA. Fail one, the bulldozers roll. His lawyers smiled all through the signing. He stopped smiling exactly once — at the LIVESTOCK banner. Clause one: prove anyone cares.',
```

### ACT II story (L62) — replacement (seeds the grudge)
```js
        story: 'Clause two, subsection "testimony": every witness Don\'s consultants deposed stays bought unless persuaded otherwise. Odd thing — every deposition ends on the same question: "Were you present at the 1962 livestock judging?" Nobody can say why he keeps asking. Some witnesses can be un-bought at thirty meters.',
```

### ACT III story (L71) — replacement (deepens it)
```js
        story: 'Clause three, lifted word for word from the county charter: "form beyond reproach" — graded by certified faculty, verified by a foreman who does not blink, defended by a retired champion Don pays in casserole coupons. The bulldozers idle at the gate while his lawyers count your percentages — and a very old photograph, a boy and a disqualified hog, sits face-down on Don\'s dashboard.',
```

### EPILOGUE story (L80) — replacement (the reveal)
```js
        story: "One clause left — the small print nobody read aloud. Then the blueprints turned up in Judge Pennywhistle's gavel case, signed three weeks before the wager, witnessed by a hot dog. They don't map a parking structure. They pave forty square feet: the old livestock tent — where a young judge named Pennywhistle disqualified a boy's prize hog for being 'over-greased,' and pinned the blue ribbon on a Hayseed pig instead. Don never meant to lose. He bought the judge to make him SIGN it.",
```

### f4c1 (Don confronted) — replacement
```js
  f4c1: [
    { who: 'TREMENDOUS DON', text: "So you cleared my clauses. MY clauses! That's how good my lawyers are — even the losing side is winning. Anyway, I found a problem with the wager. Me. I'm contesting it.", shot: 'opp' },
    { who: 'YOU', text: 'This was never about parking, Don. Forty square feet. The old livestock tent. 1962.', shot: 'player' },
    { who: 'TREMENDOUS DON', text: "Sir Bacon-a-lot was ROBBED. Finest hog in the county — DISQUALIFIED. 'Over-greased.' A boy's dream, paved over by a JUDGE. So yes, I bought the judge. I bought the LOT. Four hundred points says you STILL never touch me.", shot: 'opp' },
  ],
```

### f4c2 (the final boss reveal) — replacement
```js
  f4c2: [
    { who: 'YOU', text: 'The final clause, your honor. "Three hundred fifty points off a sitting judge, six seconds a swing." Don didn\'t write this one either, did he.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: "...No. I did. With Don's gold pen. Sixty years ago I judged the hogs, and I disqualified a greasy little pig over a greasy little boy — and I have notarized his revenge ever since to keep it quiet. The whistle was bought a long time ago, champ.", shot: 'opp' },
    { who: 'YOU', text: 'You ate the witness, too, your honor. The hot dog. Mid-testimony.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'I was under oath to be honest about my hunger. Very well — the whistle presides over its own reckoning. Six seconds. Objection: everything.', shot: 'opp' },
  ],
```

### outro_f4c2 — replacement (keeps the great beats, adds the pig payoff + the deduped finale)
```js
  outro_f4c2: [
    { who: 'JUDGE PENNYWHISTLE', text: 'The court finds itself... guilty. Extraordinarily guilty. The whistle is hereby returned to the county.', shot: 'judge' },
    { who: 'TREMENDOUS DON', text: 'AND THE WAGER IS HONORED! Look at me — on camera — tearing this permit into beautiful pieces. THIS IS WHY THEY CALL ME A MAN OF MY WORD. They will now.', shot: 'wide' },
    { who: 'YOU', text: 'You lost, Don.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'And the court has one debt outstanding since 1962. Let the record show: the blue ribbon for Finest Hog is awarded, posthumously, to one Sir Bacon-a-lot. Framed. Hung at the livestock tent — which STAYS.', shot: 'judge' },
    { who: 'TREMENDOUS DON', text: "...the PIG gets the ribbon. Forty years, and the — ...you know what, I'll allow it. Beautiful ribbon. I'm putting my name on the frame. 'Tremendous Sir Bacon-a-lot, presented by Don.' We're rebranding the whole rescue. The plaque is already up. Big, beautiful plaque.", shot: 'wide' },
    { who: 'JUDGE PENNYWHISTLE', text: 'The fair stands. Parking Structure Seven shall be built as a birdhouse. Case dismissed.', shot: 'judge' },
  ],
```

Note: the wager mechanic, clause structure, and every goal are untouched — only motive/staging copy changed.

---

# 3. SLOP VALLEY — the rocket/EV/meme mogul volunteer

**Original parody:** **X MARSWELL** — first name "X" (buys-and-renames-the-platform gag), surname "Marswell" (Mars + mogul cadence). Clearly invented, never the real person; the Elon-read comes from content, not a name. He's *pivoting the company to Mars-slop*: generate slop on Earth, ship it to Mars so the empty planet "finally has content."

### ROSTER entry (opponent.js — paste among the techcampus volunteers, after `slopberg` ~L242, before the `// ---- BOSSES` comment)
```js
  {
    key: 'marswell', name: 'X MARSWELL', tag: 'FOUNDER · TO MARS, POSTING', world: 'techcampus',
    w: 0.9, h: 1.05, mass: 0.9, noStache: true,
    // black tee under a dark founder jacket, buzzed hair; the phone never leaves the hand
    skin: 0xe0b58c, shirt: 0x1a1a20, pants: 0x22252c,
    hair: 'flat', hairCol: 0x2a2018, hoodie: 0x14141a,   // reuse the `hoodie` flag as the black jacket
    // OPTIONAL cheap look flags (entry renders fine WITHOUT them — prop-mount reuse):
    //   rocketProp: 0xd8d8de  → a toy rocket held where the selfie-stick mounts
    //   emberGlow:  0xff6a1a  → faint flamethrower pilot-light tint at the hand
    pickLine: 'Promised Mars by Tuesday. Cannot dodge a Wednesday palm.',
    taunts: [
      'Funding secured. Slap deflected. Both are basically confirmed.',
      "I'm taking this whole valley to Mars. The cows are coming. Ask them.",
      'I bought the platform so I could post THROUGH the slap.',
      "It's 3 a.m. and I have never been more sure of anything I'll delete by 4.",
      'Careful — I sell a flamethrower. Legally a "not-a-flamethrower."',
      'My rocket lands itself. My face, we are still A/B testing.',
    ],
  },
```
Hits all six required beats: rockets, Mars, buying the platform, 3am posting, "funding secured," flamethrowers.

### World curation (opponent.js L481) — add `marswell`
```js
  techcampus: { allow: ['vance', 'mira', 'slopberg', 'marswell', 'influencer', 'don', 'susie', 'slim'] }, // whoever badges in
```

### New campaign row — SLOP VALLEY, SPRINT II "FOUNDER MODE" (campaign.js)
Insert after `v2c2` (BURN RATE, L261), before `v2c3`:
```js
                  { id: 'v2c2b', title: 'THE MARS PIVOT', desc: 'SEND X MARSWELL 60m — he promised the board Mars; give him a live preview of re-entry', opp: 'marswell', goal: { type: 'dist', v: 60 } },
```

### Cutscene (campaign.js CUTSCENES) — the story beat
Charlie ('YOU') deadpan carries the Mars-slop / AGI tie-in; Marswell is the founder who can colonize Mars but not dodge a palm.
```js
  v2c2b: [
    { who: 'X MARSWELL', text: "Board says the AI play is crowded. Fine. We're pivoting the whole company to MARS. Specifically: Mars-slop. We generate the slop HERE, we ship it THERE, and Mars finally has content.", shot: 'opp' },
    { who: 'YOU', text: 'Mars has no one to read it.', shot: 'player' },
    { who: 'X MARSWELL', text: "Not YET — that's a top-of-funnel problem. Look. I do rockets. I do EVs. I do a flamethrower. I posted through a hurricane. The one thing I have never once landed is a dodge. Sixty meters. Call it my first crewed launch.", shot: 'opp' },
    { who: 'YOU', text: 'Ignition.', shot: 'player' },
  ],
```

---

## Implementation notes for the orchestrator

- **Audit:** 15 line replacements across `js/campaign.js` (fixes A–K). Each is a unique `old_string` → `new_string` in a `CUTSCENES`/`WINS`/`FAILS` entry; the "KEEP" list should be left as-is.
- **Save the Fair:** replaces `f1c1`, `f4c1`, `f4c2`, `outro_f4c2` (CUTSCENES) and four `story` fields + the tour `blurb` (all in `js/campaign.js`). New nameplates `🎈 A FAIR KID` and `🌭 THE HOT DOG VENDOR` need no roster/cast work — they ride `shot:'wide'`. Motive is self-contained in copy; **no mechanic changes**, so nothing in `main.js`/`opponent.js` moves.
- **X Marswell:** one new non-boss `ROSTER` entry + one `WORLD_ROSTERS.techcampus` edit (both `js/opponent.js`); one new challenge row `v2c2b` + one `CUTSCENES.v2c2b` (both `js/campaign.js`). Uses only existing look flags (`hoodie`, `hair:'flat'`, `noStache`); the two commented flags (`rocketProp`, `emberGlow`) are optional polish and the entry renders without them. New localStorage/scene key: **`v2c2b`** (auto-handled by the seen-flag system). No SLAPPERS entry needed — he's a volunteer; Slop Valley's Sprint II runs the tour's pinned slapper (Charlie), matching the deadpan 'YOU' voice used above.
- Parody-safety: all three deliverables punch at institutions/situations (wager law, VC hype, meme-founder culture); names are invented (X Marswell, Sir Bacon-a-lot), consistent with the Tremendous Don / Mark Slopberg / Miracle Mira precedent. No real names, no copyrighted text.