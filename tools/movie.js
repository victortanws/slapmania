// ---------------------------------------------------------------------------
// movie.js — offline cinematic renderer for SlapMania trailers.
//
// NOT part of the game bundle (index.html never loads it). Load it on demand
// from the console of a running game:
//
//     const M = await import('/tools/movie.js'); await M.boot();
//     await M.runNext(3);   // repeat until .done
//
// It drives the real engine through __slapp.drive()'s `onStep` seam: the sim
// steps at a locked 60fps, we place our own camera every frame, render, then
// composite the frame + trailer overlays onto a 2D canvas and POST it to a
// local frame sink (tools/framesink.py). Nothing is faked — every slap is the
// real kinetic chain hitting a real ragdoll.
//
// Output is a numbered JPEG sequence at 1280x720; ffmpeg assembles it.
// ---------------------------------------------------------------------------
import * as THREE from 'three';

const SINK = 'http://127.0.0.1:8998';
const W = 1280, H = 720, FPS = 30;

const S = () => window.__slapp;
const stage = () => window.__slapp.stage;

// ---- output surface: WebGL frame is drawn here, then overlays on top --------
const out = document.createElement('canvas');
out.width = W; out.height = H;
const g = out.getContext('2d');

let frameNo = 0;          // global output frame index (video time = frameNo/FPS)
let buf = [];             // [name, dataURL] pending flush
export const marks = [];  // {id, t} — audio cue sheet, in output seconds

const now = () => frameNo / FPS;
const mark = (id, t) => marks.push({ id, t: t === undefined ? now() : t });

// ---- easing ----------------------------------------------------------------
const clamp01 = (u) => Math.max(0, Math.min(1, u));
const smooth = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
const easeOut = (u) => 1 - Math.pow(1 - clamp01(u), 3);
const easeIn = (u) => Math.pow(clamp01(u), 2.4);
const lerp = (a, b, u) => a + (b - a) * u;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mixV = (a, b, u) => a.clone().lerp(b, clamp01(u));

// ---- camera ----------------------------------------------------------------
const tmpUp = new THREE.Vector3(0, 1, 0);
function place(pos, look, fov = 50, dutch = 0) {
  const cam = stage().camera;
  cam.position.copy(pos);
  if (dutch) cam.up.set(Math.sin(dutch), Math.cos(dutch), 0); else cam.up.copy(tmpUp);
  cam.lookAt(look);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
}
// deterministic handheld jitter — no RNG, so re-shoots match frame for frame
const shake = (t, amp) => V(
  Math.sin(t * 0.0131) * amp + Math.sin(t * 0.0071) * amp * 0.6,
  Math.cos(t * 0.0113) * amp * 0.8,
  Math.sin(t * 0.0091 + 1.7) * amp * 0.5,
);

// live rig accessors
const P = () => S().player();
const O = () => S().opponent();
const headO = () => { try { return O().headPos(); } catch { return V(0, 1.2, 0); } };
const headP = () => { const p = V(); try { P().headMesh.getWorldPosition(p); } catch { p.set(0, 1.4, 0); } return p; };
const handP = () => { try { return P().handPos.clone(); } catch { return V(0, 1.2, 0); } };

// ---- trailer overlay language ---------------------------------------------
const RED = '#c8281c', GOLD = '#f6c945', CREAM = '#f7f0dc', INK = '#1b1710';
const FONT = (px, w = 900) => `${w} ${px}px Impact, "Arial Black", "Haettenschweiler", sans-serif`;

function bars(a = 1) {
  const b = Math.round(H * 0.075) * a;
  if (b <= 0) return;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, b); g.fillRect(0, H - b, W, b);
}
function vignette() {
  const r = g.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.95);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,0.42)');
  g.fillStyle = r; g.fillRect(0, 0, W, H);
}
function shadowText(text, x, y, font, fill, align = 'center', blur = 12) {
  g.font = font; g.textAlign = align; g.textBaseline = 'alphabetic';
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = blur; g.shadowOffsetY = 3;
  // NB: pull the px size out of the font string — parseInt() would read the weight
  const px = parseFloat((/(\d+(?:\.\d+)?)px/.exec(font) || [0, 20])[1]);
  g.lineWidth = Math.max(3, px * 0.1); g.strokeStyle = 'rgba(0,0,0,0.9)';
  g.strokeText(text, x, y);
  g.shadowBlur = 0; g.shadowOffsetY = 0;
  g.fillStyle = fill; g.fillText(text, x, y);
  g.restore();
}
// big centred act/title card; u drives a rise + fade
function titleCard(text, sub, u) {
  const a = Math.min(smooth(u * 3), smooth((1 - u) * 3));
  if (a <= 0.01) return;
  g.save(); g.globalAlpha = a;
  const y = H * 0.47 + (1 - easeOut(Math.min(1, u * 2.2))) * 26;
  shadowText(text, W / 2, y, FONT(Math.round(H * 0.115)), CREAM, 'center', 18);
  if (sub) shadowText(sub, W / 2, y + Math.round(H * 0.072), FONT(Math.round(H * 0.038), 700), GOLD, 'center', 10);
  g.restore();
}
// broadcast-style lower-third: red slab, name, tag
function namePlate(name, tag, u) {
  const inU = smooth(Math.min(1, u * 5)), outU = smooth(Math.min(1, (1 - u) * 5));
  const a = Math.min(inU, outU);
  if (a <= 0.01) return;
  const pad = 26, x = Math.round(W * 0.062) - (1 - inU) * 60;
  const y = Math.round(H * 0.775);
  g.save(); g.globalAlpha = a;
  g.font = FONT(38);
  const nw = g.measureText(name).width;
  g.font = FONT(21, 700);
  const tw = tag ? g.measureText(tag).width : 0;
  const bw = Math.max(nw, tw) + pad * 2;
  g.fillStyle = 'rgba(12,10,8,0.72)';
  g.fillRect(x, y - 46, bw, tag ? 84 : 62);
  g.fillStyle = RED; g.fillRect(x, y - 46, 9, tag ? 84 : 62);
  shadowText(name, x + pad, y, FONT(38), CREAM, 'left', 8);
  if (tag) shadowText(tag, x + pad, y + 27, FONT(21, 700), GOLD, 'left', 6);
  g.restore();
}
// bottom caption (spoken dialogue), wrapped
function caption(text, u) {
  const a = Math.min(smooth(u * 6), smooth((1 - u) * 6));
  if (a <= 0.01 || !text) return;
  g.save(); g.globalAlpha = a;
  const size = Math.round(H * 0.042);
  g.font = FONT(size, 700);
  const maxW = W * 0.82, words = text.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  const base = H - Math.round(H * 0.105) - (lines.length - 1) * size * 1.2;
  lines.forEach((ln, i) => shadowText(ln, W / 2, base + i * size * 1.2, FONT(size, 700), CREAM, 'center', 10));
  g.restore();
}
function flash(a, color = '#fff') {
  if (a <= 0.001) return;
  g.save(); g.globalAlpha = clamp01(a); g.fillStyle = color; g.fillRect(0, 0, W, H); g.restore();
}
// speed-lines rushing past for the big impacts
function speedLines(u, n = 26) {
  const a = Math.min(1, u) * 0.5;
  if (a <= 0.01) return;
  g.save(); g.globalAlpha = a; g.strokeStyle = '#fff'; g.lineWidth = 3;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + u * 0.6;
    const r0 = H * (0.42 + (i % 3) * 0.08) + u * 120;
    const r1 = r0 + 90 + (i % 4) * 40;
    g.beginPath();
    g.moveTo(W / 2 + Math.cos(ang) * r0, H / 2 + Math.sin(ang) * r0);
    g.lineTo(W / 2 + Math.cos(ang) * r1, H / 2 + Math.sin(ang) * r1);
    g.stroke();
  }
  g.restore();
}

// ---- capture ---------------------------------------------------------------
function grab(ov) {
  const st = stage();
  st.renderer.render(st.scene, st.camera);
  g.drawImage(st.renderer.domElement, 0, 0, W, H);
  vignette();
  if (ov) ov();
  bars();
  const name = `f_${String(frameNo).padStart(6, '0')}.jpg`;
  buf.push([name, out.toDataURL('image/jpeg', 0.92)]);
  frameNo++;
}
async function flush() {
  for (const [name, url] of buf) {
    const bin = atob(url.slice(url.indexOf(',') + 1));
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    await fetch(`${SINK}/${name}`, { method: 'POST', body: arr });
  }
  buf = [];
}

// ---- the scripted swing (the standard competent chain from CLAUDE.md) ------
const SWING = (t0) => [
  [t0, 'KeyS', true], [t0 + 1000, 'KeyS', false],
  [t0 + 1150, 'KeyL', true], [t0 + 1250, 'KeyL', false],
  [t0 + 1330, 'KeyA', true], [t0 + 1430, 'KeyA', false],
  [t0 + 1470, 'KeyP', true], [t0 + 1570, 'KeyP', false],
];
const CONTACT = 4083;   // sim-ms of the IMPACT transition for SWING(2600) — measured

// ---- shot runner -----------------------------------------------------------
// A shot = { id, opp, world, slapper, dur, swing, cap:[a,b], slow:[a,b], cam, ov, pre }
async function runShot(sh) {
  const s = S();
  // release anything stuck before a new attempt (drive() gotcha #2)
  for (const c of ['KeyS', 'KeyL', 'KeyA', 'KeyP']) dispatchEvent(new KeyboardEvent('keyup', { code: c }));
  if (sh.slapper) s.setLook(sh.slapper);
  if (sh.opp) s._vs(sh.opp);
  if (sh.world) stage().setWorldTheme(sh.world);
  if (sh.pre) sh.pre(stage(), s);

  const [ca, cb] = sh.cap;
  const slow = sh.slow || [-1, -1];
  const startFrame = frameNo;
  const events = sh.swing ? SWING(2600) : [];
  follow = null;                                   // each shot re-acquires the flyer

  s.drive(events, cb / 1000, (sim, i) => {
    if (sim < ca || sim > cb) return;
    const inSlow = sim >= slow[0] && sim <= slow[1];
    if (!inSlow && i % 2 !== 0) return;         // 60fps sim → 30fps out (1× speed)
    const u = (sim - ca) / (cb - ca);           // shot progress 0..1
    sh.cam(sim, u);
    grab(sh.ov ? () => sh.ov(sim, u) : null);
  });
  await flush();
  return { id: sh.id, frames: frameNo - startFrame, sec: +((frameNo - startFrame) / FPS).toFixed(2) };
}

// ---------------------------------------------------------------------------
// STORYBOARD
// ---------------------------------------------------------------------------
// Camera vocabulary ----------------------------------------------------------
// All framings below were validated against a probe contact sheet (tools probe()).
// The ring's action centre is ~(0.5,1.5,0); the crowd stands behind a rail, so
// front-on lenses below y≈1.2 shoot into spectators — the worm's-eye angles
// deliberately come in from the lane side where the rail is open.
const D = Math.PI / 180;
const ACT = () => V(0.5, 1.5, 0);
const orb = (thDeg, r, h, c) => {
  const a = (c || ACT());
  return V(a.x + Math.sin(thDeg * D) * r, h, a.z + Math.cos(thDeg * D) * r);
};
// tight two-shot that eases in over the shot
const pushIn = (th0, r0, th1, r1, h, fov0, fov1, dutch = 0) => (t, u) => {
  const k = easeOut(u);
  place(orb(lerp(th0, th1, k), lerp(r0, r1, k), h).add(shake(t, 0.028)), ACT(), lerp(fov0, fov1, k), dutch);
};
// Trail the launched body. A rigid offset looks glued to the victim, so the rig
// chases a damped point — the body leads the lens slightly, which reads as speed.
// Keep the trail short (≈6m): the engine's own chase sits ~10m back and at that
// distance a flying farmhand is a speck.
let follow = null;
const chaseFly = (fov = 45, back = 4.6, up = 1.5, side = 2.8, k = 0.24) => {
  const b = headO();
  if (!follow) follow = b.clone(); else follow.lerp(b, k);
  place(V(follow.x - back, follow.y + up, follow.z + side), b, fov);
};

const SHOTS = [
  // ===================== ACT 0 — THE FAIR ==================================
  {
    id: 's01_crane', opp: 'hank', world: 'day', slapper: 'charlie',
    cap: [200, 5200],
    pre: (st) => { st.kidsCelebrate(9); st.spawnConfetti(V(6, 5, 0)); },
    cam: (t, u) => {
      const p = mixV(V(-16, 22, 30), V(2, 4.2, 14), easeOut(u)).add(shake(t, 0.05));
      place(p, V(6, 1.6, 0), lerp(58, 46, u));
    },
    ov: (t, u) => { titleCard('SLAPMANIA', 'THE OFFICIAL SLAPPING CONTEST SIMULATOR', clamp01((u - 0.14) / 0.66)); },
  },
  {
    // the whole fair swinging past: crowd, rides, animals, the ring
    id: 's02_crowd', cap: [200, 4300],
    pre: (st) => { st.kidsCelebrate(9); st.spawnConfetti(V(2, 4.5, -6)); st.spawnConfetti(V(8, 5, 3)); },
    cam: (t, u) => {
      const a = lerp(-52, 34, easeOut(u)) * D;
      place(V(0.5 + Math.sin(a) * 8.6, lerp(2.6, 3.4, u), Math.cos(a) * 8.6).add(shake(t, 0.07)), V(1.5, 1.7, 0), 54);
    },
    ov: (t, u) => caption('They came to dance. They came to watch a man get slapped into the next county!', u),
  },
  {
    id: 's03_charlie', cap: [200, 3600],
    // hero close-up on the slapper. He faces +x, so the lens has to come from
    // down-lane (θ≈150°) to catch his face — anything behind him shoots his hair.
    cam: (t, u) => {
      const b = P().root.position, look = V(b.x, 1.42, 0);
      const k = easeOut(u);
      place(orb(lerp(158, 146, k), lerp(3.1, 2.35, k), 1.52, look).add(shake(t, 0.03)), look, lerp(42, 36, k), -0.05);
    },
    ov: (t, u) => { namePlate("SLAPPIN' CHARLIE", 'SHORT KING · MAXIMUM LEVERAGE', u); caption("Name's Charlie. Five foot four of pure leverage.", u); },
  },

  // ===================== ACT 1 — THE ROUNDS ================================
  {
    id: 's04_hank', opp: 'hank', world: 'day', swing: true,
    cap: [3200, 8200], slow: [CONTACT - 140, CONTACT + 420],
    // tight two-shot holds through the wind-up, then hands off to the chase
    cam: (t) => {
      if (t < CONTACT + 160) {
        const k = easeOut((t - 3200) / 1000);
        place(orb(lerp(30, 22, k), lerp(2.9, 2.4, k), 1.62).add(shake(t, 0.03)), ACT(), lerp(42, 38, k));
      } else chaseFly(50);
    },
    ov: (t, u) => {
      namePlate('HAYSEED HANK', 'MIDDLEWEIGHT · THE POINTS KING', clamp01(u * 3.4));
      caption('Go easy now, son. I got a pie in the oven.', clamp01((3900 - t) / 500) * clamp01((t - 3300) / 400));
      if (t > CONTACT && t < CONTACT + 500) speedLines((t - CONTACT) / 500);
      flash(t >= CONTACT && t < CONTACT + 90 ? 0.5 : 0);
    },
  },
  {
    id: 's05_bertha', opp: 'bertha', swing: true,
    cap: [3400, 7600], slow: [CONTACT - 120, CONTACT + 380],
    // worm's-eye from the open lane side — the palm swings over the lens
    cam: (t) => {
      if (t < CONTACT + 180) place(orb(58, 2.9, 0.46).add(shake(t, 0.02)), V(0.6, 1.45, 0), 42, 0.13);
      else chaseFly(52);
    },
    ov: (t, u) => {
      namePlate('BIG BERTHA', 'HEAVYWEIGHT · UNMOVED BY WEATHER', clamp01(u * 3.4));
      caption('Sonny. I have been slapped by weather.', clamp01((t - 3500) / 500) * clamp01((CONTACT - 100 - t) / 500));
      flash(t >= CONTACT && t < CONTACT + 80 ? 0.45 : 0);
    },
  },
  {
    id: 's06_slim', opp: 'slim', swing: true,
    cap: [3600, 8600], slow: [CONTACT - 100, CONTACT + 260],
    // from behind the victim, then a long crane out as the dart leaves the county
    cam: (t) => {
      if (t < CONTACT + 120) place(orb(104, 3.1, 1.72).add(shake(t, 0.03)), ACT(), 44);
      else {
        const b = headO(), k = easeOut((t - CONTACT) / 2800);
        place(V(b.x - lerp(7, 15, k), b.y + lerp(2, 7, k), b.z + lerp(5, 11, k)), V(b.x, b.y, b.z), lerp(48, 58, k));
      }
    },
    ov: (t, u) => {
      namePlate('SLIM PETE', 'FEATHERWEIGHT · FLIES LIKE A DART', clamp01(u * 3.4));
      if (t > CONTACT + 300) caption('Slim Pete has LEFT the county!', clamp01((t - CONTACT - 300) / 600));
      flash(t >= CONTACT && t < CONTACT + 70 ? 0.45 : 0);
    },
  },
  {
    id: 's07_don', opp: 'don', swing: true,
    cap: [3500, 7800], slow: [CONTACT - 110, CONTACT + 320],
    // straight down the lane, low and flat — then crane up as he goes
    cam: (t) => {
      if (t < CONTACT + 150) place(orb(80, 3.4, 1.58).add(shake(t, 0.03)), ACT(), 44);
      else { const b = headO(), k = easeOut((t - CONTACT) / 2400); place(V(b.x - 7, b.y + lerp(2, 6.5, k), b.z + lerp(4.5, 8, k)), V(b.x, b.y, b.z), 52); }
    },
    ov: (t, u) => {
      namePlate('TREMENDOUS DON', 'EXECUTIVE · TALKS THROUGH IT', clamp01(u * 3.4));
      caption('Nobody has ever been slapped harder. People are saying it.', clamp01((t - 3600) / 500) * clamp01((CONTACT - 60 - t) / 500));
      flash(t >= CONTACT && t < CONTACT + 80 ? 0.5 : 0);
    },
  },

  // ===================== ACT 2 — SILICON VALLEY ============================
  {
    id: 's08_valley', opp: 'vance', world: 'techcampus',
    cap: [200, 3400],
    cam: (t, u) => place(mixV(V(-13, 7.5, 17), V(-1, 3.6, 10.5), easeOut(u)).add(shake(t, 0.05)), V(4, 1.7, -1), 50),
    ov: (t, u) => titleCard('MEANWHILE, IN THE VALLEY', 'ROUND TWO: THE DISRUPTORS', clamp01((u - 0.05) / 0.8)),
  },
  {
    id: 's09_dario', opp: 'dario', world: 'techcampus', swing: true,
    cap: [2400, 8400], slow: [CONTACT - 130, CONTACT + 400],
    cam: (t) => {
      if (t < CONTACT + 150) { const k = easeOut((t - 2400) / 1680); place(orb(lerp(38, 26, k), lerp(3.5, 2.35, k), 1.66).add(shake(t, 0.028)), ACT(), lerp(46, 38, k)); }
      else chaseFly(52);
    },
    ov: (t, u) => {
      namePlate('DARIO SLAPMODE', 'RESPONSIBLE SCALING', clamp01(u * 3.4));
      caption('This palm is more capable than we expected. Section four is my cheek.', clamp01((t - 2600) / 600) * clamp01((CONTACT - 60 - t) / 500));
      flash(t >= CONTACT && t < CONTACT + 80 ? 0.5 : 0);
    },
  },
  {
    id: 's10_mira', opp: 'mira', world: 'techcampus', swing: true,
    cap: [2500, 8300], slow: [CONTACT - 130, CONTACT + 420],
    cam: (t) => {
      if (t < CONTACT + 160) { const k = easeOut((t - 2500) / 1580); place(orb(lerp(-16, -8, k), lerp(2.9, 2.15, k), 1.6).add(shake(t, 0.026)), ACT(), lerp(44, 37, k), 0.05); }
      else { const b = headO(), k = easeOut((t - CONTACT) / 2200); place(V(b.x - 7.5, b.y + lerp(1.4, 3.4, k), b.z + 5.2), V(b.x, b.y, b.z), 50); }
    },
    ov: (t, u) => {
      namePlate('MIRACLE MIRA', 'DISRUPTOR · ONE DROP OF SLOP', clamp01(u * 3.4));
      if (t < CONTACT) caption('One drop of blood can run a thousand tests. One slap runs exactly one.', clamp01((t - 2650) / 600) * clamp01((CONTACT - 60 - t) / 500));
      else caption('The results are inconclusive!', clamp01((t - CONTACT - 400) / 400));
      flash(t >= CONTACT && t < CONTACT + 80 ? 0.5 : 0);
    },
  },
  {
    id: 's11_slop', opp: 'slopberg', world: 'techcampus', swing: true,
    cap: [2600, 8200], slow: [CONTACT - 110, CONTACT + 360],
    cam: (t) => {
      if (t < CONTACT + 150) { const k = easeOut((t - 2600) / 1480); place(orb(lerp(64, 54, k), lerp(3.6, 3.0, k), 1.72).add(shake(t, 0.035)), ACT(), lerp(46, 42, k)); }
      else chaseFly(48);
    },
    ov: (t, u) => {
      namePlate('MARK SLOPBERG', 'JUST A NORMAL GUY', clamp01(u * 3.4));
      caption('Just a normal guy. Normal house. Forty bathrooms. Have you met my cows?', clamp01((t - 2750) / 600) * clamp01((CONTACT - 60 - t) / 500));
      flash(t >= CONTACT && t < CONTACT + 80 ? 0.5 : 0);
    },
  },
  {
    id: 's12_mars', opp: 'marswell', world: 'techcampus', swing: true,
    cap: [3000, 8600], slow: [CONTACT - 110, CONTACT + 340],
    // canted high angle — he is, after all, posting
    cam: (t) => {
      if (t < CONTACT + 150) place(orb(46, 2.5, 2.15).add(shake(t, 0.03)), ACT(), 40, -0.14);
      else { const b = headO(), k = easeOut((t - CONTACT) / 2600); place(V(b.x - 8, b.y + lerp(2.5, 8, k), b.z + 6.2), V(b.x, b.y, b.z), lerp(48, 60, k)); }
    },
    ov: (t, u) => {
      namePlate('X MARSWELL', 'FOUNDER · TO MARS, POSTING', clamp01(u * 3.4));
      if (t < CONTACT) caption('Funding secured. Slap deflected. Both are basically confirmed.', clamp01((t - 3150) / 500) * clamp01((CONTACT - 60 - t) / 500));
      else caption('I am posting through it.', clamp01((t - CONTACT - 500) / 400));
      flash(t >= CONTACT && t < CONTACT + 80 ? 0.5 : 0);
    },
  },

  // ===================== ACT 3 — THE COUCH =================================
  {
    id: 's13_cat', opp: 'inkblot', world: 'therapy',
    cap: [200, 4600],
    pre: (st) => { if (st.setCatCine) st.setCatCine(true); if (st.setCatReact) st.setCatReact(true); },
    // Open wide on the consulting room — couch, bookshelves, red carpet — then
    // push down the rug until the cat fills the lens.
    // NB: cinePoints.cat is a getter FUNCTION; reading .x off it yields NaN and
    // the entire frame renders black.
    cam: (t, u) => {
      const cf = stage().cinePoints && stage().cinePoints.cat;
      const cp = (typeof cf === 'function' && cf()) || V(28.6, 4.7, 8.6);
      const k = easeOut(u);
      const look = mixV(V(cp.x - 8, cp.y - 1.7, cp.z - 3.6), V(cp.x, cp.y - 0.5, cp.z), k);
      place(mixV(V(10, 4.5, 6), V(cp.x - 7.4, 2.7, cp.z - 4.8), k).add(shake(t, 0.03)), look, lerp(56, 45, k));
    },
    ov: (t, u) => { titleCard('SESSION THREE', 'THE CAT IS TAKING NOTES', clamp01((u - 0.02) / 0.5)); caption('The cat does not blink.', clamp01((u - 0.58) / 0.28)); },
  },
  {
    id: 's14_ian', opp: 'inkblot', world: 'therapy', swing: true,
    cap: [3000, 7600], slow: [CONTACT - 110, CONTACT + 320],
    pre: (st) => { if (st.setCatCine) st.setCatCine(false); if (st.setCatReact) st.setCatReact(false); },
    cam: (t) => {
      if (t < CONTACT + 150) place(orb(30, 2.35, 1.6).add(shake(t, 0.03)), ACT(), 39, 0.08);
      else chaseFly(52);
    },
    ov: (t, u) => {
      namePlate('INKBLOT IAN', 'TEST SUBJECT', clamp01(u * 3.4));
      caption('I see a butterfly. I see my father. I see a hand, I see a hand—', clamp01((t - 3100) / 500) * clamp01((CONTACT - 40 - t) / 400));
      flash(t >= CONTACT && t < CONTACT + 80 ? 0.5 : 0);
    },
  },
  {
    id: 's15_freud', opp: 'freuden', world: 'therapy', swing: true,
    cap: [2900, 8900], slow: [CONTACT - 140, CONTACT + 440],
    cam: (t) => {
      if (t < CONTACT + 170) { const k = easeOut((t - 2900) / 1180); place(orb(lerp(-30, -18, k), lerp(3.2, 2.3, k), 1.68).add(shake(t, 0.025)), ACT(), lerp(46, 38, k)); }
      else chaseFly(44, 3.6, 1.2, 2.2);      // indoors: the room is tight, stay close
    },
    ov: (t, u) => {
      namePlate('DR. FREUDENSCHADE', 'BOSS · THE TALKING CURE', clamp01(u * 3.4));
      if (t < CONTACT) caption('Tell me about your mother. Tell me why you clench the palm.', clamp01((t - 3000) / 600) * clamp01((CONTACT - 60 - t) / 500));
      else caption('Ahhh. The mother.', clamp01((t - CONTACT - 700) / 400));
      flash(t >= CONTACT && t < CONTACT + 80 ? 0.5 : 0);
    },
  },

  // ===================== ACT 4 — FINALE ====================================
  {
    id: 's16_celebrate', opp: 'hank', world: 'day', slapper: 'charlie',
    cap: [200, 4400],
    pre: (st) => {
      st.kidsCelebrate(10);
      st.spawnConfetti(V(4, 6, 0)); st.spawnConfetti(V(-2, 5, -4)); st.spawnConfetti(V(9, 5.5, 4));
      if (st.summonSpirits) st.summonSpirits(10);
    },
    cam: (t, u) => {
      const a = lerp(-38, 58, easeOut(u)) * D;
      place(V(2 + Math.sin(a) * 8.4, lerp(2.2, 4.2, u), Math.cos(a) * 8.4).add(shake(t, 0.06)), V(2.5, 1.8, -0.5), 52);
    },
    ov: (t, u) => caption('SLAPMASTER! The whole county is on its feet!', clamp01(u * 2.4)),
  },
  {
    id: 's17_turn', opp: 'slim', world: 'day',
    cap: [200, 3200],
    // over the volunteer's shoulder — this is the lens the viewer is about to become
    cam: (t, u) => {
      const h = headO(), p = headP(), k = easeOut(u);
      const d = V(p.x - h.x, 0, p.z - h.z).normalize();      // cheek → slapper
      const perp = V(d.z, 0, -d.x);
      const back = lerp(2.2, 1.5, k);
      place(h.clone().addScaledVector(d, -back).addScaledVector(perp, 0.95).setY(1.51).add(shake(t, 0.025)),
        V(p.x, 1.42, p.z), lerp(40, 36, k));
    },
    ov: (t, u) => caption('You have been watching a while, friend. Step on up.', clamp01(u * 2.4)),
  },
  {
    // THE VIEWER SLAP — the lens stands in for the volunteer's cheek.
    id: 's18_pov', opp: 'slim', world: 'day', swing: true,
    cap: [3000, 4700], slow: [CONTACT - 800, CONTACT + 250],
    pre: () => { const c = stage().camera; c.near = 0.02; c.updateProjectionMatrix(); },
    cam: (t) => {
      const h = headO(), p = headP();
      // Sit just OUTSIDE the cheek, not at its centre: parked on the head's origin
      // the lens is inside the skull mesh and the frame fills with black backfaces.
      const d = V(p.x - h.x, 0, p.z - h.z).normalize();
      // lock to where the cheek was — after contact the ragdoll tumbles, the lens does not
      if (t < CONTACT - 30) window.__povAnchor = h.clone().addScaledVector(d, 0.30);
      const a = window.__povAnchor || h;
      place(a, V(p.x, p.y - 0.06, p.z), 62);
    },
    ov: (t) => {
      if (t > CONTACT - 420) speedLines(clamp01((t - CONTACT + 420) / 420), 34);
      if (t >= CONTACT) flash(1 - clamp01((t - CONTACT) / 260) * 0.12);
    },
  },
  {
    id: 's19_logo', world: 'day',
    cap: [200, 3600],
    pre: (st) => { const c = stage().camera; c.near = 0.1; c.updateProjectionMatrix(); st.kidsCelebrate(8); st.spawnConfetti(V(4, 6, 0)); },
    cam: (t, u) => place(V(2 + u * 1.6, 3.4, 12.5).add(shake(t, 0.03)), V(6, 1.8, 0), 48),
    ov: (t, u) => {
      flash(1 - smooth(clamp01(u * 5)));            // resolve out of the white
      titleCard('SLAPMANIA', 'SLAPMANIA.ORG — FREE TO PLAY. BRING A CHEEK.', clamp01((u - 0.12) / 0.85));
    },
  },
];

// ---- framing probe ---------------------------------------------------------
// Renders candidate camera setups as stills so a framing can be eyeballed before
// a shot is committed. The ring's action centre is ~(0.5, 1.5, 0) and the
// engine's own faceoff camera sits at (0.4, 1.95, 4.2) — anything much below
// y≈1.2 from the front shoots straight into the rail crowd.
export const ACTION = () => V(0.5, 1.5, 0);
export function orbitPos(theta, radius, height, c = ACTION()) {
  return V(c.x + Math.sin(theta) * radius, height, c.z + Math.cos(theta) * radius);
}
export async function probe(specs, opp = 'hank', world = 'day', atMs = 3000) {
  const s = S();
  if (opp) s._vs(opp);
  if (world) stage().setWorldTheme(world);
  const shots = [];
  // step to a posed moment first so the rig isn't in its spawn pose
  s.drive([], atMs / 1000, () => {});
  for (let i = 0; i < specs.length; i++) {
    const sp = specs[i];
    place(sp.pos, sp.look || ACTION(), sp.fov || 50, sp.dutch || 0);
    const st = stage();
    st.renderer.render(st.scene, st.camera);
    g.drawImage(st.renderer.domElement, 0, 0, W, H);
    shadowText(sp.label || `#${i}`, 24, 56, FONT(34), GOLD, 'left', 8);
    const url = out.toDataURL('image/jpeg', 0.85);
    const bin = atob(url.slice(url.indexOf(',') + 1));
    const arr = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
    await fetch(`${SINK}/probe_${String(i).padStart(2, '0')}.jpg`, { method: 'POST', body: arr });
    shots.push(sp.label || `#${i}`);
  }
  return shots;
}

// ---- driver ----------------------------------------------------------------
let cursor = 0;
export const report = [];

export async function boot() {
  const st = stage();
  st.renderer.setPixelRatio(1);
  st.renderer.setSize(W, H, false);
  st.camera.aspect = W / H;
  st.camera.updateProjectionMatrix();
  S().freeze(true);           // stop the live rAF loop; drive() owns the clock now
  frameNo = 0; cursor = 0; marks.length = 0; report.length = 0;
  return { shots: SHOTS.length, size: [W, H], fps: FPS };
}

// Re-shoot a tail without redoing good footage: frames are named by index, so
// pointing the cursor and the counter at a shot boundary overwrites just that run.
export function resume(cursorIdx, frameIdx) {
  cursor = cursorIdx; frameNo = frameIdx;
  return { cursor, frameNo };
}

export async function runNext(n = 1) {
  const done = [];
  for (let i = 0; i < n && cursor < SHOTS.length; i++, cursor++) {
    const sh = SHOTS[cursor];
    mark(sh.id);                                   // audio cue: shot start, in output seconds
    const r = await runShot(sh);
    report.push(r); done.push(r);
  }
  return { done, cursor, total: SHOTS.length, frames: frameNo, sec: +(frameNo / FPS).toFixed(2), finished: cursor >= SHOTS.length };
}

export const cues = () => marks;
export const shotList = () => SHOTS.map((s) => s.id);
