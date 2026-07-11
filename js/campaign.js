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
        ],
      },
      {
        act: 'REEL II — THE COLLECTION GROWS',
        story: 'The tape leaked. Forty million views. The Institute wants rarer specimens, the Influencer has invited herself into frame, and Director Vane has begun to weep and demand an Academy Award.',
        challenges: [
          { id: 'w2c1', title: 'MEGAFAUNA', desc: 'Score 480 off BIG BERTHA — when the large specimen moves, the ground reports it', opp: 'bertha', goal: { type: 'pts', v: 480 } },
          { id: 'w2c2', title: 'INVASIVE SPECIES', desc: 'Relocate THE INFLUENCER 55m — drawn to the lens, must be moved downrange', opp: 'influencer', goal: { type: 'dist', v: 55 } },
          { id: 'w2c3', title: '☗ BOSS: THE CLOCKWORK SPECIMEN', desc: 'Score 450 off TICK-TOCK TOM — first wind the coil past 85%, then move him', opp: 'clockwork', goal: { type: 'pts', v: 450 } },
        ],
      },
      {
        act: 'REEL III — THE OBSERVED OBSERVE BACK',
        story: 'The specimens have seen the film. They critique your form now. They perform for the lens. And one of them narrates back.',
        challenges: [
          { id: 'w3c1', title: 'PEER REVIEW', desc: 'A 90% chain before MAESTRO FORTISSIMO — the specimen grades the observer', opp: 'maestro', goal: { type: 'chain', v: 90 } },
          { id: 'w3c2', title: 'TERMINAL VELOCITY', desc: 'Send SLIM PETE 88m — the featherweight achieves escape velocity on camera', opp: 'slim', goal: { type: 'dist', v: 88 } },
          { id: 'w3c3', title: '☗ BOSS: THE DEADPAN', desc: 'Slap MASTER MANTIS 55m — only a true SNAP lands; a lazy arm is just narration', opp: 'mantis', goal: { type: 'dist', v: 55 } },
        ],
      },
    ],
  },
  {
    key: 'secondwind', title: '🐉 THE SECOND WIND',
    dlc: true,           // rides with the Supporter Pack (Bruce's own storyline)
    world: 'dojo',       // fought in the martial-arts dojo world once it ships (guarded)
    slapper: 'bruceslee', // pin Bruce (grants free campaign-use of the locked DLC); martial 'YOU' voice
    blurb: 'Bruce Slee climbs to the one slap the county calls a myth. Chuck North has never been slapped. Strike in the quiet — before the legend hardens.',
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
};

// director's ordering: Charlie's documentary leads, then the Fair; Bruce's DLC
// storyline next, with the Master Slee scrolls beneath it.
const TOUR_ORDER = ['wonders', 'fair', 'secondwind', 'palm'];
TOURS.sort((a, b) => TOUR_ORDER.indexOf(a.key) - TOUR_ORDER.indexOf(b.key));

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
  if (!active || isDone(active.id)) return null;
  if (active.opp && active.opp !== oppKey) return null;
  const g = active.goal;
  const met =
    (g.type === 'dist' && dist >= g.v) ||
    (g.type === 'pts' && pts >= g.v) ||
    (g.type === 'head' && part === 'head' && pts > 0) ||
    (g.type === 'chain' && part && chainPct >= g.v && pts > 0);
  if (!met) return null;
  done.push(active.id);
  save();
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
    head.innerHTML = `<b>${tour.title}${locked ? ' <span class="lockbadge" style="position:static;">🔒 PACK</span>' : ''}</b><br><span>${tour.blurb}</span>`;
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
