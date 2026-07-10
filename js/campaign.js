// THE CAMPAIGNS — two storylines. HIDDEN from the public until CAMPAIGN_LIVE
// flips true; reachable meanwhile only via ?tour=1 (dev/preview).
// Every challenge names its volunteer, opens with a letterboxed scene (ENTER
// advances), and cleared challenges stay replayable. The Palm tour runs a real
// arc: prologue (the unfinished technique) → Mabel's unfinished lesson →
// the guardians → the Fourth Form → an outro where the master finally rests.
// Progress: localStorage.slapp_tour; scene seen-flags: localStorage.slapp_seen.

const CAMPAIGN_LIVE = false; // flip when the campaigns should appear for everyone

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
};

// failure beats — short, replayable, a little cruel. Keyed by tour prefix
// ('a' = Palm, 'f' = Fair); rotated so repeated failure stays fresh-ish.
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
