import * as THREE from 'three';
import { createStage } from './scene.js';
import { createWorld, addSolids } from './ragdoll.js';
import { Player, SLAPPERS } from './player.js';
import { Opponent, ROSTER, PICKABLE } from './opponent.js';
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
let gongRung = false; // dojo: the Great Gong rings once per attempt
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
  um.price.textContent = '6.99'; // one supporter pack, all six legends
  um.msg.textContent = ''; um.code.value = '';
  um.modal.classList.remove('hidden');
}
function closeUnlockModal() { um.modal.classList.add('hidden'); unlockTarget = null; }
if (um.modal) {
  um.close.onclick = closeUnlockModal;
  um.buy.onclick = async () => {
    if (!shopEnabled()) { um.msg.textContent = 'Checkout opens soon — hang tight! 🛒'; return; }
    um.msg.textContent = 'Opening checkout…';
    try {
      const r = await fetch(`${window.SLAPP_CONFIG.supabaseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${window.SLAPP_CONFIG.supabaseAnonKey}`, apikey: window.SLAPP_CONFIG.supabaseAnonKey },
      });
      const d = await r.json();
      if (d && d.url) { location.href = d.url; return; }  // off to Stripe's hosted page
      um.msg.textContent = 'Checkout stumbled — try again in a spell.';
    } catch {
      um.msg.textContent = 'Checkout stumbled — try again in a spell.';
    }
  };
  // gift/promo codes will be server-validated when they exist; no client codes,
  // ever — the shop is live and the old SLAPDEV backdoor is gone
  um.redeem.onclick = () => {
    um.msg.textContent = 'No active codes right now — codes come from giveaways!';
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

// volunteers on offer in the CURRENT world: the fair regulars everywhere, plus
// each world's own locals (a world-stamped volunteer only shows at home —
// Halo Hal waits in heaven, Low-Level Larry clocks in downstairs)
let OPP_LIST = PICKABLE;
function oppListNow() {
  const w = localStorage.getItem('slapp_world') || 'day';
  return ROSTER.filter((r) => !r.boss && (!r.world || r.world === w));
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
  attempts = [];
  submitted = false;
  if (!chosenArch) chosenArch = ROSTER[1];
  track('match_started', { opponent: chosenArch.name });
  startAttempt();
}

// Escape from anywhere: back to the front porch
function goToTitle() {
  if (chosenArch && chosenArch.boss) chosenArch = null;   // bosses don't loiter on the porch
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
    stage.setSpirit(false);
    stage.setBruce(false);
    stage.setJudge(false);
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
const seenScene = (id) => JSON.parse(localStorage.getItem('slapp_seen') || '[]').includes(id);
const markScene = (id) => {
  const s = JSON.parse(localStorage.getItem('slapp_seen') || '[]');
  if (!s.includes(id)) { s.push(id); localStorage.setItem('slapp_seen', JSON.stringify(s)); }
};

// ---- campaign portraits: each tour card stars its lead in a ¾ close-up ----
// rendered live from the real character meshes, once per session, cached.
const TOUR_STARS = {
  wonders: { slapper: 'charlie' },
  fair: { opp: 'don' },
  palm: { slapper: 'bruceslee' },
  secondwind: { opp: 'chuckboss' },
  nightofslaps: { opp: 'reaper' },      // future tours resolve as their cast ships
  slaptherapy: { slapper: 'carlgustav' },
  slopvalley: { opp: 'slopunit' },
  olympicbid: { slapper: 'victor' },
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
        head = new THREE.Vector3(temp.root.position.x, 1.52 * (look.height || 1), temp.root.position.z);
      } else {
        const arch = ROSTER.find((x) => x.key === star.opp);
        if (!arch) continue;
        temp = new Opponent({ scene, world: phys.world, mat: phys.fleshMat, arch, showcase: true });
        head = temp.headPos();
      }
      // ¾ close-up from front-left, eye level, a touch of headroom
      const facing = star.slapper ? 1 : -1;  // slappers face +x, volunteers −x
      pcam.position.set(head.x + facing * 0.72, head.y + 0.08, head.z + 0.42);
      pcam.lookAt(head.x, head.y - 0.02, head.z);
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

function openTourMenu() {
  setState('TOUR');
  ui.showTitle(false);
  ui.hideCards();
  ui.bubble(null);
  restoreBar();
  capturePortraits();
  campaign.open((ch) => {
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
  }, {
    portraits: tourPortraits,
    ownsDlc: owned('bruceslee'),
    onLocked: (tour) => openUnlockModal({
      name: tour.title.replace(/^\S+\s/, ''),
      desc: "Bruce Slee's own storyline — and all six legends — ride with the Supporter Pack.",
    }),
  });
  track('tour_opened', { cleared: campaign.progress().length });
}
document.getElementById('tourBack').onclick = () => goToTitle();
// the ONLY tap that advances the final scoreboard — so tapping the boards to
// browse/scroll never steals the "next round" transition (Enter/Space also work)
document.getElementById('matchNext').onclick = () => { sfx.ensure(); advanceScreens('Enter'); };

// ---------- worlds: Day Fair / Night Fair / Frozen Lake (public) ----------
// Theme + (for ice) ground friction, persisted. Distances still end at the
// forest perimeter (~117m), so the DB dist cap (130) holds even on ice.
// The selector is a scrollable chip row GENERATED from this list — a new world
// is one entry here + one WORLD_THEMES entry in scene.js. DLC worlds wear a 🔒
// until the Supporter Pack is owned; chips render only once their theme ships.
const WORLDS = [
  { key: 'day',     label: '🌞 DAY FAIR' },
  { key: 'night',   label: '🌙 NIGHT FAIR' },
  { key: 'ice',     label: '❄️ FROZEN LAKE' },
  { key: 'desert',  label: '🌵 DESERT' },
  { key: 'jungle',  label: '🌴 JUNGLE' },
  { key: 'lava',    label: '🌋 LAVA LAND', dlc: true },
  { key: 'dojo',    label: '🥋 THE DOJO', dlc: true },
  { key: 'therapy', label: '🛋️ THERAPY ROOM', dlc: true },
  { key: 'heaven',  label: '😇 HEAVEN', dlc: true },
  { key: 'hell',    label: '🔥 HELL', dlc: true },
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
  else phys.setGround(null);                                                       // farm default
  phys.setGravity(key === 'heaven' ? -8.8 : null);                                 // floaty grace
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
        openUnlockModal({ name: w.label.replace(/^\S+\s/, ''), desc: 'This world — and every DLC world and legend — rides with the Supporter Pack.' });
        return;
      }
      applyWorld(w.key);
    };
    row.appendChild(b);
  }
}
buildWorldRow();
// if the saved world is DLC and the pack was refunded/cleared, fall back to day
const savedWorld = localStorage.getItem('slapp_world') || 'day';
const savedDef = WORLDS.find((w) => w.key === savedWorld);
applyWorld(stage.hasWorld(savedWorld) && !(savedDef && savedDef.dlc && !owned('bruceslee')) ? savedWorld : 'day');
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
  gongRung = false;
  mooDone = false;
  duelDone = false;
  masterDone = false;
  emperorDone = false;
  countyDone = false;
  pendingCard = null;
  cardDelay = 0;
  stage.resetBarricade();
  resetChain();
  shotClock = arch.shotClock || 10; // bosses may run a tighter courtroom
  timeScale = 1;
  ui.hideCards();
  ui.showTitle(false);
  ui.setAttempts(attempts, attempts.length);
  ui.setClock(null);
  ui.showDistance(null);
  ui.showMeters(false);
  ui.intro(arch);
  ui.bubble(arch.taunts[Math.floor(Math.random() * arch.taunts.length)]);
  // campaign matches are officiated — His Honor has remarks; in quick play the
  // slapper gets the word instead. Shown on the LOW ref bar so the volunteer's
  // name plate stays readable.
  if (campaign.active) ui.refBar(`🎺 JUDGE PENNYWHISTLE: “${REF_LINES[refLineIdx++ % REF_LINES.length]}”`);
  else {
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

  // CONTACT QUALITY (head only) — real slap physics: a blow that lands level
  // with the cheek's center and drives INTO it transfers square; a high/low
  // graze skims off. Rewards reading heights (matchups) and the volunteer's
  // breathing sway — watch the ring, strike level. Deterministic, capped ±12%.
  let cq = 1;
  if (hit.part === 'head') {
    // vertical flushness normalized to the inner 45% of the envelope so it
    // actually discriminates (post-reach-fix planes are all near-level), and
    // weighted 70/30 over incidence: height-reading is the skill being paid.
    const R = opponent.rHead + 0.26;
    const vAlign = 1 - Math.min(1, Math.abs(hit.point.y - hit.center.y) / (R * 0.45));
    const into = new THREE.Vector3().subVectors(hit.center, hit.point).normalize();
    const incidence = Math.max(0, velDir.dot(into));
    cq = 0.88 + 0.24 * (0.7 * vAlign + 0.3 * incidence);
  }
  const sweet = (hit.part === 'head' ? 1.35 : 0.6) * cq;
  // real slap physics: force comes up from the ground through a BRACED stance.
  // A teetering slapper can't drive the blow — the worse the visible lean at
  // contact, the softer the slap (up to −45% at the tipping point)
  const balF = 1 - 0.45 * Math.min(1, Math.abs(player.lean) / 1.05) ** 2;
  // muscle is a multiplier, not a substitute: the cap means brute strength only
  // pays off against tonnage — technique still decides everything else
  let power = 12.5 * player.strength * balF * coilF * lg.g * ag.g * pg.g * sweet;
  // a slow "cleanup" graze that sneaks past the 2.2 gate (e.g. catching a weave
  // boss on the pop-up frame) shouldn't launch full power off a crawling hand:
  // taper below 6 m/s of real contact speed. Normal swings land ~10.8 → untouched.
  power *= THREE.MathUtils.clamp(speed / 6, 0.35, 1);
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
  // snapExam: only a PERFECT arm-whip lands — a lazy arm has no crack (A-timing exam)
  const noSnap = !!(opponent.arch.snapExam && !ugly && ag.tier < 3);
  if (noSnap) power *= 0.45;
  // coilExam: the mainspring only trips on a nearly-full wind-up (S/coil exam)
  const unwound = !!(opponent.arch.coilExam && !ugly && coilFrac < opponent.arch.coilExam / 100);
  if (unwound) power *= 0.40;
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

  // he flies down the lane, carrying a hint of the sideways sweep — and the
  // arc follows the strike angle: an upward slap at a tall victim launches
  // high, a downward chop at a short one skims flat
  const dir = new THREE.Vector3(1, 0, velDir.z * 0.15).normalize();
  dir.y = THREE.MathUtils.clamp(0.34 + player.strikeLift * 0.55, 0.18, 0.52);
  dir.normalize();

  opponent.launch(dir, power);
  slap = {
    foul: null, part: hit.part, // a landed contact is never a foul (fouls use the FOULED path)
    chain: {
      coil: Math.round(Math.min(1, coilFrac) * 100), l: lg.label, a: ag.label, p: pg.label, ugly,
      bal: Math.round(balF * 100),
      cq: hit.part === 'head' ? Math.round(cq * 100) : null, // contact flushness (100 = level+square)
      pct: chainPct, // % of theoretical max — same number the boss gates judge
    },
  };
  contact = { point: hit.point.clone(), power };
  stage.spawnShock(hit.point);
  sfx.crack(Math.min(1, power / 22));
  sfx.gasp();
  sfx.whoosh(0);
  stage.shake(Math.min(0.5, power / 40));
  if (!ugly && hit.part === 'head') ui.flash(Math.min(0.55, 0.16 + power / 55)); // the CRACK — a white pop on a clean cheek hit
  excite = Math.min(1, power / 20);
  player.leanV += power * 0.04; // a monster follow-through rocks YOU too
  // the sun judges TECHNIQUE, not tonnage — chain quality decides its mood
  if (ugly || hit.part === 'torso' || slap.chain.pct < 25) stage.sunMood('meh', 3.5);
  else if (slap.chain.pct >= 60) stage.sunMood('happy', 5);
  if (ugly) ui.slapBurst('SLOPPY SLAP!', 'THE CHAIN WAS LONG GONE');
  else if (noSold) ui.slapBurst('NO-SOLD!', `HE NEEDS A ${opponent.arch.chainGate}% CHAIN TO EVEN BLINK`);
  else if (greased) ui.slapBurst('IT SLID OFF!', 'ONLY A PERFECT PALM GRIPS THE GREASE');
  else if (noSnap) ui.slapBurst('NO SNAP!', 'ONLY A CRACKING ARM — A FAST WHIP — MOVES THE MASTER');
  else if (unwound) ui.slapBurst('UNWOUND!', `WIND THE COIL PAST ${opponent.arch.coilExam}% OR THE SPRING NEVER TRIPS`);
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
  // world personality on the result card — deterministic garnish, never scoring
  const worldNow = activeWorld; // the world on stage, incl. tour pins
  if (worldNow === 'lava' && !isFoul) {
    line += ` DONENESS: ${dist < 20 ? 'STILL RAW.' : dist < 45 ? 'MEDIUM RARE.' : dist < 70 ? 'WELL DONE.' : "FLAME-BROILED. Chef's kiss."}`;
  } else if (worldNow === 'therapy') {
    line += ' ' + (isFoul
      ? (slap.foul === 'clock' ? 'DIAGNOSIS: classic avoidance.' : 'DIAGNOSIS: overextension. You fear commitment, yet here we are.')
      : slap && slap.part === 'torso' ? "DIAGNOSIS: you're projecting. Aim higher."
      : slap && slap.chain.pct >= 90 ? 'DIAGNOSIS: a BREAKTHROUGH. Same time next week.'
      : slap && slap.chain.pct < 40 ? 'DIAGNOSIS: a repressed follow-through.'
      : 'DIAGNOSIS: unresolved. The couch is ready when you are.');
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
  }
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
      lastClearedId = cleared.id;   // an outro may be owed at match end
      sfx.fanfare();
      track('tour_challenge_cleared', { id: cleared.id, title: cleared.title });
    }
  }
  sfx.crowd(isFoul ? 0 : dist > 20 ? 3 : dist > 10 ? 2 : dist > 4 ? 1 : 0);
  ui.coach(null);
  ui.refBar(null);
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
  ]).then(([rows, champion, matchup, seasonal, allTime]) => {
    ui.renderGlobal(rows, {
      week: seasonal ? net.weekKey() : null,
      champion, matchup,
      matchTitle: matchup ? `${player.look?.name} vs ${bestAttempt.opp}` : null,
      // pre-migration the weekly board IS the all-time board — don't show it twice
      allTime: seasonal ? allTime : null,
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
      const failedId = !lastClearedId && !campaign.isDone(campaign.active.id) ? campaign.active.id : null;
      campaign.clearActive();
      if (chosenArch && chosenArch.boss) chosenArch = null;
      restoreBar();
      const outro = lastClearedId && campaign.CUTSCENES['outro_' + lastClearedId];
      const outroId = 'outro_' + lastClearedId;
      lastClearedId = null;
      if (outro && !seenScene(outroId)) {
        markScene(outroId);
        playScene(outro, () => openTourMenu());
      } else if (failedId) {
        // the goal stood: a short, humiliating beat — camera on your slumped hero
        const pool = campaign.FAILS[failedId[0]] || [];
        const fail = pool.length ? pool[failIdx++ % pool.length] : null;
        if (fail) playScene(fail.map((l) => (l.who === 'YOU' ? { ...l, who: player.look.name } : l)), () => openTourMenu(), { sad: true });
        else openTourMenu();
      } else openTourMenu();
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
  if (e.code === 'Escape' && state !== 'TITLE') { goToTitle(); return; }
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
  // cutscene: the match clock freezes, the world stays alive (breathing, sway),
  // and the camera runs a close-up on whoever is speaking
  if (dlg.isActive()) {
    opponent.update(dt);
    const shot = dlg.currentShot();
    if (shot !== 'wide') {
      // 3/4 close-up on whoever is speaking: face + a shoulder, slightly above
      const tgt = new THREE.Vector3();
      let off;
      if (shot === 'opp') { tgt.copy(opponent.headPos()); off = new THREE.Vector3(-1.35, 0.3, 0.95); }
      else if (shot === 'spirit') { tgt.copy(stage.cinePoints.spirit()); off = new THREE.Vector3(1.4, 0.2, 1.0); }
      else if (shot === 'judge') { tgt.copy(stage.cinePoints.judge()); off = new THREE.Vector3(1.35, 0.3, 1.0); }
      else if (shot === 'bruce') { tgt.copy(stage.cinePoints.bruce()); off = new THREE.Vector3(-1.35, 0.25, 1.0); }
      else { player.headMesh.getWorldPosition(tgt); off = new THREE.Vector3(1.35, 0.3, 0.95); }
      camera.position.lerp(tgt.clone().add(off), 1 - Math.exp(-5 * dt));
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
      // one long blast at the exact frame the 10 seconds start running
      if (campaign.active) { sfx.whistle('start'); ui.coach(null); }
      surgeFired = false; // reset Chuck's Second Wind telegraph for this attempt
      setState('SWING');
    }
  } else if (state === 'SWING') {
    player.update(dts, keys);
    swingT += dts;
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
    // in the DOJO, a body that reaches the 62m wall RINGS THE GREAT GONG —
    // the SLAPMASTER bar, heard before it's told
    if (!gongRung && stage.isDojoUp() && pel.x > 60) {
      gongRung = true;
      sfx.gong();
      stage.ringGong();
      stage.shake(0.35);
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
    rivalBarText = `⚔️ ${challenge.by} CHALLENGES YOU — BEAT ${challenge.pts} PTS${oppArch ? ` VS ${oppArch.name}` : ''}`;
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
        localStorage.setItem('slapp_pack', '1');
        ui.challengeBar('🏆 SUPPORTER PACK UNLOCKED — ALL SIX LEGENDS ARE YOURS. THANK YOU!');
        sfx.fanfare();
        track('pack_purchased', {});
        // if the roster is on screen, re-render it so the locks fall off NOW
        if (state === 'SELECT_SLAPPER') openSlapperPick();
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
