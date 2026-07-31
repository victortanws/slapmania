// ---------------------------------------------------------------------------
// episode.js — the DIRECTOR ENGINE: declarative screenplay JSON → finished film.
//
// This is the step from "an expert hand-writes camera math per shot" to
// "describe the episode, the director frames it." An episode is pure data:
//
//   { name, scenes: [ { id, world, opp, start:{x,z,heading}, beats: [
//       { id, cam:'wide'|'two'|'close:charlie'|'ots:slim'|'follow'|'broll:<name>',
//         who:'charlie'|'slim'|'narrator', say:'…',      // spoken + captioned
//         walk:[{x,z},…], hold: 2.2 }                    // blocking / extra time
//   ] } ] }
//
// The engine computes every camera from live actor positions using the
// hard-won framing rules (faces read from the open lane side; never park a
// lens on a head; two-shots sit perpendicular to the axis between subjects),
// times each beat from its dialogue (word count → speech estimate + air),
// stamps a mark per beat, and EXPORTS a ready voice session (window.__cine
// .voSession) so the same JSON drives picture AND voice. Load an episode:
//
//   const E = await import('/tools/episode.js');
//   await E.boot('/tools/episode-quiet-day.json');   // or a JS object
//   await E.runNext(1); …until .finished             // one scene per shot
//
// Cute-first defaults: doc letterbox, soft vignette, sans captions.
// ---------------------------------------------------------------------------
import { createCinema, V, lerp, easeOut, clamp01, smooth, shake } from './cinema.js';
import { createNav } from '../js/navigate.js';
import { createActor, createCast, playerRig } from '../js/actor.js';

const S = () => window.__slapp;
const stage = () => window.__slapp.stage;

let C = null, nav = null, cast = null, walker = null, EP = null, SHOTS = null;

// ---- framing rules (encode once, reuse forever) ---------------------------
const heads = {
  charlie() { const v = V(); try { S().player().headMesh.getWorldPosition(v); } catch { v.set(walker ? walker.x : 0, 1.45, walker ? walker.z : 0); } return v; },
  opp() { try { return S().opponent().headPos(); } catch { return V(0.8, 1.55, 0); } },
};
const headOf = (who) => (who === 'charlie' || who === 'narrator' ? heads.charlie() : heads.opp());
const facingOf = (who) => {
  if (who === 'charlie' && walker) return V(Math.cos(walker.heading), 0, Math.sin(walker.heading));
  return who === 'charlie' ? V(1, 0, 0) : V(-1, 0, 0);   // ring default: slapper faces +x
};

// named B-roll framings verified by probe (see CLAUDE.md camera notes)
const BROLL = {
  ring:   { pos: [14, 4.2, 14], look: [4, 2, 0], fov: 48 },
  vegas:  { pos: [16, 4.6, 12], look: [5, 2, 0], fov: 48 },
  winter: { pos: [37, 2.6, 5], look: [29, 1.0, 18], fov: 44 },
  corn:   { pos: [56, 1.15, 10.5], look: [74, 2.2, 4.5], fov: 40 },
  aerial: { pos: [58, 24, 30], look: [20, 2, 2], fov: 52 },
  moon:   { pos: [2.5, 1.6, 4.2], look: [0.6, 1.6, 0], fov: 42 },
};

function camera(beat, t, u) {
  const kind = beat.cam || 'two';
  const drift = shake(t, 0.02);
  if (kind.startsWith('broll:')) {
    const b = BROLL[kind.slice(6)] || BROLL.ring;
    const k = smooth(u) * 0.12;                                 // gentle push-in
    C.place(V(...b.pos).lerp(V(...b.look), k).add(drift), V(...b.look), b.fov);
  } else if (kind === 'follow') {
    const h = headOf('charlie'), f = facingOf('charlie');
    const bob = walker ? Math.sin(walker.phase * 8.2) * 0.03 : 0;
    C.place(V(h.x + f.x * 3.2 - f.z * 1.4, 1.5 + bob, h.z + f.z * 3.2 + f.x * 1.4).add(drift),
      V(h.x, h.y - 0.3, h.z), 44);
  } else if (kind.startsWith('close:')) {
    // ¾ portrait: 25° off the facing axis reads as a face without being a mugshot
    const who = kind.slice(6), h = headOf(who), f = facingOf(who);
    const c = Math.cos(0.44), s = Math.sin(0.44);
    const fx = f.x * c - f.z * s, fz = f.x * s + f.z * c;
    C.place(V(h.x + fx * 1.35, h.y + 0.04, h.z + fz * 1.35).add(drift), V(h.x, h.y - 0.04, h.z), 34);
  } else if (kind.startsWith('ots:')) {
    // over the LISTENER's shoulder onto the speaker
    const spk = kind.slice(4), other = spk === 'charlie' ? 'opp' : 'charlie';
    const a = headOf(other), b = headOf(spk);
    const ax = V(b.x - a.x, 0, b.z - a.z).normalize();
    C.place(V(a.x - ax.x * 0.55 - ax.z * 0.42, a.y + 0.12, a.z - ax.z * 0.55 + ax.x * 0.42).add(drift),
      V(b.x, b.y - 0.04, b.z), 38);
  } else if (kind === 'wide') {
    const a = heads.charlie(), b = heads.opp(), mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    C.place(V(mx + 2.2, 2.6, mz + 6.5).add(drift), V(mx, 1.4, mz), 46);
  } else {           // 'two' — the proven ring diagonal (inside the rails, lane side)
    const a = heads.charlie(), b = heads.opp();
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    C.place(V(mx + 2.2, 1.6, mz + 2.9).add(drift), V(mx, 1.45, mz), 42);
  }
}

// ---- timing: dialogue length drives the edit ------------------------------
const sayDur = (text) => 0.75 + String(text).split(/\s+/).length * 0.44;   // piper-ish pace + air
const beatDur = (b) => Math.max(
  b.hold || 0,
  (b.say ? sayDur(b.say) : 0) + (b.walk ? 0.4 : 0),
  b.walk ? walkEstimate(b) + 0.6 : 0,
  1.2);
function walkEstimate(b) {
  let d = 0, p = b._from;
  for (const w of b.walk) { d += Math.hypot(w.x - p.x, w.z - p.z); p = w; }
  return (d / 1.45) * 1.45 + 1.0;   // nav steers around crowd — straight-line lies
}

const mark = (name, cond) => {
  const M = window.__cine;
  if (cond && M.marks[name] === undefined) M.marks[name] = +(C.frame() / 30).toFixed(3);
};

// ---- compile: scenes → cinema shots ---------------------------------------
function compile(ep) {
  const voLines = [];
  const shots = ep.scenes.map((sc) => {
    let t = 400, from = { x: sc.start ? sc.start.x : -2.6, z: sc.start ? sc.start.z : 0 };
    const beats = sc.beats.map((b) => {
      b._from = { ...from };
      if (b.walk) from = b.walk[b.walk.length - 1];
      const seg = { ...b, t0: t, t1: t + beatDur(b) * 1000 };
      t = seg.t1;
      if (b.say) voLines.push({
        id: b.id, who: b.who || 'narrator', at: `${b.id}+0.12`, overlap: true,
        perf: b.perf || (b.who && b.who !== 'narrator' ? 'plain' : 'awe'), text: b.say,
      });
      return seg;
    });
    return {
      id: sc.id, world: sc.world || ep.world || 'day', opp: sc.opp || ep.opp || 'slim',
      cap: [400, t + 600], events: [],
      pre: () => {
        walker = null;
        if (sc.start) {
          cast.clear();
          walker = cast.add(createActor(playerRig(S().player()),
            { x: sc.start.x, z: sc.start.z, heading: sc.start.heading || 0, speed: 1.45, radius: 0.36 }));
        }
        window.__epBeats = beats;
      },
      tick: (t2) => {
        try { S().opponent().setTargetVisible(false); } catch { /* no opponent staged */ }
        if (!walker) return;
        const b = beats.find((x) => t2 >= x.t0 && t2 < x.t1);
        if (b && b.walk && !b._sent) { walker.goTo(b.walk.map((w) => ({ x: w.x, z: w.z }))); b._sent = true; }
        cast.update(1 / 60, nav);
      },
      cam: (t2, u) => {
        const b = beats.find((x) => t2 >= x.t0 && t2 < x.t1) || beats[beats.length - 1];
        camera(b, t2, clamp01((t2 - b.t0) / (b.t1 - b.t0)));
        mark(b.id, t2 >= b.t0);
      },
      ov: (t2) => {
        for (const b of beats) {
          if (b.say && t2 >= b.t0 + 60 && t2 <= b.t1 - 80) {
            const quoted = b.who && b.who !== 'narrator' ? `"${b.say}"` : b.say;
            C.caption(quoted, (t2 - b.t0) / (b.t1 - b.t0), { sans: true, size: 0.04, bottom: 0.09 });
          }
        }
        if (sc.title) C.titleCard(sc.title.text, sc.title.sub || '', clamp01((t2 - 600) / 5600));
      },
      style: { bars: 0.075, vignette: 0.34 },
    };
  });
  window.__cine.voSession = {
    name: ep.name, bed: 'score.wav', marks: {},
    cast: ep.castVoices || {}, lines: voLines,
  };
  return shots;
}

export async function boot(episode) {
  EP = typeof episode === 'string' ? await (await fetch(episode, { cache: 'no-cache' })).json() : episode;
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
      S().setLook(EP.slapper || 'charlie');
      if (sh.opp) S()._vs(sh.opp);
      if (sh.world) { st.setWorldTheme(sh.world); nav.rebuild(); }
      if (sh.pre) sh.pre();
    },
  });
  window.__cine = { marks: {}, hits: [] };
  SHOTS = compile(EP);
  S().freeze(true);
  return C.boot(SHOTS);
}
export const runNext = async (n = 1) => {
  const res = await C.runNext(SHOTS, n);
  if (res.finished) window.__cine.totalSec = res.sec;
  return res;
};
export const resume = (c, f) => C.resume(c, f);
export const cues = () => C.marks;
export const shots = () => SHOTS.map((s) => s.id);
