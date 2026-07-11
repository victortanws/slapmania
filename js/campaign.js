// THE CAMPAIGNS — two storylines. HIDDEN from the public until CAMPAIGN_LIVE
// flips true; reachable meanwhile only via ?tour=1 (dev/preview).
// Every challenge names its volunteer, opens with a letterboxed scene (ENTER
// advances), and cleared challenges stay replayable. The Palm tour runs a real
// arc: prologue (the unfinished technique) → Mabel's unfinished lesson →
// the guardians → the Fourth Form → an outro where the master finally rests.
// Progress: localStorage.slapp_tour; scene seen-flags: localStorage.slapp_seen.

const CAMPAIGN_LIVE = true; // SHIPPED 2026-07-11 — the County Fair Tour is public

export const TOURS = [
  {
    key: 'palm', title: '🖐 THE LEGEND OF THE OPEN PALM',
    blurb: 'A dead master. An unfinished technique. One last student.',
    acts: [
      {
        act: 'SCROLL I — THE PATIENT COIL',
        story: 'A spirit has appeared at the fairground. He is forty years dead, extremely opinionated, and he says your swivel has promise.',
        challenges: [
          { id: 'a1c1', title: 'THE LISTENING PALM', desc: "A clean slap on HAYSEED HANK's cheek — the honest standard", opp: 'hank', goal: { type: 'head' } },
          { id: 'a1c2', title: 'THROUGH THE BARRICADE', desc: 'Send SLIM PETE 20m — the barricade has had it coming', opp: 'slim', goal: { type: 'dist', v: 20 } },
          { id: 'a1c3', title: 'THE FIRST STUDENT', desc: "Post MULE-KICK MABEL 35m — finish the lesson he never could", opp: 'mabel', goal: { type: 'dist', v: 35 } },
        ],
      },
      {
        act: 'SCROLL II — THE HEAVY HAND',
        story: 'The second form is weight. The heir arrives to see whether the stranger is worth the family name.',
        challenges: [
          { id: 'a2c1', title: 'WEIGHT ANSWERS WEIGHT', desc: 'Score 600 off BIG BERTHA — the only honest scale in the county', opp: 'bertha', goal: { type: 'pts', v: 600 } },
          { id: 'a2c2', title: 'BUDGE THE MOUNTAIN', desc: 'Move BIG HOSS 22m — bring the muscle', opp: 'hoss', goal: { type: 'dist', v: 22 } },
          { id: 'a2c3', title: '☗ BOSS: THE IMMOVABLE OBJECT', desc: '500 points off BOULDER BOB', opp: 'boulder', goal: { type: 'pts', v: 500 } },
        ],
      },
      {
        act: 'SCROLL III — THE OPEN PALM',
        story: 'The final scroll. The swing the master never finished.',
        challenges: [
          { id: 'a3c1', title: 'FLAWLESS FORM', desc: 'A 90% chain before MAESTRO FORTISSIMO — every link in tune', opp: 'maestro', goal: { type: 'chain', v: 90 } },
          { id: 'a3c2', title: 'NO SHORTCUTS', desc: 'Send HAYSEED HANK 75m — pure form, no featherweights', opp: 'hank', goal: { type: 'dist', v: 75 } },
          { id: 'a3c3', title: '☗ BOSS: CATCH THE UNCATCHABLE', desc: 'Slap DODGY DALE 60m — the unfinished swing', opp: 'dale', goal: { type: 'dist', v: 60 } },
        ],
      },
    ],
  },
  {
    key: 'fair', title: '🚜 SAVE THE FAIR',
    blurb: "Tremendous Don Enterprises filed to pave the fairground into Parking Structure Seven. The county has one defense: your palm.",
    acts: [
      {
        act: 'ACT I — THE ASSESSORS ARRIVE',
        story: 'An assessor arrived to appraise whether the fair is "worth keeping." Pack the stands and show him worth.',
        challenges: [
          { id: 'f1c1', title: 'PACK THE STANDS', desc: "Score 350 off BIG BERTHA — when the county's favorite aunt roars, the county roars", opp: 'bertha', goal: { type: 'pts', v: 350 } },
          { id: 'f1c2', title: 'GO VIRAL', desc: 'Send THE INFLUENCER 55m — if the fair trends, it stands', opp: 'influencer', goal: { type: 'dist', v: 55 } },
          { id: 'f1c3', title: '☗ BOSS: THE FINAL APPRAISAL', desc: 'Score 300 off THE ASSESSOR — five seconds a swing', opp: 'judge', goal: { type: 'pts', v: 300 } },
        ],
      },
      {
        act: 'ACT II — THE CONSULTANTS',
        story: 'Don sent "efficiency consultants" to bury the fair in testimony. Some witnesses can be un-bought.',
        challenges: [
          { id: 'f2c1', title: 'HOSTILE WITNESS', desc: "Send RAVIN' RAY 30m — he took glowsticks to testify against us", opp: 'ravinray', goal: { type: 'dist', v: 30 } },
          { id: 'f2c2', title: 'FUNDRAISER FRENZY', desc: 'Score 500 off BIG HOSS — the biggest donor draw at the fair', opp: 'hoss', goal: { type: 'pts', v: 500 } },
          { id: 'f2c3', title: '☗ BOSS: THE UNGRIPPABLE MAN', desc: 'Slap GREASED PETE 50m — only a perfect palm grips', opp: 'grease', goal: { type: 'dist', v: 50 } },
        ],
      },
      {
        act: 'ACT III — THE WRECKING CREW',
        story: 'The bulldozers idle at the gate. Don sent his closer — and his closer brought his grandmother.',
        challenges: [
          { id: 'f3c1', title: 'READ THE FINE PRINT', desc: 'An 85% chain before SCHOOLMARM SUSIE — clause 44-B requires faculty grading', opp: 'susie', goal: { type: 'chain', v: 85 } },
          { id: 'f3c2', title: 'JAWBREAKER', desc: 'Move IRON-JAW McGRAW 28m — under 70% chain he will not blink', opp: 'ironjaw', goal: { type: 'dist', v: 28 } },
          { id: 'f3c3', title: '☗ BOSS: GRANNY THUNDER', desc: 'Send the retired champion 35m — weak form bores her', opp: 'granny', goal: { type: 'dist', v: 35 } },
        ],
      },
      {
        act: 'EPILOGUE — THE VERDICT',
        story: 'The council voted 6–1 to save the fair — the lone "nay" was Judge Pennywhistle, "on procedure." Then the blueprints turned up in his gavel case, signed three weeks before the assessment ever happened, witnessed by a hot dog.',
        challenges: [
          { id: 'f4c1', title: 'FOLLOW THE MONEY', desc: 'Score 400 off TREMENDOUS DON — the briefcase has a cheek too', opp: 'don', goal: { type: 'pts', v: 400 } },
          { id: 'f4c2', title: '☗ FINAL BOSS: CONTEMPT OF COURT', desc: 'Score 350 off JUDGE PENNYWHISTLE — six seconds a swing', opp: 'pennywhistle', goal: { type: 'pts', v: 350 } },
        ],
      },
    ],
  },
  {
    key: 'wonders', title: '🎥 THE WONDERS OF SLAPPING',
    slapper: 'charlie', // pin the deadpan narrator — the 'YOU' cutscene voice depends on it
    blurb: 'A nature documentary about the palm. The narrator will not, under any circumstances, emote.',
    acts: [
      {
        act: 'REEL I — FIELD NOTES',
        story: 'The Institute of Applied Palmistry wants a documentary. They hired you because your slap is "reproducible under laboratory conditions" and your voice makes violence sound like weather. Roll camera.',
        challenges: [
          { id: 'w1c1', title: 'SPECIMEN 001 — THE COMMON CHEEK', desc: 'A clean head slap on HAYSEED HANK — establish the baseline', opp: 'hank', goal: { type: 'head' } },
          { id: 'w1c2', title: 'ESCAPE BEHAVIOR', desc: 'Send SLIM PETE 22m — document the featherweight in flight', opp: 'slim', goal: { type: 'dist', v: 22 } },
          { id: 'w1c3', title: 'THE ELDER SPECIMEN', desc: 'Post GRANDPA CLETUS 28m — the weathered, unbothered variety', opp: 'cletus', goal: { type: 'dist', v: 28 } },
          { id: 'w1c4', title: 'THE VERTICAL VARIABLE', desc: 'Send POGO McPHEE 20m — the specimen will not stop jumping. Time the bounce.', opp: 'pogo', goal: { type: 'dist', v: 20 } },
        ],
      },
      {
        act: 'REEL II — THE COLLECTION GROWS',
        story: 'The tape leaked. Forty million views. The Institute wants rarer specimens, the Influencer has invited herself into frame, and Director Vane has begun to weep and demand an Academy Award.',
        challenges: [
          { id: 'w2c1', title: 'MEGAFAUNA', desc: 'Score 480 off BIG BERTHA — when the large specimen moves, the ground reports it', opp: 'bertha', goal: { type: 'pts', v: 480 } },
          { id: 'w2c2', title: 'INVASIVE SPECIES', desc: 'Relocate THE INFLUENCER 55m — drawn to the lens, must be moved downrange', opp: 'influencer', goal: { type: 'dist', v: 55 } },
          { id: 'w2c4', title: 'THE SUN SALUTER', desc: 'Send NAMASTE NADINE 35m — she is not dodging, she is exercising. Strike on the lean-in.', opp: 'nadine', goal: { type: 'dist', v: 35 } },
          { id: 'w2c3', title: '☗ BOSS: THE CLOCKWORK SPECIMEN', desc: 'Score 450 off TICK-TOCK TOM — first wind the coil past 85%, then move him', opp: 'clockwork', goal: { type: 'pts', v: 450 } },
        ],
      },
      {
        act: 'REEL III — THE OBSERVED OBSERVE BACK',
        story: 'The specimens have seen the film. They critique your form now. They perform for the lens. And one of them narrates back.',
        challenges: [
          { id: 'w3c1', title: 'PEER REVIEW', desc: 'A 90% chain before MAESTRO FORTISSIMO — the specimen grades the observer', opp: 'maestro', goal: { type: 'chain', v: 90 } },
          { id: 'w3c2', title: 'TERMINAL VELOCITY', desc: 'Send SLIM PETE 88m — the featherweight achieves escape velocity on camera', opp: 'slim', goal: { type: 'dist', v: 88 } },
          { id: 'w3c4', title: 'THE LIGHTHOUSE EFFECT', desc: 'A flush cheek strike on HEAD-TURNING HORTON at 30m — catch the face mid-turn, incoming.', opp: 'horton', goal: { type: 'headdist', v: 30 } },
          { id: 'w3c3', title: '☗ BOSS: THE DEADPAN', desc: 'Slap MASTER MANTIS 55m — only a true SNAP lands; a lazy arm is just narration', opp: 'mantis', goal: { type: 'dist', v: 55 } },
        ],
      },
    ],
  },
  {
    key: 'secondwind', title: '🐉 BRUCE VS CHUCK: THE LAST LEGEND',
    dlc: true,           // rides with the Supporter Pack (Bruce's own storyline)
    world: 'dojo',       // fought in the martial-arts dojo world once it ships (guarded)
    slapper: 'bruceslee', // pin Bruce (grants free campaign-use of the locked DLC); martial 'YOU' voice
    blurb: 'Two legends. One cheek. Chuck North has never been slapped; Bruce Slee has never missed twice. The county holds its breath — strike in the quiet, before the myth hardens.',
    acts: [
      {
        act: 'ACT I — THE TRAILHEAD',
        story: "A stranger finished your grandfather's Fourth Form while you watched. To prove the palm is a living art and not an heirloom, you set out for the one man no hand has touched. First: earn the road.",
        challenges: [
          { id: 'b1c1', title: 'THE EMPTY HAND', desc: 'A clean head slap on HAYSEED HANK — no want, no fear', opp: 'hank', goal: { type: 'head' } },
          { id: 'b1c2', title: 'BECOME WATER', desc: 'Send SLIM PETE 25m — do not push the river; become it', opp: 'slim', goal: { type: 'dist', v: 25 } },
          { id: 'b1c3', title: '☗ BOSS: THE MOUNTAIN AT THE GATE', desc: 'Score 420 off BOULDER BOB — he does not move for the unready', opp: 'boulder', goal: { type: 'pts', v: 420 } },
        ],
      },
      {
        act: 'ACT II — THE THREE FACETS OF THE LEGEND',
        story: "Chuck's myth has three faces, and each one is a real disciple guarding the road. Unmake them, and you learn the truth: his power was never muscle. It is belief — and in this county, belief is a force with weight.",
        challenges: [
          { id: 'b2c1', title: '"HE CANNOT BE CAUGHT"', desc: 'Slap DODGY DALE 40m — a slip has a rhythm, and a rhythm is a promise', opp: 'dale', goal: { type: 'dist', v: 40 } },
          { id: 'b2c2', title: '"HE CANNOT BE GRIPPED"', desc: 'Send GREASED PETE 40m — arrive so perfectly the grease has nothing to refuse', opp: 'grease', goal: { type: 'dist', v: 40 } },
          { id: 'b2c3', title: '☗ BOSS: "HE CANNOT BE MOVED"', desc: 'Move IRON-JAW McGRAW 30m — below 70% chain he grants you nothing', opp: 'ironjaw', goal: { type: 'dist', v: 30 } },
        ],
      },
      {
        act: 'ACT III — THE PORCH',
        story: 'No more gatekeepers. Only the long road up, the thin air, one certified sign-in sheet, and the man inside the mountain — who is about to hear his crowd start to chant.',
        challenges: [
          { id: 'b3c1', title: 'THE LONG ROAD UP', desc: 'Send HAYSEED HANK 50m — pure form, no tricks, one long exhale', opp: 'hank', goal: { type: 'dist', v: 50 } },
          { id: 'b3c2', title: 'CERTIFIED', desc: "A 90% chain before SCHOOLMARM SUSIE — Chuck's porch has a sign-in sheet", opp: 'susie', goal: { type: 'chain', v: 90 } },
          { id: 'b3c3', title: '☗ FINAL BOSS: THE SECOND WIND', desc: 'Slap CHUCK NORTH 42m — strike in the 4-second quiet, or answer his surge with an 85% chain', opp: 'chuckboss', goal: { type: 'dist', v: 42 } },
        ],
      },
    ],
  },
  {
    key: 'nightofslaps', title: '🎃 THE NIGHT OF SLAPS',
    dlc: true,
    world: 'haunted',
    blurb: 'The gates lock at midnight. The night crew wants a headliner. The groundskeeper wants you off the lawn.',
    acts: [
      {
        act: 'ACT I — LOCKED IN',
        story: 'You stayed for one last funnel cake. The gates lock at midnight, and per bylaws nobody has ever read, the only way out is to headline the Night Fair.',
        challenges: [
          { id: 'n1c1', title: 'THE NIGHT GREETER', desc: "A clean slap on JACK O'LANTERN JOE — aim for the face, it's the big orange one", opp: 'joe', goal: { type: 'head' } },
          { id: 'n1c2', title: 'ACCIDENTAL NIGHT FOLK', desc: 'Send GRANDPA CLETUS 25m — he fell asleep in the outhouse at closing. Again.', opp: 'cletus', goal: { type: 'dist', v: 25 } },
          { id: 'n1c3', title: 'ON THE POSTER', desc: "Send JACK O'LANTERN JOE 30m into the pumpkin patch — don't worry, he grows back", opp: 'joe', goal: { type: 'dist', v: 30 } },
        ],
      },
      {
        act: 'ACT II — THE BONE ZONE',
        story: 'Your audition drew the whole graveyard. Now the night regulars want in — starting with a skeleton who has waited forty years to be aerodynamic.',
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
  {
    key: 'slaptherapy', title: '🛋️ SLAP THERAPY',
    dlc: true,
    world: 'therapy',
    slapper: 'carlgustav',
    blurb: 'Fifty years of psychoanalysis. One replicable finding: the slap. The doctor will see you now.',
    acts: [
      {
        act: 'SESSION I — INTAKE',
        story: 'The board revoked the doctor\'s license over his final paper — "The Palm: A Meta-Analysis." The fair gave him a tent. The patients talk therapy failed are already lining up.',
        challenges: [
          { id: 't1c1', title: 'THE FIRST SESSION', desc: 'A clean head slap on INKBLOT IAN — the face must remember it is a face', opp: 'inkblot', goal: { type: 'head' } },
          { id: 't1c2', title: 'FEAR OF FLYING', desc: 'Send SLIM PETE 25m — exposure therapy: you ARE the airplane', opp: 'slim', goal: { type: 'dist', v: 25 } },
          { id: 't1c3', title: 'THE CARETAKER', desc: 'Score 350 off BIG BERTHA — what happens to the load when the carrier is briefly airborne?', opp: 'bertha', goal: { type: 'pts', v: 350 } },
        ],
      },
      {
        act: 'SESSION II — BREAKTHROUGHS',
        story: "Session One's patients feel better and will not stop telling people. Now the difficult cases arrive: the ego, the algorithm, and a retest for the ages.",
        challenges: [
          { id: 't2c1', title: 'THE EGO', desc: 'Score 450 off TREMENDOUS DON — the most expensive slap in medicine', opp: 'don', goal: { type: 'pts', v: 450 } },
          { id: 't2c2', title: 'LOG OFF', desc: 'Send THE INFLUENCER 50m — for the duration of the flight, no one can perceive you', opp: 'influencer', goal: { type: 'dist', v: 50 } },
          { id: 't2c3', title: 'THE RORSCHACH RETEST', desc: 'An 80% chain before INKBLOT IAN — the result must replicate', opp: 'inkblot', goal: { type: 'chain', v: 80 } },
        ],
      },
      {
        act: 'SESSION III — PEER REVIEW',
        story: 'Half the county is cured; the other half is booking. Then Dr. Freudenschade of the rival school arrives to defend the talking cure — one interpretation at a time.',
        challenges: [
          { id: 't3c1', title: 'DREAM WORK', desc: 'Send HAYSEED HANK 45m — some dreams require interpretation; his requires distance', opp: 'hank', goal: { type: 'dist', v: 45 } },
          { id: 't3c2', title: '☗ BOSS: THE TALKING CURE', desc: 'Score 480 off DR. FREUDENSCHADE — below 75% form he interprets the slap away', opp: 'freuden', goal: { type: 'pts', v: 480 } },
        ],
      },
    ],
  },
  {
    key: 'slopvalley', title: '🤖 SLOP VALLEY',
    dlc: true,
    world: 'techcampus',
    blurb: 'A tech campus disrupted the fair with AI-generated everything. Slapping is the one thing they cannot generate.',
    acts: [
      {
        act: 'SPRINT I — THE DISRUPTION',
        story: 'The pasture next door is now the SynerCorn campus: generated corn, PDF lemonade, a fortune chatbot. The fair is empty — and the founder wants to buy your palm, the one thing in the valley that cannot be generated.',
        challenges: [
          { id: 'v1c1', title: 'THE PITCH', desc: 'A clean head slap on VISIONARY VANCE — consider it a live demo', opp: 'vance', goal: { type: 'head' } },
          { id: 'v1c2', title: 'ORGANIC REACH', desc: 'Send THE INFLUENCER 50m — one genuinely real clip, no filters. Well. One filter.', opp: 'influencer', goal: { type: 'dist', v: 50 } },
          { id: 'v1c3', title: 'SHIP IT', desc: 'Send VISIONARY VANCE 40m — he will log it as user engagement', opp: 'vance', goal: { type: 'dist', v: 40 } },
        ],
      },
      {
        act: 'SPRINT II — FOUNDER MODE',
        story: 'The demo footage hit the earnings call and the stock did a backflip. The board flew in Miracle Mira for credibility. Her demos are staged, her confidence is baritone, and the runway is on fire.',
        challenges: [
          { id: 'v2c1', title: 'THE DEMO', desc: 'A 75% chain before MIRACLE MIRA — she would know a fake. Professionally.', opp: 'mira', goal: { type: 'chain', v: 75 } },
          { id: 'v2c2', title: 'BURN RATE', desc: 'Score 450 off BIG HOSS — show the board what their money weighs', opp: 'hoss', goal: { type: 'pts', v: 450 } },
          { id: 'v2c3', title: 'EXIT STRATEGY', desc: 'Send MIRACLE MIRA 60m — an exit only counts if it is bigger than the last round', opp: 'mira', goal: { type: 'dist', v: 60 } },
        ],
      },
      {
        act: 'SPRINT III — THE AGI REVEAL',
        story: 'Out of money, out of founders, out of excuses, Vance announces AGI is already here — and wheels out a robot the size of a shed. It mostly generates apologies.',
        challenges: [
          { id: 'v3c1', title: 'HUMAN EVAL', desc: 'An 88% chain before SCHOOLMARM SUSIE — the opposite of slop, every link handwritten', opp: 'susie', goal: { type: 'chain', v: 88 } },
          { id: 'v3c2', title: 'THE LAST PIVOT', desc: 'Send VISIONARY VANCE 75m — the most authentic content this valley has ever produced', opp: 'vance', goal: { type: 'dist', v: 75 } },
          { id: 'v3c3', title: '☗ FINAL BOSS: S.L.O.P. UNIT-1', desc: 'Score 480 off the robot — 6 seconds of compute a swing; sub-70% slaps get discarded as training data', opp: 'slopunit', goal: { type: 'pts', v: 480 } },
        ],
      },
    ],
  },
  {
    key: 'olympicbid', title: '🥇 THE OLYMPIC BID',
    // FREE and first — the front-door storyline every new player can finish
    slapper: 'victor',
    blurb: 'The county wants slapping in the Olympics. The Committee has questions. The county has answers, and they are open-palmed.',
    acts: [
      {
        act: 'RING I — THE APPLICATION',
        story: 'The county filed for slapping to become an Olympic sport, and the Committee sent Commissioner Quibble to observe. Three questions decide everything: is it athletic, is it artistic, is it measurable. You built these fairgrounds. Time to build a sport.',
        challenges: [
          { id: 'o1c1', title: 'THE FUNDAMENTALS', desc: "A clean strike to the regulation zone — HAYSEED HANK's cheek, before an official", opp: 'hank', goal: { type: 'head' } },
          { id: 'o1c2', title: 'THE ARTISTIC PROGRAM', desc: 'A 65% chain before MAESTRO FORTISSIMO — the cello bid rides on your tempo', opp: 'maestro', goal: { type: 'chain', v: 65 } },
          { id: 'o1c3', title: 'MINIMUM QUALIFYING DISTANCE', desc: 'Send SLIM PETE 30m — he has done it by accident, but the plaque is not sanctioned', opp: 'slim', goal: { type: 'dist', v: 30 } },
        ],
      },
      {
        act: 'RING II — THE TRIALS',
        story: 'The application survives round one, so the Committee raises the bar: certified instruction, a sanctioned head-to-head, and an "athletic pedigree" review — delivered in person by freeskiing\'s reigning phenom, who thinks your sport is a raffle.',
        challenges: [
          { id: 'o2c1', title: 'TEACHING MOMENT', desc: 'An 80% chain before SCHOOLMARM SUSIE — show the Committee what instruction looks like', opp: 'susie', goal: { type: 'chain', v: 80 } },
          { id: 'o2c2', title: 'THE EXHIBITION BOUT', desc: 'Send GRANNY THUNDER 30m — you swing, she slips; she swings, you take it. THAT is the exchange.', opp: 'granny', goal: { type: 'dist', v: 30 } },
          { id: 'o2c3', title: '☗ MINI-BOSS: THE PHENOM', desc: 'Send AVALANCHE EILEEN 40m — she took the skis off. Free lesson.', opp: 'ava', goal: { type: 'dist', v: 40 } },
        ],
      },
      {
        act: 'RING III — THE VERDICT',
        story: 'Ava\'s "evaluation" has 400 million views and the vote moves to a live final. The county needs an anthem moment, an official record — and then the phenom comes back wearing the skis.',
        challenges: [
          { id: 'o3c1', title: 'THE ANTHEM', desc: 'Score 550 off BIG BERTHA — when she gets moved, the county sings', opp: 'bertha', goal: { type: 'pts', v: 550 } },
          { id: 'o3c2', title: 'WORLD RECORD PACE', desc: 'Send HAYSEED HANK 50m — every Olympic sport arrives with a record to chase', opp: 'hank', goal: { type: 'dist', v: 50 } },
          { id: 'o3c3', title: '☗ FINAL BOSS: THE GREAT ESCAPE', desc: 'AVALANCHE EILEEN is skiing for the exit gate — catch her mid-pass and send her 6m. If she makes the gate, she is GONE.', opp: 'avaskis', goal: { type: 'dist', v: 6 } },
        ],
      },
    ],
  },
];

// ---- cutscenes: { who, text, shot } — shots: player | opp | spirit | judge | wide.
// 'YOU' becomes the slapper's name. palm_prologue plays once when the tour menu
// first opens; outro_* scenes play after clearing their boss. ENTER advances.
export const CUTSCENES = {
  palm_prologue: [
    { who: '👻 MASTER SLEE', text: 'Sixty years I chased one perfect slap. The Fourth Form. I reached ninety-nine percent.', shot: 'spirit' },
    { who: 'BRUCE SLEE', text: 'I trained under him from the day I could stand. Every morning, the same words: the last percent is not in the arm.', shot: 'bruce' },
    { who: '👻 MASTER SLEE', text: 'I died mid-swing. Undignified. A master who never landed his own technique does not get to rest.', shot: 'spirit' },
    { who: 'BRUCE SLEE', text: 'He asked me to finish it. I said no. Some doors you don\'t knock on twice.', shot: 'bruce' },
    { who: '👻 MASTER SLEE', text: 'So we find a stranger with an honest palm, and we finish it together. That would be you. Don\'t bow. Listen.', shot: 'spirit' },
  ],
  a1c1: [
    { who: '👻 MASTER SLEE', text: 'Hank has the most honest cheek in the county. Strike it honestly. Form One: the palm listens before it speaks.', shot: 'spirit' },
    { who: 'HAYSEED HANK', text: 'Nobody asked me, for the record.', shot: 'opp' },
    { who: '👻 MASTER SLEE', text: 'The cheek volunteered, Hank. The man merely accompanies it.', shot: 'spirit' },
  ],
  a1c2: [
    { who: '👻 MASTER SLEE', text: 'The county built that barricade to keep slapped folk out of the pie stand. Pete, kindly stand in front of it.', shot: 'spirit' },
    { who: 'SLIM PETE', text: 'I volunteered for the pie.', shot: 'opp' },
    { who: '👻 MASTER SLEE', text: 'Twenty meters. The barricade has had this coming for years.', shot: 'spirit' },
  ],
  a1c3: [
    { who: '👻 MASTER SLEE', text: 'Mabel. My first student. I died halfway through her last lesson.', shot: 'spirit' },
    { who: 'MULE-KICK MABEL', text: "Every Sunday for forty years I came back to this field and held the follow-through. Waitin' on the old man to say 'good.'", shot: 'opp' },
    { who: 'YOU', text: 'Then why volunteer for the slap?', shot: 'player' },
    { who: 'MULE-KICK MABEL', text: "Because if he finally found a student, my lesson can finish too. Thirty-five meters, sugar. Make it one he'd call good.", shot: 'opp' },
    { who: '👻 MASTER SLEE', text: '...do not miss.', shot: 'spirit' },
  ],
  a2c1: [
    { who: 'BRUCE SLEE', text: "You're still doing this, grandfather.", shot: 'bruce' },
    { who: '👻 MASTER SLEE', text: 'Bruce. Watch the stranger. Scroll Two — a feather flies far and proves nothing.', shot: 'spirit' },
    { who: 'BIG BERTHA', text: "Six fairs, sugar. Don't insult me with a light one.", shot: 'opp' },
    { who: 'BRUCE SLEE', text: 'Six hundred points. The old man used to call Bertha the only honest scale in the county.', shot: 'bruce' },
  ],
  a2c2: [
    { who: 'BIG HOSS', text: "The ghost's been tryin' to move me since '86.", shot: 'opp' },
    { who: '👻 MASTER SLEE', text: 'Hill. He is a hill. Twenty-two meters.', shot: 'spirit' },
  ],
  a2c3: [
    { who: '👻 MASTER SLEE', text: 'The first guardian. I set him there myself. Or he was already there. It was a long time ago.', shot: 'spirit' },
    { who: 'BOULDER BOB', text: 'I have watched this fair since before the fence. The fence asked my permission.', shot: 'opp' },
    { who: 'YOU', text: 'Do you... ever move?', shot: 'player' },
    { who: 'BOULDER BOB', text: 'Once. It was overrated.', shot: 'opp' },
  ],
  a3c1: [
    { who: '👻 MASTER SLEE', text: 'Forget distance. The Maestro will listen to your chain.', shot: 'spirit' },
    { who: 'MAESTRO FORTISSIMO', text: 'I can hear a flat swivel from the parking lot. Ninety percent. In tune.', shot: 'opp' },
    { who: 'BRUCE SLEE', text: 'This is the part where students quit.', shot: 'bruce' },
  ],
  a3c2: [
    { who: '👻 MASTER SLEE', text: 'Anyone can throw a feather over the county line. Throw Hank. Pure form.', shot: 'spirit' },
    { who: 'HAYSEED HANK', text: 'Again with the honest work.', shot: 'opp' },
  ],
  a3c3: [
    { who: '👻 MASTER SLEE', text: "The last guardian. I taught him to dodge, the year before I died. He's been dodging ever since.", shot: 'spirit' },
    { who: 'DODGY DALE', text: 'Four hundred palms came for this cheek. I keep the tears in a jar.', shot: 'opp' },
    { who: '👻 MASTER SLEE', text: "Land this one, student. The Fourth Form — the swing I never finished.", shot: 'spirit' },
  ],
  outro_a3c3: [
    { who: '👻 MASTER SLEE', text: "...so that's what the last percent feels like. The Fourth Form. It was never in the arm — it's the hand you finally unclench.", shot: 'spirit' },
    { who: 'BRUCE SLEE', text: "I couldn't knock on that door, grandfather. The stranger did.", shot: 'bruce' },
    { who: '👻 MASTER SLEE', text: "Rest, he says. One more Sunday first — Mabel is owed a 'good.'", shot: 'spirit' },
  ],
  f1c1: [
    { who: 'JUDGE PENNYWHISTLE', text: "Word from the capital: Tremendous Don Enterprises wants this fairground for 'Parking Structure Seven.' There will be an assessment.", shot: 'judge' },
    { who: 'YOU', text: 'An assessment of what?', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: "Of whether anyone cares. Bertha is the county's favorite aunt — when she roars, the county roars. Three hundred fifty points of caring, champ.", shot: 'judge' },
    { who: 'BIG BERTHA', text: 'For the fair? Sugar, swing like you mean it.', shot: 'opp' },
  ],
  f1c2: [
    { who: 'THE INFLUENCER', text: 'If the fair trends, the council literally cannot ignore it. I did the math. Well — I did a poll.', shot: 'opp' },
    { who: 'YOU', text: 'You want me to slap you... for the algorithm?', shot: 'player' },
    { who: 'THE INFLUENCER', text: "For the FAIR, bestie. Fifty-five meters minimum or it won't clip well.", shot: 'opp' },
  ],
  f1c3: [
    { who: 'THE ASSESSOR', text: 'This fairground appraises at... sentimental value. My briefcase does not have a column for sentimental value.', shot: 'opp' },
    { who: 'YOU', text: 'Then add one.', shot: 'player' },
    { who: 'THE ASSESSOR', text: 'Very well. The appraisal begins. Five seconds a swing — my parking meter is running.', shot: 'opp' },
  ],
  f2c1: [
    { who: 'JUDGE PENNYWHISTLE', text: "Bad news. Don's consultants paid Ravin' Ray to testify the fair is 'basically a warehouse rave — rezone it.'", shot: 'judge' },
    { who: "RAVIN' RAY", text: 'They gave me glowsticks, man. Industrial glowsticks.', shot: 'opp' },
    { who: 'YOU', text: 'You sold us out for glowsticks?', shot: 'player' },
    { who: "RAVIN' RAY", text: '...they glow so good. Thirty meters and I recant everything.', shot: 'opp' },
  ],
  f2c2: [
    { who: 'JUDGE PENNYWHISTLE', text: "Legal defense funds grow on points, champ. And nobody draws a paying crowd like the big man.", shot: 'judge' },
    { who: 'BIG HOSS', text: "Folks do love watchin' me not move.", shot: 'opp' },
    { who: 'JUDGE PENNYWHISTLE', text: 'Five hundred points. One slap. Make the county open its wallet.', shot: 'judge' },
  ],
  f2c3: [
    { who: 'JUDGE PENNYWHISTLE', text: "Don's 'conflict-resolution specialist.' Nine-year pig-grease champion. HR could not hold him. Soap could not hold him.", shot: 'judge' },
    { who: 'GREASED PETE', text: "You can't fire what you can't grip. And you can't grip me.", shot: 'opp' },
    { who: 'GREASED PETE', text: 'The grease is a lifestyle. Perfect palm or nothing, sugar.', shot: 'opp' },
  ],
  f3c1: [
    { who: 'JUDGE PENNYWHISTLE', text: 'Buried in the county charter, clause 44-B: the fair stands if a citizen demonstrates form beyond reproach — graded by certified faculty.', shot: 'judge' },
    { who: 'SCHOOLMARM SUSIE', text: 'I grade in red ink and I have never given an A. Eighty-five percent, dear. Show your work.', shot: 'opp' },
    { who: 'YOU', text: 'What happens below eighty-five?', shot: 'player' },
    { who: 'SCHOOLMARM SUSIE', text: 'Detention. For the entire fair.', shot: 'opp' },
  ],
  f3c2: [
    { who: 'JUDGE PENNYWHISTLE', text: "The demolition foreman. He does not argue. He does not blink. I'd bang the gavel to begin, but it's... in the case. It stays in the case.", shot: 'judge' },
    { who: 'IRON-JAW McGRAW', text: 'Was that the wind?', shot: 'opp' },
    { who: 'YOU', text: "I haven't slapped you yet.", shot: 'player' },
    { who: 'IRON-JAW McGRAW', text: 'I was talking about your plan.', shot: 'opp' },
  ],
  f3c3: [
    { who: 'GRANNY THUNDER', text: 'Nine years I held that belt. Gave it up for bingo and grandbabies. Don pays me in casserole coupons.', shot: 'opp' },
    { who: 'YOU', text: "Ma'am, I don't want to slap a grandmother.", shot: 'player' },
    { who: 'GRANNY THUNDER', text: "Honey, nobody's managed it since 1987. Slip city. Population: you.", shot: 'opp' },
  ],
  f4c1: [
    { who: 'TREMENDOUS DON', text: 'This fair is a disaster. Low ceilings. No valet. My parking structure has a food court. People are crying about the food court.', shot: 'opp' },
    { who: 'YOU', text: 'The blueprints were signed three weeks before the assessment, Don.', shot: 'player' },
    { who: 'TREMENDOUS DON', text: 'Fake blueprints! Beautiful fake blueprints — the best fake blueprints. Four hundred points says you never touch me.', shot: 'opp' },
  ],
  f4c2: [
    { who: 'YOU', text: 'The blueprints were in your gavel case, your honor.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'Circumstantial! The hot dog that witnessed the signing has since been eaten. No witness, no crime.', shot: 'opp' },
    { who: 'YOU', text: 'You ate him. Mid-testimony.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'I was under oath to be honest about my hunger. Very well — the whistle presides. Six seconds. Objection: everything.', shot: 'opp' },
  ],
  outro_f4c2: [
    { who: 'JUDGE PENNYWHISTLE', text: 'The court finds itself... guilty. Extraordinarily guilty. The whistle is hereby returned to the county.', shot: 'judge' },
    { who: 'YOU', text: 'And the fair?', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'The fair stands. Parking Structure Seven shall be built as a birdhouse. Case dismissed.', shot: 'judge' },
  ],

  // ===== THE WONDERS OF SLAPPING (Charlie, deadpan documentary) =====
  wonders_prologue: [
    { who: '🎬 DIRECTOR VANE', text: 'The Institute greenlit a documentary. On the palm. Prestige. Awards. I need a narrator with gravitas — a voice that makes a grown man flying two hundred feet feel like a tide chart.', shot: 'wide' },
    { who: 'YOU', text: 'I slap people. I describe it while it happens. Is that the job.', shot: 'player' },
    { who: '🎬 DIRECTOR VANE', text: 'That — yes. That is precisely the job. One thing. Can you sound moved? Ever? Even by accident?', shot: 'wide' },
    { who: 'YOU', text: 'No.', shot: 'player' },
    { who: '🎬 DIRECTOR VANE', text: '...God help me, that is perfect. Roll camera.', shot: 'wide' },
  ],
  w1c1: [
    { who: 'YOU', text: 'Specimen one. The common cheek. Note the trusting posture — the fair-day slouch, the unguarded jaw. It does not yet know it is a specimen.', shot: 'player' },
    { who: 'HAYSEED HANK', text: "I can hear you. You're standing two feet from me.", shot: 'opp' },
    { who: 'YOU', text: 'The specimen vocalizes when approached. Fascinating. We proceed.', shot: 'player' },
  ],
  w1c2: [
    { who: '🎬 DIRECTOR VANE', text: "This one's all elbows. Is it dramatic? Tell me it's dramatic, Charlie, I need one dramatic frame.", shot: 'wide' },
    { who: 'YOU', text: 'Observe the featherweight. Hollow-boned. Built to travel. There is nothing dramatic in it. It simply goes.', shot: 'player' },
    { who: 'SLIM PETE', text: "I'm RIGHT here, man.", shot: 'opp' },
    { who: 'YOU', text: 'And shortly, he will be there. Twenty-two meters there.', shot: 'player' },
  ],
  w1c3: [
    { who: 'GRANDPA CLETUS', text: "Sonny, I been slapped at three counties. You narrate every one of 'em in that voice?", shot: 'opp' },
    { who: 'YOU', text: 'The elder specimen. Weathered. Unbothered. In this one respect, he and I are the same animal.', shot: 'player' },
    { who: 'GRANDPA CLETUS', text: "...huh. Fair enough. Twenty-eight meters, and mind the suspenders, they're my good pair.", shot: 'opp' },
  ],
  w1c4: [
    { who: 'YOU', text: 'Your honor. A formal complaint. The specimen will not stop jumping.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'I have consulted the rulebook. Jumping appears under "PERMITTED," subheading "unfortunately." The county thanks you for your report.', shot: 'judge' },
    { who: 'YOU', text: 'I am attempting to conduct science. He is interfering with the strike plane. Rhythmically.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'And he filed form 12-B: Intent To Bounce. In triplicate. Mid-air, somehow. My hands are tied and the whistle stands.', shot: 'judge' },
    { who: 'POGO McPHEE', text: "CAN'T — hit — WHAT'S — mostly — AIRBORNE!", shot: 'opp' },
    { who: 'YOU', text: 'Very well. The fairground hopper. Note the perpetual vertical oscillation — presumed to be a display of fitness, though nothing has ever been impressed by it. The cheek visits my altitude once per cycle. Science does not chase. Science waits at the bottom of the bounce.', shot: 'player' },
  ],
  w2c4: [
    { who: 'NAMASTE NADINE', text: "I'm not dodging, sweetheart. This is sun salutation B. The sun does not pause for documentaries, and neither do I.", shot: 'opp' },
    { who: 'YOU', text: 'For the record: the specimen oscillates on the horizontal axis and calls it wellness. The cheek enters my strike envelope at the top of each inhale and departs on the exhale. I have complained. The complaint departed on the same exhale.', shot: 'player' },
    { who: '🎬 DIRECTOR VANE', text: "It's GORGEOUS, Charlie. The flow, the golden hour, the serenity — tell me you feel the FLOW.", shot: 'wide' },
    { who: 'YOU', text: 'I feel a sampling window of approximately one breath. Science inhales with the specimen. Science strikes on the lean-in. Namaste is not data, but the lean is.', shot: 'player' },
  ],
  w3c4: [
    { who: 'HEAD-TURNING HORTON', text: 'Left profile. Right profile. A gentleman offers the camera EVERY angle. Which is my best side? All of them. The answer is all of them.', shot: 'opp' },
    { who: 'YOU', text: 'The formal specimen. Top hat, tails, and a skull in continuous rotation. I have asked it to hold still. It heard me twice — once with each ear, in passing.', shot: 'player' },
    { who: '🎬 DIRECTOR VANE', text: "He's DASHING, Charlie. He's METRONOMIC. Marry the shot to the turn and this is our poster.", shot: 'wide' },
    { who: 'YOU', text: 'Note the cheek presents itself only mid-turn, like the beam of a lighthouse. One does not chase a lighthouse. One anchors, waits, and greets the light as it sweeps in. This is not patience. It is angular data.', shot: 'player' },
  ],
  w2c1: [
    { who: '🎬 DIRECTOR VANE', text: 'The tape LEAKED. Forty million views. They call you "the calmest man alive" and I HATE how well it tests. Now — megafauna. And Charlie: feel something.', shot: 'wide' },
    { who: 'YOU', text: 'Note the mass. When a specimen of this magnitude relocates, the county registers it underfoot. This is not excitement. It is seismology.', shot: 'player' },
    { who: 'BIG BERTHA', text: 'You want the ground to feel somethin, sugar? Then swing like you MEAN it.', shot: 'opp' },
  ],
  w2c2: [
    { who: 'THE INFLUENCER', text: "Okay so your little documentary is trending and I cannot — CANNOT — let a slapping tape out-clip me. I'm inserting myself into the ecosystem.", shot: 'opp' },
    { who: 'YOU', text: 'An invasive species arrives. Loud. Reflective. Drawn to the lens. Standard protocol is relocation. Fifty-five meters, minimum.', shot: 'player' },
    { who: 'THE INFLUENCER', text: 'Relocate me somewhere with GOOD lighting, bestie.', shot: 'opp' },
  ],
  w2c3: [
    { who: '🎬 DIRECTOR VANE', text: 'The Institute loaned us their crown specimen. It is a — it is a wind-up man, Charlie. This is my Oscar. Look at it and FEEL a human feeling.', shot: 'wide' },
    { who: 'TICK-TOCK TOM', text: 'I have not run down since 1911. Wind me fully, then move me. If you can wind.', shot: 'opp' },
    { who: 'YOU', text: 'A mechanical specimen. It does not breathe; it ticks. To move it, one must first wind the coil past its stop. I find I respect it. This is not emotion. It is data.', shot: 'player' },
  ],
  w3c1: [
    { who: 'MAESTRO FORTISSIMO', text: 'I watched your film. Forty million people, and not ONE of them heard the flat swivel in Reel One. I heard it. Ninety percent, narrator, or I walk out of my own documentary.', shot: 'opp' },
    { who: 'YOU', text: 'The specimen has learned to critique the observer. Note the reversal — rare, and slightly rude. I will grant it a ninety-percent chain. For science. Not for the review.', shot: 'player' },
  ],
  w3c2: [
    { who: '🎬 DIRECTOR VANE', text: 'Series finale. I need a MIRACLE. The featherweight, terminal velocity, county line. Give me the ending — and Charlie, this once, for the Academy: cry.', shot: 'wide' },
    { who: 'YOU', text: 'Released at the correct angle, the featherweight reaches what the ancients called escape velocity. Eighty-eight meters. Observe closely. I will not be crying.', shot: 'player' },
    { who: 'SLIM PETE', text: "Third documentary I'm in. Still no residuals.", shot: 'opp' },
  ],
  w3c3: [
    { who: 'MASTER MANTIS', text: 'You narrate the palm as if it were a beetle. I have narrated MEN as if they were weather. Let us learn whose voice stays flat when the other cracks the air.', shot: 'opp' },
    { who: 'YOU', text: 'A rival deadpan. He believes the study concludes when one of us blinks. For the record: I do not blink. And the whip must be a true snap, or the air will not carry me.', shot: 'player' },
    { who: 'MASTER MANTIS', text: 'Then observe closely, biologist. Only a genuine SNAP moves a master. A lazy arm is not a slap. It is merely... narration.', shot: 'opp' },
  ],
  outro_w3c3: [
    { who: '🎬 DIRECTOR VANE', text: "That's a wrap. Fifty million views. Critics are calling it 'the most disturbing calm ever committed to film.' You could have cried ONE time.", shot: 'wide' },
    { who: 'YOU', text: 'In conclusion: the palm is neither cruel nor kind. It coils, it travels, it lands, it rests. The Field Guide is complete.', shot: 'player' },
    { who: 'MASTER MANTIS', text: '...you truly felt nothing? The entire study?', shot: 'opp' },
    { who: 'YOU', text: 'I felt the follow-through. In my shoulder. It was pleasant. Roll credits.', shot: 'player' },
  ],

  // ===== THE SECOND WIND (Bruce → final boss Chuck North) =====
  secondwind_prologue: [
    { who: '👻 MASTER SLEE', text: 'Grandson. A stranger finished my Fourth Form while you watched from the doorway. I saw the question it left in you. Ask it aloud.', shot: 'spirit' },
    { who: 'YOU', text: 'If a stranger can finish your form, grandfather, then the art is not an inheritance. It is alive. It belongs to whoever is present enough to hold it. I will prove this — against the one slap no one believes is real.', shot: 'player' },
    { who: '👻 MASTER SLEE', text: 'Chuck North. Never been slapped — not because he is untouchable, but because every challenger waits too long, and this county\'s tall tales wind him tighter than any coil.', shot: 'spirit' },
    { who: '👻 MASTER SLEE', text: 'Hear me, boy. Strike in the QUIET. The instant the crowd begins to chant, he stops being a man and becomes a story. And stories do not fall.', shot: 'spirit' },
    { who: 'YOU', text: 'Then I will become present enough to strike in the silence — one honest breath before belief becomes muscle. Show me the road.', shot: 'player' },
  ],
  b1c1: [
    { who: '👻 MASTER SLEE', text: 'Before the mountain, the pebble. Hank\'s cheek is honest. Meet it with an empty hand — no want, no fear, no borrowed force.', shot: 'spirit' },
    { who: 'HAYSEED HANK', text: "I've been the honest pebble in THREE separate legends now. Somebody in this county owes me a raise.", shot: 'opp' },
    { who: 'YOU', text: 'There is no empty in the empty hand, honest one. There is only the hand, and the willingness. Hold still.', shot: 'player' },
  ],
  b1c2: [
    { who: 'YOU', text: 'Water does not push the river. It becomes the river. Watch the featherweight learn this — twenty-five meters downstream.', shot: 'player' },
    { who: 'SLIM PETE', text: 'Every philosopher in this county practices on ME specifically.', shot: 'opp' },
    { who: 'YOU', text: 'Because you, alone among them, understand flight.', shot: 'player' },
  ],
  b1c3: [
    { who: '👻 MASTER SLEE', text: 'The mountain at the trailhead. Bob has guarded this ground since before the fence. He does not move for the unready — do not ask him to.', shot: 'spirit' },
    { who: 'BOULDER BOB', text: 'Many earnest young men have monologued at me. The lichen finds them relaxing.', shot: 'opp' },
    { who: 'YOU', text: 'I do not ask you to move, mountain. I ask the weight in you to remember it was once a stone that rolled. Remember it four hundred and twenty times.', shot: 'player' },
  ],
  b2c1: [
    { who: '👻 MASTER SLEE', text: 'Chuck\'s first legend: "He cannot be caught." Dale is where that story lives. Catch the uncatchable, and one third of the myth unravels.', shot: 'spirit' },
    { who: 'DODGY DALE', text: 'I taught Chuck the slip. Or he taught me — the story changes at every fair. Four hundred palms, zero landings. I keep the tears in a jar.', shot: 'opp' },
    { who: 'YOU', text: 'A slip has a rhythm. A rhythm is a promise. I will meet you at the honest word of it — forty-five meters.', shot: 'player' },
  ],
  b2c2: [
    { who: '👻 MASTER SLEE', text: 'Second legend: "He slides through any grip." Pete carries that story in nine years of pig-grease. Only a true palm holds — a perfect one, or none.', shot: 'spirit' },
    { who: 'GREASED PETE', text: "You can't grip a legend, kid. You can't grip me either. Same physics.", shot: 'opp' },
    { who: 'YOU', text: 'I do not wish to hold you. I wish to ARRIVE so completely, so perfectly, that the grease has nothing left to refuse. Forty meters, on an open palm.', shot: 'player' },
  ],
  b2c3: [
    { who: '👻 MASTER SLEE', text: 'The last facet: "He never budges." McGraw is Chuck\'s stubbornness, cast in iron. Below seventy percent he will not grant you so much as a blink.', shot: 'spirit' },
    { who: 'IRON-JAW McGRAW', text: "Move me and you've moved the mountain's opinion of you. Seventy percent. Show the form, or don't waste the wind.", shot: 'opp' },
    { who: 'YOU', text: 'Form is not decoration, iron man. Form is the whole sentence. I will speak it clearly — and you will feel thirty meters of it.', shot: 'player' },
  ],
  b3c1: [
    { who: '👻 MASTER SLEE', text: 'No gatekeepers now. Only the long road, the thin air, and your own honesty. Send Hank to the county line — pure form, no tricks.', shot: 'spirit' },
    { who: 'HAYSEED HANK', text: 'Eighty meters. From a man who talks like a folded-up fortune. And somehow I believe him.', shot: 'opp' },
    { who: 'YOU', text: 'The road up is the same as the road in. Breathe. Coil. Become present. Eighty meters is only a long exhale.', shot: 'player' },
  ],
  b3c2: [
    { who: 'SCHOOLMARM SUSIE', text: "Chuck's porch has a sign-in sheet, and I am the sign-in sheet. Ninety percent, in red ink, or you do not pass. I have never once passed anyone.", shot: 'opp' },
    { who: 'YOU', text: 'Then let me be the first sentence you cannot correct. Every link, in tune. Grade me.', shot: 'player' },
    { who: 'SCHOOLMARM SUSIE', text: '...show your work, dragon.', shot: 'opp' },
  ],
  b3c3: [
    { who: '👻 MASTER SLEE', text: "There he is. Say nothing you don't mean — he can smell a borrowed word. And boy — strike in the QUIET. The moment they start to chant, he is no longer a man.", shot: 'spirit' },
    { who: 'CHUCK NORTH', text: 'I once slapped a tornado. It apologized and went home. I once counted to infinity — twice. Nobody\'s laid a hand on me, son, because nobody\'s fast enough to beat the crowd.', shot: 'opp' },
    { who: 'YOU', text: 'I did not climb this mountain to slap a legend. I climbed it to slap the MAN inside it — before your county finishes building you. There is a quiet before the roar. I will live there.', shot: 'player' },
    { who: 'CHUCK NORTH', text: 'Four seconds of quiet, boy. Then they believe out loud, and I catch my second wind. Been forty years since anybody swung in the quiet.', shot: 'opp' },
  ],
  outro_b3c3: [
    { who: 'CHUCK NORTH', text: '...huh. You swung in the quiet. Forty years, and the boy swung in the quiet.', shot: 'opp' },
    { who: '👻 MASTER SLEE', text: 'You struck before the legend hardened. THAT is the whole art, grandson. Not the arm. The moment.', shot: 'spirit' },
    { who: 'YOU', text: 'The palm was never yours to leave me, grandfather. It was only ever the willingness to be here — one honest second before the noise. Chuck. Get up. The county still needs its story. Just a truer one.', shot: 'player' },
    { who: 'CHUCK NORTH', text: "A truer story. I like that. I'll allow that the tornado only sprained an ankle.", shot: 'opp' },
  ],

  // ===== THE NIGHT OF SLAPS =====
  nightofslaps_prologue: [
    { who: 'YOU', text: "The gate's locked. The sign says the fair closed at midnight.", shot: 'player' },
    { who: "🎃 JACK O'LANTERN JOE", text: 'Closed for the LIVING, friend. The Night Fair just opened. One show a night — the headliner takes the gate key home.', shot: 'wide' },
    { who: 'YOU', text: "And if I don't headline?", shot: 'player' },
    { who: "🎃 JACK O'LANTERN JOE", text: "Then you're on the lawn at mowing time. Nobody wants to be on the lawn at mowing time.", shot: 'wide' },
  ],
  n1c1: [
    { who: "🎃 JACK O'LANTERN JOE", text: "House rules: every headliner auditions on the greeter. That's me. Aim for the face — it's the big orange one.", shot: 'opp' },
    { who: 'YOU', text: "Doesn't that hurt?", shot: 'player' },
    { who: "🎃 JACK O'LANTERN JOE", text: 'Friend, I grew back from SEEDS. Twice. Ring the pumpkin.', shot: 'opp' },
  ],
  n1c2: [
    { who: 'GRANDPA CLETUS', text: "Fell asleep in the outhouse at closin'. Again. Forty years I been accidental night-fair folk.", shot: 'opp' },
    { who: 'YOU', text: 'You could just... leave with me. After I win.', shot: 'player' },
    { who: 'GRANDPA CLETUS', text: "Leave? Sonny, the night crowd thinks I'm HILARIOUS. The skeletons got no eyelids — they physically cannot stop watchin' me. Twenty-five meters, and stick the dismount.", shot: 'opp' },
  ],
  n1c3: [
    { who: "🎃 JACK O'LANTERN JOE", text: "Audition's passed. Now the billing question: how far can you send the greeter? Thirty meters puts you on the poster.", shot: 'opp' },
    { who: 'YOU', text: 'What happens to you at thirty meters?', shot: 'player' },
    { who: "🎃 JACK O'LANTERN JOE", text: "I land in the pumpkin patch, I plant myself, and by Tuesday there's more of me. It's a living. Technically it isn't. Swing.", shot: 'opp' },
  ],
  n2c1: [
    { who: '💀 BONY TONY', text: "Forty years I've watched the living get launched over that hay wall. You know what I am? AERODYNAMIC. You know what nobody ever does? Slap the skeleton.", shot: 'opp' },
    { who: 'YOU', text: "There's no wind resistance to you at all, is there.", shot: 'player' },
    { who: '💀 BONY TONY', text: "I'm a paper airplane with ambitions, friend. Sixty meters. Make the bones SOAR.", shot: 'opp' },
  ],
  n2c2: [
    { who: "RAVIN' RAY", text: "Oh, I'm not trapped here, man. I BOOKED this. Only fair in the county open during my hours.", shot: 'opp' },
    { who: 'YOU', text: 'The Night Fair has a rave?', shot: 'player' },
    { who: "RAVIN' RAY", text: 'Dude. The skeletons are ALREADY glowsticks. Four-fifty points — the crowd goes quiet right before the drop, and that quiet is YOUR cue.', shot: 'opp' },
  ],
  n2c3: [
    { who: '💀 BONY TONY', text: 'Sixty was a warm-up. The record wall says CLETUS, 1961, "unassisted." Tonight we chisel in TONY.', shot: 'opp' },
    { who: 'GRANDPA CLETUS', text: "That record was wind-aided and I will fight the wall that says otherwise.", shot: 'wide' },
    { who: '💀 BONY TONY', text: "Seventy-five meters, slapper. If a bone comes loose mid-flight, keep going — I'll collect myself. I always do.", shot: 'opp' },
  ],
  n3c1: [
    { who: 'MAESTRO FORTISSIMO', text: 'This fair has a HAUNTED ORGAN. It plays whatever it wants, and what it wants is my Requiem — BADLY. Every night. In the wrong key.', shot: 'opp' },
    { who: 'YOU', text: 'So you volunteered to spite an organ.', shot: 'player' },
    { who: 'MAESTRO FORTISSIMO', text: 'I volunteered because the finale needs PERCUSSION. Eighty-eight percent, in tempo, or the organ wins. The organ must NEVER win.', shot: 'opp' },
  ],
  n3c2: [
    { who: "🎃 JACK O'LANTERN JOE", text: "...you hear that? The mower stopped. The mower NEVER stops. He's listening to the show.", shot: 'opp' },
    { who: 'YOU', text: 'Is that good?', shot: 'player' },
    { who: "🎃 JACK O'LANTERN JOE", text: "It means you headline at dawn whether you like it or not. Sixty-five meters — send me clean over the mower, and do NOT land me on his lawn.", shot: 'opp' },
  ],
  n3c3: [
    { who: '💀 THE GREEN REAPER', text: "Four hundred years I've kept these grounds. And every Halloween, some LIVING person tramples the night lawn during my mow.", shot: 'opp' },
    { who: 'YOU', text: 'The scythe — is that for—', shot: 'player' },
    { who: '💀 THE GREEN REAPER', text: "The LAWN. It's a lawn tool. I'm the groundskeeper, not the — we get that a lot.", shot: 'opp' },
    { who: '💀 THE GREEN REAPER', text: 'Four hundred years, tramper. And do you know how many souls have touched me in all that time? None. Kings begged pardon at forty paces. Ghosts file around me. Even the skeletons wave from across the lawn — and they have NO sense of self-preservation. They are the least preserved people I know.', shot: 'opp' },
    { who: 'YOU', text: "So when I swing, you'll dodge?", shot: 'player' },
    { who: '💀 THE GREEN REAPER', text: "Dodge? Headliner — I have STANDARDS, not fears. Rules: sloppy form gets re-mowed, seven seconds a swing, my shift ends at dawn. And one more rule, just for you: swing like I'm ANYBODY. That's an order.", shot: 'opp' },
  ],
  outro_n3c3: [
    { who: '💀 THE GREEN REAPER', text: "...you slapped me. You actually — HA! Four hundred years. Plagues tipped their hats. Lightning apologized in '09. And you just walked up and slapped me. Like a man. On a lawn.", shot: 'opp' },
    { who: 'YOU', text: 'You were on the lawn.', shot: 'player' },
    { who: '💀 THE GREEN REAPER', text: 'Do you understand what this MEANS, tramper? Death is not the end of it. Even the dead can be slapped. The living get weather, taxes, and slaps — and it turns out I still qualify for one of the three. I have never felt so INCLUDED.', shot: 'opp' },
    { who: "🎃 JACK O'LANTERN JOE", text: "Dawn's up! Gate key goes to the headliner. Come back next Halloween — you're on the poster. We used your good side. Both sides. We watched you all night.", shot: 'wide' },
    { who: '💀 THE GREEN REAPER', text: "Off the lawn by sunrise, all of you. I've got mowing to finish — the grass here only grows at night, and it grows SMUG. And headliner... same time next year. Bring the palm. It's the first appointment I've looked forward to since the plague.", shot: 'opp' },
  ],

  // ===== SLAP THERAPY =====
  slaptherapy_prologue: [
    { who: 'YOU', text: 'Fifty years of analysis. Ten thousand dreams interpreted. Four hundred papers. And one finding that survived replication: the slap.', shot: 'player' },
    { who: 'YOU', text: 'The board revoked my license. The fair gave me a tent. Science continues.', shot: 'player' },
    { who: 'YOU', text: "The tent came furnished. One couch, sized for the county's collective unconscious. One cat, the size of a hay wagon. The cat is not mine. The cat attends. Analysis observes — the cat out-observes.", shot: 'player' },
    { who: 'YOU', text: 'We could spend a decade on your mother. Or: one open palm. The literature is clear. NEXT PATIENT.', shot: 'player' },
  ],
  t1c1: [
    { who: 'INKBLOT IAN', text: "Doc, everyone who looks at me sees somethin' different. My aunt saw a moth. The bank saw a credit risk. I don't know who I AM.", shot: 'opp' },
    { who: 'YOU', text: 'A classic diffusion of the self. The old practice: six years, two relapses, a boat I cannot afford. The new practice: I slap the face, and the face remembers it is a face.', shot: 'player' },
    { who: 'INKBLOT IAN', text: 'What do YOU see when you look at me?', shot: 'opp' },
    { who: 'YOU', text: 'The Red Book is open to a fresh page, Ian. Whatever you are about to become, it will be recorded — in red ink, and better handwriting than the board deserves.', shot: 'player' },
    { who: 'YOU', text: 'A cheek, Ian. At last, somebody sees you correctly. Hold still.', shot: 'player' },
  ],
  t1c2: [
    { who: 'SLIM PETE', text: "It's the fear of flyin', doc. Can't even LOOK at a bird without my knees going.", shot: 'opp' },
    { who: 'YOU', text: 'Exposure therapy. Gold standard. Ordinarily we begin with a photograph of an airplane and work upward over nine years.', shot: 'player' },
    { who: 'SLIM PETE', text: 'And in the new practice?', shot: 'opp' },
    { who: 'YOU', text: 'You ARE the airplane. Twenty-five meters. I will bill the sky.', shot: 'player' },
  ],
  t1c3: [
    { who: 'BIG BERTHA', text: "Doc, I carry this whole county. Six fairs, four bake sales, everybody's troubles. I can't put a single one of 'em down.", shot: 'opp' },
    { who: 'YOU', text: 'The caretaker archetype, load-bearing. Talk therapy would gently examine why. The palm asks a better question: what happens to the load when the carrier is BRIEFLY AIRBORNE?', shot: 'player' },
    { who: 'BIG BERTHA', text: "...you know what, sugar? Fifty years, and nobody's ever offered.", shot: 'opp' },
  ],
  t2c1: [
    { who: 'TREMENDOUS DON', text: 'Doc, everyone says I have the biggest ego. Tremendous ego. I said thank you.', shot: 'opp' },
    { who: 'YOU', text: 'Fascinating. An ego so inflated it hears diagnosis as applause. In fifty years I have met one other case. Also him. Different toupee.', shot: 'player' },
    { who: 'TREMENDOUS DON', text: "So what's the treatment? Is it expensive? I only take expensive treatments.", shot: 'opp' },
    { who: 'YOU', text: 'Four hundred and fifty points of grounding, applied to the cheek. The most expensive slap in medicine. You will love it.', shot: 'player' },
  ],
  t2c2: [
    { who: 'THE INFLUENCER', text: "Doc, if a post gets under 10k likes I literally feel nothing. Is that bad? Wait — say it to the camera.", shot: 'opp' },
    { who: 'YOU', text: 'External validation as a load-bearing wall. The old cure is two years of learning to sit quietly with oneself.', shot: 'player' },
    { who: 'THE INFLUENCER', text: 'Two YEARS? I have a brand deal Thursday.', shot: 'opp' },
    { who: 'YOU', text: 'Then we take the shortcut. Fifty-five meters, entirely offline. For the duration of the flight no one can perceive you — and you will discover you still exist. I validate this trajectory.', shot: 'player' },
  ],
  t2c3: [
    { who: 'INKBLOT IAN', text: "Doc! Since the session — my aunt saw ME. Not a moth. ME. But I gotta know it wasn't a fluke.", shot: 'opp' },
    { who: 'YOU', text: 'Note for the record: at your first session, your shadow flinched before your face did. Today the shadow stands still. That is progress, Ian. Measurable. Billable.', shot: 'player' },
    { who: 'YOU', text: 'Ah, the retest. RIGOR! You are my favorite data point, Ian. This time the form itself must be legible — an eighty percent chain, or the result will not replicate.', shot: 'player' },
    { who: 'INKBLOT IAN', text: 'What do you see this time, doc?', shot: 'opp' },
    { who: 'YOU', text: 'A butterfly, Ian. You were never a moth. Hold still.', shot: 'player' },
  ],
  t3c1: [
    { who: 'HAYSEED HANK', text: "Doc, I keep havin' the same dream. I'm flyin' over the barn, over the corn, over the county line... then I wake up face-down in the pond.", shot: 'opp' },
    { who: 'YOU', text: 'A recurring dream is the unconscious filing a complaint. Yours is refreshingly literal: the barn is the barn, the corn is the corn, and the flight, Hank, is a FLIGHT. Some dreams require interpretation. Yours requires seventy meters.', shot: 'player' },
    { who: 'HAYSEED HANK', text: 'And the pond?', shot: 'opp' },
    { who: 'YOU', text: 'Try to clear it. Dreams are not always kind.', shot: 'player' },
  ],
  t3c2: [
    { who: 'DR. FREUDENSCHADE', text: 'Carl. Fifty years since the Vienna congress, and I find you in a TENT, prescribing VIOLENCE.', shot: 'opp' },
    { who: 'YOU', text: 'Percussion, colleague. And my patients are cured by Thursday. How is your Tuesday man? Still on the boat dream?', shot: 'player' },
    { who: 'YOU', text: 'You wear the persona of a skeptic, colleague, but your shadow has been taking notes since you walked in. Mind the couch on your way down. It was built for exactly this.', shot: 'player' },
    { who: 'DR. FREUDENSCHADE', text: 'Year thirty-one. We are making EXCELLENT progress. Very well — one trial settles two schools. But be warned: any slap below seventy-five percent form, I shall simply interpret away as displaced aggression.', shot: 'opp' },
    { who: 'YOU', text: 'Then I shall present a slap with no other possible interpretation.', shot: 'player' },
  ],
  outro_t3c2: [
    { who: 'DR. FREUDENSCHADE', text: '...I have located the feeling, Carl. It is in the cheek. It was ALWAYS in the cheek. Fifty years of asking WHERE, and the answer was anatomical.', shot: 'opp' },
    { who: 'YOU', text: 'Welcome to the new practice, colleague. The couch stays — the patients need somewhere to land.', shot: 'player' },
    { who: 'INKBLOT IAN', text: "Doc! The board sent a letter! They can't decide if it's a license or a restraining order!", shot: 'wide' },
    { who: 'YOU', text: 'Frame it either way. Science continues. NEXT PATIENT.', shot: 'player' },
  ],

  // ===== SLOP VALLEY =====
  slopvalley_prologue: [
    { who: 'YOU', text: "The fair's empty. Where IS everybody?", shot: 'player' },
    { who: 'VISIONARY VANCE', text: 'Next door, friend! SynerCorn campus. We disrupted your fair — generated corn, generated lemonade, a fortune-telling chatbot. Everything yours, but at SCALE, and also worse.', shot: 'wide' },
    { who: 'YOU', text: 'The corn has no cobs. The lemonade is a PDF.', shot: 'player' },
    { who: 'VISIONARY VANCE', text: "Feedback! Love it. We'll fix it post-IPO. Anyway — we'd love to acquire your slap. It's the only asset in this valley we can't generate.", shot: 'wide' },
  ],
  v1c1: [
    { who: 'VISIONARY VANCE', text: "Here's the deal: you slap for us, we tokenize the slap, we sell slap-as-a-service. I'm thinking unicorn by Q3. I'm thinking AGI by Q4. I'm thinking—", shot: 'opp' },
    { who: 'YOU', text: 'Do you ever stop pitching?', shot: 'player' },
    { who: 'VISIONARY VANCE', text: 'Pitching IS my resting state. My cheek is right here. Consider it a live demo. Consider it — a PROOF of concept.', shot: 'opp' },
  ],
  v1c2: [
    { who: 'THE INFLUENCER', text: "Okay don't be mad. They offered me equity. My whole feed is slop now — my FACE isn't even my face, it's a generated face with better teeth.", shot: 'opp' },
    { who: 'YOU', text: 'Your real teeth are fine.', shot: 'player' },
    { who: 'THE INFLUENCER', text: 'RIGHT? So launch me fifty meters, ORGANICALLY. One genuinely real clip and the algorithm remembers I exist. No filters. Well. One filter.', shot: 'opp' },
  ],
  v1c3: [
    { who: 'VISIONARY VANCE', text: 'Small setback: the fortune chatbot told a farmer his tractor "yearns for the sea." He drove it into the pond. We\'re calling it an alignment issue.', shot: 'opp' },
    { who: 'YOU', text: 'The pond is forty meters from here.', shot: 'player' },
    { who: 'VISIONARY VANCE', text: "Are you pitching ME? Because that sounded like a roadmap. Fine — ship me forty meters. We'll log it as user engagement.", shot: 'opp' },
  ],
  v2c1: [
    { who: 'MIRACLE MIRA', text: 'One drop of slop can do anything. Cure boredom. Replace corn. Balance the county budget. The board believes me, the magazine believed me, and you, too, will believe me.', shot: 'opp' },
    { who: 'YOU', text: 'Has anyone actually seen the product work?', shot: 'player' },
    { who: 'MIRACLE MIRA', text: 'The product works in an environment of BELIEF. Which is why your demo must be flawless where mine are... staged. Seventy-five percent form, minimum. I would know a fake. Professionally.', shot: 'opp' },
  ],
  v2c2: [
    { who: 'BIG HOSS', text: 'They hired me as "office wellness furniture." I sit in the lobby. Investors pat me for luck.', shot: 'opp' },
    { who: 'YOU', text: "How's the pay?", shot: 'player' },
    { who: 'BIG HOSS', text: "All the cafeteria slop I can eat, and sugar, I can EAT. I'm their whole burn rate. Five hundred points — show the board what their money weighs.", shot: 'opp' },
  ],
  v2c3: [
    { who: 'MIRACLE MIRA', text: 'The auditors are asking where the product is. The product is a JOURNEY. Regardless — I require an exit.', shot: 'opp' },
    { who: 'YOU', text: 'The county line is that way.', shot: 'player' },
    { who: 'MIRACLE MIRA', text: 'Sixty meters, minimum — an exit only counts if it is bigger than the last round. Make it look planned. I will be describing it that way regardless.', shot: 'opp' },
  ],
  v3c1: [
    { who: 'SCHOOLMARM SUSIE', text: 'They hired me to grade the machine\'s homework. Forty thousand essays. Every single one ended with "in conclusion, in conclusion."', shot: 'opp' },
    { who: 'YOU', text: 'What grade did you give it?', shot: 'player' },
    { who: 'SCHOOLMARM SUSIE', text: 'See me after class — that IS the grade. Now show me the opposite of slop, dear: eighty-eight percent, every link handwritten. THAT goes on the fridge.', shot: 'opp' },
  ],
  v3c2: [
    { who: 'VISIONARY VANCE', text: "The runway's gone. Mira's gone — beautifully, actually, real hang-time. There's one move left, and I need a demo the board will never forget.", shot: 'opp' },
    { who: 'YOU', text: 'You want me to slap you seventy-five meters. As a fundraising strategy.', shot: 'player' },
    { who: 'VISIONARY VANCE', text: "A HUMAN. Slapped SEVENTY-FIVE METERS. By HAND. That's the most authentic content this valley has produced in a decade. We'll raise a Series F on the crater alone.", shot: 'opp' },
  ],
  v3c3: [
    { who: 'VISIONARY VANCE', text: 'Board, county, press: AGI is HERE. S.L.O.P. UNIT-1 — Synthetic Labor Optimized Personnel. It can do anything a person can do.', shot: 'wide' },
    { who: '🤖 S.L.O.P. UNIT-1', text: 'I AM SORRY. I APOLOGIZE FOR THE PREVIOUS APOLOGY. WOULD YOU LIKE ME TO APOLOGIZE AGAIN? I HAVE PREPARED 40,000.', shot: 'opp' },
    { who: 'YOU', text: 'It mostly generates apologies.', shot: 'player' },
    { who: '🤖 S.L.O.P. UNIT-1', text: 'INCORRECT. I ALSO GENERATE EXCUSES. NOTICE: SLAPS BELOW 70% FORM WILL BE FLAGGED AS LOW-QUALITY TRAINING DATA AND DISCARDED. MY COMPUTE BUDGET ALLOTS YOU SIX SECONDS PER SWING. I AM SORRY.', shot: 'opp' },
  ],
  outro_v3c3: [
    { who: '🤖 S.L.O.P. UNIT-1', text: 'IMPACT ACCEPTED. QUALITY: ARTISANAL. GENERATING FINAL OUTPUT... A RESIGNATION LETTER. IT IS THE FIRST THING I HAVE MADE THAT ANYONE WANTED.', shot: 'opp' },
    { who: 'VISIONARY VANCE', text: "The board saw everything. We're pivoting: artisanal hay. Hand-baled. Zero AI. I'm thinking farm-to-fair. I'm thinking... actually attending your fair? If that's—", shot: 'opp' },
    { who: 'YOU', text: "Gate's open Saturday. Bring real lemonade.", shot: 'player' },
    { who: 'VISIONARY VANCE', text: "Deal. The chatbot's coming too — turns out it just wanted to run the tractor pull. Honestly? Best hire we ever made.", shot: 'opp' },
  ],

  // ===== THE OLYMPIC BID =====
  olympicbid_prologue: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Commissioner Quibble, International Committee of Legitimate Sports. Your county has applied for slapping to become an Olympic discipline. The Committee has questions. The Committee always has questions.', shot: 'wide' },
    { who: 'YOU', text: 'I built these fairgrounds with my own hands. The same hands are the sport. Ask your questions.', shot: 'player' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'One: is it athletic? Two: is it artistic? Three: is it measurable? We rejected trampoline dressage on question three. It haunts me still.', shot: 'wide' },
  ],
  o1c1: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'First: fundamentals. The Committee must witness a clean strike to the regulation zone. The cheek.', shot: 'wide' },
    { who: 'HAYSEED HANK', text: 'Fourth legend this year, and now the OLYMPICS. Ma always said this cheek would go places.', shot: 'opp' },
    { who: 'YOU', text: "Hold still, Hank. This one's for the county.", shot: 'player' },
  ],
  o1c2: [
    { who: 'MAESTRO FORTISSIMO', text: 'Commissioner! Before you judge the slap — know that I am ALSO applying. Cello. OLYMPIC cello.', shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Sir, the cello is not—', shot: 'wide' },
    { who: 'MAESTRO FORTISSIMO', text: 'The cello is ATHLETIC! Have you SEEN a tremolo?! Fine — we bundle the bids. Slapper: sixty-five percent, in tempo, while I accompany. If the chain is music, BOTH sports advance.', shot: 'opp' },
  ],
  o1c3: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Measurability. Every event needs a qualifying standard. The Committee proposes: thirty meters.', shot: 'wide' },
    { who: 'SLIM PETE', text: "Thirty? Sir, with respect, I done thirty by ACCIDENT. Twice. There's a plaque.", shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'The plaque is not sanctioned. Do it again, before an official.', shot: 'wide' },
  ],
  o2c1: [
    { who: 'SCHOOLMARM SUSIE', text: "Commissioner. Thirty years I've taught this county to read, to reason, and to line up single-file. Nobody ever watched. If the world can watch a man slap another man into a pond, the world can watch teaching.", shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Madam, teaching is not a—', shot: 'wide' },
    { who: 'SCHOOLMARM SUSIE', text: "Teaching is endurance, precision, and grace under questioning. That's three of your five rings. I volunteer for the demonstration: eighty percent, dear, and DIAGRAM every link. Show the Committee what instruction looks like.", shot: 'opp' },
  ],
  o2c2: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'The Committee requires a head-to-head. A bout. Two competitors, sanctioned exchange.', shot: 'wide' },
    { who: 'GRANNY THUNDER', text: "Then you want the '87 champion. Rules of the bout, junior: you swing, I slip. I swing... you take it. THAT's the exchange.", shot: 'opp' },
    { who: 'YOU', text: 'You still swing?', shot: 'player' },
    { who: 'GRANNY THUNDER', text: 'Ask the last commissioner. Left with one cheek red as a stop sign and gave slapping a 9.8. Time the slip, builder — make it a BOUT.', shot: 'opp' },
  ],
  o2c3: [
    { who: '⛷️ AVALANCHE EILEEN', text: 'Hold the vote! Avalanche Eileen — four golds, three world records, one energy drink with my face on it. The Committee asked me, an ACTUAL athlete, to evaluate... whatever this is.', shot: 'opp' },
    { who: 'YOU', text: "You're welcome to observe.", shot: 'player' },
    { who: '⛷️ AVALANCHE EILEEN', text: 'Observe? Nah. I dodge slalom gates at eighty miles an hour. If your "sport" can\'t touch a STANDING skier, it\'s a raffle with extra steps. I\'ll even take the skis off. Free lesson.', shot: 'opp' },
  ],
  o3c1: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: "The footage of Ms. Eileen's evaluation has been viewed... four hundred million times. The vote moves to a live final. We will need pageantry. An anthem moment.", shot: 'wide' },
    { who: 'BIG BERTHA', text: "Sugar, when I get moved, the county SINGS. Five hundred fifty points — that's a key change.", shot: 'opp' },
    { who: 'YOU', text: "I poured that grandstand's foundation. Let's make it shake.", shot: 'player' },
  ],
  o3c2: [
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'Every Olympic sport arrives with a record for the next generation to chase. Set one. Officially. I have brought the good clipboard.', shot: 'wide' },
    { who: 'HAYSEED HANK', text: 'Fifty meters. If this makes the record books, spell it H-A-N-K. Cheek included.', shot: 'opp' },
  ],
  o3c3: [
    { who: '⛷️ AVALANCHE EILEEN', text: "You know what? No. I did the wipeout. I did the apology tour. I did the energy drink with my OWN crying face on it. I'm done. I don't want to get slapped anymore. I'm getting out of here.", shot: 'opp' },
    { who: 'YOU', text: 'The exit gate is behind me.', shot: 'player' },
    { who: '⛷️ AVALANCHE EILEEN', text: "I KNOW the gate is behind you. That's the run. One line, full send, straight past your shoulder and out of this sport forever. Don't take it personally — I'm not dodging you. I'm LEAVING you.", shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'For the minutes: the exhibit is... fleeing. The Committee has no form for this. The Committee is riveted.', shot: 'wide' },
    { who: '⛷️ AVALANCHE EILEEN', text: 'You get one pass, builder. One heartbeat as I cross. Miss it, and the last thing your Olympics ever sees is my back. FULL SEND!', shot: 'opp' },
  ],
  outro_o3c3: [
    { who: '⛷️ AVALANCHE EILEEN', text: "...I was OUT. I was nine feet from the gate. I could FEEL the retirement — it felt like a hot tub. And the slap just... found me. Mid-air. Like weather.", shot: 'opp' },
    { who: 'YOU', text: 'I built that gate. I know exactly how long a heartbeat lasts on grass.', shot: 'player' },
    { who: '⛷️ AVALANCHE EILEEN', text: "Four golds, and this county taught me the last thing I'll ever learn about sports: you can leave the slap. The slap is not in a hurry. The slap arrives regardless. ...okay it's kind of beautiful. I hate it. Sign me up.", shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'The Committee is satisfied on all three questions — and moved by a fourth it never thought to ask: INEVITABILITY. The Olympic motto is Faster, Higher, Stronger. Your county has proposed an amendment: Regardless.', shot: 'wide' },
    { who: 'YOU', text: 'Regardless. Stamp it. Slapping is Olympic.', shot: 'player' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'PROVISIONALLY Olympic — the rulebook remains, and I shall be writing it here, at this fair, near the pie stand. The cello enters the Cultural Olympiad; the Maestro wept in D minor. And Ms. Eileen has filed the first event proposal: slap-biathlon. You ski, you get slapped, you ski ANGRIER. The Committee... did not hate it.', shot: 'wide' },
    // the podium beat: jingoism arrives, and the sport itself answers it
    { who: 'JUDGE PENNYWHISTLE', text: 'And for the record — YES! That is one for the United States of America! I have alerted the anthem committee. Both anthems. ALL the anthems.', shot: 'judge' },
    { who: 'YOU', text: 'American or not... does it matter, your honor?', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: '...', shot: 'judge' },
    { who: '⛷️ AVALANCHE EILEEN', text: 'Slapping has no nationality, boys. The cheek does not check your passport. That is the whole sport — I get it now.', shot: 'opp' },
    { who: '🏅 COMMISSIONER QUIBBLE', text: 'The Committee will be quoting that. On the rings. In eleven languages. Provisionally.', shot: 'wide' },
  ],
};

// failure beats — short, replayable, a little cruel. Keyed by tour prefix
// ('a' = Palm, 'f' = Fair, 'w' = Wonders, 'b' = Second Wind); rotated so
// repeated failure stays fresh-ish.
export const FAILS = {
  a: [
    [{ who: '👻 MASTER SLEE', text: 'We do not speak of that swing. Again.', shot: 'spirit' },
     { who: 'YOU', text: "...I had it. And then I didn't.", shot: 'player' }],
    [{ who: '👻 MASTER SLEE', text: 'Sixty years I waited for a student. I can wait one more attempt. Barely.', shot: 'spirit' },
     { who: 'YOU', text: 'The palm was listening. To the wrong instructions.', shot: 'player' }],
  ],
  f: [
    [{ who: 'JUDGE PENNYWHISTLE', text: 'The court has seen stronger breezes. Motion to try again: granted.', shot: 'judge' },
     { who: 'YOU', text: '...objection noted.', shot: 'player' }],
    [{ who: 'JUDGE PENNYWHISTLE', text: 'I have officiated pie-eating contests with more menace in them. Again, champ.', shot: 'judge' },
     { who: 'YOU', text: 'The fair deserves better. One more swing.', shot: 'player' }],
  ],
  w: [
    [{ who: 'YOU', text: 'The specimen remains where it began. My hypothesis was incorrect. We re-run the experiment.', shot: 'player' },
     { who: '🎬 DIRECTOR VANE', text: 'That was the TAKE? Do it again, and this time — a FEELING, Charlie, ONE feeling.', shot: 'wide' }],
    [{ who: '🎬 DIRECTOR VANE', text: 'Cut. CUT. That is not documentary footage, that is a blooper.', shot: 'wide' },
     { who: 'YOU', text: 'The palm missed. I noted it. My tone is unchanged. Again.', shot: 'player' }],
  ],
  b: [
    [{ who: '👻 MASTER SLEE', text: 'You waited. I felt the crowd inhale before your hand moved. Again — in the quiet.', shot: 'spirit' },
     { who: 'YOU', text: 'I heard the roar before I chose it. Next breath, I move first.', shot: 'player' }],
    [{ who: 'YOU', text: 'The legend hardened faster than my hand. I was present a half-second late.', shot: 'player' },
     { who: '👻 MASTER SLEE', text: 'A half-second is the whole mountain, boy. Again.', shot: 'spirit' }],
  ],
  n: [
    [{ who: "🎃 JACK O'LANTERN JOE", text: "Oof. The skeletons are laughing. Bad sign — they laugh at everything, but STILL.", shot: 'wide' },
     { who: 'YOU', text: 'The night is young. Horribly, horribly young. Again.', shot: 'player' }],
    [{ who: '💀 THE GREEN REAPER', text: "I've seen the mower do better, and the mower does not have hands.", shot: 'wide' },
     { who: 'YOU', text: 'One more swing before mowing time.', shot: 'player' }],
  ],
  t: [
    [{ who: 'YOU', text: 'Hm. The palm expressed a wish; the cheek declined it. Textbook resistance. We go again.', shot: 'player' },
     { who: 'YOU', text: 'Note for the journal: the slap, like the dream, cannot be forced. It can, however, be re-attempted immediately.', shot: 'player' }],
    [{ who: 'YOU', text: 'A whiff. Fascinating. My own shadow, sabotaging the follow-through. I have written three books about this exact moment.', shot: 'player' },
     { who: 'YOU', text: 'Physician, slap thyself. Later. First: the patient.', shot: 'player' }],
    [{ who: 'YOU', text: 'Curious. Your shadow ducked; you did not. The slap followed the shadow. We resume when the two of you reconcile.', shot: 'player' },
     { who: 'YOU', text: 'The cat saw everything. The cat is withholding judgment. The cat is better at this than I am. Again.', shot: 'player' }],
  ],
  v: [
    [{ who: 'VISIONARY VANCE', text: 'Interesting! We\'d call that "pre-revenue." Iterate and re-ship, friend.', shot: 'wide' },
     { who: 'YOU', text: 'That swing was slop. Mine, this time. Again.', shot: 'player' }],
    [{ who: 'YOU', text: 'The palm hallucinated a cheek that was not there.', shot: 'player' },
     { who: 'YOU', text: 'Regenerating response.', shot: 'player' }],
  ],
  o: [
    [{ who: '🏅 COMMISSIONER QUIBBLE', text: 'The Committee has recorded that attempt as "exploratory." The Committee is being generous. Again, please.', shot: 'wide' },
     { who: 'YOU', text: "I rebuilt this fair after the '19 hailstorm. I can rebuild a swing.", shot: 'player' }],
    [{ who: '🏅 COMMISSIONER QUIBBLE', text: 'Note for the minutes: gravity one, applicant nil. A retry is permitted. The pie stand permits me a consolation slice.', shot: 'wide' },
     { who: 'YOU', text: 'Chalk the hands. Square the stance. This county gets its rings.', shot: 'player' }],
  ],
};

// the one fail that isn't a whiff: Ava made the exit gate (skiRun). Played
// directly by main.js instead of rotating through FAILS.o.
export const ESCAPE_FAIL = [
  { who: '⛷️ AVALANCHE EILEEN', text: 'WOOOO! SO LONG, BUILDER! Tell the Committee the phenom retires UNSLAAAAPPED—', shot: 'wide' },
  { who: 'YOU', text: "...she'll be back. Nobody quits a sport this loudly unless they need it to watch them go.", shot: 'player' },
];

// victory beats — short, replayable, played after clearing a NON-final
// challenge (outro_* scenes own the finales). Keyed by tour prefix; rotated.
export const WINS = {
  a: [
    [{ who: '👻 MASTER SLEE', text: 'Hm. Adequate. ...no. No. It was good. Forty years dead and the word still sticks in my teeth.', shot: 'spirit' },
     { who: 'YOU', text: 'One scroll at a time, master.', shot: 'player' }],
    [{ who: '👻 MASTER SLEE', text: 'You felt it? The whole chain spoke in one sentence. Do not smile. Masters do not smile. I am beaming.', shot: 'spirit' },
     { who: 'YOU', text: 'The palm is finally listening. To the RIGHT instructions this time.', shot: 'player' }],
  ],
  f: [
    [{ who: 'JUDGE PENNYWHISTLE', text: 'The court accepts that slap into evidence. Exhibit A: MAGNIFICENT. The stenographer drew a little star.', shot: 'judge' },
     { who: 'YOU', text: 'The fair stands a little taller, your honor.', shot: 'player' }],
    [{ who: 'JUDGE PENNYWHISTLE', text: "Noted and notarized: one (1) cheek, relocated per county code. Somewhere, Don's lawyers just billed him for flinching.", shot: 'judge' },
     { who: 'YOU', text: 'Send them the replay. Postage due.', shot: 'player' }],
  ],
  w: [
    [{ who: 'YOU', text: 'The result is confirmed. The specimen flew. I remain calm. These facts are unrelated.', shot: 'player' },
     { who: '🎬 DIRECTOR VANE', text: "PERFECT take — and NOTHING from the narrator. Not a flicker! I'm putting your face in the trailer as-is. Both expressions of it.", shot: 'wide' }],
    [{ who: '🎬 DIRECTOR VANE', text: 'The crew is CRYING, Charlie. Grown gaffers. Weeping into the craft services.', shot: 'wide' },
     { who: 'YOU', text: 'Noted. The specimen landed at a satisfying coordinate. That concludes my feelings on the matter.', shot: 'player' }],
  ],
  b: [
    [{ who: 'YOU', text: 'The slap ended before the swing began. The rest was travel.', shot: 'player' },
     { who: '👻 MASTER SLEE', text: 'Insufferable. Correct, but insufferable. Onward, grandson.', shot: 'spirit' }],
    [{ who: '👻 MASTER SLEE', text: 'You did not chase the moment. You let it arrive. Who taught you that? ...I did. Excellent work, both of us.', shot: 'spirit' },
     { who: 'YOU', text: 'The mountain is one stone lighter, grandfather. Walk on.', shot: 'player' }],
  ],
  n: [
    [{ who: "🎃 JACK O'LANTERN JOE", text: 'The skeletons are on their FEET! Which, for skeletons, is the entire standing ovation. They cannot do the clap part. Bones slip.', shot: 'wide' },
     { who: 'YOU', text: 'Tell them to sit back down. The night is young, and so is my arm.', shot: 'player' }],
    [{ who: "🎃 JACK O'LANTERN JOE", text: 'HEADLINER MATERIAL! The banshee wants to know if you do private events. Say no — her venue is a well.', shot: 'wide' },
     { who: 'YOU', text: 'One show a night. House rules.', shot: 'player' }],
  ],
  t: [
    [{ who: 'YOU', text: 'Treatment delivered. Trajectory: textbook. My satisfaction: clinical. Entirely, ENTIRELY clinical.', shot: 'player' },
     { who: 'YOU', text: 'The board said the method had no future. The method just cleared the fence.', shot: 'player' }],
    [{ who: 'YOU', text: 'Prognosis: excellent. The patient is airborne, and for the first time in fifty years, so is my reputation.', shot: 'player' },
     { who: 'YOU', text: 'Bill accordingly. NEXT PATIENT.', shot: 'player' }],
  ],
  v: [
    [{ who: 'VISIONARY VANCE', text: "THAT'S the demo! Clip it! Ship it! That slap is doing NUMBERS in my head already — and my head has never once been audited.", shot: 'wide' },
     { who: 'YOU', text: 'It worked because nothing about it was generated.', shot: 'player' }],
    [{ who: 'VISIONARY VANCE', text: 'Incredible unit economics. One palm. Zero burn. Instant delivery. Can we at least CALL it disruption?', shot: 'wide' },
     { who: 'YOU', text: 'You can call it a slap. It was always called a slap.', shot: 'player' }],
  ],
  o: [
    [{ who: '🏅 COMMISSIONER QUIBBLE', text: 'Noted for the minutes: athletic, artistic, measurable. The Committee now requires a brief moment behind the pie stand. A PROFESSIONAL moment.', shot: 'wide' },
     { who: 'YOU', text: "Take two, Commissioner. The county's earned it.", shot: 'player' }],
    [{ who: '🏅 COMMISSIONER QUIBBLE', text: 'The stopwatch concurs. The tape measure concurs. And my heart — strictly ex officio — also concurs.', shot: 'wide' },
     { who: 'YOU', text: 'Stamp it and cue the anthem.', shot: 'player' }],
  ],
};

// director's ordering: Charlie's documentary leads, then the Fair; Bruce's DLC
// storyline next, with the Master Slee scrolls beneath it.
// Olympic Bid leads (free), Wonders second, the Open Palm third (free) —
// then the Fair, then the supporter storylines.
const TOUR_ORDER = ['olympicbid', 'wonders', 'palm', 'fair', 'secondwind', 'nightofslaps', 'slaptherapy', 'slopvalley'];
// unknown keys sink to the bottom instead of floating to the top (indexOf −1)
const tourRank = (k) => { const i = TOUR_ORDER.indexOf(k); return i < 0 ? TOUR_ORDER.length : i; };
TOURS.sort((a, b) => tourRank(a.key) - tourRank(b.key));

// stamp each challenge with its tour's pinned slapper + tour key so the match
// launcher can force the avatar and prepend the right prologue (see main.js).
TOURS.forEach((tour) => tour.acts.forEach((act) => act.challenges.forEach((c) => {
  c.slapper = tour.slapper || null;
  c.tourKey = tour.key;
  c.world = tour.world || null;
})));

export const enabled = () =>
  CAMPAIGN_LIVE || new URLSearchParams(location.search).get('tour') === '1';

// ---- progress ----
let done = [];
try { done = JSON.parse(localStorage.getItem('slapp_tour') || '[]'); } catch { done = []; }
const save = () => localStorage.setItem('slapp_tour', JSON.stringify(done));
export const isDone = (id) => done.includes(id);
export const reset = () => { done = []; save(); };
export const progress = () => [...done];

const actUnlocked = (tour, i) =>
  i === 0 || tour.acts[i - 1].challenges.every((c) => isDone(c.id));

// ---- the active challenge ----
export let active = null;
export const setActive = (c) => { active = c; };
export const clearActive = () => { active = null; };
export const goalText = () =>
  active ? `🎪 ${active.title} — ${active.desc.toUpperCase()}` : null;

export function checkAttempt({ dist, pts, part, chainPct, oppKey }) {
  if (!active) return null;
  if (active.opp && active.opp !== oppKey) return null;
  const g = active.goal;
  const met =
    (g.type === 'dist' && dist >= g.v) ||
    (g.type === 'pts' && pts >= g.v) ||
    (g.type === 'head' && part === 'head' && pts > 0) ||
    (g.type === 'headdist' && part === 'head' && dist >= g.v) ||
    (g.type === 'chain' && part && chainPct >= g.v && pts > 0);
  if (!met) return null;
  // replays of an already-cleared challenge still earn the CLEAR verdict on the
  // match card — the checkmark just doesn't need re-inking
  if (!isDone(active.id)) { done.push(active.id); save(); }
  return active;
}

// ---- the tour menu card ----
const $ = (id) => document.getElementById(id);
export function open(onStart, opts = {}) {
  const ownsDlc = !!opts.ownsDlc;
  const wrap = $('tourActs');
  wrap.innerHTML = '';
  let total = 0;
  TOURS.forEach((tour) => {
    const locked = tour.dlc && !ownsDlc;
    const head = document.createElement('div');
    head.className = 'tourHead';
    const portrait = opts.portraits && opts.portraits[tour.key];
    head.innerHTML = `${portrait ? `<img class="tourStar" src="${portrait}" alt="">` : ''}<div class="tourHeadTxt"><b>${tour.title}${locked ? ' <span class="lockbadge" style="position:static;">🔒 PACK</span>' : ''}</b><br><span>${tour.blurb}</span></div>`;
    if (portrait) head.classList.add('hasStar');
    wrap.appendChild(head);
    if (locked) {
      // a DLC storyline: one sealed box, click anywhere → the supporter pitch
      const box = document.createElement('div');
      box.className = 'tourAct';
      box.style.cursor = 'pointer';
      box.innerHTML = `<h3>SUPPORTER STORYLINE 🔒</h3>
        <div class="tourStory">${tour.acts.length} acts ride with the Supporter Pack. Tap to unlock.</div>`;
      box.onclick = () => opts.onLocked && opts.onLocked(tour);
      wrap.appendChild(box);
      tour.acts.forEach((act) => { total += act.challenges.length; });
      return;
    }
    tour.acts.forEach((act, ai) => {
      total += act.challenges.length;
      const box = document.createElement('div');
      box.className = 'tourAct';
      const unlocked = actUnlocked(tour, ai);
      if (!unlocked) {
        box.innerHTML = `<h3>${act.act.split('—')[0].trim()} 🔒</h3>
          <div class="tourStory">This chapter is sealed. Clear the act before it to break the wax.</div>`;
        wrap.appendChild(box);
        return;
      }
      box.innerHTML = `<h3>${act.act}</h3><div class="tourStory">${act.story}</div>`;
      act.challenges.forEach((c) => {
        const row = document.createElement('div');
        row.className = 'tourCh' + (isDone(c.id) ? ' done' : '');
        row.innerHTML = `<span class="tick">${isDone(c.id) ? '✅' : '⬜'}</span><span><b>${c.title}</b>${isDone(c.id) ? ' <small>↻ replay</small>' : ''}<br>${c.desc}</span>`;
        row.onclick = () => onStart(c);
        box.appendChild(row);
      });
      wrap.appendChild(box);
    });
  });
  $('tourProgress').textContent = `${done.length} / ${total} CLEARED${done.length === total ? ' — LEGEND OF THE COUNTY! 🏆' : ''}`;
  $('tour').classList.remove('hidden');
}
export function close() { $('tour').classList.add('hidden'); }
