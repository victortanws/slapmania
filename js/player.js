import * as THREE from 'three';
import { createRagdoll } from './ragdoll.js';
import { toonMat } from './scene.js';

// gingham for Fran: cream base, red bands, thin blue cross-threads
let plaidTex = null;
function plaidMat() {
  if (!plaidTex) {
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = '#eee3cb';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(198,62,58,0.8)';
    for (const o of [4, 36]) { g.fillRect(o, 0, 13, 64); g.fillRect(0, o, 64, 13); }
    g.fillStyle = 'rgba(58,76,128,0.45)';
    for (const o of [24, 56]) { g.fillRect(o, 0, 4, 64); g.fillRect(0, o, 64, 4); }
    plaidTex = new THREE.CanvasTexture(cv);
    plaidTex.wrapS = plaidTex.wrapT = THREE.RepeatWrapping;
    plaidTex.repeat.set(2, 2);
  }
  const m = toonMat(0xffffff);
  m.map = plaidTex;
  m.needsUpdate = true;
  return m;
}

// playable slappers — physique is REAL: height sets the strike plane (short
// folks slap upward → high launch arcs), arm length sets reach, power moves mass
export const SLAPPERS = [
  {
    key: 'charlie', name: "SLAPPIN' CHARLIE", desc: 'Local legend. Tremendous hair.',
    descs: ['Local legend. Tremendous hair.', 'Undefeated at the county fair. Allegedly. He counts.', 'The hair enters the ring first. Charlie follows.'],
    skin: 0xe9c19b, shirt: 0x6e2231, pants: 0x4a6fa5,
    hair: 'long', hairCol: 0x231a13, beard: 'full',
    height: 0.93, arm: 0.97, power: 1.0,
  },
  {
    key: 'fran', name: 'FARMHAND FRAN', desc: 'Wound tighter than a hay baler.',
    descs: ['Wound tighter than a hay baler.', 'Braids the pigtails for reach, not for looks.', 'Slaps like the harvest is late.'],
    skin: 0xd9a877, shirt: 0xc94f4f, pants: 0x53617a,
    hair: 'pigtails', hairCol: 0xd9b34a, beard: null, female: true,
    plaid: true, skirt: 'plaid',
    height: 1.0, arm: 1.06, power: 0.92,
  },
  {
    key: 'buck', name: 'UNCLE BUCK', desc: "Forty years of swattin' flies. Ready.",
    descs: ["Forty years of swattin' flies. Ready.", 'The afro is regulation. He checked.', 'Retired. Unretired. For this.'],
    skin: 0xcf9058, shirt: 0xf2ede1, pants: 0x4a5a8a,
    hair: 'afro', hairCol: 0x8a8378, beard: 'stache', deerTee: true,
    height: 0.98, arm: 0.95, power: 1.06,
  },
  {
    key: 'roy', name: 'RODEO ROY', desc: 'Eight seconds? He only needs one.',
    descs: ['Eight seconds? He only needs one.', 'Rode the bull. Slapped the bull. Bull apologized.', 'Heavyweight specialist. Ask the heavyweights.'],
    skin: 0x7a4f33, shirt: 0x27233a, pants: 0x3d3a45,
    hair: 'buzz', hairCol: 0x14100c, beard: 'stache', hat: 'cowboy',
    height: 1.08, arm: 1.08, power: 1.2,
  },
  {
    key: 'victor', name: 'VICTOR SEPUP', desc: 'Built the fair. Slaps in it.',
    descs: ['Built the fair. Slaps in it.', 'Poured the foundation. Now he tests it.', 'Rejected the title "architect." Prefers "just Victor."'],
    skin: 0xe8c39a, shirt: 0x1c1c22, pants: 0x33415c,   // black jacket
    hair: 'short', hairCol: 0x181820, beard: null,
    hat: 'cap', hatCol: 0x141418, capMark: true,        // black cap, ▽ mark
    height: 0.99, arm: 1.0, power: 1.02,
  },
  {
    key: 'mei', name: 'MADAM MEI', desc: 'Her palm reads YOUR future.',
    descs: ['Her palm reads YOUR future.', 'The future is short and involves the pond.', 'Sky-launcher. The stars are the landing zone.'],
    skin: 0xf0cda2, shirt: 0xc9385a, pants: 0x2f3550,
    hair: 'long', hairCol: 0x141418, beard: null, female: true, busty: true,
    earrings: true, skirt: 0x5a2f4f,
    height: 0.9, arm: 0.93, power: 0.88,
  },
  // ---- DLC (locked until purchased) ----
  {
    key: 'dynamite', name: "LIL' DYNAMITE", desc: "Five and three-quarters. All fury.",
    skin: 0xf0c9a0, shirt: 0xd83a3a, pants: 0x35507a,
    hair: 'short', hairCol: 0xc24a1e, beard: null,
    hat: 'cowboy', bigHat: true, suspenders: 0x2a2f45, freckles: true,
    slapArm: 3.4,  // the DYNAMITE: one comically enormous slapping arm
    height: 0.85, arm: 0.94, power: 0.80,
    locked: true, price: 4,
  },
  {
    key: 'bruceslee', name: 'BRUCE SLEE', desc: 'The palm has no form. WATAAA!',
    skin: 0xe0ab7a, shirt: 0xe0ab7a, pants: 0xf5c518,   // shirtless: shirt matches skin
    hair: 'bowl', hairCol: 0x14100e, beard: null, shades: true, bigArms: 1.9, dragon: true,
    height: 1.02, arm: 1.08, power: 1.10,
    locked: true, price: 4,
  },
  {
    key: 'chucknorth', name: 'CHUCK NORTH', desc: 'Counts to infinity. Twice.',
    skin: 0xdca878, shirt: 0x466f9c, pants: 0x2f3b52,
    hair: 'short', hairCol: 0x8a4b2a, beard: 'full', bigArms: true,
    height: 1.06, arm: 1.04, power: 1.42,
    locked: true, price: 4,
  },
  {
    key: 'earl', name: 'BIG EARL McSLAPP', desc: 'Shirtless. Fearless. Enormous.',
    skin: 0xcf9a63, shirt: 0xcf9a63, pants: 0x3a5a3f,   // shirtless: shirt matches skin
    hair: 'buzz', hairCol: 0x3a2a1a, beard: 'stache', overalls: true, bigArms: true,
    height: 1.14, arm: 1.06, power: 1.34,
    locked: true, price: 4,
  },
  {
    key: 'reverend', name: 'THE REVEREND', desc: 'Repent, and be LAUNCHED.',
    skin: 0xcda07a, shirt: 0x18181e, pants: 0x18181e,
    hair: 'short', hairCol: 0x9a9188, beard: 'stache', cassock: 0x14141a, collar: true,
    height: 1.04, arm: 1.06, power: 1.07,
    locked: true, price: 4,
  },
  {
    key: 'carlgustav', name: 'DR. CARL GUSTAV', desc: 'Fifty years of analysis. One cure: the palm.',
    skin: 0xe6c2a0, shirt: 0xf4efe6, pants: 0x3a3f4a,
    hair: 'short', hairCol: 0xdcd6ca, beard: 'stache',
    glasses: true, cassock: 0x5a4632,
    height: 1.0, arm: 1.02, power: 0.98,
    locked: true, price: 4,
  },
  {
    key: 'auntie', name: 'AUNTIE', desc: 'Aiyah! Sit down and get slapped.',
    skin: 0xe8c19a, shirt: 0xf4efe6, pants: 0xe8c19a,   // white dress top, bare (skin) legs
    hair: 'short', hairCol: 0x241a14, female: true, busty: true, bust: 1.6, vneck: true,
    curlers: true, glasses: true, cigarette: true, eyebrows: true, mole: true,
    skirt: 0xf4efe6, flared: true,                       // white flared dress
    height: 0.90, arm: 0.92, power: 1.08,
    locked: true, price: 4,
  },
  {
    key: 'dante', name: 'DANTE THE PILGRIM', desc: 'Halfway through the journey. Fully through with it.',
    skin: 0xe0b088, shirt: 0x8a1f2e, pants: 0x6e1a26,   // the red robe reads through shirt+pants
    hair: 'flat', hairCol: 0x2a1f18,
    cassock: 0x8a1f2e,   // the pilgrim's red robe (the reverend/Carl cassock idiom)
    laurel: 0x2e7d4f,    // traveler's laurel wreath — a thin leaf ring above the hairline
    height: 1.0, arm: 1.02, power: 0.96,   // an everyman — the campaign is about honesty, not tonnage
    locked: true, price: 4,
  },
  {
    key: 'dario', name: 'DR. DARIO SLAPMODEI', desc: 'Wrote the safety memos. Nobody read them. The palm, however, scales.',
    descs: [
      'Wrote the safety memos. Nobody read them. The palm, however, scales.',
      'Chief scientist. Resigned mid-demo. The alignment problem was always the follow-through.',
      'Believes the slap is interpretable, aligned, and lands every time. Two out of three.',
    ],
    skin: 0xe6c0a0, shirt: 0xe0762a, pants: 0x3a3f4a,     // orange crewneck jumper, dark slacks
    hair: 'frizz', hairCol: 0x6b4a2c, beard: null, glasses: true,   // brown curls, clear specs over the eyes
    height: 1.06, arm: 1.03, power: 1.04,                 // the tallest founder in the valley
    locked: true, price: 4,
  },
];

// The slapper. Pre-contact he is NOT physics-engine driven: each joint is a scalar
// angle integrated with key-held torques, springs to rest pose, damping and limits —
// QWOP-style raw torque control. On a balance foul he collapses into a real ragdoll.
export class Player {
  constructor({ scene, world, mat, look = SLAPPERS[0] }) {
    this.scene = scene;
    this.world = world;
    this.mat = mat;
    this.look = look;
    // physique: h sets the strike plane, arm sets reach, str moves tonnage.
    // baseX walks short-armed slappers closer so everyone can find the cheek.
    this.phys = { h: look.height || 1, arm: look.arm || 1, str: look.power || 1 };
    this.baseX = THREE.MathUtils.clamp(0.73 * (1 - this.phys.h * this.phys.arm), -0.15, 0.2);
    this.baseX0 = this.baseX; // per-attempt reset reference
    this.rag = null;
    this.fallen = false;

    // joint = current angle, velocity, spring rest/stiffness/damping, limits
    this.j = {
      spine:    { a: 0.0, v: 0, rest: 0.0, k: 16, c: 2.0, min: -0.7, max: 2.4 },
      shoulder: { a: 0.5, v: 0, rest: 0.5, k: 16, c: 1.6, min: -1.6, max: 2.0 },
      elbow:    { a: 1.2, v: 0, rest: 1.2, k: 12, c: 1.8, min: 0.06, max: 2.3 },
      wrist:    { a: 0.9, v: 0, rest: 0.9, k: 15, c: 2.0, min: -0.3, max: 1.1 },
    };
    this.lean = 0;
    this.leanV = 0;

    this.handVel = new THREE.Vector3();
    this.handSeg = null;
    this._cur = new THREE.Vector3();
    this._prev = new THREE.Vector3();
    this._tracked = false;

    this.buildMeshes();
    // pose() integrates armLift/strikeLift — without these the first pose is
    // NaN and the whole weapon arm vanishes on title/pick/preview screens
    this.armLift = -1.15;
    this._armed = false;
    this.strikeLift = 0;
    this.pose();
  }

  buildMeshes() {
    const L = this.look;
    const T = (c) => toonMat(c);
    // the shirt/dress material: plaid folks get gingham, everyone else a color
    const SM = () => (L.plaid ? plaidMat() : T(L.shirt));
    const M = (mesh) => { mesh.castShadow = true; return mesh; };
    const root = this.root = new THREE.Group();
    root.scale.setScalar(this.phys.h);
    this.scene.add(root);
    const A = this.phys.arm;
    const AR = typeof L.bigArms === 'number' ? L.bigArms : (L.bigArms ? 2.3 : 1);  // arm thickness multiplier
    const ARR = typeof L.slapArm === 'number' ? L.slapArm : AR;  // the WEAPON arm can outgrow the off arm

    for (const s of [-1, 1]) {
      const leg = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.75, 3, 8), T(L.pants)));
      leg.position.set(0.02, 0.48, s * 0.14);
      root.add(leg);
      if (L.trackStripe) {  // the tracksuit's side stripe
        const stripe = M(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.78, 0.03), T(L.trackStripe)));
        stripe.position.set(0.02, 0.48, s * 0.205);
        root.add(stripe);
      }
      const foot = M(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.13), T(0x5a4632)));
      foot.position.set(0.09, 0.05, s * 0.14);
      root.add(foot);
    }
    const pelvis = M(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.28), T(L.pants)));
    pelvis.position.y = 1.0;
    root.add(pelvis);
    if (L.skirt) {
      const skirt = M(new THREE.Mesh(new THREE.CylinderGeometry(0.2, L.flared ? 0.52 : 0.36, L.flared ? 0.48 : 0.42, 14),
        L.skirt === 'plaid' ? plaidMat() : T(L.skirt)));
      skirt.position.y = L.flared ? 0.9 : 0.87;
      root.add(skirt);
    }
    if (L.cassock) {
      // a floor-length clergy robe from waist to boots
      const robe = M(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.98, 14), T(L.cassock)));
      robe.position.y = 0.52;
      root.add(robe);
    }

    const torsoG = this.torsoG = new THREE.Group();
    torsoG.position.y = 1.08;
    root.add(torsoG);
    const torso = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.22, 4, 12), SM()));
    torso.position.y = 0.3;
    torsoG.add(torso);
    if (L.busty) {
      // she has a figure — blouse-colored, with an optional deeper curve
      const br = 0.085 * (L.bust || 1);
      for (const s of [-1, 1]) {
        const bump = M(new THREE.Mesh(new THREE.SphereGeometry(br, 12, 12), SM()));
        bump.position.set(0.135, 0.34, s * (0.05 + br * 0.45));
        torsoG.add(bump);
      }
    }
    if (L.vneck) {
      // a slip of bare skin at the neckline — a little reveal
      const skinV = M(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.13, 0.075), T(L.skin)));
      skinV.position.set(0.185, 0.41, 0);
      torsoG.add(skinV);
    }
    if (L.dragon) {
      // a coiling green dragon, tattooed across the bare chest
      const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96;
      const d = cv.getContext('2d');
      d.strokeStyle = '#1f9d3f'; d.fillStyle = '#1f9d3f'; d.lineWidth = 8; d.lineCap = 'round'; d.lineJoin = 'round';
      d.beginPath(); d.moveTo(18, 74); d.bezierCurveTo(40, 48, 58, 74, 74, 34); d.stroke(); // serpent body
      d.beginPath(); d.arc(74, 30, 10, 0, Math.PI * 2); d.fill();                            // head
      d.lineWidth = 4;
      d.beginPath(); d.moveTo(70, 22); d.lineTo(66, 10); d.moveTo(80, 22); d.lineTo(85, 11); d.stroke(); // horns
      d.beginPath(); d.moveTo(18, 74); d.lineTo(9, 84); d.lineTo(20, 80); d.closePath(); d.fill();        // tail
      d.fillStyle = '#e01e1e'; d.beginPath(); d.arc(77, 27, 3, 0, Math.PI * 2); d.fill();                // eye
      const tex = new THREE.CanvasTexture(cv);
      const dm = toonMat(0xffffff); dm.map = tex; dm.transparent = true;
      const decal = M(new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), dm));
      decal.position.set(0.192, 0.33, 0);
      decal.rotation.y = Math.PI / 2;
      torsoG.add(decal);
    }
    if (L.suit) {
      // crisp white shirtfront and the power tie — it reaches the belt. Always.
      const shirtV = M(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.2, 0.095), T(0xf2ede1)));
      shirtV.position.set(0.172, 0.4, 0);
      torsoG.add(shirtV);
      const knot = M(new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.05, 0.05), T(L.tie)));
      knot.position.set(0.193, 0.46, 0);
      torsoG.add(knot);
      const blade = M(new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.28, 0.056), T(L.tie)));
      blade.position.set(0.192, 0.3, 0);
      torsoG.add(blade);
    }
    if (L.collar) {
      // white clerical band + tab at the throat
      const band = M(new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.055, 14), T(0xf4efe6)));
      band.position.y = 0.55;
      torsoG.add(band);
      const tab = M(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.045), T(0xffffff)));
      tab.position.set(0.19, 0.5, 0);
      torsoG.add(tab);
    }
    if (L.trackStripe) {  // side stripes continue up the torso
      for (const s of [-1, 1]) {
        const st = M(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.045), T(L.trackStripe)));
        st.position.set(0.02, 0.32, s * 0.19);
        torsoG.add(st);
      }
    }
    if (L.suspenders) {
      // two straps up the front — that county-fair kid look
      for (const s of [-1, 1]) {
        const strap = M(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.03), T(L.suspenders)));
        strap.position.set(0.176, 0.34, s * 0.085);
        strap.rotation.z = s * 0.04;
        torsoG.add(strap);
      }
    }
    if (L.deerTee) {
      // Buck's pride: a majestic buck, printed on the chest
      const cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      const dg = cv.getContext('2d');
      dg.fillStyle = '#6e4a2a';
      dg.strokeStyle = '#6e4a2a';
      dg.lineWidth = 3.5;
      dg.beginPath(); dg.ellipse(52, 54, 20, 11, 0, 0, Math.PI * 2); dg.fill();  // body
      dg.beginPath(); dg.ellipse(31, 43, 8, 9, 0.5, 0, Math.PI * 2); dg.fill();  // neck
      dg.beginPath(); dg.arc(25, 32, 7, 0, Math.PI * 2); dg.fill();              // head
      dg.fillRect(14, 29, 10, 5);                                                // muzzle
      for (const lx of [38, 45, 58, 65]) dg.fillRect(lx, 62, 4, 19);             // legs
      dg.beginPath(); dg.arc(71, 49, 4, 0, Math.PI * 2); dg.fill();              // tail
      dg.beginPath();                                                            // antlers
      dg.moveTo(23, 26); dg.lineTo(18, 12); dg.moveTo(21, 19); dg.lineTo(13, 15);
      dg.moveTo(27, 26); dg.lineTo(33, 12); dg.moveTo(29, 19); dg.lineTo(37, 16);
      dg.stroke();
      const tex = new THREE.CanvasTexture(cv);
      const dm = toonMat(0xffffff);
      dm.map = tex;
      dm.transparent = true;
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), dm);
      decal.position.set(0.192, 0.33, 0);
      decal.rotation.y = Math.PI / 2;
      torsoG.add(decal);
    }
    if (L.overalls) {
      const bib = M(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.2), T(L.pants)));
      bib.position.set(0.17, 0.36, 0);
      torsoG.add(bib);
      for (const s of [-1, 1]) {
        const strap = M(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.05), T(L.pants)));
        strap.position.set(0.14, 0.5, s * 0.09);
        strap.rotation.z = 0.25;
        torsoG.add(strap);
      }
    }

    const head = this.headMesh = M(new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), T(L.skin)));
    head.position.y = 0.64;
    torsoG.add(head);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), T(0x111111));
      eye.position.set(0.14, 0.03, s * 0.055);
      head.add(eye);
    }
    this.decorateHead(head, 0.16);

    // left arm (non-slapping): hangs at the side, with a proper t-shirt sleeve
    const armL = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.05 * AR, 0.5, 3, 8), T(L.skin)));
    armL.position.set(0, 0.15, 0.26 + (AR - 1) * 0.05);
    torsoG.add(armL);
    const sleeveL = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.068 * AR, 0.16, 3, 8), SM()));
    sleeveL.position.set(0, 0.33, 0.26);
    torsoG.add(sleeveL);

    // right arm: the weapon. shoulder → upper arm → elbow → forearm → hand.
    // ball spheres at every pivot seal the hinges so bends never look dislocated
    const shoulderG = this.shoulderG = new THREE.Group();
    shoulderG.position.set(0.02, 0.44, -0.25);
    torsoG.add(shoulderG);
    const shoulderBall = M(new THREE.Mesh(new THREE.SphereGeometry(0.08 * ARR, 10, 10), SM()));
    shoulderG.add(shoulderBall);
    const ua = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.055 * ARR, 0.24 * A, 3, 8), T(L.skin)));
    ua.rotation.z = -Math.PI / 2;
    ua.position.set(0.17 * A, 0, 0);
    shoulderG.add(ua);
    const sleeveR = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.072 * ARR, 0.13, 3, 8), SM()));
    sleeveR.rotation.z = -Math.PI / 2;
    sleeveR.position.set(0.08 * A, 0, 0);
    shoulderG.add(sleeveR);

    const elbowG = this.elbowG = new THREE.Group();
    elbowG.position.set(0.34 * A, -0.03, 0);
    shoulderG.add(elbowG);
    const elbowBall = M(new THREE.Mesh(new THREE.SphereGeometry(0.06 * ARR, 10, 10), T(L.skin)));
    elbowG.add(elbowBall);
    const fa = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.05 * ARR, 0.22 * A, 3, 8), T(L.skin)));
    fa.rotation.z = -Math.PI / 2;
    fa.position.set(0.15 * A, 0, 0);
    elbowG.add(fa);

    // red wristband marks THE slapping hand
    const band = M(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.1), T(0xff4757)));
    band.position.set(0.27 * A, 0, 0);
    band.scale.setScalar(Math.max(1, ARR * 0.8)); // stays visible on giant forearms
    elbowG.add(band);

    // a real mitt: palm + four fingers + thumb. The fingers stay CURLED in a
    // fist until P fires the wrist — then they visibly snap open into a palm.
    // Palm tone follows the slapper's own skin, one honest shade brighter.
    const SKIN2 = new THREE.Color(L.skin).lerp(new THREE.Color(0xffffff), 0.14).getHex();
    const handG = this.handG = new THREE.Group();
    handG.position.set(0.31 * A, 0, 0);
    handG.scale.setScalar(1 + (ARR - 1) * 0.3); // a giant arm earns a bigger mitt
    elbowG.add(handG);
    const wristBall = M(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), T(SKIN2)));
    handG.add(wristBall);
    const palm = this.handMesh = M(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.17, 0.05), T(SKIN2)));
    palm.position.set(0.06, 0, 0);
    handG.add(palm);
    this.fingers = [];
    for (let i = 0; i < 4; i++) {
      const fg = new THREE.Group();
      fg.position.set(0.115, 0.062 - i * 0.041, 0);
      const f = M(new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.034, 0.045), T(SKIN2)));
      f.position.set(0.052, 0, 0);
      fg.add(f);
      handG.add(fg);
      this.fingers.push(fg);
    }
    const thumbG = new THREE.Group();
    thumbG.position.set(0.03, -0.09, 0);
    thumbG.rotation.z = -0.55;
    const th = M(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.034, 0.042), T(SKIN2)));
    th.position.set(0.04, 0, 0);
    thumbG.add(th);
    handG.add(thumbG);
  }

  // hair, beard and headgear per the chosen look, sized to any head radius
  decorateHead(head, r) {
    const L = this.look;
    const g = new THREE.Group();
    const h = () => toonMat(L.hairCol);
    if (L.hair === 'long') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 14), h());
      cap.scale.set(1, 0.85, 1.08);
      cap.position.set(-0.025, 0.03, 0);
      g.add(cap);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.22), h());
      back.position.set(-0.13, -0.14, 0);
      g.add(back);
      for (const s of [-1, 1]) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.055), h());
        side.position.set(0.02, -0.13, s * 0.155);
        side.rotation.x = -s * 0.08;
        g.add(side);
      }
    } else if (L.hair === 'pony') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.172, 14, 14), h());
      cap.scale.set(1, 0.78, 1.05);
      cap.position.set(-0.02, 0.04, 0);
      g.add(cap);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), h());
      tail.position.set(-0.17, -0.08, 0);
      tail.rotation.z = 0.3;
      g.add(tail);
    } else if (L.hair === 'pigtails') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.172, 14, 14), h());
      cap.scale.set(1, 0.78, 1.05);
      cap.position.set(-0.02, 0.04, 0);
      g.add(cap);
      for (const s of [-1, 1]) {
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), h());
        tuft.position.set(-0.055, 0.01, s * 0.16);
        g.add(tuft);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), h());
        tail.position.set(-0.08, -0.1, s * 0.185);
        tail.rotation.x = s * 0.3;
        tail.rotation.z = 0.12;
        g.add(tail);
        const bow = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.05), toonMat(0xd8404f));
        bow.position.set(-0.05, 0.03, s * 0.195);
        g.add(bow);
      }
    } else if (L.hair === 'swoop') {
      // the architectural marvel: swept forward, up, and back into legend
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.176, 14, 14), h());
      cap.scale.set(1.05, 0.82, 1.08);
      cap.position.set(-0.035, 0.05, 0);
      g.add(cap);
      const swoop = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.055, 0.19), h());
      swoop.position.set(0.1, 0.12, 0);
      swoop.rotation.z = 0.3;
      g.add(swoop);
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.17), h());
      crest.position.set(0.165, 0.075, 0);
      crest.rotation.z = 0.9;
      g.add(crest);
      for (const s of [-1, 1]) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.085, 0.032), h());
        side.position.set(0.0, -0.015, s * 0.16);
        g.add(side);
      }
    } else if (L.hair === 'afro') {
      // a glorious silver dome, face left respectfully clear
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 14), h());
      puff.scale.set(1, 0.95, 1.02);
      puff.position.set(-0.055, 0.105, 0);
      g.add(puff);
      for (const s of [-1, 1]) {
        const burn = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.09, 0.03), h());
        burn.position.set(0.08, -0.04, s * 0.157);
        g.add(burn);
      }
    } else if (L.hair === 'short') {
      // a proper cut: full crown, crisp fringe, tapered sides
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.172, 14, 14), h());
      cap.scale.set(1, 0.76, 1.04);
      cap.position.set(-0.028, 0.045, 0);
      g.add(cap);
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.19), h());
      fringe.position.set(0.135, 0.085, 0);
      fringe.rotation.z = -0.35;
      g.add(fringe);
      for (const s of [-1, 1]) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.035), h());
        side.position.set(0.0, -0.015, s * 0.157);
        g.add(side);
      }
    } else if (L.hair === 'bowl') {
      // the iconic bowl cut: a helmet on the crown + a brow-line fringe that clears the eyes
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.176, 14, 14), h());
      cap.scale.set(1.0, 0.84, 1.08);
      cap.position.set(-0.03, 0.05, 0);
      g.add(cap);
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.31), h());
      fringe.position.set(0.132, 0.082, 0);
      g.add(fringe);
      for (const s of [-1, 1]) {   // fuller sides for the bowl shape
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 0.04), h());
        side.position.set(0.0, -0.02, s * 0.16);
        g.add(side);
      }
    } else { // buzz
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.168, 14, 14), h());
      cap.scale.set(1, 0.62, 1);
      cap.position.set(-0.02, 0.07, 0);
      g.add(cap);
    }
    if (L.beard) {
      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.115), h());
      stache.position.set(0.155, -0.045, 0);
      g.add(stache);
      if (L.beard === 'full') {
        const chin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.1), h());
        chin.position.set(0.135, -0.115, 0);
        g.add(chin);
      }
    }
    if (L.hat === 'cap') {
      // a modern ball cap: low dome, front bill, optional ▽ mark (flat edge up)
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.175, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toonMat(L.hatCol || 0x16161c));
      dome.scale.set(1, 0.7, 1.05);
      dome.position.set(-0.015, 0.055, 0);
      g.add(dome);
      const bill = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.155), toonMat(L.hatCol || 0x16161c));
      bill.position.set(0.165, 0.07, 0);
      g.add(bill);
      if (L.capMark) {
        const tri = new THREE.Mesh(new THREE.CircleGeometry(0.045, 3), toonMat(0xf2ede1));
        tri.rotation.y = Math.PI / 2;      // face forward
        tri.rotation.z = -Math.PI / 2;     // one vertex down — flat edge up
        tri.position.set(0.158, 0.115, 0);
        g.add(tri);
      }
    } else if (L.hat === 'straw') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.025, 14), toonMat(0xd9b96a));
      brim.position.set(-0.01, 0.1, 0);
      g.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.13, 12), toonMat(0xcfae5c));
      crown.position.set(-0.01, 0.17, 0);
      g.add(crown);
    } else if (L.hat === 'cowboy') {
      const hg = new THREE.Group();
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.028, 14), toonMat(0x4a3423));
      brim.position.set(-0.01, 0.1, 0);
      hg.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.17, 12), toonMat(0x4a3423));
      crown.position.set(-0.01, 0.19, 0);
      hg.add(crown);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.045, 12), toonMat(0xc9a227));
      band.position.set(-0.01, 0.125, 0);
      hg.add(band);
      if (L.bigHat) { hg.scale.setScalar(1.38); hg.position.y -= 0.07; }  // oversized, pulled down over a kid's head
      g.add(hg);
    }
    if (L.freckles) {
      for (const sgn of [-1, 1]) for (const dy of [0, 0.028]) {
        const fr = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), toonMat(0xb06a3a));
        fr.position.set(0.146, -0.005 + dy, sgn * 0.075);
        g.add(fr);
      }
    }
    if (L.curlers) {
      // a full head of rainbow rollers + tight curls — the classic auntie perm
      const cols = [0xff4757, 0xffd23f, 0x54a0ff, 0xff6b9d, 0x5fd15f, 0xb06bff];
      const spots = [
        [-0.05, 0.14, 0.07], [0.04, 0.15, 0.1], [-0.09, 0.1, 0.14], [0.06, 0.12, -0.09],
        [-0.04, 0.14, -0.13], [-0.02, 0.16, 0.0], [0.02, 0.11, -0.15], [0.08, 0.13, 0.05],
        [-0.11, 0.09, -0.05], [0.0, 0.12, 0.16], [-0.12, 0.1, 0.02], [0.05, 0.16, -0.04],
        [-0.06, 0.1, 0.16], [0.09, 0.1, -0.12], [-0.02, 0.13, -0.16], [0.07, 0.14, 0.12],
      ];
      spots.forEach((p, i) => {
        const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.064, 8), toonMat(cols[i % cols.length]));
        roll.position.set(p[0], p[1], p[2]);
        roll.rotation.x = Math.PI / 2;
        roll.rotation.z = (i % 3) * 0.5;
        g.add(roll);
      });
      // tight curl puffs around the sides for permed volume
      for (const [x, y, z] of [[-0.13, 0.0, 0.12], [-0.13, 0.0, -0.12], [-0.14, -0.03, 0.02], [-0.1, -0.05, 0.13], [-0.1, -0.05, -0.13]]) {
        const curl = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), h());
        curl.position.set(x, y, z);
        g.add(curl);
      }
    }
    if (L.laurel) {
      // the poet's laurel: a thin leaf ring resting above the hairline
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 6, 16), toonMat(L.laurel));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.09;
      this.headMesh.add(ring);
      for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), toonMat(L.laurel));
        const a = (i / 6) * Math.PI * 2;
        leaf.position.set(Math.cos(a) * 0.155, 0.1, Math.sin(a) * 0.155);
        this.headMesh.add(leaf);
      }
    }
    if (L.glasses) {
      // spectacle RIMS, not filled lenses — the eye shows through the ring so
      // the glasses reveal the eyes instead of reading as opaque shades
      const rimCol = L.glassCol || 0x15151a;
      for (const sgn of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 16), toonMat(rimCol));
        rim.rotation.y = Math.PI / 2;               // face the ring forward (+x)
        rim.position.set(0.153, 0.03, sgn * 0.056);
        g.add(rim);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, 0.036), toonMat(rimCol));
      bridge.position.set(0.153, 0.035, 0);
      g.add(bridge);
    }
    if (L.eyebrows) {
      for (const sgn of [-1, 1]) {
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.013, 0.055), toonMat(L.hairCol || 0x2a1a12));
        brow.position.set(0.151, 0.078, sgn * 0.055);
        brow.rotation.x = sgn * 0.25;   // angled in — gives her that expression
        g.add(brow);
      }
    }
    if (L.mole) {
      const mole = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), toonMat(0x140f0c));
      mole.position.set(0.156, -0.025, 0.062);   // a small dark beauty mark on the cheek
      g.add(mole);
    }
    if (L.shades) {
      // cool dark wraparound sunglasses over the eyes
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.018, 0.2), toonMat(0x141418));
      bar.position.set(0.146, 0.052, 0);
      g.add(bar);
      for (const sgn of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.058, 0.082), toonMat(0x0a0a10));
        lens.position.set(0.151, 0.028, sgn * 0.052);
        g.add(lens);
      }
    }
    if (L.cigarette) {
      const cig = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), toonMat(0xf5f0e6));
      cig.position.set(0.19, -0.052, 0.04);
      cig.rotation.z = Math.PI / 2;
      cig.rotation.y = 0.35;
      g.add(cig);
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), toonMat(0xff5522));
      ember.position.set(0.237, -0.052, 0.057);
      g.add(ember);
    }
    if (L.female) {
      const lips = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.03, 0.075), toonMat(0xc4506a));
      lips.position.set(0.152, -0.055, 0);
      g.add(lips);
      for (const sgn of [-1, 1]) {
        const lash = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.014, 0.052), toonMat(0x161616));
        lash.position.set(0.138, 0.068, sgn * 0.055);
        g.add(lash);
      }
    }
    if (L.earrings) {
      for (const sgn of [-1, 1]) {
        const ring = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), toonMat(0xffd23f));
        ring.position.set(0.02, -0.045, sgn * 0.162);
        g.add(ring);
      }
    }
    g.children.forEach((m) => { m.castShadow = true; });
    g.scale.setScalar(r / 0.16);
    head.add(g);
  }

  reset() {
    if (this.rag) { this.rag.remove(); this.rag = null; }
    this.fallen = false;
    // idle stance: arm hanging loose at the side — it only cocks up when coiling
    const rests = { spine: 0, shoulder: 0.5, elbow: 0.35, wrist: 0.9 };
    for (const n in this.j) { this.j[n].a = rests[n]; this.j[n].v = 0; }
    this.armLift = -1.15;
    this._armed = false;
    this.strikeLift = 0;
    this.ascendT = null;
    this.root.position.y = 0;
    this.root.rotation.y = 0;
    this.setHandGlow(false);
    this.lean = 0;
    this.leanV = 0;
    this._tracked = false;
    this.handVel.set(0, 0, 0);
    this.handSeg = null;
    // kinetic chain state: joints stay locked until their key fires
    this.sWasDown = false;
    this.sReleased = false;
    this.releaseCoil = 0;
    this.lFired = false;
    this.aUnlocked = false;
    this.pUnlocked = false;
    this.lungeT = null;
    this.lungeAmt = 0;
    this.baseX = this.baseX0; // fresh attempt, physique stance — setStanceDepth re-steps at the whistle
    this.root.position.x = this.baseX;
    this.root.visible = true;
    this.pose();
  }

  get ascending() { return this.ascendT !== null; }

  // the emperor's hand shines with golden light
  setHandGlow(on) {
    if (on && !this.glowSprite) {
      const cv = document.createElement('canvas');
      cv.width = 128; cv.height = 128;
      const g = cv.getContext('2d');
      const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255,240,180,1)');
      grad.addColorStop(0.4, 'rgba(255,215,100,0.55)');
      grad.addColorStop(1, 'rgba(255,200,60,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
      this.glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv), transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      this.glowSprite.scale.setScalar(0.6);
      this.glowSprite.position.set(0.08, 0, 0);
      this.handG.add(this.glowSprite);
    }
    if (this.glowSprite) this.glowSprite.visible = !!on;
  }

  // SLAP EMPEROR: he rises, slowly turning, into the light
  startAscension() {
    if (this.ascendT === null) this.ascendT = 0;
  }

  // real 3D: aim the swing plane at THIS victim's cheek — slap upward at the
  // tall, downward at the short. Shoulder and reach follow the slapper's OWN
  // physique, so a short slapper golfs tall victims skyward at a steep arc.
  setStrikeTarget(headY) {
    const shoulderY = 1.52 * this.phys.h;
    const reach = 0.72 * this.phys.h * this.phys.arm;
    const s = THREE.MathUtils.clamp((headY - shoulderY) / reach, -1, 1);
    // upper clamp 0.9 (was 0.5): lets the shortest slappers genuinely reach the
    // tallest cheeks (Dynamite vs Hoss needs ~0.83). Launch arc is unaffected —
    // dir.y already saturates at lift 0.33 — so this is reach, not balance.
    this.strikeLift = THREE.MathUtils.clamp(Math.asin(s), -0.35, 0.9);
  }


  // a fresh S press after a spent swing re-holsters everything: arm back to
  // the cocked fist, locks re-engaged, stance reset — an independent new slap
  rearm() {
    this.sReleased = false;
    this.releaseCoil = 0;
    this.lFired = false;
    this.aUnlocked = false;
    this.pUnlocked = false;
    this.lungeT = null;
    this.lungeAmt = 0;
    this.root.position.x = this.baseX;
    const rests = { shoulder: 0.5, elbow: 1.2, wrist: 0.9 };
    for (const n in rests) { this.j[n].a = rests[n]; this.j[n].v = 0; }
  }

  // the hips made visible: a forward step-lunge that carries the whole swing
  startLunge(amt) {
    if (this.lungeT !== null) return;
    this.lungeT = 0;
    this.lungeAmt = amt;
    this.j.spine.v -= 1.5;   // real kick into the whip
    this.leanV += 0.25;      // weight shifts forward — modest price
  }

  get strength() { return this.phys.str; }
  get handSpeed() { return this.handVel.length(); }
  get handPos() { return this._cur; }
  get elbowBend() { return this.j.elbow.a; }
  get elbowVel() { return this.j.elbow.v; }
  get wristOpen() { return THREE.MathUtils.clamp((0.9 - this.j.wrist.a) / 1.1, 0, 1); }
  get spineAngle() { return this.j.spine.a; }
  get spineVel() { return this.j.spine.v; }
  get coilFrac() { return Math.min(1, Math.max(0, this.j.spine.a) / 2.35); }

  update(dt, keys) {
    if (this.fallen) { if (this.rag) this.rag.sync(); return; }
    if (dt <= 0) return;

    // --- kinetic chain: each joint stays rigid until its key fires ---
    if (!this.sReleased && this.sWasDown && !keys.s) {
      this.sReleased = true;
      this.releaseCoil = Math.max(0, this.j.spine.a);
    }
    this.sWasDown = keys.s;
    if (!this.lFired && keys.l) this.lFired = true;
    if (!this.aUnlocked && keys.a) {
      this.aUnlocked = true;
      // the whip: torso speed at the unlock moment slings into the shoulder
      this.j.shoulder.v += Math.min(0, this.j.spine.v) * 0.4;
    }
    if (!this.pUnlocked && keys.p) this.pUnlocked = true;

    const t = { spine: 0, shoulder: 0, elbow: 0, wrist: 0 };
    if (keys.s) t.spine += 75;              // coil the torso back (beats the spring to full coil in ~1s)
    // hip drive is only worth anything if you actually coiled the spine first
    if (keys.l) t.spine -= 12 + 16 * Math.max(0, this.j.spine.a);
    if (this.aUnlocked && keys.a) t.shoulder -= 34;
    if (this.pUnlocked && keys.p) { t.elbow -= 210; t.wrist -= 170; }

    // after releasing S the body HOLDS the coiled pose until L fires the hips —
    // the whip waits for the player instead of evaporating in 300ms. The coil
    // slowly leaks while you dawdle, so there's still a reason to be crisp.
    const spineGated = this.sReleased && !this.lFired && !keys.s;
    this._armed = keys.s || this.sReleased || this.aUnlocked;

    for (const n in this.j) {
      const J = this.j[n];
      // locked joints ride rigidly on the torso — no free spring energy
      if (n === 'spine' && spineGated) { J.v = 0; J.a = Math.max(0, J.a - 0.55 * dt); continue; }
      if (n === 'shoulder' && !this.aUnlocked) { J.v = 0; continue; }
      if (n === 'elbow' && !this.pUnlocked) {
        // folded tight when armed, gently bent when just standing around
        J.v = 0;
        J.a += ((this._armed ? 1.2 : 0.35) - J.a) * Math.min(1, 8 * dt);
        continue;
      }
      if (n === 'wrist' && !this.pUnlocked) { J.v = 0; continue; }
      const tq = t[n] - J.k * (J.a - J.rest) - J.c * J.v;
      J.v += tq * dt;
      J.a += J.v * dt;
      if (J.a < J.min) { J.a = J.min; if (J.v < 0) J.v *= -0.25; }
      if (J.a > J.max) { J.a = J.max; if (J.v > 0) J.v *= -0.25; }
    }

    // balance: a deep coil is genuinely risky to sit on, and lunging the hips
    // while still coiled is how you slap yourself off your own feet
    const coil = Math.max(0, this.j.spine.a) / 2.35;
    const earlyL = keys.l && this.j.spine.a > 1.0;
    // 1.4 (was 1.5): at full coil the old drive (1.85) beat max righting (1.84)
    // by a hair — holding S while reading the coach line was an automatic
    // backward foul at ~3s. Full coil is still tense, no longer auto-lethal.
    const drive = (keys.s ? -(0.35 + 1.4 * coil * coil) : 0)
      + (keys.l ? (earlyL ? 3.6 : 1.0) : 0)
      + (keys.a ? 0.4 : 0);
    this.leanV += drive * dt;
    this.leanV += this.lean * 2.2 * dt;
    // righting gives up exactly where the HUD red zone begins (|lean| ≈ 0.71)
    const upright = Math.max(0, 1 - Math.abs(this.lean) / 1.05);
    this.leanV += (-this.lean * 7.0 * upright - this.leanV * (1.5 + 2 * upright)) * dt;
    this.lean += this.leanV * dt;

    // lunge: eased forward step, physically extends reach and hand speed
    if (this.lungeT !== null) {
      this.lungeT += dt;
      const k = Math.min(1, this.lungeT / 0.22);
      this.root.position.x = this.baseX + this.lungeAmt * (1 - (1 - k) * (1 - k));
    }

    // ascension: accelerating rise into heaven, gently rotating
    if (this.ascendT !== null) {
      this.ascendT += dt;
      this.root.position.y = Math.min(0.35 * this.ascendT * this.ascendT, 14);
      this.root.rotation.y += dt * 0.7;
      if (this.glowSprite && this.glowSprite.visible) {
        this.glowSprite.scale.setScalar(0.6 + Math.sin(this.ascendT * 8) * 0.15);
      }
    }

    this.pose();

    this.root.updateMatrixWorld(true);
    this.handMesh.getWorldPosition(this._cur);
    if (this._tracked) {
      this.handVel.copy(this._cur).sub(this._prev).divideScalar(dt);
      this.handSeg = { p0: this._prev.clone(), p1: this._cur.clone() };
    }
    this._prev.copy(this._cur);
    this._tracked = true;

    if (Math.abs(this.lean) > 1.05) this.collapse(Math.sign(this.lean));
  }

  pose() {
    this.torsoG.rotation.y = this.j.spine.a;
    this.headMesh.rotation.y = -this.j.spine.a * 0.6; // keeps his eyes on the target
    this.shoulderG.rotation.y = this.j.shoulder.a + 0.35;
    // arm hangs at the side until you coil — then it rises into the cock, and
    // when A fires it settles onto the strike plane aimed at the victim's cheek
    const targetLift = this.aUnlocked ? this.strikeLift : (this._armed ? 0.42 : -1.15);
    this.armLift += (targetLift - this.armLift) * 0.18;
    this.shoulderG.rotation.z = this.armLift;
    this.elbowG.rotation.y = this.j.elbow.a;
    this.handG.rotation.y = -(0.9 - this.j.wrist.a) * 0.4;
    // fist → open palm, driven by the wrist joint (P key)
    const curl = 1.45 * (1 - this.wristOpen);
    if (this.fingers) this.fingers.forEach((fg) => { fg.rotation.y = curl; });
    this.root.rotation.z = -this.lean * 0.5;
  }

  collapse(dir) {
    this.fallen = true;
    this.root.visible = false;
    // the ragdoll spawns WHERE HE STANDS, already leaning the way he was
    // tipping — the swap used to teleport a neutral mannequin to x:0 in one
    // frame, which read as "Charlie disappeared" mid-swing
    this.rag = createRagdoll({
      world: this.world, scene: this.scene, mat: this.mat,
      x: this.root.position.x, z: this.root.position.z,
      skin: this.look.skin, shirt: this.look.shirt, pants: this.look.pants,
      hScale: this.phys.h, massScale: this.phys.str,
    });
    this.decorateHead(this.rag.parts.head.mesh, 0.17);
    if (this.look.skirt) {
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.4, 12),
        this.look.skirt === 'plaid' ? plaidMat() : toonMat(this.look.skirt));
      skirt.position.y = -0.12;
      skirt.castShadow = true;
      this.rag.parts.pelvis.mesh.add(skirt);
    }
    if (this.look.busty) {
      for (const s of [-1, 1]) {
        const bump = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), toonMat(this.look.shirt));
        bump.position.set(0.2, 0.08, s * 0.1);
        bump.castShadow = true;
        this.rag.parts.torso.mesh.add(bump);
      }
    }
    if (this.look.suit) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.26, 0.056), toonMat(this.look.tie));
      blade.position.set(0.2, 0.02, 0);
      blade.castShadow = true;
      this.rag.parts.torso.mesh.add(blade);
    }
    this.rag.topple(dir || 1);
  }

  remove() {
    if (this.rag) { this.rag.remove(); this.rag = null; }
    this.scene.remove(this.root);
  }
}
