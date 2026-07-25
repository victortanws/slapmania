// ---------------------------------------------------------------------------
// promo.js — "THE FARM": Charlie walks his property, explains that a slapping
// contest is agriculture, and harvests one (1) volunteer.
//
//     const Pr = await import('/tools/promo.js'); await Pr.boot();
//     await Pr.runNext(4);   // repeat until .finished
//
// Mostly walking and surveying; the slap is the centrepiece, covered from four
// cameras. Because drive() is deterministic, re-running the same scripted swing
// under a different lens is genuinely the SAME slap from another angle — a real
// multi-camera shoot, not four different takes.
//
// Walking goes through js/actor.js + js/navigate.js, so Charlie steps around the
// spectators for real.
// ---------------------------------------------------------------------------
import { createCinema, V, lerp, easeOut, clamp01, smooth, shake, CREAM, GOLD } from './cinema.js';
import { createNav } from '../js/navigate.js';
import { createActor, createCast, playerRig } from '../js/actor.js';

const S = () => window.__slapp;
const stage = () => window.__slapp.stage;

let C = null, nav = null, cast = null, charlie = null;
const CONTACT = 4083;
const SWING = [
  [2600, 'KeyS', true], [3600, 'KeyS', false],
  [3750, 'KeyL', true], [3850, 'KeyL', false],
  [3930, 'KeyA', true], [4030, 'KeyA', false],
  [4070, 'KeyP', true], [4170, 'KeyP', false],
];

// ---- Charlie as an actor --------------------------------------------------
function spawn(x, z, heading, speed) {
  cast.clear();
  charlie = cast.add(createActor(playerRig(S().player()), { x, z, heading, speed, radius: 0.36 }));
  return charlie;
}
const head = () => {
  const v = V();
  try { S().player().headMesh.getWorldPosition(v); } catch { v.set(charlie.x, 1.45, charlie.z); }
  return v;
};
const fwd = () => V(Math.cos(charlie.heading), 0, Math.sin(charlie.heading));
const step = () => { if (cast) cast.update(1 / 60, nav); };

// ---- lenses ---------------------------------------------------------------
// walking three-quarter: ahead of him, off one shoulder, bobbing on his stride
function tracking(t, dist = 3.2, side = 1.3, height = 1.35, fov = 44) {
  const h = head(), f = fwd();
  const bob = Math.sin(charlie.phase * 8.2) * 0.03;
  const px = h.x + f.x * dist - f.z * side, pz = h.z + f.z * dist + f.x * side;
  C.place(V(px, height + bob, pz).add(shake(t, 0.04)), V(h.x, h.y - 0.35, h.z), fov);
}
// THE CLOSE-UP: his face fills the frame and keeps talking
function faceOn(t, dist = 0.95, fov = 34, rise = 0.0) {
  const h = head(), f = fwd();
  const bob = Math.sin(charlie.phase * 8.2) * 0.022;
  C.place(V(h.x + f.x * dist, h.y + rise + bob, h.z + f.z * dist).add(shake(t, 0.03)),
    V(h.x, h.y - 0.03, h.z), fov);
}
const oppHead = () => { try { return S().opponent().headPos(); } catch { return V(0.8, 1.55, 0); } };
const cap = (t, text, from, to) => {
  if (t < from || t > to) return;
  C.caption(text, (t - from) / (to - from), { sans: true, size: 0.04, bottom: 0.09 });
};

const SHOTS = [
  // ================= ACT 1 — THE TOUR =================
  {
    id: 'p01_arrive', world: 'day', slapper: 'charlie', opp: 'hank',
    cap: [200, 6000],
    pre: () => { spawn(-13, 5.0, 0, 1.45).goTo([{ x: 4, z: 3.0 }, { x: 15, z: 1.5 }]); },
    tick: step,
    cam: (t, u) => tracking(t, lerp(6.5, 3.4, easeOut(u)), lerp(3.0, 1.4, easeOut(u)), lerp(2.4, 1.4, easeOut(u)), lerp(50, 44, u)),
    ov: (t, u) => { C.titleCard('THE FARM', 'A SLAPMANIA PROPERTY TOUR', clamp01((u - 0.05) / 0.42));
      cap(t, 'Every morning, I walk the property.', 3200, 5900); },
    style: { bars: 0.055, vignette: 0.32 },
  },
  {
    // the close-up. He is very serious about this.
    id: 'p02_face', cap: [200, 6400],
    pre: () => { charlie.goTo([{ x: 26, z: 1.0 }]); },
    tick: step,
    cam: (t, u) => faceOn(t, lerp(1.35, 0.92, easeOut(u)), lerp(38, 32, u)),
    ov: (t) => {
      cap(t, 'People tell me this is a fairground.', 300, 2600);
      cap(t, 'It is not. It is a farm.', 2800, 4600);
      cap(t, 'We grow exactly one thing.', 4800, 6300);
    },
    style: { bars: 0.055, vignette: 0.34 },
  },
  {
    // whip off his face onto the crash wall — the punchline is a hay bale
    id: 'p03_wall', cap: [200, 4600],
    pre: () => { charlie.stop(); },
    tick: step,
    cam: (t, u) => {
      const k = easeOut(u);
      C.place(V(lerp(charlie.x + 2.2, 30, k), lerp(1.5, 3.2, k), lerp(1.6, 9.0, k)).add(shake(t, 0.05)),
        V(lerp(charlie.x, 46, k), lerp(1.4, 2.2, k), 0), lerp(34, 50, k));
    },
    ov: (t) => {
      cap(t, 'Distance.', 200, 1500);
      cap(t, "That's the hay wall. Sixty-two metres out.", 1800, 4400);
    },
    style: { bars: 0.055, vignette: 0.32 },
  },
  {
    // walking the rail: the crowd is solid, so he threads through them
    id: 'p04_crowd', cap: [200, 6200],
    pre: () => { spawn(20, -6.5, Math.PI, 1.3).goTo([{ x: 2, z: -4.0 }, { x: -6, z: 2.5 }]); },
    tick: step,
    cam: (t, u) => tracking(t, lerp(3.0, 4.0, u), lerp(-1.6, -2.2, u), 1.5, 46),
    ov: (t) => {
      cap(t, 'Folks call it a bale. I call it a horizon.', 300, 2600);
      cap(t, 'The neighbours come to watch. They bring their own chairs.', 2900, 6000);
    },
    style: { bars: 0.055, vignette: 0.32 },
  },
  {
    // he arrives at the ring, close on the two of them
    id: 'p05_hank', world: 'day', opp: 'hank', cap: [200, 4800],
    pre: () => { spawn(-4.2, 2.2, -0.4, 1.35).goTo([{ x: -1.2, z: 0.4 }]); },
    tick: step,
    cam: (t, u) => {
      const k = easeOut(u), o = oppHead();
      C.place(V(lerp(2.9, 2.3, k), 1.62, lerp(3.3, 2.4, k)).add(shake(t, 0.03)), V(0.6, 1.5, 0), lerp(46, 40, k));
    },
    ov: (t) => {
      cap(t, 'This here is Hank.', 400, 2200);
      cap(t, 'Hank is the harvest.', 2500, 4600);
    },
    style: { bars: 0.055, vignette: 0.32 },
  },

  // ================= ACT 2 — ONE SLAP, FOUR CAMERAS =================
  {
    id: 'p06_slapA', world: 'day', opp: 'hank', swing: true,
    cap: [3300, 6200], slow: [CONTACT - 160, CONTACT + 520],
    cam: (t) => {
      if (t < CONTACT + 200) C.place(V(2.6, 1.55, 2.7).add(shake(t, 0.04)), V(0.6, 1.5, 0), 42);
      else { const b = oppHead(); C.place(V(b.x - 5.0, b.y + 1.5, b.z + 3.0), V(b.x, b.y, b.z), 46); }
    },
    ov: (t) => { cap(t, 'The harvest.', 3400, 4050);
      if (t > CONTACT && t < CONTACT + 520) C.speedLines((t - CONTACT) / 520, 20);
      C.flash(t >= CONTACT && t < CONTACT + 80 ? 0.42 : 0); },
    style: { bars: 0.055, vignette: 0.32 },
  },
  {
    // SAME SLAP — the cheek. Deterministic sim, so this is a second camera.
    id: 'p07_slapB', world: 'day', opp: 'hank', swing: true,
    cap: [CONTACT - 620, CONTACT + 700], slow: [CONTACT - 620, CONTACT + 700],
    cam: (t) => {
      const o = oppHead(), ph = V(); S().player().headMesh.getWorldPosition(ph);
      const dx = ph.x - o.x, dz = ph.z - o.z, m = Math.hypot(dx, dz) || 1;
      C.place(V(o.x + 0.55, o.y + 0.30, o.z + 0.80), V(ph.x, ph.y - 0.05, ph.z), 46);
    },
    ov: (t) => { cap(t, 'Again. From the cheek.', CONTACT - 560, CONTACT - 60);
      C.flash(t >= CONTACT && t < CONTACT + 90 ? 0.5 : 0); },
    style: { bars: 0.055, vignette: 0.3 },
  },
  {
    // SAME SLAP — the dirt
    id: 'p08_slapC', world: 'day', opp: 'hank', swing: true,
    cap: [CONTACT - 520, CONTACT + 900], slow: [CONTACT - 520, CONTACT + 620],
    cam: (t) => {
      if (t < CONTACT + 300) C.place(V(2.9, 0.42, 1.65).add(shake(t, 0.025)), V(0.6, 1.42, 0), 44, 0.12);
      else { const b = oppHead(); C.place(V(b.x - 4.4, 0.9, b.z + 3.0), V(b.x, b.y, b.z), 50); }
    },
    ov: (t) => { cap(t, 'From the dirt.', CONTACT - 460, CONTACT - 40);
      C.flash(t >= CONTACT && t < CONTACT + 80 ? 0.45 : 0); },
    style: { bars: 0.055, vignette: 0.3 },
  },
  {
    // SAME SLAP — the crane, and this one keeps rolling into the flight
    id: 'p09_flight', world: 'day', opp: 'hank', swing: true,
    cap: [CONTACT - 300, 9200], slow: [CONTACT - 300, CONTACT + 420],
    cam: (t) => {
      if (t < CONTACT + 260) C.place(V(2.2, 3.4, 3.2).add(shake(t, 0.04)), V(0.7, 1.5, 0), 46);
      else { const b = oppHead(), k = easeOut((t - CONTACT) / 3200);
        C.place(V(b.x - lerp(5, 9, k), b.y + lerp(2, 6, k), b.z + lerp(3.4, 6.5, k)), V(b.x, b.y, b.z), lerp(48, 56, k)); }
    },
    ov: (t) => { cap(t, 'And from up here, where I do my thinking.', CONTACT + 400, CONTACT + 3200); },
    style: { bars: 0.055, vignette: 0.32 },
  },

  // ================= ACT 3 — THE SURVEY =================
  {
    // walking out to where the harvest landed
    id: 'p10_survey', world: 'day', opp: 'hank', cap: [200, 6000],
    pre: () => { spawn(6, 2.0, 0, 1.4).goTo([{ x: 22, z: 1.0 }, { x: 34, z: 0.5 }]); },
    tick: step,
    cam: (t, u) => tracking(t, lerp(3.6, 5.2, u), lerp(1.8, 2.6, u), lerp(1.5, 2.1, u), 46),
    ov: (t) => cap(t, 'Then I walk out and I survey the yield.', 500, 3600),
    style: { bars: 0.055, vignette: 0.32 },
  },
  {
    // the last close-up: entirely satisfied
    id: 'p11_verdict', cap: [200, 5200],
    pre: () => { charlie.stop(); },
    tick: step,
    cam: (t, u) => faceOn(t, lerp(1.05, 0.88, easeOut(u)), lerp(35, 31, u), 0.02),
    ov: (t) => {
      cap(t, 'Forty-one metres.', 400, 2200);
      cap(t, 'Good soil.', 2600, 5000);
    },
    style: { bars: 0.055, vignette: 0.34 },
  },
  {
    id: 'p12_outro', cap: [200, 5400],
    pre: () => { charlie.goTo([{ x: 46, z: 2.0 }]); },
    tick: step,
    cam: (t, u) => {
      const h = head(), k = easeOut(u);
      C.place(V(h.x - lerp(4, 11, k), lerp(1.7, 4.4, k), h.z + lerp(3.2, 7.5, k)).add(shake(t, 0.035)),
        V(h.x, 1.2, h.z), lerp(44, 52, k));
    },
    ov: (t, u) => {
      cap(t, 'SlapMania dot org. Come and see the farm.', 400, 3400);
      C.titleCard('SLAPMANIA', 'SLAPMANIA.ORG — FREE TO PLAY', clamp01((u - 0.5) / 0.5));
    },
    style: { bars: 0.055, vignette: 0.34 },
  },
];

export async function boot() {
  const st = stage();
  cast = createCast();
  nav = createNav({
    statics: () => st.solids || [],
    actors: () => cast.actors.concat(st.crowdSpots || []),   // walkers AND spectators are solid
    bounds: { minX: -21, maxX: 116, minZ: -36, maxZ: 36 },
  });
  C = createCinema({
    renderer: st.renderer, scene: st.scene, camera: st.camera,
    step: (ev, sec, cb) => S().drive(ev, sec, cb),
    setup: (sh) => {
      for (const c of ['KeyS', 'KeyL', 'KeyA', 'KeyP']) dispatchEvent(new KeyboardEvent('keyup', { code: c }));
      if (sh.slapper) S().setLook(sh.slapper);
      if (sh.opp) S()._vs(sh.opp);
      if (sh.world) { st.setWorldTheme(sh.world); nav.rebuild(); }
      sh.events = sh.swing ? SWING : [];
      if (sh.pre) sh.pre();
    },
  });
  S().freeze(true);
  return C.boot(SHOTS);
}
export const runNext = (n = 1) => C.runNext(SHOTS, n);
export const resume = (c, f) => C.resume(c, f);
export const cues = () => C.marks;
export const shots = () => SHOTS.map((s) => s.id);
