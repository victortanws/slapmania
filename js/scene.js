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
  g.fillText(text, 256, 68);
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
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x4f6b3a, 0.9));
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
  for (const s of [-1, 1]) for (const ry of [0.42, 0.8]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(66.5, 0.08, 0.06), woodMat);
    rail.position.set(25, ry, s * 2.92);
    scene.add(rail);
  }

  // festive bunting — kept well clear of the camera's view of the ring
  const flagCols = [0xd8404f, 0xffd23f, 0x3f7fbf, 0xf2ede1, 0x5fae5a];
  for (const bx of [-5.5, 30]) {
    for (const s of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.7, 0.09), woodMat);
      pole.position.set(bx, 1.35, s * 2.95);
      scene.add(pole);
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
      scene.add(f);
    }
  }

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
  function farmhouse(x, z, ry, wallCol, s = 1, sign = null) {
    const fh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(7, 11, 17), toonMat(wallCol));
    body.position.y = 5.5;
    fh.add(body);
    const gable = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 7, 3, 1), toonMat(wallCol));
    gable.rotation.set(Math.PI / 2, 0, 0);
    gable.position.y = 12.5;
    gable.scale.set(1, 1, 0.55);
    fh.add(gable);
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.3, 9.6), toonMat(0x5a4632));
    roofL.position.set(0, 14.2, -4.4);
    roofL.rotation.x = 0.62;
    fh.add(roofL);
    const roofR = roofL.clone();
    roofR.position.z = 4.4;
    roofR.rotation.x = -0.62;
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

  // --- hay: round bales, a stack, and the crash wall at the end of the lane ---
  const hayMat = toonMat(0xd9b96a);
  const hayEnd = toonMat(0xc4a355);
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
  scene.add(cornIM);

  // --- trees ---
  function tree(x, z, s = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.4, 8), toonMat(0x6b4a2e));
    trunk.position.y = 1.2;
    trunk.castShadow = true;
    g.add(trunk);
    for (const [ox, oy, oz, r] of [[0, 3.1, 0, 1.5], [0.9, 2.5, 0.3, 1.0], [-0.9, 2.6, -0.2, 1.1]]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), toonMat(0x4e7d3a));
      puff.position.set(ox, oy, oz);
      puff.castShadow = true;
      g.add(puff);
    }
    g.scale.setScalar(s);
    g.position.set(x, 0, z);
    scene.add(g);
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
  scene.add(edgeCornIM);

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
    solids.push({ kind: 'cyl', x, z, r: 0.3, h: 2.1 });
  }
  scarecrow(30, 5.6, -0.5);
  scarecrow(47, -6.4, 0.7);

  // pumpkin patch
  for (let i = 0; i < 12; i++) {
    const r = 0.14 + Math.random() * 0.16;
    const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), toonMat(0xd8722d));
    p.scale.y = 0.72;
    p.position.set(36 + Math.random() * 8, r * 0.68, -4.6 - Math.random() * 2.8);
    p.castShadow = true;
    scene.add(p);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.09, 5), toonMat(0x5c7a3a));
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
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.5, 6), toonMat(0x5c7a3a));
    stalk.position.y = 0.75;
    g.add(stalk);
    const face = new THREE.Group();
    face.position.y = 1.55;
    face.rotation.y = -Math.PI / 2; // greets the incoming flyer
    face.rotation.x = 0.15;
    const petals = new THREE.Mesh(new THREE.CircleGeometry(0.24, 12), toonMat(0xf2c53d));
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
  }
  for (let i = 0; i < 6; i++) sunflower(56 + i * 2.4, 6.4 + (i % 3) * 0.9, 0.9 + Math.random() * 0.4);
  for (let i = 0; i < 4; i++) sunflower(60 + i * 2.8, -6.8 - (i % 2) * 1.1, 0.9 + Math.random() * 0.4);

  // a rustic rail fence framing the +z edge of the lane
  {
    const fenceMat = toonMat(0x8a6a42);
    for (let x = 26; x <= 74; x += 4) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), fenceMat);
      post.position.set(x, 0.5, 9.6);
      post.castShadow = true;
      scene.add(post);
    }
    for (const y of [0.5, 0.85]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(48, 0.07, 0.06), fenceMat);
      rail.position.set(50, y, 9.6);
      scene.add(rail);
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
  scene.add(fieldCornIM);

  // fruit trees: apples red, oranges orange, both delicious at 30 m/s
  function fruitTree(x, z, fruitCol, leafCol, s = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.9, 8), toonMat(0x6b4a2e));
    trunk.position.y = 0.95;
    g.add(trunk);
    const blob = new THREE.Mesh(new THREE.SphereGeometry(1.35, 10, 10), toonMat(leafCol));
    blob.scale.set(1, 0.85, 1);
    blob.position.y = 2.6;
    g.add(blob);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random();
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 7), toonMat(fruitCol));
      fruit.position.set(Math.cos(a) * 1.15, 2.2 + Math.random() * 0.9, Math.sin(a) * 1.15);
      g.add(fruit);
    }
    // windfall fruit in the grass
    for (let i = 0; i < 2; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.08, 7, 7), toonMat(fruitCol));
      drop.position.set((Math.random() - 0.5) * 2.4, 0.08, (Math.random() - 0.5) * 2.4);
      g.add(drop);
    }
    g.traverse((o) => { o.castShadow = true; });
    g.scale.setScalar(s);
    g.position.set(x, 0, z);
    scene.add(g);
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
  {
    const water = new THREE.Mesh(new THREE.CircleGeometry(6, 24), toonMat(0x5b9bd0));
    water.rotation.x = -Math.PI / 2;
    water.position.set(40, 0.03, 24);
    scene.add(water);
    const rim = new THREE.Mesh(new THREE.RingGeometry(6, 6.8, 24), toonMat(0xc9b88a));
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(40, 0.02, 24);
    scene.add(rim);
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.9 + Math.random() * 0.6, 4), toonMat(0x5c7a3a));
      reed.position.set(40 + Math.cos(a) * (5.6 + Math.random()), 0.5, 24 + Math.sin(a) * (5.6 + Math.random()));
      scene.add(reed);
    }
  }

  // watermelon patch by the ring-side fence
  for (let i = 0; i < 8; i++) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.1, 10, 8), toonMat(0x3f7d3a));
    w.scale.set(1.35, 0.8, 1);
    w.rotation.y = Math.random() * Math.PI;
    w.position.set(26 + Math.random() * 6, 0.16, -15.5 - Math.random() * 3);
    w.castShadow = true;
    scene.add(w);
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
  }

  // perimeter forest: the TRUE edge of the world, dressed as dense conifers
  // exactly where the physics catches — nobody ever hits an invisible wall
  {
    const spots = [];
    for (let z = -36; z <= 36; z += 2.4) spots.push([115.5 + Math.random() * 3, z + Math.random()]);        // far treeline
    for (let x = -18; x <= 113; x += 2.6) spots.push([x + Math.random(), 35.5 + Math.random() * 3]);        // north woods
    for (let x = -18; x <= 113; x += 2.6) spots.push([x + Math.random(), -35.5 - Math.random() * 3]);       // south woods
    for (let z = -34; z <= 34; z += 3.2) spots.push([-20.5 - Math.random() * 2, z + Math.random()]);        // behind the fair
    const conifer = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 7, 7), toonMat(0xffffff), spots.length);
    for (let i = 0; i < spots.length; i++) {
      pd.position.set(spots[i][0], 3.2, spots[i][1]);
      pd.rotation.y = Math.random() * Math.PI;
      const sc = 0.8 + Math.random() * 0.6;
      pd.scale.set(sc, sc * (0.9 + Math.random() * 0.4), sc);
      pd.updateMatrix();
      conifer.setMatrixAt(i, pd.matrix);
      conifer.setColorAt(i, cc.setHSL(0.32, 0.35, 0.2 + Math.random() * 0.1));
    }
    conifer.castShadow = true;
    scene.add(conifer);
  }

  // distant hills close the horizon — the county rolls on to ~200m
  for (const [hx, hz, hr, hh] of [[190, -60, 90, 26], [170, 80, 80, 20], [-90, -120, 100, 24], [40, 190, 110, 26], [230, 40, 100, 30]]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 16, 12), toonMat(0x6e8f5a));
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
  function updateAmbient(dt, time) {
    fan.rotation.z += dt * 1.4;
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
    g.position.set(x + 6, 4.6, 0);
    scene.add(g);
    fx.push({ mesh: g, t: 0, life: 5.2, type: 'duel', angel, devil, hits: 0 });
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

  return {
    renderer, scene, camera, updateCrowd, shake, applyShake, START_X,
    trackSun, spawnShock, spawnDust, updateFX, updateAmbient, setScoreboard, animals,
    breakBarricade, resetBarricade, isBarricadeBroken: () => barricade.broken,
    sunMood, currentSunMood: () => sunCurrent, cowMoo, kidsCelebrate, spawnConfetti,
    summonSpirits, spawnBeam, spawnSparkles, slapDuel, scareBirds, solids,
  };
}
