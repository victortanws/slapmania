import * as THREE from 'three';
import { createStage } from './scene.js';
import { createWorld, addSolids } from './ragdoll.js';
import { Player, SLAPPERS } from './player.js';
import { Opponent, ROSTER, PICKABLE, WORLD_ROSTERS } from './opponent.js';
import { Sfx } from './audio.js';
import * as ui from './ui.js';
import * as net from './net.js';
import * as campaign from './campaign.js';
import * as dlg from './dialogue.js';

// every slapper has a mouth on them too — a quip at the faceoff (public; the
// judge takes this slot in campaign matches)
const QUIPS = {
  charlie: ['Tremendous hair. Tremendous palm.', "Local legends don't rest."],
  fran: ['Wound tight and READY.', 'The hay baler taught me everything I know.'],
  buck: ["Forty years of swattin'. One cheek.", 'Steady now. Steady.'],
  roy: ['Eight seconds is seven too many.', 'Yeehaw is a state of mind.'],
  victor: ['I built this fair. I can un-build HIM.', 'I drew up these fairgrounds. Hold still.'],
  mei: ['Your future: airborne.', 'The palm sees all. The palm approves.'],
  dynamite: ['I ate ALL my vegetables.', 'Five and three-quarters of pure FURY.'],
  bruceslee: ['WATAAA!', 'The palm has no form. The cheek has no chance.'],
  chucknorth: ['I counted to infinity this morning. Twice.', 'The beard approves this matchup.'],
  earl: ['Shirts are for quitters.', 'EARL. SMASH.'],
  reverend: ['REPENT — and be launched.', 'The collar stays ON for this.'],
  auntie: ['Aiyah. Hold my curlers.', 'You call THAT a cheek? Sit down.'],
};

const stage = createStage(document.getElementById('c'));
const { scene, camera, renderer } = stage;
const phys = createWorld();
addSolids(phys.world, phys.groundMat, stage.solids); // the barn is solid now
const sfx = new Sfx();

const keys = { s: false, l: false, a: false, p: false };
const KEYMAP = { KeyS: 's', KeyL: 'l', KeyA: 'a', KeyP: 'p' };

let player = new Player({ scene, world: phys.world, mat: phys.fleshMat });
let opponent = new Opponent({ scene, world: phys.world, mat: phys.fleshMat });

function setLook(look) {
  player.remove();
  player = new Player({ scene, world: phys.world, mat: phys.fleshMat, look });
  if (player.halo) player.halo.visible = activeWorld === 'heaven';  // keep the halo across slapper changes
}

let state = 'TITLE';
let tState = 0;
let timeScale = 1;
let hitstopT = 0; // freeze-frame countdown on a heavy contact (see onContact)
// FIRST-SLAP TRAINING WHEELS: a brand-new player's first two LANDED slaps get a
// friendly wind — floors under the hidden penalty levers (balance/flush/reach),
// so "followed the coach, imperfect execution" flies ~20m instead of dribbling
// 8m and reading as random. The floors lift the FLOOR only: a swing already
// above them gains nothing, chain grading is untouched (the lesson IS the
// timing), and mash still pays nothing — leaderboard-safe by construction.
// Veterans (any saved board/master honor) never see it.
let firstSlaps = +(localStorage.getItem('slapp_played') || 0);
if (localStorage.getItem('slapp_board') || localStorage.getItem('slapp_master')) firstSlaps = 99;
const trainingWheels = () => firstSlaps < 2 && !campaign.active;

// ---------- THE DAILY VOLUNTEER ----------
// One seeded matchup per UTC day — same volunteer, same world, for everyone on
// Earth. The shared context is the point: today's board is today's watercooler.
// Plays are NORMAL scores (they post to the weekly board too); the daily board
// is just a filtered view (rows since UTC midnight vs today's volunteer).
const DAY_KEY = new Date().toISOString().slice(0, 10);
function dailyPick() {
  let h = 2166136261 >>> 0;                       // FNV-1a over the date string
  for (const c of DAY_KEY) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const vols = PICKABLE.filter((v) => !v.dlc && !v.world);   // the free fair regulars
  const worlds = ['day', 'ice', 'lava', 'desert'];             // the FREE worlds only
  return { vol: vols[h % vols.length], world: worlds[(h >>> 8) % worlds.length] };
}
let dailyMode = false;
let shotClock = 30; // a full, unhurried match clock — time to read the opponent, wait out a weave, set your feet
let attempts = [];
let slap = null;        // outcome of the current attempt {foul, part}
let contact = null;     // impact info {point, power}
let settleT = 0;
let dustCool = 0;
let tarSplatted = false; // one tar splat per attempt, on first touchdown
let clapT = 0;
let swellT = 0;
let barricadeHit = false;
let gongRung = false; // dojo: the Great Gong rings once per attempt
let lavaBurned = false; // lava: the flame-broil reaction fires once per attempt
let popDone = false; // 10m: the crowd's first pop — a beginner's first taste of spectacle
let mooDone = false;
let duelDone = false;
let masterDone = false;
let emperorDone = false;
let countyDone = false;
let pendingCard = null;  // result card held back until the landing has been seen
let cardDelay = 0;
let excite = 0;
let chosenArch = null;
// the rival-gauntlet banner text (challenge links) — restored when tour goals
// borrow the same banner slot
let rivalBarText = null;
let lastClearedId = null; // set when a tour goal clears — an outro may follow
let failIdx = 0;          // rotates the failure-scene pool
const failSceneShown = new Set(); // challenge ids whose humiliating beat has already played — retries skip straight back in
let winIdx = 0;           // rotates the victory-beat pool
let prevHandSeg = null;   // last frame's palm segment — the contact test sweeps from it
let tookTakedown = false; // Slopberg caught a slap mid-REACH this match — the fail beat knows
let bulwarkPts = 0;       // Tick-Tock v2: cumulative points this MATCH — the IMMOVABILITY meter
let calledHigh = null;    // Dale's called cheek half this attempt (true=HIGH), null = no call
// ---------- GHOST REPLAYS: the swing IS the data ----------
// The engine is deterministic and a swing is just key timings, so a complete
// replay fits in ~40 URL characters. A challenge link can carry the rival's
// actual swing (ctape=), and the recipient WATCHES it re-executed live by the
// engine before their own attempts. No video, no server — the sim is the tape.
let tapeRec = [];                                        // this attempt's [ms, code, down] (SWING-relative)
const tapePrev = { s: false, l: false, a: false, p: false };
let ghostTape = null;      // parsed rival tape queued for the next swing
let ghostActive = false;   // the tape is swinging NOW — real S/L/A/P input muted
let ghostQueue = [];       // remaining tape events, consumed frame-exactly in tick
let ghostT = 0;            // ms of SWING elapsed for the tape pump
const KEYCODE = { s: 'KeyS', l: 'KeyL', a: 'KeyA', p: 'KeyP' };
// token stream: lowercase = keydown, UPPERCASE = keyup, DECIMAL ms after each.
// (Decimal on purpose: base36 digits include a/s/l/p, and the greedy time
// capture swallowed the next key token — half the tape vanished in parsing.)
const encodeTape = (tape) => tape.map(([t, k, d]) => (d ? k : k.toUpperCase()) + Math.max(0, Math.round(t))).join('');
function parseTape(str) {
  if (!str) return null;
  const out = []; const re = /([slapSLAP])([0-9]+)/g; let m;
  while ((m = re.exec(str))) out.push([Math.min(60000, parseInt(m[2], 10)), KEYCODE[m[1].toLowerCase()], m[1] === m[1].toLowerCase()]);
  out.sort((a, b) => a[0] - b[0]);
  return out.length && out.length <= 48 ? out : null;
}
function cancelGhost() {
  if (ghostActive) for (const k in tapePrev) keys[k] = false; // the tape lets go of the keys
  ghostActive = false;
  ghostQueue = []; ghostT = 0;
}
// Playback is FRAME-EXACT, not timer-based: the tape is pumped inside the SWING
// tick (same clock the recorder used), so a replay reproduces the swing the way
// drive() does — immune to setTimeout jitter, which cost whole grade tiers.
function beginGhost(tape) {
  ghostActive = true;
  ghostQueue = tape.map((e) => [...e]);
  ghostT = 0;
  ui.slapBurst("📼 THE CHALLENGER'S TAPE", 'WATCH THE SWING YOU HAVE TO BEAT — THEN IT\'S YOURS');
}
function restoreBar() { ui.challengeBar(rivalBarText); }
let pickIndex = 0;
let pickHighlight = null;
let pickConfirmFn = null;
let submitted = false;

// ---------- the kinetic chain: grade each link the moment it fires ----------
let chain = null;
let swingT = 0;
let surgeFired = false; // CHUCK NORTH Second Wind: has the surge telegraph fired this attempt
const prevKeys = { s: false, l: false, a: false, p: false };

function resetChain() {
  chain = { coil: 0, tRel: null, l: null, a: null, p: null };
  swingT = 0;
  ui.chainReset();
}

// per-link instant feedback: the grade pops over the slapper + a tiered ping —
// the input is judged the moment it lands, not at the result card. Off-perfect
// L shows the signed ms (skill is learnable when the miss has a number).
function popGrade(g, dtSec) {
  if (!g) return;
  let label = g.label;
  if (dtSec != null && g.tier < 3) {
    const ms = Math.round(dtSec * 1000);
    label += ` ${ms > 0 ? '+' : ''}${ms}ms`;
  }
  ui.gradePop(label + (g.tier === 3 ? '!' : ''), g.tier);
  sfx.grade(g.tier);
}

// hips: L is the trigger that FIRES the whip — the coil waits (and slowly
// leaks) until you tap it. The grade is crispness: how fast after the release.
function gradeL(dt) {
  if (dt === null) return { g: 0.55, label: 'NONE', tier: 1 };
  if (dt < -0.10) return { g: 0.7, label: 'EARLY', tier: 1 };
  if (dt <= 0.35) return { g: 1.2, label: 'PERFECT', tier: 3 };
  if (dt <= 0.8) return { g: 0.95, label: 'GOOD', tier: 2 };
  return { g: 0.7, label: 'LATE', tier: 1 };
}

// the hips land: visible lunge, dust at the boots, audible thump, real kick.
// The coil % locks in NOW — whatever leaked while you dawdled is gone.
function setHips(g) {
  chain.l = g;
  chain.tFire = swingT; // the whip starts NOW — follow-through clock runs from here
  excite = Math.max(excite, 0.4); // the crowd leans in when the whip fires
  chain.coil = Math.min(1, player.coilFrac);
  const pct = Math.round(chain.coil * 100);
  ui.chainSet('coil', `${pct}%`, pct >= 75 ? 3 : pct >= 45 ? 2 : 1);
  ui.chainSet('hips', g.label, g.tier);
  player.startLunge(g.tier === 3 ? 0.3 : g.tier === 2 ? 0.2 : 0.1);
  stage.spawnDust(new THREE.Vector3(0.25, 0.12, 0.1), 0.7);
  sfx.burst({ dur: 0.12, gain: 0.45, filter: 'lowpass', freq: 320 });
  stage.shake(0.05);
}
// arm: release it while the torso is whipping forward at speed (peak ≈ 8 rad/s)
function gradeA(fwdVel) {
  if (fwdVel >= 6) return { g: 1.2, label: 'PERFECT', tier: 3 };
  if (fwdVel >= 3.5) return { g: 1.0, label: 'GOOD', tier: 2 };
  if (fwdVel >= 1.5) return { g: 0.75, label: 'WEAK', tier: 1 };
  return { g: 0.55, label: 'NO WHIP', tier: 1 };
}
// snap: fire P by swing PHASE — the hand passes the cheek near spine ≈ 0.4,
// whatever the swing speed, so the green ring never lies
function gradeP(spineA, spineV) {
  // torso not whipping forward: either the whip is spent (late) or never fired (early)
  if (spineV > -1) return { g: 0.6, label: spineA > 0.8 ? 'EARLY' : 'LATE', tier: 1 };
  if (spineA > 1.3) return { g: 0.7, label: 'EARLY', tier: 1 };
  if (spineA > 0.9) return { g: 1.0, label: 'GOOD', tier: 2 };
  if (spineA > -0.1) return { g: 1.25, label: 'PERFECT', tier: 3 };
  if (spineA > -0.45) return { g: 1.0, label: 'GOOD', tier: 2 };
  return { g: 0.75, label: 'LATE', tier: 1 };
}

// persistent top-5 leaderboard: [{pts, dist, opp, when}]
// The board is a single localStorage key, so any second context (another tab,
// an earlier session left open) that saves with a STALE in-memory copy would
// blind-overwrite and erase newer scores. Every save therefore re-reads storage
// and MERGES (read-modify-write), and a `storage` listener keeps open tabs synced.
function readBoard() {
  try { return JSON.parse(localStorage.getItem('slapp_board') || '[]'); } catch { return []; }
}
function mergeBoards(...lists) {
  const seen = new Set(), out = [];
  for (const e of [].concat(...lists)) {
    const k = `${e.pts}|${e.dist}|${e.opp}|${e.when}`;
    if (!seen.has(k)) { seen.add(k); out.push(e); }
  }
  return out.sort((a, b) => b.pts - a.pts).slice(0, 5);
}
let board = readBoard();
const bestPts = () => (board[0] ? board[0].pts : 0);

function refreshBest() {
  ui.setBest(board[0]);
  stage.setScoreboard([
    `BEST: ${board[0] ? board[0].pts + ' PTS' : '—'}`,
    board[0] ? `${board[0].dist.toFixed(1)}m vs ${board[0].opp}` : 'SLAP SOMEBODY',
  ]);
}
refreshBest();
// another tab saved a score — fold it in so our BEST + top-5 stay current.
addEventListener('storage', (e) => {
  if (e.key === 'slapp_board') { board = mergeBoards(board, readBoard()); refreshBest(); }
});
// reclaim: pull scores you posted worldwide (under your saved name) back into the
// county board — recovers entries a stale tab may have clobbered before A's fix.
// Dedupe on pts+dist+opp (worldwide has no local `when`), never removes anything.
if (net.configured()) {
  const myName = localStorage.getItem('slapp_name') || '';
  if (myName.trim()) {
    net.fetchByName(myName).then((rows) => {
      const have = new Set(board.map((e) => `${e.pts}|${(+e.dist).toFixed(1)}|${e.opp}`));
      const adds = (rows || [])
        .filter((r) => !have.has(`${r.pts}|${(+r.dist).toFixed(1)}|${r.opp}`))
        .map((r) => ({ pts: r.pts, dist: +r.dist, opp: r.opp, when: Date.parse(r.created_at) || Date.now() }));
      if (adds.length) {
        board = mergeBoards(board, adds);
        localStorage.setItem('slapp_board', JSON.stringify(board));
        refreshBest();
      }
    }).catch(() => {});
  }
}
ui.setAttempts(attempts, 0);
ui.initName();
ui.setMaster(localStorage.getItem('slapp_emperor') ? 2 : localStorage.getItem('slapp_master') ? 1 : 0);

function setState(s) { state = s; tState = 0; syncTouchPad(); syncBackBtn(); }

// ---------- touch controls: thumbs are welcome at this fair ----------
// Left thumb coils and drives (S/L), right thumb whips and snaps (A/P).
// Buttons speak fluent keyboard, so every rule stays in one place.
const touchPad = document.getElementById('touchPad');
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0
  || new URLSearchParams(location.search).get('touch') === '1';   // ?touch=1 forces the touch UI for testing on desktop
if (isTouch) document.body.classList.add('touch');
const PLAY_STATES = new Set(['FACEOFF', 'SWING', 'IMPACT', 'FLIGHT', 'FOULED']);
function syncTouchPad() {
  touchPad.classList.toggle('inplay', isTouch && PLAY_STATES.has(state));
  // mid-air the buttons do nothing — fade them so the flight owns the screen
  touchPad.classList.toggle('dim', state === 'IMPACT' || state === 'FLIGHT');
}
// the mobile ESC: a touch-only back button (no keyboard to bail out with). Shown
// in every non-title state except during a cutscene (the dialog has its own SKIP).
const backBtn = document.getElementById('backBtn');
function syncBackBtn() {
  const show = isTouch && state !== 'TITLE' && !document.body.classList.contains('cine');
  backBtn.style.display = show ? 'block' : 'none';
  document.body.classList.toggle('backon', show);
}
// context-aware "back", shared by ESC and the mobile button: skip a cutscene,
// close the DLC gallery, step a campaign verdict back to the tour menu, else porch.
function goBack() {
  sfx.ensure();
  if (dlg.isActive()) { dlg.stop(); return; }
  if (!document.getElementById('dlcGallery').classList.contains('hidden')) { closeDlcGallery(); return; }
  if (state === 'MATCH_END' && campaign.active) { campaign.clearActive(); openTourMenu(); return; }
  if (state !== 'TITLE') goToTitle();
}
backBtn.addEventListener('click', goBack);
for (const btn of touchPad.querySelectorAll('.tbtn')) {
  const code = btn.dataset.code;
  const down = (e) => { e.preventDefault(); btn.classList.add('held'); dispatchEvent(new KeyboardEvent('keydown', { code })); };
  const up = (e) => { e.preventDefault(); btn.classList.remove('held'); dispatchEvent(new KeyboardEvent('keyup', { code })); };
  btn.addEventListener('touchstart', down, { passive: false });
  btn.addEventListener('touchend', up);
  btn.addEventListener('touchcancel', up);
  btn.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') down(e); });
  btn.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') up(e); });
}

// ---------- pick screens ----------
const SLAPPER_TITLES = ['THE NATURAL', 'THE TECHNICIAN', 'THE VETERAN', 'THE OUTLAW', 'JUST VICTOR', 'THE ORACLE'];

// ---------- DLC unlocks (Phase 1: local. Stripe checkout + server codes = Phase 2) ----------
// MASTER KILL SWITCH: DLC isn't on sale yet. While false, every locked character
// stays locked on every device — even ones that visited an old ?unlockall=1 / SLAPDEV
// test link and already have entries in localStorage.slapp_unlocks. Flip to true
// only once Stripe checkout (Phase 2) is actually wired and ready to take payment.
// LIVE since 2026-07-10: the shop is open. The dev backdoors (SLAPDEV code,
// ?unlockall) were REMOVED when these flipped — purchases are the only path.
const DLC_LIVE = true;
const SHOP_LIVE = true;
const shopEnabled = () => SHOP_LIVE || new URLSearchParams(location.search).get('shoptest') === '1';
let unlocks = [];
try { unlocks = JSON.parse(localStorage.getItem('slapp_unlocks') || '[]'); } catch { unlocks = []; }
// a VERIFIED purchase (slapp_pack, set only by verify-checkout) legitimately
// bypasses the kill switch — DLC_LIVE guards the dev backdoors, not real buyers
const owned = (key) => (DLC_LIVE && unlocks.includes(key)) || localStorage.getItem('slapp_pack') === '1';
function unlock(key) {
  if (!unlocks.includes(key)) {
    unlocks.push(key);
    localStorage.setItem('slapp_unlocks', JSON.stringify(unlocks));
    try { window.posthog?.capture('slapper_unlocked', { slapper: key }); } catch {}
  }
}

// unlock modal — BUY is a placeholder until Stripe is wired; a temporary dev code
// (SLAPDEV) unlocks locally so the whole flow is testable now.
const um = {
  modal: document.getElementById('unlockModal'), name: document.getElementById('unlockName'),
  desc: document.getElementById('unlockDesc'), price: document.getElementById('unlockPriceVal'),
  buy: document.getElementById('unlockBuy'), code: document.getElementById('unlockCode'),
  redeem: document.getElementById('unlockRedeemBtn'), close: document.getElementById('unlockClose'),
  msg: document.getElementById('unlockMsg'),
};
let unlockTarget = null;
function openUnlockModal(char) {
  unlockTarget = char;
  um.name.textContent = char.name;
  um.desc.textContent = char.desc;
  um.price.textContent = '6.99'; // one supporter pack — every slapper, world & campaign
  um.msg.textContent = ''; um.code.value = '';
  um.modal.classList.remove('hidden');
}
function closeUnlockModal() { um.modal.classList.add('hidden'); unlockTarget = null; }
// the ONE checkout path — shared by the modal's SUPPORT button AND the gallery's
// UNLOCK EVERYTHING button, so that button links STRAIGHT to Stripe (no detour).
async function startCheckout(setMsg) {
  if (!shopEnabled()) { setMsg('Checkout opens soon — hang tight! 🛒'); return; }
  setMsg('Opening checkout…');
  try {
    const r = await fetch(`${window.SLAPP_CONFIG.supabaseUrl}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${window.SLAPP_CONFIG.supabaseAnonKey}`, apikey: window.SLAPP_CONFIG.supabaseAnonKey },
    });
    const d = await r.json();
    if (d && d.url) { location.href = d.url; return; }  // off to Stripe's hosted page
    setMsg('Checkout stumbled — try again in a spell.');
  } catch { setMsg('Checkout stumbled — try again in a spell.'); }
}
// grant the Supporter Pack (from a verified purchase OR a redeemed code) and
// remember the code so the buyer can re-unlock on any device without friction
function unlockPack(code, how) {
  localStorage.setItem('slapp_pack', '1');
  if (code) localStorage.setItem('slapp_code', code);
  closeUnlockModal();
  try { refreshDlcBtn(); } catch {} // you're a supporter now — drop the "Supporter Pack" ad button
  ui.challengeBar('🏆 SUPPORTER PACK UNLOCKED — EVERY SLAPPER, WORLD & CAMPAIGN IS YOURS. THANK YOU!');
  sfx.fanfare();
  track(how === 'redeem' ? 'pack_redeemed' : 'pack_purchased', {});
  if (state === 'SELECT_SLAPPER') openSlapperPick();
}
if (um.modal) {
  um.close.onclick = closeUnlockModal;
  // clicking the dark backdrop closes too — on landscape phones the ✕ can sit
  // above the fold, and a modal you can't leave is a trap
  um.modal.onclick = (e) => { if (e.target === um.modal) closeUnlockModal(); };
  addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !um.modal.classList.contains('hidden')) { e.stopImmediatePropagation(); closeUnlockModal(); }
  }, true); // capture: beat the global Escape→title handler while the modal is up
  um.buy.onclick = () => startCheckout((m) => { um.msg.textContent = m; });
  // ONE box, two jobs: type a CODE to redeem, or type your PURCHASE EMAIL to
  // recover a lost code. Both are server-validated (redeem-code / recover-code);
  // there is no client-side unlock — the anon key can't read the codes table.
  const fn = (path) => `${window.SLAPP_CONFIG.supabaseUrl}/functions/v1/${path}`;
  const auth = { Authorization: `Bearer ${window.SLAPP_CONFIG.supabaseAnonKey}`, apikey: window.SLAPP_CONFIG.supabaseAnonKey };
  um.redeem.onclick = async () => {
    const raw = (um.code.value || '').trim();
    if (!raw) { um.msg.textContent = 'Enter your code — or your purchase email to recover it.'; return; }
    if (raw.includes('@')) {
      // "I lost my code" — look it up by the email they paid with
      um.msg.textContent = 'Looking up your code…';
      try {
        const r = await fetch(fn(`recover-code?email=${encodeURIComponent(raw)}`), { headers: auth });
        const d = await r.json();
        if (d && d.ok && d.codes && d.codes.length) { um.code.value = d.codes[0]; um.msg.textContent = `Found it: ${d.codes[0]} — hit REDEEM again to unlock.`; }
        else um.msg.textContent = 'No purchase found for that email. Check the address you paid with?';
      } catch { um.msg.textContent = 'Recovery hiccuped — try again in a spell.'; }
      return;
    }
    um.msg.textContent = 'Checking your code…';
    try {
      const r = await fetch(fn('redeem-code'), { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ code: raw }) });
      const d = await r.json();
      if (d && d.ok) unlockPack(raw.toUpperCase(), 'redeem');
      else um.msg.textContent = "That code didn't take. Double-check it, or paste your purchase email to recover it.";
    } catch { um.msg.textContent = 'Redeem hiccuped — try again in a spell.'; }
  };
}

function openSlapperPick(previewChar = null) {
  setState('SELECT_SLAPPER');
  ui.showTitle(false);
  ui.hideCards();
  ui.bubble(null);
  // show ALL slappers; locked+unowned ones display a 🔒 badge and gate on confirm.
  const pickable = [...SLAPPERS];
  if (previewChar && !pickable.includes(previewChar)) pickable.push(previewChar);
  pickHighlight = (i) => { pickIndex = i; ui.setPickSel(i); setLook(pickable[i]); };
  pickConfirmFn = () => {
    const c = pickable[pickIndex];
    if (c && c.locked && !owned(c.key)) { openUnlockModal(c); return; }  // gate DLC
    openOppPick();
  };
  ui.showPick({
    title: "WHO'S DOIN' THE SLAPPIN'?",
    blurb: 'They do NOT slap alike, sugar — short folks golf \'em skyward, big arms reach, muscle moves the heavy ones.',
    confirmLabel: "THAT'S MY CHAMPION →",
    items: pickable.map((s) => ({
      // desc rotates through the character's variant pool each time the dock
      // opens — the roster stays alive on repeat visits
      name: s.name, desc: s.descs ? s.descs[Math.floor(Math.random() * s.descs.length)] : s.desc,
      sub: SLAPPER_TITLES[SLAPPERS.indexOf(s)] || (s.locked ? 'DLC FIGHTER' : ''),
      locked: !!(s.locked && !owned(s.key)), price: s.price,
    })),
    onHover: (i) => pickHighlight(i),
    onConfirm: () => pickConfirmFn(),
  });
  pickHighlight(Math.max(0, pickable.indexOf(previewChar || player.look)));
}

// PostHog product events — null-safe: if the SDK is blocked or absent this
// no-ops and the game is untouched. Feeds the pick→play→EMPEROR→share funnel.
const track = (event, props) => { try { window.posthog?.capture(event, props); } catch {} };

// volunteers on offer in the CURRENT world: the fair regulars everywhere, plus
// each world's own locals (a world-stamped volunteer only shows at home —
// Halo Hal waits in heaven, Low-Level Larry clocks in downstairs)
let OPP_LIST = PICKABLE;
function oppListNow() {
  const w = localStorage.getItem('slapp_world') || 'day';
  const wr = WORLD_ROSTERS[w];
  // dlc volunteers (the Wonders movement specimens) join the public pick only
  // with the pack; campaigns still summon them by key, like bosses. Each world
  // then fields its own CURATED roster (allow/exclude in opponent.js).
  return ROSTER.filter((r) => !r.boss
    && (!r.world || r.world === w)
    && (!r.dlc || owned('bruceslee'))
    && (!wr || (wr.allow ? wr.allow.includes(r.key) : !wr.exclude.includes(r.key))));
}
function openOppPick() {
  setState('SELECT_OPP');
  track('slapper_selected', { slapper: player.look?.name });
  // step well back to size up the volunteer — nobody's hugging anybody
  player.root.position.x = -2.6;
  player.root.rotation.y = 0;   // clear any ?preview facing before play
  ui.hideCards();
  OPP_LIST = oppListNow();
  // a challenge link may name a world LOCAL (e.g. ?copp=hal) — keep the named
  // matchup answerable even outside their home world (they're world-themed
  // flavor, not pay-gated fighters)
  if (chosenArch && chosenArch.world && !chosenArch.boss && !OPP_LIST.includes(chosenArch)) OPP_LIST = [...OPP_LIST, chosenArch];
  // the highlighted volunteer stands in the ring beckoning — slap-me showcase.
  // Bosses never appear here, the tour summons them by key.
  pickHighlight = (i) => {
    pickIndex = i;
    ui.setPickSel(i);
    opponent.remove();
    opponent = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch: OPP_LIST[i], showcase: true });
    ui.bubble(OPP_LIST[i].pickLine);
  };
  pickConfirmFn = () => { chosenArch = OPP_LIST[pickIndex]; ui.bubble(null); startMatch(); };
  ui.showPick({
    title: "NOW — WHO'S CATCHIN' IT TODAY?",
    blurb: 'Heavy folks barely budge, but oh, the points pay mighty fine. Three swings at whoever you pick.',
    confirmLabel: 'SLAP THIS VOLUNTEER!',
    items: OPP_LIST.map((a) => ({ name: a.name, sub: `${a.tag} — SCORE ×${a.mass}`, desc: a.pickLine })),
    onHover: (i) => pickHighlight(i),
    onConfirm: () => pickConfirmFn(),
  });
  pickHighlight(Math.max(0, OPP_LIST.indexOf(chosenArch)));
}

function startMatch() {
  tookTakedown = false;
  bulwarkPts = 0;
  absorbIdx = 0;   // fresh branching-dialogue sequence per match
  ui.bulwark(null);
  attempts = [];
  submitted = false;
  if (!chosenArch) chosenArch = ROSTER[1];
  track('match_started', { opponent: chosenArch.name });
  startAttempt();
}

// Escape from anywhere: back to the front porch
function goToTitle() {
  cancelGhost(); ghostTape = null;
  dailyMode = false;
  if (chosenArch && chosenArch.boss) chosenArch = null;   // bosses don't loiter on the porch
  stage.resetTarStains(); // no tar claims on the title screen
  // a tour may have pinned its own world (the dojo) — restore the player's pick
  const homeWorld = localStorage.getItem('slapp_world') || 'day';
  if (stage.hasWorld(homeWorld)) setWorldFull(homeWorld);
  player.reset();
  opponent.remove();
  opponent = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch: chosenArch || ROSTER[1] });
  attempts = [];
  slap = null;
  pendingCard = null;
  timeScale = 1;
  hitstopT = 0;
  sfx.whoosh(0);
  ui.hideCards();
  ui.bubble(null);
  ui.intro(null);
  ui.showMeters(false);
  ui.setClock(null);
  ui.showDistance(null);
  ui.coach(null);
  ui.setAttempts(attempts, 0);
  ui.refBar(null);
  ui.bulwark(null);
  dlg.stop();
  campaign.close();
  campaign.clearActive();
  restoreBar();
  ui.showTitle(true);
  setState('TITLE');
}

// cinema mode: letterbox in, HUD out, and the campaign cast steps on stage —
// Master Slee's ghost materializes for his lines, the Judge stands ringside
function playScene(lines, after, opts = {}) {
  const cast = lines.map((l) => l.who).join(' ');
  document.body.classList.add('cine');
  syncBackBtn();   // the cutscene has its own SKIP — hide the porch button
  if (opts.sad) {
    // the walk of shame: shoulders forward, head hung — held while frozen
    player.j.spine.a = -0.4; player.j.spine.v = 0;
    player.j.shoulder.a = 0.3; player.j.shoulder.v = 0;
    player.pose();
  }
  if (cast.includes('MASTER SLEE')) stage.setSpirit(true);
  if (cast.includes('BRUCE SLEE')) stage.setBruce(true);   // the partner stands in frame
  if (cast.includes('PENNYWHISTLE') || campaign.active) stage.setJudge(true);
  dlg.play(lines, () => {
    document.body.classList.remove('cine');
    syncBackBtn();
    stage.setSpirit(false);
    stage.setBruce(false);
    stage.setJudge(false);
    if (stage.setCatCine) { stage.setCatCine(false); stage.setCatReact(false); }
    if (after) after();
  });
}

// ---------- the county fair tour (campaign — hidden until CAMPAIGN_LIVE) ----------
// Judge Pennywhistle officiates every campaign match: a one-liner at the faceoff,
// then his whistle starts the shot clock. (In the Save the Fair epilogue, the
// gavel case gives him up — and His Honor becomes slappable.)
const REF_LINES = [
  'Rule one: the cheek must remain attached to the volunteer.',
  'I once disqualified a man for slapping with LOVE. Never again.',
  'No slapping before the whistle. The whistle is very sensitive about this.',
  'As county judge, notary, and hot-dog inspector, I declare this LEGAL.',
  "I'll be watching that elbow. I am ALWAYS watching the elbow.",
  'The record will show the volunteer smiled first.',
  'Keep it clean, keep it loud, and keep it away from my lemonade.',
  'A foul today is a story tomorrow. Still a foul, though.',
  'My gavel is in the shop. The whistle will preside.',
  'Proceed! Justice is best served open-palmed.',
];
let refLineIdx = 0;
// ?tourdev=1 — the owner's campaign-testing lens: every tour/act open in the
// menu and every cutscene replays (nothing marked seen), so the whole story is
// viewable end to end without clearing progress or owning the pack.
const TOURDEV = new URLSearchParams(location.search).get('tourdev') === '1';
// one-time migration: these scenes were rewritten (narrative overhaul) — clear
// their seen-marks so existing players get the new versions
if (!localStorage.getItem('slapp_mig1')) {
  try {
    const RESEEN = ['w2c3','w3c3','outro_w3c3','o1c1','o1c2','o1c3','o2c1','o2c2','o2c3','o2c4','o3c1','o3c2','o3c3','outro_o3c3','olympicbid_prologue','f1c1','f1c2','f1c3','f2c1','f2c2','f3c1','f4c1','f4c2','outro_f4c2','v3c1','a3c3'];
    const seen = JSON.parse(localStorage.getItem('slapp_seen') || '[]').filter((id) => !RESEEN.includes(id));
    localStorage.setItem('slapp_seen', JSON.stringify(seen));
  } catch {}
  localStorage.setItem('slapp_mig1', '1');
}
// mig2: t3c1 was rewritten (the giant-cat "is slapping the cat therapy?" gag) —
// clear its seen-mark so existing therapy players get the new scene.
if (!localStorage.getItem('slapp_mig2')) {
  try {
    const seen = JSON.parse(localStorage.getItem('slapp_seen') || '[]').filter((id) => id !== 't3c1');
    localStorage.setItem('slapp_seen', JSON.stringify(seen));
  } catch {}
  localStorage.setItem('slapp_mig2', '1');
}
const seenScene = (id) => !TOURDEV && JSON.parse(localStorage.getItem('slapp_seen') || '[]').includes(id);
const markScene = (id) => {
  if (TOURDEV) return; // the testing lens never consumes first-views
  const s = JSON.parse(localStorage.getItem('slapp_seen') || '[]');
  if (!s.includes(id)) { s.push(id); localStorage.setItem('slapp_seen', JSON.stringify(s)); }
};

// ---- campaign portraits: each tour card stars its lead in a ¾ close-up ----
// rendered live from the real character meshes, once per session, cached.
const TOUR_STARS = {
  wonders: { slapper: 'charlie' },
  fair: { opp: 'don' },
  palm: { slapper: 'bruceslee' },
  secondwind: { slapper: 'chucknorth' }, // the DLC Chuck — the boss build read as "some random character" in the card
  nightofslaps: { opp: 'reaper' },      // future tours resolve as their cast ships
  slaptherapy: { slapper: 'carlgustav' },
  slopvalley: { opp: 'slopunit' },
  olympicbid: { slapper: 'victor' },
  commedia: { slapper: 'dante' },
  horseshoe: { opp: 'bothways' },   // the gentleman from both ends — the hollow in one face
  blackgold: { opp: 'yusuf' },      // the whispering date sheikh — Don already fronts SAVE THE FAIR, one Don card is plenty
};
const tourPortraits = {};
function capturePortraits() {
  if (tourPortraits._done) return;
  tourPortraits._done = true;
  const pcam = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 180;
  const c2d = cvs.getContext('2d');
  const gl = stage.renderer.domElement;
  // the camera MUST match the real canvas aspect: rendering an aspect-1 view
  // onto a wide canvas squeezes the image, and the square crop then ships a
  // flattened face (invisible on a near-square dev window, ugly fullscreen)
  pcam.aspect = gl.width / gl.height;
  pcam.updateProjectionMatrix();
  player.root.visible = false;           // nobody photobombs the head shot
  opponent.remove();
  for (const [tourKey, star] of Object.entries(TOUR_STARS)) {
    let temp = null, head = null;
    try {
      if (star.slapper) {
        const look = SLAPPERS.find((x) => x.key === star.slapper);
        if (!look) continue;
        temp = new Player({ scene, world: phys.world, mat: phys.fleshMat, look });
        temp.root.updateMatrixWorld(true);
        // the REAL head, not an estimate — the ready stance crouches, and a
        // guessed 1.52·h aimed the lens square at the shirt (maroon-blob cards)
        head = new THREE.Vector3();
        temp.headMesh.getWorldPosition(head);
      } else {
        const arch = ROSTER.find((x) => x.key === star.opp);
        if (!arch) continue;
        temp = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch, showcase: true });
        head = temp.headPos();
      }
      // ¾ close-up from front-left, eye level, a touch of headroom. Far enough
      // back that hoods, toppers and frizz can't swallow the lens (hooded and
      // hatted casts used to render as a full-frame blob of their own costume)
      const facing = star.slapper ? 1 : -1;  // slappers face +x, volunteers −x
      pcam.position.set(head.x + facing * 1.05, head.y + 0.12, head.z + 0.6);
      pcam.lookAt(head.x, head.y - 0.06, head.z);
      stage.renderer.render(stage.scene, pcam);
      const side = Math.min(gl.width, gl.height);
      c2d.drawImage(gl, (gl.width - side) / 2, (gl.height - side) / 2, side, side, 0, 0, 180, 180);
      tourPortraits[tourKey] = cvs.toDataURL('image/jpeg', 0.82);
    } catch (e) { console.warn('portrait failed:', tourKey, e); }
    if (temp) temp.remove();
  }
  player.root.visible = true;
  opponent = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch: chosenArch || ROSTER[1] });
}

// launch (or RE-launch — the retry button lands here too) one tour challenge
function startTourChallenge(ch) {
  campaign.setActive(ch);
  campaign.close();
  ui.challengeBar(campaign.goalText());
  track('tour_challenge_started', { id: ch.id, title: ch.title });
  const arch = ch.opp ? ROSTER.find((r) => r.key === ch.opp) : null;
  const launch = () => {
    if (arch) { chosenArch = arch; startMatch(); }  // the challenge names its victim
    else openOppPick();                             // "anybody" — player's choice
  };
  // story beats, once each (slapp_seen). Entering the Palm campaign for the
  // FIRST time prepends the prologue (Bruce and the master, and the technique
  // he died one percent short of). Named opponents launch first so their
  // close-ups have a subject; the scene plays over the frozen faceoff.
  // pin the tour's star slapper (Charlie/Bruce/…) so the 'YOU' voice + avatar
  // match the story; grants free campaign-use of a locked DLC slapper.
  if (ch.slapper) { const s = SLAPPERS.find((x) => x.key === ch.slapper); if (s) setLook(s); }
  // a tour can pin its WORLD (Bruce fights in the dojo) — guarded until it ships
  if (ch.world && stage.hasWorld(ch.world)) setWorldFull(ch.world);
  let lines = [];
  const proKey = (ch.tourKey || '') + '_prologue';
  if (campaign.CUTSCENES[proKey] && !seenScene(proKey)) {
    markScene(proKey);
    lines.push(...campaign.CUTSCENES[proKey]);
  }
  const cine = campaign.CUTSCENES[ch.id];
  if (cine && !seenScene(ch.id)) {
    markScene(ch.id);
    lines.push(...cine);
  }
  if (lines.length) {
    lines = lines.map((l) => (l.who === 'YOU' ? { ...l, who: player.look.name } : l));
    if (arch) { launch(); playScene(lines); }
    else playScene(lines, launch);
  } else launch();
}

function openTourMenu() {
  setState('TOUR');
  ui.showTitle(false);
  ui.hideCards();
  ui.bubble(null);
  restoreBar();
  capturePortraits();
  campaign.open(startTourChallenge, {
    portraits: tourPortraits,
    ownsDlc: owned('bruceslee'),
    devAll: TOURDEV,
    onLocked: (tour) => openUnlockModal({
      name: tour.title.replace(/^\S+\s/, ''),
      desc: `${tour.acts.length} acts of "${tour.blurb}" — this storyline, every campaign and every world ride with the Supporter Pack.`,
    }),
  });
  track('tour_opened', { cleared: campaign.progress().length });
}
document.getElementById('tourBack').onclick = () => goToTitle();
// the ONLY tap that advances the final scoreboard — so tapping the boards to
// browse/scroll never steals the "next round" transition (Enter/Space also work)
document.getElementById('matchNext').onclick = () => { sfx.ensure(); advanceScreens('Enter'); };
// "BACK TO TOUR" — the explicit "no" on a failed campaign verdict (shown only there)
document.getElementById('matchBack').onclick = () => { sfx.ensure(); if (campaign.active) campaign.clearActive(); openTourMenu(); };

// ---------- worlds: Day Fair / Night Fair / Frozen Lake (public) ----------
// Theme + (for ice) ground friction, persisted. Distances still end at the
// forest perimeter (~117m), so the DB dist cap (130) holds even on ice.
// The selector is a scrollable chip row GENERATED from this list — a new world
// is one entry here + one WORLD_THEMES entry in scene.js. DLC worlds wear a 🔒
// until the Supporter Pack is owned; chips render only once their theme ships.
const WORLDS = [
  { key: 'day',     label: '🌞 DAY FAIR' },
  { key: 'ice',     label: '❄️ FROZEN LAKE' },
  { key: 'lava',    label: '🌋 LAVA LAND' },              // now FREE
  { key: 'desert',  label: '🌵 DESERT' },
  { key: 'dojo',    label: '🥋 THE DOJO', dlc: true },
  { key: 'jungle',  label: '🌴 JUNGLE', dlc: true },      // now DLC
  { key: 'haunted', label: '👻 HAUNTED FAIR', dlc: true }, // sits to the right of jungle
  { key: 'therapy', label: '🛋️ THERAPY ROOM', dlc: true },
  { key: 'heaven',  label: '😇 HEAVEN', dlc: true },
  { key: 'hell',    label: '🔥 HELL', dlc: true },
  { key: 'techcampus', label: '💻 SLOP VALLEY', dlc: true },
  { key: 'vegas',   label: '🎰 SLAP VEGAS', dlc: true },
  { key: 'tarpit',  label: '🦴 TAR PITS', dlc: true },
  { key: 'blackgold', label: '🛢️ BLACK GOLD', dlc: true },
  { key: 'cave',    label: '💎 CAVE OF WONDERS', dlc: true },
];
// theme + that world's ONE physics quirk, together — used by the selector,
// the tour world-pin, and the return-to-title restore, so visuals and physics
// can never drift apart
let activeWorld = 'day'; // the world actually on stage (tour pins don't persist to localStorage)
function setWorldFull(key) {
  activeWorld = key;
  stage.setWorldTheme(key);
  if (key === 'ice') phys.setGround({ friction: 0.03, restitution: 0.3 });        // bodies glide
  else if (key === 'jungle') phys.setGround({ friction: 0.38, restitution: 0.62 }); // springmoss BOING
  else if (key === 'tarpit') phys.setGround({ friction: 0.95, restitution: 0.02 }); // THE TAR KEEPS WHAT IT CATCHES — dead landing, no slide (goals calibrated down)
  else if (key === 'blackgold') phys.setGround({ friction: 0.05, restitution: 0.28 }); // the spill: bodies HYDROPLANE down the slick
  else phys.setGround(null);                                                       // farm default
  phys.setGravity(key === 'heaven' ? -8.8 : null);                                 // floaty grace
  // THE GIANT CAT is a body, not a hologram: in therapy a box collider stands on
  // its exact spot (30,10, rotated with it), so a wide flyer bounces off the cat
  // instead of clipping through 4 tons of analyst. Removed with the world —
  // no invisible air where the cat isn't.
  phys.setPropSolid('therapyCat', key === 'therapy' ? { x: 30, z: 10, ry: -0.78, hx: 3.4, hy: 2.3, hz: 2.4 } : null);
  if (player.halo) player.halo.visible = key === 'heaven';                         // the slapper becomes an angel in Heaven
}
function applyWorld(key) {
  setWorldFull(key);
  document.querySelectorAll('.worldOpt').forEach((b) => b.classList.toggle('on', b.dataset.world === key));
  localStorage.setItem('slapp_world', key);
  track('world_selected', { world: key });
}
function buildWorldRow() {
  const row = document.getElementById('worldRow');
  row.innerHTML = '';
  for (const w of WORLDS) {
    if (!stage.hasWorld(w.key)) continue;           // chips appear as worlds ship
    const locked = w.dlc && !owned('bruceslee');    // one pack unlocks everything
    const b = document.createElement('button');
    b.className = 'worldOpt';
    b.dataset.world = w.key;
    b.textContent = locked ? `🔒 ${w.label.replace(/^\S+\s/, '')}` : w.label;
    b.onclick = () => {
      sfx.ensure();
      if (locked) {
        openUnlockModal({ name: w.label.replace(/^\S+\s/, ''), desc: 'This world — and every DLC world and campaign — rides with the Supporter Pack.' });
        return;
      }
      applyWorld(w.key);
    };
    row.appendChild(b);
  }
  // scroll affordance: chevrons page the strip — a hidden scrollbar alone said
  // "this is all the worlds" to anyone without a wheel over the row
  const prev = document.getElementById('worldPrev'), next = document.getElementById('worldNext');
  const syncArrows = () => {
    prev.disabled = row.scrollLeft <= 4;
    next.disabled = row.scrollLeft >= row.scrollWidth - row.clientWidth - 4;
    const overflow = row.scrollWidth > row.clientWidth + 8;
    prev.style.display = next.style.display = overflow ? '' : 'none';
  };
  prev.onclick = () => { row.scrollBy({ left: -220, behavior: 'smooth' }); };
  next.onclick = () => { row.scrollBy({ left: 220, behavior: 'smooth' }); };
  row.addEventListener('scroll', syncArrows, { passive: true });
  addEventListener('resize', syncArrows);
  setTimeout(syncArrows, 50); // after layout
}
buildWorldRow();
// if the saved world is DLC and the pack was refunded/cleared, fall back to day
const savedWorld = localStorage.getItem('slapp_world') || 'day';
const savedDef = WORLDS.find((w) => w.key === savedWorld);
applyWorld(stage.hasWorld(savedWorld) && !(savedDef && savedDef.dlc && !owned('bruceslee')) ? savedWorld : 'day');
// START SLAPPING — the explicit free-play button. Tap-anywhere / Enter still
// work as a fallback (buttons are excluded from the tap-to-advance handler), so
// this just gives the front door a real, obvious control instead of a hidden tap.
document.getElementById('startBtn').onclick = () => { sfx.ensure(); advanceScreens(null); };
// THE DAILY VOLUNTEER chip: seeded matchup, straight into the match (world pinned)
{
  const d = dailyPick();
  const wDef = WORLDS.find((w) => w.key === d.world);
  const btn = document.getElementById('dailyBtn');
  const done = localStorage.getItem('slapp_daily') === DAY_KEY;
  btn.textContent = `📅 TODAY'S VOLUNTEER — ${d.vol.name} · ${wDef ? wDef.label : d.world.toUpperCase()}${done ? ' ✓' : ''}`;
  btn.onclick = () => {
    sfx.ensure();
    dailyMode = true;
    if (stage.hasWorld(d.world)) setWorldFull(d.world);
    chosenArch = d.vol;
    startMatch();
    track('daily_started', { day: DAY_KEY, opp: d.vol.key, world: d.world });
  };
}
if (campaign.enabled()) {
  const b = document.getElementById('tourBtn');
  b.classList.remove('hidden');
  b.onclick = () => { sfx.ensure(); openTourMenu(); };
  document.getElementById('storyDivider').classList.remove('hidden'); // the "— or —" only when the tour exists
  // first-timers (never reached SLAPMASTER) get pointed at the Tour as the
  // on-ramp — Act I is already a metered lesson (head hit → short → medium).
  if (!localStorage.getItem('slapp_master')) document.getElementById('tourNudge').classList.remove('hidden');
}

// ---------- DLC GALLERY: one place to browse every DLC slapper, world & legend ----------
// Built from the live data (SLAPPERS/WORLDS/campaign.TOURS) so it grows automatically
// as content ships. One Supporter Pack unlocks everything, so ownership is uniform:
// owned(key) is true for any item once the pack is bought (or that item is in unlocks).
const leadEmoji = (s) => { const m = (s || '').match(/^\s*(\p{Emoji}️?)/u); return m ? m[1] : null; };
const stripEmoji = (s) => (s || '').replace(/^\s*\p{Emoji}️?\s*/u, '').trim();
function buildDlcGallery() {
  const packOwned = owned('bruceslee');
  const cta = document.getElementById('dlcCta');
  if (packOwned) {
    cta.innerHTML = '<div class="dlcOwned">✓ SUPPORTER — thank you! Everything below is yours.</div>';
  } else {
    cta.innerHTML = '<button id="dlcBuy">❤️ UNLOCK EVERYTHING — $6.99</button>'
      + '<div class="dlcRedeemLink">…already a supporter? <button id="dlcRedeemLink" type="button">redeem your code</button></div>';
    // the big button goes STRAIGHT to Stripe (no detour modal). Code-havers get
    // a small link into the modal, which carries the code box.
    document.getElementById('dlcBuy').onclick = (e) => { const b = e.currentTarget; startCheckout((m) => { b.textContent = m; }); };
    document.getElementById('dlcRedeemLink').onclick = () => openUnlockModal({ name: 'THE SUPPORTER PACK', desc: 'Every slapper, world & campaign — one pack, one price. Enter your code below, or support to unlock.' });
  }
  // truncate on a WORD boundary with an ellipsis — .slice() mid-word printed
  // "The palm, however, sca" on the gallery cards
  const trunc = (s, n) => { s = s || ''; if (s.length <= n) return s; const cut = s.slice(0, n); return cut.slice(0, Math.max(20, cut.lastIndexOf(' '))) + '…'; };
  const mkItem = (icon, name, desc, isOwned, onLock) => {
    const el = document.createElement('div');
    el.className = 'dlcItem ' + (isOwned ? 'owned' : 'locked');
    el.innerHTML = `<div class="ic">${icon}</div><div class="nm">${name}</div><div class="ds">${desc}</div><div class="bdg">${isOwned ? '✓' : '🔒'}</div>`;
    if (!isOwned) el.onclick = onLock;
    return el;
  };
  const mkSection = (heading, items) => {
    const wrap = document.createElement('div'); wrap.className = 'dlcSection';
    const h = document.createElement('h4'); h.textContent = heading; wrap.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'dlcGrid';
    items.forEach((i) => grid.appendChild(i)); wrap.appendChild(grid);
    return wrap;
  };
  const body = document.getElementById('dlcBody'); body.innerHTML = '';

  const dlcSlappers = SLAPPERS.filter((s) => s.locked);
  body.appendChild(mkSection(`🖐 SLAPPERS · ${dlcSlappers.length}`, dlcSlappers.map((s) =>
    mkItem('🖐', stripEmoji(s.name), trunc(s.desc, 64), owned(s.key), () => openUnlockModal(s)))));

  const dlcWorlds = WORLDS.filter((w) => w.dlc);
  body.appendChild(mkSection(`🌍 WORLDS · ${dlcWorlds.length}`, dlcWorlds.map((w) =>
    mkItem(leadEmoji(w.label) || '🌍', stripEmoji(w.label),
      'Its own theme, physics & local characters — atop the 15 fair regulars.',
      owned(w.key), () => openUnlockModal({ name: stripEmoji(w.label), desc: 'This world — and every DLC world, slapper and campaign — rides with the Supporter Pack.' })))));

  const dlcTours = campaign.TOURS.filter((t) => t.dlc);
  body.appendChild(mkSection(`📜 CAMPAIGNS · ${dlcTours.length}`, dlcTours.map((t) =>
    mkItem(leadEmoji(t.title) || '📜', stripEmoji(t.title), trunc(t.blurb, 80),
      owned(t.key), () => openUnlockModal({ name: stripEmoji(t.title), desc: trunc(t.blurb, 120) + ' — unlocks with the Supporter Pack.' })))));
}
function openDlcGallery() { buildDlcGallery(); document.getElementById('dlcGallery').classList.remove('hidden'); }
function closeDlcGallery() { document.getElementById('dlcGallery').classList.add('hidden'); }
// once you OWN the pack, the "Supporter Pack" title button is just an ad for
// something you already bought — hide it. (Everything's unlocked in-game anyway.)
function refreshDlcBtn() { document.getElementById('dlcBtn').classList.toggle('hidden', owned('bruceslee')); }
refreshDlcBtn();
document.getElementById('dlcBtn').onclick = () => { sfx.ensure(); openDlcGallery(); };
document.getElementById('dlcClose').onclick = closeDlcGallery;
document.getElementById('dlcGallery').onclick = (e) => { if (e.target.id === 'dlcGallery') closeDlcGallery(); }; // click backdrop to dismiss

function startAttempt() {
  const arch = chosenArch;
  player.reset();
  player.mode = arch && arch.chop ? 'chop' : 'slap'; // KARATE CHOP stage: S·L·A·P remaps to a downward edge-strike
  opponent.remove();
  opponent = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch });
  // 3D honesty: the swing plane aims at THIS opponent's cheek height
  player.setStrikeTarget(opponent.headPos().y);
  slap = null;
  contact = null;
  settleT = 0;
  dustCool = 0;
  barricadeHit = false;
  gongRung = false;
  lavaBurned = false;
  mooDone = false;
  popDone = false;
  duelDone = false;
  masterDone = false;
  emperorDone = false;
  countyDone = false;
  pendingCard = null;
  cardDelay = 0;
  stage.resetBarricade();
  resetChain();
  if (arch && arch.throwIce) resetCatch(); // catch stages: wipe every stale cube/count up front so a REPLAY always starts clean (also re-run at FACEOFF→SWING)
  shotClock = arch.shotClock || 30; // 30s standard; time-limited bosses run a tighter 20s courtroom
  timeScale = 1;
  hitstopT = 0;
  prevHandSeg = null; // no stale sweep across attempts
  tapeRec = [];
  for (const k in tapePrev) tapePrev[k] = !!keys[k];
  // a challenge link with a tape: the FIRST swing belongs to the rival's ghost
  if (challenge && challenge.tape && !challenge.tapePlayed && chosenArch && chosenArch.key === challenge.oppKey) {
    challenge.tapePlayed = true;
    ghostTape = challenge.tape;
  }
  opponent.runLine = attempts.length % 2; // skiRun v2: line A / line B, announced by her push-off side
  calledHigh = arch.calledShot ? attempts.length % 2 === 0 : null; // Dale calls HIGH, LOW, HIGH
  opponent.calledHigh = calledHigh; // he PRESENTS the called half in his pocket
  if (arch.bulwark) opponent.bulwarkPct = Math.max(0, Math.ceil(100 - bulwarkPts / (arch.bulwark.threshold / 100)));
  // THE TAR PIT: every volunteer stands shin-deep in the tar (bulwark bosses
  // already built theirs); last attempt's splat stains wash for the fresh take
  tarSplatted = false;
  if (activeWorld === 'tarpit') {
    stage.resetTarStains();
    if (!opponent.goop) opponent.addTarGrip();
  }
  // (tookTakedown persists across attempts — the match-end beat wants to know it happened)
  // the goal banner returns for the swing (it hides at contact so it never
  // sits on top of the flight distance ticker)
  if (campaign.active) ui.challengeBar(campaign.goalText());
  ui.hideCards();
  ui.showTitle(false);
  ui.setAttempts(attempts, attempts.length, (opponent.arch && opponent.arch.attempts) || 3);
  ui.setClock(null);
  ui.showDistance(null);
  ui.showMeters(false);
  ui.intro(arch);
  ui.bubble(arch.taunts[Math.floor(Math.random() * arch.taunts.length)]);
  // campaign matches are officiated — His Honor has remarks; in quick play the
  // slapper gets the word instead. Shown on the LOW ref bar so the volunteer's
  // name plate stays readable.
  if (campaign.active) ui.refBar(`🎺 JUDGE PENNYWHISTLE: “${REF_LINES[refLineIdx++ % REF_LINES.length]}”`);
  else if (trainingWheels()) {
    // first-slap wheels are TOLD, not hidden (trust is the skill game's currency)
    // — for the first two slaps this note outranks the slapper's quip
    ui.refBar("🔰 FIRST SLAPS — the county's giving you a friendly wind. Your timing still decides.");
  } else {
    const q = QUIPS[player.look?.key];
    if (q) ui.refBar(`${player.look.name}: “${q[attempts.length % q.length]}”`);
  }
  excite = Math.max(excite, 0.28); // the crowd greets the volunteer
  setState('FACEOFF');
}

function foul(type) {
  slap = { foul: type };
  stage.sunMood('meh', 3);
  sfx.whistle();
  sfx.whoosh(0);
  ui.showMeters(false);
  ui.setClock(null);
  ui.foulBanner(type);
  setState('FOULED');
}

function onContact(hit, fist) {
  const speed = player.handSpeed;
  const velDir = player.handVel.clone().normalize();
  // slow grazes and backhand drift don't count as an attempt at a slap.
  // One honest exception: on tall/deep matchups (Roy×Hoss) the palm's arc only
  // reaches the cheek at the wrap-around, travelling sideways INTO the face —
  // a real slap's follow-through. A fast palm driving into the head counts even
  // with little +x left; without this the PERFECT swing whiffed and a 2.8 m/s
  // rebound flail scored the "hit" instead.
  // BLUE BELT, TWO STRIPES: any contact during Slopberg's REACH is a takedown —
  // the attempt is consumed, not the slap (the telegraph warned you)
  if (opponent.arch.bjj && opponent.inReach()) {
    if (speed < 2.2) return; // a resting hand isn't a slap OR a takedown
    tookTakedown = true;
    foul('takedown');
    return;
  }
  if (speed < 2.2) return;
  // KARATE CHOP: a downward edge-strike — its hand velocity points DOWN, so it
  // must bypass the forward-velocity gate below (built for horizontal slaps).
  const chop = !fist && player.mode === 'chop';
  const assisted = trainingWheels() && !fist && !chop; // first-slap friendly wind (floors only)
  if (velDir.x < 0.15 && !chop) {
    // ≥3.5 m/s (not the full 6): on the deepest matchups the wrap is where the
    // palm has slowed to 4-6 — the speed taper below prices that honestly
    const into = hit.part === 'head' ? new THREE.Vector3().subVectors(hit.center, hit.point).normalize() : null;
    const wrapSlap = !!(into && speed >= 3.5 && velDir.dot(into) >= 0.35);
    if (!wrapSlap) return;
  }

  // power is the PRODUCT of the chain links — technique is everything
  const lg = chain.l || gradeL(null);
  const ag = chain.a || { g: 0.5, label: 'NONE', tier: 1 };
  const pg = chain.p || { g: 0.6, label: 'NONE', tier: 1 };
  const coilFrac = chain.l ? chain.coil : player.coilFrac;
  const coilF = 0.35 + 0.65 * Math.min(1, coilFrac);

  // CONTACT QUALITY (head only) — real slap physics: a blow that lands level
  // with the cheek's center and drives INTO it transfers square; a high/low
  // graze skims off. Rewards reading heights (matchups) and the volunteer's
  // breathing sway — watch the ring, strike level. Deterministic, capped ±12%.
  let cq = 1;
  if (hit.part === 'head' && !fist) {
    // vertical flushness normalized to the inner 45% of the envelope so it
    // actually discriminates (post-reach-fix planes are all near-level), and
    // weighted 70/30 over incidence: height-reading is the skill being paid.
    const R = opponent.rHead + 0.26;
    const vAlign = 1 - Math.min(1, Math.abs(hit.point.y - hit.center.y) / (R * 0.45));
    // angle of incidence against the OFFERED CHEEK's true normal (it rotates
    // with the head), not the radial point→center line — so a turned or angled
    // cheek reads as a genuine graze, from geometry
    const into = hit.normal ? hit.normal.clone().negate() : new THREE.Vector3().subVectors(hit.center, hit.point).normalize();
    const incidence = Math.max(0, velDir.dot(into));
    cq = 0.92 + 0.2 * (0.7 * vAlign + 0.3 * incidence); // gentler graze penalty (floor 0.92, same 1.12 flush ceiling)
    if (assisted) cq = Math.max(cq, 1.0); // wheels: a graze reads as square while learning
  }
  // a punch has no sweet spot — the fist pays body-blow rate even on the head.
  // EXCEPT on a bodyBlow boss (THE CLOSED FIST school): there the forbidden FIST
  // IS the flush hit (lands like a good palm), and the open palm is no-sold below.
  const fistSweet = (fist && opponent.arch.bodyBlow) ? (hit.part === 'head' ? 1.15 : 0.7) : 0.6;
  // a CHOP is an edge strike to the CROWN — its sweet spot is the top of the head
  // (a downward spike), a hair under a flush slap; a chop to the body is a thud.
  const sweet = chop ? (hit.part === 'head' ? 1.2 : 0.55) * cq
    : (fist ? fistSweet : (hit.part === 'head' ? 1.35 : 0.6)) * cq;
  // real slap physics: force comes up from the ground through a BRACED stance.
  // A teetering slapper can't drive the blow — the worse the visible lean at
  // contact, the softer the slap (up to −45% at the tipping point)
  const balF = Math.max(assisted ? 0.9 : 0, 1 - 0.45 * Math.min(1, Math.abs(player.lean) / 1.05) ** 2);
  // P opens the palm for a FLUSH cheek slap — that's what earns the sweet spot
  // (1.35) and the contact-quality bonus. WITHOUT P the fist is still a solid
  // striking surface: it transmits the FULL kinetic chain (coil × lunge × arm),
  // so a well-timed S·L·A punch off a long arm carries real distance — it just
  // pays body-blow rate (sweet 0.6, no cq) at a flatter, forward angle. The
  // palm inflects WHERE the force goes; it doesn't gate whether force exists.
  const pgPower = fist ? 1.0 : pg.g;
  // muscle is a multiplier, not a substitute: the cap means brute strength only
  // pays off against tonnage — technique still decides everything else
  let power = 12.5 * player.strength * balF * coilF * lg.g * ag.g * pgPower * sweet;
  // MOMENTUM: power scales with hand MOMENTUM — effective hand mass × contact
  // speed — instead of the old taper that saturated at 6 m/s and threw away
  // every m/s above it. REF-centred (~MOM_REF) so a typical peak swing is ~1.0
  // (base roster unchanged), but now a faster hand pays more and a slower one
  // pays less, continuously — micro-timing and hand speed finally matter. A big
  // arm's extra mass (armMass) offsets its lower speed → a short committed
  // strike still lands hard (the Lil' Dynamite short-range-bruiser tradeoff).
  const MOM_REF = 10;
  // + a speed-INDEPENDENT effective-mass floor: a heavy hand carries momentum
  // even at low speed, so a giant arm's short/slow strike still bites (base
  // armMass 1 → +0, unchanged). Sharpens the Dynamite short-range identity.
  // FORGIVENESS: a higher floor + gentler slope so an imperfect (slower) hand
  // keeps most of its power — the un-saturated version punished sloppy play too
  // hard and made outcomes hard to read. Peak is still cap-bound (ceilings same).
  power *= THREE.MathUtils.clamp(0.55 + 0.5 * player.armMass * speed / MOM_REF + 0.1 * (player.armMass - 1), 0.5, 1.7);
  // EXTENSION BELL — force transfers best when the arm connects near FULL
  // extension (peak reach + hand speed). A bell centred where a well-timed palm
  // lands (~0.93 of the elbow's range) → PERFECT is 1.0 (base roster unchanged);
  // connecting UNDER-extended (arm still folding — late P, or a heavy arm too
  // slow to open) OR hyperextended/locked out costs force. This is the arm-based
  // timing axis the spine grades miss: a giant arm can't reach full extension on
  // a long whip in time, so it must strike SHORT to land flush — Dynamite's real
  // downside. Fist punches keep their own model (elbow stays folded by design).
  const elb = player.j.elbow;
  const armExt = (elb.max - elb.a) / (elb.max - elb.min); // 0 folded → 1 straight
  // ONE-SIDED bell: full reward at/above 0.93 (a fully-extended connect is never
  // penalized — protects reach-saturated matchups like a short slapper reaching a
  // tall volunteer), penalty only BELOW 0.93 (the arm still folding). σ 0.13.
  let extF = fist ? 1 : (armExt >= 0.93 ? 1 : THREE.MathUtils.clamp(0.75 + 0.25 * Math.exp(-(((armExt - 0.93) / 0.15) ** 2)), 0.75, 1));
  if (assisted) extF = Math.max(extF, 0.92); // wheels: under-reach forgiven while learning
  // extF is applied POST-CAP (below) so under-extension gates force even at the
  // cap — a light arm caps AT full extension (extF≈1, untouched) but a heavy arm
  // caps while still folding (extF<1), so it genuinely can't reach its ceiling on
  // a long whip. That's the Dynamite downside the spine grades couldn't express.
  // rebound flail: only true multi-oscillation scuffles — a first-rebound catch
  // is a legitimate (already low-graded) beginner slap
  const ugly = chain.tFire != null && swingT - chain.tFire > 2.2;
  if (ugly) power *= 0.3;
  // chain quality as % of theoretical max — shown to the player, and the number
  // boss gates judge (so the HUD and the boss always agree)
  const chainPct = Math.round(Math.min(1, (coilF * lg.g * ag.g * pg.g) / 1.8) * 100);
  // BOSS MECHANICS — readable, skill-targeted handicaps, never RNG:
  // grease: only a PERFECT palm grips — anything less slides off (P-timing exam)
  const greased = !!(opponent.arch.grease && !ugly && pg.tier < 3);
  if (greased) power *= 0.45;
  // chainGate: below the posted chain% he no-sells the hit (whole-chain exam)
  const noSold = !!(opponent.arch.chainGate && !ugly && chainPct < opponent.arch.chainGate);
  if (noSold) power *= 0.12;
  // bodyBlow (THE CLOSED FIST school): his cheek is a shield — the OPEN palm is
  // TOO SOFT, only a closed fist reaches him. The exact inverse of the house rule.
  const tooSoft = !!(opponent.arch.bodyBlow && !ugly && !fist);
  if (tooSoft) power *= 0.12;
  // snapExam: only a PERFECT arm-whip lands — a lazy arm has no crack (A-timing exam)
  const noSnap = !!(opponent.arch.snapExam && !ugly && ag.tier < 3);
  if (noSnap) power *= 0.45;
  // coilExam: the mainspring only trips on a nearly-full wind-up (S/coil exam)
  const unwound = !!(opponent.arch.coilExam && !ugly && coilFrac < opponent.arch.coilExam / 100);
  if (unwound) power *= 0.40;
  // headTurn (HORTON): power scales with how square the face is at contact —
  // catch the turn incoming for a flush 1.1×; the back of the head barely counts
  // headTurn: how square the offered cheek is to the incoming hand, read from
  // the TRUE contact angle NOW — the cheek and its normal rotate with his neck,
  // so a face turned away presents a glancing incidence and bleeds power, all
  // from geometry (this replaces the old decoupled time-clock; same feel/shape).
  const facing = (opponent.arch.headTurn && hit.part === 'head' && hit.normal)
    ? THREE.MathUtils.clamp(0.25 + 0.85 * Math.max(0, velDir.dot(hit.normal.clone().negate())), 0, 1.1)
    : opponent.headFacing();
  const turnedAway = !!(opponent.arch.headTurn && hit.part === 'head' && facing < 0.6);
  if (opponent.arch.headTurn && hit.part === 'head') power *= facing;
  // calledShot (DODGY DALE): he calls a cheek half before the swing — only a
  // flush hit inside the called half counts full. Aim is the exam: high/low
  // reads off hit.point.y vs the head center; cq prices the flushness.
  const cs = opponent.arch.calledShot;
  const csDy = hit.part === 'head' ? hit.point.y - hit.center.y : 0;
  const inCalledHalf = calledHigh === null || (calledHigh ? csDy >= cs.margin : csDy <= -cs.margin);
  const wrongCheek = !!(cs && !ugly && !fist && hit.part === 'head' && (!inCalledHalf || Math.round(cq * 100) < cs.cqMin));
  if (wrongCheek) power *= 0.2;
  // secondWind (CHUCK NORTH): mortal for the first `delay` seconds of the swing —
  // strike in that quiet for full power. Once the crowd chants (tState past delay)
  // he becomes a STORY: a weak chain is shrugged (pre-cap), an 85%+ chain punches
  // THROUGH the legend — applied POST-cap so the bonus isn't just absorbed by it.
  const sw = opponent.arch.secondWind;
  const surging = !!(sw && !ugly && tState >= sw.delay);
  if (surging && chainPct < sw.gate) power *= sw.weak;
  // the cap scales with muscle: a perfect chain caps everyone, but the strong
  // cap HIGHER — strength genuinely moves tonnage instead of dying at 30
  power = Math.min(power, 30 * player.strength);
  if (surging && chainPct >= sw.gate) power *= sw.punch; // the 85%-chain surge answer punches past the cap
  power *= extF; // EXTENSION BELL (post-cap): under-extension can't reach the ceiling — the heavy-arm long-whip downside

  // he flies down the lane, carrying a hint of the sideways sweep — and the
  // arc follows the strike angle: an upward slap at a tall victim launches
  // high, a downward chop at a short one skims flat
  // DIRECT THE LAUNCH PLANE from the contact geometry: the head drives along the
  // INWARD cheek normal (−nCheek, the push direction) blended with a hint of the
  // hand's sideways sweep. A square cheek gives push=(+1,0,0) → straight down the
  // lane (unchanged, no regression); a TURNED or angled cheek tilts the push in z
  // → the flight genuinely DEFLECTS sideways. dir.y (the arc) is set just below.
  const dir = new THREE.Vector3(1, 0, velDir.z * 0.15);
  if (hit.normal) {
    const push = hit.normal.clone().negate(); // into the cheek
    push.y = 0;
    if (push.lengthSq() > 1e-4) {
      push.normalize();
      // partial blend toward the contact push: a square cheek is unchanged
      // (push.x=1 → dir.x=1, push.z=0 → sweep only), a TURNED/angled cheek
      // deflects clearly but still carries down-lane (flights stay contained)
      dir.x = 0.4 + 0.6 * push.x;
      // clamp the sideways deflection so containment is guaranteed BY CONSTRUCTION
      // (never relying on a boss's facing-power gate to keep flights off the rails)
      dir.z = THREE.MathUtils.clamp(0.6 * push.z + velDir.z * 0.15, -0.45, 0.45);
    }
  }
  // a slap launches UP off the cheek (the strike lifts them skyward); a punch
  // drives them FORWARD on a flat, low body-blow line — same force, different angle.
  // CONTACT-HEIGHT → ARC (skill axis): a slap landing HIGH on the cheek applies
  // force well above the body's center of mass → more toppling lift → a STEEPER
  // arc; a LOW hit drives flatter. Modulated strictly WITHIN the existing
  // [0.18,0.52] band (never past it — the 117m/130m caps hold by construction),
  // and in tension with cq, which rewards the CENTER: you trade a little flush
  // force for a steeper arc. Reading the cheek height now pays two ways.
  let arcTag = null;
  if (chop) {
    // a CHOP SPIKES DOWN — it drives the volunteer into the ground (a short, brutal
    // spike + bounce), the opposite of the slap's long outward arc. Little forward.
    dir.x = 0.28;
    dir.z = THREE.MathUtils.clamp(velDir.z * 0.1, -0.2, 0.2);
    dir.y = -THREE.MathUtils.clamp(0.42 + player.strikeLift * 0.25, 0.3, 0.72);
  } else if (fist) {
    dir.y = 0.15;
  } else {
    const dyN = hit.part === 'head'
      ? THREE.MathUtils.clamp((hit.point.y - hit.center.y) / (opponent.rHead * 0.7), -1, 1) : 0;
    dir.y = THREE.MathUtils.clamp(0.34 + player.strikeLift * 0.55 + dyN * 0.09, 0.18, 0.52);
    if (hit.part === 'head') arcTag = dyN > 0.5 ? 'STEEP' : dyN < -0.5 ? 'FLAT' : 'LEVEL';
  }
  dir.normalize();

  // COG TORQUE + palm roll — the tumble is now PRINCIPLED, not a heuristic. The
  // launch impulse lands ABOVE the center of gravity, so it topples the body:
  // angular velocity ∝ r × F, with r = (contact point − COG) and F = the launch
  // direction. A HIGH cheek hit somersaults them forward; a LOW hit barely
  // pitches; an off-centre or TURNED-cheek hit (dir deflected in z) adds real
  // yaw. On top of that, a flush open PALM drags across the cheek and adds a
  // barrel-roll (the tangential sweep about n×tang). ANGULAR ONLY — this leaves
  // every body's linear velocity (hence the measured distance + the caps)
  // completely untouched; the flight is identical, only the tumble is honest.
  const cog = opponent.pelvisPos(); // the body's approximate center of gravity
  if (opponent.arch.cogY != null) cog.y = opponent.arch.cogY; // exotic builds (floating head, top-heavy) can override the lever
  const r = new THREE.Vector3(hit.point.x - cog.x, hit.point.y - cog.y, hit.point.z - cog.z);
  // scale the tumble by the LAUNCH IMPULSE (power), not the ~constant hand speed,
  // so a feeble graze barely turns them while a monster slap somersaults them —
  // and damp by head INERTIA (∝√mass) so a heavy skull resists rotation
  const inertia = Math.sqrt(opponent.arch.mass);
  const spin = new THREE.Vector3().crossVectors(r, dir).multiplyScalar(power * 0.3 / inertia);
  if (hit.part === 'head') {
    // the offered cheek's true normal (rotates with the head) — so on a turned
    // face the barrel-roll spins about the real axis, not the radial line
    const n = hit.normal ? hit.normal.clone() : new THREE.Vector3().subVectors(hit.point, hit.center).normalize();
    const tang = velDir.clone().addScaledVector(n, -velDir.dot(n)); // sweep across the surface
    const tMag = tang.length();
    if (tMag > 1e-3) {
      tang.normalize();
      const rollAxis = new THREE.Vector3().crossVectors(n, tang).normalize();
      const flush = THREE.MathUtils.clamp((cq - 0.88) / 0.24, 0, 1);
      // palm whips (full drag) vs fist driving straight in (little extra roll) —
      // on the SAME impulse basis as the COG term (power, not raw hand speed, so
      // a weak flush palm doesn't over-roll) and inertia-damped for heavy heads
      spin.addScaledVector(rollAxis, power * tMag * (fist ? 0.06 : 0.2) * (0.7 + 0.6 * flush) / inertia);
    }
  }
  spin.x += (Math.random() - 0.5) * 0.5; // a touch of natural tumble, never sterile
  spin.y += (Math.random() - 0.5) * 0.5;

  // ===== IMMOVABLE BULWARK (Tick-Tock Tom): UNSLAPPABLE until drained =====
  // He does NOT fly on a hit. Each slap's FORCE drains a hidden meter while he
  // stays PLANTED (feet down) and the strike REBOUNDS off him. Only the hit that
  // empties the meter frees the mainspring and launches him. The drain is scaled
  // to the would-be launch impulse (speed × mass), matching the old distance-based
  // point scale, so the 600 threshold and "~2 good swings" balance are unchanged.
  const bw = opponent.arch.bulwark;
  let absorbed = false;
  if (bw) {
    // drain by slap FORCE, SUPERLINEAR (power²/25) — world- and mass-independent.
    // The square widens the gap between a flush cracker and a mediocre pat: a
    // decently good player (power ~24) clears ~5 of 10; a mediocre one (power ~16)
    // drains half as fast and can run out the clock and FAIL. Each boss's toughness
    // lives in its `threshold`.
    bulwarkPts += (power * power) / 25;
    const pct = Math.max(0, Math.ceil(100 - bulwarkPts / (bw.threshold / 100)));
    opponent.bulwarkPct = pct;
    ui.bulwark(pct, bw.label, bw.sprungCry);
    absorbed = pct > 0;                 // still immovable → he holds his ground
  }
  if (absorbed) {
    opponent.absorbHit(power);          // planted shudder; feet stay
    player.rebound(power);              // the hand is thrown back the way it came
  } else {
    opponent.launch(dir, power, spin);
    if (bw) { opponent.springOut(); if (opponent.breakBolt) opponent.breakBolt(); sfx.fanfare(); stage.shake(0.6); } // the mainspring lets go — the bolts SHEAR
  }
  slap = {
    absorbed,
    foul: null, part: hit.part, fist, // a landed contact is never a foul (fouls use the FOULED path)
    chain: {
      coil: Math.round(Math.min(1, coilFrac) * 100), l: lg.label, a: ag.label, p: pg.label, ugly,
      bal: Math.round(balF * 100),
      cq: hit.part === 'head' ? Math.round(cq * 100) : null, // contact flushness (100 = level+square)
      arc: arcTag, // launch-angle read: STEEP (caught high) / FLAT (caught low) / LEVEL
      reach: fist ? null : (armExt < 0.87 ? 'SHORT' : 'FULL'), // arm-extension read at contact (over-extension no longer penalised)
      extPct: fist ? null : Math.round(extF * 100), // for tuning
      pct: chainPct, // % of theoretical max — same number the boss gates judge
    },
  };
  contact = { point: hit.point.clone(), power };
  if (assisted) { firstSlaps++; localStorage.setItem('slapp_played', firstSlaps); }
  ui.challengeBar(null); // clear the lane for the flight ticker — it returns next attempt
  stage.spawnShock(hit.point);
  sfx.crack(Math.min(1, power / 22), ugly || fist ? 0.2 : chainPct / 100); // the SNAP is the chain quality, audible
  ui.flightChain(ugly || fist ? null : chainPct); // the skill rides the flight ticker
  sfx.gasp();
  sfx.whoosh(0);
  stage.shake(Math.min(0.5, power / 40));
  if (!ugly && hit.part === 'head') ui.flash(Math.min(0.55, 0.16 + power / 55)); // the CRACK — a white pop on a clean cheek hit
  excite = Math.min(1, power / 20);
  // SWING FOLLOW-THROUGH (not literal recoil): a committed slap's body rotation
  // carries YOU forward through the strike — the bigger the launch, the bigger
  // the lurch — and this dominates the small backward contact reaction, so the
  // net felt effect is forward. A stance already teetering gets shoved further
  // (reckless power off a bad base staggers you into the next attempt). Bounded.
  player.leanV += power * 0.055 * (1 + 0.5 * Math.min(1, Math.abs(player.lean) / 1.05));
  // the sun judges TECHNIQUE, not tonnage — chain quality decides its mood
  if (ugly || hit.part === 'torso' || slap.chain.pct < 25) stage.sunMood('meh', 3.5);
  else if (slap.chain.pct >= 60) stage.sunMood('happy', 5);
  if (absorbed) ui.slapBurst('ABSORBED!', `${bw.label || 'IMMOVABILITY'} ${opponent.bulwarkPct}% — HE DOES NOT BUDGE`);
  else if (bw) ui.slapBurst(bw.sprungCry || 'SPRUNG!', bw.sprungSub || 'THE MAINSPRING LETS GO — UNSLAPPABLE, REVISED');
  else if (fist && opponent.arch.bodyBlow) ui.slapBurst('FIST FLUSH!', 'THE CLOSED HAND BREAKS THROUGH — HE FELT THAT ONE');
  else if (fist) { ui.slapBurst('BODY BLOW — CLOSED FIST!', 'A REAL HIT — OPEN THE PALM [P] FOR THE FLUSH SLAP + THE SWEET SPOT'); sfx.whistle(); }
  else if (tooSoft) ui.slapBurst('TOO SOFT!', "HE ONLY FEELS A FIST — CLOSE THE HAND, DON'T PRESS [P]");
  else if (ugly) ui.slapBurst('SLOPPY SLAP!', 'THE CHAIN WAS LONG GONE');
  else if (noSold) ui.slapBurst(opponent.arch.gateCry || 'NO-SOLD!', opponent.arch.gateCrySub || `HE NEEDS A ${opponent.arch.chainGate}% CHAIN TO EVEN BLINK`);
  else if (greased) ui.slapBurst('IT SLID OFF!', 'ONLY A PERFECT PALM GRIPS THE GREASE');
  else if (noSnap) ui.slapBurst('NO SNAP!', 'ONLY A CRACKING ARM — A FAST WHIP — MOVES THE MASTER');
  else if (unwound) ui.slapBurst('UNWOUND!', `WIND THE COIL PAST ${opponent.arch.coilExam}% OR THE SPRING NEVER TRIPS`);
  else if (turnedAway) ui.slapBurst('BACK OF THE HEAD!', 'CATCH THE FACE MID-TURN, INCOMING — LIKE A LIGHTHOUSE');
  else if (wrongCheek) ui.slapBurst('WRONG CHEEK!', calledHigh ? 'HE CALLED HIGH — UPPER HALF, FLUSH' : 'HE CALLED LOW — LOWER HALF, FLUSH');
  else if (opponent.arch.headTurn && hit.part === 'head' && facing > 1.02) ui.slapBurst('CAUGHT THE TURN!', 'FLUSH ON THE INCOMING CHEEK');
  else if (hit.part === 'head') ui.smack('SLAPMANIA!', false);
  else ui.smack('BODY BLOW!', true);
  ui.showMeters(false);
  ui.setClock(null);
  // HIT-STOP: a real strike freezes the world for a beat before the slow-mo —
  // scaled by power (a feeble graze stays snappy, a monster slap HANGS ~0.16s).
  // The freeze is what makes the biggest launches feel heavy instead of slippery.
  hitstopT = power >= 12 ? Math.min(0.16, 0.05 + power / 220) : 0;
  if (power >= 18) {
    // the big-hit dressing: echoing shockwaves off the cheek (real-time timers —
    // they land inside the frozen/slow-mo window, which is the point)
    setTimeout(() => stage.spawnShock(hit.point), 90);
    if (power >= 24) setTimeout(() => stage.spawnShock(hit.point), 190);
  }
  timeScale = 0.13;
  setState('IMPACT');
}

// the result-card line for an ABSORBED bulwark hit. Tick-Tock Tom BRANCHES on
// durability — confident (>60%) → mechanisms cracking (25–60%) → panic (<25%) —
// with Charlie ('YOU') narrating his science between; other bulwark bosses
// (Grievance) get the plain "keep chipping" read.
let absorbIdx = 0;
function absorbLine(arch) {
  const pct = opponent.bulwarkPct;
  const label = (arch.bulwark && arch.bulwark.label) || 'meter';
  if (arch.slapTiers) {
    const pool = pct < 25 ? arch.slapTiers.low : pct < 60 ? arch.slapTiers.mid : arch.slapTiers.high;
    const beat = pool[absorbIdx++ % pool.length];
    const who = beat.who === 'YOU' ? player.look.name : beat.who;
    return `${who}: “${beat.text}”  (${label}: ${pct}%)`;
  }
  return `IMMOVABLE — he doesn't budge an inch. But the ${label} just dropped to ${pct}%. Keep chipping.`;
}

function showResult() {
  timeScale = 1;
  const arch = opponent.arch;
  const flew = opponent.launched ? opponent.distance() : 0;
  const isFoul = !!(slap && slap.foul);
  const dist = isFoul ? 0 : flew;
  const pts = Math.round(dist * arch.mass * 10);
  if (ghostActive) {
    // the rival's tape just landed — show ITS card, but the swing was never
    // yours: no attempt consumed, no board write, no campaign judgment
    cancelGhost();
    ui.coach(null); ui.refBar(null); ui.showDistance(null);
    sfx.crowd(dist > 20 ? 3 : 1);
    pendingCard = {
      dist, pts, arch, part: slap && !isFoul ? slap.part : null,
      foul: isFoul ? slap.foul : null, chain: slap ? slap.chain : null,
      line: `📼 THE CHALLENGER'S TAPE — that's the swing. ${challenge ? challenge.by : 'THE RIVAL'} sent ${pts} PTS. YOUR TURN.`,
      n: 0, next: 'CLICK / ENTER → YOUR TURN',
    };
    cardDelay = 1.1;
    ui.setAttempts(attempts, attempts.length, (opponent.arch && opponent.arch.attempts) || 3);
    setState('RESULT');   // the caller relies on showResult flipping the state — without this it re-fires as a REAL attempt
    return;
  }
  attempts.push({ dist, pts, foul: isFoul ? slap.foul : null, part: slap ? slap.part : null, opp: arch.name, tape: tapeRec.slice(0, 48) });
  track('slap_landed', {
    opp: arch.name, pts, dist: +dist.toFixed(1),
    foul: isFoul ? slap.foul : null,
    chain_pct: slap && slap.chain ? slap.chain.pct : null,
    part: slap ? slap.part : null,
  });
  if (pts > 0) {
    // read-modify-write: fold in whatever storage holds now (maybe newer than our
    // in-memory copy), add this score, then persist — so we never clobber a score
    // another tab wrote while we weren't looking.
    board = mergeBoards(board, readBoard(), [{ pts, dist, opp: arch.name, when: Date.now() }]);
    localStorage.setItem('slapp_board', JSON.stringify(board));
    refreshBest();
  }
  let line = isFoul ? ui.FOUL_LINES[slap.foul]
    : (slap && slap.absorbed) ? absorbLine(arch)
    : (slap && slap.part === 'torso' ? ui.bodyLineFor(flew) : ui.commentaryFor(flew, opponent.wallSplat, !!arch.female));
  // world personality on the result card — deterministic garnish, never scoring
  const worldNow = activeWorld; // the world on stage, incl. tour pins
  if (worldNow === 'lava' && !isFoul) {
    line += slap && slap._lavaBurned ? ' 🌋 STRAIGHT INTO THE MOLTEN SEA — flame-broiled to a crisp!'
      : ` DONENESS: ${dist < 20 ? 'STILL RAW.' : dist < 45 ? 'MEDIUM RARE.' : dist < 70 ? 'WELL DONE.' : "FLAME-BROILED. Chef's kiss."}`;
  } else if (worldNow === 'therapy') {
    line += ' ' + (isFoul
      ? (slap.foul === 'clock' ? 'DIAGNOSIS: classic avoidance.' : 'DIAGNOSIS: overextension. You fear commitment, yet here we are.')
      : slap && slap.part === 'torso' ? "DIAGNOSIS: you're projecting. Aim higher."
      : slap && slap.chain.pct >= 90 ? 'DIAGNOSIS: a BREAKTHROUGH. Same time next week.'
      : slap && slap.chain.pct < 40 ? 'DIAGNOSIS: a repressed follow-through.'
      : 'DIAGNOSIS: unresolved. The couch is ready when you are.');
  } else if (worldNow === 'techcampus') {
    line += isFoul
      ? ' VC VERDICT: FUNDING SECURED. (The SEC has questions.)'
      : ` VC VERDICT: ${dist < 20 ? 'PIVOT TO AI.' : dist < 45 ? 'SERIES A.' : dist < 70 ? 'UNICORN.' : 'IPO. RING THE BELL.'}`;
  } else if (worldNow === 'hell') {
    // Hell loves failure: fouls get a standing ovation, excellence gets silence
    if (isFoul) {
      line = 'THE CROWD GOES WILD — finally, some BAD NEWS! ' + line + ' SIN QUALITY: EXCELLENT.';
      stage.kidsCelebrate(2.5);
      sfx.crowd(3);
    } else if (slap && slap.chain.pct >= 90) {
      line += ' The crowd falls silent. Somewhere, a single sad honk.';
    } else {
      line += ' Booing intensifies with every meter. SIN QUALITY: POOR.';
    }
  } else if (worldNow === 'tarpit' && !isFoul) {
    // the tar keeps what it catches — every landing is a future exhibit
    line += ` FOSSIL REPORT: ${dist < 4 ? 'immediate preservation. The tar thanks you.' : dist < 7 ? 'partial sink. Museum-adjacent.' : dist < 10 ? 'a DIG SITE someday. Respectable.' : 'cleared the pit entirely — the paleontologists boo.'}`;
  } else if (worldNow === 'blackgold' && !isFoul) {
    line += ` BARREL ESTIMATE: ${dist < 18 ? 'dry well.' : dist < 30 ? 'trace deposits.' : dist < 45 ? 'COMMERCIALLY VIABLE.' : 'GUSHER. The pipeline weeps with joy.'}`;
  }
  // tour goals are judged per attempt, from numbers this function already has.
  // (BULWARK draining + the SPRUNG/ABSORBED feedback now happen at CONTACT time in
  // onContact — he's immovable until the meter empties — not here post-flight.)
  if (campaign.active) {
    const cleared = campaign.checkAttempt({
      dist, pts,
      part: slap && !isFoul ? slap.part : null,
      fist: slap && !isFoul ? !!slap.fist : false,
      chainPct: slap && slap.chain ? slap.chain.pct : 0,
      oppKey: arch.key,
      bulwarkPts,
    });
    if (cleared) {
      line = `🎪 ${cleared.title} — CLEAR! ` + line;
      lastClearedId = cleared.id;   // an outro may be owed at match end
      sfx.fanfare();
      track('tour_challenge_cleared', { id: cleared.id, title: cleared.title });
    }
  }
  sfx.crowd(isFoul ? 0 : dist > 20 ? 3 : dist > 10 ? 2 : dist > 4 ? 1 : 0);
  ui.coach(null);
  ui.refBar(null);
  ui.showDistance(null);
  ui.setAttempts(attempts, attempts.length, (opponent.arch && opponent.arch.attempts) || 3);
  // the card waits: first the camera settles on WHERE he landed, then any
  // earned honors play out, and only then does the scoreboard interrupt
  pendingCard = {
    dist, pts, arch, part: slap && !isFoul ? slap.part : null,
    foul: isFoul ? slap.foul : null, chain: slap ? slap.chain : null, line, n: attempts.length,
    // a campaign STORY BEAT resolves on this card — one decisive strike, no
    // best-of-3 — so the footer must not promise an 'ATTEMPT 2 OF 3'
    next: campaign.active && !isBossTrial(campaign.active)
      ? (lastClearedId === campaign.active.id ? 'CLICK / ENTER → CONTINUE THE STORY' : 'CLICK / ENTER → TRY AGAIN')
      : null,
  };
  cardDelay = 1.1;
  // SLAPMASTER: he cleared the hay wall itself (60.5m) — the landmark IS the bar
  if (!isFoul && dist > 62 && !masterDone) {
    masterDone = true;
    track('slapmaster_reached', { dist: +dist.toFixed(1), opp: arch.name });
    excite = 1;
    stage.summonSpirits(opponent.pelvisPos().x);
    sfx.choir();
    stage.kidsCelebrate(6);
    ui.smack('SLAPMASTER!', 'gold');
    ui.coach('THE SLAPMASTERS SMILE UPON YOU');
    stage.sunMood('happy', 6);
    localStorage.setItem('slapp_master', '1');
    ui.setMaster(localStorage.getItem('slapp_emperor') ? 2 : 1);
    cardDelay = 2.8;
  }
  // SLAP EMPEROR: past the county line off a ≥90% chain — flawless AND far.
  // The hand shines, and he ascends.
  if (!isFoul && dist > 85 && slap && slap.chain && slap.chain.pct >= 90 && !emperorDone) {
    emperorDone = true;
    track('slap_emperor_reached', { dist: +dist.toFixed(1), chain_pct: slap.chain.pct, opp: arch.name });
    excite = 1;
    player.setHandGlow(true);
    player.startAscension();
    stage.spawnBeam(player.root.position.x + 0.3, 0);
    stage.spawnSparkles(player.root.position.x + 0.3, 0);
    stage.kidsCelebrate(8);
    stage.spawnConfetti(opponent.pelvisPos());
    sfx.fanfare();
    sfx.choir();
    sfx.crowd(3);
    ui.smack('SLAP EMPEROR!', 'gold');
    ui.coach('ACHIEVEMENT UNLOCKED: SLAP EMPEROR — ASCEND');
    stage.sunMood('happy', 8);
    localStorage.setItem('slapp_emperor', '1');
    ui.setMaster(2);
    cardDelay = 4.0;
  }
  setState('RESULT');
}

// every share is a thrown gauntlet: the link reopens the game preset to this
// exact matchup with the score to beat
function challengeUrl(bestAttempt) {
  if (!bestAttempt || bestAttempt.pts <= 0) return null;
  const oppKey = (ROSTER.find((r) => r.name === bestAttempt.opp) || {}).key || '';
  const by = (ui.getName() || 'A RIVAL').slice(0, 12);
  const tape = bestAttempt.tape && bestAttempt.pts > 0 ? `&ctape=${encodeTape(bestAttempt.tape)}` : '';
  return `https://slapmania.org/?cpts=${bestAttempt.pts}&copp=${oppKey}&csl=${player.look?.key || ''}&cby=${encodeURIComponent(by)}${tape}`;
}

// A campaign challenge is a BOSS TRIAL — best-of-3 and a VERDICT card (the pause, the
// ✔/✘, the RETRY button) — when it is a titled boss or its opponent is a boss arch
// (the capstones plus the mechanic-gate exams). Every other challenge is a STORY BEAT:
// one decisive strike, the ordinary result card as feedback, then straight into the
// next scene — no verdict ceremony. Keeping the weight for the bosses makes the bosses
// land harder by contrast.
function isBossTrial(ch) {
  if (!ch) return false;
  if (/BOSS/i.test(ch.title)) return true;
  const a = ROSTER.find((r) => r.key === ch.opp);
  return !!(a && a.boss);
}

// Play a campaign challenge's aftermath — shared by the story-beat flow (reached
// straight off the result card) and the boss verdict card. Clear → the outro scene
// (or a rotating win beat) → back to the tour. Miss → a one-time humbling fail beat,
// then straight back into the SAME challenge (repeat retries skip the sad cutscene).
function resolveTourOutcome(ch, cleared) {
  const you = (l) => (l.who === 'YOU' ? { ...l, who: player.look.name } : l);
  if (!cleared) {
    const retry = () => startTourChallenge(ch);
    if (failSceneShown.has(ch.id)) { retry(); return; }
    failSceneShown.add(ch.id);
    const escapeBeat = chosenArch && chosenArch.skiRun; // she made the gate — her victory lap plays, not a whiff joke
    const takedownBeat = chosenArch && chosenArch.bjj && tookTakedown; // he folded you like a term sheet
    const pool = campaign.FAILS[ch.id[0]] || [];
    const fail = takedownBeat ? campaign.TAKEDOWN_FAIL : escapeBeat ? campaign.ESCAPE_FAIL : (pool.length ? pool[failIdx++ % pool.length] : null);
    if (fail) playScene(fail.map(you), retry, { sad: true });
    else retry();
    return;
  }
  campaign.clearActive();
  failSceneShown.delete(ch.id); // a future replay of this cleared challenge earns its beat again
  if (chosenArch && chosenArch.boss) chosenArch = null;
  restoreBar();
  const outroId = 'outro_' + ch.id;
  const outro = campaign.CUTSCENES[outroId];
  if (outro && !seenScene(outroId)) {
    markScene(outroId);
    playScene(outro.map(you), () => openTourMenu());
  } else {
    const pool = campaign.WINS[ch.id[0]] || [];
    const win = pool.length ? pool[winIdx++ % pool.length] : null;
    if (win) playScene(win.map(you), () => openTourMenu());
    else openTourMenu();
  }
}

function advance() {
  if (pendingCard) return; // the ceremony finishes before the paperwork
  // STORY BEAT: no verdict card and no best-of-3 grind — the strike that clears the
  // goal ends the match and flows straight to the aftermath; a miss drops into the
  // light fail beat + retry. Bosses fall through to the verdict-card path below.
  if (campaign.active && !isBossTrial(campaign.active) && attempts.length >= 1) {
    const ch = campaign.active;
    const clearedNow = lastClearedId === ch.id;
    lastClearedId = null;
    ui.hideCards();
    resolveTourOutcome(ch, clearedNow);
    return;
  }
  // most bosses are best-of-3; a bulwark attrition boss (Tick-Tock Tom) grants
  // its own budget (arch.attempts) AND ends the instant he's SPRUNG — no need to
  // burn the remaining swings once the meter's empty.
  const maxA = (opponent.arch && opponent.arch.attempts) || 3;
  const bulwarkDone = !!(opponent.arch && opponent.arch.bulwark && opponent.bulwarkPct <= 0);
  if (attempts.length >= maxA || bulwarkDone) {
    const bestAttempt = attempts.reduce((a, b) => (b.pts > a.pts ? b : a), attempts[0]);
    track('match_completed', { best_pts: bestAttempt.pts, best_dist: +bestAttempt.dist.toFixed(1), opp: bestAttempt.opp });
    ui.hideCards();
    const bestArch = ROSTER.find((r) => r.name === bestAttempt.opp);
    let line = ui.commentaryFor(bestAttempt.dist, false, !!(bestArch && bestArch.female));
    if (challenge) {
      const won = bestAttempt.pts > challenge.pts;
      line += won ? ` ⚔️ CHALLENGE WON — ${challenge.by}'s ${challenge.pts} PTS is dust!`
                  : ` ⚔️ ${challenge.by}'s ${challenge.pts} PTS still stands. Run it back.`;
      track('challenge_result', { won, target: challenge.pts, scored: bestAttempt.pts, by: challenge.by });
    }
    // a campaign card is a VERDICT, not a fairground scoreboard: it restates the
    // goal, says CLEARED or FAILED in big letters, and offers retry/continue —
    // no county boards, no share row, no "pick your next volunteer"
    const tourCtx = campaign.active ? {
      title: campaign.active.title,
      goal: campaign.active.desc,
      cleared: lastClearedId === campaign.active.id,
    } : null;
    ui.showMatch({ bestAttempt, line, board, shareUrl: challengeUrl(bestAttempt), tour: tourCtx });
    setupGlobalPanel(bestAttempt);
    setState('MATCH_END');
  } else {
    startAttempt();
  }
}

function setupGlobalPanel(bestAttempt) {
  // campaign matches stay in the story — no worldwide boards, no score posting;
  // the rankings belong to quick play
  if (campaign.active) { ui.showGlobal(false); return; }
  if (!net.configured()) { ui.showGlobal(false); return; }
  ui.showGlobal(true);
  ui.renderGlobal(null);
  ui.netMsg('Fetching the worldwide rankings…');
  // weekly board + reigning champ + apples-to-apples matchup board, all at once.
  // Champion/matchup resolve to null pre-migration, so this degrades to legacy.
  const refreshBoards = () => Promise.all([
    net.fetchTop(10),
    net.fetchChampion().catch(() => null),
    net.fetchMatchup(player.look?.name, bestAttempt.opp).catch(() => null),
    net.supportsSeasons().catch(() => false),
    net.fetchAllTime(5).catch(() => null),
    dailyMode ? net.fetchDaily(bestAttempt.opp).catch(() => null) : Promise.resolve(null),
  ]).then(([rows, champion, matchup, seasonal, allTime, daily]) => {
    ui.renderGlobal(rows, {
      week: seasonal ? net.weekKey() : null,
      champion, matchup,
      matchTitle: matchup ? `${player.look?.name} vs ${bestAttempt.opp}` : null,
      // pre-migration the weekly board IS the all-time board — don't show it twice
      allTime: seasonal ? allTime : null,
      daily, dailyTitle: daily ? `📅 THE DAILY — ${bestAttempt.opp} · ${DAY_KEY}` : null,
    });
  });
  if (dailyMode) localStorage.setItem('slapp_daily', DAY_KEY);
  refreshBoards().then(() => ui.netMsg(''))
    .catch(() => ui.netMsg("Couldn't reach the county office. Rankings unavailable."));
  ui.submitState(submitted ? 'POSTED ✓' : 'POST MY SCORE', submitted || bestAttempt.pts <= 0);
  ui.bindSubmit(() => {
    if (submitted || bestAttempt.pts <= 0) return;
    const name = ui.getName();
    if (!name) { ui.netMsg('Need a name first, sugar.'); return; }
    ui.submitState('POSTING…', true);
    net.submit({ name, pts: bestAttempt.pts, dist: bestAttempt.dist, opp: bestAttempt.opp, slapper: player.look?.name })
      .then(() => {
        submitted = true;
        track('score_posted', { pts: bestAttempt.pts, dist: +bestAttempt.dist.toFixed(1), opp: bestAttempt.opp });
        ui.submitState('POSTED ✓', true);
        ui.netMsg("You're on the board. Y'all come back now.");
        return refreshBoards();
      })
      .catch(() => {
        ui.submitState('POST MY SCORE', false);
        ui.netMsg("Couldn't post — try again in a spell.");
      });
  });
}

// ---------- input ----------
// clicks or non-gameplay keys advance score screens — S/L/A/P never do, so a
// player still drumming the slap keys can't blow through their own results
function advanceScreens(code) {
  if (state === 'TOUR') return false; // the menu is click-driven; stray taps do nothing
  // the title moves on ENTER / SPACE / a tap — not any stray key (players were
  // being yanked into the pick while reaching for the world chips)
  if (state === 'TITLE') {
    if (code && code !== 'Enter' && code !== 'NumpadEnter' && code !== 'Space') return false;
    openSlapperPick();
    return true;
  }
  if (code && KEYMAP[code]) return false;
  if (state === 'RESULT' && tState > 1.0) { advance(); return true; }
  // the final scoreboard is for BROWSING — a bare tap/click must NOT advance (it
  // would steal a scroll), so only Enter/Space or the explicit NEXT button moves on.
  if (state === 'MATCH_END' && code !== 'Enter' && code !== 'NumpadEnter' && code !== 'Space') return false;
  if (state === 'MATCH_END' && tState > 1.0) {
    // a tour match hands you back to the tour, checkmark freshly inked; a boss
    // never lingers as the quick-match default. Final bosses get their payoff
    // scene (the master rests / the verdict) before the menu returns.
    if (campaign.active) {
      // Only bosses reach this verdict card (story beats resolve straight off the
      // result card in advance()). CLEARED → the outro/win beat; FAILED → the light
      // fail beat + retry. The card's other button / ESC leaves to the tour menu.
      const ch = campaign.active;
      const clearedNow = lastClearedId === ch.id; // judged on THIS match, not old checkmarks
      lastClearedId = null;
      resolveTourOutcome(ch, clearedNow);
      return true;
    }
    openOppPick();
    return true;
  }
  return false;
}

addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return; // typing a name, not playing
  // safety net: a real keypress always wakes a frozen (debug-paused) game
  if (e.isTrusted && manual) { manual = false; skipRender = false; last = performance.now(); schedule(); }
  if (e.code === 'Space') e.preventDefault();
  if (e.repeat) return;
  sfx.ensure();
  // dialogue: ENTER advances, ESC skips — stray S/L/A/P drumming can't blow
  // through a scene (the box itself stays clickable for touch)
  if (dlg.isActive()) {
    if (e.code === 'Escape') dlg.stop();
    else if (e.code === 'Enter' || e.code === 'NumpadEnter') dlg.advance();
    return;
  }
  // the DLC gallery is modal on the title: ESC closes it, everything else is swallowed
  if (!document.getElementById('dlcGallery').classList.contains('hidden')) {
    if (e.code === 'Escape') closeDlcGallery();
    return;
  }
  // ESC out of a campaign verdict returns to the TOUR menu (campaign selection),
  // not all the way to the title — you're still inside the storyline.
  if (e.code === 'Escape') { goBack(); return; }
  if (state === 'TITLE' && e.code === 'KeyT' && campaign.enabled()) { openTourMenu(); return; }
  if (state === 'SELECT_SLAPPER' || state === 'SELECT_OPP') {
    const n = state === 'SELECT_SLAPPER' ? SLAPPERS.length : OPP_LIST.length;
    const m = /^Digit([1-9])$/.exec(e.code);
    if (m) {
      const i = +m[1] - 1;
      if (i < n) { if (i === pickIndex) pickConfirmFn(); else pickHighlight(i); }
    } else if (e.code === 'ArrowRight') pickHighlight((pickIndex + 1) % n);
    else if (e.code === 'ArrowLeft') pickHighlight((pickIndex + n - 1) % n);
    else if (e.code === 'Enter' || e.code === 'Space') pickConfirmFn();
    return;
  }
  const k = KEYMAP[e.code];
  if (k && ghostActive && !e.__ghost) return; // the tape has the floor — live fingers wait
  if (k) keys[k] = true;
  advanceScreens(e.code);
});
addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) keys[k] = false;
});
// advance on a clean TAP (down + up, in place, quick) — NOT on press-down, so
// pressing-and-holding or dragging/scrolling never triggers the next screen.
let tapStart = null;
addEventListener('pointerdown', (e) => {
  if (e.isTrusted && manual) { manual = false; skipRender = false; last = performance.now(); schedule(); }
  sfx.ensure(); // audio unlock wants the earliest gesture
  if (dlg.isActive() || e.target.closest('button, a, input')) { tapStart = null; return; }
  tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
});
addEventListener('pointerup', (e) => {
  const s = tapStart; tapStart = null;
  if (!s || dlg.isActive() || e.target.closest('button, a, input')) return;
  // dismissing the unlock modal (backdrop click) is NOT a "tap to advance" —
  // cancelling a purchase pitch used to warp you straight into the volunteer pick
  if (e.target.closest('#unlockModal')) return;
  const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y);
  const held = performance.now() - s.t;
  if (moved < 14 && held < 500) advanceScreens(null); // a real tap: in place + quick
});

// ---------- camera director ----------
const camPos = new THREE.Vector3(0.5, 2.1, 4.6);
const camLook = new THREE.Vector3(0.5, 1.3, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function updateCamera(dt) {
  let p = null, l = null, snapRate = 5;
  if (state === 'SELECT_SLAPPER') {
    p = V(1.75, 1.6, 1.75);
    l = V(0.05, 1.15, 0); // lower target so tall/hatted slappers clear the top bubble
    snapRate = 6;
  } else if (state === 'SELECT_OPP') {
    // portrait framing: the player is behind the camera, the volunteer's face
    // fills the upper half above the card dock — big folks get a wider shot
    const wf = Math.max(0, ((opponent.arch && opponent.arch.w) || 1) - 1);
    p = V(-0.15 - wf * 0.9, 1.72 + wf * 0.35, 1.25 + wf * 1.3);
    l = V(0.92, 1.5 + wf * 0.2, 0);
    snapRate = 6;
  } else if (state === 'TITLE') {
    const a = performance.now() / 4500;
    p = V(0.5 + Math.cos(a) * 4.6, 2.1, Math.sin(a) * 4.6);
    l = V(0.5, 1.4, 0);
    snapRate = 20;
  } else if (state === 'FACEOFF') {
    const t = Math.min(tState / 2.3, 1);
    const e = t * t * (3 - 2 * t);
    p = V(2.4, 1.75, 1.2).lerp(V(0.4, 1.95, 4.2), e);
    l = V(0.85, 1.6, 0).lerp(V(0.5, 1.35, 0), e);
    snapRate = 14;
  } else if (state === 'SWING') {
    p = V(0.4 + Math.sin(tState * 0.7) * 0.12, 1.95, 4.2);
    l = V(0.5, 1.35, 0);
  } else if (state === 'IMPACT') {
    p = V(1.5, 1.7, 2.1);
    l = contact ? contact.point : V(0.8, 1.5, 0);
    snapRate = 8;
  } else if (state === 'FLIGHT') {
    // the camera STAYS with the flyer: rises with high arcs, slides with
    // sideways drift — you never lose sight of the person you just launched
    const b = opponent.pelvisPos();
    // trail straighter behind and look DOWNRANGE of the flyer: keeps the ring's
    // barn/conifers at the frame edge and drops the flyer into the lower third
    // with the open lane + horizon ahead — every launch reads as "going somewhere"
    p = V(b.x - 6.5, Math.max(2.8, b.y + 1.4), b.z + 4.0);
    l = V(b.x + 3, Math.max(b.y, 0.7), b.z);
  } else { // FOULED / RESULT / MATCH_END — linger where the action ended
    if (opponent.launched) {
      const b = opponent.pelvisPos();
      p = V(b.x - 3.5, 2.2, b.z + 4.2);
      l = V(b.x, 0.6, b.z);
    } else {
      p = V(0.4, 1.9, 4.2);
      l = V(0.5, 1.1, 0);
    }
    snapRate = 2.5;
  }
  // the ascension steals the show: camera rises with the emperor
  if (player.ascending && player.ascendT < 5) {
    const py = Math.min(player.root.position.y, 10);
    p = V(2.6, 1.9 + py * 0.9, 3.9);
    l = V(0.3, 1.3 + py, 0);
    snapRate = 5;
  }
  const f = 1 - Math.exp(-snapRate * dt);
  camPos.lerp(p, f);
  camLook.lerp(l, f);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  // FOV punch-in during the slow-mo impact
  // FOV punch-in on impact — and a HARDER punch on a heavy hit (the zoom sells
  // the hit-stop: freeze + lens lunge reads as force, not lag)
  const targetFov = state === 'IMPACT' ? (contact && contact.power >= 18 ? 39 : 44) : 55;
  if (Math.abs(camera.fov - targetFov) > 0.05) {
    camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-9 * dt));
    camera.updateProjectionMatrix();
  }
}

// ---------- main loop ----------
let last = 0;
let manual = false;
let skipRender = false;
function schedule() {
  if (manual) return;
  // rAF is throttled to zero in hidden tabs; keep simulating so the game
  // (and scripted playtests) survive being backgrounded mid-flight
  if (document.hidden) setTimeout(() => tick(performance.now()), 33);
  else requestAnimationFrame(tick);
}

// --- ICE CATCH (Cocytus, INFERNO) — COLD-HAND CARMINE's toll: catch his thrown
// ice with an OPEN PALM. Reuses the swing: bring the open palm to the strike zone
// as a cube arrives (time it like a slap). Deterministic (no RNG) so it's fair
// AND testable. A closed fist bats it away; a late/early palm misses. The cubes
// melt to nothing later — that's the whole joke. Kinematic meshes, pooled. ---
const iceCubes = [];
const cubePool = [];
const rowCubes = []; // the "tidy row" the player builds — then it melts (the joke)
let catchCount = 0, catchMiss = 0, catchThrowT = 0, catchThrown = 0;
// set a caught cube down in a growing line at the player's feet (the tidy row)
function placeInRow(mesh) {
  const b = player.root.position;
  mesh.visible = true; mesh.scale.setScalar(1); mesh.rotation.set(0.2, 0.4, 0);
  if (mesh.material) mesh.material.opacity = 0.82;
  mesh.position.set(b.x + 0.5, 0.1, b.z - 0.55 - rowCubes.length * 0.24);
  rowCubes.push(mesh);
}
// ...and this is Hell: the row melts to nothing. Shrink + fade over ~1.5s, then pool.
function meltRow() {
  const cubes = rowCubes.splice(0);
  let t = 0;
  const iv = setInterval(() => {
    t += 0.05;
    const s = Math.max(0, 1 - t / 1.5);
    cubes.forEach((m) => { m.scale.setScalar(s); m.position.y = 0.1 * s; if (m.material) m.material.opacity = 0.82 * s; });
    if (t >= 1.5) { clearInterval(iv); cubes.forEach((m) => { m.visible = false; cubePool.push(m); }); }
  }, 50);
}
const CATCH_PERIOD = 1.7, CATCH_DUR = 1.5; // slower cadence + flight so the throw is trackable
function makeCube() {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3), // bigger so the throw READS across the arena
    new THREE.MeshStandardMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.85, roughness: 0.08, metalness: 0.15, emissive: 0x5ab0e0, emissiveIntensity: 0.55 }));
  m.visible = false; scene.add(m);
  return m;
}
function resetCatch() {
  for (const c of iceCubes) { c.mesh.visible = false; cubePool.push(c.mesh); }
  for (const m of rowCubes) { m.visible = false; cubePool.push(m); }
  iceCubes.length = 0; rowCubes.length = 0; catchCount = 0; catchMiss = 0; catchThrown = 0;
  catchThrowT = CATCH_PERIOD - 0.55; // first cube arrives shortly after the swing opens
}
function throwCube() {
  const mesh = cubePool.pop() || makeCube();
  mesh.visible = true;
  // the projectile takes the thrower's colors: ice by default, or e.g. Yusuf's
  // DATES (arch.cubeColor + a warm glow). Pool meshes get retinted every spawn.
  const cc = opponent.arch.cubeColor;
  mesh.material.color.setHex(cc || 0xbfe9ff);
  mesh.material.emissive.setHex(cc ? (opponent.arch.cubeGlow || 0x3a2412) : 0x5ab0e0);
  const hc = opponent.headPos();
  // Carmine HURLS it: a big, high, SLOW lob from his raised hand that sails up and
  // arcs down into a CATCH ZONE out in front of the player, at the palm's reach.
  // Tall + slow (see CATCH_DUR / the sine arc) so it reads as a real incoming
  // projectile you track and intercept, even though the ring is tight.
  const from = new THREE.Vector3(hc.x + 0.5, hc.y + 1.7, -0.25);
  const to = new THREE.Vector3(player.root.position.x + 0.58, 1.42, 0);
  iceCubes.push({ mesh, t: 0, from, to, caught: false, live: true });
  catchThrown++;
}
// closest point on segment p0→p1 to point c (for the swept catch test)
function segSphereClosest(p0, p1, c) {
  const d = new THREE.Vector3().subVectors(p1, p0);
  const len2 = d.lengthSq();
  const t = len2 > 0 ? THREE.MathUtils.clamp(new THREE.Vector3().subVectors(c, p0).dot(d) / len2, 0, 1) : 0;
  return p0.clone().addScaledVector(d, t);
}
function updateCatch(dt) {
  // the toll is a fixed WAVE of ice — not a countdown. End when it's caught or spent.
  const wave = (campaign.active && campaign.active.goal && campaign.active.goal.type === 'catch') ? campaign.active.goal.v + 5 : 8;
  catchThrowT += dt;
  if (catchThrowT >= CATCH_PERIOD && catchThrown < wave) { catchThrowT = 0; throwCube(); }
  const seg = player.handSeg; // {p0,p1} — the hand's SWEPT path this frame (beats tunneling)
  for (const c of iceCubes) {
    if (!c.live) continue;
    c.t += dt / CATCH_DUR;
    const k = Math.min(1, c.t);
    const p = c.from.clone().lerp(c.to, k);
    p.y += Math.sin(Math.PI * k) * 1.9; // a big, readable toss-arc (tall so it reads as incoming)
    c.mesh.position.copy(p);
    c.mesh.rotation.x += dt * 7; c.mesh.rotation.y += dt * 5;
    // cube velocity, analytically from its path (deterministic — no dynamic body)
    const dkdt = 1 / CATCH_DUR;
    const cubeVel = new THREE.Vector3().subVectors(c.to, c.from).multiplyScalar(dkdt);
    cubeVel.y += 0.4 * Math.PI * Math.cos(Math.PI * k) * dkdt;
    // closest distance from the cube to the hand's SWEPT path (or the live point)
    let d = 9;
    if (seg) { const q = segSphereClosest(seg.p0, seg.p1, p); d = q.distanceTo(p); }
    else d = player.handPos.distanceTo(p);
    if (!c.caught && c.t > 0.6 && player.pUnlocked && d < 0.33) {
      c.caught = true; c.live = false;
      // SOFT HANDS: catch quality = how well the hand moves WITH the cube. A gentle
      // reach (low relative speed) CRADLES it clean; a hard SWING slams into it and
      // BATS it away. The slap engine used wrong, mastered anyway — a hard wind-up
      // ruins a catch. This is the catch analog of the slap's cq/give grade.
      const relSpeed = player.handVel.distanceTo(cubeVel);
      const cGive = THREE.MathUtils.clamp(1 - relSpeed / 9, 0, 1);   // ~9 m/s (full slap) = a hard bat
      const cCenter = 1 - THREE.MathUtils.clamp(d / 0.30, 0, 1);
      if (cGive >= 0.28) {
        catchCount++;
        const clean = cGive >= 0.62 && cCenter >= 0.5;
        placeInRow(c.mesh); // set it down in the tidy row (it'll melt later)
        ui.slapBurst(clean ? 'CLEAN CATCH — SOFT HANDS!' : 'BOBBLE… SAVED!', `${catchCount} SET DOWN IN A TIDY ROW`);
        sfx.crack(0.22 + 0.15 * cGive);
        player.leanV += (1 - cGive) * 0.9; // a stiff catch shoves you (Newton's 3rd); soft hands absorb it
        const goal = campaign.active && campaign.active.goal;
        if (goal && goal.type === 'catch' && catchCount >= goal.v) { finishCatchStage(); return; }
      } else {
        // BATTED: you swung too hard — the cube rockets off, no catch
        c.mesh.visible = false; cubePool.push(c.mesh); catchMiss++;
        ui.slapBurst('BATTED IT AWAY!', 'A CATCH IS A SOFT REACH — NOT A SLAP');
        sfx.crack(0.5); stage.spawnShock(p);
      }
    } else if (c.t > 1.32) { // fell back into the lake, uncaught
      c.live = false; c.mesh.visible = false; cubePool.push(c.mesh);
      catchMiss++;
    }
  }
  for (let i = iceCubes.length - 1; i >= 0; i--) if (!iceCubes[i].live) iceCubes.splice(i, 1);
  // the whole wave has been thrown and resolved and the toll wasn't met → verdict
  if (catchThrown >= wave && iceCubes.length === 0) finishCatchStage();
}
// a catch stage ends the instant the toll is paid (or the clock runs out) — one
// verdict, no 3-attempt loop: you either filed the row or you didn't
function finishCatchStage() {
  const arch = opponent.arch;
  const cleared = campaign.active
    ? campaign.checkAttempt({ dist: 0, pts: 0, part: null, fist: false, catches: catchCount, chainPct: 0, oppKey: arch.key, bulwarkPts: 0 })
    : null;
  if (cleared) lastClearedId = cleared.id;
  const won = !!cleared;
  const bestAttempt = { dist: 0, pts: 0, foul: null, part: null, opp: arch.name };
  attempts.push(bestAttempt);
  iceCubes.forEach((c) => { c.mesh.visible = false; cubePool.push(c.mesh); }); iceCubes.length = 0;
  meltRow(); // ...and the tidy row you built goes to nothing. The Exertion of Pointlessness.
  ui.hideCards();
  const line = won
    ? `❄️ ${catchCount} CAUGHT — every cube set down in a tidy row. The lake lets you pass.`
    : `Only ${catchCount} caught before the ice ran out. Carmine wants his toll.`;
  const tourCtx = campaign.active ? { title: campaign.active.title, goal: campaign.active.desc, cleared: won } : null;
  ui.showMatch({ bestAttempt, line, board, shareUrl: null, tour: tourCtx });
  if (won) sfx.fanfare();
  setState('MATCH_END');
}

function tick(now) {
  schedule();
  let dt = Math.min(Math.max((now - last) / 1000, 0) || 0, 1 / 30);
  last = now;
  // ghost playback runs on a LOCKED 60fps step, like drive(): real rAF dt
  // wobbles (resizes, slow frames) shifted the P-press/contact race by a frame
  // and the same tape landed 40m or 17m. One clock, one outcome, every replay.
  if (ghostActive) dt = 1 / 60;
  // cutscene: the match clock freezes, the world stays alive (breathing, sway),
  // and the camera runs a close-up on whoever is speaking
  if (dlg.isActive()) {
    opponent.update(dt);
    const shot = dlg.currentShot();
    // SLAP THERAPY cat gag: the cat leans in & slow-blinks while it's the subject
    // ('cat'/'catno'); the tent facepalms on the "NO!!!" and reaction beats.
    if (campaign.active && stage.setCatCine) {
      stage.setCatCine(shot === 'cat' || shot === 'catno');
      stage.setCatReact(shot === 'catno' || shot === 'facepalm');
    }
    if (shot !== 'wide') {
      // 3/4 close-up on whoever is speaking: face + a shoulder, slightly above
      const tgt = new THREE.Vector3();
      let off, snap = 5;
      if (shot === 'opp') { tgt.copy(opponent.headPos()); off = new THREE.Vector3(-1.35, 0.3, 0.95); }
      else if (shot === 'spirit') { tgt.copy(stage.cinePoints.spirit()); off = new THREE.Vector3(1.4, 0.2, 1.0); }
      else if (shot === 'judge') { tgt.copy(stage.cinePoints.judge()); off = new THREE.Vector3(1.35, 0.3, 1.0); }
      else if (shot === 'bruce') { tgt.copy(stage.cinePoints.bruce()); off = new THREE.Vector3(-1.35, 0.25, 1.0); }
      else if (shot === 'cat') { tgt.copy(stage.cinePoints.cat()); off = new THREE.Vector3(-3.4, 1.0, 3.4); }
      // "NO!!!" — a hard, low push-in on the recoiling tent (dramatic angle)
      else if (shot === 'catno') { tgt.set(2.3, 1.35, -1.4); off = new THREE.Vector3(0.5, -0.15, 3.0); snap = 9; }
      // hold wide on the whole tent burying its face in its hands
      else if (shot === 'facepalm') { tgt.set(2.3, 1.5, -1.4); off = new THREE.Vector3(0.7, 1.5, 5.4); }
      else { player.headMesh.getWorldPosition(tgt); off = new THREE.Vector3(1.35, 0.3, 0.95); }
      camera.position.lerp(tgt.clone().add(off), 1 - Math.exp(-snap * dt));
      camera.lookAt(tgt);
    }
    if (!skipRender) renderer.render(scene, camera);
    return;
  }
  const dts = dt * timeScale;
  tState += dt;

  if (state === 'FACEOFF') {
    if (tState > 2.4) {
      ui.bubble(null);
      ui.intro(null);
      ui.refBar(null); // quip/judge line is faceoff-only — it must never sit on the meters
      ui.showMeters(true);
      opponent.setTargetVisible(true);
      // officiated (campaign) matches: the judge's whistle IS the shot clock —
      // one long blast at the exact frame the shot clock starts running
      if (campaign.active) { sfx.whistle('start'); ui.coach(null); }
      // THE GREAT ESCAPE: the whistle is her cue too — she pushes off for the gate
      if (opponent.arch.skiRun) opponent.beginEscape();
      if (calledHigh !== null) ui.slapBurst(calledHigh ? 'DALE CALLS: HIGH CHEEK!' : 'DALE CALLS: LOW CHEEK!', 'ONLY THE CALLED HALF COUNTS — LAND IT FLUSH');
      if (opponent.arch.bulwark) ui.bulwark(Math.max(0, Math.ceil(100 - bulwarkPts / (opponent.arch.bulwark.threshold / 100))), opponent.arch.bulwark.label, opponent.arch.bulwark.sprungCry);
      surgeFired = false; // reset Chuck's Second Wind telegraph for this attempt
      if (opponent.arch.throwIce) resetCatch(); // fresh row of ice to catch
      if (ghostTape) { beginGhost(ghostTape); ghostTape = null; }
      setState('SWING');
    }
  } else if (state === 'SWING') {
    // ghost pump: replay the rival's tape on the sim clock, key-for-key
    if (ghostActive) {
      ghostT += dts * 1000;
      // one-frame lookahead: the original often pressed P and made contact in
      // the SAME frame — replayed a frame late, contact wins the race and the
      // palm never opens (40m became 9m). Early by ≤17ms is inside every grade
      // window's tolerance; late by one frame can erase the palm entirely.
      while (ghostQueue.length && ghostQueue[0][0] <= ghostT + 17) {
        const [, code, down] = ghostQueue.shift();
        const k = KEYMAP[code]; if (k) keys[k] = down;
      }
    }
    player.update(dts, keys);
    swingT += dts;
    // tape recorder: log every S/L/A/P transition (engine-agnostic — sees keys[],
    // so human play, touch buttons and drive() all record identically)
    for (const k in tapePrev) if (keys[k] !== tapePrev[k]) {
      tapePrev[k] = keys[k];
      if (tapeRec.length < 48) tapeRec.push([Math.round(swingT * 1000), k, keys[k]]);
    }
    sfx.whoosh(player.handSpeed);
    ui.setMeters(player.lean);
    // Chuck's Second Wind: the instant the 4-second quiet ends, the crowd chants
    // and he surges — telegraphed by a banner, a crowd roar, and his red aura
    const swArch = opponent.arch.secondWind;
    if (swArch && !surgeFired && tState >= swArch.delay) {
      surgeFired = true;
      opponent.setSurge(true);
      sfx.crowd(3);
      stage.shake(0.5);          // the surge HITS — a real power-up jolt
      stage.sunMood('meh', 3);   // even the sun braces
      ui.slapBurst('SECOND WIND!', `STRIKE WAS IN THE QUIET — NOW BRING A ${swArch.gate}% CHAIN`);
    }

    // --- a fresh S press after a spent/misfired swing starts a clean slap ---
    if (!prevKeys.s && keys.s && (chain.tRel !== null || chain.l || chain.a || chain.p || chain.lPend !== undefined)) {
      player.rearm();
      resetChain();
    }

    // --- grade each chain link the instant it fires ---
    if (prevKeys.s && !keys.s && chain.tRel === null) {
      chain.tRel = swingT;
      // an L that was rolled in just before the release gets judged now
      if (chain.lPend !== undefined && !chain.l) { const dt = chain.lPend - chain.tRel; setHips(gradeL(dt)); popGrade(chain.l, dt); }
    }
    if (!prevKeys.l && keys.l && !chain.l && chain.lPend === undefined) {
      if (chain.tRel === null) {
        chain.lPend = swingT;
        ui.chainSet('hips', '...', 0);
      } else {
        const dt = swingT - chain.tRel;
        setHips(gradeL(dt));
        popGrade(chain.l, dt);
      }
    }
    if (!prevKeys.a && keys.a && !chain.a) {
      chain.a = gradeA(-player.phaseVel);   // phase*: mode-aware (chop grades the DROP, slap the spine whip)
      ui.chainSet('arm', chain.a.label, chain.a.tier);
      popGrade(chain.a);
    }
    if (!prevKeys.p && keys.p && !chain.p) {
      chain.p = gradeP(player.phaseAngle, player.phaseVel);
      ui.chainSet('snap', chain.p.label, chain.p.tier);
      // the God-run beat: every link PERFECT on a deep coil = FULL CHAIN
      if (chain.p.tier === 3 && chain.l && chain.l.tier === 3 && chain.a && chain.a.tier === 3 && chain.coil >= 0.9) {
        ui.gradePop('FULL CHAIN!', 4);
        sfx.grade(4);
      } else popGrade(chain.p);
    }

    // live coil readout until the hips lock it in (it leaks while you wait)
    const coilPct = Math.round(player.coilFrac * 100);
    if (!chain.l) ui.chainSet('coil', `${coilPct}%`, 0);

    // --- cues + coaching: exactly one key pulses — the one the moment wants ---
    const phase = player.phaseAngle;
    const snapCue = !chain.p && player.phaseVel < -2 && phase < 1.3 && phase > -0.45;
    // ring: yellow = wait, green = GOOD window, bright flashing = PERFECT core
    const snapLvl = snapCue ? (phase <= 0.9 && phase > -0.1 ? 2 : 1) : 0;
    let wanted = null;
    if (chain.tRel === null) wanted = keys.s ? (coilPct >= 90 ? 'release' : null) : 's';
    else if (!chain.l) wanted = 'l';
    else if (!chain.a) wanted = 'a';
    else if (!chain.p && snapCue) wanted = 'p';
    ui.setKeys(keys, wanted);
    opponent.setTargetHot(snapLvl);
    if (player.mode === 'chop') {
      // KARATE CHOP stage — a vertical DOWNWARD edge-strike, same 4-beat rhythm.
      if (chain.tRel === null) ui.coach(keys.s ? `RAISING... ${coilPct}% — HOLD [S], OVERHEAD` : 'HOLD [S] — RAISE THE HAND OVERHEAD (this one takes a CHOP, not a slap)');
      else if (!chain.l) ui.coach('TAP [L] — DROP YOUR WEIGHT INTO IT!');
      else if (!chain.a) ui.coach('PRESS [A] — SNAP THE FOREARM DOWN!');
      else if (!chain.p) ui.coach(snapCue ? '[P]!! EDGE!!' : 'WAIT FOR THE GREEN RING... THEN [P] — ROLL THE EDGE');
      else ui.coach(null);
      shotClock -= dts;
      ui.setClock(shotClock);
    } else if (opponent.arch.throwIce) {
      // CATCH STAGE: no slapping, no countdown — the toll is a WAVE of ice to catch.
      const need = (campaign.active && campaign.active.goal && campaign.active.goal.type === 'catch') ? campaign.active.goal.v : 3;
      ui.coach(`❄️ CATCH THE ICE — OPEN THE PALM [P] AS IT ARRIVES, DON'T SLAP  ·  CAUGHT ${catchCount}/${need}`);
      ui.setClock(null);
      ui.showMeters(false); // NO slap HUD (S·L·A·P keys / chain / balance) — this isn't a slap
    } else if (opponent.arch.bodyBlow) {
      // BODY-BLOW boss (THE CLOSED FIST school): a PUNCH, not a slap. Guide the
      // chain but WARN OFF the palm — an open palm is no-sold here.
      if (chain.tRel === null) ui.coach(keys.s ? `WINDING UP... ${coilPct}% — HOLD [S]` : 'HOLD [S] — WIND UP (this one takes a FIST, not a slap)');
      else if (!chain.l) ui.coach('TAP [L] — LUNGE THE HIPS!');
      else if (!chain.a) ui.coach('PRESS [A] — THROW THE FIST!  ·  do NOT press [P] — keep it CLOSED');
      else ui.coach('LAND THE CLOSED FIST — opening the palm [P] just slides off him');
      shotClock -= dts;
      ui.setClock(shotClock);
    } else if (!chain.l && Math.abs(player.lean) > 0.7) {
      // OFF-BALANCE before you commit the lunge (often left over from the last
      // swing's recoil) — bracing is still possible, and a teetering stance is
      // the biggest hidden power leak. Teach it live, the way the green ring
      // teaches the palm. Only pre-lunge (once L fires the lean IS the swing).
      ui.coach('⚖️ BRACE! — YOU\'RE OFF-BALANCE, AND A TEETERING STANCE SLAPS SOFT (up to −45%). SETTLE, THEN LUNGE');
      shotClock -= dts;
      ui.setClock(shotClock);
    } else {
      if (chain.tRel === null) {
        if (keys.s) ui.coach(coilPct >= 90 ? 'FULL SWIVEL! LET GO OF [S]!' : `SWIVELING... ${coilPct}% — HOLD [S], DEEPER!`);
        else ui.coach('STEP 1: HOLD [S] — SWIVEL THE SPINE');
      } else if (!chain.l) ui.coach('TAP [L] — LUNGE THE HIPS! (SWIVEL IS DRAINING)');
      else if (!chain.a) ui.coach('PRESS [A] — THROW THE ARM!');
      else if (!chain.p) ui.coach(snapCue ? '[P]!! PALM!!' : 'WAIT FOR THE GREEN RING... THEN [P]');
      else ui.coach(null);
      shotClock -= dts;
      ui.setClock(opponent.arch.skiRun ? null : shotClock); // her run IS the clock
    }
    if (player.fallen) foul('footing');
    else if (opponent.escaped()) foul('escape'); // she made the gate — instant fail, no 10s grace
    else if (shotClock <= 0 && !opponent.arch.skiRun) { if (opponent.arch.throwIce) finishCatchStage(); else foul('clock'); }
    else if (opponent.arch.throwIce) updateCatch(dts); // CATCH STAGE: no slap-launch — catch Carmine's ice
    else if (player.handSeg && (player.pUnlocked || (player.aUnlocked && player.handSpeed >= 3))) {
      // a CLOSED fist is not a ghost (lesson #6: whatever touches, reacts) —
      // a fast fist lands as a discounted, disapproved punch (onContact fist
      // path). The ≥3 m/s gate keeps a parked fist from re-triggering while
      // it rests inside someone's face.
      // CHOP mode has no fist form — the hand is an EDGE either way. A P-less
      // drop is a lazy chop (pg grades it NONE, 0.6×), not a secret punch that
      // bypasses the chop's spike-down + grading entirely (which let a mash
      // "punch" clear the chop boss).
      const fist = !player.pUnlocked && player.mode !== 'chop';
      // rHand = the hand's TRUE reach past the wrist path (palm + fingers ≈
      // 0.14m; knuckles ≈ 0.10). It was 0.26 — a beach-ball hand that launched
      // volunteers from visibly short of the cheek. Contact happens where
      // contact LOOKS like it happens. The honest radius needs an honest
      // SWEEP: at 14 m/s the hand crosses 0.24m between frames — more than
      // the contact margin on deep matchups — so we also test the tip's and
      // heel's paths since last frame. Without this, whether Roy's perfect
      // swing touched Hoss was 60fps roulette.
      // fist 0.13 (was 0.10): a closed-fist punch never opens the elbow, so the
      // folded arm stops ~7cm short of the cheek — at 0.10 the contact margin was
      // ~1mm and punches whiffed on tiny timing wobble (60fps roulette). 0.13
      // (still < the palm's 0.14, so the open hand keeps its reach edge) gives an
      // honest fist+forearm envelope that lands reliably. Palm unchanged.
      // scale the contact radius with the VISIBLE mitt: handG is scaled up for
      // big-arm slappers (bigArms/slapArm), so a fixed 0.14 let the giant hand
      // sweep ~14cm through the cheek before the palm-center reached the sphere.
      const rh = (fist ? 0.13 : 0.14) * player.handG.scale.x;
      const { p0, p1 } = player.handSeg;
      const hit = opponent.checkHit(p0, p1, rh)
        || (prevHandSeg && opponent.checkHit(prevHandSeg.p1, p1, rh))
        || (prevHandSeg && opponent.checkHit(prevHandSeg.p0, p0, rh));
      if (prevHandSeg) { prevHandSeg.p0.copy(p0); prevHandSeg.p1.copy(p1); }
      else prevHandSeg = { p0: p0.clone(), p1: p1.clone() };
      if (hit) onContact(hit, fist);
    } else prevHandSeg = null; // hand idle (or re-armed): never sweep across that gap
  } else if (state === 'IMPACT') {
    // hit-stop: the world holds its breath (timeScale 0), then the slow-mo runs
    if (hitstopT > 0) { hitstopT -= dt; timeScale = 0; }
    else timeScale = 0.13;
    player.update(dts, keys);
    if (tState > 0.55) {
      timeScale = 1;
      setState('FLIGHT');
    }
  } else if (state === 'FLIGHT') {
    player.update(dts, keys);
    ui.showDistance(opponent.distance());
    dustCool -= dt;
    const pel = opponent.pelvisPos();
    if (dustCool <= 0 && pel.y < 0.5 && opponent.rag.maxSpeed() > 3) {
      stage.spawnDust(pel, 1 + Math.min(1, opponent.rag.maxSpeed() / 12));
      dustCool = 0.3;
    }
    // --- distance milestones: shareable spectacle ---
    if (!barricadeHit && pel.x > stage.START_X + 20) {
      barricadeHit = true;
      stage.breakBarricade(Math.max(4, opponent.rag.maxSpeed() * 0.6));
      sfx.crash();
      stage.shake(0.3);
      excite = Math.min(1, excite + 0.5);
      ui.slapBurst('THROUGH THE BARRICADE!', '');
      stage.sunMood('happy', 4);
    }
    // THE TAR PIT: first touchdown throws a SPLAT — flung tar, a splash ring,
    // and a permanent stain that claims the body where it stops (the pit keeps
    // what it catches, visibly)
    if (!tarSplatted && activeWorld === 'tarpit' && pel.y < 0.55 && opponent.rag.maxSpeed() > 2) {
      tarSplatted = true;
      stage.tarSplat(pel);
      stage.shake(0.15);
      sfx.crash();
    }
    // LAVA LAND: drift off the crust causeway into the molten sea and the
    // volunteer is FLAME-BROILED — a real reaction, not a silent pass-through
    if (!lavaBurned && activeWorld === 'lava' && Math.abs(pel.z) > 6.5 && pel.x > stage.START_X + 2 && pel.y < 3) {
      lavaBurned = true;
      stage.lavaBurst(pel);
      sfx.crack(1); sfx.crash();
      stage.shake(0.4);
      excite = Math.min(1, excite + 0.4);
      ui.slapBurst('FLAME-BROILED!', 'INTO THE MOLTEN SEA — WELL DONE');
      if (slap) slap._lavaBurned = true;
    }
    // in the DOJO, a body that reaches the 62m wall RINGS THE GREAT GONG —
    // the SLAPMASTER bar, heard before it's told
    if (!gongRung && stage.isDojoUp() && pel.x > 60) {
      gongRung = true;
      sfx.gong();
      stage.ringGong();
      stage.shake(0.35);
    }
    // 10m: DOUBLE DIGITS — the beginner's first payoff. Mash lands ~2m and a
    // careful first-timer ~10-20m, so this is the first "the crowd saw that"
    // beat most new players can actually reach (everything else started at 20m).
    if (!popDone && opponent.distance() > 10) {
      popDone = true;
      sfx.crowd(1);
      stage.kidsCelebrate(2);
      excite = Math.min(1, excite + 0.3);
      // banner only when the flight is topping out here (the beginner's case) —
      // a 40m rocket crosses this line at speed and gets the barricade banner
      // half a second later; two bursts back-to-back is flicker, not fanfare
      if (opponent.rag.maxSpeed() < 9) ui.slapBurst('DOUBLE DIGITS!', 'THE CROWD LOOKS UP FROM ITS CORN DOGS');
    }
    if (!mooDone && opponent.distance() > 30) {
      mooDone = true;
      sfx.moo();
      stage.cowMoo();
      stage.kidsCelebrate(4); // the children leap for joy
      ui.coach('THE COW APPROVES. MOO.');
    }
    // 40m: a slap angel and a slap devil materialize to dispute your technique
    if (!duelDone && opponent.distance() > 40) {
      duelDone = true;
      stage.slapDuel(pel.x);
      sfx.choir();
      excite = Math.min(1, excite + 0.4);
      ui.slapBurst('THE HEAVENS DISPUTE!', 'AN ANGEL AND A DEVIL — ARGUING OVER YOUR FORM');
      for (let i = 0; i < 6; i++) setTimeout(() => sfx.crack(0.22), 750 + i * 550);
    }
    // NOTE: SLAPMASTER and EMPEROR honors are awarded at showResult — the crowd
    // gets to SEE where he lands before any ceremony starts
    // 80m: he is officially no longer this county's problem
    if (!countyDone && pel.x > stage.START_X + 80) {
      countyDone = true;
      excite = 1;
      ui.smack('COUNTY LINE!', 'gold');
      ui.coach('HE HAS LEFT THE JURISDICTION');
      sfx.fanfare();
      sfx.crowd(3);
      stage.spawnConfetti(pel);
    }
    // a flyer barging through the flock: feathers, outrage, evacuation
    if (stage.isHauntedUp() && stage.spookGhosts(pel)) sfx.wail();
    if (stage.scareBirds(pel)) sfx.squawk();
    // an ABSORBED bulwark hit never launches — the body is PLANTED (and the
    // shudder keeps maxSpeed up, so the settle test below would never fire). It
    // has nothing to travel or settle: give the ABSORBED beat a moment, resolve.
    if (!opponent.launched) {
      if (tState > 1.5) showResult();
    } else {
      if (opponent.rag.maxSpeed() < 0.6) settleT += dt; else settleT = 0;
      // never call the result while he's still visibly travelling — a monster slap
      // can tumble a long time, and a stale card looks like a scoring bug. The
      // tState floor guarantees even a dead-stop crash gets its moment on camera.
      if (tState > 2.2 && (settleT > 1.2 || (tState > 12 && opponent.rag.maxSpeed() < 1.2) || tState > 20)) showResult();
    }
  } else if (state === 'FOULED') {
    player.update(dts, keys);
    if (tState > 2.2) showResult();
  } else if ((state === 'RESULT' || state === 'MATCH_END') && (player.fallen || player.ascending)) {
    player.update(dts, keys); // keep collapsed ragdolls and ascending emperors moving
  }

  // the held-back result card lands once the moment has been witnessed
  if (state === 'RESULT' && pendingCard && tState >= cardDelay) {
    ui.showResult(pendingCard);
    pendingCard = null;
  }

  phys.world.step(1 / 120, dts, 6);
  prevKeys.s = keys.s; prevKeys.l = keys.l; prevKeys.a = keys.a; prevKeys.p = keys.p;
  opponent.update(dt);
  excite = Math.max(0, excite - dt * 0.25);
  // applause: clap-cluster density scales with excitement, plus loose cheers
  sfx.setBed(excite);
  clapT -= dt;
  if (excite > 0.2 && clapT <= 0) {
    sfx.clap();
    clapT = 0.09 + Math.random() * (0.4 - excite * 0.25);
  }
  swellT -= dt;
  if (excite > 0.55 && swellT <= 0) {
    sfx.cheerlet();
    swellT = 0.9 + Math.random() * 1.5;
  }
  stage.updateCrowd(now / 1000, excite);
  stage.updateAmbient(dt, now / 1000);
  updateCamera(dt);
  stage.trackSun(camLook.x);
  stage.updateFX(dts, camera);
  stage.applyShake(dt, camera);
  if (!skipRender) renderer.render(scene, camera);
}
schedule();
addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });

// debug/verification handle
window.__slapp = {
  stage, // scene/camera handle for visual debugging (freeze + reposition camera)
  get state() { return state; },
  get pickIndex() { return pickIndex; },
  get attempts() { return attempts; },
  get keys() { return keys; },
  player: () => player,
  opponent: () => opponent,
  // preview any slapper by key (incl. locked DLC) without exposing it in the pick UI
  setLook: (key) => setLook(SLAPPERS.find((s) => s.key === key) || SLAPPERS[0]),
  // tour (campaign) test hooks
  get tour() { return { enabled: campaign.enabled(), active: campaign.active ? campaign.active.id : null, progress: campaign.progress() }; },
  tourReset: () => { campaign.reset(); return campaign.progress(); },
  // test seam: jump straight into a match vs any ROSTER arch (incl. campaign-only
  // bosses) — pairs with .drive() for scripted mechanic audits without menu-walking
  _vs: (key) => {
    const a = ROSTER.find((r) => r.key === key); if (!a) return 'no such opp';
    chosenArch = a; startMatch(); return 'match vs ' + a.name;
  },
  // DLC dev backdoor: unlock/relock without paying (Phase 2 replaces with real codes)
  unlock: (key) => { unlock(key); return [...unlocks]; },
  relock: (key) => { unlocks = key ? unlocks.filter((k) => k !== key) : []; localStorage.setItem('slapp_unlocks', JSON.stringify(unlocks)); return [...unlocks]; },
  get unlocks() { return [...unlocks]; },
  dist: () => opponent.distance(),
  get catches() { return { caught: catchCount, missed: catchMiss, thrown: catchThrown, live: iceCubes.length }; },
  get chainState() { return chain; },
  get bestScore() { return bestPts(); },
  get milestones() { return { popDone, barricadeHit, mooDone, duelDone, masterDone, emperorDone, countyDone, barricadeBroken: stage.isBarricadeBroken(), sun: stage.currentSunMood(), ascending: player.ascending }; },
  animals: () => stage.animals,
  // pause/resume the live loop (for freeze-frame screenshots)
  freeze(on) {
    manual = !!on;
    if (!on) { last = performance.now(); schedule(); }
  },
  // deterministic replay: steps the sim synchronously at 60fps with a scripted
  // key timeline [[ms, code, isDown], ...] — immune to hidden-tab throttling
  drive(events, seconds) {
    manual = true;
    skipRender = true;
    const pending = [...events].sort((a, b) => a[0] - b[0]);
    const stepMs = 1000 / 60;
    const frames = Math.ceil(seconds * 60);
    const t0 = last;
    const log = [];
    let prevState = state;
    let peak = 0, contactSpeed = 0;
    for (let i = 0; i < frames; i++) {
      const sim = (i + 1) * stepMs;
      while (pending.length && pending[0][0] <= sim) {
        const [, code, down] = pending.shift();
        dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code }));
      }
      if (i === frames - 1) skipRender = false;
      tick(t0 + sim);
      if (state === 'SWING') peak = Math.max(peak, player.handSpeed);
      if (state !== prevState) {
        if (state === 'IMPACT') contactSpeed = player.handSpeed;
        log.push([Math.round(sim), state]);
        prevState = state;
      }
    }
    manual = false;
    return { log, peak: +peak.toFixed(1), contactSpeed: +contactSpeed.toFixed(1),
      state, attempts: attempts.map(a => ({ dist: +a.dist.toFixed(2), foul: a.foul })),
      dist: +opponent.distance().toFixed(2), fallen: player.fallen, lean: +player.lean.toFixed(2) };
  },
};

// (the old ?unlockall=1 dev param was removed when the shop went live —
// purchases and server-validated codes are the only unlock paths now)

// ?preview=<key> renders any slapper (incl. locked DLC) in the pick showcase, so a
// look can be shared before it's unlockable — without exposing it in the pick list.
// ---- challenge links: ?cpts=254&copp=bertha&csl=charlie&cby=VIC ----
// A shared score arrives as a standing challenge: banner up top, the matchup
// preselected, and a verdict on the final card (see advance()).
let challenge = null;
{
  const q = new URLSearchParams(location.search);
  if (q.get('cpts')) {
    challenge = {
      pts: Math.max(0, Math.min(99999, parseInt(q.get('cpts'), 10) || 0)),
      by: (q.get('cby') || 'A RIVAL').slice(0, 12).toUpperCase(),
    };
    const oppArch = ROSTER.find((r) => r.key === q.get('copp'));
    if (oppArch && !oppArch.boss) chosenArch = oppArch;      // volunteer preselected (bosses stay tour-only)
    const sl = SLAPPERS.find((s) => s.key === q.get('csl'));
    if (sl && !(sl.locked && !owned(sl.key))) setLook(sl);   // slapper too, if playable
    challenge.tape = parseTape(q.get('ctape'));
    challenge.oppKey = oppArch && !oppArch.boss ? oppArch.key : null;
    rivalBarText = `⚔️ ${challenge.by} CHALLENGES YOU — BEAT ${challenge.pts} PTS${oppArch ? ` VS ${oppArch.name}` : ''}${challenge.tape ? ' · 📼 TAPE INCLUDED' : ''}`;
    ui.challengeBar(rivalBarText);
    track('challenge_opened', { by: challenge.by, pts: challenge.pts, opp: oppArch ? oppArch.name : null });
  }
}

// ---- returning from Stripe: ?session_id= → verify server-side → unlock all ----
{
  const sid = new URLSearchParams(location.search).get('session_id');
  if (sid && net.configured()) {
    fetch(`${window.SLAPP_CONFIG.supabaseUrl}/functions/v1/verify-checkout?session_id=${encodeURIComponent(sid)}`, {
      headers: { Authorization: `Bearer ${window.SLAPP_CONFIG.supabaseAnonKey}`, apikey: window.SLAPP_CONFIG.supabaseAnonKey },
    }).then((r) => r.json()).then((d) => {
      if (d && d.paid) {
        unlockPack(d.code, 'purchase');
        // surface the code so the buyer can SAVE it — it's their re-unlock key on
        // any device (also emailed on their Stripe receipt; recoverable by email)
        if (d.code) ui.challengeBar(`🏆 SUPPORTER PACK UNLOCKED! YOUR CODE: ${d.code} — SAVE IT (unlocks on any device). THANK YOU!`);
      }
      history.replaceState(null, '', location.pathname);
    }).catch(() => {});
  }
}

const _pv = new URLSearchParams(location.search).get('preview');
if (_pv) {
  // hide the card dock so the FULL character (head to toe) is visible in preview
  const hideDock = () => ['pickRow', 'pickGo', 'pickHint'].forEach((id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
  const slapper = SLAPPERS.find((s) => s.key === _pv);
  const volunteer = ROSTER.find((r) => r.key === _pv);
  if (slapper) { openSlapperPick(slapper); hideDock(); }
  else if (volunteer) {
    // showcase a world local at HOME (a hell demon posing in heaven is funny once)
    if (volunteer.world && stage.hasWorld(volunteer.world)) setWorldFull(volunteer.world);
    ui.showTitle(false);
    openOppPick();
    const i = OPP_LIST.indexOf(volunteer);
    if (i >= 0) pickHighlight(i);
    else {
      // bosses aren't in the pick list — showcase them directly
      opponent.remove();
      opponent = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch: volunteer, showcase: true });
      ui.bubble(volunteer.pickLine);
    }
    hideDock();
  }
}
