// ---------------------------------------------------------------------------
// camrig.js — a portable camera rig.
//
// Knows nothing about SlapMania, its states, or what a slap is. It owns the
// three things every 3rd-person game camera needs and every game re-implements
// badly:
//
//   1. SMOOTHING     — chase a target framing at a per-shot rate, so a cut is a
//                      high rate and a glide is a low one. One number, `snap`.
//   2. FREE LOOK     — the player's orbit/zoom applied ON TOP of the framing,
//                      never instead of it, so a director can keep working while
//                      the player leans in.
//   3. LENS          — fov blended toward a target, so punch-ins are a property
//                      of the shot rather than a special case.
//
// The caller supplies a SHOT each frame:
//
//   rig.apply(dt, { pos, look, snap, fov, dutch })
//
// That is the whole contract. A director is then just a function that returns a
// shot — see main.js `shotFor()`. The same vocabulary is what tools/cinema.js
// uses offline, so gameplay cameras, replays and rendered trailers can speak one
// language.
//
// Depends on three.js for Vector3 and a PerspectiveCamera; nothing else.
// ---------------------------------------------------------------------------
import * as THREE from 'three';

export function createCamRig(camera, opts = {}) {
  const pos = (opts.pos || new THREE.Vector3(0, 2, 5)).clone();
  const look = (opts.look || new THREE.Vector3()).clone();
  const off = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const baseFov = opts.fov || 55;

  // player free-look: `*T` are the targets input writes; live values chase them
  const user = { dist: 1, distT: 1, yaw: 0, yawT: 0, pitch: 0, pitchT: 0 };
  const lim = {
    minDist: opts.minDist || 0.42, maxDist: opts.maxDist || 2.6,
    maxYaw: opts.maxYaw === undefined ? 2.4 : opts.maxYaw,
    minPitch: opts.minPitch === undefined ? -0.75 : opts.minPitch,
    maxPitch: opts.maxPitch === undefined ? 1.15 : opts.maxPitch,
    minY: opts.minY === undefined ? 0.25 : opts.minY,
  };
  const ease = (rate, dt) => 1 - Math.exp(-rate * dt);

  const rig = {
    pos, look, user,

    zoom(mul) { user.distT = Math.max(lim.minDist, Math.min(lim.maxDist, user.distT * mul)); },
    orbit(dx, dy) {
      user.yawT = Math.max(-lim.maxYaw, Math.min(lim.maxYaw, user.yawT + dx));
      user.pitchT = Math.max(lim.minPitch, Math.min(lim.maxPitch, user.pitchT + dy));
    },
    recenter() { user.distT = 1; user.yawT = 0; user.pitchT = 0; },
    // snap the smoothed framing somewhere with no glide (scene changes)
    jump(p, l) { if (p) pos.copy(p); if (l) look.copy(l); },
    get nudged() {
      return Math.abs(user.dist - 1) > 0.002 || Math.abs(user.yaw) > 0.002 || Math.abs(user.pitch) > 0.002;
    },

    apply(dt, shot) {
      if (shot.pos) pos.lerp(shot.pos, ease(shot.snap === undefined ? 5 : shot.snap, dt));
      if (shot.look) look.lerp(shot.look, ease(shot.snap === undefined ? 5 : shot.snap, dt));

      const k = ease(10, dt);
      user.dist += (user.distT - user.dist) * k;
      user.yaw += (user.yawT - user.yaw) * k;
      user.pitch += (user.pitchT - user.pitch) * k;

      if (rig.nudged) {
        // orbit the player's offset around the director's look point, so the
        // shot keeps composing while the player moves within it
        off.copy(pos).sub(look);
        const len = off.length() || 1;
        const r = len * user.dist;
        const theta = Math.atan2(off.x, off.z) + user.yaw;
        let phi = Math.acos(Math.max(-1, Math.min(1, off.y / len))) - user.pitch;
        phi = Math.max(0.18, Math.min(Math.PI - 0.5, phi));   // never through the floor or the zenith
        camera.position.set(
          look.x + r * Math.sin(phi) * Math.sin(theta),
          Math.max(lim.minY, look.y + r * Math.cos(phi)),
          look.z + r * Math.sin(phi) * Math.cos(theta),
        );
      } else {
        camera.position.copy(pos);
      }

      if (shot.dutch) camera.up.set(Math.sin(shot.dutch), Math.cos(shot.dutch), 0); else camera.up.copy(up);
      camera.lookAt(look);

      const targetFov = shot.fov || baseFov;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov += (targetFov - camera.fov) * ease(shot.fovRate === undefined ? 9 : shot.fovRate, dt);
        camera.updateProjectionMatrix();
      }
    },
  };
  return rig;
}
