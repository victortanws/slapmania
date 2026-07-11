import * as THREE from 'three';

// stepped toon shading shared by every character/prop — softer than raw Lambert,
// reads as deliberate art direction rather than default-material programmer art
let gradTex = null;
export function toonMat(color) {
  if (!gradTex) {
    gradTex = new THREE.DataTexture(new Uint8Array([100, 160, 215, 255]), 4, 1, THREE.RedFormat);
    gradTex.minFilter = THREE.NearestFilter;
    gradTex.magFilter = THREE.NearestFilter;
    gradTex.needsUpdate = true;
  }
  return new THREE.MeshToonMaterial({ color, gradientMap: gradTex });
}

function makeTextTexture(text, color = '#ffffff') {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 128;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, 512, 128);
  g.font = '900 84px "Arial Black", Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, 256, 68, 500); // maxWidth: long names squeeze instead of clipping
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  return tex;
}

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  // cool blue haze toward the horizon sells depth on the open field
  scene.fog = new THREE.Fog(0xdce9f2, 45, 160);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  camera.position.set(0.5, 2, 4.5);

  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  // --- golden-hour lighting ---
  const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x4f6b3a, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.9);
  sun.position.set(6, 9, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 10, bottom: -4, near: 1, far: 45 });
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0x9db4ff, 0.35);
  fill.position.set(-4, 6, -8);
  scene.add(fill);

  function trackSun(x) {
    sun.position.set(x + 6, 9, 5);
    sun.target.position.set(x, 0, 0);
  }

  // --- sky dome + sun disc + drifting clouds ---
  const skyCv = document.createElement('canvas');
  skyCv.width = 2; skyCv.height = 256;
  const skyG = skyCv.getContext('2d');
  const grad = skyG.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#3f8fd4');
  grad.addColorStop(0.5, '#86c0ea');
  grad.addColorStop(0.8, '#cfe6f4');
  grad.addColorStop(1, '#f0ead8');
  skyG.fillStyle = grad;
  skyG.fillRect(0, 0, 2, 256);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(210, 24, 12),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(skyCv), side: THREE.BackSide, fog: false })
  );
  scene.add(sky);

  // --- the sun has a face, and the face has opinions ---
  const sunCv = document.createElement('canvas');
  sunCv.width = 256; sunCv.height = 256;
  const sunTex = new THREE.CanvasTexture(sunCv);
  function drawSunFace(mood) {
    const g = sunCv.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    g.save();
    g.translate(128, 128);
    g.fillStyle = '#ffd23f';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.save();
      g.rotate(a);
      g.beginPath();
      g.moveTo(-9, 66); g.lineTo(9, 66); g.lineTo(0, 66 + (i % 2 ? 38 : 28));
      g.closePath(); g.fill();
      g.restore();
    }
    const grad = g.createRadialGradient(0, 0, 10, 0, 0, 64);
    grad.addColorStop(0, '#fff6c8');
    grad.addColorStop(1, '#ffd23f');
    g.fillStyle = grad;
    g.beginPath(); g.arc(0, 0, 64, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#e8a13d'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = '#4a3320'; g.fillStyle = '#4a3320'; g.lineWidth = 6; g.lineCap = 'round';
    if (mood === 'happy') {
      for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 24, -12, 11, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      g.beginPath(); g.arc(0, 12, 26, 0.1 * Math.PI, 0.9 * Math.PI); g.closePath(); g.fill();
      g.fillStyle = '#ff9f80';
      for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 42, 8, 8, 0, Math.PI * 2); g.fill(); }
    } else if (mood === 'meh') {
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 24 - 10, -12); g.lineTo(s * 24 + 10, -12); g.stroke(); }
      g.beginPath(); g.moveTo(-18, 28); g.quadraticCurveTo(0, 20, 18, 30); g.stroke();
      g.fillStyle = '#7db8e8';
      g.beginPath(); g.arc(48, -36, 7, 0, Math.PI * 2); g.fill();
    } else { // idle: content little smile
      for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 24, -12, 6, 0, Math.PI * 2); g.fill(); }
      g.beginPath(); g.arc(0, 6, 24, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    }
    g.restore();
    sunTex.needsUpdate = true;
  }
  drawSunFace('idle');
  const sunFace = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26),
    new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, fog: false, depthWrite: false })
  );
  sunFace.position.set(90, 38, -75);
  sunFace.scale.setScalar(1.4);
  sunFace.lookAt(20, 4, 0); // angled to face the flight cameras, where reactions matter
  scene.add(sunFace);
  const sunBaseQ = sunFace.quaternion.clone();
  let sunCurrent = 'idle';
  let sunMoodT = 0;
  function sunMood(mood, hold = 3.5) {
    if (sunCurrent !== mood) { sunCurrent = mood; drawSunFace(mood); }
    sunMoodT = hold;
  }

  const clouds = [];
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xfff6ea, fog: false, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 2.5, 8, 8), cloudMat);
      puff.scale.y = 0.45;
      puff.position.set(j * 3.4 - 3, Math.random() * 0.8, Math.random() * 1.5);
      c.add(puff);
    }
    c.position.set(-40 + i * 38 + Math.random() * 12, 26 + Math.random() * 12, -70 + (i % 2) * 25);
    clouds.push(c);
    scene.add(c);
  }

  // --- ground: striped grass field + packed-dirt slapping lane ---
  const grassCv = document.createElement('canvas');
  grassCv.width = 128; grassCv.height = 16;
  const gg = grassCv.getContext('2d');
  gg.fillStyle = '#679a47'; gg.fillRect(0, 0, 128, 16);
  gg.fillStyle = '#5f9040'; gg.fillRect(0, 0, 64, 16);
  const grassTex = new THREE.CanvasTexture(grassCv);
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(20, 12);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 240),
    new THREE.MeshToonMaterial({ map: grassTex, gradientMap: gradTex }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(60, 0, 0);
  grass.receiveShadow = true;
  scene.add(grass);

  const dirtCv = document.createElement('canvas');
  dirtCv.width = 128; dirtCv.height = 64;
  const dg = dirtCv.getContext('2d');
  dg.fillStyle = '#b28a58'; dg.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 90; i++) {
    dg.fillStyle = Math.random() > 0.5 ? 'rgba(90,60,30,0.18)' : 'rgba(255,240,200,0.10)';
    dg.fillRect(Math.random() * 128, Math.random() * 64, 2, 2);
  }
  const dirtTex = new THREE.CanvasTexture(dirtCv);
  dirtTex.wrapS = dirtTex.wrapT = THREE.RepeatWrapping;
  dirtTex.repeat.set(28, 1);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(150, 5.4),
    new THREE.MeshToonMaterial({ map: dirtTex, gradientMap: gradTex }));
  lane.rotation.x = -Math.PI / 2;
  lane.position.set(52, 0.01, 0);
  lane.receiveShadow = true;
  scene.add(lane);

  // contest ring + chalk distance lines
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.4, 48),
    new THREE.MeshBasicMaterial({ color: 0xfff3d0 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0.5, 0.02, 0);
  scene.add(ring);

  const START_X = 0.95;

  // physical footprints of every SOLID structure — consumed by addSolids() so
  // flying bodies collide with what they can see instead of clipping through.
  // kind 'box': {x,z,ry,hx,hy,hz}  kind 'cyl': {x,z,r,h}
  const solids = [];

  const lineGeo = new THREE.PlaneGeometry(0.09, 5.2);
  for (let d = 0; d <= 100; d += 5) {
    const line = new THREE.Mesh(lineGeo,
      new THREE.MeshBasicMaterial({ color: 0xfffbe8, transparent: true, opacity: d === 0 ? 0.95 : 0.55 }));
    line.rotation.x = -Math.PI / 2;
    line.position.set(START_X + d, 0.021, 0);
    scene.add(line);
    if (d > 0) {
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.75),
        new THREE.MeshBasicMaterial({ map: makeTextTexture(`${d}m`), transparent: true })
      );
      label.rotation.x = -Math.PI / 2;
      label.rotation.z = -Math.PI / 2;
      label.position.set(START_X + d, 0.022, 2.1);
      scene.add(label);
    }
  }

  // --- post-and-rail fences ---
  const woodMat = toonMat(0x8a6844);
  const postGeo = new THREE.BoxGeometry(0.13, 1.0, 0.13);
  const posts = [];
  for (const s of [-1, 1]) for (let x = -8; x <= 58; x += 2.6) posts.push([x, s * 2.9]);
  const postIM = new THREE.InstancedMesh(postGeo, woodMat, posts.length);
  const pd = new THREE.Object3D();
  posts.forEach(([px, pz], i) => {
    pd.position.set(px, 0.5, pz);
    pd.rotation.y = Math.random() * 0.1;
    pd.updateMatrix();
    postIM.setMatrixAt(i, pd.matrix);
  });
  postIM.castShadow = true;
  scene.add(postIM);
  const fenceBits = [postIM]; // hidden on the Frozen Lake — snow drifts take over
  for (const s of [-1, 1]) for (const ry of [0.42, 0.8]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(66.5, 0.08, 0.06), woodMat);
    rail.position.set(25, ry, s * 2.92);
    scene.add(rail);
    fenceBits.push(rail);
  }

  // festive bunting — kept well clear of the camera's view of the ring.
  // Grouped so it hides on non-fair worlds (fairground pennants don't belong
  // in a therapy room or hell).
  const flagCols = [0xd8404f, 0xffd23f, 0x3f7fbf, 0xf2ede1, 0x5fae5a];
  const buntingG = new THREE.Group();
  for (const bx of [-5.5, 30]) {
    for (const s of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.7, 0.09), woodMat);
      pole.position.set(bx, 1.35, s * 2.95);
      buntingG.add(pole);
    }
    const tri = new THREE.Shape();
    tri.moveTo(-0.11, 0); tri.lineTo(0.11, 0); tri.lineTo(0, -0.3); tri.closePath();
    const triGeo = new THREE.ShapeGeometry(tri);
    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const f = new THREE.Mesh(triGeo, new THREE.MeshBasicMaterial({
        color: flagCols[i % flagCols.length], side: THREE.DoubleSide,
      }));
      f.position.set(bx, 2.62 - Math.sin(t * Math.PI) * 0.28, -2.9 + t * 5.8);
      buntingG.add(f);
    }
  }
  scene.add(buntingG);

  // --- barn + silo ---
  const barn = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(8, 4.6, 6.4), toonMat(0xa63b2c));
  body.position.y = 2.3;
  body.castShadow = true;
  barn.add(body);
  for (const s of [-1, 1]) {
    const slope = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.18, 6.9), toonMat(0x5a4632));
    slope.position.set(s * 2.05, 5.45, 0);
    slope.rotation.z = -s * 0.62;
    slope.castShadow = true;
    barn.add(slope);
  }
  const gable = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 6.2, 3, 1), toonMat(0xa63b2c));
  gable.rotation.set(Math.PI / 2, 0, 0);
  gable.position.y = 5.15;
  gable.scale.set(1, 1, 0.62);
  barn.add(gable);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), toonMat(0xf2ede1));
  door.position.set(0, 1.45, 3.22);
  barn.add(door);
  const doorX = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.22), toonMat(0xa63b2c));
  doorX.position.set(0, 1.45, 3.24);
  doorX.rotation.z = 0.6;
  barn.add(doorX);
  barn.position.set(18, 0, -11);
  scene.add(barn);

  const silo = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6.5, 14), toonMat(0xc9cdd6));
  tube.position.y = 3.25;
  tube.castShadow = true;
  silo.add(tube);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toonMat(0x9aa3b5));
  cap.position.y = 6.5;
  silo.add(cap);
  silo.position.set(25, 0, -10.5);
  scene.add(silo);

  // --- windmill (animated) ---
  const mill = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.85, 6.4, 4, 1, true), toonMat(0x9a8a70));
  tower.position.y = 3.2;
  mill.add(tower);
  const fan = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), toonMat(0x6b5a42));
  fan.add(hub);
  for (let i = 0; i < 6; i++) {
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 2.1), toonMat(0xd9cfb8));
    blade.material.side = THREE.DoubleSide;
    blade.position.y = 1.15;
    const arm = new THREE.Group();
    arm.add(blade);
    arm.rotation.z = (i / 6) * Math.PI * 2;
    fan.add(arm);
  }
  fan.position.set(0, 6.5, 0.5);
  mill.add(fan);
  mill.position.set(40, 0, -9);
  scene.add(mill);

  // --- tractor ---
  const tractor = new THREE.Group();
  const tBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 1.4), toonMat(0x3e7c31));
  tBody.position.y = 1.0;
  tBody.castShadow = true;
  tractor.add(tBody);
  const tCab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.3), toonMat(0x356a2a));
  tCab.position.set(-0.6, 1.95, 0);
  tractor.add(tCab);
  const tPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8), toonMat(0x333333));
  tPipe.position.set(0.9, 1.9, 0.3);
  tractor.add(tPipe);
  const wheelMat = toonMat(0x2b2b30);
  const hubMat = toonMat(0xf2c230);
  for (const [wx, wr, wz] of [[-0.75, 0.85, 1], [-0.75, 0.85, -1], [0.95, 0.5, 0.85], [0.95, 0.5, -0.85]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr, 0.4, 14), wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, wr, wz * 0.75);
    w.castShadow = true;
    tractor.add(w);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(wr * 0.45, wr * 0.45, 0.42, 10), hubMat);
    h.rotation.x = Math.PI / 2;
    h.position.copy(w.position);
    tractor.add(h);
  }
  tractor.position.set(9, 0, -8);
  tractor.rotation.y = 0.5;
  scene.add(tractor);

  // --- farmhouses: proper homesteads scattered across the county ---
  const farmhouses = [];
  function farmhouse(x, z, ry, wallCol, s = 1, sign = null) {
    const fh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(7, 11, 17), toonMat(wallCol));
    body.position.y = 5.5;
    fh.add(body);
    // gable prism sized to the 7-wide body, ridge running the 17-deep z axis
    const gGeo = new THREE.CylinderGeometry(3.5, 3.5, 17, 3, 1);
    gGeo.rotateY(Math.PI);     // put the triangle's apex vertex where...
    gGeo.rotateX(Math.PI / 2); // ...this tips it to point straight up
    const gable = new THREE.Mesh(gGeo, toonMat(wallCol));
    gable.position.y = 11.0;
    gable.scale.y = 0.75;
    fh.add(gable);
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.3, 17.6), toonMat(0x5a4632));
    roofL.position.set(-1.85, 12.35, 0);
    roofL.rotation.z = -0.62;
    fh.add(roofL);
    const roofR = roofL.clone();
    roofR.position.x = 1.85;
    roofR.rotation.z = 0.62;
    fh.add(roofR);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.6), toonMat(0xf2ede1));
    door.position.set(-3.52, 2.3, 0);
    door.rotation.y = -Math.PI / 2;
    fh.add(door);
    const doorX = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.35), toonMat(wallCol));
    doorX.position.set(-3.54, 2.3, 0);
    doorX.rotation.y = -Math.PI / 2;
    doorX.rotation.z = 0.5;
    fh.add(doorX);
    for (const wz of [-5.5, 5.5]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), toonMat(0xcfe0e8));
      win.position.set(-3.52, 7.2, wz);
      win.rotation.y = -Math.PI / 2;
      fh.add(win);
    }
    if (sign) {
      const houseSign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.6),
        new THREE.MeshBasicMaterial({ map: makeTextTexture(sign, '#ffd23f'), transparent: true }));
      houseSign.position.set(-3.55, 10.2, 0);
      houseSign.rotation.y = -Math.PI / 2;
      fh.add(houseSign);
    }
    fh.children.forEach((m) => { m.castShadow = true; });
    fh.scale.setScalar(s);
    fh.rotation.y = ry;
    fh.position.set(x, 0, z);
    scene.add(fh);
    farmhouses.push(fh); // hidden on the Frozen Lake; igloos stand in their spots
    solids.push({ kind: 'box', x, z, ry, hx: 3.6 * s, hy: 5.6 * s, hz: 8.6 * s });
  }
  farmhouse(96, 19, -0.55, 0x9c3a2c, 1, 'SLAPP ACRES');
  farmhouse(84, -27, 0.5, 0xe3dbc8, 0.85);
  farmhouse(108, -14, -0.2, 0x6f8fa8, 0.9);
  farmhouse(58, 31, 0.9, 0xc9a44a, 0.75);

  // --- the 20m CRASH ZONE barricade: purely visual (never stops the flyer),
  // explodes into debris when a volunteer sails through it ---
  const barricade = { pieces: [], broken: false };
  {
    const bx = START_X + 20;
    const red = toonMat(0xd8404f), white = toonMat(0xf2ede1);
    const addPiece = (mesh) => {
      mesh.castShadow = true;
      scene.add(mesh);
      barricade.pieces.push({ mesh, homeP: mesh.position.clone(), homeQ: mesh.quaternion.clone() });
    };
    // a proper WALL — tall enough that flyers punch through it, not over it
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.8, 0.16), woodMat);
      post.position.set(bx, 2.4, s * 2.55);
      addPiece(post);
    }
    for (let rail = 0; rail < 9; rail++) {
      for (let seg = 0; seg < 4; seg++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 1.28), (rail + seg) % 2 ? white : red);
        m.position.set(bx, 0.45 + rail * 0.5, -1.9 + seg * 1.27);
        addPiece(m);
      }
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('CRASH ZONE', '#ffffff'), transparent: true, side: THREE.DoubleSide }));
    sign.position.set(bx, 5.15, 0);
    sign.rotation.y = -Math.PI / 2;
    addPiece(sign);
  }
  const debris = [];
  function breakBarricade(vx) {
    if (barricade.broken) return;
    barricade.broken = true;
    for (const p of barricade.pieces) {
      debris.push({
        mesh: p.mesh,
        v: new THREE.Vector3(vx * (0.5 + Math.random() * 0.4), 2 + Math.random() * 3.5, (Math.random() - 0.5) * 4),
        av: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12),
      });
    }
  }
  function resetBarricade() {
    barricade.broken = false;
    debris.length = 0;
    for (const p of barricade.pieces) {
      p.mesh.position.copy(p.homeP);
      p.mesh.quaternion.copy(p.homeQ);
    }
  }

  // --- biome tinting: world-dependent recolors for greenery & structures ---
  // A material/IM registers once with a VARIANT MAP ({ ice: hex, desert: hex, … });
  // setBiome(key) applies that biome's color (or restores base when key is null
  // or the entry has no variant for it). Base colors are captured at registration
  // (mats) / lazily on first tint (instanced meshes). winterMat/winterIM are the
  // legacy single-variant aliases — existing ice call-sites keep working as-is.
  const seasonMats = [];
  const biomeMat = (mat, variants) => {
    if (typeof variants === 'number') variants = { ice: variants };
    seasonMats.push({ mat, base: mat.color.getHex(), variants });
    return mat;
  };
  const winterMat = (mat, hex) => biomeMat(mat, { ice: hex });
  const seasonIMs = [];
  const biomeIM = (im, n, variants) => {
    if (typeof variants === 'number') variants = { ice: variants };
    seasonIMs.push({ im, n, variants, orig: null });
    return im;
  };
  const winterIM = (im, n, hex) => biomeIM(im, n, { ice: hex });
  function setBiome(key) {
    for (const e of seasonMats) {
      const v = key != null ? e.variants[key] : null;
      e.mat.color.setHex(v != null ? v : e.base);
    }
    const c = new THREE.Color();
    for (const e of seasonIMs) {
      if (!e.im.instanceColor) continue;
      const v = key != null ? e.variants[key] : null;
      if (v != null && !e.orig) e.orig = e.im.instanceColor.array.slice();
      if (!e.orig) continue;
      for (let i = 0; i < e.n; i++) {
        if (v != null) c.setHex(v).offsetHSL(0, 0, -(i % 4) * 0.02);
        else c.fromArray(e.orig, i * 3);
        e.im.setColorAt(i, c);
      }
      e.im.instanceColor.needsUpdate = true;
    }
  }

  // --- hay: round bales, a stack, and the crash wall at the end of the lane ---
  // (in winter the shared mats swap to white — every bale becomes a snow drift
  // and the 62m crash wall becomes a wall of packed snow)
  const hayMat = biomeMat(toonMat(0xd9b96a), { ice: 0xeef4f8, desert: 0xd8b878, lava: 0x3a2f2a, hell: 0x3a2320, heaven: 0xf2eede, dojo: 0xd9c9a8, therapy: 0x9a8ab0, haunted: 0x6a6a5e, tech: 0xd0d4da, jungle: 0x5a7a4a });
  const hayEnd = biomeMat(toonMat(0xc4a355), { ice: 0xe2ebf2, desert: 0xc9a86a, lava: 0x322824, hell: 0x2f1e1c, heaven: 0xe8e2d4, dojo: 0xc9b490, therapy: 0x8a7aa8, haunted: 0x565648, tech: 0xb4bac4, jungle: 0x4a6a3a });
  function roundBale(x, z, ry) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 14), hayMat);
    b.rotation.set(0, ry, Math.PI / 2);
    b.position.set(x, 0.75, z);
    b.castShadow = true;
    scene.add(b);
  }
  roundBale(3, -6.5, 0.3);
  roundBale(33, -7, -0.2);
  roundBale(50, -6.2, 0.7);
  roundBale(-5.5, 6.4, 1.2);
  const baleGeo = new THREE.BoxGeometry(1.8, 1.15, 1.5);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(baleGeo, (i + row) % 2 ? hayMat : hayEnd);
      b.position.set(60.3 + row * 0.12, 0.58 + row * 1.16, -3.6 + i * 1.75 + (row % 2) * 0.6);
      b.rotation.y = (Math.random() - 0.5) * 0.12;
      b.castShadow = true;
      scene.add(b);
    }
  }
  for (const [sx, sz] of [[14, 6.8], [43, 7.2]]) {
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(baleGeo, hayMat);
      b.position.set(sx + (i % 2) * 0.3, 0.58 + i * 1.16 * (i < 2 ? 0 : 1) + (i === 1 ? 0 : 0), sz + (i === 1 ? 1.6 : 0));
      if (i === 2) b.position.y = 1.74;
      b.rotation.y = (Math.random() - 0.5) * 0.3;
      b.castShadow = true;
      scene.add(b);
    }
  }

  // --- corn patch ---
  const cornIM = new THREE.InstancedMesh(new THREE.ConeGeometry(0.16, 1.8, 5), toonMat(0xffffff), 180);
  const cc = new THREE.Color();
  for (let i = 0; i < 180; i++) {
    pd.position.set(26 + Math.random() * 18, 0.9, -6.8 - Math.random() * 4.5);
    pd.rotation.y = Math.random() * Math.PI;
    pd.scale.setScalar(0.85 + Math.random() * 0.35);
    pd.updateMatrix();
    cornIM.setMatrixAt(i, pd.matrix);
    cornIM.setColorAt(i, cc.setHSL(0.24, 0.5, 0.32 + Math.random() * 0.12));
  }
  scene.add(biomeIM(cornIM, 180, { ice: 0xd9cfa8, desert: 0xcbb187, lava: 0x2a2220, hell: 0x2a1a18, heaven: 0xf0d060, dojo: 0xa8b86a, therapy: 0x7a6a94, haunted: 0x5a5244, tech: 0x4a5560 }));

  // --- trees ---
  const sceneTrees = []; // leafy trees — hidden on non-fair worlds (with orchardTrees)
  function tree(x, z, s = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.4, 8), toonMat(0x6b4a2e));
    trunk.position.y = 1.2;
    trunk.castShadow = true;
    g.add(trunk);
    for (const [ox, oy, oz, r] of [[0, 3.1, 0, 1.5], [0.9, 2.5, 0.3, 1.0], [-0.9, 2.6, -0.2, 1.1]]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), biomeMat(toonMat(0x4e7d3a), { ice: 0xe9f0f4, desert: 0x8a8f5a, lava: 0x3a2a26, hell: 0x33201e, heaven: 0xf6f2e8, therapy: 0x8a7aa8, haunted: 0x3a4438, tech: 0x4f9e4f }));
      puff.position.set(ox, oy, oz);
      puff.castShadow = true;
      g.add(puff);
    }
    g.scale.setScalar(s);
    g.position.set(x, 0, z);
    scene.add(g);
    sceneTrees.push(g);
  }
  tree(-7, -9, 1.3);
  tree(52, -13, 1.6);
  tree(31, -15, 1.2);
  tree(-10, 8, 1.1);
  tree(24, 9.5, 1.0);

  // --- the flight country: the lane past the ring is a farm, not a wasteland ---
  // tall corn walls dress the invisible world-edge funnels (z ±11) — a flyer
  // that drifts wide visibly crashes into the crops instead of thin air
  const edgeCornIM = new THREE.InstancedMesh(new THREE.ConeGeometry(0.17, 2.2, 5), toonMat(0xffffff), 280);
  for (let i = 0; i < 280; i++) {
    const side = i % 2 ? 1 : -1;
    pd.position.set(26 + Math.random() * 48, 1.05, side * (10.0 + Math.random() * 1.8));
    pd.rotation.y = Math.random() * Math.PI;
    pd.scale.setScalar(0.9 + Math.random() * 0.55);
    pd.updateMatrix();
    edgeCornIM.setMatrixAt(i, pd.matrix);
    edgeCornIM.setColorAt(i, cc.setHSL(0.23, 0.5, 0.3 + Math.random() * 0.14));
  }
  scene.add(biomeIM(edgeCornIM, 280, { ice: 0xd9cfa8, desert: 0xcbb187, lava: 0x2a2220, hell: 0x2a1a18, heaven: 0xf0d060, dojo: 0xa8b86a, therapy: 0x7a6a94, haunted: 0x5a5244, tech: 0x4a5560 }));

  const fairDecor = []; // every fair/farm prop that must vanish on non-fair worlds
  function scarecrow(x, z, ry = 0) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 6), toonMat(0x8a6a42));
    pole.position.y = 1.1;
    g.add(pole);
    const arms = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), toonMat(0x8a6a42));
    arms.rotation.z = Math.PI / 2;
    arms.position.y = 1.55;
    g.add(arms);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.52, 0.24), toonMat(0xb0563a));
    shirt.position.y = 1.32;
    g.add(shirt);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), toonMat(0xd9c27f));
    head.position.y = 1.85;
    g.add(head);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.035, 10), toonMat(0xcfae5c));
    brim.position.y = 1.95;
    g.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 10), toonMat(0xcfae5c));
    crown.position.y = 2.01;
    g.add(crown);
    g.traverse((o) => { o.castShadow = true; });
    g.rotation.y = ry;
    g.position.set(x, 0, z);
    scene.add(g);
    fairDecor.push(g);
    solids.push({ kind: 'cyl', x, z, r: 0.3, h: 2.1 });
  }
  scarecrow(30, 5.6, -0.5);
  scarecrow(47, -6.4, 0.7);

  // pumpkin patch
  for (let i = 0; i < 12; i++) {
    const r = 0.14 + Math.random() * 0.16;
    const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), biomeMat(toonMat(0xd8722d), { ice: 0xc9a06a, desert: 0xc9a06a }));
    p.scale.y = 0.72;
    p.position.set(36 + Math.random() * 8, r * 0.68, -4.6 - Math.random() * 2.8);
    p.castShadow = true;
    scene.add(p);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.09, 5), biomeMat(toonMat(0x5c7a3a), { ice: 0x6e5a40, desert: 0x6e5a40 }));
    stem.position.set(p.position.x, r * 1.15, p.position.z);
    scene.add(stem);
  }

  // the outhouse: every fair has one, nobody admits to it
  {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.2, 1.05), toonMat(0x7d5a38));
    body.position.y = 1.1;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 1.3), toonMat(0x5c422a));
    roof.position.y = 2.26;
    roof.rotation.z = 0.08;
    g.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.7, 0.62), toonMat(0x8f6a44));
    door.position.set(-0.55, 1.0, 0);
    g.add(door);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), new THREE.MeshBasicMaterial({ color: 0xf5efdc }));
    moon.position.set(-0.58, 1.62, 0);
    moon.rotation.y = -Math.PI / 2;
    g.add(moon);
    const moonBite = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), new THREE.MeshBasicMaterial({ color: 0x8f6a44 }));
    moonBite.position.set(-0.581, 1.66, 0.035);
    moonBite.rotation.y = -Math.PI / 2;
    g.add(moonBite);
    g.traverse((o) => { o.castShadow = true; });
    g.rotation.y = 0.4;
    g.position.set(52, 0, 7);
    scene.add(g);
    solids.push({ kind: 'box', x: 52, z: 7, ry: 0.4, hx: 0.55, hy: 1.15, hz: 0.55 });
  }

  // clothesline: laundry day waits for no slapping contest
  const cloths = [];
  {
    const lineMat = toonMat(0x9a8f7a);
    for (const px of [40, 44.5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.9, 6), toonMat(0x8a6a42));
      post.position.set(px, 0.95, -7.6);
      post.castShadow = true;
      scene.add(post);
    }
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 4.5, 4), lineMat);
    line.rotation.z = Math.PI / 2;
    line.position.set(42.25, 1.82, -7.6);
    scene.add(line);
    const colors = [0xd8687a, 0xf2ede1, 0x6f9fd8];
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.PlaneGeometry(0.62, 0.72);
      geo.translate(0, -0.36, 0); // hang from the line
      const m = toonMat(colors[i]);
      m.side = THREE.DoubleSide;
      const cloth = new THREE.Mesh(geo, m);
      cloth.position.set(40.9 + i * 1.15, 1.82, -7.6);
      cloth.castShadow = true;
      scene.add(cloth);
      cloths.push({ mesh: cloth, ph: i * 1.7 });
    }
  }

  // sunflower sentries along the far lane
  function sunflower(x, z, s = 1) {
    const g = new THREE.Group();
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.5, 6), biomeMat(toonMat(0x5c7a3a), { ice: 0x8a7454, desert: 0x8a7454 }));
    stalk.position.y = 0.75;
    g.add(stalk);
    const face = new THREE.Group();
    face.position.y = 1.55;
    face.rotation.y = -Math.PI / 2; // greets the incoming flyer
    face.rotation.x = 0.15;
    const petals = new THREE.Mesh(new THREE.CircleGeometry(0.24, 12), biomeMat(toonMat(0xf2c53d), { ice: 0xb5946a, desert: 0xb5946a }));
    petals.material.side = THREE.DoubleSide;
    face.add(petals);
    const heart = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), toonMat(0x6e4a2a));
    heart.position.x = 0.001;
    heart.material.side = THREE.DoubleSide;
    heart.position.z = 0.01;
    face.add(heart);
    g.add(face);
    g.scale.setScalar(s);
    g.traverse((o) => { o.castShadow = true; });
    g.position.set(x, 0, z);
    scene.add(g);
    fairDecor.push(g);
  }
  for (let i = 0; i < 6; i++) sunflower(56 + i * 2.4, 6.4 + (i % 3) * 0.9, 0.9 + Math.random() * 0.4);
  for (let i = 0; i < 4; i++) sunflower(60 + i * 2.8, -6.8 - (i % 2) * 1.1, 0.9 + Math.random() * 0.4);

  // a rustic rail fence framing the +z edge of the lane (gone in winter)
  {
    const fenceMat = toonMat(0x8a6a42);
    for (let x = 26; x <= 74; x += 4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), fenceMat);
      post.position.set(x, 0.5, 9.6);
      post.castShadow = true;
      scene.add(post);
      fenceBits.push(post);
    }
    for (const y of [0.5, 0.85]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(48, 0.07, 0.06), fenceMat);
      rail.position.set(50, y, 9.6);
      scene.add(rail);
      fenceBits.push(rail);
    }
  }

  // --- birds: they mind their own business at flight altitude. Mostly. ---
  const birds = [];
  function makeBird() {
    const g = new THREE.Group();
    const col = Math.random() < 0.35 ? 0x3a3f4a : 0xece7db;
    const mat = toonMat(col);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat);
    body.scale.set(1.6, 0.85, 0.8);
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat);
    head.position.set(0.17, 0.08, 0);
    g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 6), toonMat(0xe8912d));
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.25, 0.08, 0);
    g.add(beak);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.1), mat);
    tail.position.set(-0.2, 0.02, 0);
    g.add(tail);
    const wm = toonMat(col);
    wm.side = THREE.DoubleSide;
    const wings = [];
    for (const s of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(0.16, 0.3);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, 0, s * 0.17);
      const w = new THREE.Mesh(geo, wm);
      g.add(w);
      wings.push({ m: w, s });
    }
    return { g, wings };
  }
  for (let i = 0; i < 6; i++) {
    const b = makeBird();
    scene.add(b.g);
    birds.push({
      g: b.g, wings: b.wings,
      cx: 24 + i * 8 + Math.random() * 4,
      cy: 5.5 + Math.random() * 6,
      cz: (Math.random() - 0.5) * 8,
      r: 2.5 + Math.random() * 4,
      w: (0.25 + Math.random() * 0.3) * (i % 2 ? 1 : -1),
      ph: Math.random() * Math.PI * 2,
      flap: 7 + Math.random() * 4,
      scared: 0, v: null,
    });
  }

  const featherGeo = new THREE.PlaneGeometry(0.11, 0.05);
  function spawnFeathers(p) {
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(featherGeo, new THREE.MeshBasicMaterial({
        color: Math.random() < 0.5 ? 0xf5f2ea : 0xd8d2c4,
        transparent: true, side: THREE.DoubleSide, depthWrite: false,
      }));
      m.position.copy(p);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      scene.add(m);
      fx.push({
        mesh: m, t: 0, life: 1.5 + Math.random() * 0.8, type: 'feather',
        v: new THREE.Vector3((Math.random() - 0.5) * 3, 0.8 + Math.random() * 2, (Math.random() - 0.5) * 3),
        av: new THREE.Vector3(Math.random() * 7, Math.random() * 7, Math.random() * 7),
      });
    }
  }

  // a flyer barging through the flock: feathers, outrage, evacuation
  function scareBirds(pos) {
    let n = 0;
    for (const b of birds) {
      if (b.scared > 0) continue;
      const dx = b.g.position.x - pos.x;
      const dy = b.g.position.y - pos.y;
      const dz = b.g.position.z - pos.z;
      if (dx * dx + dy * dy + dz * dz < 2.9) {
        n++;
        b.scared = 2.8;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.5;
        b.v = new THREE.Vector3(dx / d, Math.abs(dy / d) + 0.8, dz / d).normalize().multiplyScalar(8 + Math.random() * 3);
        spawnFeathers(b.g.position);
      }
    }
    return n;
  }

  // --- SLAPP COUNTY: the world is bigger than any slap. Champions land in
  // real places now — the corn, the orchards, somebody's front yard. ---

  // the great cornfield: dead ahead past the hay wall. Long flights END here.
  const fieldCornIM = new THREE.InstancedMesh(new THREE.ConeGeometry(0.17, 2.1, 5), toonMat(0xffffff), 420);
  for (let i = 0; i < 420; i++) {
    pd.position.set(64 + Math.random() * 32, 1.0, -10 + Math.random() * 20);
    pd.rotation.y = Math.random() * Math.PI;
    pd.scale.setScalar(0.85 + Math.random() * 0.5);
    pd.updateMatrix();
    fieldCornIM.setMatrixAt(i, pd.matrix);
    fieldCornIM.setColorAt(i, cc.setHSL(0.23, 0.5, 0.3 + Math.random() * 0.14));
  }
  scene.add(biomeIM(fieldCornIM, 420, { ice: 0xd9cfa8, desert: 0xcbb187, lava: 0x2a2220, hell: 0x2a1a18, heaven: 0xf0d060, dojo: 0xa8b86a, therapy: 0x7a6a94, haunted: 0x5a5244, tech: 0x4a5560 }));

  // fruit trees: apples red, oranges orange, both delicious at 30 m/s
  const orchardTrees = []; // hidden on non-fair worlds (no apple groves on the lava sea)
  function fruitTree(x, z, fruitCol, leafCol, s = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.9, 8), toonMat(0x6b4a2e));
    trunk.position.y = 0.95;
    g.add(trunk);
    const blob = new THREE.Mesh(new THREE.SphereGeometry(1.35, 10, 10), biomeMat(toonMat(leafCol), { ice: 0xe9f0f4, desert: 0x8a8f5a, lava: 0x3a2a26, hell: 0x33201e, heaven: 0xf6f2e8, therapy: 0x8a7aa8, haunted: 0x3a4438, tech: 0x4f9e4f }));
    blob.scale.set(1, 0.85, 1);
    blob.position.y = 2.6;
    g.add(blob);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random();
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 7), biomeMat(toonMat(fruitCol), { ice: 0xe9f0f4, desert: 0xb08d54 }));
      fruit.position.set(Math.cos(a) * 1.15, 2.2 + Math.random() * 0.9, Math.sin(a) * 1.15);
      g.add(fruit);
    }
    // windfall fruit in the grass
    for (let i = 0; i < 2; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.08, 7, 7), biomeMat(toonMat(fruitCol), { ice: 0xe9f0f4, desert: 0xb08d54 }));
      drop.position.set((Math.random() - 0.5) * 2.4, 0.08, (Math.random() - 0.5) * 2.4);
      g.add(drop);
    }
    g.traverse((o) => { o.castShadow = true; });
    g.scale.setScalar(s);
    g.position.set(x, 0, z);
    scene.add(g);
    orchardTrees.push(g);
    solids.push({ kind: 'cyl', x, z, r: 0.3 * s, h: 2.0 * s });
  }
  // apple orchard, north-east of the corn
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      fruitTree(72 + c * 8 + Math.random() * 2, 13 + r * 6.5 + Math.random() * 2, 0xd8352e, 0x4e7d3a, 0.9 + Math.random() * 0.35);
    }
  }
  // orange grove, south side
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      fruitTree(78 + c * 9 + Math.random() * 2, -28 + r * 6 + Math.random() * 2, 0xe8912d, 0x3f6e35, 0.85 + Math.random() * 0.3);
    }
  }

  // the pond: still water, tall reeds, zero lifeguards
  let pondWater = null; // retinted to ice by setWorldTheme('ice')
  {
    const water = new THREE.Mesh(new THREE.CircleGeometry(6, 24), toonMat(0x5b9bd0));
    water.rotation.x = -Math.PI / 2;
    water.position.set(40, 0.03, 24);
    scene.add(water);
    pondWater = water;
    const rim = new THREE.Mesh(new THREE.RingGeometry(6, 6.8, 24), biomeMat(toonMat(0xc9b88a), { ice: 0xe9f2f8, desert: 0xb09a6a }));
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(40, 0.02, 24);
    scene.add(rim);
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.9 + Math.random() * 0.6, 4), biomeMat(toonMat(0x5c7a3a), { ice: 0xcbb98a, desert: 0x9a8a6a }));
      reed.position.set(40 + Math.cos(a) * (5.6 + Math.random()), 0.5, 24 + Math.sin(a) * (5.6 + Math.random()));
      scene.add(reed);
      fairDecor.push(reed);
    }
  }

  // watermelon patch by the ring-side fence
  for (let i = 0; i < 8; i++) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.1, 10, 8), biomeMat(toonMat(0x3f7d3a), { ice: 0xeaf1f6, desert: 0xb0a06a }));
    w.scale.set(1.35, 0.8, 1);
    w.rotation.y = Math.random() * Math.PI;
    w.position.set(26 + Math.random() * 6, 0.16, -15.5 - Math.random() * 3);
    w.castShadow = true;
    scene.add(w);
    fairDecor.push(w);
  }

  // the county line: cross it airborne and you're a local legend
  {
    const signG = new THREE.Group();
    for (const pz of [-1.6, 1.6]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.4, 8), toonMat(0x8a6a42));
      post.position.set(0, 1.7, pz);
      signG.add(post);
    }
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 4.4), toonMat(0xf2ede1));
    board.position.y = 3.0;
    signG.add(board);
    const txt = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.9),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('SLAPP COUNTY LINE', '#8a3a2c'), transparent: true }));
    txt.position.set(-0.08, 3.0, 0);
    txt.rotation.y = -Math.PI / 2;
    signG.add(txt);
    signG.traverse((o) => { o.castShadow = true; });
    signG.position.set(80, 0, 5.5);
    scene.add(signG);
    fairDecor.push(signG);
  }

  // perimeter forest: the TRUE edge of the world, dressed as dense conifers
  // exactly where the physics catches — nobody ever hits an invisible wall.
  // The DESERT re-dresses the SAME line as saguaro + red rock (cactusBelt).
  let coniferCaps = null;
  let coniferIM = null;
  let cactusBelt = null;
  let perimSpots = null; // the perimeter dressing line — every world re-dresses THESE spots
  {
    const spots = [];
    for (let z = -36; z <= 36; z += 2.4) spots.push([115.5 + Math.random() * 3, z + Math.random()]);        // far treeline
    for (let x = -18; x <= 113; x += 2.6) spots.push([x + Math.random(), 35.5 + Math.random() * 3]);        // north woods
    for (let x = -18; x <= 113; x += 2.6) spots.push([x + Math.random(), -35.5 - Math.random() * 3]);       // south woods
    for (let z = -34; z <= 34; z += 3.2) spots.push([-20.5 - Math.random() * 2, z + Math.random()]);        // behind the fair
    const conifer = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 7, 7), toonMat(0xffffff), spots.length);
    // matching white caps: the top half of every tree buried in snow (ice only)
    const caps = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 7, 7), toonMat(0xf4f8fb), spots.length);
    for (let i = 0; i < spots.length; i++) {
      pd.position.set(spots[i][0], 3.2, spots[i][1]);
      pd.rotation.y = Math.random() * Math.PI;
      const sc = 0.8 + Math.random() * 0.6;
      const sy = sc * (0.9 + Math.random() * 0.4);
      pd.scale.set(sc, sy, sc);
      pd.updateMatrix();
      conifer.setMatrixAt(i, pd.matrix);
      conifer.setColorAt(i, cc.setHSL(0.32, 0.35, 0.2 + Math.random() * 0.1));
      pd.position.y = 3.2 + 1.75 * sy;            // cap tip meets the tree tip
      pd.scale.set(sc * 0.55, sy * 0.5, sc * 0.55); // a touch wider than the trunk cone
      pd.updateMatrix();
      caps.setMatrixAt(i, pd.matrix);
    }
    conifer.castShadow = true;
    caps.visible = false;
    coniferCaps = caps;
    scene.add(caps);
    coniferIM = conifer;
    scene.add(winterIM(conifer, spots.length, 0xc9d8d2));

    // the desert's edge: saguaros + red rocks on the SAME perimeter spots
    cactusBelt = new THREE.Group();
    const cacMat = toonMat(0x5f7a44), rockMat = toonMat(0xb06a3c);
    for (let i = 0; i < spots.length; i += 2) {
      const [cx, cz] = spots[i];
      if (i % 8 === 0) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 + Math.random() * 0.8), rockMat);
        rock.position.set(cx, 0.7, cz);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        cactusBelt.add(rock);
        continue;
      }
      const s = 0.8 + Math.random() * 0.7;
      const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.42 * s, 3.4 * s, 4, 7), cacMat);
      trunk.position.set(cx, 1.9 * s, cz);
      cactusBelt.add(trunk);
      if (i % 6 === 0) {
        for (const sgn of [-1, 1]) {
          const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.24 * s, 1.1 * s, 3, 6), cacMat);
          arm.position.set(cx, 2.2 * s, cz + sgn * 0.75 * s);
          arm.rotation.x = sgn * -0.5;
          cactusBelt.add(arm);
        }
      }
    }
    cactusBelt.traverse((m) => { m.castShadow = true; });
    cactusBelt.visible = false;
    scene.add(cactusBelt);
    perimSpots = spots;
  }

  // distant hills close the horizon — the county rolls on to ~200m
  for (const [hx, hz, hr, hh] of [[190, -60, 90, 26], [170, 80, 80, 20], [-90, -120, 100, 24], [40, 190, 110, 26], [230, 40, 100, 30]]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 16, 12), biomeMat(toonMat(0x6e8f5a), { ice: 0xe6edf5, desert: 0xc9a05e, lava: 0x2a2024, hell: 0x2a1518, heaven: 0xf2efe4, therapy: 0x9a8fc0, haunted: 0x27352c, tech: 0x8aa88e }));
    hill.scale.set(1, hh / hr, 1);
    hill.position.set(hx, -hr * 0.35, hz);
    scene.add(hill);
  }

  // solid footprints for the ring-side structures built above (coordinates
  // mirror their meshes) — bodies bounce off the barn, not through it
  solids.push(
    { kind: 'box', x: 18, z: -11, ry: 0, hx: 4.6, hy: 3.4, hz: 3.4 },   // barn
    { kind: 'cyl', x: 25, z: -10.5, r: 2.1, h: 9 },                     // silo
    { kind: 'cyl', x: 40, z: -9, r: 1.1, h: 7.5 },                      // windmill tower
    { kind: 'cyl', x: 9, z: -8, r: 1.7, h: 2.2 },                       // tractor
    { kind: 'cyl', x: -7, z: -9, r: 0.45, h: 3.2 },                     // trees (trunks)
    { kind: 'cyl', x: 52, z: -13, r: 0.55, h: 3.6 },
    { kind: 'cyl', x: 31, z: -15, r: 0.4, h: 3 },
    { kind: 'cyl', x: -10, z: 8, r: 0.4, h: 3 },
    { kind: 'cyl', x: 24, z: 9.5, r: 0.35, h: 2.8 },
    { kind: 'cyl', x: 14, z: 6.8, r: 1.5, h: 2.4 },                     // hay stacks
    { kind: 'cyl', x: 43, z: 7.2, r: 1.5, h: 2.4 },
    { kind: 'cyl', x: 3, z: -6.5, r: 1.0, h: 1.5 },                     // round bales
    { kind: 'cyl', x: 33, z: -7, r: 1.0, h: 1.5 },
    { kind: 'cyl', x: 50, z: -6.2, r: 1.0, h: 1.5 },
    { kind: 'cyl', x: -5.5, z: 6.4, r: 1.0, h: 1.5 },
  );

  // --- farm animals: they wander, graze, and generally improve morale ---
  function makeChicken() {
    const g = new THREE.Group();
    const cBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), toonMat(0xf5f2ea));
    cBody.scale.set(1.2, 1, 0.9);
    cBody.position.y = 0.2;
    g.add(cBody);
    const cHead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), toonMat(0xf5f2ea));
    cHead.position.set(0.17, 0.36, 0);
    g.add(cHead);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), toonMat(0xe8912d));
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.26, 0.36, 0);
    g.add(beak);
    const comb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), toonMat(0xd8404f));
    comb.position.set(0.15, 0.45, 0);
    g.add(comb);
    return { g, headG: null, peck: true };
  }

  function makeSheep() {
    const g = new THREE.Group();
    const fluff = new THREE.Mesh(new THREE.SphereGeometry(0.34, 9, 8), toonMat(0xf2efe6));
    fluff.scale.set(1.25, 0.95, 0.95);
    fluff.position.y = 0.55;
    fluff.castShadow = true;
    g.add(fluff);
    const headG = new THREE.Group();
    headG.position.set(0.4, 0.62, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), toonMat(0x4a4038));
    head.position.set(0.12, 0, 0);
    headG.add(head);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.09), toonMat(0x4a4038));
      ear.position.set(0.1, 0.06, s * 0.1);
      headG.add(ear);
    }
    g.add(headG);
    for (const [lx, lz] of [[-0.18, 0.13], [-0.18, -0.13], [0.2, 0.13], [0.2, -0.13]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 6), toonMat(0x3a322c));
      leg.position.set(lx, 0.16, lz);
      g.add(leg);
    }
    return { g, headG };
  }

  function makePig() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.3, 4, 8), toonMat(0xe8a3a8));
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.28;
    body.castShadow = true;
    g.add(body);
    const headG = new THREE.Group();
    headG.position.set(0.32, 0.3, 0);
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.08, 8), toonMat(0xd98f96));
    snout.rotation.z = Math.PI / 2;
    snout.position.set(0.09, 0, 0);
    headG.add(snout);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 5), toonMat(0xd98f96));
      ear.position.set(-0.02, 0.14, s * 0.09);
      ear.rotation.z = 0.4;
      headG.add(ear);
    }
    g.add(headG);
    for (const [lx, lz] of [[-0.15, 0.1], [-0.15, -0.1], [0.15, 0.1], [0.15, -0.1]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 6), toonMat(0xd98f96));
      leg.position.set(lx, 0.09, lz);
      g.add(leg);
    }
    return { g, headG };
  }

  function makeCow() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.52, 0.45), toonMat(0x8a6844));
    body.position.y = 0.6;
    body.castShadow = true;
    g.add(body);
    const patch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.47), toonMat(0xf2efe6));
    patch.position.set(-0.15, 0.62, 0);
    g.add(patch);
    const headG = new THREE.Group();
    headG.position.set(0.55, 0.72, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.2), toonMat(0xf2efe6));
    head.position.set(0.1, 0, 0);
    headG.add(head);
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 5), toonMat(0xe8dcc0));
      horn.position.set(0.05, 0.15, s * 0.09);
      headG.add(horn);
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.1), toonMat(0x8a6844));
      ear.position.set(0.04, 0.05, s * 0.16);
      headG.add(ear);
    }
    g.add(headG);
    for (const [lx, lz] of [[-0.35, 0.15], [-0.35, -0.15], [0.35, 0.15], [0.35, -0.15]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 6), toonMat(0x6b5136));
      leg.position.set(lx, 0.21, lz);
      g.add(leg);
    }
    return { g, headG };
  }

  const animals = [];
  function addAnimal(build, region, speed, kind) {
    const critter = build();
    critter.g.position.set(
      region.x0 + Math.random() * (region.x1 - region.x0),
      0,
      region.z0 + Math.random() * (region.z1 - region.z0)
    );
    scene.add(critter.g);
    animals.push({
      ...critter, region, speed, kind,
      heading: Math.random() * Math.PI * 2,
      mode: 'walk',
      t: 2 + Math.random() * 3,
      phase: Math.random() * 6,
      mooT: 0,
    });
  }
  const northField = { x0: -6, x1: 46, z0: -12.5, z1: -7.5 };
  const southField = { x0: -6, x1: 24, z0: 7.5, z1: 11 };
  addAnimal(makeSheep, northField, 0.35);
  addAnimal(makeSheep, northField, 0.3);
  addAnimal(makeSheep, northField, 0.4);
  addAnimal(makeCow, northField, 0.25, 'cow');

  // the cow salutes truly great slaps
  function cowMoo() {
    for (const a of animals) if (a.kind === 'cow') a.mooT = 1.5;
  }
  addAnimal(makePig, southField, 0.5);
  addAnimal(makePig, southField, 0.45);
  addAnimal(makeChicken, { x0: -5.5, x1: 1, z0: 4, z1: 6.2 }, 0.3);
  addAnimal(makeChicken, { x0: -5.5, x1: 1, z0: 4, z1: 6.2 }, 0.35);
  addAnimal(makeChicken, { x0: 50, x1: 56, z0: 5, z1: 7 }, 0.3);

  // --- wooden scoreboard sign ---
  const sb = new THREE.Group();
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.14), woodMat);
    post.position.set(0, 1.3, s * 1.45);
    sb.add(post);
  }
  const sbCv = document.createElement('canvas');
  sbCv.width = 512; sbCv.height = 288;
  const sbTex = new THREE.CanvasTexture(sbCv);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.9),
    new THREE.MeshBasicMaterial({ map: sbTex }));
  board.position.y = 2.15;
  board.rotation.y = Math.PI / 2;
  sb.add(board);
  sb.position.set(-4.2, 0, -3.4);
  sb.rotation.y = 0.35;
  scene.add(sb);

  function setScoreboard(lines) {
    const g = sbCv.getContext('2d');
    g.fillStyle = '#6e5233'; g.fillRect(0, 0, 512, 288);
    g.fillStyle = '#7d5f3c'; g.fillRect(10, 10, 492, 268);
    g.strokeStyle = '#4a3620'; g.lineWidth = 8; g.strokeRect(10, 10, 492, 268);
    g.textAlign = 'center';
    g.font = '900 44px "Arial Black", Arial';
    g.fillStyle = '#ffd23f';
    g.fillText('SLAPMANIA FAIR', 256, 66);
    g.font = '900 34px "Arial Black", Arial';
    g.fillStyle = '#fff6e0';
    lines.forEach((ln, i) => g.fillText(ln, 256, 130 + i * 52));
    sbTex.needsUpdate = true;
  }
  setScoreboard(['BEST: —', 'LAST: —']);

  // --- crowd: farmers in wifebeaters, denim and straw hats ---
  const farmerCols = [0xf2ede1, 0xe8e4d8, 0x4a6fa5, 0xa8402e, 0x8a6b42, 0x6b7a4a, 0xb9b9b1];
  const styles = ['sway', 'clap', 'pump', 'wave'];
  const spots = [];
  for (const s of [-1, 1]) {
    for (const row of [3.9]) {
      for (let x = -6; x < 54; x += 2.0) {
        const fem = Math.random() < 0.45;
        const kid = Math.random() < 0.15;
        spots.push({
          x: x + Math.random() * 0.7,
          z: s * (row + Math.random() * 0.4),
          phase: Math.random() * Math.PI * 2,
          h: kid ? 0.5 + Math.random() * 0.1 : 0.85 + Math.random() * 0.3,
          hat: !kid && Math.random() < (fem ? 0.3 : 0.6),
          fem,
          kid,
          style: kid ? 'wave' : styles[Math.floor(Math.random() * styles.length)],
        });
      }
    }
  }
  const N = spots.length;
  const bodyIM = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.2, 0.55, 3, 8), toonMat(0xffffff), N);
  const headIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 8, 8), toonMat(0xffffff), N);
  const armIM = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.05, 0.26, 2, 6), toonMat(0xffffff), N * 2);
  const eyeIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.02, 5, 5), toonMat(0x18140f), N * 2);
  const femN = spots.filter((s) => s.fem).length;
  const hairIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.165, 8, 8), toonMat(0xffffff), femN);
  const skirtIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.33, 0.3, 8), toonMat(0xffffff), femN);
  const hatN = spots.filter((s) => s.hat).length;
  const brimIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.26, 0.26, 0.025, 10), toonMat(0xffffff), hatN);
  const crownIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.15, 0.13, 10), toonMat(0xffffff), hatN);
  const hairCols = [0x2a1d12, 0x4a2f18, 0x7a4a20, 0xb98a4a, 0x8a8378];
  const skirtCols = [0xc95d73, 0x8a5fb0, 0x4a6fa5, 0x5fae5a, 0xd9925e];
  const col = new THREE.Color();
  let hi = 0, fi = 0;
  for (let i = 0; i < N; i++) {
    col.setHex(farmerCols[Math.floor(Math.random() * farmerCols.length)]).offsetHSL(0, 0, (Math.random() - 0.5) * 0.06);
    bodyIM.setColorAt(i, col);
    armIM.setColorAt(i * 2, col);
    armIM.setColorAt(i * 2 + 1, col);
    headIM.setColorAt(i, col.setHSL(0.08, 0.45, 0.38 + Math.random() * 0.35));
    if (spots[i].fem) {
      spots[i].femIdx = fi;
      hairIM.setColorAt(fi, col.setHex(hairCols[Math.floor(Math.random() * hairCols.length)]));
      skirtIM.setColorAt(fi, col.setHex(skirtCols[Math.floor(Math.random() * skirtCols.length)]));
      fi++;
    }
    if (spots[i].hat) {
      spots[i].hatIdx = hi;
      col.setHSL(0.11, 0.55, 0.55 + Math.random() * 0.1);
      brimIM.setColorAt(hi, col);
      crownIM.setColorAt(hi, col);
      hi++;
    }
  }
  scene.add(bodyIM, headIM, armIM, eyeIM, hairIM, skirtIM, brimIM, crownIM);

  // --- the ring girl: blonde, bikini, professionally enthusiastic at all times ---
  const ringGirl = (() => {
    const SKIN = 0xf0c8a0, PINK = 0xff5d8f, BLONDE = 0xf2d16b;
    const g = new THREE.Group();
    const M = (m) => { m.castShadow = true; return m; };
    for (const s of [-1, 1]) {
      const leg = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.6, 3, 8), toonMat(SKIN)));
      leg.position.set(0, 0.38, s * 0.09);
      g.add(leg);
    }
    // rodeo cowgirl outfit: denim shorts + a proper pink western top
    const shorts = M(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.17, 0.23), toonMat(0x4a6fa5)));
    shorts.position.y = 0.75;
    g.add(shorts);
    const waist = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.3, 4, 10), toonMat(SKIN)));
    waist.position.y = 0.98;
    g.add(waist);
    for (const s of [-1, 1]) {
      const bump = M(new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), toonMat(PINK)));
      bump.position.set(0.06, 1.2, s * 0.07);
      g.add(bump);
    }
    const top = M(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.2, 0.3), toonMat(PINK)));
    top.position.set(0.06, 1.18, 0);
    g.add(top);
    const knot = M(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.07), toonMat(0xd94f7e)));
    knot.position.set(0.16, 1.06, 0);
    g.add(knot);
    const armL = new THREE.Group(), armR = new THREE.Group();
    for (const [grp, s] of [[armL, 1], [armR, -1]]) {
      grp.position.set(0, 1.33, s * 0.17);
      const arm = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.4, 3, 8), toonMat(SKIN)));
      arm.position.y = 0.21;
      grp.add(arm);
      const pom = M(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), toonMat(0xffd23f)));
      pom.position.y = 0.44;
      grp.add(pom);
      g.add(grp);
    }
    const head = M(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), toonMat(SKIN)));
    head.position.set(0, 1.54, 0);
    g.add(head);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), toonMat(0x18140f));
      eye.position.set(0.12, 1.57, s * 0.05);
      g.add(eye);
      const lash = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.013, 0.05), toonMat(0x161616));
      lash.position.set(0.122, 1.6, s * 0.05);
      g.add(lash);
    }
    const lips = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.07), toonMat(0xd83a52));
    lips.position.set(0.132, 1.49, 0);
    g.add(lips);
    const hairCap = M(new THREE.Mesh(new THREE.SphereGeometry(0.155, 10, 10), toonMat(BLONDE)));
    hairCap.scale.set(1, 0.85, 1.06);
    hairCap.position.set(-0.03, 1.57, 0);
    g.add(hairCap);
    const hairBack = M(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.2), toonMat(BLONDE)));
    hairBack.position.set(-0.12, 1.32, 0);
    g.add(hairBack);
    for (const s of [-1, 1]) {
      const strand = M(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.05), toonMat(BLONDE)));
      strand.position.set(0.01, 1.42, s * 0.13);
      g.add(strand);
    }
    // cowgirl hat with a pink band
    const cgBrim = M(new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.03, 12), toonMat(0xd9a05f)));
    cgBrim.position.set(-0.02, 1.66, 0);
    g.add(cgBrim);
    const cgCrown = M(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.14, 10), toonMat(0xd9a05f)));
    cgCrown.position.set(-0.02, 1.73, 0);
    g.add(cgCrown);
    const cgBand = M(new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.035, 10), toonMat(PINK)));
    cgBand.position.set(-0.02, 1.685, 0);
    g.add(cgBand);
    g.position.set(-1.0, 0, 0.9);
    g.rotation.y = 0.45; // facing the ring, three-quarters to the camera
    scene.add(g);
    return { g, armL, armR };
  })();

  // --- the judge: white ten-gallon hat, stripes, unimpeachable authority ---
  const judge = (() => {
    const g = new THREE.Group();
    const M = (m) => { m.castShadow = true; return m; };
    for (const s of [-1, 1]) {
      const leg = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.62, 3, 8), toonMat(0x23252e)));
      leg.position.set(0, 0.4, s * 0.11);
      g.add(leg);
    }
    const torso = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.34, 4, 10), toonMat(0xf5f3ee)));
    torso.position.y = 1.08;
    g.add(torso);
    for (const sy of [0.96, 1.1, 1.24]) {
      const stripe = M(new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.05, 12), toonMat(0x1d1d22)));
      stripe.position.y = sy;
      g.add(stripe);
    }
    for (const s of [-1, 1]) {
      const arm = M(new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.42, 3, 8), toonMat(0xf5f3ee)));
      arm.position.set(0.02, 1.05, s * 0.24);
      g.add(arm);
    }
    const board = M(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.13), toonMat(0xb08a58)));
    board.position.set(0.16, 0.86, 0.24);
    board.rotation.z = 0.3;
    g.add(board);
    const head = M(new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 12), toonMat(0xdca77c)));
    head.position.y = 1.48;
    g.add(head);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), toonMat(0x18140f));
      eye.position.set(0.125, 1.51, s * 0.05);
      g.add(eye);
    }
    const stache = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.13), toonMat(0x9a9088));
    stache.position.set(0.135, 1.43, 0);
    g.add(stache);
    const scarf = M(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.24), toonMat(0xa8402e)));
    scarf.position.set(0.05, 1.32, 0);
    g.add(scarf);
    // the gallon hat itself, gleaming white
    const brim = M(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.035, 14), toonMat(0xf7f5f0)));
    brim.position.y = 1.6;
    brim.rotation.z = 0.06;
    g.add(brim);
    const crown = M(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.24, 12), toonMat(0xf7f5f0)));
    crown.position.y = 1.72;
    g.add(crown);
    const crownTop = M(new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), toonMat(0xf7f5f0)));
    crownTop.position.y = 1.84;
    crownTop.scale.y = 0.5;
    g.add(crownTop);
    g.position.set(2.5, 0, -2.0);
    const baseY = 2.45; // facing the ring
    g.rotation.y = baseY;
    scene.add(g);
    return { g, baseY };
  })();

  // the kids erupt when someone flies past 30m (or hits the hay)
  let kidCelebT = 0;
  function kidsCelebrate(sec) { kidCelebT = Math.max(kidCelebT, sec); }

  const dummy = new THREE.Object3D();
  function updateCrowd(time, excite) {
    // ring girl never stops; the judge surveys his domain
    const rgSpeed = 5 + excite * 4;
    ringGirl.g.position.y = Math.abs(Math.sin(time * (3.5 + excite * 3))) * (0.04 + excite * 0.09);
    ringGirl.armL.rotation.z = 0.5 + Math.sin(time * rgSpeed) * 0.38;
    ringGirl.armR.rotation.z = -0.5 - Math.sin(time * rgSpeed + 1.3) * 0.38;
    ringGirl.g.rotation.z = Math.sin(time * 3.1) * 0.045;
    judge.g.rotation.y = judge.baseY + Math.sin(time * 0.5) * 0.16;
    judge.g.position.y = Math.abs(Math.sin(time * 2.1)) * 0.012;
    for (let i = 0; i < N; i++) {
      const s = spots[i];
      const toLane = -Math.sign(s.z); // everyone faces the action
      // subsets take turns being animated; excitement lifts everyone
      const hype = Math.max(0, Math.sin(time * 0.31 + s.phase * 7.3));
      const act = Math.min(1, excite * 1.5 + Math.max(0, hype - 0.6) * 1.7);
      // human idle: weight-shift sway + tiny breathing bob, no pogo
      const lean = Math.sin(time * 1.1 + s.phase * 1.7) * (0.05 + 0.05 * act);
      const bob = Math.sin(time * 2.1 + s.phase) * 0.012;
      // the stadium wave only at genuinely big moments
      let jump = excite > 0.6
        ? Math.max(0, Math.sin(time * 7 - s.x * 0.35 + s.phase * 0.3)) * 0.35 * (excite - 0.6) / 0.4
        : 0;
      // celebrating children leap with their whole hearts
      if (s.kid && kidCelebT > 0) jump = Math.abs(Math.sin(time * 8 + s.phase)) * 0.55;
      const y = bob + jump;
      dummy.rotation.set(0, 0, lean);
      dummy.position.set(s.x + lean * 0.5 * s.h, 0.55 * s.h + y, s.z);
      dummy.scale.set(s.h, s.h, s.h);
      dummy.updateMatrix();
      bodyIM.setMatrixAt(i, dummy.matrix);
      const headX = s.x + lean * 0.95 * s.h;
      const headY = 1.0 * s.h + y;
      dummy.position.set(headX, headY, s.z);
      dummy.scale.setScalar(s.h);
      dummy.updateMatrix();
      headIM.setMatrixAt(i, dummy.matrix);
      // eyes on the lane-facing side of the face
      for (const side of [0, 1]) {
        const sgn = side ? 1 : -1;
        dummy.position.set(headX + sgn * 0.055 * s.h, headY + 0.02 * s.h, s.z + toLane * 0.132 * s.h);
        dummy.scale.setScalar(s.h);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        eyeIM.setMatrixAt(i * 2 + side, dummy.matrix);
      }
      // arms by personality: chest-clappers, fist-pumpers, overhead wavers, swayers.
      // The gesture BLENDS in and out with enthusiasm — no teleporting limbs.
      const shoulderY = 0.78 * s.h + y;
      const wRaw = (act - 0.15) / 0.25;
      const w = wRaw <= 0 ? 0 : wRaw >= 1 ? 1 : wRaw * wRaw * (3 - 2 * wRaw);
      for (const side of [0, 1]) {
        const sgn = side ? 1 : -1;
        const restA = Math.PI + sgn * (0.13 + lean * 0.4);
        let ag = restA;
        if (s.style === 'clap') {
          const c = Math.abs(Math.sin(time * (5 + act * 4) + s.phase));
          ag = Math.PI - sgn * (0.35 + c * 0.5);
        } else if (s.style === 'pump') {
          if (side === 1) ag = 0.18 + Math.sin(time * (5 + act * 4) + s.phase) * 0.22;
        } else if (s.style === 'wave') {
          ag = sgn * (0.55 + Math.sin(time * (6 + act * 3) + s.phase + side * 2.1) * 0.5);
        }
        const a = restA + (ag - restA) * w;
        dummy.position.set(
          s.x + lean * 0.7 * s.h + sgn * 0.21 * s.h - Math.sin(a) * 0.16 * s.h,
          shoulderY + Math.cos(a) * 0.16 * s.h,
          s.z
        );
        dummy.rotation.set(0, 0, a);
        dummy.scale.setScalar(s.h);
        dummy.updateMatrix();
        armIM.setMatrixAt(i * 2 + side, dummy.matrix);
      }
      if (s.fem) {
        dummy.rotation.set(0, 0, lean);
        dummy.position.set(headX - toLane * 0 + 0, headY + 0.03 * s.h, s.z - toLane * 0.03 * s.h);
        dummy.scale.set(s.h, s.h * 0.8, s.h);
        dummy.updateMatrix();
        hairIM.setMatrixAt(s.femIdx, dummy.matrix);
        dummy.rotation.set(0, 0, lean * 0.6);
        dummy.position.set(s.x + lean * 0.3 * s.h, 0.3 * s.h + y, s.z);
        dummy.scale.setScalar(s.h);
        dummy.updateMatrix();
        skirtIM.setMatrixAt(s.femIdx, dummy.matrix);
      }
      if (s.hat) {
        dummy.rotation.set(0, 0, lean);
        dummy.position.set(headX + lean * 0.1, 1.12 * s.h + y, s.z);
        dummy.scale.setScalar(s.h);
        dummy.updateMatrix();
        brimIM.setMatrixAt(s.hatIdx, dummy.matrix);
        dummy.position.y += 0.05 * s.h;
        dummy.updateMatrix();
        crownIM.setMatrixAt(s.hatIdx, dummy.matrix);
      }
    }
    bodyIM.instanceMatrix.needsUpdate = true;
    headIM.instanceMatrix.needsUpdate = true;
    armIM.instanceMatrix.needsUpdate = true;
    eyeIM.instanceMatrix.needsUpdate = true;
    hairIM.instanceMatrix.needsUpdate = true;
    skirtIM.instanceMatrix.needsUpdate = true;
    brimIM.instanceMatrix.needsUpdate = true;
    crownIM.instanceMatrix.needsUpdate = true;
  }
  updateCrowd(0, 0);

  // props the animals must walk around, as (x, z, radius) circles
  const OBSTACLES = [
    [18, -11, 5.4],   // barn
    [25, -10.5, 2.5], // silo
    [40, -9, 2.0],    // windmill
    [9, -8, 2.4],     // tractor
    [-7, -9, 2.0], [52, -13, 2.4], [31, -15, 2.0], [-10, 8, 2.0], [24, 9.5, 1.8], // trees
    [14, 6.8, 2.0], [43, 7.2, 2.0], // hay stacks
    [3, -6.5, 1.3], [33, -7, 1.3], [50, -6.2, 1.3], [-5.5, 6.4, 1.3], // round bales
    [-4.2, -3.4, 1.7], // scoreboard
    [30, 5.6, 1.2], [47, -6.4, 1.2], // scarecrows
    [52, 7, 1.6],   // outhouse
    [40, -6, 3.2],  // pumpkin patch
  ];

  // --- ambient life: windmill, wandering animals, clouds, a moody sun ---
  // --- the fairground midway + a drifting balloon: this IS a county fair, so
  // give the horizon a Ferris wheel that turns and a balloon crossing the sky
  // during big launches. All behind the crowd / high overhead — no colliders. ---
  const ferris = new THREE.Group();
  const ferrisSpin = new THREE.Group();
  const ferrisCars = [];
  const FR = 6;
  {
    for (const zz of [-0.45, 0.45]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(FR, 0.16, 8, 30), toonMat(0xc23a3a));
      rim.position.z = zz;
      ferrisSpin.add(rim);
    }
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, FR * 2, 6), toonMat(0xe8e2d5));
      spoke.rotation.z = (i / 8) * Math.PI;
      ferrisSpin.add(spoke);
    }
    ferris.add(ferrisSpin);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 10), toonMat(0xb0a89a));
    hub.rotation.x = Math.PI / 2;
    ferris.add(hub);
    const carCols = [0xd8404f, 0x3f7fbf, 0xffd23f, 0x5fae5a, 0xe08a3a, 0x9a5fb0, 0xd8404f, 0x3f7fbf];
    for (let i = 0; i < 8; i++) {
      const car = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 1.1), toonMat(carCols[i]));
      car.userData.a = (i / 8) * Math.PI * 2;
      ferrisCars.push(car);
      ferris.add(car);
    }
    for (const sgn of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 9, 6), toonMat(0x8a6a42));
      leg.position.set(sgn * 2.6, -4.4, 0);
      leg.rotation.z = sgn * 0.5;
      ferris.add(leg);
    }
    ferris.position.set(15, 6.4, -31);
    ferris.traverse((m) => { m.castShadow = true; });
    scene.add(ferris);
  }
  const balloon = new THREE.Group();
  {
    const env = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), toonMat(0xd8404f));
    env.scale.set(1, 1.25, 1); env.position.y = 2.6;
    balloon.add(env);
    const band = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.28, 8, 20), toonMat(0xf2ede1));
    band.rotation.x = Math.PI / 2; band.position.y = 2.6;
    balloon.add(band);
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), toonMat(0x7a5a34));
    balloon.add(basket);
    for (const [sx, sz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.7, 4), toonMat(0x5a4632));
      rope.position.set(sx, 1.05, sz);
      balloon.add(rope);
    }
    balloon.position.set(40, 30, -6);
    scene.add(balloon);
  }

  function updateAmbient(dt, time) {
    fan.rotation.z += dt * 1.4;
    if (desertG.visible) {
      for (const tw of tumbleweeds) {
        if (tw.camel) {                                     // camels amble a fixed line
          const ph = ((time * tw.spd + tw.ph0) % 2 + 2) % 2, fwd = ph < 1;
          tw.m.position.x = tw.x0 + tw.span * (fwd ? ph : 2 - ph);
          tw.m.rotation.y = fwd ? 0 : Math.PI;
          tw.m.position.y = Math.abs(Math.sin(time * 2.4 + tw.ph0)) * 0.08;
          continue;
        }
        tw.m.position.x += tw.speed * dt;
        tw.m.rotation.z -= (tw.speed / tw.r) * dt;          // roll like it means it
        tw.m.position.z = tw.z0 + Math.sin(time * 0.6 + tw.r * 20) * 1.6;
        if (tw.m.position.x > 120) tw.m.position.x = -22;   // the desert never runs out
      }
    }
    if (jungleG.visible && monkey) {
      monkey.rotation.z = Math.sin(time * 1.3) * 0.8;       // the vine pendulum
      for (const mk of jungleMonkeys) {                     // perched monkeys bob + chatter
        mk.g.position.y += Math.sin(time * 4 + mk.ph) * 0.004;
        mk.g.rotation.y = Math.sin(time * 1.5 + mk.ph) * 0.4;
      }
      if (jungleTiger) {                                    // the tiger prowls the shoulder
        const ph = ((time * 0.03) % 2 + 2) % 2, fwd = ph < 1;
        jungleTiger.position.x = 20 + 40 * (fwd ? ph : 2 - ph);
        jungleTiger.rotation.y = fwd ? 0 : Math.PI;
        jungleTiger.position.y = Math.abs(Math.sin(time * 3)) * 0.05;
      }
    }
    if (dojoG.visible) {
      for (const k of kois) {
        k.a += dt * 0.5;
        k.m.position.set(40 + Math.cos(k.a) * k.r, 0.06, 24 + Math.sin(k.a) * k.r);
        k.m.rotation.y = -k.a;
      }
      if (gongDisc) gongDisc.rotation.x *= 0.985;           // ringing decays back to still
      if (dojoWheel) dojoWheel.rotation.z += dt * 0.4;       // the garden waterwheel turns
      for (const tr of dojoTrainers) {                       // students throw strikes in kata rhythm
        const c = (time * 2 + tr.ph) % 2, punch = c < 1 ? Math.sin(c * Math.PI) : 0;
        tr.g.userData.armL.scale.x = 1 + punch * 1.1;        // lead arm snaps out
        tr.g.userData.armL.position.z = punch * 0.12;
        tr.g.userData.armR.rotation.x = -punch * 0.4;        // rear hand chambers
        tr.g.position.y = Math.abs(Math.sin(time * 4 + tr.ph)) * 0.03; // light bounce on the balls of the feet
      }
    }
    if (lavaG.visible) {
      for (const gy of geysers) {
        // a fixed 4s rhythm, phase-offset — deterministic, like the weave
        const cyc = (time + gy.ph) % 4;
        gy.m.scale.y = cyc < 0.8 ? Math.max(0.01, Math.sin((cyc / 0.8) * Math.PI)) : 0.01;
      }
      for (const fl of lavaFlames) {          // fire flicker
        fl.g.scale.y = fl.base * (0.7 + Math.abs(Math.sin(time * 7 + fl.ph)) * 0.7);
        fl.g.scale.x = fl.g.scale.z = 0.85 + Math.sin(time * 9 + fl.ph) * 0.15;
      }
      for (const mp of magmaPools) {          // bubbling magma
        mp.m.position.y = mp.y0 + Math.abs(Math.sin(time * 2.5 + mp.ph)) * 0.3;
        mp.m.scale.setScalar(0.7 + Math.abs(Math.sin(time * 2.5 + mp.ph)) * 0.6);
      }
      for (const ej of emberJets) {           // crater ember fountain
        ej.m.position.y = ej.base + ((time * 4 + ej.ph) % 3) * 3;
        ej.m.scale.setScalar(Math.max(0.05, 1 - ((time * 4 + ej.ph) % 3) / 3));
      }
      for (const sm of lavaSmoke) {           // rising, fading smoke plume
        const t2 = (time * 2 + sm.ph) % 21;
        sm.m.position.y = sm.base + t2 * 1.6;
        sm.m.material.opacity = Math.max(0, 0.5 - t2 / 42);
      }
      const k = 0.5 + Math.sin(time * 1.3) * 0.5;   // molten shimmer across the sea
      // low green/blue: ACES tone-mapping blows brighter inputs to pale sand —
      // these tone-map to a saturated molten orange (verified via readPixels)
      for (const sea of seaMats) sea.color.setRGB(1, 0.09 + k * 0.09, 0.01 + k * 0.02);
      for (const dm of lavaDemons) {          // basalt brutes amble the flanks
        const ph = ((time * dm.spd + dm.ph0) % 2 + 2) % 2, fwd = ph < 1;
        dm.g.position.x = dm.x0 + dm.span * (fwd ? ph : 2 - ph);
        dm.g.rotation.y = fwd ? 0 : Math.PI;
        dm.g.position.y = Math.abs(Math.sin(time * 3 + dm.ph0)) * 0.06;
      }
      if (salamander) {
        const span = 22, ph = ((time * 0.05) % 2 + 2) % 2, fwd = ph < 1;
        salamander.position.x = 24 + span * (fwd ? ph : 2 - ph);
        salamander.rotation.y = fwd ? 0 : Math.PI;
      }
    }
    if (vegasG.visible) {
      for (const n of vegasNeon) {
        const k = 0.55 + Math.abs(Math.sin(time * n.sp + n.ph)) * 0.45;
        if (n.m.transparent) n.m.opacity = n.base * k;
      }
      for (const c of vegasSpots) {
        c.rotation.z = Math.sin(time * 0.4 + c.userData.sweep.ph) * 0.5;
        c.rotation.x = Math.PI + Math.sin(time * 0.27 + c.userData.sweep.ph) * 0.3;
      }
      for (const j of vegasFountain) {
        const h = 1.6 + Math.abs(Math.sin(time * 2 + j.ph)) * 2.4;
        j.m.scale.y = h / 3; j.m.position.y = 1.5 + h / 2;
      }
    }
    if (heavenG.visible) {
      for (const ch of cherubs) {
        const a = time * 0.4 + ch.ph;
        ch.g.position.set((ch.cx || 40) + Math.cos(a) * (ch.rad || 18), (ch.hy || 9) + Math.sin(time * 1.7 + ch.ph) * 0.9, Math.sin(a) * (ch.rad || 18) * 0.6);
        ch.g.rotation.y = -a;
        ch.g.children[2].rotation.x = Math.sin(time * 9) * 0.5;  // wing flaps (robe is now children[1])
        ch.g.children[3].rotation.x = -Math.sin(time * 9) * 0.5;
      }
      if (heavenG.userData.godAura) {         // the glory gently breathes
        const g = 0.35 + Math.abs(Math.sin(time * 0.7)) * 0.25;
        for (const m of heavenG.userData.godAura) m.opacity = m === heavenG.userData.godAura[0] ? g + 0.15 : g;
      }
      for (const sh of heavenSheep) {         // blessed sheep graze the clouds
        const ph = ((time * sh.spd + sh.ph0) % 2 + 2) % 2, fwd = ph < 1;
        sh.g.position.x = sh.x0 + sh.span * (fwd ? ph : 2 - ph);
        sh.g.rotation.y = fwd ? 0 : Math.PI;
        sh.g.position.y = Math.abs(Math.sin(time * 5 + sh.ph0)) * 0.03;
      }
    }
    if (hellG.visible) {
      for (const ip of impPokers) ip.g.position.y = Math.abs(Math.sin(time * 2.4 + ip.ph)) * 0.05;
      if (cerberus) {
        const span = 42, ph = ((time * 0.05) % 2 + 2) % 2, fwd = ph < 1;
        cerberus.position.x = 28 + span * (fwd ? ph : 2 - ph);
        cerberus.rotation.y = fwd ? 0 : Math.PI;
        cerberus.position.y = Math.abs(Math.sin(time * 2.2)) * 0.04;
      }
    }
    if (hauntedG.visible) {
      for (const gh of ghosts) {
        const a = time * gh.sp + gh.ph;
        const spook = Math.max(0, gh.spookT);
        if (gh.spookT > 0) gh.spookT -= dt;
        gh.g.position.set(gh.cx + Math.cos(a) * gh.r, Math.sin(time * 1.1 + gh.ph) * 0.25 + spook * 2.2, gh.cz + Math.sin(a) * gh.r);
        gh.g.rotation.y = -a;
        gh.ecto.opacity = 0.45 - spook * 0.28;
      }
    }
    if (techG.visible) {
      const a = time * 0.35;
      drone.position.set(45 + Math.cos(a) * 22, 9 + Math.sin(time * 1.3) * 0.5, Math.sin(a) * 12);
      drone.rotation.y = -a;
      for (const r2 of droneRotors) r2.rotation.y += dt * 30;
      const span2 = 22, ph2 = ((time * 0.06) % 2 + 2) % 2, fwd2 = ph2 < 1;
      roomba.position.x = 4 + span2 * (fwd2 ? ph2 : 2 - ph2);
      roomba.position.z = 3.5 + Math.sin(time * 0.9) * 0.4;
      roomba.rotation.y = time * 0.8;
      mastTips.forEach((t2, i2) => { t2.visible = Math.sin(time * 3 + i2 * 1.7) > 0; });
      lakePackets.forEach((p2, i2) => { p2.position.y = 0.12 + Math.abs(Math.sin(time * 1.2 + i2)) * 0.08; });
    }
    if (therapyG.visible && countSheep) {
      // one sheep, hopping the rail forever — deterministic 2.4s loop
      const hop = (time % 2.4) / 2.4;
      countSheep.position.x = 7 + hop * 6;
      countSheep.position.y = Math.sin(hop * Math.PI) * 1.6;
      for (const d of therapyG.children) {
        if (d.userData && d.userData.baseY != null) d.position.y = d.userData.baseY + Math.sin(time * 0.8 + d.position.x) * 0.15;
      }
    }
    ferrisSpin.rotation.z += dt * 0.22;
    for (const car of ferrisCars) {
      const a = car.userData.a + ferrisSpin.rotation.z;
      car.position.set(Math.cos(a) * FR, Math.sin(a) * FR, 0);
    }
    balloon.position.x = 30 + Math.sin(time * 0.045) * 46;
    balloon.position.y = 30 + Math.sin(time * 0.12) * 1.4;
    if (snowPts.visible) {
      const a = snowGeo2.attributes.position.array;
      for (let i = 0; i < SNOW_N; i++) {
        a[i * 3 + 1] -= (1.5 + (i % 5) * 0.3) * dt;
        a[i * 3] += Math.sin(time * 0.8 + i) * 0.35 * dt;
        if (a[i * 3 + 1] < 0.05) a[i * 3 + 1] += 26;
      }
      snowGeo2.attributes.position.needsUpdate = true;
      for (const sk of iceSkaters) {
        const a = time * sk.speed + sk.phase;
        const dir = Math.sign(sk.speed);
        sk.g.position.set(40 + Math.cos(a) * sk.r, 0.05, 24 + Math.sin(a) * sk.r);
        sk.g.rotation.y = -a - dir * Math.PI / 2; // face along the tangent
        sk.g.rotation.z = dir * 0.14;             // lean into the curve
        sk.g.position.y += Math.abs(Math.sin(time * 2.2 + sk.phase)) * 0.015; // stride bob
      }
      for (const d of deerList) {
        if (d.graze) { // head-down nibbling, an occasional look around
          d.g.rotation.y = (d.ry || 0) + Math.sin(time * 0.23) * 0.3;
          d.g.rotation.x = Math.max(0, Math.sin(time * 0.7)) * 0.14;
          continue;
        }
        const a = time * d.speed + d.phase;
        const dir = Math.sign(d.speed);
        d.g.position.set(d.cx + Math.cos(a) * d.r, Math.abs(Math.sin(time * 3.1 + d.phase)) * 0.03, d.cz + Math.sin(a) * d.r);
        d.g.rotation.y = -a - dir * Math.PI / 2;
      }
      for (const b of bearList) {
        // amble back and forth between x0 and x1 on a triangle wave
        const span = b.x1 - b.x0;
        const ph = ((time * b.speed + b.phase) % 2 + 2) % 2;
        const fwd = ph < 1;
        b.g.position.x = b.x0 + span * (fwd ? ph : 2 - ph);
        b.g.position.y = Math.abs(Math.sin(time * 1.7 + b.phase * 5)) * 0.035; // heavy amble
        b.g.rotation.y = fwd ? 0 : Math.PI;
        b.g.rotation.z = Math.sin(time * 1.7 + b.phase * 5) * 0.045;           // shoulder roll
      }
    }
    if (kidCelebT > 0) kidCelebT -= dt;
    // the sun's reaction wears off back to a contented idle
    sunFace.quaternion.copy(sunBaseQ);
    if (sunMoodT > 0) {
      sunMoodT -= dt;
      if (sunCurrent === 'happy') sunFace.rotateZ(Math.sin(time * 9) * 0.07);
      if (sunMoodT <= 0 && sunCurrent !== 'idle') {
        sunCurrent = 'idle';
        drawSunFace('idle');
      }
    }
    for (const a of animals) {
      if (a.mooT > 0) {
        // the cow is moved by greatness: little hops, head raised skyward
        a.mooT -= dt;
        a.g.position.y = Math.abs(Math.sin(time * 12)) * 0.05;
        if (a.headG) a.headG.rotation.z += (0.4 - a.headG.rotation.z) * Math.min(1, 8 * dt);
        continue;
      }
      a.t -= dt;
      if (a.t <= 0) {
        a.mode = a.mode === 'walk' ? 'graze' : 'walk';
        a.t = a.mode === 'walk' ? 2.5 + Math.random() * 4 : 2 + Math.random() * 3;
      }
      if (a.mode === 'walk') {
        a.heading += (Math.random() - 0.5) * 0.7 * dt;
        a.g.position.x += Math.cos(a.heading) * a.speed * dt;
        a.g.position.z += -Math.sin(a.heading) * a.speed * dt;
        const r = a.region;
        if (a.g.position.x < r.x0 || a.g.position.x > r.x1 || a.g.position.z < r.z0 || a.g.position.z > r.z1) {
          a.heading = Math.atan2(-((r.z0 + r.z1) / 2 - a.g.position.z), (r.x0 + r.x1) / 2 - a.g.position.x);
          a.g.position.x = Math.min(r.x1, Math.max(r.x0, a.g.position.x));
          a.g.position.z = Math.min(r.z1, Math.max(r.z0, a.g.position.z));
        }
        // no walking through barns, sir — steer away and step back out
        for (const [ox, oz, or] of OBSTACLES) {
          const dx = a.g.position.x - ox, dz = a.g.position.z - oz;
          const d2 = dx * dx + dz * dz;
          if (d2 < or * or) {
            const d = Math.sqrt(d2) || 0.01;
            a.heading = Math.atan2(-dz / d, dx / d);
            a.g.position.x = ox + (dx / d) * or;
            a.g.position.z = oz + (dz / d) * or;
            break;
          }
        }
        a.g.position.y = Math.abs(Math.sin(time * (3 + a.speed * 6) + a.phase)) * 0.02;
        if (a.headG) a.headG.rotation.z += (0 - a.headG.rotation.z) * Math.min(1, 5 * dt);
      } else {
        a.g.position.y = 0;
        if (a.headG) a.headG.rotation.z += (-0.55 - a.headG.rotation.z) * Math.min(1, 5 * dt);
      }
      // the body eases around to its new heading — wander noise never twitches it
      const turn = a.heading - a.g.rotation.y;
      a.g.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * Math.min(1, 4 * dt);
      if (a.peck) {
        const peckT = a.mode === 'graze' ? Math.max(0, Math.sin(time * 2.2 + a.phase)) * 0.5 : 0;
        a.g.rotation.x += (peckT - a.g.rotation.x) * Math.min(1, 8 * dt);
      }
    }
    for (const c of clouds) {
      c.position.x += dt * 0.5;
      if (c.position.x > 130) c.position.x = -70;
    }
    // laundry breathes in the breeze
    for (const c of cloths) {
      c.mesh.rotation.x = Math.sin(time * 1.9 + c.ph) * 0.28 + Math.sin(time * 3.7 + c.ph) * 0.07;
    }
    // birds circle their beats; scared ones evacuate, then quietly resume
    for (const b of birds) {
      if (b.scared > 0) {
        b.scared -= dt;
        b.g.position.addScaledVector(b.v, dt);
        b.v.y = Math.max(b.v.y - 2.5 * dt, 1.5);
        b.g.rotation.y += dt * 3;
        b.wings.forEach(({ m, s }) => { m.rotation.x = s * Math.sin(time * 38) * 0.95; });
        continue;
      }
      b.ph += b.w * dt;
      const bx = b.cx + Math.cos(b.ph) * b.r;
      const bz = b.cz + Math.sin(b.ph) * b.r * 0.6;
      const by = b.cy + Math.sin(time * 0.7 + b.ph * 2) * 0.4;
      // scared birds are far off their beat — glide home rather than teleport
      const cur = b.g.position;
      const far = (cur.x - bx) * (cur.x - bx) + (cur.y - by) * (cur.y - by) + (cur.z - bz) * (cur.z - bz) > 4;
      if (far) {
        cur.x += (bx - cur.x) * Math.min(1, 1.2 * dt);
        cur.y += (by - cur.y) * Math.min(1, 1.2 * dt);
        cur.z += (bz - cur.z) * Math.min(1, 1.2 * dt);
      } else {
        cur.set(bx, by, bz);
      }
      const dxv = -Math.sin(b.ph) * b.w * b.r;
      const dzv = Math.cos(b.ph) * b.w * b.r * 0.6;
      b.g.rotation.y = Math.atan2(-dzv, dxv);
      b.wings.forEach(({ m, s }) => { m.rotation.x = s * Math.sin(time * b.flap + b.ph) * 0.55; });
    }
  }

  // --- impact FX: expanding shockwave rings and landing dust puffs ---
  const fx = [];
  const shockGeo = new THREE.RingGeometry(0.26, 0.36, 32);
  const dustGeo = new THREE.SphereGeometry(0.09, 6, 6);

  function spawnShock(point) {
    const m = new THREE.Mesh(shockGeo, new THREE.MeshBasicMaterial({
      color: 0xfff3c0, transparent: true, opacity: 0.95,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    m.position.copy(point);
    scene.add(m);
    fx.push({ mesh: m, t: 0, life: 0.45, type: 'shock' });
  }

  // --- the SlapMasters of old: benevolent spirits who smile from the sky ---
  function drawSpiritTexture(seed) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 300;
    const g = cv.getContext('2d');
    // soft ethereal glow
    const glow = g.createRadialGradient(128, 140, 20, 128, 140, 140);
    glow.addColorStop(0, 'rgba(210,235,255,0.85)');
    glow.addColorStop(0.6, 'rgba(170,210,255,0.35)');
    glow.addColorStop(1, 'rgba(150,190,255,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, 256, 300);
    // elder head
    g.fillStyle = 'rgba(235,245,255,0.9)';
    g.beginPath(); g.arc(128, 120, 52, 0, Math.PI * 2); g.fill();
    // flowing beard
    g.beginPath();
    g.moveTo(84, 140);
    g.quadraticCurveTo(128, 250 + seed * 14, 172, 140);
    g.closePath();
    g.fill();
    // serene closed eyes + gentle smile
    g.strokeStyle = 'rgba(90,120,170,0.95)';
    g.lineWidth = 5; g.lineCap = 'round';
    for (const s of [-1, 1]) {
      g.beginPath(); g.arc(128 + s * 20, 112, 10, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    }
    g.beginPath(); g.arc(128, 132, 16, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
    // the sacred open palm, raised in blessing
    g.fillStyle = 'rgba(225,240,255,0.85)';
    const px = seed % 2 ? 208 : 48;
    g.beginPath(); g.arc(px, 130, 20, 0, Math.PI * 2); g.fill();
    for (let f = 0; f < 5; f++) {
      g.beginPath(); g.arc(px - 16 + f * 8, 102 - Math.sin((f / 4) * Math.PI) * 8, 6, 0, Math.PI * 2); g.fill();
    }
    return new THREE.CanvasTexture(cv);
  }
  // the spirits appear AHEAD of the flyer so the flight camera always sees them
  function summonSpirits(nearX) {
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(13, 15.2),
        new THREE.MeshBasicMaterial({
          map: drawSpiritTexture(i), transparent: true, opacity: 0,
          fog: false, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      );
      m.position.set(nearX + 8 + i * 8, 7.5 + i * 2.5, -6 + i * 5);
      scene.add(m);
      fx.push({ mesh: m, t: 0, life: 6.5, type: 'spirit', v: new THREE.Vector3(0.4, 0.9, 0) });
    }
  }

  // --- 40m: a slap angel and a slap devil materialize and slap each other,
  // eternally and pettily, over the quality of your technique ---
  function slapDuel(x) {
    const mk = (devil) => {
      const c = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.3, 4, 10), toonMat(devil ? 0xc23030 : 0xf2f0e8));
      body.position.y = 0.35;
      c.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), toonMat(devil ? 0xd85050 : 0xf5d7b0));
      head.position.y = 0.75;
      c.add(head);
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), toonMat(0x111111));
        eye.position.set(s * 0.05, 0.78, 0.115);
        c.add(eye);
      }
      if (devil) {
        for (const s of [-1, 1]) {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), toonMat(0x7a1d1d));
          horn.position.set(s * 0.07, 0.92, 0);
          c.add(horn);
        }
      } else {
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 18), toonMat(0xffd23f));
        halo.rotation.x = Math.PI / 2.3;
        halo.position.y = 0.97;
        c.add(halo);
        for (const s of [-1, 1]) {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.34), toonMat(0xffffff));
          wing.position.set(s * 0.24, 0.45, -0.06);
          wing.rotation.y = s * 0.5;
          c.add(wing);
        }
      }
      const armG = new THREE.Group();
      armG.position.set(0, 0.55, devil ? -0.13 : 0.13);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.26, 3, 8), toonMat(devil ? 0xd85050 : 0xf5d7b0));
      arm.position.y = -0.15;
      armG.add(arm);
      c.add(armG);
      c.userData.head = head;
      c.userData.arm = armG;
      return c;
    };
    const g = new THREE.Group();
    const angel = mk(false), devil = mk(true);
    angel.position.set(0, 0, 1.0);
    angel.rotation.y = Math.PI; // they face each other
    devil.position.set(0, 0, -1.0);
    g.add(angel, devil);
    // spawn well AHEAD of the flyer and big, so the chase camera flies THROUGH
    // the duel instead of leaving it behind in a frame or two
    g.position.set(x + 20, 5.4, -1.6);
    g.scale.setScalar(1.9);
    scene.add(g);
    fx.push({ mesh: g, t: 0, life: 7, type: 'duel', angel, devil, hits: 0 });
  }

  // --- the ascension: a pillar of light and rising golden sparks ---
  function spawnBeam(x, z) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.5, 16, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe9a0, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      })
    );
    m.position.set(x, 8, z);
    scene.add(m);
    fx.push({ mesh: m, t: 0, life: 6, type: 'beam' });
  }
  function spawnSparkles(x, z) {
    for (let i = 0; i < 22; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({
        color: 0xffe08a, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      m.position.set(x + (Math.random() - 0.5) * 1.4, Math.random() * 1.5, z + (Math.random() - 0.5) * 1.4);
      scene.add(m);
      fx.push({
        mesh: m, t: 0, life: 2.5 + Math.random() * 2, type: 'spark',
        v: new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.4 + Math.random() * 1.6, (Math.random() - 0.5) * 0.4),
      });
    }
  }

  // celebration confetti: colored slips tossed up, fluttering down
  const confettiGeo = new THREE.BoxGeometry(0.06, 0.015, 0.09);
  function spawnConfetti(point) {
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(confettiGeo, new THREE.MeshBasicMaterial({
        color: flagCols[i % flagCols.length], transparent: true, opacity: 1, depthWrite: false,
      }));
      m.position.copy(point);
      m.position.y += 0.5;
      const v = new THREE.Vector3((Math.random() - 0.5) * 5, 3 + Math.random() * 4, (Math.random() - 0.5) * 5);
      scene.add(m);
      fx.push({
        mesh: m, t: 0, life: 1.5 + Math.random() * 0.8, type: 'confetti', v,
        av: new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16),
      });
    }
  }

  const flameGeo = new THREE.ConeGeometry(0.4, 1.2, 7);
  function lavaBurst(point) {
    // a gout of fire + dark smoke where a body plunges into the molten sea
    for (let i = 0; i < 14; i++) {
      const fire = i > 9;
      const m = new THREE.Mesh(fire ? new THREE.SphereGeometry(0.6, 8, 8) : flameGeo,
        new THREE.MeshBasicMaterial({ color: fire ? 0x2a201c : [0xff3a10, 0xff8a20, 0xffd23f][i % 3], transparent: true, opacity: 1, depthWrite: false }));
      m.position.copy(point); m.position.y = 0.3;
      scene.add(m);
      fx.push({ mesh: m, t: 0, life: fire ? 1.1 : 0.55 + Math.random() * 0.4, type: 'flame', big: fire ? 2.5 : 1.4 + Math.random(),
        v: new THREE.Vector3((Math.random() - 0.5) * 4, (fire ? 2 : 5) + Math.random() * 4, (Math.random() - 0.5) * 4) });
    }
  }

  function spawnDust(point, big = 1) {
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(dustGeo, new THREE.MeshBasicMaterial({
        color: 0xd8c49a, transparent: true, opacity: 0.55, depthWrite: false,
      }));
      m.position.copy(point);
      m.position.y = Math.max(0.12, point.y);
      const v = new THREE.Vector3((Math.random() - 0.5) * 2.4, 0.8 + Math.random() * 1.4, (Math.random() - 0.5) * 2.4);
      scene.add(m);
      fx.push({ mesh: m, t: 0, life: 0.5 + Math.random() * 0.2, type: 'dust', v, big });
    }
  }

  function updateFX(dt, cam) {
    // barricade debris: tumbles with the flyer's momentum, comes to rest as wreckage
    for (const d of debris) {
      if (!d.v) continue;
      d.mesh.position.addScaledVector(d.v, dt);
      d.v.y -= 9.8 * dt;
      d.mesh.rotation.x += d.av.x * dt;
      d.mesh.rotation.y += d.av.y * dt;
      d.mesh.rotation.z += d.av.z * dt;
      if (d.mesh.position.y < 0.09 && d.v.y < 0) {
        d.mesh.position.y = 0.09;
        d.v = null;
      }
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.t += dt;
      const k = f.t / f.life;
      if (k >= 1) {
        scene.remove(f.mesh);
        if (f.mesh.material) f.mesh.material.dispose();
        else f.mesh.traverse((o) => { if (o.material) o.material.dispose(); });
        fx.splice(i, 1);
        continue;
      }
      if (f.type === 'shock') {
        f.mesh.lookAt(cam.position);
        f.mesh.scale.setScalar(1 + k * 7);
        f.mesh.material.opacity = 0.95 * (1 - k);
      } else if (f.type === 'spirit') {
        f.mesh.lookAt(cam.position);
        f.mesh.position.addScaledVector(f.v, dt);
        f.mesh.material.opacity = Math.sin(k * Math.PI) * 0.75;
      } else if (f.type === 'duel') {
        // petty celestial violence, on a strict schedule
        f.mesh.position.y = 4.6 + Math.sin(f.t * 1.8) * 0.25;
        const cycle = f.t % 1.1;
        const aSwing = cycle < 0.55 ? Math.sin((cycle / 0.55) * Math.PI) : 0;
        const dSwing = cycle >= 0.55 ? Math.sin(((cycle - 0.55) / 0.55) * Math.PI) : 0;
        f.angel.userData.arm.rotation.x = -aSwing * 2.3;
        f.devil.userData.arm.rotation.x = -dSwing * 2.3;
        f.devil.userData.head.rotation.z = aSwing * 0.8;  // jolted by the angel
        f.angel.userData.head.rotation.z = -dSwing * 0.8; // jolted by the devil
        const hitNow = Math.floor(f.t / 0.55);
        if (hitNow > f.hits && f.t > 0.2) {
          f.hits = hitNow;
          spawnShock(f.mesh.position.clone().add(new THREE.Vector3(0, 0.65, hitNow % 2 ? -0.55 : 0.55)));
        }
        const sc = k < 0.1 ? k / 0.1 : k > 0.85 ? (1 - k) / 0.15 : 1;
        f.mesh.scale.setScalar(Math.max(0.01, sc));
      } else if (f.type === 'beam') {
        f.mesh.material.opacity = Math.sin(k * Math.PI) * 0.3;
        f.mesh.rotation.y += dt * 0.6;
      } else if (f.type === 'spark') {
        f.mesh.position.addScaledVector(f.v, dt);
        f.mesh.material.opacity = 0.9 * (1 - k);
      } else if (f.type === 'confetti') {
        f.mesh.position.addScaledVector(f.v, dt);
        f.v.y -= 5.5 * dt; // flutters more than it falls
        f.mesh.rotation.x += f.av.x * dt;
        f.mesh.rotation.y += f.av.y * dt;
        f.mesh.rotation.z += f.av.z * dt;
        f.mesh.material.opacity = k > 0.7 ? (1 - k) / 0.3 : 1;
      } else if (f.type === 'flame') {
        f.mesh.position.addScaledVector(f.v, dt);
        f.v.y += 4 * dt; // fire leaps UP
        f.mesh.scale.setScalar(Math.max(0.05, (1 - k) * f.big));
        f.mesh.material.opacity = 1 - k;
      } else if (f.type === 'feather') {
        f.mesh.position.addScaledVector(f.v, dt);
        f.v.y = Math.max(f.v.y - 3 * dt, -0.7); // feathers drift down, never drop
        f.v.x *= 1 - 0.9 * dt;
        f.v.z *= 1 - 0.9 * dt;
        f.mesh.rotation.x += f.av.x * dt;
        f.mesh.rotation.y += f.av.y * dt;
        f.mesh.rotation.z += f.av.z * dt;
        f.mesh.material.opacity = k > 0.6 ? (1 - k) / 0.4 : 1;
      } else {
        f.mesh.position.addScaledVector(f.v, dt);
        f.mesh.scale.setScalar((1 + k * 1.6) * f.big);
        f.mesh.material.opacity = 0.55 * (1 - k);
      }
    }
  }

  // --- screen shake ---
  let shakeAmp = 0;
  function shake(a) { shakeAmp = Math.max(shakeAmp, a); }
  function applyShake(dt, cam) {
    if (shakeAmp > 0.001) {
      cam.position.x += (Math.random() - 0.5) * shakeAmp;
      cam.position.y += (Math.random() - 0.5) * shakeAmp;
      shakeAmp *= Math.exp(-5 * dt);
    }
  }

  // --- campaign cast: Master Slee's ghost + Judge Pennywhistle, ringside ---
  // Simple stage figures (no physics) shown during cutscenes; cinePoints gives
  // the dialogue camera their heads for 3/4 close-ups.
  const spiritG = new THREE.Group();
  {
    const ghost = (c, o) => { const m = toonMat(c); m.transparent = true; m.opacity = o; return m; };
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.0, 10), ghost(0xbfe8ff, 0.4));
    tail.rotation.x = Math.PI; tail.position.y = 0.5; spiritG.add(tail);
    const robe = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 4, 10), ghost(0xd6f0ff, 0.55));
    robe.position.y = 1.25; spiritG.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), ghost(0xe8f8ff, 0.85));
    head.position.y = 1.85; spiritG.add(head);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), toonMat(0x2a4a5e));
      eye.position.set(0.145, 1.88, s * 0.055); spiritG.add(eye);
    }
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 8), ghost(0xffffff, 0.9));
    beard.rotation.x = Math.PI; beard.position.set(0.12, 1.68, 0); spiritG.add(beard);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), ghost(0xffffff, 0.9));
    knot.position.set(-0.04, 2.05, 0); spiritG.add(knot);
    spiritG.position.set(-3.4, 0.75, -2.4);   // hovering, facing his grandson
    spiritG.visible = false;
    scene.add(spiritG);
  }
  const judgeG = new THREE.Group();
  {
    const robe = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.72, 4, 10), toonMat(0x1b1b22));
    robe.position.y = 0.75; judgeG.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), toonMat(0xe2b688));
    head.position.y = 1.42; judgeG.add(head);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), toonMat(0x111111));
      eye.position.set(0.135, 1.45, s * 0.05); judgeG.add(eye);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), toonMat(0xf2ede1));
      puff.position.set(-0.02, 1.5, s * 0.13); judgeG.add(puff);
    }
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.1), toonMat(0xf2ede1));
    beard.position.set(0.13, 1.3, 0); judgeG.add(beard);
    const whistle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.028), toonMat(0xc9ced6));
    whistle.position.set(0.17, 1.36, 0.03); judgeG.add(whistle);
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.05), toonMat(0xd8b13c));
    tie.position.set(0.235, 1.05, 0); judgeG.add(tie);
    judgeG.traverse((m) => { m.castShadow = true; });
    judgeG.position.set(3.1, 0, -3.6);        // ringside, behind the rail
    judgeG.rotation.y = 0.5;                  // angled toward the ring
    judgeG.visible = false;
    scene.add(judgeG);
  }
  // Bruce Slee — the heir stands beside his grandfather's ghost during scenes
  const bruceG = new THREE.Group();
  {
    const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 4, 8), toonMat(0xf5c518));
    legs.position.y = 0.5; bruceG.add(legs);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.4, 4, 10), toonMat(0xe0ab7a));
    torso.position.y = 1.05; bruceG.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 12), toonMat(0xe0ab7a));
    head.position.y = 1.55; bruceG.add(head);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 10), toonMat(0x14100e));
    bowl.scale.set(1, 0.8, 1.05); bowl.position.set(-0.02, 1.61, 0); bruceG.add(bowl);
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.19), toonMat(0x0a0a10));
    shades.position.set(0.135, 1.57, 0); bruceG.add(shades);
    bruceG.traverse((m) => { m.castShadow = true; });
    // he stands ACROSS from the hovering spirit, facing him — a conversation,
    // not a totem pole
    bruceG.position.set(-1.5, 0, -2.4);
    bruceG.rotation.y = Math.PI;   // his face (+x features) turns toward grandfather
    bruceG.visible = false;
    scene.add(bruceG);
  }
  const setSpirit = (on) => { spiritG.visible = on; };
  const setJudge = (on) => { judgeG.visible = on; };
  const setBruce = (on) => { bruceG.visible = on; };
  const cinePoints = {
    spirit: () => new THREE.Vector3(spiritG.position.x, spiritG.position.y + 1.85, spiritG.position.z),
    judge: () => new THREE.Vector3(judgeG.position.x, judgeG.position.y + 1.42, judgeG.position.z),
    bruce: () => new THREE.Vector3(bruceG.position.x, 1.55, bruceG.position.z),
  };

  // --- FROZEN LAKE winter kit: mountains, snowmen, snowball kids, fur coats,
  // falling snow — all toggled by setWorldTheme('ice') ---
  const iceSkaters = [];
  const deerList = [];
  const bearList = [];
  const winterG = new THREE.Group();
  {
    const snowWhite = toonMat(0xf6fafc);
    const mtnMat = toonMat(0xe4ecf6);
    const mtn = (x, z, h, r) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), mtnMat);
      m.position.set(x, h / 2 - 1.5, z);
      winterG.add(m);
    };
    mtn(-30, -55, 26, 22); mtn(5, -62, 34, 26); mtn(45, -58, 30, 24);
    mtn(90, -64, 38, 30); mtn(128, -54, 28, 22);
    mtn(-25, 56, 30, 24); mtn(20, 62, 36, 28); mtn(65, 58, 30, 24);
    mtn(108, 62, 34, 26); mtn(138, 18, 32, 24);
    const snowman = (x, z, s, ry, scarfCol) => {
      const g = new THREE.Group();
      const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), snowWhite); b1.position.y = 0.45; g.add(b1);
      const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), snowWhite); b2.position.y = 1.05; g.add(b2);
      const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), snowWhite); b3.position.y = 1.55; g.add(b3);
      if (scarfCol) {
        const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 14), toonMat(scarfCol));
        scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.34; g.add(scarf);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.04), toonMat(scarfCol));
        tail.position.set(0.24, 1.18, 0.06); tail.rotation.z = -0.15; g.add(tail);
      }
      for (const sgn of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), toonMat(0x1a1a1a));
        eye.position.set(0.225, 1.63, sgn * 0.08); g.add(eye);
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.62, 5), toonMat(0x6b4a2e));
        stick.position.set(0, 1.12, sgn * 0.52); stick.rotation.x = sgn * -1.25; g.add(stick);
      }
      const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 8), toonMat(0xe8752d));
      carrot.rotation.z = -Math.PI / 2; carrot.position.set(0.36, 1.55, 0); g.add(carrot);
      for (const [bx, by] of [[0.31, 1.14], [0.35, 0.98], [0.36, 0.82]]) {
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), toonMat(0x1a1a1a));
        btn.position.set(bx, by, 0); g.add(btn);
      }
      g.traverse((m) => { m.castShadow = true; });
      g.scale.setScalar(s); g.position.set(x, 0, z); g.rotation.y = ry;
      winterG.add(g);
    };
    snowman(16, 9, 1, -0.4, 0xd83a3a); snowman(34, -10, 0.85, 0.5); snowman(55, 13, 1.15, -0.2, 0x3d7a5c);
    // two kids mid-snowball-fight — one ball frozen mid-air, as is county tradition
    const snowKid = (x, z, coat, ry, throwing) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.3, 3, 8), toonMat(coat)); body.position.y = 0.42; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), toonMat(0xf0c8a0)); head.position.y = 0.78; g.add(head);
      const hatK = new THREE.Mesh(new THREE.SphereGeometry(0.125, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), toonMat(0xd83a3a)); hatK.position.y = 0.8; g.add(hatK);
      const bob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), snowWhite); bob.position.y = 0.95; g.add(bob);
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 5, 5), toonMat(0x1a1a1a));
        eye.position.set(0.105, 0.8, s * 0.045); g.add(eye);
      }
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.24, 2, 6), toonMat(coat));
      if (throwing) { arm.position.set(0.05, 0.68, 0.14); arm.rotation.z = -2.2; }
      else { arm.position.set(0, 0.52, 0.18); arm.rotation.z = -0.5; }
      g.add(arm);
      g.traverse((m) => { m.castShadow = true; });
      g.position.set(x, 0, z); g.rotation.y = ry;
      winterG.add(g);
    };
    snowKid(24, 7.5, 0x4a6fa5, -1.4, true);
    snowKid(27.5, 7.8, 0x8a5fb0, 1.6, false);
    // skaters carving circles on the frozen pond (animated in updateAmbient)
    const skater = (coat, scarf, r, speed, phase) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 3, 8), toonMat(coat)); body.position.y = 0.62; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), toonMat(0xf0c8a0)); head.position.y = 1.05; g.add(head);
      const hatS = new THREE.Mesh(new THREE.SphereGeometry(0.135, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), toonMat(scarf)); hatS.position.y = 1.07; g.add(hatS);
      const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.04, 6, 12), toonMat(scarf)); wrap.rotation.x = Math.PI / 2; wrap.position.y = 0.9; g.add(wrap);
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 5), toonMat(0x1a1a1a));
        eye.position.set(0.115, 1.07, s * 0.05); g.add(eye);
      }
      for (const s of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.3, 2, 6), toonMat(coat));
        arm.position.set(-0.14, 0.72, s * 0.16); arm.rotation.x = s * 0.5; arm.rotation.z = 0.9; g.add(arm);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.03), toonMat(0xdddddd));
        blade.position.set(0.02, 0.02, s * 0.08); g.add(blade);
      }
      g.traverse((m) => { m.castShadow = true; });
      winterG.add(g);
      iceSkaters.push({ g, r, speed, phase });
    };
    skater(0xb54a4a, 0xf4f4f0, 3.6, 0.55, 0);
    skater(0x3d7a5c, 0xf0d060, 2.4, -0.42, 2.1);

    // igloos stand exactly where the farmhouses stood (their physics boxes
    // stay put, so the snow-buried homes still catch long flyers)
    const iglooMat = toonMat(0xeef4fa);
    const seamMat = toonMat(0xcfdfeb);
    const igloo = (x, z, ry, s) => {
      const g = new THREE.Group();
      const dome = new THREE.Mesh(new THREE.SphereGeometry(4.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), iglooMat);
      dome.scale.y = 0.82; g.add(dome);
      for (const [ringY, ringR] of [[1.15, 4.15], [2.3, 3.35], [3.2, 2.25]]) {
        const seam = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.07, 6, 24), seamMat);
        seam.rotation.x = Math.PI / 2; seam.position.y = ringY * 0.82; g.add(seam);
      }
      const tun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), iglooMat);
      tun.scale.set(1, 0.9, 1.4); tun.position.set(-4.4, 0, 0); g.add(tun);
      const doorway = new THREE.Mesh(new THREE.CircleGeometry(0.85, 12), toonMat(0x2a3038));
      doorway.rotation.y = -Math.PI / 2; doorway.position.set(-5.6, 0.7, 0); g.add(doorway);
      g.traverse((m) => { m.castShadow = true; });
      g.scale.setScalar(s); g.rotation.y = ry; g.position.set(x, 0, z);
      winterG.add(g);
    };
    igloo(96, 19, -0.55, 1.15); igloo(84, -27, 0.5, 0.95);
    igloo(108, -14, -0.2, 1.0); igloo(58, 31, 0.9, 0.85);

    // reindeer — one circles the meadow, one grazes; the leader's nose is red
    const reindeer = (x, z, opts = {}) => {
      const g = new THREE.Group();
      const hide = toonMat(0x8a5a3a);
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 4, 10), hide);
      body.rotation.z = Math.PI / 2; body.position.y = 0.78; g.add(body);
      for (const [lx, lz] of [[-0.32, -0.14], [-0.32, 0.14], [0.32, -0.14], [0.32, 0.14]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.62, 6), hide);
        leg.position.set(lx, 0.31, lz); g.add(leg);
      }
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.45, 8), hide);
      neck.position.set(0.52, 1.05, 0); neck.rotation.z = -0.6; g.add(neck);
      const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.16, 3, 8), hide);
      head.rotation.z = Math.PI / 2; head.position.set(0.72, 1.24, 0); g.add(head);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), toonMat(opts.redNose ? 0xe03434 : 0x2a2018));
      nose.position.set(0.87, 1.24, 0); g.add(nose);
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 5), toonMat(0x1a1a1a));
        eye.position.set(0.74, 1.31, s * 0.09); g.add(eye);
        const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.42, 5), toonMat(0x5f452c));
        antler.position.set(0.62, 1.5, s * 0.09); antler.rotation.x = s * 0.45; g.add(antler);
        const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 5), toonMat(0x5f452c));
        tine.position.set(0.66, 1.56, s * 0.17); tine.rotation.z = -0.9; tine.rotation.x = s * 0.5; g.add(tine);
      }
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), toonMat(0xe8dcc8));
      tail.position.set(-0.55, 0.86, 0); g.add(tail);
      g.traverse((m) => { m.castShadow = true; });
      g.position.set(x, 0, z);
      winterG.add(g);
      deerList.push({ g, x, z, ...opts });
    };
    reindeer(29, 14, { redNose: true, cx: 29, cz: 14, r: 4.5, speed: 0.28, phase: 0 });
    reindeer(60, 20, { cx: 60, cz: 20, r: 4, speed: -0.22, phase: 2.4 });
    reindeer(48, -17, { graze: true, ry: 2.2 });

    // polar bears amble along the treelines, minding their own business
    const polarBear = (x0, x1, z, speed, phase) => {
      const g = new THREE.Group();
      const furB = toonMat(0xe9e2cf); // warm ivory so he reads against blue-white snow
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.9, 4, 10), furB);
      body.rotation.z = Math.PI / 2; body.position.y = 0.72; g.add(body);
      for (const [lx, lz] of [[-0.42, -0.24], [-0.42, 0.24], [0.42, -0.24], [0.42, 0.24]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.5, 7), furB);
        leg.position.set(lx, 0.25, lz); g.add(leg);
      }
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), furB);
      head.position.set(0.78, 0.95, 0); g.add(head);
      const snout = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.1, 3, 8), toonMat(0xd6cbb2));
      snout.rotation.z = Math.PI / 2; snout.position.set(1.02, 0.88, 0); g.add(snout);
      const noseB = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), toonMat(0x1a1a1a));
      noseB.position.set(1.14, 0.88, 0); g.add(noseB);
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), furB);
        ear.position.set(0.66, 1.22, s * 0.2); g.add(ear);
        const eyeB = new THREE.Mesh(new THREE.SphereGeometry(0.032, 5, 5), toonMat(0x1a1a1a));
        eyeB.position.set(0.98, 1.02, s * 0.11); g.add(eyeB);
      }
      const tailB = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), furB);
      tailB.position.set(-0.78, 0.82, 0); g.add(tailB);
      g.traverse((m) => { m.castShadow = true; });
      g.scale.setScalar(1.18);
      g.position.set(x0, 0, z);
      winterG.add(g);
      bearList.push({ g, x0, x1, z, speed, phase });
    };
    polarBear(14, 50, 29.5, 0.05, 0);
    polarBear(30, 68, -20, 0.04, 0.5);

    // snow load on the barn roof (barn at (18,0,-11), slopes at ±2.05 rot ∓0.62)
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.16, 7.0), toonMat(0xf4f8fb));
      cap.position.set(18 + s * 2.05, 5.62, -11);
      cap.rotation.z = -s * 0.62;
      cap.castShadow = true;
      winterG.add(cap);
    }
    // the grazing reindeer has actually dug through to the grass
    const digPatch = new THREE.Mesh(new THREE.CircleGeometry(0.5, 10), toonMat(0x6e5a40));
    digPatch.rotation.x = -Math.PI / 2;
    digPatch.position.set(48.9, 0.02, -17);
    winterG.add(digPatch);

    // snow drifts soften the line where the summer fences stood
    const driftMat = toonMat(0xf3f7fa);
    for (let i = 0; i < 16; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.7 + Math.random() * 0.9, 10, 8), driftMat);
      d.scale.y = 0.32;
      d.position.set(-8 + Math.random() * 66, 0.05, (i % 2 ? 1 : -1) * (2.9 + Math.random() * 0.9));
      d.rotation.y = Math.random() * Math.PI;
      winterG.add(d);
    }
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), toonMat(0xffffff));
    ball.position.set(25.8, 1.15, 7.6); winterG.add(ball);
    const ballMat = toonMat(0xd4dfe9); // blue-gray so they read against the snow
    for (const [bx, bz] of [[24.6, 7.0], [26.8, 8.3], [25.5, 8.6]]) {
      const gb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), ballMat);
      gb.castShadow = true;
      gb.position.set(bx, 0.09, bz); winterG.add(gb);
    }
  }
  winterG.visible = false;
  scene.add(winterG);

  // in winter the CRASH ZONE barricade is a heaped pile of snow. The boulders
  // join barricade.pieces so a flyer still blasts them apart (and resetBarricade
  // restacks them); theme switching swaps which set of pieces is visible.
  const summerBarricade = barricade.pieces.map((p) => p.mesh);
  const snowBarricade = [];
  {
    const bx = START_X + 20;
    const packTop = toonMat(0xf0f5f9);
    const packLow = toonMat(0xd6e4ef); // ice-blue base so the pile has a silhouette
    let seed = 1;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let layer = 0; layer < 4; layer++) {
      const count = 7 - layer;
      for (let i = 0; i < count; i++) {
        const r = 0.55 + rnd() * 0.35 - layer * 0.06;
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), layer < 2 ? packLow : packTop);
        m.position.set(bx + (rnd() - 0.5) * 0.5, 0.35 + layer * 0.72, -2.3 + (i + 0.5) * (4.6 / count) + (rnd() - 0.5) * 0.3);
        m.scale.y = 0.85;
        m.castShadow = true;
        m.visible = false;
        scene.add(m);
        snowBarricade.push(m);
        barricade.pieces.push({ mesh: m, homeP: m.position.clone(), homeQ: m.quaternion.clone() });
      }
    }
  }

  // --- THE DESERT: sun-bleached ghost-town rodeo. Mesas ring the horizon,
  // adobe shacks stand on the farmhouse footprints (physics boxes unchanged),
  // whiskey barrels stack at the 20m line, tumbleweeds roll the lane. ---
  const desertG = new THREE.Group();
  const tumbleweeds = [];
  {
    const mesaMat = toonMat(0xb5623a), strataMat = toonMat(0xc98a5a);
    const mesa = (x, z, h, r) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r, h, 6), mesaMat);
      m.position.set(x, h / 2 - 1.5, z);
      desertG.add(m);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.94, h * 0.16, 6), strataMat);
      band.position.set(x, h * 0.55, z);
      desertG.add(band);
    };
    mesa(-30, -55, 22, 20); mesa(5, -62, 28, 24); mesa(45, -58, 24, 22);
    mesa(90, -64, 30, 26); mesa(128, -54, 22, 20);
    mesa(-25, 56, 24, 22); mesa(20, 62, 30, 24); mesa(65, 58, 24, 22);
    mesa(108, 62, 28, 24); mesa(138, 18, 26, 22);
    // adobe/ghost-town shacks on the farmhouse footprints (solids already there)
    const adobeMat = toonMat(0xc99a5e), doorMat = toonMat(0x2a2018);
    for (const [x, z, ry, s] of [[96, 19, -0.55, 1.1], [84, -27, 0.5, 0.9], [108, -14, -0.2, 1.0], [58, 31, 0.9, 0.85]]) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(6.5, 5.5, 10), adobeMat);
      body.position.y = 2.75;
      g.add(body);
      const beamMat = toonMat(0x7a5a34);
      for (let b = -1; b <= 1; b++) {
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7.4, 5), beamMat);
        beam.rotation.z = Math.PI / 2;
        beam.position.set(0, 5.2, b * 2.8);
        g.add(beam);
      }
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.2), doorMat);
      door.position.set(-3.28, 1.6, 0);
      door.rotation.y = -Math.PI / 2;
      g.add(door);
      g.traverse((m) => { m.castShadow = true; });
      g.scale.setScalar(s);
      g.rotation.y = ry;
      g.position.set(x, 0, z);
      desertG.add(g);
    }
    // cattle skulls on the old fence posts near the ring — the rodeo's dress code
    const boneMat = toonMat(0xe8e0cc);
    for (const [sx, sz] of [[6, 3.4], [38, -3.4]]) {
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 7), boneMat);
      skull.scale.set(1, 0.85, 0.75);
      skull.position.set(sx, 1.15, sz);
      desertG.add(skull);
      for (const sgn of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4, 5), boneMat);
        horn.rotation.z = sgn * 1.35;
        horn.position.set(sx, 1.25, sz + sgn * 0.3);
        desertG.add(horn);
      }
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.1, 0.13), toonMat(0x8a6844));
      post.position.set(sx, 0.55, sz);
      desertG.add(post);
    }
    // tumbleweeds: wiry balls rolling +x across the field (ambient, no physics —
    // a launch is never deflected by luck; they're weather, not obstacles)
    const twMat = new THREE.MeshBasicMaterial({ color: 0xb59a5e, wireframe: true });
    for (let i = 0; i < 6; i++) {
      const r = 0.45 + Math.random() * 0.35;
      const tw = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), twMat);
      tw.position.set(-20 + Math.random() * 130, r, -9 + Math.random() * 18);
      desertG.add(tw);
      tumbleweeds.push({ m: tw, r, speed: 3 + Math.random() * 2.5, z0: tw.position.z });
    }
    // CAMELS ambling the dunes (deterministic amble, like the lava salamander)
    const camelTan = toonMat(0xc9a066);
    for (const [cx, cz, span, spd, ph0] of [[20, -15, 44, 0.04, 0], [64, 16, 40, 0.033, 1], [40, -20, 36, 0.028, 2]]) {
      const cam = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 2.0, 6, 10), camelTan);
      body.rotation.z = Math.PI / 2; body.position.y = 1.9; cam.add(body);
      for (const hx of [-0.4, 0.5]) {          // two humps
        const hump = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), camelTan);
        hump.position.set(hx, 2.5, 0); hump.scale.y = 0.9; cam.add(hump);
      }
      const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.4, 4, 8), camelTan);
      neck.position.set(1.4, 2.5, 0); neck.rotation.z = 0.7; cam.add(neck);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), camelTan);
      head.position.set(2.1, 3.2, 0); head.scale.x = 1.3; cam.add(head);
      for (const [lx, lz] of [[-0.8, 0.35], [-0.8, -0.35], [0.8, 0.35], [0.8, -0.35]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 1.9, 7), camelTan);
        leg.position.set(lx, 0.95, lz); cam.add(leg);
      }
      cam.position.set(cx, 0, cz);
      cam.traverse((m) => { m.castShadow = true; });
      desertG.add(cam);
      tumbleweeds.push({ m: cam, camel: true, x0: cx, span, spd, ph0 });
    }
    desertG.visible = false;
    scene.add(desertG);
  }
  // barrel barricade at the 20m CRASH ZONE — joins barricade.pieces so it
  // still bursts on a flyer and restacks on reset (visibility per-world)
  const barrelBarricade = [];
  {
    const bx = START_X + 20;
    const stave = toonMat(0x7a4a2a), hoop = toonMat(0x3a3a40);
    let bi = 0;
    for (const [by, count] of [[0.6, 4], [1.8, 3]]) {
      for (let i = 0; i < count; i++) {
        const g = new THREE.Group();
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.15, 10), stave);
        g.add(barrel);
        for (const hy of [-0.4, 0.35]) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.04, 6, 14), hoop);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = hy;
          g.add(ring);
        }
        g.position.set(bx + (bi % 2 ? 0.18 : -0.12), by, -1.9 + i * (3.8 / Math.max(1, count - 1)));
        g.traverse((m) => { m.castShadow = true; });
        g.visible = false;
        scene.add(g);
        barrelBarricade.push(g);
        barricade.pieces.push({ mesh: g, homeP: g.position.clone(), homeQ: g.quaternion.clone() });
        bi++;
      }
    }
  }

  // ======================================================================
  // THE WORLD KITS — jungle / dojo / lava / heaven / hell / therapy.
  // Each: a perimeter re-dress on the SAME perimSpots (the physics edge stays
  // dressed), signature structures on the existing footprints (solids never
  // move), a barricade variant that joins barricade.pieces, and 1-3 ambient
  // animations driven from updateAmbient. Lean kits — signature over clutter.
  // ======================================================================
  const mkBelt = (build, stride = 2) => {
    const g = new THREE.Group();
    for (let i = 0; i < perimSpots.length; i += stride) build(g, perimSpots[i][0], perimSpots[i][1], i);
    g.traverse((m) => { m.castShadow = true; });
    g.visible = false;
    scene.add(g);
    return g;
  };
  const mkBarricade = (build) => {
    const arr = [];
    const bx = START_X + 20;
    build(arr, bx);
    for (const g of arr) {
      g.traverse((m) => { m.castShadow = true; });
      g.visible = false;
      scene.add(g);
      barricade.pieces.push({ mesh: g, homeP: g.position.clone(), homeQ: g.quaternion.clone() });
    }
    return arr;
  };
  const glowMat = (hex) => new THREE.MeshBasicMaterial({ color: hex });

  // --- 🌴 JUNGLE ---
  const jungleG = new THREE.Group();
  let monkey = null;
  const jungleMonkeys = [];
  let jungleTiger = null;
  {
    const trunkMat = toonMat(0x5a3e24), leafDk = toonMat(0x1f4a1c), leafMid = toonMat(0x2f6a2a), leafLt = toonMat(0x3f8a34);
    const vineMat = toonMat(0x3a6a2e);
    // ---- THE CANOPY: a dense leafy ceiling over the WHOLE lane — you fight
    // UNDER the forest. Overlapping leaf clusters at y 13-17 with gaps for
    // light shafts, so the sky barely shows. ----
    for (let i = 0; i < 64; i++) {
      const cx = -18 + Math.random() * 132, cz = -15 + Math.random() * 30;
      const r = 2.4 + Math.random() * 2.6;
      const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 7), [leafDk, leafMid, leafLt][i % 3]);
      blob.position.set(cx, 13 + Math.random() * 3.5, cz);
      blob.scale.y = 0.55;
      jungleG.add(blob);
    }
    // soft light shafts stabbing through canopy gaps
    for (const [sx, sz] of [[18, 3], [46, -4], [78, 5], [100, -2]]) {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 3.2, 13, 8, 1, true), glowMat(0xf6f4c8));
      shaft.material.transparent = true; shaft.material.opacity = 0.13; shaft.material.side = THREE.DoubleSide;
      shaft.position.set(sx, 7, sz); shaft.rotation.z = 0.16;
      jungleG.add(shaft);
    }
    // ---- BELT: a WALL of towering buttressed jungle trees ----
    const belt = mkBelt((g, x, z, i) => {
      const h = 11 + (i % 4) * 2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.0, h, 7), trunkMat);
      trunk.position.set(x, h / 2, z); g.add(trunk);
      for (let r = 0; r < 4; r++) {          // buttress roots flaring at the base
        const a = r / 4 * Math.PI * 2;
        const root = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.2, 4), trunkMat);
        root.position.set(x + Math.cos(a) * 0.7, 1.1, z + Math.sin(a) * 0.7); root.rotation.z = Math.cos(a) * 0.35; g.add(root);
      }
      for (const [ox, oy, oz, rr] of [[0, h + 1, 0, 3.2], [1.7, h + 0.3, 0.6, 2.1], [-1.5, h + 0.5, -0.5, 1.9]]) {
        const blob = new THREE.Mesh(new THREE.SphereGeometry(rr, 8, 8), [leafDk, leafMid][i % 2]);
        blob.position.set(x + ox, oy, z + oz); g.add(blob);
      }
    });
    belt.visible = true; jungleG.add(belt);
    // ---- HANGING VINES everywhere: from the canopy down along the flanks ----
    for (let i = 0; i < 34; i++) {
      const vx = -16 + Math.random() * 130, side = i % 2 ? 1 : -1;
      const vz = side * (5.5 + Math.random() * 6);
      const len = 4 + Math.random() * 6;
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, len, 5), vineMat);
      vine.position.set(vx, 13 - len / 2, vz);
      jungleG.add(vine);
      if (i % 3 === 0) {                      // a leaf tuft at the tip
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.4, 7, 6), leafLt);
        tuft.position.set(vx, 13 - len, vz); jungleG.add(tuft);
      }
    }
    // ---- RAFFLESIA: giant red corpse-flowers on the forest floor ----
    const mkRafflesia = (x, z) => {
      const f = new THREE.Group();
      const petalMat = toonMat(0xa83228), spotMat = toonMat(0xecdcc4);
      for (let p = 0; p < 5; p++) {
        const a = p / 5 * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.72, 8, 6), petalMat);
        petal.scale.set(1, 0.32, 0.72);
        petal.position.set(Math.cos(a) * 0.82, 0.28, Math.sin(a) * 0.82);
        f.add(petal);
        for (let s = 0; s < 3; s++) {
          const spot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), spotMat);
          spot.position.set(Math.cos(a) * 0.82 + (Math.random() - 0.5) * 0.6, 0.42, Math.sin(a) * 0.82 + (Math.random() - 0.5) * 0.6);
          f.add(spot);
        }
      }
      const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.4, 0.5, 12), toonMat(0x5e1814));
      pit.position.y = 0.35; f.add(pit);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.13, 8, 14), petalMat);
      rim.rotation.x = Math.PI / 2; rim.position.y = 0.56; f.add(rim);
      f.position.set(x, 0, z); f.scale.setScalar(1.5);
      jungleG.add(f);
    };
    mkRafflesia(17, -6.6); mkRafflesia(52, 6.6); mkRafflesia(74, -6.2); mkRafflesia(92, 6.4);
    // ---- FERN undergrowth along the lane shoulders ----
    for (let i = 0; i < 22; i++) {
      const side = i % 2 ? 1 : -1, fx = 6 + i * 4.4;
      for (let fr = 0; fr < 5; fr++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.3, 4), [leafMid, leafLt][fr % 2]);
        const a = (fr / 5 - 0.5) * 1.6;
        frond.position.set(fx + Math.sin(a) * 0.3, 0.65, side * 5.4 + Math.cos(a) * 0.2);
        frond.rotation.z = a; jungleG.add(frond);
      }
    }
    // ruins on the farmhouse footprints
    const stone = toonMat(0x8a9a8a), moss = toonMat(0x4a7a3a);
    const ruin = (x, z, kind) => {
      const g = new THREE.Group();
      if (kind === 'head') {
        const head = new THREE.Mesh(new THREE.BoxGeometry(4.5, 6, 4.5), stone);
        head.position.y = 3;
        g.add(head);
        const nose = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1.2), stone);
        nose.position.set(-2.6, 3, 0);
        g.add(nose);
      } else if (kind === 'zig') {
        for (let s = 0; s < 3; s++) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(7 - s * 2, 1.6, 9 - s * 2), stone);
          step.position.y = 0.8 + s * 1.6;
          g.add(step);
        }
      } else {
        for (const pz of [-2.4, 2.4]) {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 6.5, 8), stone);
          pillar.position.set(0, 3.25, pz);
          g.add(pillar);
        }
      }
      const patch = new THREE.Mesh(new THREE.SphereGeometry(1.4, 7, 6), moss);
      patch.scale.set(1, 0.3, 1);
      patch.position.set(0, kind === 'head' ? 6 : 4.6, 0.8);
      g.add(patch);
      g.position.set(x, 0, z);
      jungleG.add(g);
    };
    ruin(96, 19, 'head'); ruin(84, -27, 'zig'); ruin(108, -14, 'pillars'); ruin(58, 31, 'zig');
    // the vine curtain across the lane (visual only — no collider)
    for (let i = 0; i < 9; i++) {
      const len = 2.6 + Math.random() * 1.8;
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, len, 5), toonMat(0x3a6a2e));
      vine.position.set(35, 8 - len / 2, -2.6 + i * 0.65);
      jungleG.add(vine);
    }
    // lily pads + croc eyes on the pond
    for (let i = 0; i < 6; i++) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.5 + Math.random() * 0.3, 8), toonMat(0x4a8a3a));
      pad.rotation.x = -Math.PI / 2;
      const a = Math.random() * Math.PI * 2, rr = 1 + Math.random() * 4;
      pad.position.set(40 + Math.cos(a) * rr, 0.05, 24 + Math.sin(a) * rr);
      jungleG.add(pad);
    }
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 6), toonMat(0x3a5a2a));
      eye.position.set(37.5, 0.12, 23.4 + s * 0.35);
      jungleG.add(eye);
    }
    // the monkey on a vine — pendulum from a pivot at y 7
    monkey = new THREE.Group();
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.6, 5), toonMat(0x5a4a2e));
    rope.position.y = -2.3;
    monkey.add(rope);
    const mBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.3, 3, 8), toonMat(0x8a5a3a));
    mBody.position.y = -4.8;
    monkey.add(mBody);
    const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), toonMat(0x8a5a3a));
    mHead.position.y = -4.3;
    monkey.add(mHead);
    const mFace = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 6), toonMat(0xe8c8a2));
    mFace.position.set(-0.09, -4.3, 0);
    monkey.add(mFace);
    monkey.position.set(30, 7, -8);
    jungleG.add(monkey);
    // ---- MORE MONKEYS perched on branches, chattering (bob in place) ----
    const mkMonkey = () => {
      const mk = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.28, 3, 8), toonMat(0x7a4a2e));
      b.position.y = 0.3; mk.add(b);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), toonMat(0x7a4a2e));
      hd.position.y = 0.62; mk.add(hd);
      const fc = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 6), toonMat(0xe8c8a2));
      fc.position.set(-0.08, 0.6, 0); mk.add(fc);
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), toonMat(0x7a4a2e));
        ear.position.set(0, 0.72, s * 0.15); mk.add(ear);
      }
      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.7, 3, 6), toonMat(0x7a4a2e));
      tail.position.set(0.25, 0.3, 0); tail.rotation.z = 1; mk.add(tail);
      return mk;
    };
    for (const [mx, my, mz] of [[22, 8.5, 6], [58, 9, -7], [86, 8, 6.5], [44, 10, 7]]) {
      const mk = mkMonkey(); mk.position.set(mx, my, mz);
      jungleG.add(mk); jungleMonkeys.push({ g: mk, ph: mx });
    }
    // ---- THE TIGER prowling the near shoulder ----
    jungleTiger = new THREE.Group();
    const tOr = toonMat(0xe08a2a), tSt = toonMat(0x241610), tW = toonMat(0xf0e4d4);
    const tBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.9, 6, 10), tOr);
    tBody.rotation.z = Math.PI / 2; tBody.position.y = 0.95; jungleTiger.add(tBody);
    for (let s = 0; s < 6; s++) {
      const st = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.06, 6, 12), tSt);
      st.rotation.y = Math.PI / 2; st.position.set(-1.0 + s * 0.4, 0.95, 0); jungleTiger.add(st);
    }
    const tHead = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), tOr);
    tHead.position.set(1.45, 1.1, 0); jungleTiger.add(tHead);
    const tSnout = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), tW);
    tSnout.position.set(1.85, 1.0, 0); tSnout.scale.x = 0.8; jungleTiger.add(tSnout);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), glowMat(0xd8e030));
      eye.position.set(1.75, 1.25, s * 0.2); jungleTiger.add(eye);
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 5), tOr);
      ear.position.set(1.35, 1.5, s * 0.25); jungleTiger.add(ear);
    }
    for (const [lx, lz] of [[-0.7, 0.35], [-0.7, -0.35], [0.7, 0.35], [0.7, -0.35]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.9, 7), tOr);
      leg.position.set(lx, 0.45, lz); jungleTiger.add(leg);
    }
    const tTail = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.5, 4, 8), tOr);
    tTail.position.set(-1.3, 1.0, 0); tTail.rotation.z = 0.5; jungleTiger.add(tTail);
    jungleTiger.position.set(24, 0, -12); jungleG.add(jungleTiger);
    jungleG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    jungleG.visible = false;
    scene.add(jungleG);
  }
  const bambooBarricade = mkBarricade((arr, bx) => {
    for (const [by, count] of [[0.4, 5], [1.1, 4], [1.8, 3]]) {
      for (let i = 0; i < count; i++) {
        const g = new THREE.Group();
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.5, 8), toonMat(0x9ab55e));
        g.add(log);
        g.position.set(bx, by, -2 + i * (4 / Math.max(1, count - 1)));
        arr.push(g);
      }
    }
  });

  // --- 🥋 DOJO ---
  const dojoG = new THREE.Group();
  let gongDisc = null, dojoWheel = null;
  const kois = [];
  const dojoTrainers = [];
  {
    const timber = toonMat(0x8a5e34), timberDk = toonMat(0x5e3f22), paper = toonMat(0xf2ead6);
    const tatami = toonMat(0xc7b06a), tatamiEdge = toonMat(0x2a3a2a), red = toonMat(0xb0362a), stoneMat = toonMat(0xb5ab98);
    // ---- THE GREAT ROOF: a pitched timber roof over the whole hall, so you
    // train UNDER it. Two long sloped planes to a ridge + exposed rafters. ----
    for (const s of [-1, 1]) {
      const slope = new THREE.Mesh(new THREE.BoxGeometry(132, 0.6, 15), timberDk);
      slope.position.set(50, 15, s * 6.6); slope.rotation.x = s * 0.5;
      dojoG.add(slope);
    }
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(132, 0.9, 0.9), timber);
    ridge.position.set(50, 18.3, 0); dojoG.add(ridge);
    for (let rx = -14; rx < 108; rx += 6) {          // exposed cross-rafters
      const raf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 22), timber);
      raf.position.set(rx, 12.2, 0); dojoG.add(raf);
    }
    // ---- TATAMI floor: mat panels down the lane with dark cloth borders ----
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(132, 15), tatami);
    mat.rotation.x = -Math.PI / 2; mat.position.set(50, 0.02, 0); dojoG.add(mat);
    for (let mx = -16; mx < 116; mx += 6) {          // mat seams
      const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 15), tatamiEdge);
      seam.rotation.x = -Math.PI / 2; seam.position.set(mx, 0.03, 0); dojoG.add(seam);
    }
    for (const ze of [-7.4, 7.4]) {
      const border = new THREE.Mesh(new THREE.PlaneGeometry(132, 0.5), tatamiEdge);
      border.rotation.x = -Math.PI / 2; border.position.set(50, 0.03, ze); dojoG.add(border);
    }
    // ---- TIMBER PILLARS + SHOJI walls flanking the hall ----
    const mkPillar = (x, zc) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.8, 12, 0.8), timber);
      p.position.set(x, 6, zc); dojoG.add(p);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.2), timberDk);
      cap.position.set(x, 12, zc); dojoG.add(cap);
    };
    for (let px = -14; px <= 106; px += 12) { mkPillar(px, -11); mkPillar(px, 11); }
    for (const zc of [-11, 11]) {                     // shoji screen bays + a top beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(132, 0.7, 0.7), timber);
      beam.position.set(50, 9.5, zc); dojoG.add(beam);
      for (let sx = -14; sx < 106; sx += 4) {
        const scr = new THREE.Mesh(new THREE.BoxGeometry(3.6, 8, 0.15), paper);
        scr.position.set(sx, 4.6, zc); dojoG.add(scr);
        for (const gy of [2, 4.6, 7.2]) {             // muntin grid on the paper
          const bar = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.1, 0.18), timberDk);
          bar.position.set(sx, gy, zc); dojoG.add(bar);
        }
      }
    }
    // ---- hanging PAPER LANTERNS glowing along the hall ----
    for (let lx = 4; lx < 100; lx += 16) {
      for (const lz of [-4.5, 4.5]) {
        const lant = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.1, 12), glowMat(0xffcf7a));
        lant.material.transparent = true; lant.material.opacity = 0.92;
        lant.position.set(lx, 8, lz); dojoG.add(lant);
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3, 4), timberDk);
        cord.position.set(lx, 10, lz); dojoG.add(cord);
      }
    }
    // ---- THE KAMIZA: a raised dais at the far end with a hanging scroll ----
    const dais = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 20), timber);
    dais.position.set(106, 0.3, 0); dojoG.add(dais);
    const scroll = new THREE.Mesh(new THREE.PlaneGeometry(2, 5), paper);
    scroll.position.set(108.4, 6, 0); scroll.rotation.y = -Math.PI / 2; dojoG.add(scroll);
    for (const sy of [8.6, 3.4]) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8), timberDk);
      rod.rotation.x = Math.PI / 2; rod.position.set(108.3, sy, 0); dojoG.add(rod);
    }
    const kanji = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.2),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('SLAP', '#1a1a1a'), transparent: true }));
    kanji.position.set(108.35, 6, 0); kanji.rotation.y = -Math.PI / 2; dojoG.add(kanji);
    // ---- WEAPON RACK on the near wall: bokken + staves ----
    const rack = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 0.3), timberDk);
    rack.position.set(20, 1.6, -10.6); dojoG.add(rack);
    for (let w = 0; w < 4; w++) {
      const bokken = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 6), timber);
      bokken.position.set(19 + w * 0.55, 1.6, -10.4); dojoG.add(bokken);
    }
    // ---- BELT: the garden GLIMPSED outside — bamboo, a stone lantern, and a
    // turning WATERWHEEL (the one bit of "outside" you can see past the hall) ----
    dojoG.add(mkBelt((g, x, z, i) => {
      if (i % 6 === 0) {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.5, 6), stoneMat);
        base.position.set(x, 0.75, z); g.add(base);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.5, 6), stoneMat);
        cap.position.set(x, 1.8, z); g.add(cap);
        return;
      }
      for (let b = 0; b < 3; b++) {
        const h = 5 + (b + i) % 3;
        const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, h, 5), toonMat(0x7a9a4a));
        cane.position.set(x + (b - 1) * 0.5, h / 2, z); g.add(cane);
      }
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.4, 7, 6), toonMat(0x6a9a3a));
      leaf.scale.set(1, 0.55, 1); leaf.position.set(x, 5.6, z); g.add(leaf);
    }));
    dojoG.children[dojoG.children.length - 1].visible = true;
    // the waterwheel in the garden stream, off the near-left corner
    dojoWheel = new THREE.Group();
    const wheelMat = toonMat(0x6e4a2a);
    const whub = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.7, 10), wheelMat);
    whub.rotation.x = Math.PI / 2; dojoWheel.add(whub);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.6, 0.12), wheelMat);
      spoke.rotation.z = a; dojoWheel.add(spoke);
      const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.8), wheelMat);
      paddle.position.set(Math.cos(a) * 1.85, Math.sin(a) * 1.85, 0); paddle.rotation.z = a; dojoWheel.add(paddle);
    }
    const wrim = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.11, 6, 22), wheelMat);
    dojoWheel.add(wrim);
    const stream = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), toonMat(0x4a7a8a));
    stream.rotation.x = -Math.PI / 2; stream.position.set(-16, 0.05, -18); dojoG.add(stream);
    dojoWheel.position.set(-15, 2.3, -19); dojoG.add(dojoWheel);
    // THE GREAT GONG on the hay-wall footprint (62m) — SLAPMASTER rings it here
    const gongG = new THREE.Group();
    const frameMat = toonMat(0x5a4028);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 9.5, 7), frameMat);
      leg.position.set(0, 4.75, s * 4.6);
      leg.rotation.x = s * 0.18;
      gongG.add(leg);
    }
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 9.4, 7), frameMat);
    cross.rotation.x = Math.PI / 2;
    cross.position.y = 9.1;
    gongG.add(cross);
    gongDisc = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.3, 22), toonMat(0xb08a3a));
    gongDisc.rotation.z = Math.PI / 2;
    gongDisc.position.y = 4.7;
    gongG.add(gongDisc);
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), toonMat(0x7a5c28));
    boss.scale.x = 0.4;
    boss.position.y = 4.7;
    gongG.add(boss);
    gongG.position.set(60.4, 0, 0);
    dojoG.add(gongG);
    // wooden training dummies (mook jong)
    for (const [dx, dz] of [[26, 6.5], [44, -6], [52, 6]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.2, 8), toonMat(0xc9a468));
      post.position.set(dx, 1.1, dz);
      dojoG.add(post);
      for (const [ay, ar] of [[1.5, 0.5], [1.2, -0.6], [0.9, 0.4]]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 5), toonMat(0xb08a54));
        arm.rotation.z = Math.PI / 2;
        arm.rotation.y = ar;
        arm.position.set(dx, ay, dz);
        dojoG.add(arm);
      }
    }
    // koi in the pond + stepping stones
    for (const [kx, kz] of [[38.5, 23], [41, 25.5], [40.5, 22.5]]) {
      const koi = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 3, 6), toonMat(0xe8762a));
      koi.rotation.z = Math.PI / 2;
      koi.position.set(kx, 0.06, kz);
      dojoG.add(koi);
      kois.push({ m: koi, a: Math.random() * Math.PI * 2, r: 1.2 + Math.random() * 1.2 });
    }
    for (let i = 0; i < 4; i++) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.16, 7), stoneMat);
      st.position.set(36.5 + i * 1.6, 0.08, 24 - i * 0.8);
      dojoG.add(st);
    }
    // ---- KARATEKA: pairs of students in gi TRAINING along the sides, facing
    // each other and throwing strikes on a fixed rhythm (no farm spectators) ----
    const gi = toonMat(0xf0ece0), skinTone = toonMat(0xe8c19a);
    const beltCols = [0xf0ece0, 0x8a5a2a, 0x2a6a3a, 0x2a2a33, 0xb03028];
    const mkKarateka = (belt) => {
      const k = new THREE.Group();
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 3, 8), gi);
      torso.position.y = 1.0; k.add(torso);
      const beltM = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 8), toonMat(belt));
      beltM.position.y = 0.78; k.add(beltM);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), skinTone);
      head.position.y = 1.5; k.add(head);
      for (const s of [-1, 1]) {                     // legs (front stance)
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.55, 3, 6), gi);
        leg.position.set(s * 0.12, 0.35, s * 0.15); k.add(leg);
      }
      const armL = new THREE.Group();                // lead arm (punches)
      const uaL = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.5, 3, 6), gi);
      uaL.position.set(0.25, -0.02, 0); uaL.rotation.z = Math.PI / 2; armL.add(uaL);
      const fistL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), skinTone);
      fistL.position.set(0.5, -0.02, 0); armL.add(fistL);
      armL.position.set(0, 1.1, 0); k.add(armL);
      const armR = new THREE.Group();                // rear arm (chambers)
      const uaR = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.4, 3, 6), gi);
      uaR.position.set(-0.18, 0, 0); uaR.rotation.z = Math.PI / 2; armR.add(uaR);
      armR.position.set(0, 1.05, 0); k.add(armR);
      k.userData = { armL, armR };
      return k;
    };
    // pairs face each other, off both shoulders, down the hall
    for (const [px, pz] of [[24, -9], [40, 9], [58, -9], [78, 9], [94, -9]]) {
      const a = mkKarateka(beltCols[(px) % 5]); a.position.set(px, 0, pz); a.rotation.y = pz < 0 ? 0 : Math.PI;
      const b = mkKarateka(beltCols[(px + 2) % 5]); b.position.set(px + (pz < 0 ? 2.4 : -2.4), 0, pz); b.rotation.y = pz < 0 ? Math.PI : 0;
      dojoG.add(a, b);
      dojoTrainers.push({ g: a, ph: px * 0.7 }, { g: b, ph: px * 0.7 + 1.1 });
    }
    dojoG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    dojoG.visible = false;
    scene.add(dojoG);
  }
  const shojiBarricade = mkBarricade((arr, bx) => {
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 1.25), toonMat(0x5a4028));
      g.add(frame);
      // the paper pokes through both frame faces, so the wall reads WHITE
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.05, 1.02), toonMat(0xf4efe2));
      g.add(paper);
      g.position.set(bx, 1.7, -1.9 + i * 1.27);
      arr.push(g);
    }
  });

  // --- 🌋 LAVA LAND ---
  const lavaG = new THREE.Group();
  const geysers = [];
  const lavaFlames = [], lavaDemons = [], magmaPools = [], lavaSmoke = [], seaMats = [], emberJets = [];
  let salamander = null;
  {
    const rock = toonMat(0x241c1e);        // cooled basalt crust
    const rockDk = toonMat(0x160f10);
    const crackMat = () => new THREE.MeshBasicMaterial({ color: 0xff5a18 });
    const emberMat = () => new THREE.MeshBasicMaterial({ color: 0xff9a30 });
    // a small flame = stacked cones, base→tip hotter (flickers in updateAmbient)
    const mkFlame = (h = 0.9) => {
      const f = new THREE.Group();
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.26, h, 7), new THREE.MeshBasicMaterial({ color: 0xff4a10 }));
      c1.position.y = h / 2; f.add(c1);
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.17, h * 0.72, 7), new THREE.MeshBasicMaterial({ color: 0xff8a20 }));
      c2.position.y = h * 0.42; f.add(c2);
      const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.08, h * 0.44, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
      c3.position.y = h * 0.5; f.add(c3);
      return f;
    };

    // ---- THE SEA OF FIRE: molten planes flank the lane and fill the far
    // ground. The lane corridor (z ±6) stays a dark crust causeway so the
    // slap reads; everything around it glows. Crust chunks float on the sea so
    // the light shows as flowing lava between cooled slabs. ----
    for (const [x0, x1, z0, z1] of [[-22, 136, -42, -6.5], [-22, 136, 6.5, 42], [100, 136, -6.5, 6.5]]) {
      const w = x1 - x0, d = z1 - z0;
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0xff5215 }));
      sea.rotation.x = -Math.PI / 2;
      sea.position.set((x0 + x1) / 2, 0.015, (z0 + z1) / 2);
      lavaG.add(sea); seaMats.push(sea.material);
      const chunks = Math.floor(w * Math.abs(d) / 120);
      for (let i = 0; i < chunks; i++) {
        const cx = x0 + Math.random() * w, cz = z0 + Math.random() * d;
        const plate = new THREE.Mesh(new THREE.CircleGeometry(0.6 + Math.random() * 1.5, 5 + (i % 3)), i % 2 ? rock : rockDk);
        plate.rotation.x = -Math.PI / 2; plate.rotation.z = Math.random() * 3;
        plate.position.set(cx, 0.03 + Math.random() * 0.05, cz);
        lavaG.add(plate);
        if (i % 5 === 0) {
          const bub = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), emberMat());
          bub.position.set(cx, 0.06, cz);
          lavaG.add(bub); magmaPools.push({ m: bub, ph: Math.random() * 6, y0: 0.06 });
        }
      }
    }
    // glowing cracks running across the causeway itself — molten underneath
    for (const [cx, cz, cl, rot] of [[24, 0, 5, 0.5], [44, 1, 6, -0.4], [63, -1, 5, 0.7], [82, 0.6, 7, -0.3], [96, -0.8, 4, 0.5]]) {
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(cl, 0.4), crackMat());
      crack.rotation.x = -Math.PI / 2; crack.rotation.z = rot;
      crack.position.set(cx, 0.02, cz);
      lavaG.add(crack);
    }

    // ---- obsidian spire belt: a horizon wall of black glass, seams aglow ----
    lavaG.add(mkBelt((g, x, z, i) => {
      const h = 4.5 + (i % 4);
      const shard = new THREE.Mesh(new THREE.ConeGeometry(1.1, h, 5), rockDk);
      shard.position.set(x, h / 2, z); shard.rotation.y = i;
      g.add(shard);
      if (i % 5 === 0) {
        const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.16, h * 0.7), crackMat());
        seam.position.set(x + 1.05, h * 0.42, z); seam.rotation.y = Math.PI / 2;
        g.add(seam);
      }
    }));

    // ---- THE GREAT VOLCANO: a smoking, spewing giant beyond the lane ----
    const volc = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(34, 46, 9), toonMat(0x2a201e));
    cone.position.y = 23; volc.add(cone);
    for (let i = 0; i < 6; i++) {          // molten runoff streaks down the flanks
      const a = (i / 6) * Math.PI * 2;
      const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 26), crackMat());
      streak.position.set(Math.cos(a) * 12, 20, Math.sin(a) * 12);
      streak.lookAt(Math.cos(a) * 40, 0, Math.sin(a) * 40);
      volc.add(streak);
    }
    const crater = new THREE.Mesh(new THREE.CylinderGeometry(11, 13, 3, 9), new THREE.MeshBasicMaterial({ color: 0xffc030 }));
    crater.position.y = 45.5; volc.add(crater);
    volc.position.set(132, 0, 2);
    lavaG.add(volc);
    for (let i = 0; i < 5; i++) {           // ember fountain from the crater
      const jet = new THREE.Mesh(new THREE.ConeGeometry(1.4, 8, 6), emberMat());
      jet.position.set(132 + (Math.random() - 0.5) * 8, 46, 2 + (Math.random() - 0.5) * 8);
      lavaG.add(jet); emberJets.push({ m: jet, ph: Math.random() * 3, base: 46 });
    }
    for (let i = 0; i < 7; i++) {           // a rising smoke plume
      const puff = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x2e211f, transparent: true, opacity: 0.5 }));
      puff.position.set(132, 50 + i * 6, 2);
      lavaG.add(puff); lavaSmoke.push({ m: puff, ph: i * 3, base: 50 });
    }
    for (const [x, z, h, r] of [[-18, -50, 24, 16], [70, 60, 30, 20]]) {  // two lesser volcanoes
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), toonMat(0x2a201e));
      c.position.set(x, h / 2 - 1.5, z); lavaG.add(c);
      const cr = new THREE.Mesh(new THREE.CircleGeometry(r * 0.24, 7), new THREE.MeshBasicMaterial({ color: 0xffb020 }));
      cr.rotation.x = -Math.PI / 2; cr.position.set(x, h - 1.4, z); lavaG.add(cr);
    }

    // ---- lane-side flames licking up along both edges ----
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1;
      const fl = mkFlame(0.8 + Math.random() * 0.8);
      fl.position.set(-16 + i * 8.5, 0, side * (6.6 + Math.random() * 1.5));
      lavaG.add(fl); lavaFlames.push({ g: fl, ph: Math.random() * 6, base: fl.scale.y });
    }

    // ---- lane geysers on a fixed 4s rhythm (deterministic, like the weave) ----
    for (const [gx, gz, ph] of [[36, -4, 0], [58, 5, 1.3], [88, -4, 2.6]]) {
      const jet = mkFlame(3.4);
      jet.position.set(gx, 0, gz); jet.scale.y = 0.01;
      lavaG.add(jet); geysers.push({ m: jet, ph });
    }

    // ---- LAVA DEMONS: two basalt brutes ambling the flanks, cracks aglow ----
    const mkDemon = () => {
      const dg = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 4, 8), toonMat(0x241c20));
      body.position.y = 1.0; dg.add(body);
      for (const sy of [1.15, 0.85]) {
        const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.09), crackMat());
        seam.position.set(-0.42, sy, 0); seam.rotation.y = Math.PI / 2; dg.add(seam);
      }
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), toonMat(0x2a2024));
      head.position.y = 1.75; dg.add(head);
      for (const sgn of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 6), toonMat(0x14100e));
        horn.position.set(-0.1, 2.0, sgn * 0.18); horn.rotation.z = 0.4; dg.add(horn);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
        eye.position.set(-0.32, 1.78, sgn * 0.12); dg.add(eye);
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 0.24), toonMat(0x160f10));
        leg.position.set(0, 0.25, sgn * 0.2); dg.add(leg);
      }
      return dg;
    };
    for (const [x, z, span, spd, ph0] of [[20, -16, 44, 0.05, 0], [60, 17, 40, 0.042, 1]]) {
      const dm = mkDemon(); dm.position.set(x, 0, z);
      lavaG.add(dm); lavaDemons.push({ g: dm, x0: x, span, spd, ph0 });
    }
    // the fire salamander stays, on the near south crust edge
    salamander = new THREE.Group();
    const sBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.1, 4, 8), new THREE.MeshBasicMaterial({ color: 0xff6a20 }));
    sBody.rotation.z = Math.PI / 2; sBody.position.y = 0.4; salamander.add(sBody);
    const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
    sHead.position.set(0.85, 0.45, 0); salamander.add(sHead);
    const sTail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.0, 6), new THREE.MeshBasicMaterial({ color: 0xffc060 }));
    sTail.rotation.z = Math.PI / 2; sTail.position.set(-1.15, 0.4, 0); salamander.add(sTail);
    salamander.position.set(30, 0, -6.2); lavaG.add(salamander);

    // only opaque toon meshes cast shadows — the glowing lava/flames don't
    lavaG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    lavaG.visible = false;
    scene.add(lavaG);
  }
  const boulderBarricade = mkBarricade((arr, bx) => {
    for (const [by, count] of [[0.5, 4], [1.5, 3], [2.4, 2]]) {
      for (let i = 0; i < count; i++) {
        const g = new THREE.Group();
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62), toonMat(0x2a2224));
        g.add(rock);
        const ember = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.1), glowMat(0xff6a20));
        ember.rotation.z = i;
        g.add(ember);
        g.position.set(bx, by, -1.6 + i * (3.2 / Math.max(1, count - 1)));
        arr.push(g);
      }
    }
  });

  // --- 😇 HEAVEN ---
  const heavenG = new THREE.Group();
  const cherubs = [];
  const heavenSheep = [];
  {
    const marble = toonMat(0xf6f2e8), gold = toonMat(0xd8b13c);
    heavenG.add(mkBelt((g, x, z, i) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 7.5, 9), marble);
      col.position.set(x, 3.75, z);
      g.add(col);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 1.5), gold);
      cap.position.set(x, 7.7, z);
      g.add(cap);
    }, 3));
    heavenG.children[0].visible = true;
    // THE PEARLY GATES at the county line
    const gates = new THREE.Group();
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 7, 9), gold);
      post.position.set(0, 3.5, s * 2.6);
      gates.add(post);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5.6, 2.2), marble);
      door.position.set(0, 2.8, s * 1.25);
      gates.add(door);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.28, 8, 16, Math.PI), gold);
    arch.rotation.y = Math.PI / 2;
    arch.position.y = 7;
    gates.add(arch);
    gates.position.set(80, 0, 5.5);
    heavenG.add(gates);
    // the rainbow over the lane
    const rainbowCols = [0xd8404f, 0xe8912d, 0xf2c53d, 0x5fae5a, 0x3f7fbf, 0x8a5fb0];
    rainbowCols.forEach((col, i) => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(14 - i * 0.7, 0.32, 6, 24, Math.PI), toonMat(col));
      arc.position.set(45, 0, 0);
      heavenG.add(arc);
    });
    // cloud manors on the farmhouse footprints
    for (const [x, z, s] of [[96, 19, 1.15], [84, -27, 0.95], [108, -14, 1.0], [58, 31, 0.85]]) {
      const g = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.8 + Math.random() * 1.4, 8, 7), marble);
        puff.position.set((Math.random() - 0.5) * 4.5, 2 + Math.random() * 3.5, (Math.random() - 0.5) * 6);
        g.add(puff);
      }
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.1), gold);
      win.position.set(-2.6, 3, 0);
      win.rotation.y = Math.PI / 2;
      g.add(win);
      g.scale.setScalar(s);
      g.position.set(x, 0, z);
      heavenG.add(g);
    }
    // a HOST of angels circling overhead at varied heights + radii
    for (let a = 0; a < 6; a++) {
      const ph = (a / 6) * Math.PI * 2;
      const ch = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), toonMat([0xf0d0b0, 0xe8c8a0, 0xf4dcc0][a % 3]));
      ch.add(body);
      const robe = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 8), marble);
      robe.position.y = -0.4; ch.add(robe);
      for (const s of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.08), marble);
        wing.position.set(0, 0.15, s * 0.4); ch.add(wing);
      }
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 12), gold);
      halo.rotation.x = Math.PI / 2; halo.position.y = 0.5; ch.add(halo);
      heavenG.add(ch);
      cherubs.push({ g: ch, ph, rad: 14 + (a % 3) * 7, hy: 8 + (a % 3) * 4, cx: 40 + (a % 2) * 18 });
    }
    // GOD looking down: a vast robed presence high over the lane's end, radiant
    // golden aura, benevolent, watching every slap. (A silhouette of majesty —
    // no face rendered, just the glory.)
    const godG = new THREE.Group();
    const aura = new THREE.Mesh(new THREE.CircleGeometry(11, 32), glowMat(0xfff2c0));
    aura.material.transparent = true; aura.material.opacity = 0.5; godG.add(aura);
    for (let i = 0; i < 16; i++) {          // radiant sunburst rays
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 16), glowMat(0xffe89a));
      ray.material.transparent = true; ray.material.opacity = 0.35;
      ray.rotation.z = (i / 16) * Math.PI * 2; godG.add(ray);
    }
    const robe = new THREE.Mesh(new THREE.ConeGeometry(4.5, 9, 14), marble);
    robe.position.y = -3.2; godG.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.7, 16, 14), toonMat(0xf4dcc0));
    head.position.y = 2.2; godG.add(head);
    const beard = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.6, 12), marble);
    beard.position.y = 1.1; beard.rotation.x = Math.PI; godG.add(beard);
    const crown = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.18, 8, 20), gold);
    crown.rotation.x = Math.PI / 2; crown.position.y = 3.7; godG.add(crown);
    for (const s of [-1, 1]) {              // vast outstretched arms
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 4, 4, 8), marble);
      arm.position.set(s * 3.4, -0.6, 0); arm.rotation.z = s * 0.9; godG.add(arm);
    }
    godG.position.set(96, 26, -6);
    godG.rotation.y = -0.5;                  // angled to face down the lane
    heavenG.add(godG);
    heavenG.userData.godAura = [aura.material, ...godG.children.filter((c) => c.geometry && c.geometry.type === 'PlaneGeometry').map((c) => c.material)];
    // ---- little SHEEP grazing the clouds around the slapping ring ----
    const wool = toonMat(0xfbf8f2), sheepFace = toonMat(0x3a3a44);
    for (const [sx, sz, span, spd, ph0] of [[12, -9, 10, 0.06, 0], [26, 8, 12, 0.05, 1], [4, 7, 8, 0.07, 2], [34, -8, 10, 0.045, 3]]) {
      const sh = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), wool);
      body.scale.set(1.25, 0.95, 1); body.position.y = 0.6; sh.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), sheepFace);
      head.position.set(0.52, 0.66, 0); sh.add(head);
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), sheepFace);
        ear.position.set(0.48, 0.78, s * 0.16); sh.add(ear);
      }
      for (const [lx, lz] of [[-0.22, -0.16], [-0.22, 0.16], [0.28, -0.16], [0.28, 0.16]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 5), sheepFace);
        leg.position.set(lx, 0.21, lz); sh.add(leg);
      }
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 14), toonMat(0xffd23f)); // even the sheep are blessed
      halo.rotation.x = Math.PI / 2; halo.position.set(0.52, 1.0, 0); sh.add(halo);
      sh.position.set(sx, 0, sz); heavenG.add(sh);
      heavenSheep.push({ g: sh, x0: sx, span, spd, ph0 });
    }

    heavenG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    heavenG.visible = false;
    scene.add(heavenG);
  }
  const cloudBarricade = mkBarricade((arr, bx) => {
    for (const [by, count] of [[0.5, 5], [1.5, 4], [2.4, 3]]) {
      for (let i = 0; i < count; i++) {
        const g = new THREE.Group();
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.55 + (i % 2) * 0.15, 8, 7), toonMat(0xffffff));
        g.add(puff);
        g.position.set(bx, by, -2 + i * (4 / Math.max(1, count - 1)));
        arr.push(g);
      }
    }
  });

  // --- 😈 HELL ---
  const hellG = new THREE.Group();
  let cerberus = null;
  const impPokers = [];
  {
    const spireMat = toonMat(0x1f1418);
    hellG.add(mkBelt((g, x, z, i) => {
      const h = 5 + (i % 4);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.8, h, 5), spireMat);
      spire.position.set(x, h / 2, z);
      g.add(spire);
      if (i % 4 === 0) {
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), glowMat(0xff5a2a));
        tip.position.set(x, h + 0.1, z);
        g.add(tip);
      }
    }));
    hellG.children[0].visible = true;
    // THE COMPLAINTS DEPARTMENT sign over the barn + queue posts that lead nowhere
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.4),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('COMPLAINTS DEPT.', '#ff6a2a'), transparent: true }));
    sign.position.set(18, 7.6, -7.6);
    hellG.add(sign);
    for (let i = 0; i < 5; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6), toonMat(0xd8b13c));
      post.position.set(13 + i * 1.4, 0.55, -6.5 + Math.sin(i * 1.4) * 0.6);
      hellG.add(post);
    }
    // brimstone condos on the farmhouse footprints (one lit window each)
    for (const [x, z, s] of [[96, 19, 1.1], [84, -27, 0.9], [108, -14, 1.0], [58, 31, 0.85]]) {
      const g = new THREE.Group();
      const block = new THREE.Mesh(new THREE.BoxGeometry(6.2, 6.5, 9.5), toonMat(0x33161a));
      block.position.y = 3.25;
      g.add(block);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 1.4), glowMat(0xff7a30));
      win.position.set(-3.15, 3.6, 0);
      g.add(win);
      g.scale.setScalar(s);
      g.position.set(x, 0, z);
      hellG.add(g);
    }
    // lava jacuzzi: two contented imps soaking in the pond
    for (const s of [-1, 1]) {
      const impHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), toonMat(0xc0392b));
      impHead.position.set(39 + s, 0.28, 24 - s * 0.8);
      hellG.add(impHead);
      for (const hs of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 5), toonMat(0x1a1a1a));
        horn.position.set(39 + s, 0.52, 24 - s * 0.8 + hs * 0.12);
        hellG.add(horn);
      }
    }
    // ringside fire pit with two imps stoking it
    const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 8), toonMat(0x2a1512));
    pit.position.set(-4, 0.2, 6);
    hellG.add(pit);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 6), glowMat(0xff8a30));
    flame.position.set(-4, 1.1, 6);
    hellG.add(flame);
    for (const s of [-1, 1]) {
      const imp = new THREE.Group();
      const ib = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.3, 3, 7), toonMat(0xc0392b));
      ib.position.y = 0.45;
      imp.add(ib);
      const ih = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 7), toonMat(0xc0392b));
      ih.position.y = 0.78;
      imp.add(ih);
      const poker = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 5), toonMat(0x3a3a40));
      poker.rotation.x = 0.7;
      poker.position.set(0, 0.6, -0.4);
      imp.add(poker);
      imp.position.set(-4 + s * 1.5, 0, 6);
      imp.rotation.y = -s * 1.2;
      hellG.add(imp);
      impPokers.push({ g: imp, ph: s });
    }
    // stalactites — the sky is a cavern ceiling
    for (let i = 0; i < 8; i++) {
      const st = new THREE.Mesh(new THREE.ConeGeometry(1 + Math.random(), 4 + Math.random() * 3, 6), spireMat);
      st.rotation.x = Math.PI;
      st.position.set(Math.random() * 110 - 5, 19 + Math.random() * 5, (Math.random() - 0.5) * 40);
      hellG.add(st);
    }
    // CERBERUS THE PUPPY ambles the south treeline (three heads, one good boy)
    cerberus = new THREE.Group();
    const cBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 8), toonMat(0x8a2a22));
    cBody.rotation.z = Math.PI / 2;
    cBody.position.y = 0.55;
    cerberus.add(cBody);
    for (let h = -1; h <= 1; h++) {
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), toonMat(0x8a2a22));
      head.position.set(0.75, 0.8, h * 0.35);
      cerberus.add(head);
      const snout = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), toonMat(0x6e2a1e));
      snout.position.set(0.95, 0.74, h * 0.35);
      cerberus.add(snout);
    }
    const cTail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 5), toonMat(0x8a2a22));
    cTail.rotation.z = -Math.PI / 2.4;
    cTail.position.set(-0.85, 0.75, 0);
    cerberus.add(cTail);
    cerberus.position.set(30, 0, -20);
    hellG.add(cerberus);

    // ---- THE NINTH CIRCLE (Cocytus): the deepest pit is FROZEN, and the great
    // adversary is stuck waist-deep in the ice, casually enduring it. A vast
    // dark figure, three brooding faces, huge bat wings, breath fogging the air. ----
    const ice = new THREE.MeshBasicMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.92 });
    const frozenLake = new THREE.Mesh(new THREE.CircleGeometry(20, 40), ice);
    frozenLake.rotation.x = -Math.PI / 2; frozenLake.position.set(108, 0.03, 0); hellG.add(frozenLake);
    for (let i = 0; i < 14; i++) {          // cracked ice plates + damned souls frozen in
      const crack = new THREE.Mesh(new THREE.CircleGeometry(1.2 + Math.random() * 1.6, 5), toonMat(0x7fa8c4));
      crack.rotation.x = -Math.PI / 2; crack.rotation.z = Math.random() * 3;
      const a = Math.random() * Math.PI * 2, rr = 3 + Math.random() * 15;
      crack.position.set(108 + Math.cos(a) * rr, 0.05, Math.sin(a) * rr); hellG.add(crack);
      if (i % 2 === 0) {                    // a soul's head + hands frozen at the surface
        const soul = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), toonMat(0x8a6a5a));
        soul.position.set(108 + Math.cos(a) * rr, 0.22, Math.sin(a) * rr); hellG.add(soul);
      }
    }
    const satan = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(3.2, 5, 6, 12), toonMat(0x4a3a52));
    torso.position.y = 4.5; satan.add(torso);
    // three faces (Dante's Lucifer), the center one flanked by a red and a pale
    const faceCols = [0x6e2a2a, 0x241a1e, 0x5a5a4a];
    for (let f = -1; f <= 1; f++) {
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), toonMat(0x544860));
      head.position.set(f * 1.7, 8.4, f === 0 ? 0.6 : 0); head.scale.z = 0.9; satan.add(head);
      const face = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16), toonMat(faceCols[f + 1]));
      face.position.set(f * 1.7, 8.4, f === 0 ? 1.5 : 0.85);
      if (f !== 0) face.rotation.y = f * 0.5;
      satan.add(face);
      for (const s of [-1, 1]) {           // glowing eyes on every face
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), glowMat(0xff6a20));
        eye.position.set(f * 1.7 + s * 0.4, 8.7, (f === 0 ? 1.5 : 0.85) + 0.2); satan.add(eye);
      }
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.4, 6), toonMat(0x14100e));
      horn.position.set(f * 1.7, 10, f === 0 ? 0.4 : 0); horn.rotation.z = f * 0.2; satan.add(horn);
    }
    for (const s of [-1, 1]) {              // vast leathery bat wings
      const wing = new THREE.Mesh(new THREE.ConeGeometry(4.5, 9, 3), toonMat(0x3a2e46));
      wing.position.set(s * 4.5, 6, -1.5); wing.rotation.z = s * 1.5; wing.scale.z = 0.25; satan.add(wing);
    }
    // a mug of something hot — he's "casually hanging out"
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.7, 10), toonMat(0x3a3a44));
    mug.position.set(2.6, 5.6, 1.8); satan.add(mug);
    const steam = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xe8f0f4, transparent: true, opacity: 0.4 }));
    steam.position.set(2.6, 6.4, 1.8); satan.add(steam);
    satan.position.set(112, 0, 0);
    satan.rotation.y = -Math.PI / 2 - 0.3;   // facing back down the lane
    hellG.add(satan);

    hellG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    hellG.visible = false;
    scene.add(hellG);
  }
  const redtapeBarricade = mkBarricade((arr, bx) => {
    for (const [by, count] of [[0.45, 4], [1.35, 3], [2.2, 2]]) {
      for (let i = 0; i < count; i++) {
        const g = new THREE.Group();
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 1.15), toonMat(0x8a2a22));
        g.add(box);
        const label = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.2, 1.17), toonMat(0xe8e0cc));
        g.add(label);
        g.position.set(bx, by, -1.8 + i * (3.6 / Math.max(1, count - 1)));
        arr.push(g);
      }
    }
  });

  // --- 🛋️ THERAPY ROOM ---
  const therapyG = new THREE.Group();
  let countSheep = null, therapyCat = null;
  let sheepCount = 0;
  {
    const walnut = toonMat(0x7a5236), wainscot = toonMat(0x8a6440), panelDk = toonMat(0x5e3e26);
    const leather = toonMat(0x6a1f26), carpet = toonMat(0x7a1f28), brass = toonMat(0xc9a84a), cream = toonMat(0xe8dfce);
    const shelfW = toonMat(0x6a4630);
    const bookCols = [0x8a3030, 0x2f5a7a, 0x3a6a48, 0x7a5a2a, 0x5a3a6a, 0x8a6a3a];
    // ---- FLOOR: polished wood + a big red rug down the middle, cream border ----
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(118, 15), carpet);
    rug.rotation.x = -Math.PI / 2; rug.position.set(48, 0.02, 0); therapyG.add(rug);
    for (const zEdge of [-7.4, 7.4]) {            // cream rug trim
      const trim = new THREE.Mesh(new THREE.PlaneGeometry(118, 0.5), cream);
      trim.rotation.x = -Math.PI / 2; trim.position.set(48, 0.03, zEdge); therapyG.add(trim);
    }
    // ---- WALLS: tall walnut panelling flanking the lane + a back wall ----
    const mkWall = (zc, len, xc) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(len, 15, 0.6), walnut);
      wall.position.set(xc, 7.5, zc); therapyG.add(wall);
      const band = new THREE.Mesh(new THREE.BoxGeometry(len, 1.6, 0.75), wainscot);
      band.position.set(xc, 1.3, zc); therapyG.add(band);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.2, 0.85), brass);
      rail.position.set(xc, 2.2, zc); therapyG.add(rail);
      // recessed panels along the wall
      for (let px = -len / 2 + 4; px < len / 2 - 2; px += 6) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(3.6, 6, 0.72), panelDk);
        p.position.set(xc + px, 6.5, zc); therapyG.add(p);
      }
    };
    mkWall(-11, 124, 46); mkWall(11, 124, 46);
    // back wall across the far end
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 15, 22.6), walnut);
    backWall.position.set(107, 7.5, 0); therapyG.add(backWall);
    // ---- CEILING: coffered beams high overhead + a warm chandelier ----
    for (let bx = -10; bx < 106; bx += 12) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 22), shelfW);
      beam.position.set(bx, 14.6, 0); therapyG.add(beam);
    }
    const chand = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.14, 8, 20), brass);
    ring.rotation.x = Math.PI / 2; chand.add(ring);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const candle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), glowMat(0xffdf9a));
      candle.position.set(Math.cos(a) * 1.6, 0.1, Math.sin(a) * 1.6); chand.add(candle);
    }
    const chandGlow = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 12), glowMat(0xffe6b0));
    chandGlow.material.transparent = true; chandGlow.material.opacity = 0.18; chand.add(chandGlow);
    chand.position.set(30, 12.5, 0); therapyG.add(chand);
    // ---- BOOKSHELVES lining both walls (the study) ----
    for (const zc of [-10.2, 10.2]) {
      for (let sx = 4; sx < 100; sx += 10) {
        const unit = new THREE.Group();
        const carcass = new THREE.Mesh(new THREE.BoxGeometry(4, 7, 0.9), shelfW);
        carcass.position.y = 3.5; unit.add(carcass);
        for (let shelf = 1; shelf <= 5; shelf++) {
          for (let b = 0; b < 9; b++) {
            const book = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9 + (b % 3) * 0.15, 0.5), toonMat(bookCols[(b + shelf) % 6]));
            book.position.set(-1.7 + b * 0.4, shelf * 1.3 - 0.3, 0.28); unit.add(book);
          }
        }
        unit.position.set(sx, 0, zc); unit.rotation.y = zc < 0 ? 0 : Math.PI;
        therapyG.add(unit);
      }
    }
    // ---- THE COUCH: a plush tufted Chesterfield, oxblood leather ----
    const couch = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.3, 10), leather);
    base.position.y = 1.1; couch.add(base);
    // seat cushions
    for (const cz of [-3.2, 0, 3.2]) {
      const cush = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 3), toonMat(0x7a262e));
      cush.position.set(0, 1.9, cz); couch.add(cush);
    }
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.4, 10), leather);
    back.position.set(1.7, 2.6, 0); couch.add(back);
    // tufted buttons on the back
    for (let by = 0; by < 3; by++) for (let bz = -3.5; bz <= 3.5; bz += 2.3) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), toonMat(0x4a1218));
      btn.position.set(1.0, 2.2 + by * 0.9, bz + (by % 2) * 1.15); couch.add(btn);
    }
    // rolled arms
    for (const az of [-5, 5]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 4.6, 12), leather);
      arm.rotation.x = Math.PI / 2; arm.position.set(0, 2.2, az); couch.add(arm);
    }
    for (const [fx, fz] of [[-1.6, -4.4], [1.6, -4.4], [-1.6, 4.4], [1.6, 4.4]]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.5, 8), toonMat(0x2a1a10));
      foot.position.set(fx, 0.25, fz); couch.add(foot);
    }
    couch.position.set(14, 0, -4.5); couch.rotation.y = 0.25;
    therapyG.add(couch);
    // ---- THE GIANT CAT, watching the whole session from the far end ----
    therapyCat = new THREE.Group();
    const catFur = toonMat(0x3a3a42);
    const catBody = new THREE.Mesh(new THREE.CapsuleGeometry(2.2, 2.6, 6, 12), catFur);
    catBody.rotation.z = Math.PI / 2; catBody.position.set(0, 2.2, 0); catBody.scale.z = 1.4; therapyCat.add(catBody);
    const catHead = new THREE.Mesh(new THREE.SphereGeometry(1.9, 14, 12), catFur);
    catHead.position.set(-2.6, 4.4, 0); therapyCat.add(catHead);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.3, 4), catFur);
      ear.position.set(-2.6, 6, s * 1.1); therapyCat.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), glowMat(0x8adf5a));
      eye.position.set(-4.2, 4.6, s * 0.8); eye.scale.x = 0.5; therapyCat.add(eye);
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.1), toonMat(0x141014));
      pupil.position.set(-4.42, 4.6, s * 0.8); therapyCat.add(pupil);
    }
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 4, 4, 8), catFur);
    tail.position.set(2.8, 1.4, 2.6); tail.rotation.z = 0.7; therapyCat.add(tail);
    therapyCat.position.set(98, 0, 4); therapyCat.rotation.y = -0.6;
    therapyG.add(therapyCat);
    // ---- THE RED BOOK on a brass lectern (glowing), ringside ----
    const lectern = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.5, 8), brass);
    stem.position.y = 0.75; lectern.add(stem);
    const slope = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.9), brass);
    slope.position.y = 1.55; slope.rotation.x = 0.5; lectern.add(slope);
    const redBook = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 0.8), toonMat(0x9a1818));
    redBook.position.y = 1.65; redBook.rotation.x = 0.5; lectern.add(redBook);
    const bookGlow = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), glowMat(0xff3a3a));
    bookGlow.material.transparent = true; bookGlow.material.opacity = 0.16; bookGlow.position.y = 1.7; lectern.add(bookGlow);
    lectern.position.set(6, 0, 6.5); therapyG.add(lectern);
    // ---- FIREPLACE on the back wall, glowing ----
    const fp = new THREE.Group();
    const surround = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 6), toonMat(0x2a2028));
    surround.position.y = 2.5; fp.add(surround);
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 3.4), toonMat(0x14100e));
    hearth.position.set(-0.2, 1.8, 0); fp.add(hearth);
    for (let i = 0; i < 4; i++) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 6), glowMat([0xff5a1a, 0xff9a30, 0xffd23f][i % 3]));
      flame.position.set(-0.5, 1 + (i % 2) * 0.3, -1 + i * 0.66); fp.add(flame);
    }
    const mantel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 7), wainscot);
    mantel.position.set(0, 5.2, 0); fp.add(mantel);
    fp.position.set(106.3, 0, -6); therapyG.add(fp);
    // ---- framed Rorschach inkblots hung along the walls ----
    for (const [fx, fz, fzr] of [[24, -10.5, 0], [54, -10.5, 0], [40, 10.5, Math.PI], [76, 10.5, Math.PI]]) {
      const fr = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3, 0.2), toonMat(0x2a1a12));
      fr.position.set(fx, 6, fz); fr.rotation.y = fzr; therapyG.add(fr);
      const blot = new THREE.Mesh(new THREE.CircleGeometry(0.9, 12), toonMat(0x14100e));
      blot.scale.x = 1.4; blot.position.set(fx, 6, fz + (fzr ? -0.12 : 0.12)); blot.rotation.y = fzr; therapyG.add(blot);
    }
    // ---- a warm floor lamp + a grandfather clock ----
    const lamp = new THREE.Group();
    const lstem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 3.4, 8), brass);
    lstem.position.y = 1.7; lamp.add(lstem);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1, 12, 1, true), toonMat(0xe8c98a));
    shade.position.y = 3.5; lamp.add(shade);
    const lglow = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 10), glowMat(0xffe6a0));
    lglow.material.transparent = true; lglow.material.opacity = 0.35; lglow.position.y = 3.4; lamp.add(lglow);
    lamp.position.set(20, 0, 8.5); therapyG.add(lamp);
    const clock = new THREE.Group();
    const cbody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.5, 0.9), walnut);
    cbody.position.y = 2.75; clock.add(cbody);
    const cface = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), cream);
    cface.position.set(0, 4.4, 0.46); clock.add(cface);
    clock.position.set(104, 0, 8); clock.rotation.y = -0.5; therapyG.add(clock);
    // the counting sheep still hops the rug (a therapist's sleepless client)
    countSheep = new THREE.Group();
    const sBody2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 9, 8), toonMat(0xf2ede1));
    sBody2.scale.set(1.25, 0.9, 1); sBody2.position.y = 0.55; countSheep.add(sBody2);
    const sHead2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), toonMat(0x2a2a33));
    sHead2.position.set(0.5, 0.7, 0); countSheep.add(sHead2);
    for (const [lx, lz] of [[-0.2, -0.15], [-0.2, 0.15], [0.25, -0.15], [0.25, 0.15]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 5), toonMat(0x2a2a33));
      leg.position.set(lx, 0.2, lz); countSheep.add(leg);
    }
    countSheep.position.set(10, 0, 2.9); therapyG.add(countSheep);
    therapyG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    therapyG.visible = false;
    scene.add(therapyG);
  }
  const booksBarricade = mkBarricade((arr, bx) => {
    const cols = [0x8a4a3a, 0x4a6b8c, 0x5c7a5c, 0x8a7a9c, 0xb5885a];
    for (const [by, count] of [[0.35, 4], [1.05, 3], [1.75, 2]]) {
      for (let i = 0; i < count; i++) {
        const g = new THREE.Group();
        const book = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.68, 1.5), toonMat(cols[(i + count) % cols.length]));
        g.add(book);
        const pages = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.56, 0.12), toonMat(0xf2ede1));
        pages.position.z = 0.72;
        g.add(pages);
        g.position.set(bx, by, -1.7 + i * (3.4 / Math.max(1, count - 1)));
        g.rotation.y = (i % 2) * 0.2 - 0.1;
        arr.push(g);
      }
    }
  });

  // --- 👻 HAUNTED FAIR: the night fair gone to seed. Graveyard rows, a green
  // moon, and the fair-goers' spectral echoes drifting between the stones. ---
  const hauntedG = new THREE.Group();
  const ghosts = [];
  {
    const deadWood = toonMat(0x3a3630);
    hauntedG.add(mkBelt((g, x, z, i) => {
      const h = 5 + (i % 3);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, h, 6), deadWood);
      trunk.position.set(x, h / 2, z);
      g.add(trunk);
      for (const sgn of [-1, 1]) {
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.2, 5), deadWood);
        branch.rotation.z = sgn * 0.9;
        branch.position.set(x + sgn * 0.7, h * 0.78, z);
        g.add(branch);
      }
    }));
    hauntedG.children[0].visible = true;
    // THE MOON — pale green-white, craters and all
    const moon = new THREE.Mesh(new THREE.CircleGeometry(7, 24), new THREE.MeshBasicMaterial({ color: 0xdcecc8, fog: false }));
    moon.position.set(150, 42, -35);
    moon.lookAt(0, 2, 0);
    hauntedG.add(moon);
    for (const [cx, cy, cr] of [[151, 44, 1.2], [148, 40, 0.8]]) {
      const crater = new THREE.Mesh(new THREE.CircleGeometry(cr, 12), new THREE.MeshBasicMaterial({ color: 0xbcd0a8, fog: false }));
      crater.position.set(cx, cy, -34.8);
      crater.lookAt(0, 2, 0);
      hauntedG.add(crater);
    }
    // graveyard gate over the lane
    const iron = toonMat(0x22262c);
    for (const sgn of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.8, 6), iron);
      post.position.set(12, 2.9, sgn * 3.4);
      hauntedG.add(post);
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 5), iron);
      finial.position.set(12, 6, sgn * 3.4);
      hauntedG.add(finial);
    }
    const gateArch = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.1, 6, 14, Math.PI), iron);
    gateArch.rotation.y = Math.PI / 2;
    gateArch.position.set(12, 5.6, 0);
    hauntedG.add(gateArch);
    const gateSign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('THE FOREVER FAIR', '#9ab5a0'), transparent: true, side: THREE.DoubleSide }));
    gateSign.rotation.y = -Math.PI / 2;
    gateSign.position.set(12, 4.9, 0);
    hauntedG.add(gateSign);
    // tombstone rows — off the flight lane
    const stone = toonMat(0x8a9298), stoneLt = toonMat(0x9aa2ad);
    for (let i = 0; i < 24; i++) {
      const gx = 22 + (i % 8) * 7 + ((i * 3) % 4);
      const gz = (i < 12 ? 1 : -1) * (6 + Math.floor((i % 12) / 8) * 5 + ((i * 5) % 4));
      if (i % 6 === 5) {
        const v = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.16), stoneLt);
        v.position.set(gx, 0.5, gz);
        hauntedG.add(v);
        const hbar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.55), stoneLt);
        hbar.position.set(gx, 0.72, gz);
        hauntedG.add(hbar);
      } else {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 0.7), stone);
        slab.position.set(gx, 0.45, gz);
        slab.rotation.x = (((i * 7) % 5) - 2) * 0.05;
        hauntedG.add(slab);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.14, 10), stone);
        cap.rotation.z = Math.PI / 2;
        cap.position.set(gx, 0.9, gz);
        hauntedG.add(cap);
      }
    }
    // mausoleum + crypts on the farmhouse footprints
    const mstone = toonMat(0x7a8288);
    const mg = new THREE.Group();
    const mbody = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 7), mstone);
    mbody.position.y = 2.25;
    mg.add(mbody);
    const mped = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.2, 7.6), mstone);
    mped.position.y = 4.9;
    mg.add(mped);
    for (const sgn of [-1, 1]) {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 4, 8), mstone);
      pil.position.set(-3.2, 2, sgn * 2.2);
      mg.add(pil);
    }
    const mdoor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 1.6), toonMat(0x0c0e10));
    mdoor.position.set(-3.05, 1.3, 0);
    mg.add(mdoor);
    mg.position.set(96, 0, 19);
    mg.rotation.y = -0.55;
    hauntedG.add(mg);
    for (const [cx2, cz2, cry] of [[84, -27, 0.5], [108, -14, -0.2], [58, 31, 0.9]]) {
      const crypt = new THREE.Group();
      const cbody = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 3.5), mstone);
      cbody.position.y = 1.1;
      crypt.add(cbody);
      const cv = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.12), stoneLt);
      cv.position.y = 2.55;
      crypt.add(cv);
      const ch2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.4), stoneLt);
      ch2.position.y = 2.7;
      crypt.add(ch2);
      crypt.position.set(cx2, 0, cz2);
      crypt.rotation.y = cry;
      hauntedG.add(crypt);
    }
    // glowing jack-o'-lanterns light the paths
    const glowFace = glowMat(0xffb347);
    for (const [px2, pz2] of [[18, 4], [26, -5], [34, 6], [46, -6], [62, 5], [80, -5], [93.5, 17]]) {
      const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 7), toonMat(0xd8722d));
      p2.scale.y = 0.8;
      p2.position.set(px2, 0.28, pz2);
      hauntedG.add(p2);
      const grin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.2), glowFace);
      grin.position.set(px2 - 0.34, 0.26, pz2);
      hauntedG.add(grin);
      for (const sgn of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 3), glowFace);
        eye.rotation.z = Math.PI / 2;
        eye.position.set(px2 - 0.33, 0.42, pz2 + sgn * 0.1);
        hauntedG.add(eye);
      }
    }
    // the pond gone black + one polite skeletal hand
    const bone2 = toonMat(0xe8e4da);
    const palm2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.12), bone2);
    palm2.position.set(38.5, 0.12, 23.2);
    palm2.rotation.z = -0.3;
    hauntedG.add(palm2);
    for (const fz of [-0.05, 0, 0.05]) {
      const fing = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 4), bone2);
      fing.position.set(38.5, 0.28, 23.2 + fz);
      hauntedG.add(fing);
    }
    // THE GHOSTS: four fair-goers' spectral echoes, outfits and all
    const mkGhost = (cx3, cz3, r3, sp3, ph3, outfit) => {
      const ecto = new THREE.MeshBasicMaterial({ color: 0xe8f0f4, transparent: true, opacity: 0.45, depthWrite: false });
      const g3 = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 4, 10), ecto);
      body.position.y = 0.9;
      g3.add(body);
      const head3 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), ecto);
      head3.position.y = 1.42;
      g3.add(head3);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), ecto);
      tail.rotation.x = Math.PI;
      tail.position.y = 0.42;
      g3.add(tail);
      if (outfit === 'sunhat' || outfit === 'cowboy') {
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(outfit === 'cowboy' ? 0.24 : 0.3, outfit === 'cowboy' ? 0.24 : 0.3, 0.03, 12), ecto);
        brim.position.y = 1.56;
        g3.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.14, 10), ecto);
        crown.position.y = 1.64;
        g3.add(crown);
      } else if (outfit === 'skirt') {
        const sk = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.45, 10), ecto);
        sk.position.y = 0.72;
        g3.add(sk);
      } else if (outfit === 'balloon') {
        const line = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9, 4), ecto);
        line.position.set(0.25, 1.6, 0);
        g3.add(line);
        const bal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), ecto);
        bal.position.set(0.25, 2.1, 0);
        g3.add(bal);
      }
      hauntedG.add(g3);
      ghosts.push({ g: g3, ecto, cx: cx3, cz: cz3, r: r3, sp: sp3, ph: ph3, spookT: 0 });
    };
    mkGhost(30, 6, 4, 0.18, 0, 'sunhat');
    mkGhost(52, -8, 5, 0.22, 2.1, 'cowboy');
    mkGhost(70, 7, 3.5, 0.15, 4.2, 'skirt');
    mkGhost(24, -10, 4.5, 0.2, 1.0, 'balloon');
    hauntedG.traverse((m) => { if (m.material && !m.material.transparent) m.castShadow = true; });
    hauntedG.visible = false;
    scene.add(hauntedG);
  }
  const coffinsBarricade = mkBarricade((arr, bx) => {
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.75, 0.6), toonMat(0x5a4030));
      g.add(lid);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.4), toonMat(0x5a4030));
      foot.position.y = -1.1;
      g.add(foot);
      const cv = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.09), toonMat(0xc9ced6));
      cv.position.y = 0.3;
      g.add(cv);
      const chb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.3), toonMat(0xc9ced6));
      chb.position.y = 0.42;
      g.add(chb);
      g.position.set(bx, 1.1, -1.9 + i * 0.95);
      g.rotation.x = (i % 2 ? 1 : -1) * 0.06;
      arr.push(g);
    }
  });

  // --- 💻 SLOP VALLEY: the tech campus. Glass, lawns, lanyards, a data lake. ---
  const techG = new THREE.Group();
  let drone = null, droneRotors = [], roomba = null;
  const mastTips = [];
  const lakePackets = [];
  {
    const hedge = toonMat(0x4a7a3a), steel = toonMat(0x9aa2ad), glass = toonMat(0x7ab0d8);
    // THE SKYLINE: a wall of concrete + glass towers rings the campus. Each is
    // a tall slab with a window grid; some concrete-grey, some blue-glass, with
    // rooftop plant, setbacks, and the odd red aircraft-warning beacon.
    const concrete = [0xb8bcc2, 0xc8ccd2, 0xa8adb5], glassCol = [0x7ab0d8, 0x8fc0e0, 0x6a9cc8];
    techG.add(mkBelt((g, x, z, i) => {
      const isGlass = i % 2 === 0;
      const h = 14 + (i * 7 % 5) * 5;          // 14–34m, varied
      const w = 3.2 + (i % 3) * 0.6;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, w),
        toonMat(isGlass ? glassCol[i % 3] : concrete[i % 3]));
      tower.position.set(x, h / 2, z); g.add(tower);
      // window grid on the lane-facing side (glow so the skyline reads at distance)
      const rows = Math.floor(h / 2.2), cols = 3;
      for (let ry = 1; ry < rows; ry++) for (let cx = 0; cx < cols; cx++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.06),
          glowMat(isGlass ? 0xbfe4f6 : 0xdfe6ec));
        win.material.transparent = true; win.material.opacity = isGlass ? 0.85 : 0.6;
        win.position.set(x - w / 2 * (Math.sign(x) || -1) - 0.04 * (Math.sign(x) || -1), ry * 2.2, z + (cx - 1) * (w / 3));
        g.add(win);
      }
      // a setback crown + rooftop unit
      const crown = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 1.4, w * 0.7), toonMat(0x9aa2ad));
      crown.position.set(x, h + 0.7, z); g.add(crown);
      if (i % 3 === 0) {                         // aircraft beacon
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), glowMat(0xff3030));
        beacon.position.set(x, h + 1.6, z); g.add(beacon);
        mastTips.push(beacon);
      } else {                                   // rooftop AC / dish
        const roof = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), steel);
        roof.position.set(x, h + 1.6, z); g.add(roof);
      }
    }));
    techG.children[0].visible = true;
    // glass HQ blocks on the footprints
    const mullion = toonMat(0x3a4a5a);
    const hq = (x, z, wdt, hgt, dep, ry) => {
      const g = new THREE.Group();
      const slab = new THREE.Mesh(new THREE.BoxGeometry(wdt, hgt, dep), glass);
      slab.position.y = hgt / 2;
      g.add(slab);
      for (let m2 = -1; m2 <= 1; m2++) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.15, hgt, 0.3), mullion);
        strip.position.set(-wdt / 2 - 0.02, hgt / 2, m2 * dep / 4);
        g.add(strip);
      }
      g.position.set(x, 0, z);
      g.rotation.y = ry;
      techG.add(g);
      return g;
    };
    const flag2 = hq(96, 19, 7, 12, 9, -0.55);
    const logo = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.22, 8, 18), toonMat(0xf2f2f0));
    logo.position.y = 13.2;
    flag2.add(logo);
    // SLOPCORP, in big letters ON the tower: a dark backing band + bold text,
    // running the full width of the lane-facing face so the name reads
    const signBack = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.6, 6.6), toonMat(0x1a2230));
    signBack.position.set(-3.55, 9.5, 0); flag2.add(signBack);
    const fsign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.4),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('SLOPCORP', '#40ff80'), transparent: true }));
    fsign.position.set(-3.63, 9.5, 0);
    fsign.rotation.y = -Math.PI / 2;
    flag2.add(fsign);
    hq(84, -27, 5, 8, 7, 0.5);
    hq(108, -14, 5.5, 10, 6, -0.2);
    hq(58, 31, 6, 4, 8, 0.9);
    // the slogan gate over the lane
    for (const sgn of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 5.5, 7), steel);
      post.position.set(12, 2.75, sgn * 3.4);
      techG.add(post);
    }
    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 8.2), toonMat(0x2a3a5a));
    banner.position.set(12, 5, 0);
    techG.add(banner);
    const slogan = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.4),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('MOVING FAST · BREAKING CHEEKS', '#ffffff'), transparent: true, side: THREE.DoubleSide }));
    slogan.rotation.y = -Math.PI / 2;
    slogan.position.set(11.9, 5, 0);
    techG.add(slogan);
    // THE DATA LAKE: infinity edge + bobbing packets + the sign
    const rim2 = new THREE.Mesh(new THREE.RingGeometry(6, 6.5, 24), toonMat(0xe8ecf0));
    rim2.rotation.x = -Math.PI / 2;
    rim2.position.set(40, 0.045, 24);
    techG.add(rim2);
    const lakeSign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.7),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('DATA LAKE', '#40ff80'), transparent: true, side: THREE.DoubleSide }));
    lakeSign.position.set(43, 1.2, 19.5);
    techG.add(lakeSign);
    const lsPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.2, 5), steel);
    lsPost.position.set(43, 0.6, 19.5);
    techG.add(lsPost);
    for (let i = 0; i < 4; i++) {
      const packet = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), glowMat(0x40ff80));
      const a = (i / 4) * Math.PI * 2;
      packet.position.set(40 + Math.cos(a) * 3, 0.12, 24 + Math.sin(a) * 3);
      techG.add(packet);
      lakePackets.push(packet);
    }
    // e-scooters: mint, abandoned, one per OSHA violation
    const mint = toonMat(0x2ad0a0);
    for (const [sx2, sz2, fallen] of [[16, 5, 0], [24, -4, 1], [33, 6, 0], [47, -5, 1], [57, 4, 0]]) {
      const sg = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.14), mint);
      sg.add(deck);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), mint);
      stem.position.set(0.32, 0.45, 0);
      sg.add(stem);
      const tbar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 5), mint);
      tbar.rotation.x = Math.PI / 2;
      tbar.position.set(0.32, 0.9, 0);
      sg.add(tbar);
      if (fallen) { sg.rotation.z = Math.PI / 2; sg.position.set(sx2, 0.12, sz2); }
      else sg.position.set(sx2, 0.08, sz2);
      techG.add(sg);
    }
    // the delivery drone (built here, flown in updateAmbient)
    drone = new THREE.Group();
    const dbody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.35), toonMat(0x2a2a33));
    drone.add(dbody);
    for (const [dx2, dz2] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 8), toonMat(0x9aa2ad));
      rotor.position.set(dx2, 0.1, dz2);
      drone.add(rotor);
      droneRotors.push(rotor);
    }
    const parcel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.2), toonMat(0xc9a468));
    parcel.position.y = -0.3;
    drone.add(parcel);
    techG.add(drone);
    // the robot vacuum, diligently cleaning a fairground
    roomba = new THREE.Group();
    const rbody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 14), toonMat(0x2a2a33));
    rbody.position.y = 0.06;
    roomba.add(rbody);
    const rdot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), glowMat(0x40ff80));
    rdot.position.y = 0.15;
    roomba.add(rdot);
    roomba.position.set(4, 0, 3.5);
    techG.add(roomba);

    // ---- MANICURED landscaping: tidy columnar cypress + spherical topiary,
    // the well-cured greenery of an Apple-Park-grade campus ----
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1, tx = 8 + i * 5;
      const tz = side * (6.5 + (i % 2) * 1.4);
      const t = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 8), toonMat(0x8a6a48));
      trunk.position.y = 0.4; t.add(trunk);
      if (i % 3 === 0) {                       // columnar cypress
        const col = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.4, 9), toonMat(0x3a6a44));
        col.position.y = 2.3; t.add(col);
      } else {                                 // clipped spherical topiary (2-tier)
        const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), toonMat(0x4a8a4e));
        b1.position.y = 1.4; b1.scale.y = 0.85; t.add(b1);
        const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), toonMat(0x4a8a4e));
        b2.position.y = 2.3; t.add(b2);
      }
      const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.4, 10), toonMat(0xe8ecf0));
      planter.position.y = 0.2; t.add(planter);
      t.position.set(tx, 0, tz); techG.add(t);
    }

    // ---- SLEEK ELECTRIC CARS lined up on the campus drive, plus a charger row ----
    const evCols = [0xf4f4f6, 0x1a1a1f, 0xd83a3a, 0x9aa2ad];
    for (let i = 0; i < 7; i++) {
      const side = i % 2 ? -1 : 1, cx = 14 + i * 11;
      const car = new THREE.Group();
      // a low aerodynamic body: two stacked tapered boxes, no grille
      const lower = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 1.4), toonMat(evCols[i % 4]));
      lower.position.y = 0.5; car.add(lower);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 1.3), toonMat(0x1a2028));
      cabin.position.set(-0.1, 0.98, 0); car.add(cabin);   // the glasshouse greenhouse
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 1.3), toonMat(evCols[i % 4]));
      nose.position.set(1.6, 0.42, 0); car.add(nose);
      for (const [wx, wz] of [[1.0, 0.72], [1.0, -0.72], [-1.0, 0.72], [-1.0, -0.72]]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 14), toonMat(0x14141c));
        wheel.rotation.x = Math.PI / 2; wheel.position.set(wx, 0.34, wz); car.add(wheel);
      }
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 1.2), glowMat(0xffffff));
      light.position.set(1.86, 0.5, 0); car.add(light);
      car.position.set(cx, 0, side * 9.4); car.rotation.y = side > 0 ? Math.PI : 0;
      techG.add(car);
      // a slim charging stall behind every other car
      if (i % 2 === 0) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.25), toonMat(0xe8ecf0));
        post.position.set(cx - 0.2, 0.75, side * 11); techG.add(post);
        const scr = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.05), glowMat(0x40ff80));
        scr.position.set(cx - 0.2, 1.2, side * 11 - 0.14); techG.add(scr);
      }
    }

    techG.traverse((m) => { m.castShadow = true; });
    techG.visible = false;
    scene.add(techG);
  }
  const boxesBarricade = mkBarricade((arr, bx) => {
    for (const [by, count] of [[0.4, 4], [1.15, 3], [1.9, 2]]) {
      for (let i = 0; i < count; i++) {
        const g = new THREE.Group();
        const carton = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 1.05), toonMat(0xc9a468));
        g.add(carton);
        const tape = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.14, 1.07), toonMat(0x5a8ac0));
        g.add(tape);
        const label = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.4), toonMat(0xf2f2f0));
        label.position.set(-0.46, 0, 0.2);
        g.add(label);
        g.position.set(bx, by, -1.8 + i * (3.6 / Math.max(1, count - 1)));
        arr.push(g);
      }
    }
  });

  // falling snow — drifts down in updateAmbient while the lake is frozen
  const SNOW_N = 850;
  const snowArr = new Float32Array(SNOW_N * 3);
  for (let i = 0; i < SNOW_N; i++) {
    snowArr[i * 3] = -25 + Math.random() * 145;
    snowArr[i * 3 + 1] = Math.random() * 26;
    snowArr[i * 3 + 2] = -40 + Math.random() * 80;
  }
  const snowGeo2 = new THREE.BufferGeometry();
  snowGeo2.setAttribute('position', new THREE.BufferAttribute(snowArr, 3));
  const snowPts = new THREE.Points(snowGeo2, new THREE.PointsMaterial({ color: 0xffffff, size: 0.28, transparent: true, opacity: 0.85 }));
  snowPts.visible = false;
  scene.add(snowPts);

  // the ringside cowgirl bundles up: white fur coat, collar, hem and ear muffs
  const furG = new THREE.Group();
  {
    const fur = toonMat(0xf4f4f0);
    const coat = new THREE.Mesh(new THREE.CapsuleGeometry(0.215, 0.42, 4, 10), fur); coat.position.y = 1.05; furG.add(coat);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.05, 8, 14), fur); collar.rotation.x = Math.PI / 2; collar.position.y = 1.38; furG.add(collar);
    const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.1, 12), fur); hem.position.y = 0.82; furG.add(hem);
    for (const s of [-1, 1]) {
      const muff = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), fur);
      muff.position.set(0, 1.56, s * 0.145); furG.add(muff);
    }
    furG.traverse((m) => { m.castShadow = true; });
  }
  furG.visible = false;
  ringGirl.g.add(furG);
  // fur sleeves ride the arm groups so they track her waving
  const furCuffs = [];
  for (const armG of [ringGirl.armL, ringGirl.armR]) {
    if (!armG) continue;
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.34, 3, 8), toonMat(0xf4f4f0));
    sleeve.position.y = 0.19;
    sleeve.castShadow = true;
    sleeve.visible = false;
    armG.add(sleeve);
    furCuffs.push(sleeve);
  }

  // the crowd dresses for the world: named wardrobe palettes swap the instance
  // colors (original fair outfits saved lazily, restored on key null)
  // --- 🎰 SLAP VEGAS: a neon casino floor at midnight ---
  const vegasG = new THREE.Group();
  const vegasSpots = [], vegasNeon = [], vegasFountain = [];
  {
    const chrome = toonMat(0x2a2a33);
    vegasG.add(mkBelt((g, x, z, i) => {
      const kind = i % 7;
      const hue = [0xff2f8e, 0x2fd4ff, 0xffd23f, 0x8a2fff, 0x2fff9a][i % 5];
      if (kind === 3) {                         // the pyramid, sky-beam and all
        const pyr = new THREE.Mesh(new THREE.ConeGeometry(4.5, 8, 4), toonMat(0x1a1a22));
        pyr.rotation.y = Math.PI / 4; pyr.position.set(x, 4, z); g.add(pyr);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.5, 34, 7), glowMat(0xfff2c0));
        beam.material.transparent = true; beam.material.opacity = 0.5;
        beam.position.set(x, 20, z); g.add(beam);
        vegasNeon.push({ m: beam.material, base: 0.5, sp: 1.7, ph: i });
        return;
      }
      const h = 8 + (i % 5) * 2.4;
      // LIT warm hotel facades (cream / gold / champagne) — not black boxes
      const facade = [0xd9c4a0, 0xc9a86a, 0xe0d0b0, 0xb89a7a, 0xd8b878][i % 5];
      const tower = new THREE.Mesh(new THREE.BoxGeometry(3.4, h, 3.4), toonMat(facade));
      tower.position.set(x, h / 2, z); g.add(tower);
      // rows of warm-lit windows down the face (glow, cheap, sells "occupied hotel")
      for (let wy = 1; wy < Math.floor(h / 1.4); wy++) {
        for (const wx of [-1, 0, 1]) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.06), glowMat((wx + wy) % 4 ? 0xffe6a0 : 0x2fd4ff));
          win.position.set(x + wx * 1.0, wy * 1.4, z + 1.72); g.add(win);
        }
      }
      for (const sx of [-1.7, 1.7]) for (const sz of [-1.7, 1.7]) {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.16), glowMat(hue));
        edge.position.set(x + sx, h / 2, z + sz); g.add(edge);
      }
      const crown = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.5, 3.7), glowMat(hue));
      crown.position.set(x, h - 0.3, z); g.add(crown);
      vegasNeon.push({ m: crown.material, base: 1, sp: 2 + (i % 3), ph: i });
      if (kind === 5) {                         // a giant slot-machine facade
        const slot = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 0.6), toonMat(0x8a1030));
        slot.position.set(x, 2.5 + h / 2, z + 1.8); g.add(slot);
        for (let r = 0; r < 3; r++) {
          const reel = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), glowMat(0xffe08a));
          reel.position.set(x - 1.1 + r * 1.1, 2.6 + h / 2, z + 2.15); g.add(reel);
        }
      }
    }));
    vegasG.children[0].visible = true;
    // the marquee arch over the lane
    const arch = new THREE.Group();
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 8.2, 10), chrome);
      post.position.set(0, 4.1, s * 3.6); arch.add(post);
    }
    const span = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 8.4), toonMat(0x14141c));
    span.position.y = 8; arch.add(span);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.3),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('SLAP VEGAS', '#ffd23f'), transparent: true }));
    board.position.set(0.7, 8, 0); board.rotation.y = -Math.PI / 2; arch.add(board);
    for (let i = 0; i < 26; i++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), glowMat(0xfff2c0));
      const t = i / 26 * Math.PI * 2;
      bulb.position.set(0.62, 8 + Math.sin(t) * 0.9, Math.cos(t) * 4.1); arch.add(bulb);
      vegasNeon.push({ m: bulb.material, base: 1, sp: 5, ph: i * 0.5 });
    }
    arch.position.x = 10; vegasG.add(arch);
    // ground motif: chip stacks + giant dice along the shoulders
    const chipCols = [0xd83a3a, 0x2f7ad8, 0x2fae5a, 0x14141c];
    for (let i = 0; i < 22; i++) {
      const side = i % 2 ? 1 : -1, gx = 6 + i * 4.6;
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 18), toonMat(chipCols[i % 4]));
      stack.position.set(gx, 0.17, side * (5 + (i % 3))); vegasG.add(stack);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 18), glowMat(0xf4f0e2));
      rim.rotation.x = Math.PI / 2; rim.position.copy(stack.position); vegasG.add(rim);
    }
    for (const [dx, dz] of [[18, -6.5], [34, 6.2], [70, -6]]) {
      const die = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), toonMat(0xf4f0e2));
      die.position.set(dx, 0.65, dz); die.rotation.y = dx; vegasG.add(die);
      for (const [px, py] of [[0.4, 0.4], [-0.4, -0.4], [0, 0]]) {
        const pip = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), toonMat(0x14141c));
        pip.position.set(dx + px, py + 0.65, dz + 0.66); vegasG.add(pip);
      }
    }
    // the fountain (on the pond footprint)
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
    // sweeping spotlights
    for (const [x, z, hue] of [[24, -14, 0xff2f8e], [58, 16, 0x2fd4ff]]) {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 8), chrome);
      pod.position.set(x, 0.8, z); vegasG.add(pod);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 30, 10, 1, true), glowMat(hue));
      cone.material.transparent = true; cone.material.opacity = 0.16; cone.material.side = THREE.DoubleSide;
      cone.position.set(x, 15, z); vegasG.add(cone);
      cone.userData.sweep = { ph: x };
      vegasSpots.push(cone);
    }
    // ---- ROADS PAVED WITH GOLD: a glowing gold carpet down the lane, inlaid
    // with a diamond-chain centerline ----
    const goldLane = new THREE.Mesh(new THREE.PlaneGeometry(160, 9), glowMat(0xd9a838));
    goldLane.material.transparent = true; goldLane.material.opacity = 0.55;
    goldLane.rotation.x = -Math.PI / 2; goldLane.position.set(58, 0.02, 0); vegasG.add(goldLane);
    for (let i = 0; i < 30; i++) {
      const dia = new THREE.Mesh(new THREE.CircleGeometry(0.35, 4), glowMat(0xfff2c0));
      dia.rotation.x = -Math.PI / 2; dia.rotation.z = Math.PI / 4;
      dia.position.set(-14 + i * 4, 0.03, 0); vegasG.add(dia);
      vegasNeon.push({ m: dia.material, base: 1, sp: 3, ph: i * 0.4 });
    }

    // ---- GREEK MARBLE STATUES on pillars (Caesar/Bellagio classical) ----
    const marble = toonMat(0xf0ece0), gold = toonMat(0xd9a838);
    for (const [sx, sz, kind] of [[16, -7.5, 0], [30, 7.8, 1], [50, -7.8, 0], [76, 7.6, 1], [92, -7.6, 0]]) {
      const st = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.6, 12), marble);
      base.position.y = 0.3; st.add(base);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 2.4, 14), marble);
      col.position.y = 1.8; st.add(col);
      for (let f = 0; f < 12; f++) {          // fluting
        const fl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.4, 0.06), toonMat(0xd8d2c4));
        const a = f / 12 * Math.PI * 2; fl.position.set(Math.cos(a) * 0.52, 1.8, Math.sin(a) * 0.52); st.add(fl);
      }
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.35, 14), marble);
      cap.position.y = 3.2; st.add(cap);
      // the figure: a robed classical body + head, one arm raised holding a torch
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 4, 10), marble);
      body.position.y = 4.1; st.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), marble);
      head.position.y = 4.9; st.add(head);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.7, 4, 8), marble);
      arm.position.set(kind ? 0.5 : -0.5, 4.6, 0); arm.rotation.z = kind ? -0.9 : 0.9; st.add(arm);
      const torch = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 8), glowMat(0xffb020));
      torch.position.set(kind ? 0.82 : -0.82, 5.2, 0); st.add(torch);
      vegasNeon.push({ m: torch.material, base: 1, sp: 6, ph: sx });
      const laurel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 14), gold);
      laurel.rotation.x = Math.PI / 2; laurel.position.y = 5.05; st.add(laurel);
      st.position.set(sx, 0, sz); vegasG.add(st);
    }

    // ---- CARS cruising the Strip shoulders (glowing headlights) ----
    const carCols = [0xd83a3a, 0x2f7ad8, 0xf4f0e2, 0x1a1a22, 0xffd23f];
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1, cx = 12 + i * 9.5;
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 1.2), toonMat(carCols[i % 5]));
      body.position.y = 0.55; car.add(body);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 1.1), toonMat(0x2a3038));
      cabin.position.set(-0.1, 1.1, 0); car.add(cabin);
      for (const [wx, wz] of [[0.9, 0.6], [0.9, -0.6], [-0.9, 0.6], [-0.9, -0.6]]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12), toonMat(0x14141c));
        wheel.rotation.x = Math.PI / 2; wheel.position.set(wx, 0.32, wz); car.add(wheel);
      }
      for (const hz of [0.4, -0.4]) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), glowMat(0xfff6d0));
        lamp.position.set(1.35, 0.55, hz); car.add(lamp);
      }
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 1.0), glowMat(0xd83a3a));
      tail.position.set(-1.32, 0.6, 0); car.add(tail);
      car.position.set(cx, 0, side * 8.4); car.rotation.y = side > 0 ? Math.PI : 0;
      vegasG.add(car);
    }

    // ---- roadside SLOT MACHINES, conspicuously on the shoulders ----
    for (let i = 0; i < 7; i++) {
      const side = i % 2 ? -1 : 1, mx = 20 + i * 10;
      const slot = new THREE.Group();
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.7), toonMat(0x8a1030));
      cab.position.y = 0.9; slot.add(cab);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.05), glowMat(0xffe08a));
      screen.position.set(0, 1.25, 0.38); slot.add(screen);
      vegasNeon.push({ m: screen.material, base: 1, sp: 4, ph: mx });
      for (let r = 0; r < 3; r++) {
        const reel = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), toonMat(0x14141c));
        reel.position.set(-0.24 + r * 0.24, 1.25, 0.41); slot.add(reel);
      }
      const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), toonMat(0xc9c2b5));
      lever.position.set(0.55, 1.1, 0); lever.rotation.z = -0.4; slot.add(lever);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), glowMat(0xd83a3a));
      ball.position.set(0.72, 1.35, 0); slot.add(ball);
      const topper = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.7), glowMat(0xff2f8e));
      topper.position.y = 1.95; slot.add(topper);
      vegasNeon.push({ m: topper.material, base: 1, sp: 2.5, ph: mx + 1 });
      slot.position.set(mx, 0, side * 6.2); slot.rotation.y = side > 0 ? -0.4 : 0.4;
      vegasG.add(slot);
    }

    // ---- GIANT CARD BILLBOARDS towering over the Strip ----
    const suits = [['A', '♠', 0x14141c], ['K', '♥', 0xd83a3a], ['Q', '♦', 0xd83a3a], ['J', '♣', 0x14141c]];
    for (let i = 0; i < 4; i++) {
      const [rank, suit, col] = suits[i];
      const bx = 22 + i * 22, side = i % 2 ? 1 : -1;
      const bb = new THREE.Group();
      for (const s of [-1.4, 1.4]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9, 0.4), toonMat(0x2a2a33));
        leg.position.set(0, 4.5, s); bb.add(leg);
      }
      const face = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 4.2), toonMat(0xf4f0e2));
      face.position.y = 11; bb.add(face);
      const card = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 5.2),
        new THREE.MeshBasicMaterial({ map: makeTextTexture(rank + suit, col === 0xd83a3a ? '#d83a3a' : '#14141c'), transparent: true }));
      card.position.set(-0.17, 11, 0); card.rotation.y = -Math.PI / 2; bb.add(card);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 6.4, 4.6), glowMat(0xffd23f));
      frame.position.y = 11; bb.add(frame);
      vegasNeon.push({ m: frame.material, base: 1, sp: 1.5 + i, ph: bx });
      bb.position.set(bx, 0, side * 13); bb.rotation.y = side > 0 ? 0.3 : -0.3;
      vegasG.add(bb);
    }

    vegasG.traverse((m) => { if (m.isMesh && m.material.type !== 'MeshBasicMaterial') m.castShadow = true; });
    vegasG.visible = false;
    scene.add(vegasG);
  }
  const chipBarricade = mkBarricade((arr, bx) => {
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

  const CROWD_PALETTES = {
    winter: [0x9c4a4a, 0x4a6b8c, 0x5c7a5c, 0x8a7a9c, 0xe8e2d4, 0x7a5a44], // muted coats vs snow
    desert: [0xb5885a, 0x9c7a4a, 0xc9a86a, 0x7a6a4a, 0xd8b878, 0x8a5a3a], // dusty earth tones
    jungle: [0xc9b23a, 0xd87a3a, 0x5c8a5c, 0x8a4a3a, 0xe8d8a4, 0x4a6b5c], // expedition khakis + tropics
    lava:   [0x3a3a42, 0x5a2a2a, 0x8a4a2a, 0x2a2a30, 0x6e5a3a, 0x4a3a3a], // soot + ember leathers
    dojo:   [0xe8e2d4, 0x8a2a2a, 0x2a2a35, 0xc9b89a, 0x5c5a52, 0x8a7a5a], // gi whites, belt reds, monk greys
    therapy:[0x8a9cb0, 0xb0a08a, 0x6e7a8a, 0xc9c2b5, 0x5c6a7a, 0x9a8ab0], // waiting-room neutrals
    heaven: [0xf2efe4, 0xe8e2d4, 0xd8e4f0, 0xf0e8c9, 0xe4d8f0, 0xffffff], // robes, all of them
    hell:   [0x8a2a2a, 0x5a1a1a, 0xb54a2a, 0x3a2a2a, 0x6e2a3a, 0x2a1a1a], // various shades of regret
    haunted:[0x2a2a33, 0x3a2a3a, 0x4a3a2e, 0x33333c, 0x5a4a5a, 0x262e2a], // mourners' Sunday best
    tech:   [0x3a3f4a, 0x2a2a33, 0x4a5a6e, 0x2a6a6a, 0x6e7a8a, 0x1f2a3a], // hoodies, all of them
    vegas:  [0xff2f8e, 0x2fd4ff, 0xffd23f, 0x141018, 0x8a2fff, 0xf4f0e2], // showgirl neon + tux blacks
  };
  let crowdOrig = null;
  function setCrowdPalette(key) {
    if (!bodyIM.instanceColor) return;
    const pal = key != null ? CROWD_PALETTES[key] : null;
    if (pal && !crowdOrig) {
      crowdOrig = {
        body: bodyIM.instanceColor.array.slice(),
        skirt: skirtIM.instanceColor ? skirtIM.instanceColor.array.slice() : null,
      };
    }
    if (!crowdOrig) return;
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      if (pal) c.setHex(pal[i % pal.length]).offsetHSL(0, 0, ((i * 7) % 3) * -0.02);
      else c.fromArray(crowdOrig.body, i * 3);
      bodyIM.setColorAt(i, c);
    }
    bodyIM.instanceColor.needsUpdate = true;
    if (skirtIM.instanceColor && crowdOrig.skirt) {
      for (let i = 0; i < femN; i++) {
        if (pal) c.setHex(pal[(i + 2) % pal.length]).offsetHSL(0, -0.1, 0.06);
        else c.fromArray(crowdOrig.skirt, i * 3);
        skirtIM.setColorAt(i, c);
      }
      skirtIM.instanceColor.needsUpdate = true;
    }
  }

  // --- world themes: Day Fair / Night Fair / Frozen Lake ---
  // Same geometry, retinted + relit (the ice friction flip lives in ragdoll.js;
  // main.js drives both). Night gets string lanterns along the ring + stars.
  const lanternG = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffc46a }));
    orb.position.set(-14 + i * 2.3, 1.62 + (i % 2) * 0.12, i % 2 ? 3.05 : -3.05);
    lanternG.add(orb);
  }
  lanternG.visible = false;
  scene.add(lanternG);
  const starPts = [];
  for (let i = 0; i < 220; i++) {
    const a = Math.random() * Math.PI * 2, e = 0.12 + Math.random() * 1.35, r = 195;
    starPts.push(Math.cos(a) * Math.cos(e) * r + 48, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPts, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 0.9, fog: false }));
  stars.visible = false;
  scene.add(stars);

  const grassMap = grass.material.map, laneMap = lane.material.map;
  // Every world is ONE entry here: a palette + declarative flags. New worlds
  // need no bespoke branches in setWorldTheme — they declare a `group` (their
  // prop kit, registered in WORLD_GROUPS/WORLD_FX), a `biome` (retint key for
  // biomeMat/biomeIM variants), a `crowd` wardrobe, pond/sun tints, what farm
  // dressing hides, and which barricade stands at 20m.
  const WORLD_THEMES = {
    day:   { fog: [0xdce9f2, 45, 160], skyTint: 0xffffff, hemi: [0xcfe2ff, 0x4f6b3a, 0.9], sun: [0xfff2d8, 1.9], fill: 0.35, cloud: 0xfff6ea, maps: true,  grass: 0xffffff, lane: 0xffffff, night: false, sunFace: true },
    haunted: { fog: [0x121a16, 34, 118], skyTint: 0x141f1a, hemi: [0x7a9c8a, 0x18221c, 0.55], sun: [0xbfe0c8, 0.75], fill: 0.12, cloud: 0x2a3a30, maps: true, grass: 0x55705f, lane: 0x6a7268, night: true, sunFace: false,
      group: 'haunted', biome: 'haunted', crowd: 'haunted', pond: 0x0e1418,
      hideFarm: true, hideFair: true, hideBarn: true, hideCloths: true, barricade: 'coffins' },
    techcampus: { fog: [0xdde6ee, 60, 200], skyTint: 0xcfe0f2, hemi: [0xeaf2fa, 0x9aacb8, 1.0], sun: [0xf6faff, 2.0], fill: 0.42, cloud: 0xf4f8fc, maps: false, grass: 0xa8b0b8, lane: 0xc4c8ce, night: false, sunFace: true,
      group: 'techcampus', biome: 'tech', crowd: 'tech', pond: 0x2a8ae0, sunTint: [0xeef4ff, 0.7],
      hideFarm: true, hideBarn: true, hideFair: true, hideFences: true, hideCloths: true, barricade: 'boxes' },
    ice:   { fog: [0xe8f1fa, 45, 150], skyTint: 0xdfeafc, hemi: [0xdfeaff, 0x9fb2c8, 0.95], sun: [0xeaf4ff, 1.6], fill: 0.3, cloud: 0xf4f8ff, maps: false, grass: 0xe8f2f8, lane: 0xcfe6f2, night: false, sunFace: true,
      group: 'ice', biome: 'ice', crowd: 'winter', pond: 0xaed4ec, sunTint: [0xcfdce6, 0.6],
      hideFarm: true, hideFences: true, hideCloths: true, barricade: 'snow' },
    desert: { fog: [0xead4a8, 60, 185], skyTint: 0xf2ddb4, hemi: [0xffe8bf, 0xc79a5a, 1.05], sun: [0xfff0cf, 2.2], fill: 0.24, cloud: 0xfff2df, maps: false, grass: 0xd8b878, lane: 0xc79a5e, night: false, sunFace: true,
      group: 'desert', biome: 'desert', crowd: 'desert', pond: 0xa8895a, sunTint: [0xffe2b0, 1],
      hideFarm: true, hideFair: true, hideBarn: true, hideCloths: true, barricade: 'barrels' },
    jungle: { fog: [0x2f6636, 40, 135], skyTint: 0x3f6a44, hemi: [0xc0e8b0, 0x1f4a24, 1.05], sun: [0xf0f4c0, 1.7], fill: 0.34, cloud: 0x4a7a4a, maps: false, grass: 0x2e5a2a, lane: 0x5a4428, night: false, sunFace: false,
      group: 'jungle', biome: 'jungle', crowd: 'jungle', pond: 0x3f6a4a,
      hideFarm: true, hideFair: true, hideBarn: true, hideCloths: true, barricade: 'bamboo' },
    dojo: { fog: [0xe8dfd0, 50, 170], skyTint: 0xf4e6d0, hemi: [0xf5e8d5, 0x8a7a5c, 0.95], sun: [0xffe8c0, 1.8], fill: 0.3, cloud: 0xfff4e2, maps: false, grass: 0xd9c9a8, lane: 0xc9b490, night: false, sunFace: true,
      group: 'dojo', biome: 'dojo', crowd: 'dojo', pond: 0x4a7a8a,
      hideFarm: true, hideFair: true, hideBarn: true, hideCloths: true, hideFences: true, hideCrowd: true, barricade: 'shoji' },
    lava: { fog: [0x5a2414, 48, 165], skyTint: 0x3a1810, hemi: [0xffb070, 0x5a2410, 1.12], sun: [0xff8a3a, 1.9], fill: 0.4, cloud: 0x6a2e1e, maps: false, grass: 0x201613, lane: 0x2a201c, night: false, sunFace: false,
      group: 'lava', biome: 'lava', crowd: 'lava', pond: 0xff7a20, hideCrowd: true,
      hideFarm: true, hideBarn: true, hideFair: true, hideCloths: true, hideFences: true, barricade: 'boulders' },
    therapy: { fog: [0x4a3524, 85, 260], skyTint: 0x3a2a1c, hemi: [0xffe4b8, 0x6a4e34, 1.45], sun: [0xfff0d4, 1.8], fill: 0.6, cloud: 0x4a3524, maps: false, grass: 0x7a5636, lane: 0x8a2530, night: false, sunFace: false,
      group: 'therapy', biome: 'therapy', crowd: 'therapy', pond: 0x14141c, sunTint: [0xf0e4ff, 0.9], hideCrowd: true,
      hideFarm: true, hideFair: true, hideBarn: true, hideCloths: true, hideBarn: true, barricade: 'books' },
    heaven: { fog: [0xdcecf8, 44, 150], skyTint: 0x7ab0e8, hemi: [0xfff4dc, 0xb0bcd0, 0.85], sun: [0xfff2c8, 2.6], fill: 0.18, cloud: 0xffffff, maps: false, grass: 0xe4e0d0, lane: 0xefc85a, night: false, sunFace: true,
      group: 'heaven', biome: 'heaven', crowd: 'heaven', pond: 0xbfe0f4,
      hideFarm: true, hideFair: true, hideBarn: true, hideCloths: true, hideFences: true, barricade: 'cloud' },
    // Dante's NINTH CIRCLE is FROZEN (Cocytus), not fire: an icy blue-white lake
    // under a hellish red glow — high contrast (red demons on pale ice), readable,
    // and canon. Fog pushed WAY back (was 34m — flights vanished into red murk and
    // looked like they hit a wall) so the whole arena + every flight stays visible.
    hell: { fog: [0x5a3a48, 95, 260], skyTint: 0x431722, hemi: [0xe08a6a, 0x8fa8bc, 1.05], sun: [0xffc0a0, 2.0], fill: 0.5, cloud: 0x5a2030, maps: false, grass: 0x9fb8c8, lane: 0xcdddE8, night: false, sunFace: false,
      group: 'hell', biome: 'hell', crowd: 'hell', pond: 0xff7a20,
      hideFarm: true, hideFair: true, hideBarn: true, hideCloths: true, hideFences: true, barricade: 'redtape' },
    vegas: { fog: [0x3a2450, 60, 210], skyTint: 0x241640, hemi: [0xffd9a0, 0x4a2f6a, 1.05], sun: [0xffcf9a, 1.7], fill: 0.42, cloud: 0x4a2f6a, maps: false, grass: 0x3a2450, lane: 0xcaa03a, night: true, sunFace: false,
      group: 'vegas', biome: 'vegas', crowd: 'vegas', pond: 0x2fd4ff, sunTint: [0xffe0b0, 0.8],
      hideFarm: true, hideBarn: true, hideFair: true, hideCloths: true, hideFences: true, barricade: 'chips' },
  };
  const WORLD_GROUPS = {
    ice: winterG, desert: desertG, jungle: jungleG, dojo: dojoG,
    lava: lavaG, heaven: heavenG, hell: hellG, therapy: therapyG,
    haunted: hauntedG, techcampus: techG, vegas: vegasG,
  };
  // every non-farm world re-dresses the perimeter, so pine hides whenever any
  // kit with its own belt is up (each belt lives inside its kit group)
  const BELT_WORLDS = new Set(['desert', 'jungle', 'dojo', 'lava', 'heaven', 'hell', 'therapy', 'haunted', 'techcampus', 'vegas']);
  const WORLD_FX = {                                 // per-world extras beyond the kit
    ice: (on) => {
      snowPts.visible = on;
      furG.visible = on;
      for (const cf of furCuffs) cf.visible = on;
      if (coniferCaps) coniferCaps.visible = on;
    },
    desert: (on) => { if (cactusBelt) cactusBelt.visible = on; },
  };
  const BARRICADES = {
    planks: summerBarricade, snow: snowBarricade, barrels: barrelBarricade,
    bamboo: bambooBarricade, shoji: shojiBarricade, boulders: boulderBarricade,
    cloud: cloudBarricade, redtape: redtapeBarricade, books: booksBarricade,
    coffins: coffinsBarricade, boxes: boxesBarricade, chips: chipBarricade,
  };
  const hasWorld = (n) => !!WORLD_THEMES[n];

  function applyPalette(t) {
    scene.fog.color.setHex(t.fog[0]);
    scene.fog.near = t.fog[1];
    scene.fog.far = t.fog[2];
    sky.material.color.setHex(t.skyTint);
    hemi.color.setHex(t.hemi[0]); hemi.groundColor.setHex(t.hemi[1]); hemi.intensity = t.hemi[2];
    sun.color.setHex(t.sun[0]); sun.intensity = t.sun[1];
    fill.intensity = t.fill;
    cloudMat.color.setHex(t.cloud);
    // flat-color worlds (ice, desert…) drop the ground textures; others restore
    grass.material.map = t.maps ? grassMap : null;
    lane.material.map = t.maps ? laneMap : null;
    grass.material.color.setHex(t.grass);
    lane.material.color.setHex(t.lane);
    grass.material.needsUpdate = true;
    lane.material.needsUpdate = true;
    sunFace.visible = t.sunFace;
    const [sTint, sOp] = t.sunTint || [0xffffff, 1];
    sunFace.material.color.setHex(sTint);
    sunFace.material.opacity = sOp;
    lanternG.visible = !!t.night;
    stars.visible = !!t.night;
    if (pondWater) pondWater.material.color.setHex(t.pond || 0x5b9bd0);
  }

  function setWorldTheme(name) {
    const t = WORLD_THEMES[name] || WORLD_THEMES.day;
    applyPalette(t);
    for (const [k, g] of Object.entries(WORLD_GROUPS)) g.visible = k === t.group;
    for (const [k, fn] of Object.entries(WORLD_FX)) fn(k === t.group);
    if (coniferIM) coniferIM.visible = !BELT_WORLDS.has(t.group); // pine ⇄ the world's own belt
    barn.visible = !t.hideBarn && !t.hideFair;                     // therapy trades it for the couch
    // hideFair strips the WHOLE midway (barn/silo/windmill/tractor/ferris) —
    // not just the farmhouses hideFarm hides — for worlds that aren't a fair
    for (const s of [silo, mill, tractor, ferris]) s.visible = !t.hideFair;
    for (const tr of orchardTrees) tr.visible = !t.hideFair;
    for (const cm of [cornIM, edgeCornIM, fieldCornIM]) cm.visible = !t.hideFair; // no cornfields on the Strip / a ship / the tar
    for (const tr of sceneTrees) tr.visible = !t.hideFair;
    for (const d of fairDecor) d.visible = !t.hideFair;      // watermelons, county sign
    for (const a of animals) a.g.visible = !t.hideFair;      // no wandering pigs on the Strip
    for (const b of birds) b.g.visible = !t.hideFair;        // no farm sparrows over hell
    sb.visible = !t.hideFair;                                // the "SLAPMANIA FAIR" board is fair-only
    for (const im of [bodyIM, headIM, armIM, eyeIM, hairIM, skirtIM, brimIM, crownIM])
      im.visible = !t.hideCrowd;                             // no human audience in lava or a therapy room
    balloon.visible = !t.hideFair;                           // the fair balloon doesn't drift over hell
    buntingG.visible = !t.hideFair;                          // no fairground pennants in a therapy room
    for (const fh of farmhouses) fh.visible = !t.hideFarm;
    for (const fb of fenceBits) fb.visible = !t.hideFences;
    for (const c of cloths) c.mesh.visible = !t.hideCloths;
    const bar = t.barricade || 'planks';
    for (const [k, arr] of Object.entries(BARRICADES)) for (const m of arr) m.visible = k === bar;
    setCrowdPalette(t.crowd || null);
    setBiome(t.biome || null);
  }

  return {
    renderer, scene, camera, updateCrowd, shake, applyShake, START_X,
    trackSun, spawnShock, spawnDust, updateFX, updateAmbient, setScoreboard, animals,
    breakBarricade, resetBarricade, isBarricadeBroken: () => barricade.broken,
    sunMood, currentSunMood: () => sunCurrent, cowMoo, kidsCelebrate, spawnConfetti, lavaBurst,
    summonSpirits, spawnBeam, spawnSparkles, slapDuel, scareBirds, solids, setWorldTheme, hasWorld,
    // strike the dojo's Great Gong: a big wobble that decays in updateAmbient
    ringGong: () => { if (gongDisc) gongDisc.rotation.x = 0.45; },
    // the flyer passing through a ghost sends it darting skyward, briefly faded
    spookGhosts: (pt) => {
      let hit = false;
      for (const gh of ghosts) {
        if (gh.spookT <= 0 && gh.g.position.distanceTo(pt) < 2.4) { gh.spookT = 1.5; hit = true; }
      }
      return hit;
    },
    isHauntedUp: () => hauntedG.visible,
    isDojoUp: () => dojoG.visible,
    setSpirit, setJudge, setBruce, cinePoints,
  };
}
