// ---------------------------------------------------------------------------
// navigate.js — locomotion for KINEMATIC characters.
//
// The slapper isn't physics-driven before contact (his joints are integrated
// scalars, see player.js), so walking him around needs its own collision layer.
// Without one he strolls straight through the crowd and the barn, which reads
// as "there is no world here" the moment anyone films it.
//
// ---------------------------------------------------------------------------
// HOST-AGNOSTIC BY DESIGN. This module knows nothing about SlapMania, three.js
// or cannon-es. It is handed two plain-data feeds and returns plain data:
//
//   createNav({
//     statics: () => [ {kind:'box', x, z, ry, hx, hz} | {kind:'cyl', x, z, r} ],
//     actors:  () => [ {x, z, r?} ],        // anything that moves and blocks
//     bounds:  { minX, maxX, minZ, maxZ },
//     actorRadius: 0.3,
//   })
//
// Any engine that can describe its world as boxes and circles on a plane can use
// it as-is — see adaptStage() at the bottom for the SlapMania binding, which is
// the only game-aware code in the file and is six lines long.
//
// Everything is 2D in XZ. Characters are discs; the world is discs and (rotated)
// boxes. That is enough for a fairground, a dungeon floor or a town map, and it
// stays cheap enough to run per frame for many actors.
// ---------------------------------------------------------------------------

const SKIN = 0.02;        // keeps a resolved character just off the surface

export function createNav(src = {}) {
  const bounds = src.bounds || { minX: -1e5, maxX: 1e5, minZ: -1e5, maxZ: 1e5 };
  const ACTOR_R = src.actorRadius === undefined ? 0.3 : src.actorRadius;
  const getStatics = src.statics || (() => []);
  const getActors = src.actors || (() => []);
  let statics = [];

  // Flatten the static world once. Call again whenever the host swaps its map.
  function rebuild() {
    statics = [];
    for (const s of getStatics()) {
      if (s.kind === 'cyl' || s.t === 'c') statics.push({ t: 'c', x: s.x, z: s.z, r: s.r });
      else statics.push({ t: 'b', x: s.x, z: s.z, ry: s.ry || 0, hx: s.hx, hz: s.hz });
    }
  }
  rebuild();

  // every blocker relevant this frame: static world + whatever is moving in it
  function obstacles(ignore) {
    const out = statics.slice();
    for (const a of getActors()) {
      if (ignore && ignore(a)) continue;
      out.push({ t: 'c', x: a.x, z: a.z, r: a.r === undefined ? ACTOR_R : a.r, actor: true });
    }
    return out;
  }

  // Push a disc out of one obstacle. Returns [dx, dz] correction (0,0 if clear).
  function depenetrate(px, pz, radius, o) {
    if (o.t === 'c') {
      const dx = px - o.x, dz = pz - o.z;
      const d2 = dx * dx + dz * dz;
      const rr = radius + o.r;
      if (d2 >= rr * rr) return null;
      const d = Math.sqrt(d2) || 1e-4;
      const push = rr - d + SKIN;
      return [(dx / d) * push, (dz / d) * push];
    }
    // rotated box: work in the box's local frame, clamp, push along the shortest axis
    const cos = Math.cos(-o.ry), sin = Math.sin(-o.ry);
    const rx = px - o.x, rz = pz - o.z;
    const lx = rx * cos - rz * sin, lz = rx * sin + rz * cos;
    const cx = Math.max(-o.hx, Math.min(o.hx, lx));
    const cz = Math.max(-o.hz, Math.min(o.hz, lz));
    let nx = lx - cx, nz = lz - cz;
    const d2 = nx * nx + nz * nz;
    if (d2 >= radius * radius) return null;
    if (d2 > 1e-8) {                       // outside the box, within the radius
      const d = Math.sqrt(d2);
      const push = radius - d + SKIN;
      nx = (nx / d) * push; nz = (nz / d) * push;
    } else {                               // centre is INSIDE: eject the short way
      const ox = o.hx - Math.abs(lx), oz = o.hz - Math.abs(lz);
      if (ox < oz) { nx = (lx < 0 ? -1 : 1) * (ox + radius + SKIN); nz = 0; }
      else { nx = 0; nz = (lz < 0 ? -1 : 1) * (oz + radius + SKIN); }
    }
    const c2 = Math.cos(o.ry), s2 = Math.sin(o.ry);   // back to world space
    return [nx * c2 - nz * s2, nx * s2 + nz * c2];
  }

  // Settle a position out of everything it overlaps. Two passes handles the
  // common case of being wedged between a fence and a spectator.
  function resolve(px, pz, radius, obs) {
    let hit = false;
    for (let pass = 0; pass < 2; pass++) {
      for (const o of obs) {
        const c = depenetrate(px, pz, radius, o);
        if (c) { px += c[0]; pz += c[1]; hit = true; }
      }
    }
    px = Math.max(bounds.minX, Math.min(bounds.maxX, px));
    pz = Math.max(bounds.minZ, Math.min(bounds.maxZ, pz));
    return { x: px, z: pz, hit };
  }

  // Move from → toward a delta, then settle. That's move-and-slide: the
  // depenetration cancels the into-surface component and leaves the tangent,
  // so a character brushes along a wall instead of sticking to it.
  function moveAndSlide(fromX, fromZ, dx, dz, radius = 0.34, ignore) {
    const obs = obstacles(ignore);
    return resolve(fromX + dx, fromZ + dz, radius, obs);
  }

  // Is the straight line from → to clear? Cheap sampled sweep, good enough to
  // decide whether a whisker direction is worth taking.
  function clear(fromX, fromZ, toX, toZ, radius, obs) {
    const dx = toX - fromX, dz = toZ - fromZ;
    const dist = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(dist / 0.35));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = fromX + dx * t, pz = fromZ + dz * t;
      for (const o of obs) if (depenetrate(px, pz, radius, o)) return false;
    }
    return true;
  }

  // Steer toward a target, walking AROUND what's in the way rather than grinding
  // into it: try straight ahead, then progressively wider whiskers either side.
  // Cheap, stateless, and enough for a fairground — a real navmesh only earns
  // its keep once there are corridors that can trap you.
  const WHISKERS = [0, 0.45, 0.9, 1.4, 2.0, 2.6];
  function steer(pos, target, speed, dt, radius = 0.34, ignore) {
    const obs = obstacles(ignore);
    const dx = target.x - pos.x, dz = target.z - pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.25) return { x: pos.x, z: pos.z, heading: pos.heading || 0, arrived: true, blocked: false };
    const base = Math.atan2(dz, dx);
    const step = Math.min(speed * dt, dist);
    const probe = Math.max(step, 0.8);            // look ahead further than one step
    // Which way to peel off when something is in the way. Two movers meeting
    // head-on must not mirror each other or they dance forever, so each carries
    // a stable preferred side (see actor.js) — the same reason traffic picks a
    // side of the road rather than negotiating every encounter.
    const side = pos.side < 0 ? -1 : 1;
    for (const w of WHISKERS) {
      for (const s of (w === 0 ? [1] : [side, -side])) {
        const a = base + w * s;
        const tx = pos.x + Math.cos(a) * probe, tz = pos.z + Math.sin(a) * probe;
        if (!clear(pos.x, pos.z, tx, tz, radius, obs)) continue;
        const p = resolve(pos.x + Math.cos(a) * step, pos.z + Math.sin(a) * step, radius, obs);
        return { x: p.x, z: p.z, heading: a, arrived: false, blocked: false };
      }
    }
    // Fully boxed in. FREEZING here deadlocks symmetric crossings — everyone
    // stops and nobody yields. Instead slide along whichever tangent has room:
    // a jammed crowd resolves by rotating, not by standing still.
    for (const s of [side, -side]) {
      const a = base + s * Math.PI / 2;
      const half = step * 0.6;
      const tx = pos.x + Math.cos(a) * half, tz = pos.z + Math.sin(a) * half;
      if (!clear(pos.x, pos.z, tx, tz, radius, obs)) continue;
      const p = resolve(tx, tz, radius, obs);
      return { x: p.x, z: p.z, heading: base, arrived: false, blocked: true, sliding: true };
    }
    const p = resolve(pos.x, pos.z, radius, obs);
    return { x: p.x, z: p.z, heading: base, arrived: false, blocked: true };
  }

  return { rebuild, obstacles, resolve, moveAndSlide, steer, clear, bounds, actorRadius: ACTOR_R };
}

// The ONLY SlapMania-aware code here: bind the generic navigator to this game's
// stage. Porting to another project means writing six lines like these, not
// touching anything above.
export const adaptStage = (stage, opts = {}) => createNav({
  statics: () => stage.solids || [],
  actors: () => stage.crowdSpots || [],
  bounds: opts.bounds || { minX: -21, maxX: 116, minZ: -36, maxZ: 36 },
  actorRadius: 0.3,
});
