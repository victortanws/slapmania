// ---------------------------------------------------------------------------
// navigate.js — locomotion for KINEMATIC characters.
//
// The slapper isn't physics-driven before contact (his joints are integrated
// scalars, see player.js), so walking him around needs its own collision layer.
// Without one he strolls straight through the crowd and the barn, which reads
// as "there is no world here" the moment anyone films it.
//
// Obstacles come from the world's OWN static solid list (stage.solids — the same
// descriptors ragdoll.js turns into static cannon bodies) plus the live crowd
// (stage.crowdSpots). So a walking character bumps into exactly the things a
// flying body bounces off: one source of truth, no second hand-maintained map.
//
// Everything is 2D in XZ. Characters are discs; the world is discs and (rotated)
// boxes. That's all a fairground needs, and it stays cheap enough to run per
// frame for many actors as the world grows.
// ---------------------------------------------------------------------------

const CROWD_R = 0.3;      // a person is about this wide at the shoulders
const SKIN = 0.02;        // keeps a resolved character just off the surface

export function createNav(stage, opts = {}) {
  const bounds = opts.bounds || { minX: -21, maxX: 116, minZ: -36, maxZ: 36 };
  let statics = [];

  // Flatten the world's solids once. Call again after setWorldTheme swaps a kit.
  function rebuild() {
    statics = [];
    for (const s of (stage.solids || [])) {
      if (s.kind === 'cyl') statics.push({ t: 'c', x: s.x, z: s.z, r: s.r });
      else statics.push({ t: 'b', x: s.x, z: s.z, ry: s.ry || 0, hx: s.hx, hz: s.hz });
    }
  }
  rebuild();

  // every blocker relevant this frame: static world + the people standing in it
  function obstacles(ignore) {
    const out = statics.slice();
    for (const c of (stage.crowdSpots || [])) {
      if (ignore && ignore(c)) continue;
      out.push({ t: 'c', x: c.x, z: c.z, r: CROWD_R, crowd: true });
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
  const WHISKERS = [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, 2.0, -2.0];
  function steer(pos, target, speed, dt, radius = 0.34, ignore) {
    const obs = obstacles(ignore);
    const dx = target.x - pos.x, dz = target.z - pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.25) return { x: pos.x, z: pos.z, heading: pos.heading || 0, arrived: true, blocked: false };
    const base = Math.atan2(dz, dx);
    const step = Math.min(speed * dt, dist);
    const probe = Math.max(step, 0.8);            // look ahead further than one step
    for (const w of WHISKERS) {
      const a = base + w;
      const tx = pos.x + Math.cos(a) * probe, tz = pos.z + Math.sin(a) * probe;
      if (!clear(pos.x, pos.z, tx, tz, radius, obs)) continue;
      const p = resolve(pos.x + Math.cos(a) * step, pos.z + Math.sin(a) * step, radius, obs);
      return { x: p.x, z: p.z, heading: a, arrived: false, blocked: false };
    }
    // fully boxed in: settle where we are and report it, so a caller can react
    const p = resolve(pos.x, pos.z, radius, obs);
    return { x: p.x, z: p.z, heading: base, arrived: false, blocked: true };
  }

  return { rebuild, obstacles, resolve, moveAndSlide, steer, clear, bounds, CROWD_R };
}
