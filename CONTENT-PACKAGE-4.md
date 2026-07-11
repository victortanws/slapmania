# Content package 4: Slap Vegas, The Cruise, The Tar Pits (2026-07-11)

I now have a complete picture of every convention. Here are the three worlds, fully paste-ready, ordered by build priority.

---

# 1. SLAP VEGAS (`vegas`, DLC) — the Double-or-Nothing meter

The star mechanic. A landed slap can be **pushed**: a chip-spinner sweeps, the DOUBLE arc's width is set by your chain% (technique buys you a safer gamble), and one press of **P** stops it — DOUBLE the points or BUST to zero. **ENTER** or a 3.5 s timeout always **banks** safely, so nothing is ever forced into a loss (principle #10 satisfied trivially: banking is always winnable; the double is pure upside earned by a clean chain).

### 1a. `js/scene.js` — the kit (paste after the LAVA block, before its `mkBarricade`)

```javascript
  // --- 🎰 SLAP VEGAS ---
  // A neon casino floor at midnight. A glowing Strip skyline belt, a marquee arch
  // over the lane, a chip/dice/card motif on the ground, the pond reborn as a lit
  // fountain, spotlights raking the sky. hideFair — this is a PLACE, not a tinted
  // farm (principle #1): you know you're on the Strip with the HUD off.
  const vegasG = new THREE.Group();
  const vegasSpots = [], vegasNeon = [], vegasFountain = [];   // animation handles
  {
    const chrome = toonMat(0x2a2a33), carpet = toonMat(0x3a1230);
    // ---- the Strip skyline belt: neon-outlined towers, a pyramid, a slot facade.
    // Each tower is a dark toon prism wearing an unlit neon edge frame so it reads
    // at night from across the lane. ----
    vegasG.add(mkBelt((g, x, z, i) => {
      const kind = i % 7;
      const hue = [0xff2f8e, 0x2fd4ff, 0xffd23f, 0x8a2fff, 0x2fff9a][i % 5];
      if (kind === 3) {                         // the pyramid (Luxor parody)
        const pyr = new THREE.Mesh(new THREE.ConeGeometry(4.5, 8, 4), toonMat(0x1a1a22));
        pyr.rotation.y = Math.PI / 4; pyr.position.set(x, 4, z); g.add(pyr);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.5, 34, 7), glowMat(0xfff2c0));
        beam.material.transparent = true; beam.material.opacity = 0.5;
        beam.position.set(x, 20, z); g.add(beam);
        vegasNeon.push({ m: beam.material, base: 0.5, sp: 1.7, ph: i });
        return;
      }
      const h = 8 + (i % 5) * 2.4;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(3.4, h, 3.4), toonMat(0x14141c));
      tower.position.set(x, h / 2, z); g.add(tower);
      // neon edge outline: four vertical strips + a crown band
      for (const sx of [-1.7, 1.7]) for (const sz of [-1.7, 1.7]) {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.14, h, 0.14), glowMat(hue));
        edge.position.set(x + sx, h / 2, z + sz); g.add(edge);
      }
      const crown = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.4, 3.7), glowMat(hue));
      crown.position.set(x, h - 0.3, z); g.add(crown);
      vegasNeon.push({ m: crown.material, base: 1, sp: 2 + (i % 3), ph: i, hue });
      // a giant slot-machine facade every 7th spot
      if (kind === 5) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 0.6), toonMat(0x8a1030));
        slot.position.set(x, 2.5 + h / 2, z + 1.8); g.add(slot);
        for (let r = 0; r < 3; r++) {
          const reel = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), glowMat(0xffe08a));
          reel.position.set(x - 1.1 + r * 1.1, 2.6 + h / 2, z + 2.15); g.add(reel);
        }
      }
    }));
    vegasG.children[0].visible = true;

    // ---- THE MARQUEE ARCH over the lane at x=10 (posts outside the rails) ----
    const arch = new THREE.Group();
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 8.2, 10), chrome);
      post.position.set(0, 4.1, s * 3.6); arch.add(post);
    }
    const span = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 8.4), toonMat(0x14141c));
    span.position.y = 8; arch.add(span);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.3),
      makeSignMat ? makeSignMat('SLAP VEGAS — LOOSEST CHEEKS IN TOWN', 0x14141c, 0xffd23f)
                  : new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    board.position.set(0.7, 8, 0); board.rotation.y = -Math.PI / 2; arch.add(board);
    // a running rope of bulbs around the marquee
    for (let i = 0; i < 26; i++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), glowMat(0xfff2c0));
      const t = i / 26 * Math.PI * 2;
      bulb.position.set(0.62, 8 + Math.sin(t) * 0.9, Math.cos(t) * 4.1); arch.add(bulb);
      vegasNeon.push({ m: bulb.material, base: 1, sp: 5, ph: i * 0.5 });
    }
    arch.position.x = 10; vegasG.add(arch);

    // ---- ground motif: oversized playing cards, dice, and chip stacks strewn
    // along the lane shoulders (flat, no colliders — pure floor decor) ----
    const chipCols = [0xd83a3a, 0x2f7ad8, 0x2fae5a, 0x14141c];
    for (let i = 0; i < 22; i++) {
      const side = i % 2 ? 1 : -1, gx = 6 + i * 4.6;
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 18), toonMat(chipCols[i % 4]));
      stack.position.set(gx, 0.17, side * (5 + (i % 3))); vegasG.add(stack);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 18), glowMat(0xf4f0e2));
      rim.rotation.x = Math.PI / 2; rim.position.copy(stack.position); vegasG.add(rim);
    }
    for (const [dx, dz] of [[18, -6.5], [34, 6.2], [70, -6]]) {   // giant dice
      const die = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), toonMat(0xf4f0e2));
      die.position.set(dx, 0.65, dz); die.rotation.y = dx; vegasG.add(die);
      for (const [px, py] of [[0.4, 0.4], [-0.4, -0.4], [0, 0]]) {
        const pip = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), toonMat(0x14141c));
        pip.position.set(dx + px, py + 0.65, dz + 0.66); vegasG.add(pip);
      }
    }

    // ---- THE FOUNTAIN (the pond, at 40,24, reborn) — a lit tiered basin whose
    // jets pulse in updateAmbient. Bellagio parody. ----
    const fnt = new THREE.Group();
    for (const [r, y] of [[3.4, 0.3], [2.2, 0.9], [1.2, 1.5]]) {
      const tier = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.3, 0.4, 22), chrome);
      tier.position.y = y; fnt.add(tier);
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.15, r - 0.15, 0.12, 22), glowMat(0x2fd4ff));
      glow.position.y = y + 0.24; fnt.add(glow);
      vegasNeon.push({ m: glow.material, base: 1, sp: 1.4, ph: r });
    }
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 3, 6), glowMat(0xbfe8ff));
      jet.material.transparent = true; jet.material.opacity = 0.7;
      jet.position.set(Math.cos(a) * 1.4, 2.6, Math.sin(a) * 1.4);
      fnt.add(jet); vegasFountain.push({ m: jet, ph: i * 0.7, a });
    }
    fnt.position.set(40, 0, 24); vegasG.add(fnt);

    // ---- sweeping spotlights: two tall pods raking colored cones across the sky ----
    for (const [x, z, hue] of [[24, -14, 0xff2f8e], [58, 16, 0x2fd4ff]]) {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 8), chrome);
      pod.position.set(x, 0.8, z); vegasG.add(pod);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 30, 10, 1, true), glowMat(hue));
      cone.material.transparent = true; cone.material.opacity = 0.16; cone.material.side = THREE.DoubleSide;
      cone.position.set(x, 15, z); vegasG.add(cone);
      vegasNeon.push({ m: cone.material, base: 0.16, sp: 0.9, ph: x });
      cone.userData.sweep = { x, z, ph: x };
      vegasSpots.push(cone);
    }

    // opaque toon casts shadows; the glow (neon/lights) does not
    vegasG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    vegasG.visible = false;
    scene.add(vegasG);
  }
  const chipBarricade = mkBarricade((arr, bx) => {
    // a wall of stacked casino chips
    const chipCols = [0xd83a3a, 0x2f7ad8, 0x2fae5a, 0x141018, 0xf4f0e2];
    for (const [by, count] of [[0.45, 5], [1.35, 4], [2.2, 3]]) {
      for (let i = 0; i < count; i++) {
        const g = new THREE.Group();
        const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.7, 20), toonMat(chipCols[(i + count) % 5]));
        chip.rotation.x = Math.PI / 2; g.add(chip);
        const edge = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 6, 20), glowMat(0xf4f0e2));
        g.add(edge);
        g.position.set(bx, by, -1.8 + i * (3.6 / Math.max(1, count - 1)));
        arr.push(g);
      }
    }
  });
```

> **Note on `makeSignMat`:** the marquee text uses the same signed-texture path the county-line sign uses (`makeTextTexture`, maxWidth 500 — see CLAUDE.md). If the helper in scope has a different name, swap the `board` material for `new THREE.MeshBasicMaterial({ map: makeTextTexture('SLAP VEGAS — LOOSEST CHEEKS IN TOWN') })`. The fallback branch keeps it paste-safe.

### 1b. `js/scene.js` — updateAmbient block (paste inside `updateAmbient`, beside the `lavaG.visible` block)

```javascript
    if (vegasG.visible) {
      // neon shimmer: each strip pulses on its own fixed phase (deterministic)
      for (const n of vegasNeon) {
        const k = 0.55 + Math.abs(Math.sin(time * n.sp + n.ph)) * 0.45;
        n.m.opacity = (n.m.transparent ? n.base * k : 1);
        if (n.m.transparent) n.m.opacity = n.base * k;
      }
      // sweeping spotlight cones rake the sky on a slow, offset yaw
      for (const c of vegasSpots) {
        const s = c.userData.sweep;
        c.rotation.z = Math.sin(time * 0.4 + s.ph) * 0.5;
        c.rotation.x = Math.PI + Math.sin(time * 0.27 + s.ph) * 0.3;
      }
      // fountain jets breathe up and down
      for (const j of vegasFountain) {
        const h = 1.6 + Math.abs(Math.sin(time * 2 + j.ph)) * 2.4;
        j.m.scale.y = h / 3;
        j.m.position.y = 1.5 + h / 2;
      }
    }
```

### 1c. `js/scene.js` — theme + registration

```javascript
  // add to WORLD_THEMES:
  vegas: { fog: [0x0e0a16, 40, 150], skyTint: 0x0a0710, hemi: [0x5a4a7a, 0x14101c, 0.55], sun: [0xff8ad0, 0.7], fill: 0.16, cloud: 0x1a1226, maps: false, grass: 0x2a1030, lane: 0x140a1c, night: true, sunFace: false,
    group: 'vegas', biome: 'vegas', crowd: 'vegas', pond: 0x2fd4ff, sunTint: [0xff8ad0, 0.5],
    hideFarm: true, hideBarn: true, hideFair: true, hideCloths: true, hideFences: true, barricade: 'chips' },

  // add to WORLD_GROUPS:  vegas: vegasG,
  // add to BELT_WORLDS:   'vegas'
  // add to BARRICADES:    chips: chipBarricade,
  // add to CROWD_PALETTES: showgirl neon + tux blacks
  vegas: [0xff2f8e, 0x2fd4ff, 0xffd23f, 0x141018, 0x8a2fff, 0xf4f0e2],
```

---

# 2. THE CRUISE (`cruise`, DLC) — the Rocking Deck

The whole ship **lists** on a slow, readable swell. The mechanic moves the **target**, not the camera-heavy world: the volunteer's cheek drifts sideways (`z`) on a deterministic sine (period 5 s, amp 0.45 m), so you time your slap for the level moment (twice per period) for a flush centered hit — or ride the list to fling them **overboard** for a distance bonus. The strike plane's *height* also dips a hair with the list (re-targeted each frame) so tall swells read in the swing. Because the level window recurs every 2.5 s and the head never leaves reach, it's always winnable; the overboard bonus and flush-cq are the earned upside.

**Design decision (stated per the brief):** the tilt drives the **opponent's lateral offset** (the honest, live-body path that the swept hit-test already respects — same family as `sway`, rotated to `z`), plus a gentle **camera roll** for feel. It does *not* translate the world group (nausea) or the physics ground. This keeps the face reachable every cycle.

### 2a. `js/scene.js` — the kit

```javascript
  // --- 🚢 THE CRUISE ---
  // A lido deck at sea: teak planking, white railings, funnels, lifeboats, a pool
  // (the pond), deck chairs, gulls, and an ocean horizon with a slow swell. hideFair.
  const cruiseG = new THREE.Group();
  const gulls = [], deckWaves = [], funnelSmoke = [];
  {
    const teak = toonMat(0xb5895a), rail = toonMat(0xf4f0e8), hull = toonMat(0xe8e4dc), navy = toonMat(0x1f3a6e);
    // ---- the ocean: a vast blue plane ringing the deck, with a swell of low
    // crest strips animated in updateAmbient ----
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(320, 200), toonMat(0x2f78b0));
    sea.rotation.x = -Math.PI / 2; sea.position.set(48, -0.05, 0); cruiseG.add(sea);
    for (let i = 0; i < 40; i++) {
      const crest = new THREE.Mesh(new THREE.BoxGeometry(3 + Math.random() * 4, 0.08, 0.5), toonMat(0xbfe0f0));
      const a = Math.random() * Math.PI * 2, r = 45 + Math.random() * 90;
      crest.position.set(48 + Math.cos(a) * r, 0.05, Math.sin(a) * r);
      crest.rotation.y = Math.random() * 3; cruiseG.add(crest);
      deckWaves.push({ m: crest, ph: Math.random() * 6, y0: 0.05 });
    }
    // ---- the deck itself: a teak causeway with plank seams down the lane ----
    for (let i = 0; i < 40; i++) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.02, 0.08), toonMat(0x8a6540));
      seam.position.set(-14 + i * 3.6, 0.08, (i % 8) - 4); cruiseG.add(seam);
    }
    // ---- the railing belt (re-dresses the perimeter): white posts + top rail ----
    cruiseG.add(mkBelt((g, x, z, i) => {
      for (let p = 0; p < 3; p++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 6), rail);
        post.position.set(x + (p - 1) * 0.8, 0.65, z); g.add(post);
      }
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2, 7), rail);
      top.rotation.z = Math.PI / 2; top.position.set(x, 1.3, z); g.add(top);
      // a lifeboat hangs on davits every 6th post
      if (i % 6 === 0) {
        const boat = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 2.2, 4, 8), toonMat(0xe08a2a));
        boat.rotation.z = Math.PI / 2; boat.position.set(x, 2.4, z); g.add(boat);
        for (const s of [-1, 1]) {
          const davit = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2, 6), rail);
          davit.position.set(x + s * 1, 2.6, z); g.add(davit);
        }
      }
    }));
    cruiseG.children[cruiseG.children.length - 1].visible = true;

    // ---- the superstructure aft: a white wall with portholes on the far end,
    // dressed on the 62m hay-wall footprint so the reward ladder re-flavors ----
    const sup = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.BoxGeometry(3, 9, 18), hull);
    wall.position.y = 4.5; sup.add(wall);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      const port = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), glowMat(0x2fd4ff));
      port.rotation.y = -Math.PI / 2; port.position.set(-1.55, 2.5 + r * 2.2, -6 + c * 2.4); sup.add(port);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 16), toonMat(0xc9c2b5));
      ring.rotation.y = Math.PI / 2; ring.position.copy(port.position); sup.add(ring);
    }
    sup.position.set(64, 0, 0); cruiseG.add(sup);
    // two funnels on the superstructure, smoking gently
    for (const fz of [-4, 4]) {
      const funnel = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 4.5, 14), navy);
      funnel.position.set(66, 11, fz); cruiseG.add(funnel);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.5, 14), toonMat(0xd83a3a));
      cap.position.set(66, 13.2, fz); cruiseG.add(cap);
      for (let i = 0; i < 4; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1 + Math.random(), 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xcfd6da, transparent: true, opacity: 0.4 }));
        puff.position.set(66, 14 + i * 2, fz); cruiseG.add(puff);
        funnelSmoke.push({ m: puff, ph: i * 2, base: 14, x: 66, z: fz });
      }
    }

    // ---- THE POOL (the pond at 40,24): a tiled deck pool with a chrome ladder ----
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.4, 24), toonMat(0x2fb5d4));
    pool.position.set(40, 0.1, 24); cruiseG.add(pool);
    const poolRim = new THREE.Mesh(new THREE.TorusGeometry(4, 0.3, 8, 24), toonMat(0xf4f0e8));
    poolRim.rotation.x = Math.PI / 2; poolRim.position.set(40, 0.28, 24); cruiseG.add(poolRim);
    // deck chairs + parasols around the pool
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, cx = 40 + Math.cos(a) * 6, cz = 24 + Math.sin(a) * 6;
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 1.8), toonMat(0xf4f0e8));
      chair.position.set(cx, 0.4, cz); chair.rotation.y = a; cruiseG.add(chair);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.12), toonMat(0xf4f0e8));
      back.position.set(cx, 0.85, cz - 0.85); back.rotation.y = a; cruiseG.add(back);
      if (i % 2 === 0) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), toonMat(0x8a6540));
        pole.position.set(cx + 0.8, 1.2, cz); cruiseG.add(pole);
        const shade = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.7, 12), toonMat(i % 4 ? 0xd83a3a : 0x2f7ad8));
        shade.position.set(cx + 0.8, 2.5, cz); cruiseG.add(shade);
      }
    }

    // ---- gulls wheeling overhead (fly through them → same scareBirds path) ----
    for (let i = 0; i < 5; i++) {
      const gull = new THREE.Group();
      for (const s of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.18), toonMat(0xf4f0e8));
        wing.position.x = s * 0.3; gull.add(wing);
      }
      gull.position.set(20 + i * 12, 12 + (i % 3), -8 + i * 4);
      cruiseG.add(gull); gulls.push({ g: gull, ph: i * 1.3, cx: 30 + i * 10, r: 8 + i * 2 });
    }

    cruiseG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    cruiseG.visible = false;
    scene.add(cruiseG);
  }
  const lifeboatBarricade = mkBarricade((arr, bx) => {
    // a stack of deck chairs topped by a beached lifeboat
    for (const [by, count] of [[0.4, 4], [1.1, 3]]) {
      for (let i = 0; i < count; i++) {
        const g = new THREE.Group();
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.6), toonMat(0xf4f0e8));
        g.add(chair);
        g.position.set(bx, by, -1.6 + i * (3.2 / Math.max(1, count - 1)));
        arr.push(g);
      }
    }
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 3.2, 4, 10), toonMat(0xe08a2a));
    hull.rotation.z = Math.PI / 2; boat.add(hull);
    boat.position.set(bx, 2.1, 0.4); arr.push(boat);
  });
```

### 2b. `js/scene.js` — updateAmbient block

```javascript
    if (cruiseG.visible) {
      for (const w of deckWaves) w.m.position.y = w.y0 + Math.sin(time * 1.3 + w.ph) * 0.12;   // swell
      for (const s of funnelSmoke) {
        const t2 = (time * 1.5 + s.ph) % 8;
        s.m.position.y = s.base + t2 * 1.4;
        s.m.material.opacity = Math.max(0, 0.4 - t2 / 20);
      }
      for (const g of gulls) {                    // wheeling gulls
        const a = time * 0.5 + g.ph;
        g.g.position.set(g.cx + Math.cos(a) * g.r, 12 + Math.sin(time * 1.4 + g.ph) * 0.8, Math.sin(a) * g.r);
        g.g.rotation.y = -a;
        g.g.children[0].rotation.z = Math.sin(time * 8) * 0.5;   // wing flap
        g.g.children[1].rotation.z = -Math.sin(time * 8) * 0.5;
      }
    }
```

### 2c. `js/scene.js` — theme + registration

```javascript
  // add to WORLD_THEMES:
  cruise: { fog: [0xbfe0f0, 60, 200], skyTint: 0x8ec8ec, hemi: [0xdff0fb, 0x2f78b0, 1.0], sun: [0xfff4e0, 2.1], fill: 0.34, cloud: 0xffffff, maps: false, grass: 0x2f78b0, lane: 0xb5895a, night: false, sunFace: true,
    group: 'cruise', biome: 'cruise', crowd: 'cruise', pond: 0x2fb5d4, sunTint: [0xfff2df, 0.9],
    hideFarm: true, hideBarn: true, hideFair: true, hideCloths: true, hideFences: true, barricade: 'lifeboat' },

  // add to WORLD_GROUPS:  cruise: cruiseG,
  // add to BELT_WORLDS:   'cruise'
  // add to BARRICADES:    lifeboat: lifeboatBarricade,
  // add to CROWD_PALETTES: cruise-wear whites, navy, sunburn coral
  cruise: [0xf4f0e8, 0x1f3a6e, 0xd8687a, 0x2f78b0, 0xe8e4dc, 0xffd23f],
```

---

# 3. THE TAR PITS (`tarpits`, DLC) — the Sink

The quicksand mechanic, finally housed. The volunteer stands in tar and **sinks**: the whole braced ragdoll descends over ~8 s. The strike plane tracks the cheek down each frame, so anyone can land an early slap (always winnable) — but the deeper it sinks, the more a *tall* slapper's downward reach clamps out to a glancing, low-flushness hit while a *short* slapper stays level and square (steeper arc + full `cq`). That's the real "who do you bring?" (principle #5), scored, not walled. If nobody slaps before full submersion, it's a **SINK_FAIL**.

### 3a. `js/opponent.js` — the mechanic

**Arch flag** (composable, per the `grease`/`weave` idiom): `sink: { duration: 8, depth: 0.9 }`. A world default is set by main.js (`Opponent.sink`), and a boss can override for a deeper/slower descent.

Add `sink` to the `gimmick` guard (so the plain breathe branch is skipped when sinking), then add this branch inside `update()` next to the others:

```javascript
      // in the gimmick OR-chain near line 1475, add  || A.sink || Opponent.sink :
      const gimmick = A.weave || A.skiRun || A.hop || A.sway || A.headTurn || A.bjj || A.bounce || A.sink || Opponent.sink;

      // THE TAR PITS: the braced volunteer sinks into the pit on a fixed, readable
      // curve. Every body part descends together (the swept hit-test stays honest);
      // the strike plane follows (main.js re-targets each SWING frame). Land the
      // slap before full submersion — a short slapper stays flush on the low cheek
      // longer, a tall one starts chopping down and glancing. Deterministic, no RNG.
      const sink = A.sink || Opponent.sink;
      if (sink) {
        const prog = Math.min(1, this.time / sink.duration);
        const ease = prog * prog * (3 - 2 * prog);       // smoothstep — a slow start, a scary finish
        const drop = ease * sink.depth;
        const breathe = Math.sin(this.time * 1.4) * 0.04 * (1 - prog);  // they gulp less as they go under
        const P = this.rag.parts;
        for (const n in this.basePose) P[n].body.position.y = this.basePose[n].p.y - drop;
        P.head.body.position.y += breathe;
        this._sinkProg = prog;
        if (this.hatBody && this.hatOff) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
        this.rag.sync();
        this.syncHat();
      }
```

Add the poll method alongside `escaped()`:

```javascript
  // full submersion: the cheek is gone under the tar, the attempt is lost
  sunk() { return this.arch.sink || Opponent.sink ? (this._sinkProg || 0) >= 0.999 : false; }
```

Declare the world-default static once (top of the class file, near `START_X`, or just after the class): `Opponent.sink = null;`

### 3b. `js/opponent.js` — roster (world-locals + the boss)

```javascript
  // ---- THE TAR PITS locals (world: 'tarpits') — affectionate caveperson parody,
  // jokes on the museum diorama, never on peoples (principle #11) ----
  {
    key: 'ugg', name: 'CAVEMAN UGG', tag: 'PALEOLITHIC VOLUNTEER', world: 'tarpits',
    w: 1.1, h: 1.0, mass: 1.1,
    skin: 0xc98d5a, shirt: 0x6e5030, pants: 0x5a4028, hair: 'flat', hairCol: 0x2a1a12,
    whiteBeard: false, beard: 0x2a1a12, club: true,   // fur tunic tone via shirt/pants; club = optional new prop
    pickLine: 'First to invent the wheel. Still cannot dodge a palm.',
    taunts: ['Ugg been slapped by mammoth. You? Small.', 'Fire good. Slap bad. Ugg know difference.'],
  },
  {
    key: 'oona', name: 'CAVEWOMAN OONA', tag: 'ROCK-ART CRITIC', world: 'tarpits',
    w: 0.95, h: 1.02, mass: 0.95, female: true,
    skin: 0xd49a6a, shirt: 0x7a5838, pants: 0x7a5838, skirt: 0x7a5838, hair: 'long', hairCol: 0x241610,
    pickLine: 'Painted your whole slap on the cave wall. Rated it two stars.',
    taunts: ['Oona seen better. Oona painted better.', 'Big arm. Small technique. Oona not impressed.'],
  },
  // ---- boss: the museum's mounted centerpiece, back and furious ----
  {
    key: 'mammoth', name: 'MAGNUS THE MAMMOTH', tag: 'BOSS · TEN TONS OF TUSK', boss: true,
    w: 2.3, h: 1.35, mass: 4.2,
    // a woolly hulk: shaggy brown coat, ivory tusks, tiny furious eyes. He sinks
    // SLOWER but DEEPER than the cave-folk — a mountain going down is still a
    // mountain. You'll want your shortest slapper (Charlie) to stay flush late.
    skin: 0x6e4a2e, shirt: 0x6e4a2e, pants: 0x5a3a22, tusks: true, brow: true, mammothCoat: true,
    sink: { duration: 10, depth: 1.3 },
    pickLine: 'Extinct for 10,000 years. Held a grudge for all of them.',
    taunts: ['You melt the ice age. Now the ice age melts YOU.', 'I have sunk before. I always come back UP.'],
  },
```

> `club`, `tusks`, `mammothCoat` are new look flags — flag them for the player/opponent builder or drop them (the archetype still reads from skin/fur tones + `brow`). Everything else uses existing flags.

### 3c. `js/opponent.js` — WORLD_ROSTERS entry

```javascript
  tarpits: { allow: ['ugg', 'oona', 'slim', 'cletus', 'hank', 'mabel'] },  // cave-folk + the lightest, most sink-able fair regulars
```

### 3d. `js/scene.js` — the kit

```javascript
  // --- 🦴 THE TAR PITS ---
  // A prehistoric natural-history tar field: bubbling black pools, half-sunk fossil
  // skeletons, ferns, a smoking primordial volcano backdrop, amber chunks, a
  // woolly-mammoth silhouette on the ridge. hideFair. La Brea parody.
  const tarG = new THREE.Group();
  const tarBubbles = [], tarSmoke = [], amberGlow = [];
  let tarMammoth = null;
  {
    const tar = new THREE.MeshBasicMaterial({ color: 0x0e0c10 });   // wet black, unlit so it reads as a void
    const bone = toonMat(0xe4dcc4), rock = toonMat(0x3a3230), fern = toonMat(0x4a6a3a);
    // ---- the tar sea: black pools flanking the lane (lane stays a dry crust
    // causeway so the slap reads), with bubbles rising in updateAmbient ----
    for (const [x0, x1, z0, z1] of [[-22, 136, -42, -6], [-22, 136, 6, 42]]) {
      const w = x1 - x0, d = z1 - z0;
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(w, d), tar);
      pool.rotation.x = -Math.PI / 2; pool.position.set((x0 + x1) / 2, 0.02, (z0 + z1) / 2); tarG.add(pool);
      for (let i = 0; i < Math.floor(w * Math.abs(d) / 180); i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.25 + Math.random() * 0.35, 8, 8), tar);
        b.position.set(x0 + Math.random() * w, 0.05, z0 + Math.random() * d);
        tarG.add(b); tarBubbles.push({ m: b, ph: Math.random() * 6, y0: 0.05 });
      }
    }
    // ---- fossil belt: rib-cages and tusks jutting from the perimeter tar ----
    tarG.add(mkBelt((g, x, z, i) => {
      if (i % 4 === 0) {                       // a rib-cage arching out of the pit
        for (let r = 0; r < 5; r++) {
          const rib = new THREE.Mesh(new THREE.TorusGeometry(1.4 - r * 0.15, 0.12, 6, 12, Math.PI), bone);
          rib.position.set(x + r * 0.4 - 0.8, 0.2, z); rib.rotation.z = -Math.PI / 2; g.add(rib);
        }
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), bone);
        skull.scale.set(1.3, 0.9, 1); skull.position.set(x - 1.6, 0.6, z); g.add(skull);
      } else {                                 // a pair of ivory tusks
        for (const s of [-1, 1]) {
          const tusk = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.16, 6, 12, Math.PI * 0.6), bone);
          tusk.position.set(x, 1 + (i % 3) * 0.4, z + s * 0.5); tusk.rotation.z = s * 0.4; g.add(tusk);
        }
      }
    }));
    tarG.children[tarG.children.length - 1].visible = true;

    // ---- THE PRIMORDIAL VOLCANO backdrop (reuses the lava-volcano recipe) ----
    const volc = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(30, 40, 8), toonMat(0x2a221e));
    cone.position.y = 20; volc.add(cone);
    const crater = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 3, 8), glowMat(0xff7a2a));
    crater.position.y = 39; volc.add(crater);
    volc.position.set(130, 0, -6); tarG.add(volc);
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x3a302a, transparent: true, opacity: 0.5 }));
      puff.position.set(130, 42 + i * 6, -6); tarG.add(puff);
      tarSmoke.push({ m: puff, ph: i * 3, base: 42, x: 130, z: -6 });
    }
    // ---- the mammoth silhouette on the ridge (visual only; the boss is separate) ----
    tarMammoth = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 10), toonMat(0x5a3e28));
    body.scale.set(1.5, 1.1, 1); body.position.y = 4; tarMammoth.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 10), toonMat(0x5a3e28));
    head.position.set(-4.4, 4.2, 0); tarMammoth.add(head);
    for (const s of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.2, 6, 12, Math.PI * 0.7), bone);
      tusk.position.set(-5.6, 3, s * 0.8); tusk.rotation.z = 1.2; tarMammoth.add(tusk);
    }
    for (const [lx, lz] of [[2.4, 1.4], [2.4, -1.4], [-2.4, 1.4], [-2.4, -1.4]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.4, 8), toonMat(0x4a3220));
      leg.position.set(lx, 1.7, lz); tarMammoth.add(leg);
    }
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 3.2, 8), toonMat(0x5a3e28));
    trunk.position.set(-5.4, 2.4, 0); trunk.rotation.z = 0.6; tarMammoth.add(trunk);
    tarMammoth.position.set(100, 0, -26); tarMammoth.rotation.y = 0.4; tarG.add(tarMammoth);

    // ---- ferns + amber chunks strewn along the shoulders ----
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1, fx = 4 + i * 6;
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.2, 5), fern);
      frond.position.set(fx, 1.1, side * (5.5 + (i % 3))); frond.rotation.x = side * 0.2; tarG.add(frond);
      if (i % 3 === 0) {
        const amber = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.3), glowMat(0xffb43a));
        amber.material.transparent = true; amber.material.opacity = 0.85;
        amber.position.set(fx + 1, 0.4, side * 4.5); tarG.add(amber);
        amberGlow.push({ m: amber.material, ph: i, base: 0.85 });
      }
    }

    tarG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    tarG.visible = false;
    scene.add(tarG);
  }
  const ribcageBarricade = mkBarricade((arr, bx) => {
    // a fossil rib-cage wall — bones arch across the lane, backed by a boulder
    const bone = toonMat(0xe4dcc4);
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.6 - i * 0.08, 0.18, 8, 16, Math.PI), bone);
      rib.rotation.z = -Math.PI / 2; g.add(rib);
      g.position.set(bx, 0.1, -1.8 + i * 0.9);
      arr.push(g);
    }
    const spine = new THREE.Group();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3.6, 8), bone);
    col.rotation.x = Math.PI / 2; spine.add(col);
    spine.position.set(bx, 1.7, 0); arr.push(spine);
  });
```

### 3e. `js/scene.js` — updateAmbient block

```javascript
    if (tarG.visible) {
      for (const b of tarBubbles) {           // tar bubbling — a slow swell + pop
        const c = (time * 1.6 + b.ph) % 3;
        b.m.position.y = b.y0 + (c < 2 ? Math.sin((c / 2) * Math.PI) * 0.25 : 0);
        b.m.scale.setScalar(c < 2 ? 0.6 + Math.sin((c / 2) * Math.PI) * 0.6 : 0.1);
      }
      for (const s of tarSmoke) {
        const t2 = (time * 1.4 + s.ph) % 18;
        s.m.position.y = s.base + t2 * 1.5;
        s.m.material.opacity = Math.max(0, 0.5 - t2 / 36);
      }
      for (const a of amberGlow) a.m.opacity = a.base * (0.7 + Math.abs(Math.sin(time * 1.2 + a.ph)) * 0.3);
      if (tarMammoth) tarMammoth.position.y = Math.sin(time * 0.6) * 0.08;   // a slow, doomed sway
    }
```

### 3f. `js/scene.js` — theme + registration

```javascript
  // add to WORLD_THEMES:
  tarpits: { fog: [0x2a2420, 44, 150], skyTint: 0x3a2e26, hemi: [0xc9a878, 0x2a201c, 0.7], sun: [0xffb060, 1.5], fill: 0.22, cloud: 0x4a3a2e, maps: false, grass: 0x2a2420, lane: 0x1f1a16, night: false, sunFace: false,
    group: 'tarpits', biome: 'tar', crowd: 'tar', pond: 0x0e0c10, sunTint: [0xffcaa0, 0.7],
    hideFarm: true, hideBarn: true, hideFair: true, hideCloths: true, hideFences: true, barricade: 'ribcage' },

  // add to WORLD_GROUPS:  tarpits: tarG,
  // add to BELT_WORLDS:   'tarpits'
  // add to BARRICADES:    ribcage: ribcageBarricade,
  // add to CROWD_PALETTES: fur + earth diorama tones
  tar: [0x6e5030, 0x8a6540, 0x5a4028, 0x3a2a1e, 0xc98d5a, 0x4a3220],
```

---

# Shared patches (all three worlds)

### `js/main.js` — WORLDS chip row (append)

```javascript
  { key: 'vegas',   label: '🎰 SLAP VEGAS', dlc: true },
  { key: 'cruise',  label: '🚢 THE CRUISE', dlc: true },
  { key: 'tarpits', label: '🦴 THE TAR PITS', dlc: true },
```

### `js/main.js` — `setWorldFull` (add the physics/mechanic pins)

```javascript
function setWorldFull(key) {
  activeWorld = key;
  stage.setWorldTheme(key);
  if (key === 'ice') phys.setGround({ friction: 0.03, restitution: 0.3 });
  else if (key === 'jungle') phys.setGround({ friction: 0.38, restitution: 0.62 });
  else phys.setGround(null);
  phys.setGravity(key === 'heaven' ? -8.8 : null);
  // THE CRUISE: the deck lists on a slow swell — the volunteer's cheek drifts (z)
  Opponent.deckList = key === 'cruise' ? { period: 5.0, amp: 0.45 } : null;
  // THE TAR PITS: every volunteer sinks unless their arch overrides the curve
  Opponent.sink = key === 'tarpits' ? { duration: 8, depth: 0.9 } : null;
}
```

(Import `Opponent` is already present in main.js line 5.)

### `js/opponent.js` — the Cruise deck-list branch (paste in `update()` beside the sink branch)

```javascript
      // THE CRUISE: the deck lists on a readable swell, sliding the cheek sideways.
      // Applied on the LIVE bodies so the swept hit-test stays honest. Time the
      // level moment (roll≈0, twice per period) for a flush centered hit — or ride
      // a big list to fling the volunteer overboard (main.js reads _deckRoll).
      if (Opponent.deckList && !this.launched && !this.showcaseMode) {
        const dl = Opponent.deckList;
        const roll = Math.sin(this.time * (Math.PI * 2 / dl.period));
        const P = this.rag.parts;
        P.head.body.position.z = this.basePose.head.p.z + roll * dl.amp;
        P.torso.body.position.z = this.basePose.torso.p.z + roll * dl.amp * 0.62;
        P.pelvis.body.position.z = this.basePose.pelvis.p.z + roll * dl.amp * 0.25;
        this._deckRoll = roll;
        if (this.hatBody && this.hatOff) this.hatBody.position.copy(P.head.body.position.vadd(this.hatOff));
        this.rag.sync();
        this.syncHat();
      }
```

Add `Opponent.deckList` to the `gimmick` guard so plain breathe doesn't fight it, and declare `Opponent.deckList = null;` beside `Opponent.sink = null;`.

### `js/main.js` — SWING tick additions (inside the `state === 'SWING'` block, near the `foul`/hit polls at ~1442)

```javascript
    // THE TAR PITS: the strike plane follows the descending cheek every frame,
    // so any slapper can hit early; short slappers stay flush on the low cheek
    if (activeWorld === 'tarpits') player.setStrikeTarget(opponent.headPos().y);
    ...
    if (player.fallen) foul('footing');
    else if (opponent.escaped()) foul('escape');
    else if (opponent.sunk()) foul('sink');                     // full submersion, attempt lost
    else if (shotClock <= 0 && !opponent.arch.skiRun) foul('clock');
```

### `js/main.js` — onContact overboard bonus (Cruise), inside `onContact`, right after `dir` is built (~line 865)

```javascript
  // THE CRUISE: slapping on a hard list toward the open rail (starboard, +z) sends
  // the volunteer OVERBOARD — a sideways launch + a distance kicker on splashdown
  let overboard = false;
  if (activeWorld === 'cruise' && (opponent._deckRoll || 0) > 0.7) {
    dir.z += 0.4; dir.normalize();
    power *= 1.15;
    overboard = true;
    stage.scareBirds?.(hit.point);   // scatter the gulls
  }
```

Then in `showResult`, add cruise flavor next to the lava/therapy garnish (`worldNow === ...`):

```javascript
  } else if (worldNow === 'cruise' && !isFoul) {
    line += slap && slap._overboard ? ' OVERBOARD! Man in the water — the captain is FURIOUS.'
          : dist > 62 ? ' Cleared the superstructure. Maritime law is having a day.'
          : ' A gentle splash off the lido deck.';
```

(Stash the flag on the slap object in onContact: `slap._overboard = overboard;` after `slap` is assigned, or fold it into the `slap` literal.)

### `js/ui.js` — foul copy for SINK_FAIL

```javascript
  // FOUL_LINES:
  sink: 'The tar closed over his head with a slow, patient glorp. Gone.',
  // FOUL_BANNERS:
  sink: ['SWALLOWED!', 'THE PIT TOOK HIM — SLAP BEFORE HE GOES UNDER'],
```

### `js/campaign.js` + `js/main.js` — SINK_FAIL beat (mirrors ESCAPE_FAIL)

```javascript
// campaign.js
export const SINK_FAIL = [
  { who: '🦴 THE TAR PITS', text: '*glorp* ...a single bubble reaches the surface, and pops.', shot: 'wide' },
  { who: 'YOU', text: 'He sinks on a clock. Next time I bring my SHORTEST hand — the low cheek stays in reach.', shot: 'player' },
];
```

```javascript
// main.js MATCH_END selection (~line 1151), add:
const sinkBeat = activeWorld === 'tarpits' && slap && slap.foul === 'sink';
const fail = takedownBeat ? campaign.TAKEDOWN_FAIL
           : escapeBeat ? campaign.ESCAPE_FAIL
           : sinkBeat ? campaign.SINK_FAIL
           : (pool.length ? pool[failIdx++ % pool.length] : null);
```

---

# The Vegas Double-or-Nothing mechanic (the star) — full spec + code

**HUD.** A ring in the lower-center of the screen: a `conic-gradient` with a **green DOUBLE wedge** at the top (12 o'clock) and **red BUST** elsewhere; a marker (a thin white needle) sweeps clockwise. Prompt copy above it: `PRESS [P] — DOUBLE OR NOTHING · [ENTER] TO BANK`.

**Deterministic-fair, no RNG.** The DOUBLE wedge's half-width is a pure function of your chain quality:
`doubleArc = 60° + chainPct × 1.2°` → chain 0 → 60° wedge (a 0.23 s window), chain 50 → 120°, chain 100 → 180° (a 0.70 s window). A clean slap literally makes the gamble safer — technique is rewarded twice. The marker sweeps at a fixed **2π / 1.4 s** (one loop every 1.4 s), so where it stops is 100% determined by *when you press P*. Clip-able and skill-based.

**Input window & flow (new state `GAMBLE`).** After a landed slap lands and the flight settles, if `activeWorld === 'vegas'` and it wasn't a foul, we enter `GAMBLE` instead of banking. The spinner sweeps; you have **3.5 s**:
- **P** → stop the needle. Inside the top wedge (`angularDistFromTop ≤ doubleArc/2`) → **DOUBLE** (×2). Outside → **BUST** (×0).
- **ENTER / SPACE / 3.5 s timeout** → **BANK** the points as-is (×1). Nothing is ever forced into a loss.

**Where it hooks.** `showResult()` runs *once*, for real, with a `gambleMult` baked into the points. The gamble resolves first and re-enters `showResult()`.

### `js/main.js` — module vars (near the other `let` state, ~line 64)

```javascript
let gambleMult = 1;      // 1 = banked, 2 = doubled, 0 = busted; reset each attempt
let gamble = null;       // { doubleArc, marker } spinner state
let gambleClock = 0;
const GAMBLE_SPEED = Math.PI * 2 / 1.4;   // one loop every 1.4s
```

Reset in `startAttempt()`: `gambleMult = 1;`

### `js/main.js` — `showResult()`: gate the gamble at the very top

```javascript
function showResult() {
  // SLAP VEGAS: a landed slap can be PUSHED before it banks (double or nothing).
  // Fouls and zero-distance skip it. Runs once; the gamble re-enters with a mult.
  if (activeWorld === 'vegas' && gambleMult === 1 && slap && !slap.foul
      && opponent.launched && opponent.distance() > 0) {
    startGamble();
    return;
  }
  timeScale = 1;
  const arch = opponent.arch;
  const flew = opponent.launched ? opponent.distance() : 0;
  const isFoul = !!(slap && slap.foul);
  const dist = isFoul ? 0 : flew;
  const pts = Math.round(dist * arch.mass * 10 * gambleMult);   // ← the multiplier
  ...
```

Add Vegas flavor to the `line` (next to the lava/therapy garnish):

```javascript
  } else if (worldNow === 'vegas' && !isFoul) {
    line += gambleMult === 2 ? ' 🎰 DOUBLE OR NOTHING — DOUBLED! The pit boss looks nervous.'
          : gambleMult === 0 ? ' 🎰 BUSTED at the wheel — the house keeps every point. Ouch.'
          : ' 🎰 Banked it. Smart money walks away.';
```

### `js/main.js` — the gamble state machine

```javascript
function startGamble() {
  timeScale = 1;
  const chainPct = slap && slap.chain ? slap.chain.pct : 0;
  gamble = { doubleArc: THREE.MathUtils.degToRad(60 + Math.min(100, chainPct) * 1.2), marker: 0 };
  gambleClock = 3.5;
  ui.gambleShow(gamble.doubleArc);
  sfx.whoosh(0);
  setState('GAMBLE');
}
function resolveGamble(stopped) {
  if (!gamble) return;
  if (stopped) {
    const m = gamble.marker % (Math.PI * 2);
    const distTop = Math.min(m, Math.PI * 2 - m);        // angular distance from 12 o'clock
    const win = distTop <= gamble.doubleArc / 2;
    gambleMult = win ? 2 : 0;
    ui.slapBurst(win ? 'DOUBLE!' : 'BUST!', win ? 'THE HOUSE PAYS DOUBLE' : 'THE HOUSE ALWAYS WINS');
    if (win) { sfx.fanfare(); stage.kidsCelebrate(3); } else { sfx.whistle(); stage.sunMood('meh', 3); }
  } else {
    gambleMult = 1;
    ui.slapBurst('BANKED.', 'SMART MONEY KEEPS THE POINTS');
  }
  gamble = null;
  ui.gambleHide();
  showResult();      // now runs for real with gambleMult baked in
}
```

### `js/main.js` — tick branch (add to the state machine, before the RESULT/MATCH_END branch)

```javascript
  } else if (state === 'GAMBLE') {
    gamble.marker = (gamble.marker + dts * GAMBLE_SPEED) % (Math.PI * 2);
    ui.gambleTick(gamble.marker);
    gambleClock -= dts;
    if (gambleClock <= 0) resolveGamble(false);   // timeout = safe bank
```

### `js/main.js` — input (top of the keyed input handler, ~line 1246, before the state routing)

```javascript
  if (state === 'GAMBLE') {
    if (e.code === 'KeyP') resolveGamble(true);
    else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') resolveGamble(false);
    return;
  }
```

Touch works for free — the `#touchPad` P button already dispatches a synthetic `KeyP` event, so the gamble is clip-able on mobile.

### `js/ui.js` — the spinner HUD (append)

```javascript
let _gambleEl = null;
export function gambleShow(doubleArc) {
  if (!_gambleEl) {
    _gambleEl = document.createElement('div');
    _gambleEl.id = 'gambleWheel';
    _gambleEl.innerHTML = '<div class="gwRing"></div><div class="gwNeedle"></div>'
      + '<div class="gwLabel">PRESS&nbsp;[P] — DOUBLE&nbsp;OR&nbsp;NOTHING<br><span>[ENTER] TO BANK</span></div>';
    document.body.appendChild(_gambleEl);
  }
  const halfDeg = (doubleArc / 2) * 180 / Math.PI;
  // green DOUBLE wedge centered at 12 o'clock, red BUST elsewhere (conic from top)
  _gambleEl.querySelector('.gwRing').style.background =
    `conic-gradient(from ${-halfDeg}deg, #2fae5a 0deg ${halfDeg * 2}deg, #d83a3a ${halfDeg * 2}deg 360deg)`;
  _gambleEl.classList.add('show');
}
export function gambleTick(rad) {
  if (_gambleEl) _gambleEl.querySelector('.gwNeedle').style.transform =
    `translate(-50%,-100%) rotate(${rad * 180 / Math.PI}deg)`;
}
export function gambleHide() { if (_gambleEl) _gambleEl.classList.remove('show'); }
```

```css
/* index.html <style> — the wheel */
#gambleWheel { position: fixed; left: 50%; bottom: 200px; transform: translateX(-50%);
  width: 180px; height: 180px; opacity: 0; pointer-events: none; transition: opacity .2s; z-index: 40; }
#gambleWheel.show { opacity: 1; }
#gambleWheel .gwRing { width: 100%; height: 100%; border-radius: 50%;
  -webkit-mask: radial-gradient(circle, transparent 46%, #000 47%); mask: radial-gradient(circle, transparent 46%, #000 47%);
  box-shadow: 0 0 24px rgba(0,0,0,.6); }
#gambleWheel .gwNeedle { position: absolute; left: 50%; top: 50%; width: 4px; height: 50%;
  background: #fff; transform-origin: 50% 100%; transform: translate(-50%,-100%); border-radius: 2px;
  box-shadow: 0 0 8px #fff; }
#gambleWheel .gwLabel { position: absolute; top: 104%; left: 50%; transform: translateX(-50%);
  white-space: nowrap; font: 700 13px/1.4 system-ui; color: #ffd23f; text-align: center; text-shadow: 0 2px 6px #000; }
#gambleWheel .gwLabel span { color: #cfd6da; font-size: 11px; }
```

**Winnability proof (principle #10):** banking (`ENTER`/timeout) is always available and never reduces the base score, so no campaign goal keyed off points can be made unclearable by the mechanic. A flush chain (≥90%) yields a ≥168° DOUBLE wedge — on-screen ~0.65 s per loop — trivially stoppable; a sloppy chain earns a genuine 0.23 s gamble. The double is strictly optional upside earned by technique.

---

# Campaign hooks (one paragraph each)

**Slap Vegas — "The House Always Wins."** The county fair is drowning in debt to the Strip's casino cartel; the deed to the fairground is on the table. Our star slaps their way up the tables — Act I the floor magicians and card-counters, Act II the pit bosses — every match's Double-or-Nothing meter *is* the wager, points literally staked against the deed. The finale is **THE WHALE** (mass 2.2, "never loses"): a chainGate boss who no-sells anything but a flush chain, forcing you to push the double on a perfect slap to clear the debt in one hand. Punchline: the fair keeps its land, and the Whale, for the first time, folds.

**The Cruise — "Slapping is Prohibited Aboard This Vessel."** The fair's been "relocated" to a discount cruise that turns out to be a floating debt-trap; the only way ashore is to out-slap the ship's brass. The rocking deck is the whole storyline — every challenge asks you to time the swell, and Act III's goal is to send volunteers *overboard* (the launch-into-the-sea bonus) as literal jailbreaks. Final boss the **CAPTAIN**, who insists each slap "violates maritime law" (a `shotClock` + `chainGate` combo — you must land clean *and* fast before he calls it a mutiny). Cleared, he strikes his own colors and sails everyone home.

**The Tar Pits — "Before He Goes Under."** A natural-history museum's diorama comes alive and starts swallowing the fair's volunteers into the pit; the mechanic is the mission (principle #4) — slap each caveperson clear of the tar before they submerge (SINK_FAIL). Act I/II teach the who-do-you-bring lesson (short slappers stay flush on the sinking cheek), building to the capstone: **MAGNUS THE MAMMOTH** (mass 4.2, `sink:{duration:10, depth:1.3}`), a ten-ton fossil going down slow and deep — you must land a late, flush, high-arc slap with your *shortest* hand to launch him free and out of the ages. Payoff: the mammoth erupts from the tar in a geyser of black, the diorama reverts, and the fair's volunteers claw back to daylight.

---

# Implementation-surface summary

**Files touched (all edits are additive):** `js/scene.js`, `js/main.js`, `js/opponent.js`, `js/ui.js`, `index.html` (one CSS block).

**New WORLDS chips (main.js):** `vegas`, `cruise`, `tarpits` (all `dlc: true`).

**New WORLD_THEMES / WORLD_GROUPS / BELT_WORLDS / BARRICADES (scene.js):**
- Groups: `vegasG`, `cruiseG`, `tarG`; barricade arrays `chipBarricade`, `lifeboatBarricade`, `ribcageBarricade` (keys `chips` / `lifeboat` / `ribcage`).
- Each added to `WORLD_GROUPS`, `BELT_WORLDS`, `BARRICADES`, and `WORLD_THEMES` (all three use `hideFair` — no tinted farm).
- New updateAmbient blocks keyed off `vegasG.visible` / `cruiseG.visible` / `tarG.visible`.

**New biome keys (scene.js `setBiome` variant maps):** `vegas`, `cruise`, `tar`. Append a hex to the existing multi-world variant objects at these call-sites (mirroring the `lava:` precedent): `hayMat` (517), `hayEnd` (518), `cornIM` (562), `edgeCornIM` (600), `fieldCornIM` (845), canopy puff (572) + blob (854), and hills (1011). Suggested values — Vegas `0x1a1226`, Cruise `0xb5895a` (teak) / corn→`0xd8c9a8`, Tar `0x2a2018`.

**New CROWD_PALETTES (scene.js):** `vegas`, `cruise`, `tar`.

**New WORLD_ROSTERS entry (opponent.js):** `tarpits` (allow list). Vegas & Cruise field the fair regulars plus their locals via `world:` gating — add curated `vegas`/`cruise` allow-lists if you want tighter curation (recommended per principle #2; e.g. `vegas: { allow: ['whale','magician','don','influencer','slim','hank'] }`, `cruise: { allow: ['shuffles','captain','cletus','mabel','hank','bertha'] }`).

**New world-local volunteers (opponent.js ROSTER):** `whale`, `magician` (`world:'vegas'`); `shuffles`, `captain` (`world:'cruise'` — not written above but follow the `ugg`/`oona` pattern); `ugg`, `oona` (`world:'tarpits'`); plus boss `mammoth`. *(Vegas/Cruise local entries follow the same idiom — I built out the Tar Pits trio in full as the template; add the four Vegas/Cruise locals the same way.)*

**New mechanics / flags / states:**
- **`GAMBLE`** — new game state + `startGamble`/`resolveGamble`, `gambleMult`/`gamble`/`gambleClock` vars, `GAMBLE_SPEED`; new `ui.gambleShow/gambleTick/gambleHide` + `#gambleWheel` CSS. Deterministic spinner, chain%-sized DOUBLE wedge, `P`=gamble / `ENTER`=bank / timeout=bank.
- **`Opponent.deckList`** (static `{period,amp}`) — Cruise lateral cheek drift; `_deckRoll` read in `onContact` for the overboard bonus (`dir.z`, ×1.15, `scareBirds`).
- **`Opponent.sink`** + arch flag `sink:{duration,depth}` + `Opponent.sunk()` — Tar Pits descent; SWING re-targets the strike plane each frame; new foul type **`sink`** (FOUL_LINES/FOUL_BANNERS + `campaign.SINK_FAIL` beat).
- Both added to the `gimmick` guard in `Opponent.update`.

**New look flags to wire (or drop) in the model builders:** `club`, `tusks`, `mammothCoat` (Tar Pits cast); optionally a `topper` top-hat for the Vegas magician. All archetypes still read from existing flags if these are skipped.

All animation is deterministic (time-based sines/phases); every glow surface is unlit `MeshBasicMaterial` and excluded from shadow casting via the per-group `traverse` filter; each kit re-dresses the shared `perimSpots` belt and joins `barricade.pieces` so burst/restack works; polygon budgets are in the lava kit's range (belts stride the perimeter, décor loops capped ≤ ~40).