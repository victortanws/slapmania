// ---------------------------------------------------------------------------
// vlog.js — "CHARLIE'S SLAP VLOG": a walk-and-talk tour of the county fair.
//
//     const Vg = await import('/tools/vlog.js'); await Vg.boot();
//     await Vg.runNext(3);   // repeat until .finished
//
// Everything generic lives in cinema.js; this file is only the storyboard, the
// walker, and the phone-camera rig. Charlie actually WALKS the route — legs
// swinging via player.walkPose, path resolved by navigate.js against the real
// crowd and the real props — so when he steps round a spectator, that is
// collision, not animation.
// ---------------------------------------------------------------------------
import { createCinema, V, lerp, easeOut, clamp01, smooth, shake, SANS, CREAM, GOLD } from './cinema.js';
import { adaptStage } from '../js/navigate.js';

const S = () => window.__slapp;
const stage = () => window.__slapp.stage;
const P = () => window.__slapp.player();

let C = null, nav = null;

// ---- the walker: drives Charlie along a route with real navigation ---------
const walker = {
  pos: { x: -9, z: 5.5, heading: 0 },
  route: [], idx: 0, speed: 1.55, t: 0, moving: true,
  set(routePts, start, speed = 1.55) {
    this.route = routePts; this.idx = 0; this.t = 0; this.moving = true;
    if (start) this.pos = { x: start.x, z: start.z, heading: start.heading || 0 };
    if (speed) this.speed = speed;
  },
  step(dt) {
    const p = P();
    if (this.moving && this.idx < this.route.length) {
      const r = nav.steer(this.pos, this.route[this.idx], this.speed, dt, 0.36);
      this.pos = { x: r.x, z: r.z, heading: r.heading };
      if (r.arrived) this.idx++;
      this.t += dt;
      p.walkPose(this.t, 1);
    } else {
      p.standPose();
    }
    // applied AFTER the engine's own tick, which parks him at baseX every frame
    p.root.position.x = this.pos.x;
    p.root.position.z = this.pos.z;
    p.root.rotation.y = -this.pos.heading;   // model faces +x at yaw 0
    return this.pos;
  },
  headPos() {
    const v = V(); try { P().headMesh.getWorldPosition(v); } catch { v.set(this.pos.x, 1.45, this.pos.z); }
    return v;
  },
  fwd() { return V(Math.cos(this.pos.heading), 0, Math.sin(this.pos.heading)); },
};

// ---- the phone rig --------------------------------------------------------
// A held camera never sits still: it bobs on the operator's stride and lags a
// beat behind the turn. Both are deterministic functions of sim time.
function selfie(t, dist = 2.3, height = -0.12, fov = 54) {
  const h = walker.headPos(), f = walker.fwd();
  const bob = Math.sin(walker.t * 8.2) * 0.035 + Math.sin(walker.t * 16.4) * 0.012;
  const pos = V(h.x + f.x * dist, h.y + height + bob, h.z + f.z * dist).add(shake(t, 0.045));
  // aim at the chest, not the eyes — framing on the head alone crops his legs
  // off the bottom and the whole point is that you can see him walking
  C.place(pos, V(h.x, h.y - 0.42 + bob * 0.5, h.z), fov);
}
// he turns the phone around to show you something
function showMe(t, target, back = 0.35, fov = 58) {
  const h = walker.headPos(), f = walker.fwd();
  const pos = V(h.x + f.x * back, h.y + 0.06 + Math.sin(walker.t * 8.2) * 0.03, h.z + f.z * back).add(shake(t, 0.07));
  C.place(pos, target, fov);
}

// ---- captions -------------------------------------------------------------
// cinema's caption() takes LIFETIME PROGRESS (0→1) and does its own fade at
// both ends — passing a peak-at-1 envelope makes it vanish exactly when the
// line should be brightest.
const cap = (t, text, from, to) => {
  if (t < from || t > to) return;
  C.caption(text, (t - from) / (to - from), { sans: true, size: 0.038, bottom: 0.085 });
};

const ROUTE_A = [{ x: -3, z: 4.2 }, { x: 4, z: 2.0 }, { x: 10, z: 0.5 }];
const ROUTE_B = [{ x: 6, z: -3.4 }, { x: 0.4, z: -1.2 }];

const SHOTS = [
  {
    // COLD OPEN — fumbling the phone on, mid-sentence, already walking
    id: 'v1_open', world: 'day', slapper: 'charlie', opp: 'hank',
    cap: [200, 5200],
    pre: () => walker.set(ROUTE_A, { x: -9, z: 5.5, heading: 0 }, 1.5),
    tick: (sim) => walker.step(1 / 60),
    cam: (t, u) => selfie(t, lerp(1.55, 2.35, easeOut(u)), -0.1, lerp(60, 54, u)),
    ov: (t, u) => {
      C.recHud(t / 1000, { battery: 0.41 });
      cap(t, 'Oh — is it recording? Okay. Hi. Charlie here.', 500, 3400);
      C.flash(1 - smooth(clamp01(u * 8)));
    },
    style: { bars: 0.02, vignette: 0.28 },
  },
  {
    // WALK AND TALK — the crowd is solid, so he has to pick his way through
    id: 'v2_walk', cap: [200, 6600],
    tick: () => walker.step(1 / 60),
    cam: (t, u) => selfie(t, lerp(2.35, 2.0, smooth(u)), -0.12, 52),
    ov: (t) => {
      C.recHud((5.2 + t / 1000), { battery: 0.4 });
      cap(t, 'Welcome to the county fair. This is where I work.', 300, 3200);
      cap(t, 'People keep asking me what SlapMania actually is.', 3500, 6400);
    },
    style: { bars: 0.02, vignette: 0.28 },
  },
  {
    // HE TURNS THE PHONE ROUND — the fair, the rides, the lane
    id: 'v3_show', cap: [200, 5200],
    tick: () => walker.step(1 / 60),
    cam: (t, u) => {
      const look = mixLook(u);
      showMe(t, look, 0.4, lerp(56, 62, smooth(u)));
    },
    ov: (t) => {
      C.recHud((11.8 + t / 1000), { battery: 0.38 });
      cap(t, "So: four keys. Swivel, lunge, arm, palm.", 300, 3000);
      cap(t, 'In that order. On the beat.', 3200, 5000);
    },
    style: { bars: 0.02, vignette: 0.3 },
  },
  {
    // BACK TO HIS FACE — the pitch
    id: 'v4_pitch', cap: [200, 4800],
    pre: () => { walker.moving = false; },
    tick: () => walker.step(1 / 60),
    cam: (t, u) => selfie(t, lerp(2.0, 1.5, easeOut(u)), -0.06, lerp(52, 46, u)),
    ov: (t) => {
      C.recHud((17.0 + t / 1000), { battery: 0.37 });
      cap(t, 'Get it right and a grown man crosses the county line.', 300, 4600);
    },
    style: { bars: 0.02, vignette: 0.28 },
  },
  {
    // MEET THE VOLUNTEER — walks over to Hank, phone swings onto him
    id: 'v5_hank', cap: [200, 6000],
    pre: () => { walker.moving = true; walker.set(ROUTE_B, walker.pos, 1.35); },
    tick: () => walker.step(1 / 60),
    cam: (t, u) => {
      const o = oppHead();
      if (u < 0.55) selfie(t, 2.1, -0.1, 52);
      else showMe(t, V(o.x, o.y, o.z), 0.5, lerp(58, 44, smooth((u - 0.55) / 0.45)));
    },
    ov: (t) => {
      C.recHud((21.8 + t / 1000), { battery: 0.35 });
      cap(t, 'This is Hank. Hank has volunteered eleven times.', 300, 3300);
      cap(t, '"I keep hoping he\'ll miss."  — Hank', 3600, 5800);
    },
    style: { bars: 0.02, vignette: 0.28 },
  },
  {
    // THE DEMO — phone goes on the rail, real slap, real flight
    id: 'v6_demo', world: 'day', opp: 'hank', swing: true,
    cap: [2600, 9000], slow: [3943, 4503],
    pre: () => { walker.moving = false; },
    cam: (t) => {
      if (t < 4243) {
        C.place(V(2.7, 1.32, 2.5).add(shake(t, 0.05)), V(0.6, 1.45, 0), 44);
      } else {
        const b = oppHead();
        C.place(V(b.x - 5.0, Math.max(1.6, b.y + 1.6), b.z + 3.2).add(shake(t, 0.06)), V(b.x, b.y, b.z), 48);
      }
    },
    ov: (t) => {
      C.recHud((27.8 + t / 1000), { battery: 0.33 });
      cap(t, 'Watch the hay wall. Sixty-two metres out.', 2700, 4000);
      if (t > 4083 && t < 4600) C.speedLines((t - 4083) / 520, 22);
      C.flash(t >= 4083 && t < 4160 ? 0.42 : 0);
      cap(t, '...sorry, Hank.', 5200, 8800);
    },
    style: { bars: 0.02, vignette: 0.3 },
  },
  {
    // OUTRO — walks off toward the lane, sign-off, phone drops
    id: 'v7_outro', world: 'day', opp: 'hank',
    cap: [200, 5600],
    pre: () => { walker.moving = true; walker.set([{ x: 12, z: 1.5 }, { x: 20, z: 2.5 }], { x: 2, z: 1.0, heading: 0 }, 1.5); },
    tick: () => walker.step(1 / 60),
    cam: (t, u) => selfie(t, lerp(1.9, 2.6, smooth(u)), -0.1, 52),
    ov: (t, u) => {
      C.recHud((36.8 + t / 1000), { battery: 0.31 });
      cap(t, "That's SlapMania. slapmania.org — free to play.", 300, 3400);
      cap(t, 'Bring a cheek.', 3600, 5200);
      C.flash(smooth(clamp01((u - 0.88) / 0.12)) * 0.9, '#000');
    },
    style: { bars: 0.02, vignette: 0.3 },
  },
];

// look target for the "show me" pan: sweeps the fair, ends down the lane
function mixLook(u) {
  const a = lerp(-0.7, 0.55, smooth(u));
  return V(walker.pos.x + Math.cos(a) * 22, lerp(3.2, 1.4, u), walker.pos.z + Math.sin(a) * 22);
}
function oppHead() {
  try { return S().opponent().headPos(); } catch { return V(0.8, 1.55, 0); }
}

export async function boot() {
  const st = stage();
  nav = adaptStage(st);
  C = createCinema({
    renderer: st.renderer, scene: st.scene, camera: st.camera,
    step: (ev, sec, cb) => S().drive(ev, sec, cb),
    // the only game-aware staging: pick the cast, set the world, run per-shot pre
    setup: (sh) => {
      for (const c of ['KeyS', 'KeyL', 'KeyA', 'KeyP']) dispatchEvent(new KeyboardEvent('keyup', { code: c }));
      if (sh.slapper) S().setLook(sh.slapper);
      if (sh.opp) S()._vs(sh.opp);
      if (sh.world) st.setWorldTheme(sh.world);
      if (sh.opp || sh.world) nav.rebuild();
      sh.events = sh.swing ? [
        [2600, 'KeyS', true], [3600, 'KeyS', false],
        [3750, 'KeyL', true], [3850, 'KeyL', false],
        [3930, 'KeyA', true], [4030, 'KeyA', false],
        [4070, 'KeyP', true], [4170, 'KeyP', false],
      ] : [];
      if (sh.pre) sh.pre();
    },
  });
  S().freeze(true);
  return C.boot(SHOTS);
}
export const runNext = (n = 1) => C.runNext(SHOTS, n);
export const resume = (c, f) => C.resume(c, f);
export const cues = () => C.marks;
export const probe = (specs, atMs) => C.probe(specs, atMs);
export const shots = () => SHOTS.map((s) => s.id);
