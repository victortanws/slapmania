// ---------------------------------------------------------------------------
// hub.js — the fairground as a place you can walk around.
//
// This is the payoff for the three portable layers: locomotion (actor.js +
// navigate.js), camera (camrig.js) and presentation (the context split). The hub
// itself owns almost no mechanism — it wires those together and adds the two
// things that are genuinely its own: WHERE the volunteers stand, and WHAT
// happens when you walk up to one.
//
// Host contract (everything game-specific is injected, so the hub file itself
// stays close to portable):
//
//   createHub({
//     stage,                     // needs .solids, .crowdSpots, .restingBodies
//     player,                    // the Player instance to walk around
//     makeFigure(arch, x, z, ry) // -> { group, dispose() }  a standing volunteer
//     onChallenge(arch)          // walk up + interact -> start a match
//     onPrompt(arch, line)       // show/clear the interact prompt (null = clear); line = what they say
//   })
//
// Movement is deliberately BOTH: hold a direction to walk it, or click/tap a
// spot to route there. The first is what a keyboard wants, the second is the
// only thing that works on a phone once the touch pad is hidden — and routing
// is free because actor.js already does waypoints.
// ---------------------------------------------------------------------------
import { createNav } from './navigate.js';
import { createActor, createCast, playerRig } from './actor.js';

// Where the volunteers wait. Spread down the lane and off to both rails so the
// walk between them is a walk, not a menu with extra steps. All well clear of
// the ring itself (x < 6) so entering the hub never overlaps the slapping spot.
// Kept inside x≈8..38 and off the centre line. Spread further down the lane and
// the walk stops being a fairground and becomes a corridor — and past ~50 the
// props genuinely strand you (hoss at x=58 measured unreachable). Every entry
// here is verified walkable from the spawn point.
export const STATIONS = [
  { key: 'cletus', x: 9, z: 6.5, ry: -2.4 },
  { key: 'hank', x: 13, z: -6.0, ry: 2.3 },
  { key: 'slim', x: 19, z: 5.5, ry: -2.2 },
  { key: 'bertha', x: 25, z: -6.5, ry: 2.5 },
  { key: 'mabel', x: 31, z: 5.0, ry: -2.4 },
  { key: 'hoss', x: 37, z: -5.5, ry: 2.3 },
];

const REACH = 2.6;          // how close you must stand to challenge someone
const SPEED = 3.2;

export function createHub(host) {
  const { stage, player } = host;
  let nav = null, cast = null, me = null;
  let figures = [];
  let active = false;
  let near = null;            // the station currently in reach

  function build() {
    cast = createCast();
    me = cast.add(createActor(playerRig(player), { x: 4, z: 0, heading: 0, speed: SPEED, radius: 0.36 }));
    nav = createNav({
      statics: () => stage.solids || [],
      // spectators, the volunteers standing at their stations, and everyone who
      // already flew are all solid to the walker — one feed, no special cases
      actors: () => cast.actors.concat(stage.crowdSpots || [], stage.restingBodies || [], stations()),
      bounds: { minX: -18, maxX: 110, minZ: -30, maxZ: 30 },
    });
  }
  const stations = () => figures.map((f) => ({ x: f.x, z: f.z, r: 0.5 }));

  function enter(roster) {
    if (!nav) build();
    nav.rebuild();
    figures = [];
    for (const st of STATIONS) {
      const arch = roster.find((r) => r.key === st.key);
      if (!arch) continue;                       // a locked/absent volunteer just isn't there
      const made = host.makeFigure(arch, st.x, st.z, st.ry);
      if (made) figures.push({ arch, x: st.x, z: st.z, ...made });
    }
    me.at(4, 0, 0).stop();
    yawInit = false;                             // re-acquire the trail on entry
    player.root.visible = true;
    active = true;
    near = null;
    host.onPrompt(null);
    return figures.length;
  }

  function exit() {
    for (const f of figures) if (f.dispose) f.dispose();
    figures = [];
    active = false;
    near = null;
    host.onPrompt(null);
    if (player.standPose) player.standPose();   // legs down; the match re-poses the arm
  }

  // walk there by tapping the ground — actor.js already routes waypoints
  function goTo(x, z) { if (active && me) me.goTo([{ x, z }]); }

  // hold a direction. Overrides any tapped route, because a player who grabs the
  // keys has changed their mind about where they were going.
  function drive(dx, dz, dt) {
    if (!active || !me) return;
    const m = Math.hypot(dx, dz);
    if (m < 0.01) return;
    me.stop();
    const step = SPEED * dt;
    const p = nav.moveAndSlide(me.x, me.z, (dx / m) * step, (dz / m) * step, me.r, (o) => o === me);
    me.x = p.x; me.z = p.z;
    me.heading = Math.atan2(dz, dx);
    me.phase += dt;
    if (player.walkPose) player.walkPose(me.phase, 1);
    player.root.position.x = me.x; player.root.position.z = me.z;
    player.root.rotation.y = -me.heading;
  }

  function update(dt) {
    if (!active) return;
    cast.update(dt, nav);                       // routed movement (tap-to-walk)
    // who is within arm's reach?
    let best = null, bd = REACH;
    for (const f of figures) {
      const d = Math.hypot(f.x - me.x, f.z - me.z);
      if (d < bd) { bd = d; best = f; }
    }
    if (best !== near) {
      near = best;
      // The volunteers TALK when you walk up. Their taunt pools are deep (the
      // faceoff only ever showed one line per match), so the fairground gets a
      // voice for free — rotated per station so two visits never repeat.
      let line = null;
      if (near) {
        const pool = near.arch.taunts || [];
        if (pool.length) { near.said = ((near.said || 0) + 1) % pool.length; line = pool[near.said]; }
      }
      host.onPrompt(near ? near.arch : null, line);
    }
    // the volunteers turn to watch you go past — cheap, and it makes the
    // fairground feel inhabited rather than decorated
    for (const f of figures) {
      if (!f.group) continue;
      const d = Math.hypot(f.x - me.x, f.z - me.z);
      if (d < 9) {
        const want = Math.atan2(me.x - f.x, me.z - f.z);
        f.group.rotation.y += (want - f.group.rotation.y) * Math.min(1, dt * 2.4);
      }
      // name boards face the lens, always — a plate rotated with its owner is
      // edge-on and unreadable from half the fairground
      if (f.plate && host.camera) {
        f.plate.quaternion.copy(host.camera.quaternion);
        f.plate.scale.setScalar(near === f ? 1.18 : 1);
      }
    }
  }

  // Third-person trail: behind and above, looking a little ahead.
  //
  // The camera carries its OWN yaw that eases toward the walker's heading rather
  // than being derived from it. Built straight off `me.heading`, a sharp turn
  // (which tap-to-walk produces constantly) whips the camera a full quarter
  // circle through the character — measured 5m out of position mid-swing.
  let camYaw = 0, yawInit = false;
  function shot(dt = 1 / 60) {
    if (!yawInit && me) { camYaw = me.heading; yawInit = true; }
    if (me) {
      // shortest-way-round, so crossing ±π does not spin the long way
      let d = me.heading - camYaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      // only chase while he is actually travelling; turning on the spot should
      // not drag the whole world around the player
      const moving = me.state === 'walking' || me.state === 'blocked';
      camYaw += d * Math.min(1, dt * (moving ? 3.2 : 1.1));
    }
    const bx = Math.cos(camYaw), bz = Math.sin(camYaw);
    return {
      pos: { x: me.x - bx * 5.4, y: 3.1, z: me.z - bz * 5.4 },
      look: { x: me.x + bx * 2.2, y: 1.25, z: me.z + bz * 2.2 },
      snap: 6, fov: 55,
    };
  }

  const challenge = () => (near ? near.arch : null);
  const pos = () => (me ? { x: me.x, z: me.z, heading: me.heading } : { x: 0, z: 0, heading: 0 });

  return { enter, exit, update, drive, goTo, shot, challenge, pos,
    get active() { return active; }, get nav() { return nav; }, get count() { return figures.length; } };
}
