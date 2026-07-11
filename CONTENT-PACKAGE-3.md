# Content package 3: narrative overhaul (2026-07-11)

I've read everything required: DESIGN-LESSONS.md (all 18, wave 3 as the brief), campaign.js in full (all 1251 lines — TOURS, CUTSCENES, FAILS/WINS/ESCAPE_FAIL/TAKEDOWN_FAIL, the stamping loop, the menu), CONTENT-PACKAGE.md §5, CONTENT-PACKAGE-2.md, the full ROSTER + gimmick idiom in opponent.js (weave/skiRun/hop/sway/headTurn/bjj branches, boss-exam block in main.js onContact 796–824, banners 856–863), SLAPPERS in player.js, and the launcher plumbing (3 attempts per match at main.js:1001, per-challenge `slapper`/`world` pins stamped at campaign.js:1143–1149, skiRun whistle/escape at main.js:1319/1396). Everything below is paste-ready in campaign.js's exact idiom.

---

# 1. THE OLYMPIC BID — full rewrite

**Design.** The story now runs on ONE engine: bureaucracy. Ring I = the Committee's three questions. Ring II = the paperwork, delivered by the one athlete alive who has beaten ALL of it — Eileen, trained in America, competing for China, a walking federation case-file. Ring III = the live final, which collapses under flag logistics, and her exit run IS the bid's last clause: "demonstrate on a world-class athlete at competition speed." She isn't fleeing the sport anymore — she's late for a hearing about her own flag, and catching her mid-pass is the demonstration. That's why the ski-catch decides Olympic status (owner note a, fixed).

**Ring II gets a 4th challenge** (Wonders Act I precedent): `o2c4` is the learnable ski-catch tutorial reusing the existing `avaskis` entry untouched (speed 1.7 + 45% brake). The finale summons a new entry, `avafullsend`, running skiRun v2.

## 1a. skiRun v2 spec (new ROSTER entry + engine numbers)

```js
  {
    key: 'avafullsend', name: 'AVALANCHE EILEEN', tag: 'BOSS · COMPETITION SPEED', boss: true,
    w: 0.8, h: 1.0, mass: 0.9, female: true, noStache: true, busty: true,
    // same red jumpsuit + beanie, goggles DOWN, skis on — but this run is REAL
    skin: 0xeecfa8, shirt: 0xd8232e, pants: 0xd8232e, noSkirt: true,
    hair: 'pony', hairCol: 0xd9a441, fringe: true, hat: 'beanie', hatCol: 0xf2ede1, bandCol: 0xd8232e,
    goggles: 0xff8c1a, gogglesDown: true,
    skis: true, skiRun: { speed: 2.7, startX: 10, exitX: -8, noBrake: true, twoLine: { z: 0.55, blendX: 3, delayB: 0.4 } },
    pickLine: 'No brake, no second pass. Read the push-off, own the pocket.',
    taunts: ['The pocket is one second wide. My schedule is tighter.', 'I have outrun three federations. You have a palm.'],
  },
```

**Engine spec (Opponent.update, skiRun branch — additive flags, v1 entries untouched):**
- `noBrake: true` → skip the `|x| < 1.4 → speed*0.55` brake-check. Pocket window drops from **3.0s** (2.8m at 0.935 m/s) to **1.04s** (2.8m at 2.7 m/s).
- `twoLine` → per-attempt alternating fixed lines, **deterministic-fair**: main.js sets `opponent.runLine = attempts.length % 2` in `startAttempt` (0 = line A, 1 = line B). **Announced by her push-off side**: from the FACEOFF pose she stands offset `z = ±twoLine.z` (A = camera side, B = far side) and her first carve swings that way at the whistle — the player reads it before she's moving. Line B additionally holds `delayB` (0.4s) at `startX` for one extra visible pole-plant before pushing off. Carve = the v1 sine but **mirror-phased per line** (`sin(t*2.2 + (line ? Math.PI : 0))`), amplitude blending from `twoLine.z` to 0 over the last `blendX` meters into the pocket (she always crosses the pocket at z≈0, hittable on both lines — principle #10, the exam stays winnable).
- Arrival at pocket: **~3.2s** (line A) / **~3.6s** (line B) after the whistle — a full S-coil (~1s) plus held wait fits either, but you cannot fire on a memorized count: you fire on what you READ. That is #18's earned difficulty.
- `beginEscape()`, `escaped()`, `ui.setClock(null)` all work unchanged.

## 1b. Tour block (replaces the `olympicbid` entry in `TOURS`)

```js
  {
    key: 'olympicbid', title: '🥇 THE OLYMPIC BID',
    // FREE and first — the front-door storyline every new player can finish
    slapper: 'victor',
    blurb: 'The county wants slapping in the Olympics. The Committee sent its three questions — and its phenom: an America-trained skier who competes for China, and who has out-filed every federation on Earth.',
    acts: [
      {
        act: 'RING I — THE THREE QUESTIONS',
        story: 'The county filed for slapping to become an Olympic sport. Commissioner Quibble arrived with the Committee\'s three questions — athletic, artistic, measurable — and a stopwatch he calls "the instrument." Answer all three on the record, and the application survives.',
        challenges: [
          { id: 'o1c1', title: 'QUESTION ONE: ATHLETIC', desc: "LAND a clean strike on HAYSEED HANK's regulation zone — the cheek — while an official watches. Question one dies without it", opp: 'hank', goal: { type: 'head' } },
          { id: 'o1c2', title: 'QUESTION TWO: ARTISTIC', desc: 'LAND a 65% chain in tempo with MAESTRO FORTISSIMO — the artistic score goes in the application, and the cello bid rides along', opp: 'maestro', goal: { type: 'chain', v: 65 } },
          { id: 'o1c3', title: 'QUESTION THREE: MEASURABLE', desc: 'SEND SLIM PETE 30m past the official tape — set the qualifying mark the rulebook will print', opp: 'slim', goal: { type: 'dist', v: 30 } },
        ],
      },
      {
        act: 'RING II — THE PAPERWORK',
        story: "The application survives, so the Committee buries it: a certified-instruction form, a sanctioned bout, and an athlete evaluation — delivered by AVALANCHE EILEEN, freeskiing's reigning phenom. Trained in America. Competes for China. She has beaten every mountain on Earth and every form the Movement owns, and she thinks your sport is a raffle.",
        challenges: [
          { id: 'o2c1', title: 'FORM 7: CERTIFIED INSTRUCTION', desc: "LAND an 80% chain before SCHOOLMARM SUSIE — the bid needs a certified instructor's signature, and she signs nothing she hasn't graded", opp: 'susie', goal: { type: 'chain', v: 80 } },
          { id: 'o2c2', title: 'FORM 12: THE SANCTIONED BOUT', desc: 'SEND GRANNY THUNDER 30m in a sanctioned exchange — you swing, she slips; she swings, you take it. The bout goes in the bid as Exhibit B', opp: 'granny', goal: { type: 'dist', v: 30 } },
          { id: 'o2c3', title: '☗ MINI-BOSS: THE ATHLETE EVALUATION', desc: "SEND AVALANCHE EILEEN 40m — Form 88 needs a Committee athlete to certify the sport touches athletes. She took the skis off. Free lesson", opp: 'ava', goal: { type: 'dist', v: 40 } },
          { id: 'o2c4', title: '☗ MINI-BOSS: THE MOVING-TARGET CLAUSE', desc: 'CATCH EILEEN mid-pass at demo speed and SEND her 6m — clause 9: an Olympic slap must land on an athlete in motion. She will even brake through the pocket', opp: 'avaskis', goal: { type: 'dist', v: 6 } },
        ],
      },
      {
        act: 'RING III — THE LIVE FINAL',
        story: "Eileen's evaluation footage hits 400 million views and the vote moves to a live final at the fair. The county owes the Committee three exhibits: an anthem moment, an official record — and clause 9 at competition speed. Then two federations, one sponsor and an anthem committee all claim the phenom's calendar at once, and she points her skis at the exit gate.",
        challenges: [
          { id: 'o3c1', title: 'THE ANTHEM MOMENT', desc: 'SCORE 550 off BIG BERTHA — the anthem committee cannot cue a county that has not roared. Make it sing', opp: 'bertha', goal: { type: 'pts', v: 550 } },
          { id: 'o3c2', title: 'THE FIRST RECORD', desc: 'SEND HAYSEED HANK 50m before the good clipboard — every Olympic sport arrives with a record for the next generation to chase', opp: 'hank', goal: { type: 'dist', v: 50 } },
          { id: 'o3c3', title: '☗ FINAL BOSS: CLAUSE 9, COMPETITION SPEED', desc: 'CATCH EILEEN at full send — no brake, read her push-off (left line or right), strike the one-second pocket and SEND her 6m. If she makes the gate, the bid leaves with her', opp: 'avafullsend', goal: { type: 'dist', v: 6 } },
        ],
      },
    ],
  },
```

## 1c. Cutscenes (replace the `olympicbid` block in `CUTSCENES`)

```js
  // ===== THE OLYMPIC BID =====
  olympicbid_prologue: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Commissioner Quibble, International Committee of Legitimate Sports. Your county has applied for slapping to become an Olympic discipline. The Committee has three questions. The Committee ALWAYS has three questions.', shot: 'wide' },
    { who: 'YOU', text: 'I built these fairgrounds with my own hands. The same hands are the sport. Ask.', shot: 'player' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'One: is it athletic? Two: is it artistic? Three: is it measurable? We rejected trampoline dressage on question three. It haunts me still.', shot: 'wide' },
  ],
  o1c1: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Question one. The Committee must witness a clean strike to the regulation zone. The cheek. The instrument is running.', shot: 'wide' },
    { who: 'HAYSEED HANK', text: 'Fourth legend this year, and now the OLYMPICS. Ma always said this cheek would go places.', shot: 'opp' },
    { who: 'YOU', text: "Hold still, Hank. This one's for the county.", shot: 'player' },
  ],
  o1c2: [
    { who: 'MAESTRO FORTISSIMO', text: 'Commissioner! Before you judge the slap — know that I am ALSO applying. Cello. OLYMPIC cello.', shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Sir, the cello is not—', shot: 'wide' },
    { who: 'MAESTRO FORTISSIMO', text: 'The cello is ATHLETIC! Have you SEEN a tremolo?! Fine — we bundle the bids. Slapper: sixty-five percent, in tempo, while I accompany. If the chain is music, BOTH sports advance.', shot: 'opp' },
  ],
  o1c3: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Question three: measurability. Every event needs a qualifying standard. The Committee proposes: thirty meters.', shot: 'wide' },
    { who: 'SLIM PETE', text: "Thirty? Sir, with respect, I done thirty by ACCIDENT. Twice. There's a plaque.", shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'The plaque is not sanctioned. Do it again, before an official.', shot: 'wide' },
  ],
  o2c1: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Round two is paperwork. Form 7: certified instruction. Form 12: a sanctioned bout. And Form 88 — evaluation by a Committee-recognized athlete. We have dispatched... the phenom. May the Movement forgive us.', shot: 'wide' },
    { who: 'SCHOOLMARM SUSIE', text: "Thirty years I've taught this county to read, to reason, and to line up single-file. If the world can watch a man slap another man into a pond, it can watch teaching. I volunteer for Form 7.", shot: 'opp' },
    { who: 'SCHOOLMARM SUSIE', text: 'Eighty percent, dear, and DIAGRAM every link. I sign nothing I have not graded, and I have never once given an A.', shot: 'opp' },
  ],
  o2c2: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Form 12. A head-to-head. Two competitors, sanctioned exchange, witnessed and stapled.', shot: 'wide' },
    { who: 'GRANNY THUNDER', text: "Then you want the '87 champion. Rules of the bout, junior: you swing, I slip. I swing... you take it. THAT's the exchange.", shot: 'opp' },
    { who: 'YOU', text: 'You still swing?', shot: 'player' },
    { who: 'GRANNY THUNDER', text: 'Ask the last commissioner. Left with one cheek red as a stop sign and gave slapping a 9.8. Time the slip, builder — make it a BOUT.', shot: 'opp' },
  ],
  o2c3: [
    { who: '⛷️ AVALANCHE EILEEN', text: 'Hold the vote! Avalanche Eileen — four golds, three world records, TWO federations, one energy drink with my face on it. The Committee asked me, the only athlete alive who has completed all the paperwork, to evaluate... whatever this is.', shot: 'opp' },
    { who: 'YOU', text: 'Two federations?', shot: 'player' },
    { who: '⛷️ AVALANCHE EILEEN', text: 'Trained in America. Compete for China. Eleven forms, two anthems memorized, and a hearing about my own passport that I was not invited to. My file has its own intern. Your bid is ONE form, builder — I filed worse before breakfast.', shot: 'opp' },
    { who: '⛷️ AVALANCHE EILEEN', text: "So here's my evaluation: if your \"sport\" can't touch a STANDING skier, it's a raffle with extra steps. I'll even take the skis off. Free lesson.", shot: 'opp' },
  ],
  o2c4: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Clause 9, applicant: an Olympic discipline must be demonstrable on an athlete IN MOTION. The trampoline dressage people never cleared clause 9. The horse did. Long story.', shot: 'wide' },
    { who: '⛷️ AVALANCHE EILEEN', text: "Relax, builder. Demo speed. I'll even brake through your little pocket — I sandbag for children, sponsors, and new sports. Read the run, catch the pocket, and clause 9 gets my signature.", shot: 'opp' },
    { who: 'YOU', text: 'One pass?', shot: 'player' },
    { who: '⛷️ AVALANCHE EILEEN', text: 'One pass is a lesson. You get as many as your dignity allows.', shot: 'opp' },
  ],
  o3c1: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Four hundred million views. The vote moves to a LIVE final — which means pageantry. The anthem committee requests guidance: for a county, do we play the state song, the fair jingle, or — heaven help us — both?', shot: 'wide' },
    { who: 'BIG BERTHA', text: "Sugar, when I get moved, the county SINGS. Five hundred fifty points — THAT's your anthem. Tell the committee it's in the key of OOF.", shot: 'opp' },
    { who: 'YOU', text: "I poured that grandstand's foundation. Let's make it shake.", shot: 'player' },
  ],
  o3c2: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Every Olympic sport arrives with a record for the next generation to chase. Set one. Officially. I have brought the good clipboard.', shot: 'wide' },
    { who: 'HAYSEED HANK', text: "A world record. Me. Ma said this cheek would go places — she meant CHURCH.", shot: 'opp' },
    { who: 'YOU', text: 'Fifty meters, Hank. The book will spell it H-A-N-K.', shot: 'player' },
  ],
  o3c3: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Disaster. BOTH federations claim Ms. Eileen\'s demonstration for their medal table. The flag office has escalated. The anthem committee has prepared three anthems and a medley. And her sponsor invoked the appearance clause — she is due at the lake office to sort out her OWN flag before she can sign yours.', shot: 'wide' },
    { who: '⛷️ AVALANCHE EILEEN', text: "So here's the run, builder. Full send, no brake, out the gate, onto a plane, into a hearing about which flag gets my Tuesday. You want clause 9 at competition speed? This is the only competition speed I have left this fiscal year.", shot: 'opp' },
    { who: 'YOU', text: 'The exit gate is behind me.', shot: 'player' },
    { who: '⛷️ AVALANCHE EILEEN', text: "I KNOW the gate is behind you. Watch the push-off — left line or right, that's all the warning anybody gets, and I do NOT slow down for the pocket. Catch the fastest paperwork problem on Earth, and your sport is Olympic. FULL SEND!", shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'For the minutes: the exhibit is departing at competition speed. The Committee has no form for this. The Committee is riveted.', shot: 'wide' },
  ],
  outro_o3c3: [
    { who: '⛷️ AVALANCHE EILEEN', text: '...I was OUT. I was nine feet from the gate. I could FEEL the boarding pass. And the slap just... found me. Mid-carve. Like weather.', shot: 'opp' },
    { who: 'YOU', text: 'I built that gate. I know exactly how long a heartbeat lasts on grass.', shot: 'player' },
    { who: '⛷️ AVALANCHE EILEEN', text: "Four golds, two federations, and this county taught me the last thing I'll ever learn about sport: you can leave the slap. The slap is not in a hurry. The slap arrives regardless. ...okay, it's kind of beautiful. I hate it. Sign me up — I'll file my own transfer. I am INCREDIBLE at transfers.", shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'The Committee is satisfied on all three questions — and moved by a fourth it never thought to ask: INEVITABILITY. The Olympic motto is Faster, Higher, Stronger. Your county has proposed an amendment: Regardless.', shot: 'wide' },
    { who: 'YOU', text: 'Regardless. Stamp it. Slapping is Olympic.', shot: 'player' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'PROVISIONALLY Olympic — the rulebook remains, and I shall be writing it here, near the pie stand. The cello enters the Cultural Olympiad; the Maestro wept in D minor. One open item: the flag office asks, in writing — when Ms. Eileen is slapped, whose medal table does the LANDING count for?', shot: 'wide' },
    // the podium beat: jingoism arrives, and the sport itself answers it
    { who: 'JUDGE PENNYWHISTLE', text: 'And for the record — YES! That is one for the United States of America! I have alerted the anthem committee. Both anthems. ALL the anthems.', shot: 'judge' },
    { who: '⛷️ AVALANCHE EILEEN', text: 'Your honor. I train in Utah. I compete for China. My skis are Austrian, my sponsor is a beverage, and the cheek you are pointing at is on county property.', shot: 'opp' },
    { who: 'YOU', text: 'American or not... does it matter, your honor?', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: '...', shot: 'judge' },
    { who: '⛷️ AVALANCHE EILEEN', text: 'Slapping has no nationality, boys. The cheek does not check your passport. That is the whole sport — I get it now.', shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'The Committee will be quoting that. On the rings. In eleven languages. Provisionally.', shot: 'wide' },
  ],
```

## 1d. FAILS.o addition + ESCAPE_FAIL rewrite

Append a third pair to `FAILS.o` (rotation handles the rest):

```js
    [{ who: '🏅 COMMISSIONER QUIBBLE', text: 'The Committee has stamped that attempt DEFERRED. There is an appeal form. I have brought it. It is blank — even the Committee cannot explain that swing.', shot: 'wide' },
     { who: 'YOU', text: 'Refile the stance. Resubmit the hips. This county gets its rings.', shot: 'player' }],
```

Replace `ESCAPE_FAIL` (it now serves both the o2c4 tutorial and the o3c3 finale):

```js
export const ESCAPE_FAIL = [
  { who: '⛷️ AVALANCHE EILEEN', text: 'WOOO! GATE! Note it for the minutes, Commissioner — the pocket was RIGHT there, and the county waved at it—', shot: 'wide' },
  { who: 'YOU', text: 'She announces the line. She announces the pocket. Next run, my palm reads the announcement.', shot: 'player' },
];
```

**ROSTER patches (existing entries):** `ava` pickLine → `'Four golds. Three records. Two federations. Zero slaps taken.'`; `avaskis` tag → `'BOSS · DEMO SPEED'`, pickLine → `'Demo speed, brake through the pocket. She is teaching, not fleeing.'`, taunts → `['Grass is just slow snow.', 'I sandbag for children and new sports. You qualify twice.']`.

## 1e. Geopolitics pass (my validator call)

Every joke lands on institutions: the flag office, the anthem committee, federation forms, appearance clauses, medal-table accounting. Eileen is never mocked FOR the switch — she's the most competent person in the campaign precisely because she survived it; the institutions are the ones who can't process a person being two things at once. No accent, costume, loyalty, or defection jokes; China is never characterized, only named as one of two federations doing identical bureaucracy. Borderline items, each with a sealed-fiction drop-in:

| Line | Risk | Sealed-fiction alternative |
|---|---|---|
| "Trained in America. Compete for China." (o2c3, blurb, o3c3 outro) | Real nations named — the owner asked for this hinge; kept | "Trained in the Mountain West. Compete for the East Alpine Federation." |
| "the lake office" (o3c3) | Soft IOC/Lausanne nod, no name — fine | keep as is (already sealed) |
| "I train in Utah... My skis are Austrian" (outro) | Real places, affectionate absurdity of assigning nationality to equipment | "I train on one mountain. I compete for another. My skis are from a THIRD." |
| Pennywhistle "one for the United States of America" (outro) | Shipped beat; the scene exists to puncture it; Eileen answers it directly | keep — this is the thesis setup |

Nothing here punches at Chinese people or China itself; recommendation: **ship the explicit version**, alternatives on file.

---

# 2. THE WONDERS OF SLAPPING — finale fix (Tick-Tock v2 as series finale)

**Slot swap:** `w2c3` = MASTER MANTIS (rival-deadpan mid-boss, snapExam stays his exam, tier-II 45m); `w3c3` = TICK-TOCK TOM v2 (bulwark, the series finale — "everything can be slapped" is now the mechanic AND the punchline, per #15).

## 2a. ROSTER patch (replaces the `clockwork` entry)

```js
  {
    key: 'clockwork', name: 'TICK-TOCK TOM', tag: 'BOSS · UNSLAPPABLE (SELF-DECLARED)', boss: true,
    w: 1.1, h: 1.02, mass: 3.2,   // solid brass all the way through — slopunit-class tonnage in a carnival body
    bounce: { period: 0.8, height: 0.16 },   // bounces in place — a confidence display, not a dodge
    // BULWARK: cumulative points across the match's 3 attempts fill a hidden
    // meter; the HUD chip shows the inverse ('IMMOVABILITY: 97%'). At zero the
    // mainspring lets go and he BLOWS AWAY downrange on a stored impulse.
    bulwark: { threshold: 900, label: 'IMMOVABILITY' },
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

## 2b. New goal type `'bulwark'` — exact spec

- **State:** `let bulwarkPts = 0;` in main.js, reset in `startTourChallenge` (retry = the meter refills — the drama is per-match).
- **Accrual:** in `showResult`, `if (opponent.arch.bulwark && !isFoul) bulwarkPts += pts;` — pts are the normal `dist × mass × 10`, counted 1:1 into the meter (the "×1 proxy"). At mass 3.2 a solid slap moves him ~9–12m → ~290–380 pts/attempt → **threshold 900 ≈ three good slaps or two great ones across the match's 3 attempts** (main.js:1001). Every point you land stays landed.
- **Goal check** (campaign.js `checkAttempt` — main.js passes `bulwarkPts` in the payload): add `(g.type === 'bulwark' && (bulwarkPts || 0) >= g.v) ||` to the `met` chain. Keep `goal.v` and `arch.bulwark.threshold` at the same 900 (HUD reads the arch, the verdict reads the goal — one comment noting they must match).
- **HUD chip** (top-anchored under `challengeBar` per the layout guardrails, never on refBar): **`IMMOVABILITY: ${Math.max(0, Math.ceil(100 - bulwarkPts / 9))}%`** — counts down at each landing; at 0 it flashes **`SPRUNG!`** and the wind key spins backward.
- **Transform stages** (#3's payoff loop, driven off the meter %): 100–75 smug (normal taunts, steady bounce); 74–40 paint chips (spawn chip particles per landing, paintedGrin dulls); 39–1 rattling (bounce period 0.8 → 0.55 stutter, rattle sfx); **0 = the mainspring lets go** — on the crossing attempt's landing, re-launch at cap power (`30`) along the flight dir with full fanfare (`sfx.fanfare`, `stage.shake(0.5)`), the dramatic blow-away.
- **Feedback banner** on non-final landings: `ui.slapBurst('ABSORBED!', 'IMMOVABILITY ' + pct + '% — EVERY POINT STAYS LANDED')` (the banner, not `#smack`).

## 2c. Rewritten rows + act stories

```js
      {
        act: 'REEL II — THE COLLECTION GROWS',
        story: 'The tape leaked. Forty million views. The Institute wants rarer specimens, the Influencer has invited herself into frame — and a rival narrator in a green robe has begun reviewing the footage. Aloud. In everyone\'s presence.',
        challenges: [
          // w2c1, w2c2, w2c4 unchanged
          { id: 'w2c3', title: '☗ BOSS: THE RIVAL DEADPAN', desc: 'SLAP MASTER MANTIS 45m — LAND a true SNAP on every swing that counts; a lazy arm he files under narration', opp: 'mantis', goal: { type: 'dist', v: 45 } },
        ],
      },
      {
        act: 'REEL III — THE IMMOVABLE OBJECT',
        story: 'The specimens critique. The specimens perform. And the Institute\'s crown specimen has declared itself — its word — UNSLAPPABLE. In engraving. Since 1911. The series ends where science ends: at the one specimen that cannot be moved. Yet.',
        challenges: [
          // w3c1, w3c2, w3c4 unchanged
          { id: 'w3c3', title: '☗ FINAL BOSS: THE UNSLAPPABLE SPECIMEN', desc: "DRAIN TICK-TOCK TOM's IMMOVABILITY from 100% to zero — every point you land stays landed, across all three attempts", opp: 'clockwork', goal: { type: 'bulwark', v: 900 } },
        ],
      },
```

## 2d. Scenes (replace `w2c3`, `w3c3`, `outro_w3c3`; delete nothing else)

```js
  w2c3: [
    { who: 'MASTER MANTIS', text: 'I have seen your little film, biologist. Forty million views, and not one of them noticed: you narrate the palm as if it were a beetle. I have narrated MEN as if they were weather.', shot: 'opp' },
    { who: 'YOU', text: 'A rival deadpan enters the study. He critiques the observer. Note the audacity — and the robe. The robe is excellent. This is not admiration. It is taxonomy.', shot: 'player' },
    { who: 'MASTER MANTIS', text: 'Then observe closely. Only a genuine SNAP moves a master — on EVERY swing. A lazy arm is not a slap. It is merely... narration.', shot: 'opp' },
    { who: 'YOU', text: 'We shall learn whose voice stays flat when the other cracks the air. Roll camera.', shot: 'player' },
  ],
  w3c3: [
    { who: '🎬 DIRECTOR VANE', text: 'THE finale, Charlie. The Institute\'s crown specimen. It has declared itself — its word — UNSLAPPABLE. It has been declaring it since 1911. To everyone. At length.', shot: 'wide' },
    { who: 'TICK-TOCK TOM', text: 'UNSLAPPABLE! Note the bounce. A lesser machine stands still. I bounce because I have ENERGY TO SPARE. Slap me all century, biologist — the mainspring keeps the change.', shot: 'opp' },
    { who: 'YOU', text: 'Fascinating. The specimen advertises its own invulnerability. Rhythmically. In nature this is called a display. In science, it is called a hypothesis.', shot: 'player' },
    { who: 'TICK-TOCK TOM', text: 'The meter reads ONE HUNDRED PERCENT IMMOVABLE. The meter is riveted to my chest. I also am riveted. Everything about me is riveted!', shot: 'opp' },
    { who: 'YOU', text: 'Then we test it to zero. Every point stays landed, specimen. Science is patient, and the meter is honest. Roll camera.', shot: 'player' },
  ],
  outro_w3c3: [
    { who: 'TICK-TOCK TOM', text: 'REVISION! REVISION TO THE ENGRAVING! Unslappable, ASTERISK: cumulatively, over time, by a PROFESSIONAL—', shot: 'opp' },
    { who: '🎬 DIRECTOR VANE', text: "HE'S AIRBORNE! The crown specimen is AIRBORNE, Charlie! A hundred and fifteen years of tick and the spring finally said TOCK! Say something for the film! Something HISTORIC!", shot: 'wide' },
    { who: 'YOU', text: '...', shot: 'player' },
    { who: 'YOU', text: 'And as we can see, everything can in fact be slapped.', shot: 'player' },
    { who: '🎬 DIRECTOR VANE', text: "...that's the poster. That's the POSTER, Charlie. That's a wrap on the Field Guide — fifty million views and a full stop.", shot: 'wide' },
    { who: 'TICK-TOCK TOM', text: '(distant) STILL! NINETY! PERCENT! PAINT!', shot: 'wide' },
    { who: 'YOU', text: 'The Field Guide is complete. The palm is neither cruel nor kind. It coils, it travels, it lands, it rests. Roll credits.', shot: 'player' },
  ],
```

**One-word collision patch:** w3c2's Vane line says `'Series finale.'` — now that w3c3 is the finale, change to `'Penultimate reel. I need a MIRACLE.'` **Migration note:** strip `'w2c3','w3c3','outro_w3c3'` (and the section-1/3 rewritten ids `'o2c3','o3c3','outro_o3c3','f1c1','f4c1','f4c2','outro_f4c2','v3c1','a3c3'`) from `localStorage.slapp_seen` once, or existing players never see the new scenes.

---

# 3. SAVE THE FAIR — the wager thread

Don now opens the campaign with a lawyer-drafted public wager; every act's copy cites its clauses; the judge's 6-second finale IS the final clause (Don wrote it with the judge's pen); the outro is the on-camera permit tear + instant rebrand. Kept: glowsticks, Iron-Jaw's "I was talking about your plan," Granny's casserole coupons, the hot-dog witness, the birdhouse.

## 3a. Blurb + act stories + descs (replace in the `fair` entry)

```js
    blurb: "Tremendous Don Enterprises filed to pave the fairground into Parking Structure Seven. Then Don smelled a camera and made it interesting: a public WAGER, drafted by his lawyers, signed on the hood of a bulldozer.",
```

```js
        act: 'ACT I — THE WAGER',
        story: 'Don arrived with cameras and a contract: the county names one champion. Clear every trial in the wager and Don tears the paving permit ON CAMERA. Fail one, and the bulldozers roll. His lawyers smiled all through the signing. Clause one: prove anyone cares.',
        challenges: [
          { id: 'f1c1', title: 'CLAUSE 1(a): PACK THE STANDS', desc: 'SCORE 350 off BIG BERTHA — clause 1(a): "demonstrate that anyone cares." When the county\'s favorite aunt roars, the county roars', opp: 'bertha', goal: { type: 'pts', v: 350 } },
          { id: 'f1c2', title: 'CLAUSE 1(b): GO VIRAL', desc: 'SEND THE INFLUENCER 55m — clause 1(b): "the fair shall demonstrably trend." If it trends, it stands', opp: 'influencer', goal: { type: 'dist', v: 55 } },
          { id: 'f1c3', title: '☗ BOSS: CLAUSE 1(c), THE APPRAISAL', desc: "SCORE 300 off THE ASSESSOR in five seconds a swing — survive Don's own appraiser, on Don's own meter", opp: 'judge', goal: { type: 'pts', v: 300 } },
        ],
```

```js
        act: 'ACT II — CLAUSE TWO: THE WITNESSES',
        story: 'Clause two, subsection "testimony": every witness Don bought stays bought unless persuaded otherwise. His consultants deposed half the county. Some witnesses can be un-bought at thirty meters.',
        challenges: [
          { id: 'f2c1', title: 'HOSTILE WITNESS', desc: "SEND RAVIN' RAY 30m — he took glowsticks to testify against us; thirty meters and he recants everything", opp: 'ravinray', goal: { type: 'dist', v: 30 } },
          { id: 'f2c2', title: 'FUNDRAISER FRENZY', desc: "SCORE 500 off BIG HOSS — the wager's filing fees are extortionate, and Don's lawyers bill by the objection", opp: 'hoss', goal: { type: 'pts', v: 500 } },
          { id: 'f2c3', title: '☗ BOSS: THE UNGRIPPABLE MAN', desc: "LAND a PERFECT palm on every slap that counts — anything less slides off GREASED PETE (×0.45). Send Don's un-fireable consultant 50m", opp: 'grease', goal: { type: 'dist', v: 50 } },
        ],
```

```js
        act: 'ACT III — CLAUSE THREE: FORM BEYOND REPROACH',
        story: 'Clause three, lifted word for word from the county charter: "form beyond reproach" — graded by certified faculty, verified by a foreman who does not blink, defended by a retired champion Don pays in casserole coupons. The bulldozers idle at the gate while his lawyers count your percentages.',
        challenges: [
          { id: 'f3c1', title: 'READ THE FINE PRINT', desc: 'LAND an 85% chain before SCHOOLMARM SUSIE — clause three demands form beyond reproach, graded in red ink', opp: 'susie', goal: { type: 'chain', v: 85 } },
          { id: 'f3c2', title: 'JAWBREAKER', desc: 'MOVE IRON-JAW McGRAW 28m — LAND 70%+ form on every slap that counts; below it the foreman will not even blink (×0.12)', opp: 'ironjaw', goal: { type: 'dist', v: 28 } },
          { id: 'f3c3', title: '☗ BOSS: GRANNY THUNDER', desc: 'SEND GRANNY THUNDER 35m — time her slip and LAND 60%+ form on every slap that counts; weak form bores the champion (×0.12)', opp: 'granny', goal: { type: 'dist', v: 35 } },
        ],
```

```js
        act: 'EPILOGUE — THE FINAL CLAUSE',
        story: 'One clause left — the small print nobody read aloud at the signing. Then the blueprints turned up in Judge Pennywhistle\'s gavel case, signed three weeks before the wager was drafted, witnessed by a hot dog. Don never meant to lose. He wrote the final clause himself, with the judge\'s pen: six seconds a swing, against the bench.',
        challenges: [
          { id: 'f4c1', title: 'FOLLOW THE MONEY', desc: 'SCORE 400 off TREMENDOUS DON — he swore on camera you would never touch him. The wager says otherwise', opp: 'don', goal: { type: 'pts', v: 400 } },
          { id: 'f4c2', title: '☗ FINAL BOSS: THE IMPOSSIBLE CLAUSE', desc: "SCORE 350 off JUDGE PENNYWHISTLE in six seconds a swing, with 50%+ form on every slap that counts — the final clause, in its author's own handwriting", opp: 'pennywhistle', goal: { type: 'pts', v: 350 } },
        ],
```

## 3b. Cutscenes (replace f1c1, f1c2 line 3, f1c3 line 3, f2c1 line 1, f2c2 line 1, f3c1 line 1, f4c1, f4c2, outro_f4c2 — f2c3, f3c2, f3c3 stay)

```js
  f1c1: [
    { who: 'TREMENDOUS DON', text: 'Beautiful fairground. Terrible fairground. My people are paving it — Parking Structure Seven, the greatest of the sevens. BUT. I am, famously, a sportsman. So: a wager. My lawyers wrote it. It is TREMENDOUSLY fair.', shot: 'wide' },
    { who: 'JUDGE PENNYWHISTLE', text: 'The county names one champion. Clear every trial in this contract and Mr. Don tears the paving permit to pieces ON CAMERA. Fail one... Parking Structure Seven. I have notarized it. The pen was gold. I kept the pen.', shot: 'judge' },
    { who: 'YOU', text: 'Give me the contract.', shot: 'player' },
    { who: 'TREMENDOUS DON', text: "Clause one, champ: prove anyone CARES about this place. Cameras are rolling. They're my cameras. Wave.", shot: 'wide' },
    { who: 'BIG BERTHA', text: 'For the fair? Sugar, swing like you mean it.', shot: 'opp' },
  ],
```

f1c2 — replace the Influencer's last line:
```js
    { who: 'THE INFLUENCER', text: "For clause 1(b), bestie: 'the fair shall demonstrably trend.' I ANNOTATED the wager. Fifty-five meters minimum or it won't clip well.", shot: 'opp' },
```

f1c3 — replace the Assessor's last line:
```js
    { who: 'THE ASSESSOR', text: 'Very well. Clause 1(c): the champion survives MY appraisal. Five seconds a swing — my parking meter is running, and Mr. Don validates.', shot: 'opp' },
```

f2c1 — replace the Judge's opening line:
```js
    { who: 'JUDGE PENNYWHISTLE', text: "Clause two, champ: every witness Don bought stays bought unless 'persuaded otherwise.' His consultants paid Ravin' Ray to testify the fair is 'basically a warehouse rave — rezone it.'", shot: 'judge' },
```

f2c2 — replace the Judge's opening line:
```js
    { who: 'JUDGE PENNYWHISTLE', text: "The wager has filing fees, champ — Don's lawyers bill by the OBJECTION. Defense funds grow on points, and our biggest draw is the big man. Folks pay just to watch him not move.", shot: 'judge' },
```

f3c1 — replace the Judge's opening line:
```js
    { who: 'JUDGE PENNYWHISTLE', text: 'Clause three, champ — lifted word for word from the county charter: "form beyond reproach, graded by certified faculty." Don\'s lawyers thought it sounded impossible. They had not met the faculty.', shot: 'judge' },
```

```js
  f4c1: [
    { who: 'TREMENDOUS DON', text: "So you cleared my clauses. MY clauses! That's how good my lawyers are — even the losing side is winning. Anyway, I found a problem with the wager: me. I'm contesting it.", shot: 'opp' },
    { who: 'YOU', text: 'The blueprints were signed three weeks before the wager, Don. You never meant to tear anything.', shot: 'player' },
    { who: 'TREMENDOUS DON', text: "Fake blueprints! Beautiful fake blueprints — the best fake blueprints. Four hundred points says you never touch me. THAT clause I'll honor. Probably.", shot: 'opp' },
  ],
  f4c2: [
    { who: 'YOU', text: 'The final clause, your honor. "Three hundred fifty points off a sitting judge, six seconds a swing." Strange thing for Don\'s lawyers to write.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: "They didn't. I did. With my own pen — well, Don's pen. Gold. The theory being that nobody, in the whole history of jurisprudence, has ever slapped the bench inside six seconds.", shot: 'opp' },
    { who: 'YOU', text: 'You ate the witness, your honor. The hot dog. Mid-testimony.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'I was under oath to be honest about my hunger. Very well — the whistle presides. Six seconds. Objection: everything.', shot: 'opp' },
  ],
  outro_f4c2: [
    { who: 'JUDGE PENNYWHISTLE', text: 'The court finds itself... guilty. Extraordinarily guilty. The whistle is hereby returned to the county.', shot: 'judge' },
    { who: 'TREMENDOUS DON', text: 'AND THE WAGER IS HONORED! Look at me — on camera — tearing this permit into beautiful pieces. THIS IS WHY THEY CALL ME A MAN OF MY WORD. They will now.', shot: 'wide' },
    { who: 'YOU', text: 'You lost, Don.', shot: 'player' },
    { who: 'TREMENDOUS DON', text: 'I PIVOTED. "Save the fair" was MY idea — the wager, the trials, the champion? I built that arc. We\'re rebranding it Tremendous Fairground Rescue, presented by Don. The plaque is already up. Big, beautiful plaque.', shot: 'wide' },
    { who: 'JUDGE PENNYWHISTLE', text: 'The fair stands. Parking Structure Seven shall be built as a birdhouse. Case dismissed.', shot: 'judge' },
  ],
```

Killed beats (didn't pay the wager): old f1c1 "assessment of whether anyone cares" framing (absorbed into the wager), old f4c1 low-ceilings/food-court rant, the old epilogue's council-vote framing.

---

# 4. OPEN PALM — `calledShot` (the aim exam)

## 4a. Mechanic spec — exact numbers + hooks

ROSTER patch (`dale`): add `calledShot: { margin: 0.02, cqMin: 95 }`, tag → `'BOSS · CALLS HIS CHEEK'`, pickLine → `'Never been slapped. He will even tell you WHERE. Sugar.'`, taunts → `['HIGH cheek. Told you. Still missed.', 'I call it, you miss it. The system works.', 'Four hundred palms. One jar of tears.']`. `weave` stays — the slip is WHEN, the call is WHERE.

- **The call** (main.js `startAttempt`, after arch known): `calledHigh = arch.calledShot ? attempts.length % 2 === 0 : null;` — attempt 1 HIGH, 2 LOW, 3 HIGH. Deterministic, and **announced**, so it's fair without being memorization (#10/#13).
- **Announcement** at the exact FACEOFF→SWING frame (same spot the whistle fires): `ui.slapBurst(calledHigh ? 'DALE CALLS: HIGH CHEEK!' : 'DALE CALLS: LOW CHEEK!', 'ONLY THE CALLED HALF COUNTS — LAND IT FLUSH')` + stance telegraph: layer `±0.05` on the head's y during his pocket phase (chin-up = HIGH, extra crouch = LOW) so the call is readable with the HUD off (#1's spirit).
- **onContact hook** — in the boss-mechanics block, after the headTurn lines (main.js ~813), reusing the cq machinery already computed at 762–771:

```js
  // calledShot (DODGY DALE): he calls a cheek half before the swing — only a
  // flush hit inside the called half counts. Aim is the exam: high/low reads
  // off hit.point.y vs the head center; the cq machinery prices the flushness.
  const cs = opponent.arch.calledShot;
  const csDy = hit.part === 'head' ? hit.point.y - hit.center.y : 0;
  const inCalledHalf = calledHigh === null || (calledHigh ? csDy >= cs.margin : csDy <= -cs.margin);
  const wrongCheek = !!(cs && !ugly && hit.part === 'head' && (!inCalledHalf || Math.round(cq * 100) < cs.cqMin));
  if (wrongCheek) power *= 0.2;
```

Banner (in the else-if chain, above the plain head case): `else if (wrongCheek) ui.slapBurst('WRONG CHEEK!', calledHigh ? 'HE CALLED HIGH — UPPER HALF, FLUSH' : 'HE CALLED LOW — LOWER HALF, FLUSH');`

**Numbers rationale.** `margin 0.02` = a 2cm dead-band at the equator so a line-ball never punishes ambiguously. `cqMin 95` is reachable — a hit 3cm into the called half with square incidence grades cq ≈ 97 (vAlign ≈ 0.85 against the R·0.45 ≈ 0.19 normalizer) — but rim catches fail it, and per the CLAUDE.md study note, first-frame contact naturally lands near the rim (offFrac .74–.98): deliberately *aiming* the arc into the half is exactly the skill being examined. Success path is full power, so the 60m goal's ceiling is unchanged; only misses fail harder (×0.2 ≈ 12m).

## 4b. a3c3 row + scene (the scroll's graduation)

```js
          { id: 'a3c3', title: '☗ BOSS: CALL THE FOURTH FORM', desc: 'CATCH DODGY DALE on the half he calls — HIGH or LOW, announced at the whistle — and SEND him 60m. The wrong half slides off his grin (×0.2)', opp: 'dale', goal: { type: 'dist', v: 60 } },
```

```js
  a3c3: [
    { who: '👻 MASTER SLEE', text: "The last guardian. I taught him to dodge, the year before I died. He's been dodging ever since — and announcing it since birth.", shot: 'spirit' },
    { who: 'DODGY DALE', text: "Four hundred palms came for this cheek. I keep the tears in a jar. And because I'm a GENTLEMAN, I'll even call it — high cheek or low, out loud, before you swing. Nobody has ever hit the called half.", shot: 'opp' },
    { who: '👻 MASTER SLEE', text: 'Listen, student. The Fourth Form was never speed. It is INTENT — one palm, one destination, spoken aloud before the swing. He is not mocking you. He is teaching my last lesson.', shot: 'spirit' },
    { who: 'YOU', text: 'Then call it, guardian. And hold as still as the truth allows.', shot: 'player' },
  ],
```

`outro_a3c3` stays — "it's the hand you finally unclench" now reads as intent fulfilled.

---

# 5. NIGHT OF SLAPS — repetition purge (diff list, live campaign.js)

The owner's "graveyard closes at midnight" is the *midnight-gates* motif — it appears three times (blurb L165, Act I story L169, prologue L623), plus six more desc↔scene verbatim echoes where the same joke lands twice on screen. Diffs (old → new; everything not listed stays):

1. **L169 Act I story** `'…The gates lock at midnight, and per bylaws nobody has ever read…'` → `'You stayed for one last funnel cake. Midnight found the gates already chained — and per bylaws nobody has ever read, the only way out is to headline the Night Fair.'` (blurb keeps the phrase; it says it once now)
2. **L623 prologue, YOU** `"The gate's locked. The sign says the fair closed at midnight."` → `"The gate's locked. The sign says CLOSED, in a font that means it."`
3. **L187 act title** `'ACT III — MOWING TIME'` duplicates the n3c3 boss title → `'ACT III — WHEN THE MOWER STOPS'` (the boss keeps MOWING TIME — it's the stronger slot)
4. **n1c1 desc** `"…aim for the face, it's the big orange one"` duplicates Joe's scene line → `"LAND a clean slap on JACK O'LANTERN JOE's carved cheek — every headliner auditions on the greeter"` (Joe keeps the joke)
5. **n1c3 desc** `"…don't worry, he grows back"` triples with Joe's pickLine + n1c1 scene → `"SEND JACK O'LANTERN JOE 30m into the pumpkin patch — headliners get measured in patch lengths"`
6. **n2c1 desc** `'…no lungs, no drag, no fear'` duplicates Tony's roster taunt (fires mid-match in the same campaign) → `'SEND BONY TONY 60m — forty years of waiting, zero wind resistance'`
7. **n2c3 desc** `'…the record wall says CLETUS, 1961. Tonight it says TONY.'` duplicates Tony's scene line → `'SEND BONY TONY 75m — beat the 1961 mark on the record wall while its owner heckles'`
8. **n3c1 desc** `'…the organ must NEVER win'` duplicates the Maestro's scene closer → `'LAND an 88% chain before MAESTRO FORTISSIMO — give the finale its percussion, in tempo'`
9. **n3c2 desc** `"…don't land him on the lawn"` duplicates Joe's scene closer → `"SEND JACK O'LANTERN JOE 65m — clear the idle mower with margin; the lawn beneath it is spoken for"`
10. **L672, Reaper (n3c3 scene)** opens `'Four hundred years, tramper.'` three lines after `"Four hundred years I've kept these grounds."` → `'In all that time, do you know how many souls have touched me? None. Kings begged pardon at forty paces. Ghosts file around me. Even the skeletons wave from across the lawn — and they have NO sense of self-preservation. They are the least preserved people I know.'` (the outro's "Four hundred years." stays — that one is an earned callback)
11. **FAILS.n pair 2, YOU** `'One more swing before mowing time.'` (third "mowing time") → `'Set it up again. The lawn can wait one more act.'`

**Intentional, kept:** Joe's prologue double ("…on the lawn at mowing time. Nobody wants to be on the lawn at mowing time.") is rhetoric inside one line, not a repeat; "headliner" is the campaign's spine word, functional not a joke.

---

# 6. SLOP VALLEY — story + lead handoff

## 6a. The new slapper (`SLAPPERS`, js/player.js — DLC block)

```js
  {
    key: 'dario', name: 'DR. DARIO SLAPMODEI', desc: 'Wrote the safety memos. Nobody read them. The palm, however, scales.',
    skin: 0xe6c0a0, shirt: 0x3f5a7a, pants: 0x6e6a5e,   // plain steel-blue oxford, khaki slacks — no hoodie in this valley
    hair: 'frizz', hairCol: 0x241d18, beard: null,       // dark curls, clean-shaven
    height: 0.97, arm: 1.03, power: 1.04,
    locked: true, price: 4,
  },
```

Distinctness check: Vance = hoodie + lanyard + flat hair; Mira = white suit + ponytail; Slopberg = gray tee + pale + brown frizz; **Dario = steel-blue oxford + near-black curls + modest everything.** Name follows the Slopberg/Slee direct-parody precedent; sealed-fiction alternate if the owner wants more distance: `'DR. SOL SCALING'`. Parody surface: safety memos, scaling laws, eval culture, resignations-as-memos — institutions only.

## 6b. Blurb + act stories (replace in `slopvalley`; Act III rows gain `slapper: 'dario'` pins — supported by the stamping loop, challenge pin wins)

```js
    blurb: 'A glass ring the size of the county landed next door and started generating everything. Charlie films it. Then the lab\'s own chief scientist reads his last safety memo aloud, quits on the pitch stage, and picks up the one technology that never hallucinates: the palm.',
```

```js
        act: 'SPRINT I — THE DISRUPTION',
        story: 'The pasture next door is now the SynerCorn campus: one perfect glass ring with no corners — corners are friction — generated corn, PDF lemonade, a fortune chatbot. The fair is empty, the documentary crew is not, and the founder wants to buy your palm: the only asset in the valley that cannot be generated.',
```
```js
        act: 'SPRINT II — FOUNDER MODE',
        story: 'Demo day approaches. The stock did a backflip, the board flew in Miracle Mira for credibility, and somewhere inside the ring a chief scientist named Dr. Slapmodei keeps circulating safety memos titled "The Models Are Getting Slappier." Nobody reads them. He counts the reads.',
```
```js
        act: 'SPRINT III — DEMO DAY',
        story: 'Demo day, on the pitch stage at the heart of the glass ring. Vance wheels out AGI — a robot the size of a shed that mostly generates apologies. And the chief scientist walks to the microphone, resigns in one sentence, and asks to borrow the stage: "I have a technique that is aligned, interpretable, and lands every time." He is yours for the finale — up to and including the mansion on the hill.',
        challenges: [
          { id: 'v3c1', title: 'HUMAN EVAL', desc: 'LAND an 88% chain before SCHOOLMARM SUSIE — the opposite of slop, every link handwritten', opp: 'susie', slapper: 'dario', goal: { type: 'chain', v: 88 } },
          { id: 'v3c2', title: 'THE LAST PIVOT', desc: 'SEND VISIONARY VANCE 75m off the pitch stage — the most authentic content this valley has ever produced', opp: 'vance', slapper: 'dario', goal: { type: 'dist', v: 75 } },
          { id: 'v3c3', title: '☗ BOSS: S.L.O.P. UNIT-1', desc: 'SCORE 480 off S.L.O.P. UNIT-1 in 6 seconds of compute a swing — LAND 70%+ form on every slap that counts, or it gets discarded as training data (×0.12)', opp: 'slopunit', slapper: 'dario', goal: { type: 'pts', v: 480 } },
          { id: 'v3c3g', title: 'THE GARDEN TOUR', desc: 'SEND MARK SLOPBERG 45m over his own palm trees — he wants to see the herd from above', opp: 'slopberg', slapper: 'dario', goal: { type: 'dist', v: 45 } },
          { id: 'v3c4', title: '☗ FINAL BOSS: MARK SLOPBERG', desc: 'SLAP MARK SLOPBERG 40m — when the arms come UP he is reaching, and a slap into the reach gets TAKEN DOWN. Swing between the reaches', opp: 'slopbergboss', slapper: 'dario', goal: { type: 'dist', v: 40 } },
        ],
```

## 6c. The handoff scene (replace `v3c1`; YOU = Dario via the pin) + one glass-ring patch

```js
  v3c1: [
    { who: 'YOU', text: 'Memo forty-one: the models are getting slappier. Memo forty-two: I quit. Memo forty-three: watch this.', shot: 'player' },
    { who: 'SCHOOLMARM SUSIE', text: 'They hired me to grade the machine\'s homework. Forty thousand essays. Every single one ended with "in conclusion, in conclusion."', shot: 'opp' },
    { who: 'YOU', text: 'I trained that model, madam faculty. I scaled it. And here is my final finding: capability without form is slop. Grade ME — eighty-eight percent, every link handwritten, fully interpretable.', shot: 'player' },
    { who: 'SCHOOLMARM SUSIE', text: 'See me after class — that was the MACHINE\'s grade. Show me the opposite, doctor. THAT goes on the fridge.', shot: 'opp' },
  ],
```

Small patches for continuity: in `slopvalley_prologue`, Vance's first line gains the ring — `'Next door, friend! SynerCorn campus. One perfect glass RING — no corners, corners are friction. We disrupted your fair: generated corn, PDF lemonade, a fortune chatbot. Everything yours, but at SCALE, and also worse.'` In `v3c3`, add one Dario beat after YOU's "It mostly generates apologies." line: `{ who: 'YOU', text: 'I wrote its apology module. This is closure.', shot: 'player' },`. Charlie's Sprint I–II scenes, v3c2/v3c3g/v3c4 YOU-lines, WINS.v/FAILS.v all read correctly in either voice — verified line by line; no other changes needed.

---

# 7. ACTIVE-VERB PASS — full replacement list (every desc failing #13, all tours)

Descs already rewritten in §§1–6 are not repeated here. Old → new:

**palm**
- a1c1 `"A clean slap on HAYSEED HANK's cheek — the honest standard"` → `"LAND a clean slap on HAYSEED HANK's cheek — Form One begins at the honest standard"`
- a2c3 `'500 points off BOULDER BOB'` → `'SCORE 500 off BOULDER BOB — weight only answers weight; bring the whole chain'`
- a3c1 `'A 90% chain before MAESTRO FORTISSIMO — every link in tune'` → `'LAND a 90% chain before MAESTRO FORTISSIMO — play every link in tune; he can hear a flat swivel from the parking lot'`

**wonders**
- w1c1 `'A clean head slap on HAYSEED HANK — establish the baseline'` → `'LAND a clean head slap on HAYSEED HANK — establish the baseline for the whole Field Guide'`
- w3c1 `'A 90% chain before MAESTRO FORTISSIMO — the specimen grades the observer'` → `'LAND a 90% chain before MAESTRO FORTISSIMO — the specimen grades the observer; give him nothing to mark'`
- w3c4 `'A flush cheek strike on HEAD-TURNING HORTON at 30m — catch the face mid-turn, incoming.'` → `"CATCH HEAD-TURNING HORTON's face mid-turn, incoming, and SEND him 30m — flush on the sweep, like greeting a lighthouse"`

**secondwind**
- b1c1 `'A clean head slap on HAYSEED HANK — no want, no fear'` → `'LAND a clean head slap on HAYSEED HANK — no want, no fear, no borrowed force'`
- b2c3 `'Move IRON-JAW McGRAW 30m — below 70% chain he grants you nothing'` → `'MOVE IRON-JAW McGRAW 30m — LAND 70%+ form on every slap that counts; below it he grants you nothing (×0.12)'`
- b3c2 `"A 90% chain before SCHOOLMARM SUSIE — Chuck's porch has a sign-in sheet"` → `"LAND a 90% chain before SCHOOLMARM SUSIE — sign Chuck's porch sheet in red ink"`

**nightofslaps** — n1c1, n1c3, n2c1, n2c3, n3c1, n3c2 covered in §5; plus:
- n3c3 `'Score 500 off THE GREEN REAPER — 7 seconds a swing, and sloppy form gets re-mowed'` → `'SCORE 500 off THE GREEN REAPER inside 7 seconds a swing — LAND 65%+ form on every slap that counts, or be re-mowed (×0.12)'`

**slaptherapy**
- t1c1 `'A clean head slap on INKBLOT IAN — the face must remember it is a face'` → `'LAND a clean head slap on INKBLOT IAN — remind the face it is a face'`
- t2c3 `'An 80% chain before INKBLOT IAN — the result must replicate'` → `'LAND an 80% chain before INKBLOT IAN — replicate the finding or lose the paper'`
- t3c2 `'Score 480 off DR. FREUDENSCHADE — below 75% form he interprets the slap away'` → `'SCORE 480 off DR. FREUDENSCHADE — LAND 75%+ form on every slap that counts; below it he interprets the blow away (×0.12)'`
- t4c1 `"A flush cheek strike on JACK O'LANTERN JOE at 30m — the mask must be met head-on"` → `"MEET the mask head-on: LAND a flush strike on JACK O'LANTERN JOE's carved cheek and SEND him 30m"`
- t4c3 `'Score 500 off THE GREEN REAPER — 7 seconds a swing, 65% form, and this appointment cannot be deferred again'` → `'SCORE 500 off THE GREEN REAPER inside 7 seconds a swing, with 65%+ form on every slap that counts — this appointment cannot be deferred again'`

**slopvalley**
- v1c1 `'A clean head slap on VISIONARY VANCE — consider it a live demo'` → `'LAND a clean head slap on VISIONARY VANCE — he calls it a live demo; make it a proof'`
- v2c1 `'A 75% chain before MIRACLE MIRA — she would know a fake. Professionally.'` → `'LAND a 75% chain before MIRACLE MIRA — she would know a fake. Professionally.'`

**commedia**
- c1c1 `'A clean head slap on LOW-LEVEL LARRY — 400 years in complaints, one witnessed slap from his transfer'` → `'LAND a clean head slap on LOW-LEVEL LARRY — witness the one slap his 400-year transfer needs'`
- c1c3 `'Score 360 off JUDGE PENNYWHISTLE — community service, six seconds a swing, and nothing down here is expedited'` → `'SCORE 360 off JUDGE PENNYWHISTLE in six seconds a swing — LAND 50%+ form on every slap that counts; nothing down here is expedited'`
- c2c1 `'An 85% chain before MAESTRO FORTISSIMO — one honest slap, in tempo, releases him upward'` → `'LAND an 85% chain before MAESTRO FORTISSIMO — one honest slap, in tempo, releases him upward'`
- c2c3 `'Move CUSTODIAN CATO 28m — below 65% form you are litter, and he sweeps litter DOWN'` → `'MOVE CUSTODIAN CATO 28m — LAND 65%+ form on every slap that counts, or be swept DOWN as litter (×0.12)'`
- c3c3 `'Slap VIRGIL 40m — 60% form minimum, and mind the sidestep; he invented the sidestep'` → `'SLAP VIRGIL 40m — LAND 60%+ form on every slap that counts, and time the sidestep; he invented it'`

(fair and olympicbid: fully covered in §§1, 3. Boss-gate descs now all state the form is needed **on every slap that counts**, with the discount visible.)

---

# 8. EXPERIENCE VALIDATION (self-review vs #12–18)

- **OLYMPIC BID — PASS.** Every trial is a named question/form/clause (#14), the finale is the hardest read-and-react in the game with its tutorial planted at o2c4 (#18), the boss embodies the theme — bureaucracy on skis (#15), and the paperwork farce climaxes on the thesis line. Weird, quotable, clip-able ("the Committee is riveted").
- **WONDERS — PASS.** The finale now IS the premise (#15): a boss who transforms in four stages and blows away into the documentary's title card. The '...' beat as its own line is the viral frame.
- **SAVE THE FAIR — PASS.** The wager recurs in every act's copy and scenes (#14), the 6-second clock reads as its author's own trap, and Don's tear-plus-rebrand is the payoff his character was built for (#12).
- **OPEN PALM — PASS.** calledShot makes the Fourth Form = announced intent; the mechanic is the last lesson (#4/#15). Fair by announcement, brutal by cq (#10).
- **NIGHT OF SLAPS — PASS** after §5's eleven diffs (#17 was the only failing principle; the arc itself already lands).
- **SLOP VALLEY — PASS**, one flagged nit: Dario is only *narrated* in Sprint II (story field + memos). If the owner wants him seen pre-defection, add one line to v2c1: `{ who: 'YOU', text: 'A man in a plain oxford watched the whole demo from the fire exit, taking notes. He was counting something.', shot: 'player' }` — included here as optional.
- **SECOND WIND / THERAPY / COMMEDIA — PASS** with §7's copy patches only; their arcs already clear #12–18.

Bar check (owner's words: "funny, weird, hilarious, can go viral"): the four clip-able moments this package banks on — Tom's engraving revision mid-air, Eileen slapped out of her own retirement paperwork, Don tearing the permit while rebranding the loss, and Dale losing to his own called shot.

---

## Implementation-surface summary (for the orchestrator)

- **New mechanics:** `bulwark { threshold: 900, label }` + goal type `'bulwark'` (main.js `bulwarkPts` accumulator, reset in `startTourChallenge`; `checkAttempt` gains one clause; HUD chip `IMMOVABILITY: n%` + `SPRUNG!`; 4 transform stages; stored-impulse blow-away at cap power 30). `calledShot { margin: 0.02, cqMin: 95 }` (per-attempt HIGH/LOW parity announced at the whistle via `ui.slapBurst`; onContact ×0.2 `WRONG CHEEK!` hook after headTurn, reuses cq). **skiRun v2** additive flags `noBrake` + `twoLine { z: 0.55, blendX: 3, delayB: 0.4 }` at speed 2.7 (pocket window 3.0s → 1.04s; line parity set in `startAttempt`, announced by push-off side; v1 entries untouched).
- **New ROSTER entry:** `avafullsend` (§1a). Patches: `clockwork` (mass 3.2, bounce, bulwark, drops coilExam), `dale` (+calledShot), `ava`/`avaskis` (copy only).
- **New SLAPPERS entry:** `dario` (DLC, price 4, pinned per-challenge on all five Sprint III rows — challenge pin beats tour pin per the stamping loop).
- **Changed goal types:** w3c3 → `bulwark 900`; new challenge id `o2c4` (Ring II grows to 4 rows, Wonders precedent); o3c3 swaps opp to `avafullsend`; all ids otherwise stable so `slapp_tour` progress survives.
- **Copy-only:** §3 (fair), §5 (night diffs), §6 (slopvalley stories), §7 (26 desc rewrites), w3c2 "Penultimate reel" patch.
- **Migration:** strip rewritten scene ids from `localStorage.slapp_seen` once (`w2c3, w3c3, outro_w3c3, o2c3, o3c3, outro_o3c3, f1c1, f4c1, f4c2, outro_f4c2, v3c1, a3c3`) so existing players see the new scenes.
- **Geopolitics:** explicit-version recommended; three sealed-fiction drop-ins on file (§1e table).