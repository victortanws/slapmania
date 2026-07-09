import * as THREE from 'three';
import { createStage } from './scene.js';
import { createWorld, addSolids } from './ragdoll.js';
import { Player, SLAPPERS } from './player.js';
import { Opponent, ROSTER } from './opponent.js';
import { Sfx } from './audio.js';
import * as ui from './ui.js';
import * as net from './net.js';
import * as campaign from './campaign.js';

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
}

let state = 'TITLE';
let tState = 0;
let timeScale = 1;
let shotClock = 10;
let attempts = [];
let slap = null;        // outcome of the current attempt {foul, part}
let contact = null;     // impact info {point, power}
let settleT = 0;
let dustCool = 0;
let clapT = 0;
let swellT = 0;
let barricadeHit = false;
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
function restoreBar() { ui.challengeBar(rivalBarText); }
let pickIndex = 0;
let pickHighlight = null;
let pickConfirmFn = null;
let submitted = false;

// ---------- the kinetic chain: grade each link the moment it fires ----------
let chain = null;
let swingT = 0;
const prevKeys = { s: false, l: false, a: false, p: false };

function resetChain() {
  chain = { coil: 0, tRel: null, l: null, a: null, p: null };
  swingT = 0;
  ui.chainReset();
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

function setState(s) { state = s; tState = 0; syncTouchPad(); }

// ---------- touch controls: thumbs are welcome at this fair ----------
// Left thumb coils and drives (S/L), right thumb whips and snaps (A/P).
// Buttons speak fluent keyboard, so every rule stays in one place.
const touchPad = document.getElementById('touchPad');
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add('touch');
const PLAY_STATES = new Set(['FACEOFF', 'SWING', 'IMPACT', 'FLIGHT', 'FOULED']);
function syncTouchPad() {
  touchPad.classList.toggle('inplay', isTouch && PLAY_STATES.has(state));
}
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
const DLC_LIVE = false;
let unlocks = [];
try { unlocks = JSON.parse(localStorage.getItem('slapp_unlocks') || '[]'); } catch { unlocks = []; }
const owned = (key) => DLC_LIVE && unlocks.includes(key);
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
  um.price.textContent = char.price || 4;
  um.msg.textContent = ''; um.code.value = '';
  um.modal.classList.remove('hidden');
}
function closeUnlockModal() { um.modal.classList.add('hidden'); unlockTarget = null; }
if (um.modal) {
  um.close.onclick = closeUnlockModal;
  um.buy.onclick = () => { um.msg.textContent = 'Checkout opens soon — hang tight! 🛒'; };
  um.redeem.onclick = () => {
    const code = um.code.value.trim().toUpperCase();
    if (DLC_LIVE && unlockTarget && code === 'SLAPDEV') {   // TEMP dev code — replace with server validation in Phase 2
      const c = unlockTarget;
      unlock(c.key);
      um.msg.textContent = 'UNLOCKED! 🎉';
      setTimeout(() => { closeUnlockModal(); openSlapperPick(); pickHighlight(SLAPPERS.indexOf(c)); }, 700);
    } else {
      um.msg.textContent = "That code isn't active yet — the shop opens soon.";
    }
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
      name: s.name, desc: s.desc,
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

function openOppPick() {
  setState('SELECT_OPP');
  track('slapper_selected', { slapper: player.look?.name });
  // step well back to size up the volunteer — nobody's hugging anybody
  player.root.position.x = -2.6;
  player.root.rotation.y = 0;   // clear any ?preview facing before play
  ui.hideCards();
  // the highlighted volunteer stands in the ring beckoning — slap-me showcase
  pickHighlight = (i) => {
    pickIndex = i;
    ui.setPickSel(i);
    opponent.remove();
    opponent = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch: ROSTER[i], showcase: true });
    ui.bubble(ROSTER[i].pickLine);
  };
  pickConfirmFn = () => { chosenArch = ROSTER[pickIndex]; ui.bubble(null); startMatch(); };
  ui.showPick({
    title: "NOW — WHO'S CATCHIN' IT TODAY?",
    blurb: 'Heavy folks barely budge, but oh, the points pay mighty fine. Three swings at whoever you pick.',
    confirmLabel: 'SLAP THIS VOLUNTEER!',
    items: ROSTER.map((a) => ({ name: a.name, sub: `${a.tag} — SCORE ×${a.mass}`, desc: a.pickLine })),
    onHover: (i) => pickHighlight(i),
    onConfirm: () => pickConfirmFn(),
  });
  pickHighlight(Math.max(0, ROSTER.indexOf(chosenArch)));
}

function startMatch() {
  attempts = [];
  submitted = false;
  if (!chosenArch) chosenArch = ROSTER[1];
  track('match_started', { opponent: chosenArch.name });
  startAttempt();
}

// Escape from anywhere: back to the front porch
function goToTitle() {
  player.reset();
  opponent.remove();
  opponent = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch: chosenArch || ROSTER[1] });
  attempts = [];
  slap = null;
  pendingCard = null;
  timeScale = 1;
  sfx.whoosh(0);
  ui.hideCards();
  ui.bubble(null);
  ui.intro(null);
  ui.showMeters(false);
  ui.setClock(null);
  ui.showDistance(null);
  ui.coach(null);
  ui.setAttempts(attempts, 0);
  campaign.close();
  campaign.clearActive();
  restoreBar();
  ui.showTitle(true);
  setState('TITLE');
}

// ---------- the county fair tour (campaign — hidden until CAMPAIGN_LIVE) ----------
function openTourMenu() {
  setState('TOUR');
  ui.showTitle(false);
  ui.hideCards();
  ui.bubble(null);
  restoreBar();
  campaign.open((ch) => {
    campaign.setActive(ch);
    campaign.close();
    ui.challengeBar(campaign.goalText());
    track('tour_challenge_started', { id: ch.id, title: ch.title });
    const arch = ch.opp ? ROSTER.find((r) => r.key === ch.opp) : null;
    if (arch) { chosenArch = arch; startMatch(); }   // the challenge names its victim
    else openOppPick();                              // "anybody" — player's choice
  });
  track('tour_opened', { cleared: campaign.progress().length });
}
document.getElementById('tourBack').onclick = () => goToTitle();
if (campaign.enabled()) {
  const b = document.getElementById('tourBtn');
  b.classList.remove('hidden');
  b.onclick = () => { sfx.ensure(); openTourMenu(); };
}

function startAttempt() {
  const arch = chosenArch;
  player.reset();
  opponent.remove();
  opponent = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch });
  // 3D honesty: the swing plane aims at THIS opponent's cheek height
  player.setStrikeTarget(opponent.headPos().y);
  slap = null;
  contact = null;
  settleT = 0;
  dustCool = 0;
  barricadeHit = false;
  mooDone = false;
  duelDone = false;
  masterDone = false;
  emperorDone = false;
  countyDone = false;
  pendingCard = null;
  cardDelay = 0;
  stage.resetBarricade();
  resetChain();
  shotClock = 10;
  timeScale = 1;
  ui.hideCards();
  ui.showTitle(false);
  ui.setAttempts(attempts, attempts.length);
  ui.setClock(null);
  ui.showDistance(null);
  ui.showMeters(false);
  ui.intro(arch);
  ui.bubble(arch.taunts[Math.floor(Math.random() * arch.taunts.length)]);
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

function onContact(hit) {
  const speed = player.handSpeed;
  const velDir = player.handVel.clone().normalize();
  // slow grazes and backhand drift don't count as an attempt at a slap
  if (speed < 2.2 || velDir.x < 0.15) return;

  // power is the PRODUCT of the chain links — technique is everything
  const lg = chain.l || gradeL(null);
  const ag = chain.a || { g: 0.5, label: 'NONE', tier: 1 };
  const pg = chain.p || { g: 0.6, label: 'NONE', tier: 1 };
  const coilFrac = chain.l ? chain.coil : player.coilFrac;
  const coilF = 0.35 + 0.65 * Math.min(1, coilFrac);

  // the palm never fired: that rigid folded arm is a punch, sir
  const foulType = player.pUnlocked ? null : 'punch';

  const sweet = hit.part === 'head' ? 1.35 : 0.6;
  // real slap physics: force comes up from the ground through a BRACED stance.
  // A teetering slapper can't drive the blow — the worse the visible lean at
  // contact, the softer the slap (up to −45% at the tipping point)
  const balF = 1 - 0.45 * Math.min(1, Math.abs(player.lean) / 1.05) ** 2;
  // muscle is a multiplier, not a substitute: the cap means brute strength only
  // pays off against tonnage — technique still decides everything else
  let power = 12.5 * player.strength * balF * coilF * lg.g * ag.g * pg.g * sweet;
  // rebound flail: only true multi-oscillation scuffles — a first-rebound catch
  // is a legitimate (already low-graded) beginner slap
  const ugly = chain.tFire != null && swingT - chain.tFire > 2.2;
  if (ugly) power *= 0.3;
  if (foulType) power *= 0.3;
  // the cap scales with muscle: a perfect chain caps everyone, but the strong
  // cap HIGHER — strength genuinely moves tonnage instead of dying at 30
  power = Math.min(power, 30 * player.strength);

  // he flies down the lane, carrying a hint of the sideways sweep — and the
  // arc follows the strike angle: an upward slap at a tall victim launches
  // high, a downward chop at a short one skims flat
  const dir = new THREE.Vector3(1, 0, velDir.z * 0.15).normalize();
  dir.y = THREE.MathUtils.clamp(0.34 + player.strikeLift * 0.55, 0.18, 0.52);
  dir.normalize();

  opponent.launch(dir, power);
  slap = {
    foul: foulType, part: hit.part,
    chain: {
      coil: Math.round(Math.min(1, coilFrac) * 100), l: lg.label, a: ag.label, p: pg.label, ugly,
      bal: Math.round(balF * 100),
      // training number: how close this chain came to the theoretical max (1.8)
      pct: Math.round(Math.min(1, (coilF * lg.g * ag.g * pg.g) / 1.8) * 100),
    },
  };
  contact = { point: hit.point.clone(), power };
  stage.spawnShock(hit.point);
  sfx.crack(Math.min(1, power / 22));
  sfx.gasp();
  sfx.whoosh(0);
  stage.shake(Math.min(0.5, power / 40));
  excite = Math.min(1, power / 20);
  player.leanV += power * 0.04; // a monster follow-through rocks YOU too
  // the sun judges TECHNIQUE, not tonnage — chain quality decides its mood
  if (foulType || ugly || hit.part === 'torso' || slap.chain.pct < 25) stage.sunMood('meh', 3.5);
  else if (slap.chain.pct >= 60) stage.sunMood('happy', 5);
  if (ugly) ui.slapBurst('SLOPPY SLAP!', 'THE CHAIN WAS LONG GONE');
  else if (hit.part === 'head') ui.smack('SLAPMANIA!', false);
  else ui.smack('BODY BLOW!', true);
  ui.showMeters(false);
  ui.setClock(null);
  timeScale = 0.13;
  setState('IMPACT');
}

function showResult() {
  timeScale = 1;
  const arch = opponent.arch;
  const flew = opponent.launched ? opponent.distance() : 0;
  const isFoul = !!(slap && slap.foul);
  const dist = isFoul ? 0 : flew;
  const pts = Math.round(dist * arch.mass * 10);
  attempts.push({ dist, pts, foul: isFoul ? slap.foul : null, part: slap ? slap.part : null, opp: arch.name });
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
    : (slap && slap.part === 'torso' ? ui.bodyLineFor(flew) : ui.commentaryFor(flew, opponent.wallSplat));
  // tour goals are judged per attempt, from numbers this function already has
  if (campaign.active) {
    const cleared = campaign.checkAttempt({
      dist, pts,
      part: slap && !isFoul ? slap.part : null,
      chainPct: slap && slap.chain ? slap.chain.pct : 0,
      oppKey: arch.key,
    });
    if (cleared) {
      line = `🎪 ${cleared.title} — CLEAR! ` + line;
      sfx.fanfare();
      track('tour_challenge_cleared', { id: cleared.id, title: cleared.title });
    }
  }
  sfx.crowd(isFoul ? 0 : dist > 20 ? 3 : dist > 10 ? 2 : dist > 4 ? 1 : 0);
  ui.coach(null);
  ui.showDistance(null);
  ui.setAttempts(attempts, attempts.length);
  // the card waits: first the camera settles on WHERE he landed, then any
  // earned honors play out, and only then does the scoreboard interrupt
  pendingCard = {
    dist, pts, arch, part: slap && !isFoul ? slap.part : null,
    foul: isFoul ? slap.foul : null, chain: slap ? slap.chain : null, line, n: attempts.length,
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
  return `https://slapmania.org/?cpts=${bestAttempt.pts}&copp=${oppKey}&csl=${player.look?.key || ''}&cby=${encodeURIComponent(by)}`;
}

function advance() {
  if (pendingCard) return; // the ceremony finishes before the paperwork
  if (attempts.length >= 3) {
    const bestAttempt = attempts.reduce((a, b) => (b.pts > a.pts ? b : a), attempts[0]);
    track('match_completed', { best_pts: bestAttempt.pts, best_dist: +bestAttempt.dist.toFixed(1), opp: bestAttempt.opp });
    ui.hideCards();
    let line = ui.commentaryFor(bestAttempt.dist, false);
    if (challenge) {
      const won = bestAttempt.pts > challenge.pts;
      line += won ? ` ⚔️ CHALLENGE WON — ${challenge.by}'s ${challenge.pts} PTS is dust!`
                  : ` ⚔️ ${challenge.by}'s ${challenge.pts} PTS still stands. Run it back.`;
      track('challenge_result', { won, target: challenge.pts, scored: bestAttempt.pts, by: challenge.by });
    }
    ui.showMatch({ bestAttempt, line, board, shareUrl: challengeUrl(bestAttempt) });
    setupGlobalPanel(bestAttempt);
    setState('MATCH_END');
  } else {
    startAttempt();
  }
}

function setupGlobalPanel(bestAttempt) {
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
  ]).then(([rows, champion, matchup, seasonal]) => {
    ui.renderGlobal(rows, {
      week: seasonal ? net.weekKey() : null,
      champion, matchup,
      matchTitle: matchup ? `${player.look?.name} vs ${bestAttempt.opp}` : null,
    });
  });
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
  if (state === 'TITLE') { openSlapperPick(); return true; }
  if (code && KEYMAP[code]) return false;
  if (state === 'RESULT' && tState > 1.0) { advance(); return true; }
  if (state === 'MATCH_END' && tState > 1.0) {
    // a tour match hands you back to the tour, checkmark freshly inked
    if (campaign.active) { campaign.clearActive(); restoreBar(); openTourMenu(); return true; }
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
  if (e.code === 'Escape' && state !== 'TITLE') { goToTitle(); return; }
  if (state === 'TITLE' && e.code === 'KeyT' && campaign.enabled()) { openTourMenu(); return; }
  if (state === 'SELECT_SLAPPER' || state === 'SELECT_OPP') {
    const n = state === 'SELECT_SLAPPER' ? SLAPPERS.length : ROSTER.length;
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
  if (k) keys[k] = true;
  advanceScreens(e.code);
});
addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) keys[k] = false;
});
addEventListener('pointerdown', (e) => {
  if (e.isTrusted && manual) { manual = false; skipRender = false; last = performance.now(); schedule(); }
  if (e.target.closest('button, a, input')) return;
  sfx.ensure();
  advanceScreens(null);
});

// ---------- camera director ----------
const camPos = new THREE.Vector3(0.5, 2.1, 4.6);
const camLook = new THREE.Vector3(0.5, 1.3, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function updateCamera(dt) {
  let p = null, l = null, snapRate = 5;
  if (state === 'SELECT_SLAPPER') {
    p = V(1.75, 1.6, 1.75);
    l = V(0.05, 1.25, 0);
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
    p = V(b.x - 5, Math.max(2.8, b.y + 1.3), b.z + 5.4);
    l = V(b.x, Math.max(b.y, 0.7), b.z);
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
  const targetFov = state === 'IMPACT' ? 44 : 55;
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
function tick(now) {
  schedule();
  const dt = Math.min(Math.max((now - last) / 1000, 0) || 0, 1 / 30);
  last = now;
  const dts = dt * timeScale;
  tState += dt;

  if (state === 'FACEOFF') {
    if (tState > 2.4) {
      ui.bubble(null);
      ui.intro(null);
      ui.showMeters(true);
      opponent.setTargetVisible(true);
      setState('SWING');
    }
  } else if (state === 'SWING') {
    player.update(dts, keys);
    swingT += dts;
    sfx.whoosh(player.handSpeed);
    ui.setMeters(player.lean);

    // --- a fresh S press after a spent/misfired swing starts a clean slap ---
    if (!prevKeys.s && keys.s && (chain.tRel !== null || chain.l || chain.a || chain.p || chain.lPend !== undefined)) {
      player.rearm();
      resetChain();
    }

    // --- grade each chain link the instant it fires ---
    if (prevKeys.s && !keys.s && chain.tRel === null) {
      chain.tRel = swingT;
      // an L that was rolled in just before the release gets judged now
      if (chain.lPend !== undefined && !chain.l) setHips(gradeL(chain.lPend - chain.tRel));
    }
    if (!prevKeys.l && keys.l && !chain.l && chain.lPend === undefined) {
      if (chain.tRel === null) {
        chain.lPend = swingT;
        ui.chainSet('hips', '...', 0);
      } else {
        setHips(gradeL(swingT - chain.tRel));
      }
    }
    if (!prevKeys.a && keys.a && !chain.a) {
      chain.a = gradeA(-player.spineVel);
      ui.chainSet('arm', chain.a.label, chain.a.tier);
    }
    if (!prevKeys.p && keys.p && !chain.p) {
      chain.p = gradeP(player.spineAngle, player.spineVel);
      ui.chainSet('snap', chain.p.label, chain.p.tier);
    }

    // live coil readout until the hips lock it in (it leaks while you wait)
    const coilPct = Math.round(player.coilFrac * 100);
    if (!chain.l) ui.chainSet('coil', `${coilPct}%`, 0);

    // --- cues + coaching: exactly one key pulses — the one the moment wants ---
    const phase = player.spineAngle;
    const snapCue = !chain.p && player.spineVel < -2 && phase < 1.3 && phase > -0.45;
    // ring: yellow = wait, green = GOOD window, bright flashing = PERFECT core
    const snapLvl = snapCue ? (phase <= 0.9 && phase > -0.1 ? 2 : 1) : 0;
    let wanted = null;
    if (chain.tRel === null) wanted = keys.s ? (coilPct >= 90 ? 'release' : null) : 's';
    else if (!chain.l) wanted = 'l';
    else if (!chain.a) wanted = 'a';
    else if (!chain.p && snapCue) wanted = 'p';
    ui.setKeys(keys, wanted);
    opponent.setTargetHot(snapLvl);
    if (chain.tRel === null) {
      if (keys.s) ui.coach(coilPct >= 90 ? 'FULL SWIVEL! LET GO OF [S]!' : `SWIVELING... ${coilPct}% — HOLD [S], DEEPER!`);
      else ui.coach('STEP 1: HOLD [S] — SWIVEL THE SPINE');
    } else if (!chain.l) ui.coach('TAP [L] — LUNGE THE HIPS! (SWIVEL IS DRAINING)');
    else if (!chain.a) ui.coach('PRESS [A] — THROW THE ARM!');
    else if (!chain.p) ui.coach(snapCue ? '[P]!! PALM!!' : 'WAIT FOR THE GREEN RING... THEN [P]');
    else ui.coach(null);

    shotClock -= dts;
    ui.setClock(shotClock);
    if (player.fallen) foul('footing');
    else if (shotClock <= 0) foul('clock');
    else if (player.handSeg && player.pUnlocked) {
      // OPEN PALM ONLY, literally: a closed hand doesn't register at all —
      // the referee starts counting the instant the palm opens
      const hit = opponent.checkHit(player.handSeg.p0, player.handSeg.p1, 0.26);
      if (hit) onContact(hit);
    }
  } else if (state === 'IMPACT') {
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
      ui.coach('THE HEAVENS DISPUTE YOUR SLAP.');
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
    if (stage.scareBirds(pel)) sfx.squawk();
    if (opponent.rag.maxSpeed() < 0.6) settleT += dt; else settleT = 0;
    // never call the result while he's still visibly travelling — a monster slap
    // can tumble a long time, and a stale card looks like a scoring bug. The
    // tState floor guarantees even a dead-stop crash gets its moment on camera.
    if (tState > 2.2 && (settleT > 1.2 || (tState > 12 && opponent.rag.maxSpeed() < 1.2) || tState > 20)) showResult();
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
  // DLC dev backdoor: unlock/relock without paying (Phase 2 replaces with real codes)
  unlock: (key) => { unlock(key); return [...unlocks]; },
  relock: (key) => { unlocks = key ? unlocks.filter((k) => k !== key) : []; localStorage.setItem('slapp_unlocks', JSON.stringify(unlocks)); return [...unlocks]; },
  get unlocks() { return [...unlocks]; },
  dist: () => opponent.distance(),
  get chainState() { return chain; },
  get bestScore() { return bestPts(); },
  get milestones() { return { barricadeHit, mooDone, duelDone, masterDone, emperorDone, countyDone, barricadeBroken: stage.isBarricadeBroken(), sun: stage.currentSunMood(), ascending: player.ascending }; },
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

// ?unlockall=1 — dev/preview: unlock every DLC slapper so they can all be played.
// Gated behind DLC_LIVE like everything else — inert while DLC isn't on sale.
if (DLC_LIVE && new URLSearchParams(location.search).get('unlockall')) {
  SLAPPERS.filter((s) => s.locked).forEach((s) => unlock(s.key));
}

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
    if (oppArch) chosenArch = oppArch;                       // volunteer preselected
    const sl = SLAPPERS.find((s) => s.key === q.get('csl'));
    if (sl && !(sl.locked && !owned(sl.key))) setLook(sl);   // slapper too, if playable
    rivalBarText = `⚔️ ${challenge.by} CHALLENGES YOU — BEAT ${challenge.pts} PTS${oppArch ? ` VS ${oppArch.name}` : ''}`;
    ui.challengeBar(rivalBarText);
    track('challenge_opened', { by: challenge.by, pts: challenge.pts, opp: oppArch ? oppArch.name : null });
  }
}

const _pv = new URLSearchParams(location.search).get('preview');
if (_pv) {
  // hide the card dock so the FULL character (head to toe) is visible in preview
  const hideDock = () => ['pickRow', 'pickGo', 'pickHint'].forEach((id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
  const slapper = SLAPPERS.find((s) => s.key === _pv);
  const volunteer = ROSTER.find((r) => r.key === _pv);
  if (slapper) { openSlapperPick(slapper); hideDock(); }
  else if (volunteer) { ui.showTitle(false); openOppPick(); pickHighlight(ROSTER.indexOf(volunteer)); hideDock(); }
}
