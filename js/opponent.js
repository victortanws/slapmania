import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createRagdoll } from './ragdoll.js';
import { toonMat } from './scene.js';

const START_X = 0.95;

// The county fair roster. mass drives knockback physics (heavy = barely budges)
// and doubles as the score multiplier so every weight class is worth slapping.
export const ROSTER = [
  {
    key: 'slim', name: 'SLIM PETE', tag: 'FEATHERWEIGHT',
    w: 0.6, h: 1.08, mass: 0.4,
    skin: 0xdcd6c4, shirt: 0xf2ede1, pants: 0x4a6fa5, hat: 'cap', hatCol: 0xd8404f,
    pickLine: 'Mostly bones. Flies like a lawn dart.',
    taunts: ['A stiff breeze beat you to it.', 'I weigh nothing and fear less.'],
  },
  {
    key: 'hank', name: 'HAYSEED HANK', tag: 'MIDDLEWEIGHT',
    w: 1.0, h: 1.0, mass: 1.0,
    skin: 0xd9a066, shirt: 0xa8402e, pants: 0x3f5a8f, hat: 'straw', bandCol: 0xa8402e,
    pickLine: "The people's cheek. Fair and square.",
    taunts: ['My scarecrow slaps harder.', 'After this, you muck the stables.'],
  },
  {
    key: 'ravinray', name: "RAVIN' RAY", tag: 'HEAVYWEIGHT',
    w: 1.35, h: 0.98, mass: 1.8,
    skin: 0xe8c088, shirt: 0x2fd4c4, stripes: 0xf2ede1, pants: 0x2a2a33,
    hat: 'band', hatCol: 0xff3df0, hair: 'flat', hairCol: 0x16161a, shades: true, noStache: true,
    pickLine: 'Raves all night. Immovable by day.',
    taunts: ['I have danced through worse, buddy.', 'This is nothing. Try a 6 a.m. warehouse set.'],
  },
  {
    key: 'mabel', name: 'MULE-KICK MABEL', tag: 'MIDDLEWEIGHT',
    w: 0.95, h: 1.0, mass: 0.95, female: true,
    skin: 0xe3b28c, shirt: 0x8a5fb0, pants: 0x4a6fa5, skirt: 0x4a6fa5,
    hat: 'sun', hatCol: 0xf2e6cc, bandCol: 0xd8404f, hair: 'pony', hairCol: 0x7a4a20,
    pickLine: 'Kicked by her own mule twice. Unbothered.',
    taunts: ['My mule kicks harder, sugar.', "I've been hit by hail worse than you."],
  },
  {
    key: 'hoss', name: 'BIG HOSS', tag: 'SUPER-HEAVY',
    w: 1.75, h: 1.1, mass: 2.6,
    skin: 0xcf9058, shirt: 0xf2ede1, pants: 0x5b4a33, hat: 'band', hatCol: 0xa8402e,
    pickLine: 'Good luck, sugar. Bring TWO tractors.',
    taunts: ['I have eaten things heavier than you.', 'Trees have tried. Trees have failed.'],
  },
  {
    key: 'bertha', name: 'BIG BERTHA', tag: 'HEAVYWEIGHT',
    w: 1.42, h: 0.96, mass: 1.9, female: true, busty: true,
    skin: 0xdda379, shirt: 0xd8687a, pants: 0xd8687a, skirt: 0xd8687a,
    hat: 'sun', hatCol: 0xf4c6d0, bandCol: 0xc95d73, hair: 'bun', hairCol: 0x8a8378,
    pickLine: 'The immovable aunt. The points are magnificent.',
    taunts: ['I have survived six county fairs.', 'My biscuits weigh more than your arm.'],
  },
  {
    key: 'cletus', name: 'GRANDPA CLETUS', tag: 'VETERAN',
    w: 0.9, h: 0.93, mass: 0.75,
    skin: 0xdcae85, shirt: 0x77808f, pants: 0x53617a, hat: 'cowboy', whiteBeard: true,
    hair: 'long', hairCol: 0xe8e2d5, suspenders: 0x4a3320,
    pickLine: 'Surprisingly aerodynamic for his age.',
    taunts: ['I slapped your grandfather too.', 'Been getting slapped since 1961. Still here.'],
  },
  {
    key: 'don', name: 'TREMENDOUS DON', tag: 'EXECUTIVE',
    w: 1.15, h: 1.03, mass: 1.3,
    skin: 0xe8934a, shirt: 0x1f2a44, pants: 0x1a2438, noStache: true,
    hair: 'swoop', hairCol: 0xf2c230, suit: true, tie: 0xc9302c,
    pickLine: 'The most slappable cheek in history. Tremendous.',
    taunts: ['You call that a hand? Sad!', 'I know slaps. I have the best slaps.', 'My cheek is a perfect 10. Ask anyone.'],
  },
  {
    key: 'influencer', name: 'THE INFLUENCER', tag: 'LIGHTWEIGHT',
    w: 0.82, h: 1.0, mass: 0.7, female: true, busty: true,
    skin: 0xf2cda2, shirt: 0xf2cda2, pants: 0x2f6fe0, skirt: 0x2f6fe0, bikini: true,
    cropTop: 0xff3d88, hairFlow: true,   // pink crop top, blue shorts, windswept hair
    hair: 'long', hairCol: 0xf0cf6a, shades: true, shadesCol: 0x141414, phone: true,
    hat: 'floppy', hatCol: 0xf7f2ea, bandCol: 0x2f6fe0,   // chic white floppy hat, blue band
    lookUp: true, lipstick: 0xe0244f,    // selfie-from-above tilt + bold lips
    pickLine: 'Wait — is this thing recording? Hi besties!',
    taunts: ["Don't forget to like and subscribe!", 'This is SO going on my story.'],
  },
  {
    key: 'susie', name: 'SCHOOLMARM SUSIE', tag: 'FACULTY',
    w: 0.85, h: 1.02, mass: 0.8, female: true,
    skin: 0xeec39c, shirt: 0x5e6a8a, pants: 0x4a4458, skirt: 0x4a4458,
    hair: 'bun', hairCol: 0x6e4a2c, glasses: true,
    pickLine: 'Grades your form in red ink. Docks marks for posture.',
    taunts: ['See me after class.', 'This goes on your PERMANENT RECORD.'],
  },
  {
    key: 'maestro', name: 'MAESTRO FORTISSIMO', tag: 'VIRTUOSO',
    w: 1.05, h: 1.05, mass: 1.15, noStache: true,
    skin: 0xdcb08c, shirt: 0x2a2a35, pants: 0x1f1f28,
    hair: 'frizz', hairCol: 0x4a4a52, cello: true,
    pickLine: 'Interrupted mid-sonata. Furious. Extremely resonant.',
    taunts: ['You call that TEMPO?', 'My cello has survived three world tours.'],
  },
  {
    key: 'chuckles', name: 'RODEO CLOWN CHUCKLES', tag: 'BOUNCER',
    w: 1.05, h: 0.98, mass: 1.1,
    // greasepaint face + white "gloves", circus bands, a red fro and a red nose
    skin: 0xf2ece6, shirt: 0x3a86ff, pants: 0xffd23f, stripes: 0xffd23f,
    hair: 'frizz', hairCol: 0xff4d4d, redNose: 0xe0242a, paintedGrin: 0xc0202a,
    pickLine: 'Honk honk. The clown does not fear the palm.',
    taunts: ['I bounce back, sugar — it is the whole act!', 'Honk if you missed!'],
  },
  // ---- WONDERS SPECIMENS (dlc: true): movement-gimmick volunteers — public
  // pick only with the Supporter Pack; campaigns summon them by key regardless ----
  {
    key: 'pogo', name: 'POGO McPHEE', tag: 'PERPETUAL MOTION', dlc: true,
    w: 0.78, h: 1.0, mass: 0.62, noStache: true,
    // lower, longer bounce than the original 0.9s/0.55m: the cheek now stays
    // inside the swing envelope near every touchdown instead of flashing past
    // it — face hits are genuinely ON the table, mistimed swings catch torso
    hop: { period: 1.05, height: 0.4 },
    // carnival-prize athletic wear: mustard tee, red stripes, sweatband, ginger frizz
    skin: 0xe2b088, shirt: 0xf0c030, stripes: 0xd8404f, pants: 0x2f6fe0,
    hat: 'band', hatCol: 0xd8404f, hair: 'frizz', hairCol: 0xc06a2a, springShoes: 0xd8404f,
    pickLine: 'The specimen oscillates vertically. Science does not know why. Neither does the specimen.',
    taunts: ['You gotta TIME it, flatfoot!', "Gravity keeps askin'. I keep declinin'."],
  },
  {
    key: 'nadine', name: 'NAMASTE NADINE', tag: 'SUN SALUTATION', dlc: true,
    w: 0.8, h: 1.02, mass: 0.7, female: true, noStache: true,
    sway: { period: 3.2, amp: 0.5 }, // slow fore/aft lean — the cheek drifts in and out of reach
    // sage-teal tank, charcoal leggings, tidy bun, cream headband, serene beyond reason
    skin: 0xdda379, shirt: 0x7ac0b8, pants: 0x4a4458,
    hair: 'bun', hairCol: 0x6e4a2c, hat: 'band', hatCol: 0xf2e6cc, yogaMat: 0x8a5fb0,
    pickLine: 'She is not evading. She is exercising. The cheek arrives on the inhale.',
    taunts: ['Breathe in... breathe WAY out of range.', 'My chakras are aligned, sweetheart. Your swing is not.'],
  },
  {
    key: 'horton', name: 'HEAD-TURNING HORTON', tag: 'ALL ANGLES', dlc: true,
    w: 0.95, h: 1.05, mass: 1.0,
    headTurn: { period: 2.4, arc: 1.2 }, // the CHEEK sweeps away/toward — a flush hit wants the face incoming
    // full evening dress: tailcoat over white shirtfront, white bow tie, black topper w/ gold band
    skin: 0xe0b48e, shirt: 0xf4f0ea, pants: 0x17171d, suit: true, tie: 0xf4f0ea,
    tails: true, bowtie: true,
    hat: 'top', hatCol: 0x17171d, bandCol: 0xd8b13c, hair: 'flat', hairCol: 0x2a2a2a,
    pickLine: 'Formal wear. Rotating skull. The cheek sweeps past like a lighthouse.',
    taunts: ["You've been slapping my HAT, sir.", "Left profile, right profile — pick one. I certainly shan't."],
  },
  // ---- WORLD LOCALS (world: key): volunteers who only appear in the pick
  // when their home world is active — each biome keeps its own regulars ----
  {
    key: 'percival', name: 'PITH-HELMET PERCIVAL', tag: 'LOST EXPLORER', world: 'jungle',
    w: 0.85, h: 1.04, mass: 0.75,
    skin: 0xe8b58c, shirt: 0xc9b98a, pants: 0xb5a578,
    hat: 'floppy', hatCol: 0xdcd4b8, bandCol: 0x6e5a3a, hair: 'flat', hairCol: 0x8a6a4a,
    pickLine: "Been lost since '09. Fairly sure this fair is a mirage.",
    taunts: ['I have survived quicksand, sir. You are merely damp.', 'By my map, that slap missed by three leagues.'],
  },
  {
    key: 'flambeau', name: 'FLAMBEAU THE FIRE-EATER', tag: 'SIDESHOW', world: 'lava',
    w: 0.8, h: 1.05, mass: 0.7, noStache: true,
    skin: 0xd89468, shirt: 0x8a1f2e, stripes: 0xf0c030, pants: 0x1f1f28,
    hair: 'flat', hairCol: 0x14100c,
    pickLine: 'Eats fire professionally. Considers your palm an appetizer.',
    taunts: ['I gargle magma, darling.', 'Ooh, toasty! Again.'],
  },
  {
    key: 'wally', name: 'WOODEN WALLY', tag: 'TRAINING DUMMY', world: 'dojo',
    w: 0.95, h: 1.0, mass: 1.2, noStache: true,
    skin: 0xc9a468, shirt: 0xc9a468, pants: 0x9a7a48,
    paintedGrin: 0x7a4a20, hair: 'flat', hairCol: 0x8a6a3a,
    pickLine: 'A mook jong that achieved consciousness and regrets it.',
    taunts: ['I was carved for this.', 'Termites hit harder.'],
  },
  {
    key: 'inkblot', name: 'INKBLOT IAN', tag: 'TEST SUBJECT', world: 'therapy',
    w: 0.95, h: 1.0, mass: 0.9, noStache: true,
    skin: 0xe8c8a2, shirt: 0xf4f0ea, pants: 0x2a2a33, inkblot: 0x1a1a22,
    hair: 'flat', hairCol: 0x2a2a2a,
    pickLine: 'Everyone sees something different in him. He sees a slap coming.',
    taunts: ['You see a butterfly? I see your whiff.', 'That one looked like your childhood.'],
  },
  {
    key: 'hal', name: 'HALO HAL', tag: 'TRAINEE ANGEL', world: 'heaven',
    w: 0.85, h: 1.0, mass: 0.5, noStache: true, robe: true,
    skin: 0xf0d0b0, shirt: 0xf6f2e8, pants: 0xf6f2e8,
    halo: true, wings: true, hair: 'flat', hairCol: 0xf0e0a0,
    pickLine: "Hasn't earned the big wings. You're his flight test.",
    taunts: ['Cloud nine has a weight limit, friend.', 'I get my wings if you clear 60. No pressure.'],
  },
  {
    key: 'larry', name: 'LOW-LEVEL LARRY', tag: 'DEMON, 3RD CLASS', world: 'hell',
    w: 0.9, h: 0.97, mass: 0.8, noStache: true, suit: true,
    skin: 0xc0392b, shirt: 0x8a8f98, pants: 0x3a3a44, tie: 0x2a2a33,
    horns: true, hair: 'flat', hairCol: 0x1a1a1a,
    pickLine: '400 years in the complaints department. This is his lunch break.',
    taunts: ['Your form has been escalated to my supervisor.', 'File a grievance. The window closes never.'],
  },
  {
    key: 'joe', name: "JACK O'LANTERN JOE", tag: 'NIGHT GREETER', world: 'haunted',
    w: 1.0, h: 1.0, mass: 0.95, noStache: true,
    // vine-green hands, patched night-shift flannel; the head IS the costume
    skin: 0x9aa858, shirt: 0x5a3a28, pants: 0x3a3a2c, pumpkinHead: true,
    pickLine: 'Grows back from seeds. Has the best face at the fair, and it is carved.',
    taunts: ['Smashing me is a Halloween TRADITION.', 'I have a hundred cousins in that patch. All watching.'],
  },
  {
    key: 'tony', name: 'BONY TONY', tag: 'FLYWEIGHT (LITERALLY)', world: 'haunted',
    w: 0.62, h: 1.04, mass: 0.35, noStache: true,
    // bone-white on grave-black — lighter than Slim Pete, and it is ALL he talks about
    skin: 0xe8e4da, shirt: 0x1a1a20, pants: 0x1a1a20, skullFace: true, ribs: 0xe8e4da,
    pickLine: 'Lighter than Slim Pete. It is ALL he talks about.',
    taunts: ['No lungs, no fear.', 'I keep my landing teeth in a cup.'],
  },
  {
    key: 'vance', name: 'VISIONARY VANCE', tag: 'FOUNDER MODE', world: 'techcampus',
    w: 0.9, h: 1.02, mass: 0.85, noStache: true,
    // grey hoodie, jeans; the lanyard never comes off
    skin: 0xe4c09a, shirt: 0x3a3f4a, pants: 0x4a6fa5,
    hair: 'flat', hairCol: 0x3a2e22, hoodie: 0x3a3f4a, lanyard: 0x2f6fe0,
    pickLine: 'Says "scale" the way other men breathe. AGI next quarter. The quarter is load-bearing.',
    taunts: ['This slap does not scale.', 'We A/B tested your palm. B won.', 'I pivot faster than you swing.'],
  },
  {
    key: 'mira', name: 'MIRACLE MIRA', tag: 'DISRUPTOR', world: 'techcampus',
    w: 0.85, h: 1.02, mass: 0.8, female: true, busty: true,
    // the white suit, the blonde ponytail, the red lipstick, the baritone certainty
    skin: 0xeecfa8, shirt: 0xf4f0ea, pants: 0xf4f0ea, suit: true, tie: 0xf4f0ea, skirt: 0xf4f0ea,
    hair: 'pony', hairCol: 0xf0cf6a, lipstick: 0xc0202a,
    pickLine: 'One drop of slop can do anything. Sworn testimony pending.',
    taunts: ['The product works. In an environment of belief.', 'My voice is two octaves of credibility.'],
  },
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
  // ---- BOSSES (boss: true): campaign-only — never listed in the public
  // volunteer pick; tour challenges summon them by key ----
  {
    key: 'boulder', name: 'BOULDER BOB', tag: 'BOSS · SUPER-MASSIVE', boss: true,
    w: 2.15, h: 1.28, mass: 4.0,
    // old-time strongman hewn from granite: stony skin, charcoal singlet,
    // handlebar stache, heavy unibrow, champion's belt
    skin: 0xa8a49c, shirt: 0x2f3140, pants: 0x3d4152,
    brow: true, beltCol: 0x7a1f24,
    pickLine: 'Geologically unmoved. The points pay ×4.',
    taunts: ['Mountains ask ME for advice.', 'I have never taken a single step.'],
  },
  {
    key: 'dale', name: 'DODGY DALE', tag: 'BOSS · CALLS HIS CHEEK', boss: true,
    w: 0.85, h: 1.02, mass: 0.9, noStache: true, weave: true, calledShot: { margin: 0.02, cqMin: 95 },
    skin: 0xdcae85, shirt: 0x2b2b33, pants: 0xd83a3a,
    hat: 'band', hatCol: 0xd83a3a, hair: 'frizz', hairCol: 0xb9b3ac,
    pickLine: 'Never been slapped. He will even tell you WHERE. Sugar.',
    taunts: ['HIGH cheek. Told you. Still missed.', 'I call it, you miss it. The system works.', 'Four hundred palms. One jar of tears.'],
  },
  // -- SAVE THE FAIR bosses: each one examines a different skill --
  {
    key: 'judge', name: 'THE ASSESSOR', tag: 'BOSS · 5-SECOND APPRAISAL', boss: true,
    w: 1.05, h: 1.04, mass: 1.1, noStache: true, shotClock: 5, brow: true,
    // powdered wig over a black suit — the county appraiser himself
    skin: 0xdfb992, shirt: 0x17171d, pants: 0x17171d, suit: true, tie: 0x51525e,
    hair: 'frizz', hairCol: 0xf2ede1,
    pickLine: 'My meter allots you FIVE seconds per swing.',
    taunts: ['Time is money, and both are running.', 'The paperwork will not wait, champ.'],
  },
  {
    key: 'grease', name: 'GREASED PETE', tag: 'BOSS · UNGRIPPABLE', boss: true,
    w: 0.9, h: 1.0, mass: 0.85, noStache: true, grease: true,
    // glistening and proud of it: oiled yellow-tan torso + sheen streaks (below),
    // work shorts, plastered hair — so "greased" reads at a glance, not just in the mechanic
    skin: 0xf2c88a, shirt: 0xf2c88a, pants: 0x3c4048,
    hair: 'flat', hairCol: 0x14100c,
    pickLine: 'Pig-grease champion, nine years running. Slaps slide RIGHT off.',
    taunts: ['Slippery is a lifestyle.', 'That one slid clean into the trough.'],
  },
  {
    key: 'ironjaw', name: 'IRON-JAW McGRAW', tag: 'BOSS · NO-SELLER', boss: true,
    w: 1.3, h: 1.08, mass: 1.6, noStache: true, chainGate: 70, ironJaw: true, brow: true,
    skin: 0xc99a6e, shirt: 0x5a2a2a, pants: 0x33383f,
    hair: 'flat', hairCol: 0x22180f,
    pickLine: 'Weak slaps bounce off the jaw. He will not even blink.',
    taunts: ['Was that the wind?', 'My chin has retired better hands than yours.'],
  },
  {
    key: 'pennywhistle', name: 'JUDGE PENNYWHISTLE', tag: 'BOSS · CONTEMPT OF COURT', boss: true,
    w: 1.0, h: 0.98, mass: 1.15, shotClock: 6, chainGate: 50, whistleProp: true,
    // the county's beloved judge-referee-notary-hot-dog-inspector — bought.
    // Black robe, gold tie, the famous silver whistle still on its cord.
    skin: 0xe2b688, shirt: 0x1b1b22, pants: 0x1b1b22, suit: true, tie: 0xd8b13c,
    whiteBeard: true, hair: 'bun', hairCol: 0xd8d2c6,
    pickLine: 'His Honor will officiate his OWN trial. Six seconds a swing.',
    taunts: ['I rule that slap... inadmissible!', 'Bribes? I prefer “expedited filing fees.”', 'Objection sustained. Cheek presented.'],
  },
  {
    key: 'granny', name: 'GRANNY THUNDER', tag: 'BOSS · RETIRED CHAMPION', boss: true,
    w: 0.95, h: 0.96, mass: 1.4, female: true, weave: true, chainGate: 60,
    // the 1987 county champion: storm-grey dress, white bun, still slips like a pro
    skin: 0xe3c09a, shirt: 0x565a6e, pants: 0x565a6e, skirt: 0x4a4e62,
    hair: 'bun', hairCol: 0xf0ece3,
    pickLine: 'Held the belt for nine years. Her knees left — the slip stayed.',
    taunts: ['I dodged your grandfather too, sugar.', 'Thunder only answers REAL form.'],
  },
  {
    key: 'mantis', name: 'MASTER MANTIS', tag: 'BOSS · THE WHIP FORM', boss: true,
    w: 0.85, h: 1.06, mass: 1.1, snapExam: true, robe: true,
    // a lean kung-fu sage in a mantis-green robe (shirt = pants = robe), topknot + white sage beard
    skin: 0xd9a066, shirt: 0x2e7d4f, pants: 0x2e7d4f,
    hair: 'bun', hairCol: 0x1a1a1f, whiteBeard: true, arena: 'dojo', // arena: consumed once the ARENA system ships (see OVERNIGHT-RUN.md); inert until then
    pickLine: 'The Whip Form. A slap without snap is a caress.',
    taunts: ['Your arm is asleep. Wake it.', 'Faster. The mantis does not lecture twice.'],
  },
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
  {
    // key is 'chuckboss' (NOT 'chucknorth') — the DLC slapper already owns that key;
    // this is the same legend in boss form, so the display NAME stays CHUCK NORTH
    key: 'chuckboss', name: 'CHUCK NORTH', tag: 'BOSS · THE CRIMSON TECHNIQUE', boss: true,
    w: 1.25, h: 1.10, mass: 1.5, noStache: true,
    // FINAL FORM: same auburn hair and beard as the man himself — but the skin
    // burns RED, allegedly the result of a brand-new technique (he microwaved
    // his chi; the county has questions; the beard has no comment)
    skin: 0xd05a40, shirt: 0x3a5a3f, pants: 0x2f3b2f,
    hair: 'short', hairCol: 0x8a4b2a, beard: 0x8a4b2a, brawn: true, redAura: true,
    secondWind: { delay: 4.0, gate: 85, weak: 0.35, punch: 1.15 },
    pickLine: 'The new technique turned him red. He says that means it is working.',
    taunts: ['I once counted to infinity. Twice.', "Four seconds of quiet, son. You won't take 'em.", 'The redness is INTENTIONAL. It is called the Crimson Technique. I invented it this morning.'],
  },
  {
    key: 'reaper', name: 'THE GREEN REAPER', tag: 'BOSS · MOWING TIME', boss: true,
    w: 1.15, h: 1.12, mass: 1.35, noStache: true, robe: true,
    shotClock: 7, chainGate: 65,
    // moss-green work robe, hood up; the scythe is FOR THE LAWN
    skin: 0x141a14, shirt: 0x2e6b3a, pants: 0x24522e,
    reaperHood: 0x24522e, scythe: true,
    pickLine: 'Night-shift groundskeeper, 400 years. The scythe is for the LAWN.',
    taunts: ['You are ON the lawn.', 'Grass grows at night. So does my patience. One of those is a lie.'],
  },
  {
    key: 'freuden', name: 'DR. FREUDENSCHADE', tag: 'BOSS · THE TALKING CURE', boss: true,
    w: 0.95, h: 1.0, mass: 1.2, chainGate: 75,
    // charcoal three-piece, oxblood tie, white beard, round glasses — the rival school in person
    skin: 0xe0bb92, shirt: 0x2a2a35, pants: 0x2a2a35, suit: true, tie: 0x6e2231,
    whiteBeard: true, glasses: true, hair: 'flat', hairCol: 0xdcd6ca,
    pickLine: 'Any slap below 75% form, he interprets away as displaced aggression.',
    taunts: ['Tell me about the whiff. When did the whiffing begin?', 'Interesting. VERY interesting. Unbillable, but interesting.'],
  },
  {
    key: 'slopunit', name: 'S.L.O.P. UNIT-1', tag: 'BOSS · ARTIFICIAL GENERAL APOLOGIES', boss: true,
    w: 1.9, h: 1.25, mass: 3.2, noStache: true,
    shotClock: 6, chainGate: 70,
    // gunmetal chassis, panel-grey plating — the manifestation of AGI (allegedly)
    skin: 0x9aa2ad, shirt: 0x6e7683, pants: 0x4a515c, robot: true,
    pickLine: 'The manifestation of AGI. Mostly generates apologies.',
    taunts: ['I AM SORRY YOU FEEL THAT WAY.', 'YOUR SLAP HAS BEEN LOGGED AS FEEDBACK.', 'AS A LARGE SLAP MODEL, I CANNOT BE MOVED.'],
  },
  {
    key: 'ava', name: 'AVALANCHE EILEEN', tag: 'BOSS · THE PHENOM', boss: true,
    w: 0.8, h: 1.0, mass: 0.85, female: true, weave: true, noStache: true, busty: true,
    // RED race jumpsuit w/ white speed stripes; GOLD ponytail + fringe under a
    // white ski beanie (pale blonde on pale skin read as bald, hence the deeper gold)
    skin: 0xeecfa8, shirt: 0xd8232e, pants: 0xd8232e, noSkirt: true, // solid red — hoop stripes read as Waldo
    hair: 'pony', hairCol: 0xd9a441, fringe: true, hat: 'beanie', hatCol: 0xf2ede1, bandCol: 0xd8232e,
    goggles: 0xff8c1a,
    pickLine: 'Four golds. Three records. Two federations. Zero slaps taken.',
    taunts: ['I dodge trees at eighty. You are slower than a tree.', 'Is the county in slow motion, or is that just you?'],
  },
  {
    key: 'avaskis', name: 'AVALANCHE EILEEN', tag: 'BOSS · DEMO SPEED', boss: true,
    w: 0.8, h: 1.0, mass: 0.9, female: true, noStache: true, busty: true,
    // same red jumpsuit + beanie, goggles DOWN, skis on (skirt suppressed so they show)
    skin: 0xeecfa8, shirt: 0xd8232e, pants: 0xd8232e, noSkirt: true, // solid red — hoop stripes read as Waldo
    hair: 'pony', hairCol: 0xd9a441, fringe: true, hat: 'beanie', hatCol: 0xf2ede1, bandCol: 0xd8232e,
    goggles: 0xff8c1a, gogglesDown: true,
    skis: true, skiRun: { speed: 1.7, startX: 9, exitX: -8 },
    pickLine: 'Demo speed, brake through the pocket. She is teaching, not fleeing.',
    taunts: ['Grass is just slow snow.', 'I sandbag for children and new sports. You qualify twice.'],
  },
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
];

// every volunteer speaks with their own voice, and has enough lines that
// repeat rounds keep surprising you (shown via the faceoff bubble)
const MORE_TAUNTS = {
  slim: ['I ate a big lunch. A grape.', 'The wind and I have an understanding.', "Aim careful — I'm mostly hat."],
  hank: ['The people demand a show.', "I've been slapped by better. Once.", 'My ma is watching. Make it count.'],
  ravinray: ['The bass drops harder than you.', 'I warmed up for six hours. At a rave.', 'The shades stay ON.'],
  mabel: ['The mule sends his regards.', "I've birthed calves scarier than you.", 'Front porch is THAT way, sweetheart.'],
  hoss: ['I once sat on a tractor. It apologized.', 'Bring the second tractor, sugar.', 'Gravity works FOR me.'],
  bertha: ['Six county fairs. SIX.', 'My biscuits have flattened lesser folk.', 'This dress has seen things.'],
  cletus: ['1961. Now THAT was a slap.', 'My hip pops louder than your palm.', 'Aim for the dentures — save us both time.'],
  don: ['I invented slapping. People are saying it.', 'My cheek pays NO taxes.', 'This is the worst-run fair. Sad!'],
  influencer: ['Wait — let me get my angle.', 'This is content GOLD, besties.', 'Ring light? No. Ring FIGHT.'],
  susie: ['Posture. POSTURE.', 'I have detention slips with your name on them.', 'Show your work, dear.'],
  maestro: ['This will be in D minor. The saddest key.', 'ALLEGRO, you savage!', 'The cello forgives. I do NOT.'],
};
ROSTER.forEach((r) => { if (MORE_TAUNTS[r.key]) r.taunts.push(...MORE_TAUNTS[r.key]); });

// the public volunteer pick — bosses excluded (campaign-only)
export const PICKABLE = ROSTER.filter((r) => !r.boss);

// per-world CURATED rosters (design lesson #2: volunteers wear the place —
// no global pool, and every exclusion has a story reason a player could guess).
// allow = only these keys appear; exclude = the full cast minus these.
// Worlds absent here (day) keep the whole farm cast. World locals must be
// listed in their own world's allow list.
export const WORLD_ROSTERS = {
  ice:     { exclude: ['influencer', 'nadine', 'horton', 'don'] },        // crop tops, sun salutations, tailcoats and valets stay home
  desert:  { exclude: ['maestro', 'bertha'] },                            // cello varnish and the sun dress refuse the heat
  jungle:  { exclude: ['don', 'susie', 'horton', 'influencer'] },         // suits, chalkboards and no-signal don't trek
  haunted: { allow: ['joe', 'tony', 'cletus', 'ravinray', 'maestro'] },   // the locked-in and the dead
  dojo:    { allow: ['wally', 'hank', 'slim', 'susie', 'nadine'] },       // discipline tourism
  lava:    { allow: ['flambeau', 'chuckles', 'ravinray', 'hoss'] },       // sideshow kin + thermal mass
  therapy: { allow: ['inkblot', 'don', 'influencer', 'bertha', 'slim', 'hank', 'maestro'] }, // the client list
  heaven:  { allow: ['hal', 'cletus', 'mabel', 'susie'] },                // the gentle
  hell:    { allow: ['larry', 'don', 'ravinray', 'maestro'] },            // reserved parking
  techcampus: { allow: ['vance', 'mira', 'slopberg', 'influencer', 'don', 'susie', 'slim'] }, // whoever badges in
};

function segSphere(p0, p1, c, r) {
  const d = new THREE.Vector3().subVectors(p1, p0);
  const m = new THREE.Vector3().subVectors(p0, c);
  const len2 = d.lengthSq();
  const t = len2 > 0 ? THREE.MathUtils.clamp(-m.dot(d) / len2, 0, 1) : 0;
  const q = p0.clone().addScaledVector(d, t);
  return q.distanceTo(c) <= r ? q : null;
}

// A braced opponent: kinematic ragdoll posed cheek-out, hands behind his back,
// per league regulations. One clean palm strike dynamizes him into flight.
export class Opponent {
  constructor({ scene, world, mat, arch = ROSTER[1], showcase = false }) {
    this.scene = scene;
    this.world = world;
    this.arch = arch;
    this.startX = START_X;
    this.launched = false;
    this.wallSplat = false;
    this.time = 0;
    this.showcaseMode = showcase;

    const { w, h } = arch;
    this.rHead = 0.17 * (w + h) / 2;
    // hitbox, not visual: an oversized belly must not swallow the path to the
    // cheek, or big characters become body-blow-only
    this.rTorso = 0.26 * Math.min(w, 1.0);
    // heavy folk barely budge; featherweights become ragdoll rockets
    this.knockback = Math.pow(arch.mass, 0.75);

    const rag = this.rag = createRagdoll({
      world, scene, mat, x: START_X, z: 0,
      skin: arch.skin, shirt: arch.shirt, pants: arch.pants,
      wScale: w, hScale: h, massScale: arch.mass, longSleeves: !!(arch.suit || arch.robe),
    });

    // --- braced pose (facing -X, leaning in, offering the cheek) ---
    const P = rag.parts;
    const set = (name, x, y, z, ex = 0, ey = 0, ez = 0) => {
      P[name].body.position.set(START_X + (x - START_X) * w, y * h, z * w);
      P[name].body.quaternion.setFromEuler(ex, ey, ez);
    };
    set('torso', START_X - 0.05, 1.33, 0, 0, 0, 0.22);
    set('head', START_X - 0.16, 1.56, 0, 0.18, 0, arch.lookUp ? -0.5 : 0.35);   // lookUp tilts the face skyward
    if (arch.phone) {
      // one CONNECTED raised arm: shoulder → elbow → hand → stick. Positive z
      // euler tilts the segment toward her face (-x); the old negative values
      // scattered the two segments and read as a third arm.
      set('uaL', START_X - 0.05, 1.52, 0.22, 0, 0, 0.5);
      set('faL', START_X - 0.17, 1.74, 0.18, 0, 0, 0.45);
    } else {
      set('uaL', START_X + 0.08, 1.38, 0.24, 0, 0, 0.45);
      set('faL', START_X + 0.20, 1.06, 0.10, 0.9, 0, 0.3);
    }
    set('uaR', START_X + 0.08, 1.38, -0.24, 0, 0, 0.45);
    set('faR', START_X + 0.20, 1.06, -0.10, -0.9, 0, 0.3);
    rag.sync();

    // --- face (children of the head mesh, so they fly with him) ---
    const head = P.head.mesh;
    const hr = this.rHead / 0.17;
    if (!arch.pumpkinHead && !arch.skullFace && !arch.robot) {
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), toonMat(0x111111));
        eye.position.set(-0.145 * hr, 0.035 * hr, s * 0.055 * hr);
        head.add(eye);
      }
    }
    if (arch.pumpkinHead) {
      // the head IS the pumpkin: ridged orange gourd + carved glowing face
      const gourd = new THREE.Mesh(new THREE.SphereGeometry(0.22 * hr, 10, 9), toonMat(0xe07820));
      gourd.scale.y = 0.85;
      gourd.castShadow = true;
      head.add(gourd);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, 0.1, 5), toonMat(0x5c7a3a));
      stem.position.y = 0.2 * hr;
      head.add(stem);
      const glow = new THREE.MeshBasicMaterial({ color: 0xffb347 });
      for (const sgn of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.06, 3), glow);
        eye.rotation.z = Math.PI / 2;
        eye.position.set(-0.21 * hr, 0.05 * hr, sgn * 0.08 * hr);
        head.add(eye);
      }
      const grin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.17), glow);
      grin.position.set(-0.215 * hr, -0.07 * hr, 0);
      head.add(grin);
    }
    if (arch.skullFace) {
      // hollow sockets, nasal notch, the fixed grin — the skin is already bone
      const dark = toonMat(0x0c0c0c);
      for (const sgn of [-1, 1]) {
        const socket = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), dark);
        socket.position.set(-0.14 * hr, 0.04 * hr, sgn * 0.055 * hr);
        socket.scale.setScalar(hr);
        head.add(socket);
      }
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 3), dark);
      nose.rotation.z = Math.PI / 2;
      nose.position.set(-0.16 * hr, -0.02 * hr, 0);
      head.add(nose);
      for (const tz of [-0.04, 0, 0.04]) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.035, 0.018), dark);
        tooth.position.set(-0.155 * hr, -0.085 * hr, tz * hr);
        head.add(tooth);
      }
    }
    if (arch.reaperHood) {
      // the groundskeeper's cowl: open-front shell, face in shadow, pinprick eyes
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.21 * hr, 9, 8), toonMat(arch.reaperHood));
      hood.position.x = 0.035 * hr;
      hood.castShadow = true;
      head.add(hood);
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 6), toonMat(arch.reaperHood));
      peak.rotation.z = 0.5;
      peak.position.set(0.1 * hr, 0.18 * hr, 0);
      head.add(peak);
      const glow = new THREE.MeshBasicMaterial({ color: 0x8aff8a });
      for (const sgn of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 5), glow);
        eye.position.set(-0.15 * hr, 0.03 * hr, sgn * 0.055 * hr);
        head.add(eye);
      }
    }
    if (arch.robot) {
      // gunmetal head shell + one glowing eye bar + antenna: AGI, allegedly
      const shell = new THREE.Mesh(new THREE.BoxGeometry(0.36 * hr, 0.32 * hr, 0.36 * hr), toonMat(0x9aa2ad));
      shell.castShadow = true;
      head.add(shell);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.26 * hr), new THREE.MeshBasicMaterial({ color: 0xff3030 }));
      visor.position.set(-0.185 * hr, 0.03 * hr, 0);
      head.add(visor);
      const aerial = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 5), toonMat(0x4a515c));
      aerial.position.y = 0.25 * hr;
      head.add(aerial);
      const bobble = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3030 }));
      bobble.position.y = 0.36 * hr;
      head.add(bobble);
    }
    if (arch.vrHeadset) {
      // a chunky pale visor over the eyes — he is in two rooms at once
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.3), toonMat(arch.vrHeadset));
      visor.position.set(-0.13 * hr, 0.02 * hr, 0);
      visor.scale.setScalar(hr);
      visor.castShadow = true;
      head.add(visor);
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.36), toonMat(0x2a2a33));
      strap.position.set(0.02 * hr, 0.02 * hr, 0);
      strap.scale.setScalar(hr);
      head.add(strap);
    }
    if (arch.goggles) {
      // mirrored racing goggles: DOWN over the eyes for the run, UP on the brow otherwise
      const gy = arch.gogglesDown ? 0.035 : 0.14;
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.07, 0.26), new THREE.MeshBasicMaterial({ color: arch.goggles }));
      band.position.set(-0.155 * hr, gy * hr, 0);
      band.scale.setScalar(hr);
      head.add(band);
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 6, 14), toonMat(0x1a1a1f));
      strap.rotation.x = Math.PI / 2;
      strap.position.y = gy * hr;
      strap.scale.setScalar(hr);
      head.add(strap);
    }
    if (arch.horns) {
      // two little devil horns — regulation issue, demon 3rd class and up
      for (const s of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 5), toonMat(0x1a1a1a));
        horn.position.set(-0.02 * hr, 0.15 * hr, s * 0.1 * hr);
        horn.scale.setScalar(hr);
        head.add(horn);
      }
    }
    if (arch.halo) {
      // a gold halo, hovering with trainee-grade wobble tolerance
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 16), toonMat(0xd8b13c));
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.26 * hr;
      halo.scale.setScalar(hr);
      head.add(halo);
    }
    if (arch.redNose) {
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.032 * hr, 8, 8), toonMat(arch.redNose));
      nose.position.set(-0.172 * hr, -0.005 * hr, 0);
      nose.castShadow = true;
      head.add(nose);
    }
    if (arch.paintedGrin) {
      // a flat painted grin (clowns, automatons) — mechanical/greasepaint, not a real smile
      const grin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.032, 0.1), toonMat(arch.paintedGrin));
      grin.position.set(-0.158 * hr, -0.062 * hr, 0);
      head.add(grin);
    }
    if (!arch.female && !arch.noStache) {
      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.13),
        toonMat(arch.whiteBeard ? 0xe8e2d5 : 0x2b1c10));
      stache.position.set(-0.16 * hr, -0.045 * hr, 0);
      stache.scale.setScalar(hr);
      head.add(stache);
      if (arch.brow) {
        // strongman handlebar: the stache gets curled tips
        for (const sgn of [-1, 1]) {
          const curl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.045, 0.03), toonMat(0x2b1c10));
          curl.position.set(-0.155 * hr, -0.03 * hr, sgn * 0.08 * hr);
          curl.scale.setScalar(hr);
          head.add(curl);
        }
      }
    }
    if (arch.brow) {
      // one heavy, disapproving unibrow
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.024, 0.17), toonMat(0x241a12));
      brow.position.set(-0.138 * hr, 0.105 * hr, 0); // thinner + higher so it reads as a brow, not a visor over the eyes
      brow.scale.setScalar(hr);
      head.add(brow);
    }
    if (arch.glasses) {
      // proper schoolteacher spectacles: two rims and a bridge
      for (const sgn of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.052, 0.058), toonMat(0x15151a));
        lens.position.set(-0.152 * hr, 0.03 * hr, sgn * 0.056 * hr);
        lens.scale.setScalar(hr);
        head.add(lens);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.012, 0.05), toonMat(0x15151a));
      bridge.position.set(-0.152 * hr, 0.038 * hr, 0);
      bridge.scale.setScalar(hr);
      head.add(bridge);
    }
    if (arch.whistleProp) {
      // the famous silver whistle, on its cord at the lips
      const wh = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.028, 0.03), toonMat(0xc9ced6));
      wh.position.set(-0.185 * hr, -0.06 * hr, 0.035 * hr);
      wh.scale.setScalar(hr);
      head.add(wh);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.16, 5), toonMat(0x8a2f2f));
      cord.position.set(-0.13 * hr, -0.11 * hr, 0.07 * hr);
      cord.rotation.z = 0.5;
      cord.rotation.x = 0.4;
      head.add(cord);
    }
    if (arch.ironJaw) {
      // a riveted steel chin — the no-sell hardware itself
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.075, 0.17), toonMat(0x9aa2ad));
      jaw.position.set(-0.115 * hr, -0.105 * hr, 0);
      jaw.scale.setScalar(hr);
      head.add(jaw);
      for (const sgn of [-1, 1]) {
        const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), toonMat(0x5e646d));
        rivet.position.set(-0.155 * hr, -0.1 * hr, sgn * 0.06 * hr);
        head.add(rivet);
      }
    }
    if (arch.shades && arch.shadesCol) {
      // proper two-lens sunglasses: rims, dark lenses, a bridge and temple arms
      const fCol = arch.shadesCol;
      for (const sgn of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.062, 0.1), toonMat(fCol));
        rim.position.set(-0.126 * hr, 0.035 * hr, sgn * 0.06 * hr);
        rim.scale.setScalar(hr);
        head.add(rim);
        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.048, 0.082), toonMat(0x0b0b14));
        lens.position.set(-0.137 * hr, 0.035 * hr, sgn * 0.06 * hr);
        lens.scale.setScalar(hr);
        head.add(lens);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.014, 0.045), toonMat(fCol));
      bridge.position.set(-0.13 * hr, 0.045 * hr, 0);
      bridge.scale.setScalar(hr);
      head.add(bridge);
      for (const sgn of [-1, 1]) {
        const temple = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.012), toonMat(fCol));
        temple.position.set(-0.08 * hr, 0.04 * hr, sgn * 0.115 * hr);
        temple.scale.setScalar(hr);
        head.add(temple);
      }
    } else if (arch.shades) {
      // outlandish rave visor (RAVIN' RAY): neon magenta frame, dark wraparound lens
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.09, 0.26), toonMat(0xff3df0));
      frame.position.set(-0.128 * hr, 0.035 * hr, 0);
      frame.scale.setScalar(hr);
      head.add(frame);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.05, 0.21), toonMat(0x1a0f2e));
      lens.position.set(-0.135 * hr, 0.035 * hr, 0);
      lens.scale.setScalar(hr);
      head.add(lens);
    }
    if (arch.phone) {
      // a selfie stick held IN HER HAND (left forearm) — extends from the fist to the phone
      const fa = P.faL.mesh;
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 6), toonMat(0x15151c));
      stick.position.set(0, 0.3, 0);
      fa.add(stick);
      const ph = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.16), toonMat(0x15151c));
      ph.position.set(0, 0.49, 0);
      fa.add(ph);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.13), toonMat(0x9fd6ff));
      screen.position.set(0, 0.475, 0);
      fa.add(screen);
    }
    if (arch.female) {
      const lips = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, arch.lipstick ? 0.042 : 0.03, arch.lipstick ? 0.095 : 0.075),
        toonMat(arch.lipstick || 0xc4506a));
      lips.position.set(-0.156 * hr, -0.055 * hr, 0);
      head.add(lips);
      for (const sgn of [-1, 1]) {
        const lash = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.014, 0.052), toonMat(0x161616));
        lash.position.set(-0.138 * hr, 0.068 * hr, sgn * 0.055 * hr);
        head.add(lash);
        const earring = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), toonMat(0xffd23f));
        earring.position.set(-0.01 * hr, -0.03 * hr, sgn * 0.168 * hr);
        head.add(earring);
      }
      // a proper skirt over the pelvis — or a short bikini bottom — flies with
      // the ragdoll. noSkirt suppresses it (race jumpsuits, and anything with
      // skis: the flare hid Ava's boards completely)
      if (!arch.noSkirt) {
        const skirt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22 * w, (arch.bikini ? 0.3 : 0.4) * w, (arch.bikini ? 0.14 : 0.42) * h, 12),
          toonMat(arch.skirt || 0xc95d73)
        );
        skirt.position.y = (arch.bikini ? -0.02 : -0.14) * h;
        skirt.castShadow = true;
        P.pelvis.mesh.add(skirt);
      }
      if (arch.busty) {
        // the dress has a figure — dress- (or crop-top-) colored
        for (const sgn of [-1, 1]) {
          const bump = new THREE.Mesh(new THREE.SphereGeometry(0.115 * w, 10, 10), toonMat(arch.cropTop || arch.shirt));
          bump.position.set(-0.2 * w, 0.08, sgn * 0.1 * w);
          bump.castShadow = true;
          P.torso.mesh.add(bump);
        }
      }
      if (arch.cropTop) {
        // a crop top band across the chest — the midriff below stays bare (skin torso)
        const r = 0.38 * w * 0.52 + 0.02;
        const band = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.17 * h, 14), toonMat(arch.cropTop));
        band.position.y = 0.12 * h;
        band.castShadow = true;
        P.torso.mesh.add(band);
      }
    }
    if (arch.hair) {
      const hm = toonMat(arch.hairCol || 0x5b3d1e);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.175 * hr, 12, 12), hm);
      cap.scale.set(1, 0.8, 1.05);
      // faces -X; hairFlow pushes the cap up & back so it never drapes over the face
      cap.position.set((arch.hairFlow ? 0.09 : 0.025) * hr, (arch.hairFlow ? 0.07 : 0.03) * hr, 0);
      head.add(cap);
      if (arch.fringe) {
        // a hair fringe across the forehead — reads as HAIR even under a hat
        // (a pale scalp cap alone read as a bald head from the play camera)
        const fr = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.23), hm);
        fr.position.set(-0.145 * hr, 0.1 * hr, 0);
        fr.rotation.z = 0.12;
        fr.scale.setScalar(hr);
        head.add(fr);
      }
      if (arch.hair === 'pony') {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), hm);
        tail.position.set(0.17 * hr, -0.07 * hr, 0);
        tail.rotation.z = -0.35;
        tail.scale.setScalar(hr);
        head.add(tail);
      } else if (arch.hair === 'bun') {
        const bun = new THREE.Mesh(new THREE.SphereGeometry(0.075 * hr, 10, 10), hm);
        bun.position.set(0.16 * hr, 0.09 * hr, 0);
        head.add(bun);
      } else if (arch.hair === 'long') {
        const flow = arch.hairFlow;   // windswept: sweep the hair up and back
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.09, flow ? 0.5 : 0.42, 0.22), hm);
        back.position.set((flow ? 0.22 : 0.13) * hr, (flow ? 0.04 : -0.12) * hr, 0);
        if (flow) back.rotation.z = -0.7;
        back.scale.setScalar(hr);
        head.add(back);
        for (const sgn of [-1, 1]) {
          const strand = new THREE.Mesh(new THREE.BoxGeometry(0.12, flow ? 0.4 : 0.34, 0.055), hm);
          strand.position.set((flow ? 0.14 : 0.01) * hr, (flow ? 0.02 : -0.13) * hr, sgn * 0.15 * hr);
          if (flow) strand.rotation.z = -0.55;
          strand.scale.setScalar(hr);
          head.add(strand);
        }
        if (flow) {
          // volume on TOP and BACK only, swept back — the face stays fully clear
          const pouf = new THREE.Mesh(new THREE.SphereGeometry(0.15 * hr, 12, 12), hm);
          pouf.scale.set(1.05, 0.85, 1.15);
          pouf.position.set(0.11 * hr, 0.13 * hr, 0);   // high on the crown, well behind the face
          head.add(pouf);
          for (const sgn of [-1, 1]) {
            // hair swept back behind the ears (sides only — never over the front)
            const side = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.055), hm);
            side.position.set(0.07 * hr, -0.04 * hr, sgn * 0.15 * hr);
            side.rotation.z = -0.15;
            side.scale.setScalar(hr);
            head.add(side);
          }
        }
      } else if (arch.hair === 'frizz') {
        // a wild, frizzy burst — irregular puffs around the crown and sides,
        // erupting over the headband like an aging boxer's mop
        const puffs = [
          [0.1, 0.12, 0.0, 0.075], [0.02, 0.15, 0.1, 0.065], [0.02, 0.15, -0.1, 0.065],
          [0.12, 0.08, 0.12, 0.06], [0.12, 0.08, -0.12, 0.06], [-0.04, 0.16, 0.0, 0.06],
          [0.16, 0.04, 0.06, 0.055], [0.16, 0.04, -0.06, 0.055],
          [0.06, 0.05, 0.16, 0.05], [0.06, 0.05, -0.16, 0.05],
        ];
        for (const [x, y, z, r] of puffs) {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), hm);
          puff.position.set(x * hr, y * hr, z * hr);
          puff.scale.setScalar(hr);
          head.add(puff);
        }
      } else if (arch.hair === 'swoop') {
        // the architectural marvel: swept forward, up, and back into legend
        const swoop = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.055, 0.19), hm);
        swoop.position.set(-0.1 * hr, 0.12 * hr, 0);
        swoop.rotation.z = -0.3;
        swoop.scale.setScalar(hr);
        head.add(swoop);
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.17), hm);
        crest.position.set(-0.165 * hr, 0.075 * hr, 0);
        crest.rotation.z = -0.9;
        crest.scale.setScalar(hr);
        head.add(crest);
        for (const sgn of [-1, 1]) {
          const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.085, 0.032), hm);
          side.position.set(0, -0.015 * hr, sgn * 0.16 * hr);
          side.scale.setScalar(hr);
          head.add(side);
        }
      }
    }
    if (arch.cello) {
      // his beloved cello, held out front mid-lesson — it flies WITH him
      const tr = 0.38 * w * 0.52;
      const cello = new THREE.Group();
      const bodyC = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.24, 4, 12), toonMat(0x7a4520));
      bodyC.scale.set(0.5, 1, 1);
      cello.add(bodyC);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.4, 0.05), toonMat(0x452510));
      neck.position.y = 0.44;
      cello.add(neck);
      const scroll = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), toonMat(0x452510));
      scroll.position.y = 0.66;
      cello.add(scroll);
      for (const sgn of [-1, 1]) {
        const str = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.58, 0.005), toonMat(0xe8e2d0));
        str.position.set(-0.088, 0.18, sgn * 0.012);
        cello.add(str);
      }
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 5), toonMat(0x9aa2ad));
      pin.position.y = -0.42;
      cello.add(pin);
      cello.position.set(-(tr + 0.15), -0.1 * h, 0.03);
      cello.rotation.z = -0.14;
      cello.traverse((m) => { m.castShadow = true; });
      P.torso.mesh.add(cello);
    }
    if (arch.beltCol) {
      // a champion's belt around the waist, gold buckle out front
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.29 * w, 0.29 * w, 0.11 * h, 14), toonMat(arch.beltCol));
      belt.position.y = 0.1 * h;
      belt.castShadow = true;
      P.pelvis.mesh.add(belt);
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1 * h, 0.11), toonMat(0xd8b13c));
      buckle.position.set(-0.29 * w, 0.1 * h, 0);
      buckle.castShadow = true;
      P.pelvis.mesh.add(buckle);
    }

    // wardrobe extras that ride the torso (and fly with it)
    if (arch.grease) {
      // pale sheen streaks down the bare oiled torso — a flat toon material can't
      // shine, so paint the glisten on. Gives Pete a one-glance "greased" read.
      const tr = 0.38 * w * 0.52;
      for (const [sy, sz] of [[0.15 * h, 0.05], [0.0, 0.09], [-0.13 * h, 0.02]]) {
        const sheen = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), toonMat(0xfdf3da));
        sheen.scale.set(0.4, 1.6, 0.4);
        sheen.position.set(-(tr + 0.004), sy, sz);
        P.torso.mesh.add(sheen);
      }
    }
    if (arch.wings) {
      // small trainee wings on the back — the big ones must be earned
      const tr = 0.38 * w * 0.52;
      for (const s of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.3), toonMat(0xf6f2e8));
        wing.position.set(tr + 0.03, 0.12 * h, s * 0.16);
        wing.rotation.x = s * 0.5;
        wing.castShadow = true;
        P.torso.mesh.add(wing);
      }
    }
    if (arch.inkblot) {
      // a mirrored Rorschach blob across the chest — what do YOU see?
      const tr = 0.38 * w * 0.52;
      for (const s of [-1, 1]) {
        const blob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 6), toonMat(arch.inkblot));
        blob.scale.set(0.35, 1.3, 0.8);
        blob.position.set(-(tr + 0.004), 0.08 * h, s * 0.07);
        blob.rotation.x = s * 0.5;
        P.torso.mesh.add(blob);
      }
    }
    if (arch.ribs) {
      // painted rib bands — mostly xylophone, occasionally person
      const tr = 0.38 * w * 0.52;
      for (const ry of [0.12, 0.0, -0.12]) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.34 * w), toonMat(arch.ribs));
        rib.position.set(-(tr + 0.004), ry * h, 0);
        P.torso.mesh.add(rib);
      }
    }
    if (arch.scythe) {
      // the groundskeeper's scythe — FOR THE LAWN. Rides the arm, flies with him.
      const fa = P.faR.mesh;
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 1.5, 6), toonMat(0x8a6844));
      shaft.position.set(0, 0.45, 0);
      fa.add(shaft);
      const blade = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 6, 10, Math.PI * 0.75), toonMat(0xc9ced6));
      blade.position.set(0.1, 1.15, 0);
      blade.rotation.z = -0.6;
      fa.add(blade);
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 5), toonMat(0x5c7a3a));
      tuft.position.set(0.3, 1.05, 0);
      fa.add(tuft);
    }
    if (arch.hoodie) {
      // the hood ring behind the neck + two drawstring dots: founder mode
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13 * w + 0.06, 0.05, 7, 14), toonMat(arch.hoodie));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.22 * h;
      P.torso.mesh.add(ring);
      const tr = 0.38 * w * 0.52;
      for (const sgn of [-1, 1]) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 5), toonMat(0xf2f2f0));
        dot.position.set(-(tr + 0.01), 0.14 * h, sgn * 0.05);
        P.torso.mesh.add(dot);
      }
    }
    if (arch.lanyard) {
      // the badge never comes off
      const tr = 0.38 * w * 0.52;
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.3 * h, 0.02), toonMat(typeof arch.lanyard === 'number' ? arch.lanyard : 0x2f6fe0));
      strap.position.set(-(tr + 0.006), 0.12 * h, 0);
      P.torso.mesh.add(strap);
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.11, 0.08), toonMat(0xf2f2f0));
      badge.position.set(-(tr + 0.012), -0.05 * h, 0);
      P.torso.mesh.add(badge);
    }
    if (arch.robot) {
      // chassis plating + vent bars on the torso
      const tr = 0.38 * w * 0.52;
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34 * h, 0.42 * w), toonMat(0x7a828c));
      plate.position.set(-(tr + 0.01), 0.05 * h, 0);
      plate.castShadow = true;
      P.torso.mesh.add(plate);
      for (const vy of [0.14, 0.05, -0.04]) {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.3 * w), toonMat(0x2a2a33));
        vent.position.set(-(tr + 0.045), vy * h, 0);
        P.torso.mesh.add(vent);
      }
    }
    if (arch.skis) {
      // the skis stay ON — boards ride the lower legs, so they fly with her.
      // Bright gold with a red stripe: the old suit-red boards vanished against
      // her suit and the dirt ("I don't think she has skis at this point")
      // boards sit AT grade (they were spawning 0.11 below the dirt — invisible)
      // and run along the LANE (−x, her escape line), not side-on to the camera
      for (const leg of [P.llL, P.llR]) {
        const skiG = new THREE.Group();
        skiG.rotation.y = Math.PI / 2; // length along x — the direction she skis
        skiG.position.y = -0.16;
        leg.mesh.add(skiG);
        const ski = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 1.4), toonMat(0xffd23f));
        ski.position.set(0, 0, -0.18);
        ski.castShadow = true;
        skiG.add(ski);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.02, 0.5), toonMat(0xd8232e));
        stripe.position.set(0, 0.01, -0.1);
        skiG.add(stripe);
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.18), toonMat(0xffd23f));
        tip.position.set(0, 0.055, -0.92);
        tip.rotation.x = 0.5;
        skiG.add(tip);
        const binding = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.14), toonMat(0x17171d));
        binding.position.set(0, 0.04, -0.02);
        skiG.add(binding);
      }
    }
    if (arch.windKey) {
      // a brass wind-up key out the back (+x) — the whole joke: you can see he's a wind-up.
      // Rides the torso, so it flies with him on launch.
      const tr = 0.38 * w * 0.52;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 8), toonMat(0xd8b13c));
      stem.rotation.z = Math.PI / 2;
      stem.position.set(tr + 0.09, 0.06 * h, 0);
      stem.castShadow = true;
      P.torso.mesh.add(stem);
      for (const sgn of [-1, 1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.018, 6, 14), toonMat(0xd8b13c));
        ring.rotation.y = Math.PI / 2;
        ring.position.set(tr + 0.17, 0.06 * h, sgn * 0.05);
        ring.castShadow = true;
        P.torso.mesh.add(ring);
      }
    }
    if (arch.stripes) {
      const tr = 0.38 * w * 0.52 + 0.008;
      for (const sy of [-0.13 * h, 0.01 * h, 0.15 * h]) {
        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(tr, tr, 0.055 * h, 14), toonMat(arch.stripes));
        stripe.position.y = sy;
        P.torso.mesh.add(stripe);
      }
    }
    if (arch.suspenders) {
      const tr = 0.38 * w * 0.52;
      for (const sgn of [-1, 1]) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.44 * h, 0.05), toonMat(arch.suspenders));
        strap.position.set(-(tr + 0.005), 0.02, sgn * 0.07 * w);
        strap.castShadow = true;
        P.torso.mesh.add(strap);
      }
    }
    if (arch.suit) {
      // crisp white shirtfront and the power tie — it reaches the belt. Always.
      // (bowtie swaps the blade for a bow at the collar — evening dress rules.)
      const tr = 0.38 * w * 0.52;
      const shirtV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24 * h, 0.11 * w), toonMat(0xf2ede1));
      shirtV.position.set(-(tr + 0.004), 0.09 * h, 0);
      shirtV.castShadow = true;
      P.torso.mesh.add(shirtV);
      if (arch.bowtie) {
        const knot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.045), toonMat(arch.tie || 0xf4f0ea));
        knot.position.set(-(tr + 0.022), 0.18 * h, 0);
        P.torso.mesh.add(knot);
        for (const sgn of [-1, 1]) {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.07), toonMat(arch.tie || 0xf4f0ea));
          wing.position.set(-(tr + 0.018), 0.18 * h, sgn * 0.055);
          P.torso.mesh.add(wing);
        }
      } else {
        const knot = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.055), toonMat(arch.tie || 0xc9302c));
        knot.position.set(-(tr + 0.018), 0.18 * h, 0);
        P.torso.mesh.add(knot);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32 * h, 0.06), toonMat(arch.tie || 0xc9302c));
        blade.position.set(-(tr + 0.018), 0.0, 0);
        blade.castShadow = true;
        P.torso.mesh.add(blade);
      }
    }
    if (arch.tails) {
      // tailcoat skirts off the back of the jacket (+x is behind him)
      const tr = 0.38 * w * 0.52;
      for (const sgn of [-1, 1]) {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3 * h, 0.1 * w), toonMat(arch.pants || 0x17171d));
        tail.position.set(tr - 0.01, -0.32 * h, sgn * 0.09 * w);
        tail.rotation.z = -0.12;
        tail.castShadow = true;
        P.torso.mesh.add(tail);
      }
    }
    if (arch.springShoes) {
      // carnival spring shoes: stacked coils under each boot — the gimmick, visible
      for (const leg of [P.llL, P.llR]) {
        for (let i = 0; i < 3; i++) {
          const coil = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 12), toonMat(arch.springShoes));
          coil.rotation.x = Math.PI / 2;
          coil.position.set(0, -0.33 - i * 0.045, 0.02);
          coil.castShadow = true;
          leg.mesh.add(coil);
        }
      }
    }
    if (arch.yogaMat) {
      // a rolled mat slung across the upper back
      const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.52, 10), toonMat(arch.yogaMat));
      const tr = 0.38 * w * 0.52;
      mat.rotation.x = Math.PI / 2;
      mat.rotation.z = 0.25;
      mat.position.set(tr + 0.06, 0.12 * h, 0);
      mat.castShadow = true;
      P.torso.mesh.add(mat);
    }
    if (arch.whiteBeard || arch.beard) {
      // a chin beard — wispy white sage by default, or a fuller colored beard for arch.beard
      const full = !!arch.beard;
      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.06, full ? 0.17 : 0.12, full ? 0.15 : 0.11), toonMat(arch.beard || 0xe8e2d5));
      beard.position.set(-0.135 * hr, (full ? -0.15 : -0.12) * hr, 0);
      beard.scale.setScalar(hr);
      beard.castShadow = true;
      head.add(beard);
    }
    if (arch.brawn) { P.torso.mesh.scale.x = 1.2; P.torso.mesh.scale.z = 1.2; } // broad frontier-legend build
    if (arch.redAura) {
      // a red power-up ring at the feet — hidden until secondWind surges (setSurge)
      const aura = this.auraRing = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.85, 22),
        new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = -0.92;
      aura.visible = false;
      P.pelvis.mesh.add(aura);
    }

    // red handprint decal, revealed on impact
    const print = this.handprint = new THREE.Group();
    const pm = new THREE.MeshBasicMaterial({ color: 0xd83a3a });
    const palm = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), pm);
    print.add(palm);
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.02, 8), pm);
      const a = -0.7 + i * 0.35;
      f.position.set(Math.sin(a) * 0.1, Math.cos(a) * 0.1, 0);
      print.add(f);
    }
    print.rotation.y = -Math.PI / 2;
    print.position.set(-0.165 * hr, 0, 0.04 * hr);
    print.scale.setScalar(hr);
    print.visible = false;
    head.add(print);

    // --- headwear: distinct per volunteer. Real hats get a physics body so
    // they pop off on impact; headbands hug the skull and stay put. ---
    if (arch.hat === 'band' || !arch.hat) {
      if (arch.hat === 'band') {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.182, 0.07, 14),
          toonMat(arch.hatCol || 0xa8402e));
        band.scale.setScalar(hr);
        band.position.set(0, 0.055 * hr, 0);
        band.rotation.x = 0.1;
        head.add(band);
      }
      this.hatBody = null;
      this.hatMesh = null;
    } else {
      this.hatBody = new CANNON.Body({
        mass: 0.2, type: CANNON.Body.KINEMATIC, material: mat,
        collisionFilterGroup: 2, collisionFilterMask: 1,
        angularDamping: 0.3,
      });
      this.hatBody.addShape(new CANNON.Cylinder(0.13 * hr, 0.13 * hr, 0.12, 10));
      this.hatBody.position.set(START_X - 0.13 * hr, (1.56 + 0.17 * hr + 0.1) * h, 0);
      this.hatBody.quaternion.setFromEuler(0, 0, 0.35);
      world.addBody(this.hatBody);
      const hat = this.hatMesh = new THREE.Group();
      const T = toonMat;
      if (arch.hat === 'cap') {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), T(arch.hatCol || 0xd8404f));
        dome.position.y = -0.05;
        hat.add(dome);
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.15), T(arch.hatCol || 0xd8404f));
        brim.position.set(-0.19, -0.045, 0); // bill forward — he faces the player
        hat.add(brim);
        const button = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), T(0xf2ede1));
        button.position.y = 0.1;
        hat.add(button);
      } else if (arch.hat === 'cowboy') {
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.03, 14), T(0x6b4a2e));
        brim.position.y = -0.05;
        hat.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.155, 0.2, 12), T(0x6b4a2e));
        crown.position.y = 0.05;
        hat.add(crown);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.05, 12), T(0x3a2a1a));
        band.position.y = -0.02;
        hat.add(band);
      } else if (arch.hat === 'sun') {
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.022, 16), T(arch.hatCol || 0xf2e6cc));
        brim.position.y = -0.05;
        hat.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.1, 12), T(arch.hatCol || 0xf2e6cc));
        hat.add(crown);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.162, 0.04, 12), T(arch.bandCol || 0xc95d73));
        band.position.y = -0.03;
        hat.add(band);
        const flowerC = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), T(0xffd23f));
        flowerC.position.set(-0.16, -0.02, 0.16);
        hat.add(flowerC);
        for (let i = 0; i < 5; i++) {
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), T(0xff8fb0));
          const pa = (i / 5) * Math.PI * 2;
          petal.position.set(-0.16 + Math.cos(pa) * 0.045, -0.028, 0.16 + Math.sin(pa) * 0.045);
          hat.add(petal);
        }
      } else if (arch.hat === 'floppy') {
        // a chic wide-brim floppy fashion hat — soft rounded crown, bold ribbon
        const col = arch.hatCol || 0xf7f2ea;
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.4, 0.02, 20), T(col));
        brim.position.y = -0.075;
        brim.rotation.x = 0.06;   // a slight jaunty droop
        hat.add(brim);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), T(col));
        crown.position.y = -0.03;
        hat.add(crown);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.148, 0.02, 14), T(col));
        cap.position.y = 0.055;
        hat.add(cap);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.158, 0.055, 16), T(arch.bandCol || 0x2f6fe0));
        band.position.y = -0.05;
        hat.add(band);
      } else if (arch.hat === 'top') {
        // the formal topper — tall cylinder, crisp brim, gold band. It pops off
        // on impact like every real hat, which is most of why it exists.
        const col = arch.hatCol || 0x17171d;
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.025, 16), T(col));
        brim.position.y = -0.05;
        hat.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.145, 0.34, 14), T(col));
        crown.position.y = 0.13;
        hat.add(crown);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.153, 0.153, 0.06, 14), T(arch.bandCol || 0xd8b13c));
        band.position.y = -0.005;
        hat.add(band);
      } else if (arch.hat === 'beanie') {
        // a knit ski beanie: soft dome, folded band, pom on top — pops off on
        // impact like every real hat
        const col = arch.hatCol || 0xf2ede1;
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), T(col));
        dome.position.y = -0.04;
        hat.add(dome);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.18, 0.075, 14), T(arch.bandCol || 0xd8232e));
        band.position.y = -0.045;
        hat.add(band);
        const pom = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), T(arch.bandCol || 0xd8232e));
        pom.position.y = 0.14;
        hat.add(pom);
      } else { // straw
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 14), T(0xd9b96a));
        brim.position.y = -0.05;
        hat.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.14, 12), T(0xcfae5c));
        hat.add(crown);
        if (arch.bandCol) {
          const band = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.045, 12), T(arch.bandCol));
          band.position.y = -0.03;
          hat.add(band);
        }
      }
      hat.children.forEach((m) => { m.castShadow = true; });
      hat.scale.setScalar(hr);
      scene.add(hat);
      this.syncHat();
    }

    // --- pulsing cheek target: teaches where the points live ---
    const tgt = this.target = new THREE.Group();
    const ringO = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    tgt.add(ringO);
    const ringI = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.08, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    tgt.add(ringI);
    tgt.visible = false;
    scene.add(tgt);

    // snapshot the braced pose so the showcase animation has a home to return to
    this.basePose = {};
    for (const n in this.rag.parts) {
      const b = this.rag.parts[n].body;
      this.basePose[n] = { p: b.position.clone(), q: b.quaternion.clone() };
    }
    this.hatOff = this.hatBody ? this.hatBody.position.vsub(this.rag.parts.head.body.position) : null;
  }

  // "c'mere, champ" — bob, offer the cheek, beckon with one arm
  animateShowcase() {
    const t = this.time;
    const P = this.rag.parts;
    const B = this.basePose;
    const { w, h } = this.arch;
    const bob = Math.sin(t * 2.6) * 0.035;
    for (const n in P) {
      P[n].body.position.copy(B[n].p);
      P[n].body.quaternion.copy(B[n].q);
      P[n].body.position.y += bob;
    }
    // waggle the offered cheek
    P.head.body.position.y += bob * 0.5;
    P.head.body.quaternion.setFromEuler(0.18 + Math.sin(t * 2.6 + 0.6) * 0.16, 0, this.arch.lookUp ? -0.5 : 0.35);
    // beckoning right arm: raised toward the player, forearm curling
    const shX = START_X + 0.02 * w, shY = 1.5 * h + bob, shZ = -0.24 * w;
    P.uaR.body.position.set(shX - 0.13 * w, shY, shZ);
    P.uaR.body.quaternion.setFromEuler(0, 0, 1.45);
    const elX = shX - 0.26 * w, elY = shY - 0.02;
    const th = 1.15 - 0.55 * Math.sin(t * 5.5);
    P.faR.body.position.set(elX - Math.sin(th) * 0.13 * h, elY + Math.cos(th) * 0.13 * h, shZ + 0.02);
    P.faR.body.quaternion.setFromEuler(0, 0, th);
    if (this.hatBody) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
    this.rag.sync();
    this.syncHat();
  }

  syncHat() {
    if (!this.hatBody) return;
    this.hatMesh.position.copy(this.hatBody.position);
    this.hatMesh.quaternion.copy(this.hatBody.quaternion);
  }

  setSurge(on) { this.surging = on; if (this.auraRing) this.auraRing.visible = on; } // Chuck's Second Wind power-up glow
  beginEscape() { this.escaping = true; } // skiRun: the whistle blows and she pushes off
  escaped() {
    // past the exit gate behind the player — the attempt is dead the instant this is true
    return !!(this.arch.skiRun && !this.launched && this.runX !== undefined && this.runX < this.arch.skiRun.exitX);
  }
  inReach() {
    // bjj: true only during the REACH segment (the telegraph is the warning)
    if (!this.arch.bjj || this.launched) return false;
    const b = this.arch.bjj;
    return (this.time % b.period) >= b.period - b.reach;
  }
  headFacing() {
    // headTurn bosses: how square the face is to the palm right now.
    // 1.1 = caught the turn flush; 0.25 = the back of the head. Deterministic.
    if (!this.arch.headTurn) return 1;
    const ht = this.arch.headTurn;
    const yaw = Math.sin((this.time / ht.period) * Math.PI * 2) * ht.arc;
    return Math.min(1.1, 0.25 + 0.85 * Math.max(0, Math.cos(yaw)));
  }
  headPos() { return new THREE.Vector3().copy(this.rag.parts.head.body.position); }
  torsoPos() { return new THREE.Vector3().copy(this.rag.parts.torso.body.position); }
  pelvisPos() { return new THREE.Vector3().copy(this.rag.parts.pelvis.body.position); }

  setTargetVisible(on) { this.target.visible = on && !this.launched; }

  // 0 = yellow (wait) · 1 = green (GOOD window) · 2 = bright flash (PERFECT core)
  setTargetHot(level) {
    if (this._hot === level) return;
    this._hot = level;
    const col = level === 2 ? 0xc4ffd2 : level === 1 ? 0x54ff6e : 0xffd23f;
    this.target.children.forEach((m) => m.material.color.setHex(col));
  }

  // swept hand segment vs head then torso spheres
  checkHit(p0, p1, rHand) {
    if (this.launched) return null;
    const hc = this.headPos();
    let pt = segSphere(p0, p1, hc, this.rHead + rHand);
    if (pt) return { part: 'head', point: pt, center: hc };
    const tc = this.torsoPos();
    pt = segSphere(p0, p1, tc, this.rTorso + rHand);
    // the collar shrug zone: a graze above the chest is a hand EN ROUTE to the
    // face — play on, let the arc reach the cheek. Belly and chest still count.
    if (pt && pt.y > tc.y + this.rTorso * 0.5) pt = null;
    if (pt) return { part: 'torso', point: pt, center: tc };
    return null;
  }

  launch(dir, power) {
    if (this.launched) return;
    this.launched = true;
    this.target.visible = false;
    const speed = Math.min(power / this.knockback, 34);
    this.rag.launch(dir, speed);
    this.handprint.visible = true;
    const hb = this.hatBody;
    if (hb) {
      hb.type = CANNON.Body.DYNAMIC;
      hb.updateMassProperties();
      hb.wakeUp();
      hb.velocity.set(dir.x * speed * 0.4, dir.y * speed * 0.4 + 2.4, (Math.random() - 0.5) * 1.5);
      hb.angularVelocity.set(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3);
    }
  }

  update(dt = 0) {
    this.time += dt;
    if (this.surging && this.auraRing) {
      const p = 1 + Math.sin(this.time * 9) * 0.2; // breathe like an energy field, not a decal
      this.auraRing.scale.set(p, p, 1);
    }
    if (this.launched) {
      this.rag.sync();
      this.syncHat();
      if (this.pelvisPos().x > 57) this.wallSplat = true;
    } else if (this.showcaseMode) {
      this.animateShowcase();
    } else {
      const A = this.arch;
      const gimmick = A.weave || A.skiRun || A.hop || A.sway || A.headTurn || A.bjj || A.bounce;
      if (!gimmick) {
        // every volunteer BREATHES: a slow, readable rise-and-fall of the cheek
        // (~4.5s period, ±5cm). Never enough to whiff — but a flush hit wants
        // the head level with your swing plane, so watching the ring pays.
        // Deterministic sine; sin(0)=0 so the strike plane is set at rest height.
        const breathe = Math.sin(this.time * 1.4) * 0.05;
        const P = this.rag.parts;
        P.head.body.position.y = this.basePose.head.p.y + breathe;
        P.torso.body.position.y = this.basePose.torso.p.y + breathe * 0.35;
        if (this.hatBody && this.hatOff) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
        this.rag.sync();
        this.syncHat();
      }
      if (A.skiRun) {
        // THE GREAT ESCAPE: she parks down the lane, and at the whistle
        // (beginEscape) skis straight past the player toward the exit gate.
        // The whole body translates on the LIVE physics bodies, so the swept
        // hit test is honest: you strike as she crosses the pocket, or she is
        // GONE (main.js polls escaped() for the instant fail). She checks her
        // speed through the ring — a real skier's brake — which is the window.
        // Constant speed, fixed line: deterministic and learnable, zero RNG.
        const sr = A.skiRun;
        if (this.runX === undefined) this.runX = sr.startX;
        if (this.escaping && this.runX > sr.exitX - 3) {
          // two-speed line: full send outside the ring, a 45% brake-check through
          // it — unless noBrake (competition speed: the pocket is one second wide).
          // twoLine (v2) holds line B at the start for one extra pole-plant.
          const held = sr.twoLine && this.runLine === 1 && this.runT === undefined && (this.holdT = (this.holdT || 0) + dt) < sr.twoLine.delayB;
          const v = held ? 0 : (!sr.noBrake && Math.abs(this.runX) < 1.4) ? sr.speed * 0.55 : sr.speed;
          this.runX -= v * dt;
        }
        const x = this.runX;
        const tl = sr.twoLine;
        const amp = tl ? tl.z : 0.28;
        const phase = tl && this.runLine === 1 ? Math.PI : 0;
        const blend = Math.min(1, Math.abs(x) / (tl ? tl.blendX : 3));
        const carve = Math.sin(this.time * 2.2 + phase) * amp * blend
          + (tl ? (this.runLine === 1 ? -1 : 1) * tl.z * (1 - Math.min(1, Math.abs(x - sr.startX) / 2)) : 0); // push-off side announces the line
        const P = this.rag.parts;
        for (const n in this.basePose) {
          P[n].body.position.x = this.basePose[n].p.x + x;
          P[n].body.position.z = this.basePose[n].p.z + carve;
        }
        P.head.body.position.x += -0.08; // racer's forward tuck
        if (this.hatBody && this.hatOff) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
        this.rag.sync();
        this.syncHat();
      }
      if (A.hop || A.bounce) {
        // PERPETUAL MOTION: a parabolic bounce, feet find the dirt once per
        // period — the cheek is only at swing height around each landing.
        // Deterministic; time the whip for the touchdown.
        const hp = A.hop || A.bounce;
        const ph = (this.time % hp.period) / hp.period;
        const yOff = hp.height * 4 * ph * (1 - ph);
        const P = this.rag.parts;
        for (const n in this.basePose) P[n].body.position.y = this.basePose[n].p.y + yOff;
        if (this.hatBody && this.hatOff) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
        this.rag.sync();
        this.syncHat();
      }
      if (A.sway) {
        // SUN SALUTATION: a slow fore/aft lean — she is NOT hiding, it is
        // exercise. The cheek drifts into reach on the lean-in (−x, toward the
        // palm) and out of it on the lean-away. Strike on the inhale.
        const xOff = Math.sin((this.time / A.sway.period) * Math.PI * 2) * A.sway.amp;
        const P = this.rag.parts;
        P.head.body.position.x = this.basePose.head.p.x + xOff;
        P.torso.body.position.x = this.basePose.torso.p.x + xOff * 0.62;
        P.pelvis.body.position.x = this.basePose.pelvis.p.x + xOff * 0.2;
        P.head.body.position.y = this.basePose.head.p.y - Math.abs(xOff) * 0.16; // a real fold dips the head
        if (this.hatBody && this.hatOff) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
        this.rag.sync();
        this.syncHat();
      }
      if (A.headTurn) {
        // ALL ANGLES: the skull yaws left/right on a fixed metronome. Contact
        // still registers (the head is a sphere), but power scales with how
        // square the face is — headFacing() feeds the multiplier in main.js.
        // Catch the face mid-turn, incoming: that is the flush window.
        const yaw = Math.sin((this.time / A.headTurn.period) * Math.PI * 2) * A.headTurn.arc;
        const P = this.rag.parts;
        P.head.body.quaternion.setFromEuler(0, yaw, 0);
        const breathe = Math.sin(this.time * 1.4) * 0.05; // he still breathes — the turn is the exam
        P.head.body.position.y = this.basePose.head.p.y + breathe;
        P.torso.body.position.y = this.basePose.torso.p.y + breathe * 0.35;
        if (this.hatBody && this.hatOff) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
        this.rag.sync();
        this.syncHat();
      }
      if (A.bjj) {
        // BLUE BELT, TWO STRIPES: a fixed, readable grappling cycle. 1.45s
        // square in the pocket (safe), a 0.35s TELEGRAPH as both arms rise,
        // then 1.2s of REACH — contact during the reach is a TAKEDOWN (main.js
        // consumes the attempt). Deterministic; a full chain fits the safe
        // window if you start as his arms drop.
        const b = A.bjj;
        const t = this.time % b.period;
        const tele = b.period - b.reach - b.telegraph; // 1.45
        const k = t < tele ? 0 : t < tele + b.telegraph ? (t - tele) / b.telegraph : 1;
        this._reachK = k;
        const P = this.rag.parts;
        for (const n of ['uaL', 'faL']) {
          P[n].body.position.x = this.basePose[n].p.x - 0.28 * k; // arms extend toward you
          P[n].body.position.y = this.basePose[n].p.y + (n === 'faL' ? 0.1 : 0.04) * k;
        }
        P.torso.body.position.x = this.basePose.torso.p.x - 0.04 * k;  // leans into the shot
        P.head.body.position.x = this.basePose.head.p.x - 0.04 * k;   // a hint forward — the cheek STAYS honest
        P.head.body.position.y = this.basePose.head.p.y - 0.03 * k;   // the wrestler's crouch
        if (this.hatBody && this.hatOff) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
        this.rag.sync();
        this.syncHat();
      }
      if (this.arch.weave) {
        // bob & weave: the head slips side to side on the LIVE physics bodies, so
        // the swept-segment hit test genuinely misses off-center — the only added
        // "dice" is readable, human-tempo motion the player times, not RNG.
        // a boxer's SLIP, not a sine wave: he alternates 1.5s square in the pocket
        // with 1.5s ducked-and-leaning-away — which puts the cheek below the swing
        // plane AND beyond the arm's reach, outlasting even the rebound flail. The
        // rhythm is fixed and readable (no RNG): time the whip for the up-window.
        const inPocket = (this.time % 3.0) < 1.5 ? 0 : 1;
        this._slipK = (this._slipK || 0) + (inPocket - (this._slipK || 0)) * Math.min(1, dt * 9);
        const k = this._slipK, sway = Math.sin(this.time * 2.1) * 0.2;
        const P = this.rag.parts;
        P.head.body.position.y = this.basePose.head.p.y - 0.38 * k;
        P.head.body.position.x = this.basePose.head.p.x + 0.32 * k;
        P.head.body.position.z = this.basePose.head.p.z + sway;
        P.torso.body.position.y = this.basePose.torso.p.y - 0.19 * k;
        P.torso.body.position.x = this.basePose.torso.p.x + 0.16 * k;
        P.torso.body.position.z = this.basePose.torso.p.z + sway * 0.55;
        if (this.hatBody && this.hatOff) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
        this.rag.sync();
        this.syncHat();
      }
      if (this.target.visible) {
        const hc = this.headPos();
        this.target.position.set(hc.x - this.rHead - 0.06, hc.y, hc.z);
        this.target.rotation.y = -Math.PI / 2 + 0.5; // angled toward the camera side
        // perfect window flashes hard and fast; good window pulses; idle breathes
        const spd = this._hot === 2 ? 14 : 6;
        const amp = this._hot === 2 ? 0.3 : 0.12;
        const p = 1 + Math.sin(this.time * spd) * amp;
        this.target.scale.setScalar(p * this.rHead / 0.17);
      }
    }
  }

  distance() {
    return Math.max(0, this.pelvisPos().x - this.startX);
  }

  remove() {
    this.rag.remove();
    if (this.hatBody) {
      this.world.removeBody(this.hatBody);
      this.scene.remove(this.hatMesh);
    }
    this.scene.remove(this.target);
  }
}
