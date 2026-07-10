// THE CAMPAIGNS — two storylines. HIDDEN from the public until CAMPAIGN_LIVE
// flips true; reachable meanwhile only via ?tour=1 (dev/preview).
// Every challenge names its volunteer (the story picks your target), opens
// with a cinematic scene (letterboxed, 3/4 close-ups — shots: 'spirit' frames
// Master Slee's ghost, 'judge' frames Pennywhistle ringside), and completed
// challenges stay replayable (no re-clear). Progress: localStorage.slapp_tour;
// scene seen-flags: localStorage.slapp_seen.

const CAMPAIGN_LIVE = false; // flip when the campaigns should appear for everyone

export const TOURS = [
  {
    key: 'palm', title: '🖐 THE LEGEND OF THE OPEN PALM',
    blurb: 'A dead master. Four lost forms. One county that would really rather you practiced somewhere else.',
    acts: [
      {
        act: 'SCROLL I — THE PATIENT COIL',
        story: 'A spirit has appeared at the fairground. He is forty years dead, extremely opinionated, and he says your swivel has promise.',
        challenges: [
          { id: 'a1c1', title: 'THE LISTENING PALM', desc: "A clean slap on HAYSEED HANK's cheek — the honest standard", opp: 'hank', goal: { type: 'head' } },
          { id: 'a1c2', title: 'THROUGH THE BARRICADE', desc: 'Send SLIM PETE 20m — the barricade is a DARE', opp: 'slim', goal: { type: 'dist', v: 20 } },
          { id: 'a1c3', title: 'THE FIRST STUDENT', desc: 'Post MULE-KICK MABEL 35m — she was his student first', opp: 'mabel', goal: { type: 'dist', v: 35 } },
        ],
      },
      {
        act: 'SCROLL II — THE HEAVY HAND',
        story: 'The second form is weight. The master has opinions about weight. The master has opinions about everything.',
        challenges: [
          { id: 'a2c1', title: 'WEIGHT ANSWERS WEIGHT', desc: 'Score 600 off BIG BERTHA — tonnage is truth', opp: 'bertha', goal: { type: 'pts', v: 600 } },
          { id: 'a2c2', title: 'BUDGE THE MOUNTAIN', desc: 'Move BIG HOSS 22m — bring the muscle', opp: 'hoss', goal: { type: 'dist', v: 22 } },
          { id: 'a2c3', title: '☗ BOSS: THE IMMOVABLE OBJECT', desc: '500 points off BOULDER BOB', opp: 'boulder', goal: { type: 'pts', v: 500 } },
        ],
      },
      {
        act: 'SCROLL III — THE OPEN PALM',
        story: 'The final scroll. The family is watching. The family includes at least one ghost.',
        challenges: [
          { id: 'a3c1', title: 'FLAWLESS FORM', desc: 'A 90% chain before MAESTRO FORTISSIMO — every link must SING', opp: 'maestro', goal: { type: 'chain', v: 90 } },
          { id: 'a3c2', title: 'NO SHORTCUTS', desc: 'Send HAYSEED HANK 75m — no featherweights, pure form', opp: 'hank', goal: { type: 'dist', v: 75 } },
          { id: 'a3c3', title: '☗ BOSS: CATCH THE UNCATCHABLE', desc: 'Slap DODGY DALE 60m — time the sway', opp: 'dale', goal: { type: 'dist', v: 60 } },
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
        story: 'A judge arrived to assess whether the fair is "worth keeping." Pack the stands and show him worth.',
        challenges: [
          { id: 'f1c1', title: 'PACK THE STANDS', desc: "Score 350 off BIG BERTHA — when the county's favorite aunt roars, the county roars", opp: 'bertha', goal: { type: 'pts', v: 350 } },
          { id: 'f1c2', title: 'GO VIRAL', desc: 'Send THE INFLUENCER 55m — if the fair trends, it stands', opp: 'influencer', goal: { type: 'dist', v: 55 } },
          { id: 'f1c3', title: '☗ BOSS: ORDER IN THE COURT', desc: 'Score 300 off THE JUDGE — you get FIVE seconds a swing', opp: 'judge', goal: { type: 'pts', v: 300 } },
        ],
      },
      {
        act: 'ACT II — THE CONSULTANTS',
        story: 'Don sent "efficiency consultants" to bury the fair in testimony. Some witnesses can be un-bought. With a palm.',
        challenges: [
          { id: 'f2c1', title: 'HOSTILE WITNESS', desc: "Send RAVIN' RAY 30m — he took glowsticks to testify against us", opp: 'ravinray', goal: { type: 'dist', v: 30 } },
          { id: 'f2c2', title: 'FUNDRAISER FRENZY', desc: 'Score 500 off BIG HOSS — the biggest donor draw at the fair', opp: 'hoss', goal: { type: 'pts', v: 500 } },
          { id: 'f2c3', title: '☗ BOSS: THE UNGRIPPABLE MAN', desc: 'Slap GREASED PETE 50m — only a PERFECT palm grips', opp: 'grease', goal: { type: 'dist', v: 50 } },
        ],
      },
      {
        act: 'ACT III — THE WRECKING CREW',
        story: 'The bulldozers idle at the gate. Don sent his closer — and his closer brought his grandmother.',
        challenges: [
          { id: 'f3c1', title: 'READ THE FINE PRINT', desc: 'An 85% chain before SCHOOLMARM SUSIE — clause 44-B requires faculty grading', opp: 'susie', goal: { type: 'chain', v: 85 } },
          { id: 'f3c2', title: 'JAWBREAKER', desc: 'Move IRON-JAW McGRAW 28m — under 70% chain he will not blink', opp: 'ironjaw', goal: { type: 'dist', v: 28 } },
          { id: 'f3c3', title: '☗ BOSS: GRANNY THUNDER', desc: 'Send the retired champion 35m — she slips, and weak form bores her', opp: 'granny', goal: { type: 'dist', v: 35 } },
        ],
      },
      {
        act: 'EPILOGUE — THE VERDICT',
        story: 'The council voted 6–1 to save the fair. Then the blueprints for Parking Structure Seven turned up in Judge Pennywhistle\'s gavel case — signed three weeks ago, witnessed by a hot dog.',
        challenges: [
          { id: 'f4c1', title: 'FOLLOW THE MONEY', desc: 'Score 400 off TREMENDOUS DON — the briefcase has a cheek too', opp: 'don', goal: { type: 'pts', v: 400 } },
          { id: 'f4c2', title: '☗ FINAL BOSS: CONTEMPT OF COURT', desc: 'Score 350 off JUDGE PENNYWHISTLE — six seconds a swing, and he only respects a 50% case', opp: 'pennywhistle', goal: { type: 'pts', v: 350 } },
        ],
      },
    ],
  },
];

// ---- cutscenes: { who, text, shot } — shot: 'player' | 'opp' | 'spirit' |
// 'judge' | 'wide'. 'YOU' becomes the current slapper's name. Every challenge
// opens with one, shown once (slapp_seen); replays skip straight to the match.
export const CUTSCENES = {
  // ---------- THE LEGEND OF THE OPEN PALM ----------
  a1c1: [
    { who: '👻 MASTER SLEE', text: 'Do not be alarmed. I am Master Slee. I have been dead for forty years and I am STILL the best slapper in this county. That is a problem.', shot: 'spirit' },
    { who: 'YOU', text: "You're a... ghost?", shot: 'player' },
    { who: '👻 MASTER SLEE', text: 'A SPIRIT. Ghosts rattle chains. I rattled CHEEKS. My art dies with me unless somebody learns the Four Forms.', shot: 'spirit' },
    { who: 'HAYSEED HANK', text: "Mornin'. I'm the practice cheek. It's an honor, apparently. Nobody asked me.", shot: 'opp' },
    { who: '👻 MASTER SLEE', text: 'Form One: the palm LISTENS before it speaks. Hank is honest. Strike him honestly — one clean palm, on the cheek.', shot: 'spirit' },
  ],
  a1c2: [
    { who: '👻 MASTER SLEE', text: 'The county built that barricade to keep slapped volunteers out of the pie stand. It is an insult to the art.', shot: 'spirit' },
    { who: 'YOU', text: "It's... safety equipment.", shot: 'player' },
    { who: '👻 MASTER SLEE', text: 'It is a DARE. And Pete here is the dart the county left lying around. Twenty meters. Through it.', shot: 'spirit' },
    { who: 'SLIM PETE', text: 'I volunteered for the pie, not the physics.', shot: 'opp' },
  ],
  a1c3: [
    { who: '👻 MASTER SLEE', text: 'Mabel. My first student. Fifty years ago she took my hardest lesson and asked if that was the whole lesson.', shot: 'spirit' },
    { who: 'MULE-KICK MABEL', text: "Ol' Slee floatin' around again? Tell him my cheek's right where he left it.", shot: 'opp' },
    { who: 'YOU', text: "Wait — she can't see you?", shot: 'player' },
    { who: '👻 MASTER SLEE', text: 'She sees me fine. She is IGNORING me. Thirty-five meters. She would be insulted by less.', shot: 'spirit' },
  ],
  a2c1: [
    { who: '👻 MASTER SLEE', text: 'Scroll Two. A feather flies far and means nothing. Tonnage, student. Tonnage is TRUTH — and Bertha is the truest woman at this fair.', shot: 'spirit' },
    { who: 'BRUCE SLEE', text: "Grandfather. You're haunting AMATEURS now?", shot: 'wide' },
    { who: '👻 MASTER SLEE', text: 'Bruce! My blood! Watch this one — there is a wobble in the swivel, but the palm has promise.', shot: 'spirit' },
    { who: 'BIG BERTHA', text: "Six county fairs, sugar. You'll need more than promise.", shot: 'opp' },
    { who: 'BRUCE SLEE', text: 'Six hundred points, rookie. Impress the dead man.', shot: 'wide' },
  ],
  a2c2: [
    { who: 'BIG HOSS', text: "The ghost sent you? He's been tryin' to move me since '86.", shot: 'opp' },
    { who: '👻 MASTER SLEE', text: 'He is NOT a mountain. He is a very committed hill. Twenty-two meters. Bring muscle.', shot: 'spirit' },
  ],
  a2c3: [
    { who: '👻 MASTER SLEE', text: 'The first guardian. I carved him from a landslide. Possibly he carved himself. We do not discuss it.', shot: 'spirit' },
    { who: 'BOULDER BOB', text: 'I have watched this fair since before the fence. The fence asked my permission.', shot: 'opp' },
    { who: 'YOU', text: 'Do you... ever move?', shot: 'player' },
    { who: 'BOULDER BOB', text: 'Once. It was overrated.', shot: 'opp' },
  ],
  a3c1: [
    { who: '👻 MASTER SLEE', text: 'Scroll Three. Forget the meters. Forget the points. The Maestro will listen to your chain — every link must SING.', shot: 'spirit' },
    { who: 'MAESTRO FORTISSIMO', text: 'I can hear a flat SWIVEL from the parking lot. Ninety percent. In tune. Or do not bother.', shot: 'opp' },
    { who: 'BRUCE SLEE', text: "Below ninety, the family doesn't nod.", shot: 'wide' },
    { who: 'YOU', text: 'Does the family ever just... say hello?', shot: 'player' },
    { who: 'BRUCE SLEE', text: 'WATAAA is hello.', shot: 'wide' },
  ],
  a3c2: [
    { who: '👻 MASTER SLEE', text: 'Any palm can throw a feather over the county line. Throw HANK. The people\'s cheek. Pure form, no shortcuts.', shot: 'spirit' },
    { who: 'HAYSEED HANK', text: "Why's it always ME for the honest work?", shot: 'opp' },
  ],
  a3c3: [
    { who: '👻 MASTER SLEE', text: 'The final guardian. I taught him to dodge. I have regretted it for thirty years.', shot: 'spirit' },
    { who: 'DODGY DALE', text: 'Four hundred palms have come for this cheek. I keep their tears in a jar. Alphabetized.', shot: 'opp' },
    { who: 'YOU', text: 'Alphabetized by WHAT?', shot: 'player' },
    { who: 'DODGY DALE', text: 'Regret, sugar. Time the sway.', shot: 'opp' },
    { who: '👻 MASTER SLEE', text: 'Land this, student — and the Fourth Form is yours. I might even rest.', shot: 'spirit' },
  ],
  // ---------- SAVE THE FAIR ----------
  f1c1: [
    { who: 'JUDGE PENNYWHISTLE', text: "Word from the capital: Tremendous Don Enterprises wants this fairground for 'Parking Structure Seven.' There will be an assessment.", shot: 'judge' },
    { who: 'YOU', text: 'An assessment of WHAT?', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: "Of whether anyone CARES. Bertha is the county's favorite aunt. When SHE roars, the county roars. Three hundred fifty points of caring, champ.", shot: 'judge' },
    { who: 'BIG BERTHA', text: 'For the fair? Sugar, swing like you MEAN it.', shot: 'opp' },
  ],
  f1c2: [
    { who: 'THE INFLUENCER', text: 'Okay so if the fair TRENDS, the council literally cannot ignore it. I did the math. Well. I did a poll.', shot: 'opp' },
    { who: 'YOU', text: 'You want me to slap you... for the algorithm?', shot: 'player' },
    { who: 'THE INFLUENCER', text: "For the FAIR, bestie. Fifty-five meters minimum or it won't clip well.", shot: 'opp' },
  ],
  f1c3: [
    { who: 'THE JUDGE', text: 'This fairground appraises at... sentimental value. My briefcase does not HAVE a column for sentimental value.', shot: 'opp' },
    { who: 'YOU', text: 'Then add one.', shot: 'player' },
    { who: 'THE JUDGE', text: 'Very well. Court is in session. FIVE seconds a swing — my parking meter is running.', shot: 'opp' },
  ],
  f2c1: [
    { who: 'JUDGE PENNYWHISTLE', text: "Bad news, champ. Don's consultants paid Ravin' Ray to testify that the fair is 'basically a warehouse rave — rezone it.'", shot: 'judge' },
    { who: "RAVIN' RAY", text: 'They gave me glowsticks, man. INDUSTRIAL glowsticks.', shot: 'opp' },
    { who: 'YOU', text: 'You sold us out for glowsticks?', shot: 'player' },
    { who: "RAVIN' RAY", text: '...they glow SO good. Look — thirty meters and I recant everything.', shot: 'opp' },
  ],
  f2c2: [
    { who: 'JUDGE PENNYWHISTLE', text: "Legal defense funds don't grow on trees, champ. They grow on POINTS. And nobody draws a paying crowd like the big man.", shot: 'judge' },
    { who: 'BIG HOSS', text: 'Folks DO love watchin\' me not move.', shot: 'opp' },
    { who: 'JUDGE PENNYWHISTLE', text: 'Five hundred points. One slap. Make the county open its wallet.', shot: 'judge' },
  ],
  f2c3: [
    { who: 'JUDGE PENNYWHISTLE', text: "Don's 'conflict-resolution specialist.' Nine-year pig-grease champion. HR could not hold him. SOAP could not hold him.", shot: 'judge' },
    { who: 'GREASED PETE', text: "You can't fire what you can't grip. And you can't grip ME.", shot: 'opp' },
    { who: 'YOU', text: 'Everything in this county is negotiable except the grease?', shot: 'player' },
    { who: 'GREASED PETE', text: 'The grease is a LIFESTYLE. Perfect palm or nothing, sugar.', shot: 'opp' },
  ],
  f3c1: [
    { who: 'JUDGE PENNYWHISTLE', text: 'AH-HA! Buried in the county charter, clause 44-B: the fair stands if a citizen demonstrates "form beyond reproach" — graded by certified FACULTY.', shot: 'judge' },
    { who: 'SCHOOLMARM SUSIE', text: 'I grade in red ink and I have never given an A. Eighty-five percent, dear. Show your work.', shot: 'opp' },
    { who: 'YOU', text: 'What happens below eighty-five?', shot: 'player' },
    { who: 'SCHOOLMARM SUSIE', text: 'Detention. For the ENTIRE fair.', shot: 'opp' },
  ],
  f3c2: [
    { who: 'JUDGE PENNYWHISTLE', text: "The demolition foreman. He does not argue. He does not blink. He STANDS where buildings are meant to fall.", shot: 'judge' },
    { who: 'IRON-JAW McGRAW', text: 'Was that the wind?', shot: 'opp' },
    { who: 'YOU', text: "I haven't slapped you yet.", shot: 'player' },
    { who: 'IRON-JAW McGRAW', text: 'I was talking about your PLAN.', shot: 'opp' },
  ],
  f3c3: [
    { who: 'GRANNY THUNDER', text: 'Nine years I held that belt. Gave it up for bingo and grandbabies. Don pays me in casserole coupons.', shot: 'opp' },
    { who: 'YOU', text: "Ma'am, I don't want to slap a grandmother.", shot: 'player' },
    { who: 'GRANNY THUNDER', text: "Honey, nobody's managed it since 1987. Slip city. Population: you.", shot: 'opp' },
  ],
  f4c1: [
    { who: 'TREMENDOUS DON', text: 'This fair is a DISASTER. Low ceilings. No valet. My parking structure has a food court. People are CRYING about the food court.', shot: 'opp' },
    { who: 'YOU', text: 'The blueprints were signed three weeks before the assessment, Don.', shot: 'player' },
    { who: 'TREMENDOUS DON', text: 'Fake blueprints! Beautiful fake blueprints — the BEST fake blueprints. Four hundred points says you never touch me.', shot: 'opp' },
  ],
  f4c2: [
    { who: 'YOU', text: 'The blueprints were in your GAVEL CASE, your honor.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'Circumstantial! The hot dog that witnessed the signing has since been EATEN. No witness, no crime.', shot: 'opp' },
    { who: 'YOU', text: 'You ate him. Mid-testimony.', shot: 'player' },
    { who: 'JUDGE PENNYWHISTLE', text: 'I was UNDER OATH to be honest about my hunger. Very well — the whistle presides. Six seconds. Objection: EVERYTHING.', shot: 'opp' },
  ],
};

export const enabled = () =>
  CAMPAIGN_LIVE || new URLSearchParams(location.search).get('tour') === '1';

// ---- progress ----
let done = [];
try { done = JSON.parse(localStorage.getItem('slapp_tour') || '[]'); } catch { done = []; }
const save = () => localStorage.setItem('slapp_tour', JSON.stringify(done));
export const isDone = (id) => done.includes(id);
export const reset = () => { done = []; save(); };
export const progress = () => [...done];

// acts unlock in order WITHIN a tour; tours themselves are both open
const actUnlocked = (tour, i) =>
  i === 0 || tour.acts[i - 1].challenges.every((c) => isDone(c.id));

// ---- the active challenge ----
export let active = null;
export const setActive = (c) => { active = c; };
export const clearActive = () => { active = null; };
export const goalText = () =>
  active ? `🎪 ${active.title} — ${active.desc.toUpperCase()}` : null;

// score one attempt against the active challenge; persists + returns it on clear.
// Replays of cleared challenges are welcome — they just can't clear twice.
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

// ---- the tour menu card (self-contained DOM) ----
// Locked acts are SEALED (no spoilers); cleared challenges stay clickable so
// any chapter can be replayed.
const $ = (id) => document.getElementById(id);
export function open(onStart) {
  const wrap = $('tourActs');
  wrap.innerHTML = '';
  let total = 0;
  TOURS.forEach((tour) => {
    const head = document.createElement('div');
    head.className = 'tourHead';
    head.innerHTML = `<b>${tour.title}</b><br><span>${tour.blurb}</span>`;
    wrap.appendChild(head);
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
