// THE COUNTY FAIR TOUR — campaign mode. HIDDEN from the public until
// CAMPAIGN_LIVE flips true; reachable meanwhile only via ?tour=1 (dev/preview).
// Zero new mechanics: every challenge is a goal expressed in numbers the game
// already produces per attempt (dist, pts, part, chain%), so the whole mode is
// data + a menu. Progress lives in localStorage.slapp_tour (keep the prefix).

const CAMPAIGN_LIVE = false; // flip when the tour should appear for everyone

// goal types: dist (m), pts, head (clean cheek), chain (% of perfect).
// opp: volunteer key the challenge must be played against (null = your choice).
export const TOUR = [
  {
    act: 'ACT I — THE BARNYARD OPEN',
    challenges: [
      { id: 'a1c1', title: 'A PROPER HOWDY', desc: 'Land a clean slap on the cheek', opp: null, goal: { type: 'head' } },
      { id: 'a1c2', title: 'THROUGH THE BARRICADE', desc: 'Send anybody 20m', opp: null, goal: { type: 'dist', v: 20 } },
      { id: 'a1c3', title: "MABEL'S MORNIN' MAIL", desc: 'Post MULE-KICK MABEL 35m', opp: 'mabel', goal: { type: 'dist', v: 35 } },
    ],
  },
  {
    act: 'ACT II — THE HEAVYWEIGHT INVITATIONAL',
    challenges: [
      { id: 'a2c1', title: 'BIG GAME HUNTER', desc: 'Score 700 points with one slap', opp: null, goal: { type: 'pts', v: 700 } },
      { id: 'a2c2', title: 'BUDGE THE MOUNTAIN', desc: 'Move BIG HOSS 22m', opp: 'hoss', goal: { type: 'dist', v: 22 } },
      { id: 'a2c3', title: '☗ BOSS: THE IMMOVABLE OBJECT', desc: '500 points off BOULDER BOB', opp: 'boulder', goal: { type: 'pts', v: 500 } },
    ],
  },
  {
    act: 'ACT III — THE CHAMPIONSHIP',
    challenges: [
      { id: 'a3c1', title: 'FLAWLESS FORM', desc: 'Land a slap with a 90% chain', opp: null, goal: { type: 'chain', v: 90 } },
      { id: 'a3c2', title: 'COUNTY LINE EXPRESS', desc: 'Send anybody 80m', opp: null, goal: { type: 'dist', v: 80 } },
      { id: 'a3c3', title: '☗ BOSS: CATCH THE UNCATCHABLE', desc: 'Slap DODGY DALE 60m — time the sway', opp: 'dale', goal: { type: 'dist', v: 60 } },
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

// acts unlock in order: act N opens once every challenge of act N-1 is cleared
const actUnlocked = (i) => i === 0 || TOUR[i - 1].challenges.every((c) => isDone(c.id));

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
  TOUR.forEach((act, ai) => {
    const box = document.createElement('div');
    box.className = 'tourAct';
    const unlocked = actUnlocked(ai);
    box.innerHTML = `<h3>${act.act}${unlocked ? '' : ' 🔒'}</h3>`;
    act.challenges.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'tourCh' + (isDone(c.id) ? ' done' : '') + (unlocked ? '' : ' lockedRow');
      row.innerHTML = `<span class="tick">${isDone(c.id) ? '✅' : '⬜'}</span><span><b>${c.title}</b><br>${c.desc}</span>`;
      if (unlocked && !isDone(c.id)) row.onclick = () => onStart(c);
      box.appendChild(row);
    });
    wrap.appendChild(box);
  });
  const total = TOUR.reduce((n, a) => n + a.challenges.length, 0);
  $('tourProgress').textContent = `${done.length} / ${total} CLEARED${done.length === total ? ' — TOUR CHAMPION! 🏆' : ''}`;
  $('tour').classList.remove('hidden');
}
export function close() { $('tour').classList.add('hidden'); }
