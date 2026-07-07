const $ = (id) => document.getElementById(id);
const el = {
  attempts: $('attempts'), clock: $('clock'), best: $('best'),
  distance: $('distance'), banner: $('banner'), bubble: $('bubble'),
  meters: $('meters'), leanneedle: $('leanneedle'), speed: $('speed'),
  title: $('title'), result: $('result'), match: $('match'),
  resDist: $('resDist'), resLine: $('resLine'), resNext: $('resNext'),
  matchDist: $('matchDist'), matchLine: $('matchLine'), shareBtn: $('shareBtn'),
  coach: $('coach'), keysbar: $('keysbar'),
  kS: $('k-s'), kL: $('k-l'), kA: $('k-a'), kP: $('k-p'),
  intro: $('intro'), introName: $('introName'), introTag: $('introTag'),
  resScore: $('resScore'), resPart: $('resPart'), resChain: $('resChain'), boardEl: $('board'),
  clCoil: $('cl-coil'), clHips: $('cl-hips'), clArm: $('cl-arm'), clSnap: $('cl-snap'),
  pick: $('pick'), pickTitle: $('pickTitle'), pickBlurb: $('pickBlurb'),
  pickRow: $('pickRow'), pickHint: $('pickHint'), pickGo: $('pickGo'),
  globalWrap: $('globalWrap'), gboard: $('gboard'),
  nameInput: $('nameInput'), submitBtn: $('submitBtn'), netMsg: $('netMsg'),
};

export const FOUL_LINES = {
  punch: 'UPON REVIEW: the palm never opened. That is a PUNCH, sir. This is a slapping establishment.',
  fingertips: 'UPON REVIEW: limp fingertip contact. Pathetic. No slap registered.',
  footing: 'He wound up so hard he slapped himself off his own feet.',
  clock: 'Ten seconds of nothing. The crowd is booing. The opponent is chewing wheat.',
};

export const FOUL_BANNERS = {
  punch: ['FOUL!', 'THAT IS A PUNCH, SIR'],
  fingertips: ['FOUL!', 'LIMP FINGERTIPS. DISGRACEFUL.'],
  footing: ['FOUL!', 'HE HAS SLAPPED HIMSELF OFF HIS OWN FEET'],
  clock: ['FORFEIT!', 'FROZEN BY THE MAGNITUDE OF THE MOMENT'],
};

export function commentaryFor(d, haySplat) {
  if (d > 95) return 'HE HAS LEFT SLAPP COUNTY. Cartographers have been notified.';
  if (d > 80) return 'PAST THE COUNTY LINE. Somebody fetch a tractor.';
  if (d > 62) return "HE CLEARED THE HAY AND VANISHED INTO THE CORN. The corn's keeping him.";
  if (haySplat) return "HE'S IN THE HAY BALES. The county is still counting.";
  if (d < 1) return 'The referee is trying very hard not to laugh.';
  if (d < 3) return 'A firm rebuke. A strongly worded memo, delivered by hand.';
  if (d < 7) return "He'll feel that one in the morning. And the morning after.";
  if (d < 13) return 'The referee has seen enough. The referee has seen too much.';
  if (d < 20) return 'Someone fetch his hat. And his dignity.';
  if (d < 30) return 'OUTRAGEOUS. Somebody call his family.';
  return 'HE HAS BEEN DISPATCHED TO THE NEXT COUNTY.';
}

export function setBest(entry) {
  el.best.innerHTML = entry
    ? `BEST SCORE<br>${entry.pts} PTS <small>(${entry.dist.toFixed(1)}m)</small>`
    : 'BEST SCORE<br>—';
}

export function intro(arch) {
  if (!arch) { el.intro.classList.add('hidden'); return; }
  el.intro.classList.remove('hidden');
  el.introName.textContent = arch.name;
  el.introTag.textContent = `${arch.tag} — SCORE ×${arch.mass}`;
}

export function setAttempts(attempts, current) {
  let html = '';
  for (let i = 0; i < 3; i++) {
    const a = attempts[i];
    let mark = '○', val = '';
    if (a) { mark = a.foul ? '✗' : '●'; val = a.foul ? 'FOUL' : `${a.dist.toFixed(1)}m`; }
    else if (i === current) mark = '◉';
    html += `<span class="dot">${mark}<small>${val || '&nbsp;'}</small></span>`;
  }
  el.attempts.innerHTML = `ATTEMPTS<br>${html}`;
}

export function setClock(v) {
  if (v == null) { el.clock.classList.add('hidden'); return; }
  el.clock.classList.remove('hidden');
  el.clock.textContent = Math.max(0, v).toFixed(1);
  el.clock.classList.toggle('hot', v < 3);
}

export function showDistance(d) {
  if (d == null) { el.distance.classList.add('hidden'); return; }
  el.distance.classList.remove('hidden');
  el.distance.textContent = `${d.toFixed(1)}m`;
}

export function showMeters(on) {
  el.meters.classList.toggle('hidden', !on);
  el.keysbar.classList.toggle('hidden', !on);
  if (!on) coach(null);
}

export function coach(text) {
  el.coach.classList.toggle('hidden', !text);
  if (text && el.coach.textContent !== text) el.coach.textContent = text;
}

// wanted: which link the moment demands — that chip pulses ('release' pulses S while held)
export function setKeys(keys, wanted) {
  el.kS.classList.toggle('held', keys.s);
  el.kL.classList.toggle('held', keys.l);
  el.kA.classList.toggle('held', keys.a);
  el.kP.classList.toggle('held', keys.p);
  el.kS.classList.toggle('cue', wanted === 's' || wanted === 'release');
  el.kL.classList.toggle('cue', wanted === 'l');
  el.kA.classList.toggle('cue', wanted === 'a');
  el.kP.classList.toggle('cue', wanted === 'p');
}

export function setMeters(lean) {
  const pct = 50 + Math.max(-1.05, Math.min(1.05, lean)) / 1.05 * 50;
  el.leanneedle.style.left = `${pct}%`;
}

// ---- the chain HUD: each link grades the instant it fires ----
const LINKS = { coil: 'clCoil', hips: 'clHips', arm: 'clArm', snap: 'clSnap' };
export function chainSet(link, text, tier) {
  const c = el[LINKS[link]];
  c.querySelector('span').textContent = text;
  c.classList.remove('t1', 't2', 't3');
  if (tier > 0) {
    void c.offsetWidth; // restart the pop animation
    c.classList.add(`t${tier}`);
  }
}
export function chainReset() {
  for (const k in LINKS) chainSet(k, '—', 0);
}

export function bubble(text) {
  if (!text) { el.bubble.classList.add('hidden'); return; }
  el.bubble.textContent = `“${text}”`;
  el.bubble.classList.remove('hidden');
}

let bannerTimer = null;
export function banner(big, sub, { foul = false, ms = 1600 } = {}) {
  clearTimeout(bannerTimer);
  el.banner.querySelector('.big').textContent = big;
  el.banner.querySelector('.sub').textContent = sub || '';
  el.banner.classList.remove('hidden', 'pop');
  el.banner.classList.toggle('foul', foul);
  void el.banner.offsetWidth; // restart the pop animation
  el.banner.classList.add('pop');
  if (ms > 0) bannerTimer = setTimeout(() => el.banner.classList.add('hidden'), ms);
}

export function slapBurst(text, sub = '') { banner(text, sub, { ms: sub ? 1500 : 900 }); }

// the impact burst: full glorious SLAPMANIA for face slaps, a duller blue-grey
// variant for body blows, and a GOLD one for the slapmaster moment
let smackTimer = null;
export function smack(text = 'SLAPMANIA!', variant = null) {
  const s = document.getElementById('smack');
  clearTimeout(smackTimer);
  s.querySelector('.smacktext').textContent = text;
  s.classList.toggle('body', variant === true || variant === 'body');
  s.classList.toggle('gold', variant === 'gold');
  s.classList.remove('hidden', 'go');
  void s.offsetWidth; // restart the pop animation
  s.classList.add('go');
  smackTimer = setTimeout(() => s.classList.add('hidden'), variant === 'gold' ? 2400 : 1300);
}

export function setMaster(level) {
  const el2 = document.getElementById('masterTag');
  el2.classList.toggle('hidden', !level);
  if (level) el2.textContent = level >= 2 ? '♛ SLAP EMPEROR ♛' : '★ SLAPMASTER ★';
}

const BODY_LINES = [
  'A body blow. Technically legal. Spiritually bankrupt.',
  'He slapped the SHOULDER region. The crowd exchanges glances.',
  'Ribs pay 40% less than cheeks. Everybody knows that.',
  'The judges wanted cheek. They got brisket.',
];
export function bodyLineFor(d) {
  if (d < 1) return 'The referee is trying very hard not to laugh.';
  return BODY_LINES[Math.floor(Math.random() * BODY_LINES.length)];
}
export function foulBanner(type) {
  const [big, sub] = FOUL_BANNERS[type];
  banner(big, sub, { foul: true, ms: 2400 });
}

export function showTitle(on) { el.title.classList.toggle('hidden', !on); }

export function showResult({ dist, pts, arch, part, foul, chain, line, n }) {
  el.result.classList.remove('hidden');
  if (foul) {
    el.resDist.textContent = 'FOUL — 0 PTS';
    el.resDist.classList.add('foul');
    el.resScore.textContent = '';
    el.resPart.textContent = '';
  } else {
    el.resDist.textContent = `${dist.toFixed(1)}m`;
    el.resDist.classList.remove('foul');
    el.resScore.textContent = `SCORE ${pts} — ${arch.tag} ×${arch.mass}`;
    el.resPart.textContent = part === 'torso'
      ? 'BODY BLOW: −55% POWER. THE CHEEK PAYS FULL PRICE.'
      : 'CLEAN CHEEK CONTACT ✓';
  }
  el.resChain.textContent = chain
    ? `CHAIN ${chain.pct}% OF PERFECT — COIL ${chain.coil}% · HIPS ${chain.l} · ARM ${chain.a} · SNAP ${chain.p}${chain.ugly ? ' · (REBOUND FLAIL −70%)' : ''}${chain.bal != null && chain.bal < 95 ? ` · OFF-BALANCE −${100 - chain.bal}%` : ''}`
    : '';
  el.resLine.textContent = line;
  el.resNext.textContent = n >= 3 ? 'CLICK / ENTER → FINAL VERDICT' : `CLICK / ENTER → ATTEMPT ${n + 1} OF 3`;
}

export function showMatch({ bestAttempt, line, board }) {
  el.match.classList.remove('hidden');
  el.matchDist.textContent = `${bestAttempt.pts} PTS`;
  el.matchLine.textContent = bestAttempt.pts > 0
    ? `${bestAttempt.dist.toFixed(1)}m into ${bestAttempt.opp}. ${line}`
    : 'Three attempts. Zero slaps landed. The chickens are unimpressed.';
  el.boardEl.innerHTML = '<div class="boardhead">COUNTY LEADERBOARD</div>' + (board.length
    ? board.map((b, i) =>
        `<div class="boardrow"><span>#${i + 1}</span><b>${b.pts} PTS</b><span>${b.dist.toFixed(1)}m vs ${b.opp}</span></div>`).join('')
    : '<div class="boardrow">No slaps on record.</div>');
  el.shareBtn.textContent = 'COPY BRAG TEXT';
  el.shareBtn.onclick = () => {
    const txt = `I scored ${bestAttempt.pts} PTS slapping ${bestAttempt.opp} ${bestAttempt.dist.toFixed(1)}m across a farm in SLAPMANIA! Controls: S, L, A, P. That's the whole game.`;
    navigator.clipboard?.writeText(txt).then(
      () => { el.shareBtn.textContent = 'COPIED!'; },
      () => { el.shareBtn.textContent = txt; }
    );
  };
}

export function hideCards() {
  el.result.classList.add('hidden');
  el.match.classList.add('hidden');
  el.banner.classList.add('hidden');
  el.pick.classList.add('hidden');
  document.getElementById('smack').classList.add('hidden');
}

// pick dock: items need {name, sub, desc}. Hovering previews (onHover),
// clicking a card or the big button confirms (onConfirm).
export function showPick({ title, blurb, items, confirmLabel, onHover, onConfirm }) {
  el.pick.classList.remove('hidden');
  el.result.classList.add('hidden');
  el.match.classList.add('hidden');
  el.pickTitle.textContent = title;
  el.pickBlurb.textContent = blurb;
  el.pickGo.textContent = confirmLabel;
  el.pickGo.onclick = () => onConfirm();
  el.pickHint.textContent = `1–${items.length} OR HOVER TO PREVIEW • ENTER OR CLICK TO CONFIRM`;
  el.pickRow.innerHTML = '';
  items.forEach((it, i) => {
    const b = document.createElement('div');
    b.className = 'choice';
    b.innerHTML = `<span class="num">${i + 1}</span>
      <div class="cname">${it.name}</div>
      <div class="ctag">${it.sub}</div>
      <div class="cdesc">${it.desc}</div>`;
    b.onmouseenter = () => onHover(i);
    b.onclick = () => { onHover(i); onConfirm(); };
    el.pickRow.appendChild(b);
  });
}

export function setPickSel(i) {
  [...el.pickRow.children].forEach((c, idx) => c.classList.toggle('sel', idx === i));
}

export function hidePick() { el.pick.classList.add('hidden'); }

// ---- worldwide leaderboard panel (match card) ----
export function initName() {
  el.nameInput.value = localStorage.getItem('slapp_name') || '';
  el.nameInput.addEventListener('input', () => localStorage.setItem('slapp_name', el.nameInput.value));
}
export const getName = () => el.nameInput.value.trim();

export function showGlobal(on) { el.globalWrap.classList.toggle('hidden', !on); }

export function renderGlobal(rows) {
  el.gboard.innerHTML = '<div class="boardhead">WORLDWIDE RANKINGS</div>' + (rows && rows.length
    ? rows.map((b, i) =>
        `<div class="boardrow"><span>#${i + 1}</span><b>${b.pts} PTS</b><span>${(+b.dist).toFixed(1)}m vs ${b.opp} — ${b.name}</span></div>`).join('')
    : '<div class="boardrow">Nobody worldwide yet. Be first.</div>');
}

export function netMsg(text) { el.netMsg.textContent = text || ''; }

export function submitState(label, disabled) {
  el.submitBtn.textContent = label;
  el.submitBtn.disabled = disabled;
}

export function bindSubmit(cb) { el.submitBtn.onclick = cb; }
