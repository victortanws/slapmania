import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { toonMat } from './scene.js';

// limbs get capsule visuals (physics stays boxes) — rounded silhouettes read
// friendlier than raw boxes
const CAPSULE_PARTS = new Set(['uaL', 'uaR', 'faL', 'faR', 'ulL', 'ulR', 'llL', 'llR']);

// Ragdoll bodies only collide with the static world (group 1), never each other —
// keeps two overlapping ragdolls from exploding and lets the hat rest inside the head.
const GROUP_STATIC = 1;
const GROUP_RAG = 2;

export function createWorld() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;

  const groundMat = new CANNON.Material('ground');
  const fleshMat = new CANNON.Material('flesh');
  const groundContact = new CANNON.ContactMaterial(groundMat, fleshMat, {
    friction: 0.45, restitution: 0.42,
  });
  world.addContactMaterial(groundContact);
  // FROZEN LAKE: bodies land and keep SLIDING — distance = flight + glide.
  // One friction knob; every collider that uses groundMat inherits it.
  const setIce = (on) => {
    groundContact.friction = on ? 0.03 : 0.45;
    groundContact.restitution = on ? 0.3 : 0.42;
  };
  // world-quirk knobs in the same spirit: the JUNGLE's springmoss floor
  // (bouncy landings) and HEAVEN's floaty grace (lighter gravity). Passing
  // null restores the farm default. Distances stay inside the ~117m perimeter
  // (sim-verified per world before a world may use these).
  const setGround = (opts) => {
    groundContact.friction = opts && opts.friction != null ? opts.friction : 0.45;
    groundContact.restitution = opts && opts.restitution != null ? opts.restitution : 0.42;
  };
  const setGravity = (g) => { world.gravity.set(0, g != null ? g : -9.82, 0); };

  const fixed = (shape, x, y, z) => {
    const b = new CANNON.Body({ type: CANNON.Body.STATIC, material: groundMat, collisionFilterGroup: GROUP_STATIC });
    b.addShape(shape);
    b.position.set(x, y, z);
    world.addBody(b);
    return b;
  };

  const floor = fixed(new CANNON.Plane(), 0, 0, 0);
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  // the hay wall CATCHES bodies — no bouncing champions back down the lane
  const hayMat = new CANNON.Material('hay');
  world.addContactMaterial(new CANNON.ContactMaterial(hayMat, fleshMat, {
    friction: 0.95, restitution: 0.02,
  }));
  const hayWall = new CANNON.Body({ type: CANNON.Body.STATIC, material: hayMat, collisionFilterGroup: GROUP_STATIC });
  hayWall.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 4, 7)));
  hayWall.position.set(60.5, 4, 0);
  world.addBody(hayWall);
  // the world is BIGGER than any possible flight: no walls at the "limits",
  // just honest physics over open farmland. The only hard edge is the forest
  // perimeter far beyond ballistic range — a dead catch dressed in trees.
  const forestMat = new CANNON.Material('forest');
  world.addContactMaterial(new CANNON.ContactMaterial(forestMat, fleshMat, {
    friction: 0.9, restitution: 0.06,
  }));
  const edge = (hx, hy, hz, x, y, z) => {
    const b = new CANNON.Body({ type: CANNON.Body.STATIC, material: forestMat, collisionFilterGroup: GROUP_STATIC });
    b.addShape(new CANNON.Box(new CANNON.Vec3(hx, hy, hz)));
    b.position.set(x, y, z);
    world.addBody(b);
  };
  edge(1, 20, 45, 117, 20, 0);    // far treeline
  edge(1, 20, 45, -22, 20, 0);    // behind the fair
  edge(75, 20, 1, 48, 20, 37);    // north woods
  edge(75, 20, 1, 48, 20, -37);   // south woods
  // low side rails near the RING only: they protect the crowd from ground-
  // rollers, then it's open country — rolling into the pumpkins is a feature
  fixed(new CANNON.Box(new CANNON.Vec3(17.5, 3, 0.15)), 2.5, 3, 2.9);
  fixed(new CANNON.Box(new CANNON.Vec3(17.5, 3, 0.15)), 2.5, 3, -2.9);

  return { world, groundMat, fleshMat, setIce, setGround, setGravity };
}

// static colliders for the visible structures (footprints supplied by the
// stage) — the barn is a fact, not a suggestion
export function addSolids(world, mat, solids) {
  for (const s of solids) {
    const b = new CANNON.Body({ type: CANNON.Body.STATIC, material: mat, collisionFilterGroup: GROUP_STATIC });
    if (s.kind === 'box') {
      b.addShape(new CANNON.Box(new CANNON.Vec3(s.hx, s.hy, s.hz)));
      b.position.set(s.x, s.hy, s.z);
      if (s.ry) b.quaternion.setFromEuler(0, s.ry, 0);
    } else {
      b.addShape(new CANNON.Cylinder(s.r, s.r, s.h, 10));
      b.position.set(s.x, s.h / 2, s.z);
    }
    world.addBody(b);
  }
}

// Builds a low-poly human as kinematic physics bodies + matching meshes.
// Bodies stay kinematic (posable, immovable) until launch()/topple() dynamizes them.
// wScale/hScale stretch the body, massScale makes him harder to launch.
export function createRagdoll({ world, scene, mat, x = 0, z = 0, skin = 0xd9a066, shirt = 0x4a90d9, pants = 0x333a56,
  wScale = 1, hScale = 1, massScale = 1, longSleeves = false }) {
  const parts = {};
  const list = [];
  const constraints = [];
  const group = new THREE.Group();
  scene.add(group);

  function part(name, kind, rawDims, rawMass, px, py, pz, color) {
    const dims = kind === 'box'
      ? [rawDims[0] * wScale, rawDims[1] * hScale, rawDims[2] * wScale]
      : [rawDims[0] * (wScale + hScale) / 2];
    const mass = rawMass * massScale;
    px *= wScale; py *= hScale; pz *= wScale;
    const body = new CANNON.Body({
      mass, type: CANNON.Body.KINEMATIC, material: mat,
      collisionFilterGroup: GROUP_RAG, collisionFilterMask: GROUP_STATIC,
      angularDamping: 0.3, linearDamping: 0.02,
      sleepSpeedLimit: 0.3, sleepTimeLimit: 0.8,
    });
    let geo;
    if (kind === 'box') {
      body.addShape(new CANNON.Box(new CANNON.Vec3(dims[0] / 2, dims[1] / 2, dims[2] / 2)));
      if (CAPSULE_PARTS.has(name)) {
        const r = Math.max(dims[0], dims[2]) * 0.62;
        geo = new THREE.CapsuleGeometry(r, Math.max(0.05, dims[1] - r * 1.2), 4, 10);
      } else if (name === 'torso') {
        geo = new THREE.CapsuleGeometry(dims[0] * 0.52, dims[1] * 0.42, 4, 12);
      } else {
        geo = new THREE.BoxGeometry(dims[0], dims[1], dims[2]);
      }
    } else {
      body.addShape(new CANNON.Sphere(dims[0]));
      geo = new THREE.SphereGeometry(dims[0], 14, 14);
    }
    body.position.set(x + px, py, z + pz);
    world.addBody(body);
    const mesh = new THREE.Mesh(geo, toonMat(color));
    mesh.castShadow = true;
    group.add(mesh);
    const p = { body, mesh };
    parts[name] = p;
    list.push(p);
    return p;
  }

  part('pelvis', 'box', [0.30, 0.20, 0.24], 2.0, 0, 0.98, 0, pants);
  part('torso', 'box', [0.38, 0.50, 0.26], 3.0, 0, 1.36, 0, shirt);
  part('head', 'sphere', [0.17], 1.0, 0, 1.75, 0, skin);
  part('uaL', 'box', [0.09, 0.30, 0.09], 0.5, 0, 1.40, 0.26, shirt);
  part('uaR', 'box', [0.09, 0.30, 0.09], 0.5, 0, 1.40, -0.26, shirt);
  // long sleeves (suits, jackets): the forearms wear the shirt color
  part('faL', 'box', [0.08, 0.28, 0.08], 0.4, 0, 1.10, 0.26, longSleeves ? shirt : skin);
  part('faR', 'box', [0.08, 0.28, 0.08], 0.4, 0, 1.10, -0.26, longSleeves ? shirt : skin);
  part('ulL', 'box', [0.13, 0.42, 0.13], 1.0, 0, 0.66, 0.10, pants);
  part('ulR', 'box', [0.13, 0.42, 0.13], 1.0, 0, 0.66, -0.10, pants);
  part('llL', 'box', [0.11, 0.42, 0.11], 0.8, 0, 0.23, 0.10, 0x1d2138);
  part('llR', 'box', [0.11, 0.42, 0.11], 0.8, 0, 0.23, -0.10, 0x1d2138);

  const V = (a, b, c) => new CANNON.Vec3(a * wScale, b * hScale, c * wScale);
  function joint(a, b, pa, pb, ang = 0.6, tw = 0.4) {
    const c = new CANNON.ConeTwistConstraint(parts[a].body, parts[b].body, {
      pivotA: pa, pivotB: pb,
      axisA: CANNON.Vec3.UNIT_Y, axisB: CANNON.Vec3.UNIT_Y,
      angle: ang, twistAngle: tw, collideConnected: false,
    });
    c.disable();
    world.addConstraint(c);
    constraints.push(c);
  }

  joint('pelvis', 'torso', V(0, 0.12, 0), V(0, -0.26, 0), 0.5, 0.4);
  joint('torso', 'head', V(0, 0.27, 0), V(0, -0.19, 0), 0.6, 0.5);
  joint('torso', 'uaL', V(0, 0.20, 0.20), V(0, 0.16, 0), 1.4, 0.5);
  joint('torso', 'uaR', V(0, 0.20, -0.20), V(0, 0.16, 0), 1.4, 0.5);
  joint('uaL', 'faL', V(0, -0.16, 0), V(0, 0.15, 0), 0.1, 0.8);
  joint('uaR', 'faR', V(0, -0.16, 0), V(0, 0.15, 0), 0.1, 0.8);
  joint('pelvis', 'ulL', V(0, -0.08, 0.10), V(0, 0.22, 0), 0.9, 0.4);
  joint('pelvis', 'ulR', V(0, -0.08, -0.10), V(0, 0.22, 0), 0.9, 0.4);
  joint('ulL', 'llL', V(0, -0.22, 0), V(0, 0.22, 0), 0.05, 0.05);
  joint('ulR', 'llR', V(0, -0.22, 0), V(0, 0.22, 0), 0.05, 0.05);

  function dynamize() {
    constraints.forEach((c) => c.enable());
    list.forEach(({ body }) => {
      body.type = CANNON.Body.DYNAMIC;
      body.updateMassProperties();
      body.wakeUp();
    });
  }

  const r = () => Math.random();

  const api = {
    parts, constraints, group,
    launch(dir, speed, spin) {
      dynamize();
      // tight jitter: flights must be earned by technique, not decided by dice
      list.forEach(({ body }) => {
        const j = 0.96 + r() * 0.08;
        body.velocity.set(dir.x * speed * j, dir.y * speed * j, dir.z * speed * j);
        // spin from the true contact geometry (main.js) — a coherent barrel-roll
        // about the real axis, with a touch of per-part tumble; falls back to the
        // old random spin for callers that don't supply one (topple, etc.)
        if (spin) body.angularVelocity.set(spin.x + (r() - 0.5) * 0.8, spin.y + (r() - 0.5) * 0.8, spin.z + (r() - 0.5) * 0.8);
        else body.angularVelocity.set((r() - 0.5) * 2.5, (r() - 0.5) * 2.5, speed * 0.25 * (0.8 + r() * 0.4));
      });
      parts.head.body.velocity.scale(1.1, parts.head.body.velocity);
    },
    topple(dirX) {
      dynamize();
      list.forEach(({ body }) => {
        body.velocity.set(dirX * 1.6, 0.8, (r() - 0.5) * 0.8);
        body.angularVelocity.set((r() - 0.5) * 3, (r() - 0.5) * 3, -dirX * 2.5 + (r() - 0.5));
      });
    },
    sync() {
      list.forEach(({ body, mesh }) => {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
      });
    },
    maxSpeed() {
      let m = 0;
      list.forEach(({ body }) => { m = Math.max(m, body.velocity.length()); });
      return m;
    },
    remove() {
      constraints.forEach((c) => world.removeConstraint(c));
      list.forEach(({ body }) => world.removeBody(body));
      scene.remove(group);
    },
  };
  api.sync();
  return api;
}
