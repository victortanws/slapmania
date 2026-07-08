import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createRagdoll } from './ragdoll.js';
import { toonMat } from './scene.js';

const START_X = 0.95;

// The county fair roster. mass drives knockback physics (heavy = barely budges)
// and doubles as the score multiplier so every weight class is worth slapping.
export const ROSTER = [
  {
    key: 'slim', name: 'SLIM PETE', tag: 'FEATHERWEIGHT',
    w: 0.6, h: 1.08, mass: 0.4,
    skin: 0xdcd6c4, shirt: 0xf2ede1, pants: 0x4a6fa5, hat: 'cap', hatCol: 0xd8404f,
    pickLine: 'Mostly bones. Flies like a lawn dart.',
    taunts: ['A stiff breeze beat you to it.', 'I weigh nothing and fear less.'],
  },
  {
    key: 'hank', name: 'HAYSEED HANK', tag: 'MIDDLEWEIGHT',
    w: 1.0, h: 1.0, mass: 1.0,
    skin: 0xd9a066, shirt: 0xa8402e, pants: 0x3f5a8f, hat: 'straw', bandCol: 0xa8402e,
    pickLine: "The people's cheek. Fair and square.",
    taunts: ['My scarecrow slaps harder.', 'After this, you muck the stables.'],
  },
  {
    key: 'ravinray', name: "RAVIN' RAY", tag: 'HEAVYWEIGHT',
    w: 1.35, h: 0.98, mass: 1.8,
    skin: 0xe8c088, shirt: 0x2fd4c4, stripes: 0xf2ede1, pants: 0x2a2a33,
    hat: 'band', hatCol: 0xff3df0, hair: 'flat', hairCol: 0x16161a, shades: true, noStache: true,
    pickLine: 'Raves all night. Immovable by day.',
    taunts: ['I have danced through worse, buddy.', 'This is nothing. Try a 6 a.m. warehouse set.'],
  },
  {
    key: 'mabel', name: 'MULE-KICK MABEL', tag: 'MIDDLEWEIGHT',
    w: 0.95, h: 1.0, mass: 0.95, female: true,
    skin: 0xe3b28c, shirt: 0x8a5fb0, pants: 0x4a6fa5, skirt: 0x4a6fa5,
    hat: 'sun', hatCol: 0xf2e6cc, bandCol: 0xd8404f, hair: 'pony', hairCol: 0x7a4a20,
    pickLine: 'Kicked by her own mule twice. Unbothered.',
    taunts: ['My mule kicks harder, sugar.', "I've been hit by hail worse than you."],
  },
  {
    key: 'hoss', name: 'BIG HOSS', tag: 'SUPER-HEAVY',
    w: 1.75, h: 1.1, mass: 2.6,
    skin: 0xcf9058, shirt: 0xf2ede1, pants: 0x5b4a33, hat: 'band', hatCol: 0xa8402e,
    pickLine: 'Good luck, sugar. Bring TWO tractors.',
    taunts: ['I have eaten things heavier than you.', 'Trees have tried. Trees have failed.'],
  },
  {
    key: 'bertha', name: 'BIG BERTHA', tag: 'HEAVYWEIGHT',
    w: 1.42, h: 0.96, mass: 1.9, female: true, busty: true,
    skin: 0xdda379, shirt: 0xd8687a, pants: 0xd8687a, skirt: 0xd8687a,
    hat: 'sun', hatCol: 0xf4c6d0, bandCol: 0xc95d73, hair: 'bun', hairCol: 0x8a8378,
    pickLine: 'The immovable aunt. The points are magnificent.',
    taunts: ['I have survived six county fairs.', 'My biscuits weigh more than your arm.'],
  },
  {
    key: 'cletus', name: 'GRANDPA CLETUS', tag: 'VETERAN',
    w: 0.9, h: 0.93, mass: 0.75,
    skin: 0xdcae85, shirt: 0x77808f, pants: 0x53617a, hat: 'cowboy', whiteBeard: true,
    hair: 'long', hairCol: 0xe8e2d5, suspenders: 0x4a3320,
    pickLine: 'Surprisingly aerodynamic for his age.',
    taunts: ['I slapped your grandfather too.', 'Been getting slapped since 1961. Still here.'],
  },
  {
    key: 'don', name: 'TREMENDOUS DON', tag: 'EXECUTIVE',
    w: 1.15, h: 1.03, mass: 1.3,
    skin: 0xe8934a, shirt: 0x1f2a44, pants: 0x1a2438, noStache: true,
    hair: 'swoop', hairCol: 0xf2c230, suit: true, tie: 0xc9302c,
    pickLine: 'The most slappable cheek in history. Tremendous.',
    taunts: ['You call that a hand? Sad!', 'I know slaps. I have the best slaps.', 'My cheek is a perfect 10. Ask anyone.'],
  },
  {
    key: 'influencer', name: 'THE INFLUENCER', tag: 'LIGHTWEIGHT',
    w: 0.82, h: 1.0, mass: 0.7, female: true, busty: true,
    skin: 0xf2cda2, shirt: 0xf2cda2, pants: 0x2f6fe0, skirt: 0x2f6fe0, bikini: true,
    cropTop: 0xff3d88, hairFlow: true,   // pink crop top, blue shorts, windswept hair
    hair: 'long', hairCol: 0xf0cf6a, shades: true, shadesCol: 0x141414, phone: true,
    hat: 'floppy', hatCol: 0xf7f2ea, bandCol: 0x2f6fe0,   // chic white floppy hat, blue band
    lookUp: true, lipstick: 0xe0244f,    // selfie-from-above tilt + bold lips
    pickLine: 'Wait — is this thing recording? Hi besties!',
    taunts: ["Don't forget to like and subscribe!", 'This is SO going on my story.'],
  },
];

function segSphere(p0, p1, c, r) {
  const d = new THREE.Vector3().subVectors(p1, p0);
  const m = new THREE.Vector3().subVectors(p0, c);
  const len2 = d.lengthSq();
  const t = len2 > 0 ? THREE.MathUtils.clamp(-m.dot(d) / len2, 0, 1) : 0;
  const q = p0.clone().addScaledVector(d, t);
  return q.distanceTo(c) <= r ? q : null;
}

// A braced opponent: kinematic ragdoll posed cheek-out, hands behind his back,
// per league regulations. One clean palm strike dynamizes him into flight.
export class Opponent {
  constructor({ scene, world, mat, arch = ROSTER[1], showcase = false }) {
    this.scene = scene;
    this.world = world;
    this.arch = arch;
    this.startX = START_X;
    this.launched = false;
    this.wallSplat = false;
    this.time = 0;
    this.showcaseMode = showcase;

    const { w, h } = arch;
    this.rHead = 0.17 * (w + h) / 2;
    // hitbox, not visual: an oversized belly must not swallow the path to the
    // cheek, or big characters become body-blow-only
    this.rTorso = 0.26 * Math.min(w, 1.0);
    // heavy folk barely budge; featherweights become ragdoll rockets
    this.knockback = Math.pow(arch.mass, 0.75);

    const rag = this.rag = createRagdoll({
      world, scene, mat, x: START_X, z: 0,
      skin: arch.skin, shirt: arch.shirt, pants: arch.pants,
      wScale: w, hScale: h, massScale: arch.mass, longSleeves: !!arch.suit,
    });

    // --- braced pose (facing -X, leaning in, offering the cheek) ---
    const P = rag.parts;
    const set = (name, x, y, z, ex = 0, ey = 0, ez = 0) => {
      P[name].body.position.set(START_X + (x - START_X) * w, y * h, z * w);
      P[name].body.quaternion.setFromEuler(ex, ey, ez);
    };
    set('torso', START_X - 0.05, 1.33, 0, 0, 0, 0.22);
    set('head', START_X - 0.16, 1.56, 0, 0.18, 0, arch.lookUp ? -0.5 : 0.35);   // lookUp tilts the face skyward
    if (arch.phone) {
      // left arm raised, holding a selfie stick up in front of her face
      set('uaL', START_X + 0.02, 1.5, 0.2, 0, 0, -1.15);
      set('faL', START_X - 0.13, 1.72, 0.13, 0, 0, -0.55);
    } else {
      set('uaL', START_X + 0.08, 1.38, 0.24, 0, 0, 0.45);
      set('faL', START_X + 0.20, 1.06, 0.10, 0.9, 0, 0.3);
    }
    set('uaR', START_X + 0.08, 1.38, -0.24, 0, 0, 0.45);
    set('faR', START_X + 0.20, 1.06, -0.10, -0.9, 0, 0.3);
    rag.sync();

    // --- face (children of the head mesh, so they fly with him) ---
    const head = P.head.mesh;
    const hr = this.rHead / 0.17;
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), toonMat(0x111111));
      eye.position.set(-0.145 * hr, 0.035 * hr, s * 0.055 * hr);
      head.add(eye);
    }
    if (!arch.female && !arch.noStache) {
      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.13),
        toonMat(arch.whiteBeard ? 0xe8e2d5 : 0x2b1c10));
      stache.position.set(-0.16 * hr, -0.045 * hr, 0);
      stache.scale.setScalar(hr);
      head.add(stache);
    }
    if (arch.shades && arch.shadesCol) {
      // proper two-lens sunglasses: rims, dark lenses, a bridge and temple arms
      const fCol = arch.shadesCol;
      for (const sgn of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.062, 0.1), toonMat(fCol));
        rim.position.set(-0.126 * hr, 0.035 * hr, sgn * 0.06 * hr);
        rim.scale.setScalar(hr);
        head.add(rim);
        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.048, 0.082), toonMat(0x0b0b14));
        lens.position.set(-0.137 * hr, 0.035 * hr, sgn * 0.06 * hr);
        lens.scale.setScalar(hr);
        head.add(lens);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.014, 0.045), toonMat(fCol));
      bridge.position.set(-0.13 * hr, 0.045 * hr, 0);
      bridge.scale.setScalar(hr);
      head.add(bridge);
      for (const sgn of [-1, 1]) {
        const temple = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.012), toonMat(fCol));
        temple.position.set(-0.08 * hr, 0.04 * hr, sgn * 0.115 * hr);
        temple.scale.setScalar(hr);
        head.add(temple);
      }
    } else if (arch.shades) {
      // outlandish rave visor (RAVIN' RAY): neon magenta frame, dark wraparound lens
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.09, 0.26), toonMat(0xff3df0));
      frame.position.set(-0.128 * hr, 0.035 * hr, 0);
      frame.scale.setScalar(hr);
      head.add(frame);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.05, 0.21), toonMat(0x1a0f2e));
      lens.position.set(-0.135 * hr, 0.035 * hr, 0);
      lens.scale.setScalar(hr);
      head.add(lens);
    }
    if (arch.phone) {
      // a selfie stick held IN HER HAND (left forearm) — extends from the fist to the phone
      const fa = P.faL.mesh;
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), toonMat(0xcfd2da));
      stick.position.set(0, 0.36, 0);
      fa.add(stick);
      const ph = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.16), toonMat(0x15151c));
      ph.position.set(0, 0.62, 0);
      fa.add(ph);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.13), toonMat(0x9fd6ff));
      screen.position.set(0, 0.605, 0);
      fa.add(screen);
    }
    if (arch.female) {
      const lips = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, arch.lipstick ? 0.042 : 0.03, arch.lipstick ? 0.095 : 0.075),
        toonMat(arch.lipstick || 0xc4506a));
      lips.position.set(-0.156 * hr, -0.055 * hr, 0);
      head.add(lips);
      for (const sgn of [-1, 1]) {
        const lash = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.014, 0.052), toonMat(0x161616));
        lash.position.set(-0.138 * hr, 0.068 * hr, sgn * 0.055 * hr);
        head.add(lash);
        const earring = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), toonMat(0xffd23f));
        earring.position.set(-0.01 * hr, -0.03 * hr, sgn * 0.168 * hr);
        head.add(earring);
      }
      // a proper skirt over the pelvis — or a short bikini bottom — flies with the ragdoll
      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22 * w, (arch.bikini ? 0.3 : 0.4) * w, (arch.bikini ? 0.14 : 0.42) * h, 12),
        toonMat(arch.skirt || 0xc95d73)
      );
      skirt.position.y = (arch.bikini ? -0.02 : -0.14) * h;
      skirt.castShadow = true;
      P.pelvis.mesh.add(skirt);
      if (arch.busty) {
        // the dress has a figure — dress- (or crop-top-) colored
        for (const sgn of [-1, 1]) {
          const bump = new THREE.Mesh(new THREE.SphereGeometry(0.115 * w, 10, 10), toonMat(arch.cropTop || arch.shirt));
          bump.position.set(-0.2 * w, 0.08, sgn * 0.1 * w);
          bump.castShadow = true;
          P.torso.mesh.add(bump);
        }
      }
      if (arch.cropTop) {
        // a crop top band across the chest — the midriff below stays bare (skin torso)
        const r = 0.38 * w * 0.52 + 0.02;
        const band = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.17 * h, 14), toonMat(arch.cropTop));
        band.position.y = 0.12 * h;
        band.castShadow = true;
        P.torso.mesh.add(band);
      }
    }
    if (arch.hair) {
      const hm = toonMat(arch.hairCol || 0x5b3d1e);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.175 * hr, 12, 12), hm);
      cap.scale.set(1, 0.8, 1.05);
      // faces -X; hairFlow pushes the cap up & back so it never drapes over the face
      cap.position.set((arch.hairFlow ? 0.09 : 0.025) * hr, (arch.hairFlow ? 0.07 : 0.03) * hr, 0);
      head.add(cap);
      if (arch.hair === 'pony') {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), hm);
        tail.position.set(0.17 * hr, -0.07 * hr, 0);
        tail.rotation.z = -0.35;
        tail.scale.setScalar(hr);
        head.add(tail);
      } else if (arch.hair === 'bun') {
        const bun = new THREE.Mesh(new THREE.SphereGeometry(0.075 * hr, 10, 10), hm);
        bun.position.set(0.16 * hr, 0.09 * hr, 0);
        head.add(bun);
      } else if (arch.hair === 'long') {
        const flow = arch.hairFlow;   // windswept: sweep the hair up and back
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.09, flow ? 0.5 : 0.42, 0.22), hm);
        back.position.set((flow ? 0.22 : 0.13) * hr, (flow ? 0.04 : -0.12) * hr, 0);
        if (flow) back.rotation.z = -0.7;
        back.scale.setScalar(hr);
        head.add(back);
        for (const sgn of [-1, 1]) {
          const strand = new THREE.Mesh(new THREE.BoxGeometry(0.12, flow ? 0.4 : 0.34, 0.055), hm);
          strand.position.set((flow ? 0.14 : 0.01) * hr, (flow ? 0.02 : -0.13) * hr, sgn * 0.15 * hr);
          if (flow) strand.rotation.z = -0.55;
          strand.scale.setScalar(hr);
          head.add(strand);
        }
        if (flow) {
          // volume on TOP and BACK only, swept back — the face stays fully clear
          const pouf = new THREE.Mesh(new THREE.SphereGeometry(0.15 * hr, 12, 12), hm);
          pouf.scale.set(1.05, 0.85, 1.15);
          pouf.position.set(0.11 * hr, 0.13 * hr, 0);   // high on the crown, well behind the face
          head.add(pouf);
          for (const sgn of [-1, 1]) {
            // hair swept back behind the ears (sides only — never over the front)
            const side = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.055), hm);
            side.position.set(0.07 * hr, -0.04 * hr, sgn * 0.15 * hr);
            side.rotation.z = -0.15;
            side.scale.setScalar(hr);
            head.add(side);
          }
        }
      } else if (arch.hair === 'swoop') {
        // the architectural marvel: swept forward, up, and back into legend
        const swoop = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.055, 0.19), hm);
        swoop.position.set(-0.1 * hr, 0.12 * hr, 0);
        swoop.rotation.z = -0.3;
        swoop.scale.setScalar(hr);
        head.add(swoop);
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.17), hm);
        crest.position.set(-0.165 * hr, 0.075 * hr, 0);
        crest.rotation.z = -0.9;
        crest.scale.setScalar(hr);
        head.add(crest);
        for (const sgn of [-1, 1]) {
          const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.085, 0.032), hm);
          side.position.set(0, -0.015 * hr, sgn * 0.16 * hr);
          side.scale.setScalar(hr);
          head.add(side);
        }
      }
    }
    // wardrobe extras that ride the torso (and fly with it)
    if (arch.stripes) {
      const tr = 0.38 * w * 0.52 + 0.008;
      for (const sy of [-0.13 * h, 0.01 * h, 0.15 * h]) {
        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(tr, tr, 0.055 * h, 14), toonMat(arch.stripes));
        stripe.position.y = sy;
        P.torso.mesh.add(stripe);
      }
    }
    if (arch.suspenders) {
      const tr = 0.38 * w * 0.52;
      for (const sgn of [-1, 1]) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.44 * h, 0.05), toonMat(arch.suspenders));
        strap.position.set(-(tr + 0.005), 0.02, sgn * 0.07 * w);
        strap.castShadow = true;
        P.torso.mesh.add(strap);
      }
    }
    if (arch.suit) {
      // crisp white shirtfront and the power tie — it reaches the belt. Always.
      const tr = 0.38 * w * 0.52;
      const shirtV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24 * h, 0.11 * w), toonMat(0xf2ede1));
      shirtV.position.set(-(tr + 0.004), 0.09 * h, 0);
      shirtV.castShadow = true;
      P.torso.mesh.add(shirtV);
      const knot = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.055), toonMat(arch.tie || 0xc9302c));
      knot.position.set(-(tr + 0.018), 0.18 * h, 0);
      P.torso.mesh.add(knot);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32 * h, 0.06), toonMat(arch.tie || 0xc9302c));
      blade.position.set(-(tr + 0.018), 0.0, 0);
      blade.castShadow = true;
      P.torso.mesh.add(blade);
    }
    if (arch.whiteBeard) {
      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.11), toonMat(0xe8e2d5));
      beard.position.set(-0.13 * hr, -0.12 * hr, 0);
      beard.scale.setScalar(hr);
      head.add(beard);
    }

    // red handprint decal, revealed on impact
    const print = this.handprint = new THREE.Group();
    const pm = new THREE.MeshBasicMaterial({ color: 0xd83a3a });
    const palm = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), pm);
    print.add(palm);
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.02, 8), pm);
      const a = -0.7 + i * 0.35;
      f.position.set(Math.sin(a) * 0.1, Math.cos(a) * 0.1, 0);
      print.add(f);
    }
    print.rotation.y = -Math.PI / 2;
    print.position.set(-0.165 * hr, 0, 0.04 * hr);
    print.scale.setScalar(hr);
    print.visible = false;
    head.add(print);

    // --- headwear: distinct per volunteer. Real hats get a physics body so
    // they pop off on impact; headbands hug the skull and stay put. ---
    if (arch.hat === 'band' || !arch.hat) {
      if (arch.hat === 'band') {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.182, 0.07, 14),
          toonMat(arch.hatCol || 0xa8402e));
        band.scale.setScalar(hr);
        band.position.set(0, 0.055 * hr, 0);
        band.rotation.x = 0.1;
        head.add(band);
      }
      this.hatBody = null;
      this.hatMesh = null;
    } else {
      this.hatBody = new CANNON.Body({
        mass: 0.2, type: CANNON.Body.KINEMATIC, material: mat,
        collisionFilterGroup: 2, collisionFilterMask: 1,
        angularDamping: 0.3,
      });
      this.hatBody.addShape(new CANNON.Cylinder(0.13 * hr, 0.13 * hr, 0.12, 10));
      this.hatBody.position.set(START_X - 0.13 * hr, (1.56 + 0.17 * hr + 0.1) * h, 0);
      this.hatBody.quaternion.setFromEuler(0, 0, 0.35);
      world.addBody(this.hatBody);
      const hat = this.hatMesh = new THREE.Group();
      const T = toonMat;
      if (arch.hat === 'cap') {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), T(arch.hatCol || 0xd8404f));
        dome.position.y = -0.05;
        hat.add(dome);
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.15), T(arch.hatCol || 0xd8404f));
        brim.position.set(-0.19, -0.045, 0); // bill forward — he faces the player
        hat.add(brim);
        const button = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), T(0xf2ede1));
        button.position.y = 0.1;
        hat.add(button);
      } else if (arch.hat === 'cowboy') {
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.03, 14), T(0x6b4a2e));
        brim.position.y = -0.05;
        hat.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.155, 0.2, 12), T(0x6b4a2e));
        crown.position.y = 0.05;
        hat.add(crown);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.05, 12), T(0x3a2a1a));
        band.position.y = -0.02;
        hat.add(band);
      } else if (arch.hat === 'sun') {
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.022, 16), T(arch.hatCol || 0xf2e6cc));
        brim.position.y = -0.05;
        hat.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.1, 12), T(arch.hatCol || 0xf2e6cc));
        hat.add(crown);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.162, 0.04, 12), T(arch.bandCol || 0xc95d73));
        band.position.y = -0.03;
        hat.add(band);
        const flowerC = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), T(0xffd23f));
        flowerC.position.set(-0.16, -0.02, 0.16);
        hat.add(flowerC);
        for (let i = 0; i < 5; i++) {
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), T(0xff8fb0));
          const pa = (i / 5) * Math.PI * 2;
          petal.position.set(-0.16 + Math.cos(pa) * 0.045, -0.028, 0.16 + Math.sin(pa) * 0.045);
          hat.add(petal);
        }
      } else if (arch.hat === 'floppy') {
        // a chic wide-brim floppy fashion hat — soft rounded crown, bold ribbon
        const col = arch.hatCol || 0xf7f2ea;
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.4, 0.02, 20), T(col));
        brim.position.y = -0.075;
        brim.rotation.x = 0.06;   // a slight jaunty droop
        hat.add(brim);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), T(col));
        crown.position.y = -0.03;
        hat.add(crown);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.148, 0.02, 14), T(col));
        cap.position.y = 0.055;
        hat.add(cap);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.158, 0.055, 16), T(arch.bandCol || 0x2f6fe0));
        band.position.y = -0.05;
        hat.add(band);
      } else { // straw
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 14), T(0xd9b96a));
        brim.position.y = -0.05;
        hat.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.14, 12), T(0xcfae5c));
        hat.add(crown);
        if (arch.bandCol) {
          const band = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.045, 12), T(arch.bandCol));
          band.position.y = -0.03;
          hat.add(band);
        }
      }
      hat.children.forEach((m) => { m.castShadow = true; });
      hat.scale.setScalar(hr);
      scene.add(hat);
      this.syncHat();
    }

    // --- pulsing cheek target: teaches where the points live ---
    const tgt = this.target = new THREE.Group();
    const ringO = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    tgt.add(ringO);
    const ringI = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.08, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    tgt.add(ringI);
    tgt.visible = false;
    scene.add(tgt);

    // snapshot the braced pose so the showcase animation has a home to return to
    this.basePose = {};
    for (const n in this.rag.parts) {
      const b = this.rag.parts[n].body;
      this.basePose[n] = { p: b.position.clone(), q: b.quaternion.clone() };
    }
    this.hatOff = this.hatBody ? this.hatBody.position.vsub(this.rag.parts.head.body.position) : null;
  }

  // "c'mere, champ" — bob, offer the cheek, beckon with one arm
  animateShowcase() {
    const t = this.time;
    const P = this.rag.parts;
    const B = this.basePose;
    const { w, h } = this.arch;
    const bob = Math.sin(t * 2.6) * 0.035;
    for (const n in P) {
      P[n].body.position.copy(B[n].p);
      P[n].body.quaternion.copy(B[n].q);
      P[n].body.position.y += bob;
    }
    // waggle the offered cheek
    P.head.body.position.y += bob * 0.5;
    P.head.body.quaternion.setFromEuler(0.18 + Math.sin(t * 2.6 + 0.6) * 0.16, 0, this.arch.lookUp ? -0.5 : 0.35);
    // beckoning right arm: raised toward the player, forearm curling
    const shX = START_X + 0.02 * w, shY = 1.5 * h + bob, shZ = -0.24 * w;
    P.uaR.body.position.set(shX - 0.13 * w, shY, shZ);
    P.uaR.body.quaternion.setFromEuler(0, 0, 1.45);
    const elX = shX - 0.26 * w, elY = shY - 0.02;
    const th = 1.15 - 0.55 * Math.sin(t * 5.5);
    P.faR.body.position.set(elX - Math.sin(th) * 0.13 * h, elY + Math.cos(th) * 0.13 * h, shZ + 0.02);
    P.faR.body.quaternion.setFromEuler(0, 0, th);
    if (this.hatBody) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
    this.rag.sync();
    this.syncHat();
  }

  syncHat() {
    if (!this.hatBody) return;
    this.hatMesh.position.copy(this.hatBody.position);
    this.hatMesh.quaternion.copy(this.hatBody.quaternion);
  }

  headPos() { return new THREE.Vector3().copy(this.rag.parts.head.body.position); }
  torsoPos() { return new THREE.Vector3().copy(this.rag.parts.torso.body.position); }
  pelvisPos() { return new THREE.Vector3().copy(this.rag.parts.pelvis.body.position); }

  setTargetVisible(on) { this.target.visible = on && !this.launched; }

  // 0 = yellow (wait) · 1 = green (GOOD window) · 2 = bright flash (PERFECT core)
  setTargetHot(level) {
    if (this._hot === level) return;
    this._hot = level;
    const col = level === 2 ? 0xc4ffd2 : level === 1 ? 0x54ff6e : 0xffd23f;
    this.target.children.forEach((m) => m.material.color.setHex(col));
  }

  // swept hand segment vs head then torso spheres
  checkHit(p0, p1, rHand) {
    if (this.launched) return null;
    const hc = this.headPos();
    let pt = segSphere(p0, p1, hc, this.rHead + rHand);
    if (pt) return { part: 'head', point: pt, center: hc };
    const tc = this.torsoPos();
    pt = segSphere(p0, p1, tc, this.rTorso + rHand);
    // the collar shrug zone: a graze above the chest is a hand EN ROUTE to the
    // face — play on, let the arc reach the cheek. Belly and chest still count.
    if (pt && pt.y > tc.y + this.rTorso * 0.5) pt = null;
    if (pt) return { part: 'torso', point: pt, center: tc };
    return null;
  }

  launch(dir, power) {
    if (this.launched) return;
    this.launched = true;
    this.target.visible = false;
    const speed = Math.min(power / this.knockback, 34);
    this.rag.launch(dir, speed);
    this.handprint.visible = true;
    const hb = this.hatBody;
    if (hb) {
      hb.type = CANNON.Body.DYNAMIC;
      hb.updateMassProperties();
      hb.wakeUp();
      hb.velocity.set(dir.x * speed * 0.4, dir.y * speed * 0.4 + 2.4, (Math.random() - 0.5) * 1.5);
      hb.angularVelocity.set(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3);
    }
  }

  update(dt = 0) {
    this.time += dt;
    if (this.launched) {
      this.rag.sync();
      this.syncHat();
      if (this.pelvisPos().x > 57) this.wallSplat = true;
    } else if (this.showcaseMode) {
      this.animateShowcase();
    } else if (this.target.visible) {
      const hc = this.headPos();
      this.target.position.set(hc.x - this.rHead - 0.06, hc.y, hc.z);
      this.target.rotation.y = -Math.PI / 2 + 0.5; // angled toward the camera side
      // perfect window flashes hard and fast; good window pulses; idle breathes
      const spd = this._hot === 2 ? 14 : 6;
      const amp = this._hot === 2 ? 0.3 : 0.12;
      const p = 1 + Math.sin(this.time * spd) * amp;
      this.target.scale.setScalar(p * this.rHead / 0.17);
    }
  }

  distance() {
    return Math.max(0, this.pelvisPos().x - this.startX);
  }

  remove() {
    this.rag.remove();
    if (this.hatBody) {
      this.world.removeBody(this.hatBody);
      this.scene.remove(this.hatMesh);
    }
    this.scene.remove(this.target);
  }
}
