// THE CAMPAIGNS — two storylines. HIDDEN from the public until CAMPAIGN_LIVE
// flips true; reachable meanwhile only via ?tour=1 (dev/preview).
// Zero new mechanics live here: every challenge is a goal expressed in numbers
// the game already produces per attempt (dist, pts, part, chain%), so the whole
// mode is data + a menu. Progress lives in localStorage.slapp_tour (keep the
// prefix); challenge ids are unique across tours.

const CAMPAIGN_LIVE = false; // flip when the campaigns should appear for everyone

// goal types: dist (m), pts, head (clean cheek), chain (% of perfect).
// opp: volunteer key the challenge must be played against (null = your choice).
// Difficulty is tier-calibrated from the human-skill Monte Carlo sims (07-10):
// Act/Scroll I ≈ casual, II ≈ good, III ≈ expert.
export const TOURS = [
  {
    key: 'palm', title: '🖐 THE LEGEND OF THE OPEN PALM',
    blurb: 'An old master left four forms behind. Learn them all, and the palm needs no form.',
    acts: [
      {
        act: 'SCROLL I — THE PATIENT COIL',
        story: '“The spine is a spring,” wrote Master Slee, “and patience is its winding.” Prove your form is no accident.',
        challenges: [
          { id: 'a1c1', title: 'A PROPER HOWDY', desc: 'Land a clean slap on the cheek', opp: null, goal: { type: 'head' } },
          { id: 'a1c2', title: 'THROUGH THE BARRICADE', desc: 'Send anybody 20m', opp: null, goal: { type: 'dist', v: 20 } },
          { id: 'a1c3', title: "MABEL'S MORNIN' MAIL", desc: 'Post MULE-KICK MABEL 35m', opp: 'mabel', goal: { type: 'dist', v: 35 } },
        ],
      },
      {
        act: 'SCROLL II — THE HEAVY HAND',
        story: '“The mountain does not come to the palm. Weight answers only weight — choose your fighter like you choose your words.”',
        challenges: [
          { id: 'a2c1', title: 'BIG GAME HUNTER', desc: 'Score 600 points with one slap — the heavies pay best', opp: null, goal: { type: 'pts', v: 600 } },
          { id: 'a2c2', title: 'BUDGE THE MOUNTAIN', desc: 'Move BIG HOSS 22m — bring the muscle', opp: 'hoss', goal: { type: 'dist', v: 22 } },
          { id: 'a2c3', title: '☗ BOSS: THE IMMOVABLE OBJECT', desc: '500 points off BOULDER BOB', opp: 'boulder', goal: { type: 'pts', v: 500 } },
        ],
      },
      {
        act: 'SCROLL III — THE OPEN PALM',
        story: '“When the palm has no form, even the wind is slapped.” Two guardians bar the gate to mastery.',
        challenges: [
          { id: 'a3c1', title: 'FLAWLESS FORM', desc: 'Land a slap with a 90% chain', opp: null, goal: { type: 'chain', v: 90 } },
          { id: 'a3c2', title: 'COUNTY LINE EXPRESS', desc: 'Send HAYSEED HANK 75m — no featherweights, pure form', opp: 'hank', goal: { type: 'dist', v: 75 } },
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
        story: 'A judge arrived to assess whether the fair is “worth keeping.” Pack the stands and show him worth.',
        challenges: [
          { id: 'f1c1', title: 'PACK THE STANDS', desc: 'Score 350 points with one slap', opp: null, goal: { type: 'pts', v: 350 } },
          { id: 'f1c2', title: 'GO VIRAL', desc: 'Send THE INFLUENCER 55m — she films the whole flight', opp: 'influencer', goal: { type: 'dist', v: 55 } },
          { id: 'f1c3', title: '☗ BOSS: ORDER IN THE COURT', desc: 'Score 300 off THE JUDGE — you get FIVE seconds a swing', opp: 'judge', goal: { type: 'pts', v: 300 } },
        ],
      },
      {
        act: 'ACT II — THE CONSULTANTS',
        story: 'Don sent “efficiency consultants” to prove nobody would miss the fair. They have never met a county with a cause.',
        challenges: [
          { id: 'f2c1', title: 'AUDIT THE AUDITOR', desc: "Send RAVIN' RAY 30m — heavyweights hate paperwork", opp: 'ravinray', goal: { type: 'dist', v: 30 } },
          { id: 'f2c2', title: 'FUNDRAISER FRENZY', desc: 'Score 500 points with one slap', opp: null, goal: { type: 'pts', v: 500 } },
          { id: 'f2c3', title: '☗ BOSS: THE UNGRIPPABLE MAN', desc: 'Slap GREASED PETE 50m — only a PERFECT palm grips', opp: 'grease', goal: { type: 'dist', v: 50 } },
        ],
      },
      {
        act: 'ACT III — THE WRECKING CREW',
        story: 'The bulldozers idle at the gate. Don sent his closer — and his closer brought his grandmother.',
        challenges: [
          { id: 'f3c1', title: 'READ THE FINE PRINT', desc: 'Land a slap with an 85% chain', opp: null, goal: { type: 'chain', v: 85 } },
          { id: 'f3c2', title: 'JAWBREAKER', desc: 'Move IRON-JAW McGRAW 28m — under 70% chain he will not blink', opp: 'ironjaw', goal: { type: 'dist', v: 28 } },
          { id: 'f3c3', title: '☗ BOSS: GRANNY THUNDER', desc: 'Send the retired champion 35m — she slips, and weak form bores her', opp: 'granny', goal: { type: 'dist', v: 35 } },
        ],
      },
    ],
  },
];

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

// score one attempt against the active challenge; persists + returns it on clear
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
      box.innerHTML = `<h3>${act.act}${unlocked ? '' : ' 🔒'}</h3><div class="tourStory">${act.story}</div>`;
      act.challenges.forEach((c) => {
        const row = document.createElement('div');
        row.className = 'tourCh' + (isDone(c.id) ? ' done' : '') + (unlocked ? '' : ' lockedRow');
        row.innerHTML = `<span class="tick">${isDone(c.id) ? '✅' : '⬜'}</span><span><b>${c.title}</b><br>${c.desc}</span>`;
        if (unlocked && !isDone(c.id)) row.onclick = () => onStart(c);
        box.appendChild(row);
      });
      wrap.appendChild(box);
    });
  });
  $('tourProgress').textContent = `${done.length} / ${total} CLEARED${done.length === total ? ' — LEGEND OF THE COUNTY! 🏆' : ''}`;
  $('tour').classList.remove('hidden');
}
export function close() { $('tour').classList.add('hidden'); }
