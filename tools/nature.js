// ---------------------------------------------------------------------------
// nature.js — "THE SLAPPING GROUNDS": a nature-documentary trailer.
//
//     const N = await import('/tools/nature.js'); await N.boot();
//     await N.runNext(3);   // repeat until .finished  (or drive via headless.mjs)
//
// Three movements: a hushed wildlife-film open (an Attenborough-STYLE parody
// narrator — an original character, not the man), a fast montage, then the
// feature slap called by the two-man booth, who explain its importance to the
// regional economy and public health. Charlie vs SLIM PETE, calibrated to a
// 93 m flight (A@3930 P@4040 → contact ≈ 4650 ms — Slim is narrower than Hank,
// so the hand travels further than promo.js's 4083 ms; don't reuse that).
//
// Output-time marks for the score and the VO session are recorded on
// window.__cine (shot starts come from cinema marks; contact/landing moments
// are stamped here with C.frame()/fps the first frame they happen).
// ---------------------------------------------------------------------------
import { createCinema, V, lerp, easeOut, clamp01, smooth, shake, CREAM, GOLD } from './cinema.js';
import { createNav } from '../js/navigate.js';
import { createActor, createCast, playerRig } from '../js/actor.js';

const S = () => window.__slapp;
const stage = () => window.__slapp.stage;

let C = null, nav = null, cast = null, charlie = null;

// the feature swing (vs SLIM PETE) and the montage swing (vs HANK)
const CONTACT = 4650;
const SWING = [
  [2600, 'KeyS', true], [3600, 'KeyS', false],
  [3750, 'KeyL', true], [3850, 'KeyL', false],
  [3930, 'KeyA', true], [4030, 'KeyA', false],
  [4040, 'KeyP', true], [4140, 'KeyP', false],
];
const CONTACT_HANK = 4083;
const SWING_HANK = [
  [2600, 'KeyS', true], [3600, 'KeyS', false],
  [3750, 'KeyL', true], [3850, 'KeyL', false],
  [3930, 'KeyA', true], [4030, 'KeyA', false],
  [4070, 'KeyP', true], [4170, 'KeyP', false],
];

function spawn(x, z, heading, speed) {
  cast.clear();
  charlie = cast.add(createActor(playerRig(S().player()), { x, z, heading, speed, radius: 0.36 }));
  return charlie;
}
const head = () => {
  const v = V();
  try { S().player().headMesh.getWorldPosition(v); } catch { v.set(charlie ? charlie.x : 0, 1.45, charlie ? charlie.z : 0); }
  return v;
};
const fwd = () => V(Math.cos(charlie.heading), 0, Math.sin(charlie.heading));
const step = () => { if (cast) cast.update(1 / 60, nav); };
const oppHead = () => { try { return S().opponent().headPos(); } catch { return V(0.8, 1.55, 0); } };

const cap = (t, text, from, to) => {
  if (t < from || t > to) return;
  C.caption(text, (t - from) / (to - from), { sans: true, size: 0.04, bottom: 0.09 });
};
// stamp an output-time mark the first frame `cond` holds (score + VO sync)
const mark = (name, cond) => {
  const M = (window.__cine = window.__cine || { marks: {}, hits: [] });
  if (cond && M.marks[name] === undefined) M.marks[name] = +(C.frame() / 30).toFixed(3);
};
const hit = (t, at) => {
  const M = (window.__cine = window.__cine || { marks: {}, hits: [] });
  if (t >= at && !M['_h' + at]) { M['_h' + at] = 1; M.hits.push(+(C.frame() / 30).toFixed(3)); }
};

function tracking(t, dist = 3.2, side = 1.3, height = 1.35, fov = 44) {
  const h = head(), f = fwd();
  const bob = Math.sin(charlie.phase * 8.2) * 0.03;
  C.place(V(h.x + f.x * dist - f.z * side, height + bob, h.z + f.z * dist + f.x * side).add(shake(t, 0.04)),
    V(h.x, h.y - 0.35, h.z), fov);
}
function faceOn(t, dist = 0.95, fov = 34, rise = 0.0) {
  const h = head(), f = fwd();
  const bob = Math.sin(charlie.phase * 8.2) * 0.022;
  C.place(V(h.x + f.x * dist, h.y + rise + bob, h.z + f.z * dist).add(shake(t, 0.03)),
    V(h.x, h.y - 0.03, h.z), fov);
}

const DOCSTYLE = { bars: 0.075, vignette: 0.36 };
const SHOWSTYLE = { bars: 0.055, vignette: 0.3 };

const SHOTS = [
  // ============ MOVEMENT I — THE WILDLIFE FILM (the narrator) ============
  {
    id: 'n01_county', world: 'day', slapper: 'charlie', opp: 'slim', cap: [200, 8200],
    cam: (t, u) => {
      const k = smooth(u);
      C.place(V(lerp(58, 26, k), lerp(24, 10, k), lerp(30, 15, k)),
        V(lerp(20, 6, k), 2.0, lerp(2, 0, k)), lerp(52, 46, k));
    },
    ov: (t, u) => {
      C.titleCard('THE SLAPPING GROUNDS', 'A COUNTY NATURE FILM', clamp01((u - 0.02) / 0.4));
      cap(t, 'Dawn, over the county.', 3400, 5400);
      cap(t, 'The fair is waking. And so is its oldest industry.', 5600, 8000);
    },
    style: DOCSTYLE,
  },
  {
    id: 'n02_corn', world: 'day', opp: 'slim', cap: [200, 6200],
    cam: (t, u) => {
      const k = smooth(u);
      C.place(V(lerp(56, 58.5, k), 1.15, lerp(10.5, 9, k)).add(shake(t, 0.02)),
        V(74, 2.2, 4.5), 40);
    },
    ov: (t) => {
      cap(t, 'Nature provides the corn. The sunflowers.', 700, 3100);
      cap(t, 'The volunteers.', 3400, 5900);
    },
    style: DOCSTYLE,
  },
  {
    id: 'n03_specimen', world: 'day', opp: 'slim', cap: [200, 7200],
    pre: () => { spawn(-10, 4.6, 0, 1.35).goTo([{ x: -3.5, z: 2.2 }, { x: -1.4, z: 0.4 }]); },
    tick: step,
    cam: (t, u) => {
      if (u < 0.55) tracking(t, lerp(4.6, 2.4, smooth(u / 0.55)), 1.5, lerp(1.9, 1.45, u), 44);
      else faceOn(t, 0.95, 33);
    },
    ov: (t) => {
      cap(t, 'The large male. Known locally as Charlie.', 700, 3400);
      cap(t, 'He has trained one arm. Only the one.', 3800, 7000);
      mark('specimen', t > 200);
    },
    style: DOCSTYLE,
  },
  {
    id: 'n04_coil', world: 'day', opp: 'slim', cap: [2400, 8400],
    events: [[2600, 'KeyS', true]],           // coil and HOLD — the leak only starts on release
    cam: (t, u) => {
      const h = head(), a = lerp(0.55, 1.85, smooth(u));  // slow orbit around the wound spring
      C.place(V(h.x + Math.cos(a) * 2.4, h.y - 0.02, h.z + Math.sin(a) * 2.4).add(shake(t, 0.015)),
        V(h.x, h.y - 0.42, h.z), 38);
    },
    ov: (t) => {
      cap(t, 'Observe. The coil.', 2900, 4900);
      cap(t, 'He may hold it as long as he likes. No one has ever asked him to.', 5200, 8200);
    },
    style: DOCSTYLE,
  },

  // ================== MOVEMENT II — THE MONTAGE ==================
  {
    id: 'm01_vegas', world: 'vegas', opp: 'slim', cap: [200, 2900],
    cam: (t, u) => C.place(V(lerp(16, 13, u), 4.6, lerp(12, 11, u)), V(5, 2, 0), 48),
    ov: (t, u) => C.titleCard('SIXTEEN WORLDS', '', clamp01(u * 1.6)),
    style: SHOWSTYLE,
  },
  {
    id: 'm02_ice', world: 'ice', opp: 'slim', cap: [200, 2900],
    cam: (t, u) => C.place(V(lerp(37, 36, u), 2.6, lerp(5, 6.5, u)), V(29, 1.0, 18), 44),
    ov: (t, u) => C.titleCard('SOME OF THEM FROZEN', '', clamp01(u * 1.6)),
    style: SHOWSTYLE,
  },
  {
    id: 'm03_hoss', world: 'day', opp: 'hoss', cap: [200, 2900],
    cam: (t, u) => {
      const o = oppHead();
      C.place(V(o.x + 1.6, lerp(0.7, 1.5, u), o.z + lerp(2.2, 1.7, u)).add(shake(t, 0.03)), V(o.x, o.y - 0.2, o.z), 38);
    },
    ov: (t, u) => {
      C.namePlate('BIG HOSS', 'SUPER-HEAVY · BARELY MOVES, PAYS BIG', clamp01(u * 1.4));
      C.titleCard('VOLUNTEERS OF EVERY TONNAGE', '', clamp01(u * 1.3));
    },
    style: SHOWSTYLE,
  },
  {
    id: 'm04_don', world: 'day', opp: 'don', cap: [200, 2900],
    cam: (t, u) => {
      const o = oppHead();
      C.place(V(o.x + 1.5, 1.62, o.z - lerp(2.1, 1.6, u)).add(shake(t, 0.03)), V(o.x, o.y - 0.15, o.z), 38);
    },
    ov: (t, u) => C.namePlate('TREMENDOUS DON', 'EXECUTIVE · TALKS THROUGH IT', clamp01(u * 1.4)),
    style: SHOWSTYLE,
  },
  {
    id: 'm05_keys', world: 'day', opp: 'hank', events: SWING_HANK,
    cap: [3200, 4750], slow: [CONTACT_HANK - 120, CONTACT_HANK + 260],
    cam: (t) => C.place(V(1.9, 1.05, 2.7).add(shake(t, 0.035)), V(0.5, 1.42, 0), 42),
    ov: (t, u) => {
      C.titleCard('FOUR KEYS', 'S · L · A · P', clamp01(u * 1.5));
      C.flash(t >= CONTACT_HANK && t < CONTACT_HANK + 80 ? 0.45 : 0);
      hit(t, CONTACT_HANK);
    },
    style: SHOWSTYLE,
  },

  // ============ MOVEMENT III — THE FEATURE (the booth) ============
  {
    id: 'f01_faceoff', world: 'day', opp: 'slim', cap: [400, 6600],
    cam: (t, u) => {
      const k = smooth(u);
      C.place(V(lerp(3.6, 2.4, k), lerp(1.7, 1.55, k), lerp(3.8, 2.5, k)).add(shake(t, 0.028)),
        V(0.55, 1.5, 0), lerp(48, 40, k));
    },
    ov: (t, u) => {
      C.namePlate("SLAPPIN' CHARLIE", 'THE LOCAL LEGEND', t > 900 && t < 3300 ? clamp01((t - 900) / 2400) : 0);
      C.namePlate('SLIM PETE', 'FEATHERWEIGHT · FLIES LIKE A DART', t > 3500 && t < 6100 ? clamp01((t - 3500) / 2600) : 0);
      cap(t, 'To explain what follows, the county\'s finest economists.', 500, 3200);
      cap(t, '"Thank you, sir. Folks — watch the feet."', 3600, 6400);
      mark('faceoff', t > 400);
    },
    style: SHOWSTYLE,
  },
  {
    id: 'f02_swing', world: 'day', opp: 'slim', events: SWING,
    cap: [2700, 6300], slow: [CONTACT - 160, CONTACT + 520],
    cam: (t) => {
      if (t < CONTACT + 380) C.place(V(2.6, 1.55, 2.9).add(shake(t, 0.04)), V(0.6, 1.5, 0), 42);
      else { const b = oppHead(); C.place(V(b.x - 6.0, b.y + 1.4, b.z + 2.6), V(b.x, b.y, b.z), 46); }
    },
    ov: (t) => {
      cap(t, '"Here comes the wind-up—"', 2800, 3900);
      cap(t, '"o... o... OH?!"', 3950, CONTACT - 30);
      cap(t, '"HE SLAPPED HIM! THE ECONOMY IS SAVED!"', CONTACT + 260, 6200);
      if (t > CONTACT && t < CONTACT + 520) C.speedLines((t - CONTACT) / 520, 20);
      C.flash(t >= CONTACT && t < CONTACT + 80 ? 0.5 : 0);
      mark('windup', t >= 2800); mark('contact', t >= CONTACT);
      hit(t, CONTACT);
    },
    style: SHOWSTYLE,
  },
  {
    id: 'f03_flight', world: 'day', opp: 'slim', events: SWING, cap: [4700, 11600],
    cam: (t) => {
      const b = oppHead(), k = easeOut((t - CONTACT) / 2800);
      C.place(V(b.x - lerp(5, 10, k), b.y + lerp(2, 5.5, k), b.z + lerp(3.4, 7, k)), V(b.x, b.y, b.z), lerp(46, 55, k));
    },
    ov: (t) => {
      cap(t, '"Every meter of that flight is a meter of G-D-P, Howie."', 5300, 8200);
      cap(t, '"Hay futures are UP! Cheek futures are WAY UP!"', 8500, 11400);
      mark('flight', t >= 4700);
    },
    style: SHOWSTYLE,
  },
  {
    id: 'f04_landing', world: 'day', opp: 'slim', events: SWING, cap: [7600, 14800],
    cam: (t) => {
      const b = oppHead();
      C.place(V(b.x + 9, 1.15, b.z + 5).add(shake(t, 0.03)), V(b.x, Math.max(b.y, 0.6), b.z), 42);
    },
    ov: (t) => {
      const st = S().state;
      cap(t, '"Doctors agree: one good slap is cardio for the whole county."', 7800, 11200);
      cap(t, '"DOWN at ninety-three meters! The market has landed!"', 11500, 13100);
      cap(t, '"We call that a soft correction."', 13300, 14650);
      mark('landing', st === 'RESULT');
    },
    style: SHOWSTYLE,
  },
  {
    id: 'f05_replay', world: 'day', opp: 'slim', events: SWING,
    cap: [CONTACT - 320, CONTACT + 700], slow: [CONTACT - 320, CONTACT + 700],
    cam: (t) => {
      const o = oppHead(), ph = V(); S().player().headMesh.getWorldPosition(ph);
      C.place(V(o.x + 0.55, o.y + 0.30, o.z + 0.80), V(ph.x, ph.y - 0.05, ph.z), 46);
    },
    ov: (t, u) => {
      C.shadowText('INSTANT REPLAY', 30, 60, 'italic 900 30px Impact', GOLD, 'left', 8);
      cap(t, '"The hips. The invisible hand... was a hand."', CONTACT - 280, CONTACT + 660);
      C.flash(t >= CONTACT && t < CONTACT + 90 ? 0.5 : 0);
      mark('replay', t >= CONTACT - 320);
    },
    style: SHOWSTYLE,
  },
  {
    id: 'f06_end', world: 'haunted', opp: 'slim', cap: [200, 7400],
    cam: (t, u) => {
      const k = smooth(u);
      C.place(V(lerp(2.5, -6, k), lerp(1.6, 7.5, k), lerp(4.2, 15, k)), V(lerp(0.6, 8, k), 1.6, 0), lerp(42, 52, k));
    },
    ov: (t, u) => {
      cap(t, 'The county sleeps. The palm does not.', 700, 3600);
      C.titleCard('SLAPMANIA', 'SLAPMANIA.ORG — FREE TO PLAY', clamp01((u - 0.45) / 0.5));
      mark('end', t > 200);
    },
    style: DOCSTYLE,
  },
];

export async function boot() {
  const st = stage();
  cast = createCast();
  nav = createNav({
    statics: () => st.solids || [],
    actors: () => cast.actors.concat(st.crowdSpots || []),
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
      if (!sh.events) sh.events = [];
      if (sh.pre) sh.pre();
    },
  });
  window.__cine = { marks: {}, hits: [] };
  S().freeze(true);
  return C.boot(SHOTS);
}
export const runNext = (n = 1) => {
  const r = C.runNext(SHOTS, n);
  return r.then ? r.then(fin) : fin(r);
  function fin(res) {
    if (res.finished) window.__cine.totalSec = res.sec;
    return res;
  }
};
export const resume = (c, f) => C.resume(c, f);
export const cues = () => C.marks;
export const shots = () => SHOTS.map((s) => s.id);
