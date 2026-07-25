// ---------------------------------------------------------------------------
// actor.js — game-agnostic actor locomotion.
//
// An ACTOR is anything that occupies space on the ground plane and can be told
// to go somewhere. It knows nothing about rendering, three.js, or this game.
// You hand it a RIG — an adapter with at most three methods:
//
//   rig = {
//     place(x, z, heading),   // required: put me here, facing this way
//     walk(t, amt),           // optional: drive a stride cycle
//     stand(),                // optional: settle to a standing pose
//   }
//
// …and it drives that rig. A three.js group, a sprite, a DOM node or a plain
// object all work. Pair with navigate.js (which is likewise host-agnostic) and
// actors collide with the world AND with each other.
//
//   const cast = createCast();
//   const charlie = cast.add(createActor(playerRig(player), { speed: 1.5 }));
//   const nav = createNav({ statics: () => solids, actors: cast.blockers });
//   charlie.goTo([{x: 10, z: 2}]);
//   // per frame:
//   cast.update(dt, nav);
//
// The `cast.blockers` feed is the important bit: passing it to the navigator
// closes the loop, so every actor steers around every other actor without any
// of them knowing the others exist.
// ---------------------------------------------------------------------------

export function createActor(rig, opts = {}) {
  const a = {
    rig,
    x: opts.x || 0,
    z: opts.z || 0,
    heading: opts.heading || 0,
    r: opts.radius === undefined ? 0.34 : opts.radius,
    speed: opts.speed === undefined ? 1.5 : opts.speed,
    // stride phase is per-actor, so a crowd never marches in lockstep
    phase: opts.phase === undefined ? 0 : opts.phase,
    // stable preferred side to peel off when blocked. Two actors that mirror
    // each other deadlock; derived from the spawn point so it varies across a
    // crowd without needing RNG (re-runs stay identical).
    side: opts.side !== undefined ? opts.side : (((opts.x || 0) + (opts.z || 0)) >= 0 ? 1 : -1),
    route: [],
    idx: 0,
    state: 'idle',            // idle | walking | blocked | arrived
    blockedFor: 0,
    onArrive: opts.onArrive || null,

    goTo(pts) {
      a.route = Array.isArray(pts) ? pts.slice() : [pts];
      a.idx = 0; a.state = 'walking'; a.blockedFor = 0;
      return a;
    },
    stop() { a.route = []; a.state = 'idle'; return a; },
    at(x, z, heading) {
      a.x = x; a.z = z; if (heading !== undefined) a.heading = heading;
      return a;
    },

    update(dt, nav) {
      if (a.state === 'walking' && a.idx < a.route.length) {
        const r = nav.steer(a, a.route[a.idx], a.speed, dt, a.r, (o) => o === a);
        a.x = r.x; a.z = r.z; a.heading = r.heading;
        a.phase += dt;
        if (r.blocked) {
          a.blockedFor += dt;
          a.state = 'blocked';
          // sliding still counts as progress; only a truly pinned actor gives
          // up on a waypoint, and even then it moves on rather than freezing
          if (!r.sliding && a.blockedFor > 1.6) { a.idx++; a.blockedFor = 0; }
          else if (r.sliding && a.blockedFor > 4.0) { a.idx++; a.blockedFor = 0; }
        } else {
          a.blockedFor = 0;
          a.state = 'walking';
        }
        if (r.arrived) a.idx++;
        if (a.idx >= a.route.length) {          // route exhausted, however it ended
          a.state = 'arrived';
          if (a.onArrive) a.onArrive(a);
        }
        if (rig.walk) rig.walk(a.phase, 1);
      } else if (rig.stand) {
        rig.stand();
      }
      rig.place(a.x, a.z, a.heading);
      return a.state;
    },
  };
  return a;
}

// A cast owns the actors and, critically, exposes them as a blocker feed for
// the navigator — that is what makes them solid to one another.
export function createCast(list = []) {
  const actors = list.slice();
  return {
    actors,
    add(actor) { actors.push(actor); return actor; },
    remove(actor) { const i = actors.indexOf(actor); if (i >= 0) actors.splice(i, 1); },
    clear() { actors.length = 0; },
    // feed for navigate.js: {x, z, r}. Identity is preserved so an actor can be
    // told to ignore itself (see the `ignore` predicate in update()).
    blockers: () => actors,
    update(dt, nav) { for (const a of actors) a.update(dt, nav); },
  };
}

// ---------------------------------------------------------------------------
// Rig adapters. THE ONLY GAME-AWARE CODE IN THIS FILE — and each one is a few
// lines. Porting the actor system means writing an adapter, not editing above.
// ---------------------------------------------------------------------------

// SlapMania's Player (js/player.js): faces +x at yaw 0, has walkPose/standPose.
export const playerRig = (p) => ({
  place: (x, z, h) => { p.root.position.x = x; p.root.position.z = z; p.root.rotation.y = -h; },
  walk: (t, amt) => p.walkPose(t, amt),
  stand: () => p.standPose(),
});

// Any bare three.js Object3D — a prop, an extra, a vehicle.
export const objectRig = (obj, yawOffset = 0) => ({
  place: (x, z, h) => { obj.position.x = x; obj.position.z = z; obj.rotation.y = -h + yawOffset; },
});

// A pure-data rig: no renderer at all. Useful for headless tests and for
// simulating actors that are off-screen.
export const dataRig = (out = {}) => ({
  place: (x, z, h) => { out.x = x; out.z = z; out.heading = h; },
  walk: (t) => { out.phase = t; },
  stand: () => { out.phase = 0; },
});
