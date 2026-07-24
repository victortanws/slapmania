// ---------------------------------------------------------------------------
// cinema.js — a game-agnostic offline film renderer.
//
// This module knows nothing about SlapMania. It is handed a HOST:
//
//   createCinema({
//     renderer, scene, camera,          // any three.js trio
//     step(events, seconds, onStep),    // drive the sim; onStep(simMs, i) per frame
//                                       // with rendering suppressed
//     setup(shot),                      // optional: game-specific per-shot staging
//     sink: 'http://127.0.0.1:8998',    // where frames are POSTed
//   })
//
// …and it owns everything downstream of that: deterministic camera placement,
// frame capture, 2D overlay compositing, slow-motion windows, the frame sink,
// contact-sheet probes, and a resumable shot driver.
//
// A storyboard is then just data + camera functions (see movie.js, vlog.js).
// Porting the whole filming rig to another project means writing one host
// object; nothing in this file changes.
// ---------------------------------------------------------------------------
import * as THREE from 'three';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp01 = (u) => Math.max(0, Math.min(1, u));
export const smooth = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
export const easeOut = (u) => 1 - Math.pow(1 - clamp01(u), 3);
export const lerp = (a, b, u) => a + (b - a) * u;
export const mixV = (a, b, u) => a.clone().lerp(b, clamp01(u));
// deterministic handheld jitter — no RNG, so a re-shoot matches frame for frame
export const shake = (t, amp) => V(
  Math.sin(t * 0.0131) * amp + Math.sin(t * 0.0071) * amp * 0.6,
  Math.cos(t * 0.0113) * amp * 0.8,
  Math.sin(t * 0.0091 + 1.7) * amp * 0.5,
);

export const RED = '#c8281c', GOLD = '#f6c945', CREAM = '#f7f0dc';
export const FONT = (px, w = 900) => `${w} ${px}px Impact, "Arial Black", "Haettenschweiler", sans-serif`;
export const SANS = (px, w = 700) => `${w} ${px}px "Helvetica Neue", Arial, sans-serif`;

export function createCinema(host) {
  const W = host.width || 1280, H = host.height || 720, FPS = host.fps || 30;
  const SINK = host.sink || 'http://127.0.0.1:8998';

  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const g = out.getContext('2d');

  let frameNo = 0, buf = [], cursor = 0;
  const marks = [];
  const report = [];

  const now = () => frameNo / FPS;
  const tmpUp = new THREE.Vector3(0, 1, 0);

  // ---- camera ----
  function place(pos, look, fov = 50, dutch = 0) {
    const cam = host.camera;
    cam.position.copy(pos);
    if (dutch) cam.up.set(Math.sin(dutch), Math.cos(dutch), 0); else cam.up.copy(tmpUp);
    cam.lookAt(look);
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }

  // ---- overlay primitives ----
  function bars(frac) {
    const b = Math.round(H * (frac === undefined ? 0.075 : frac));
    if (b <= 0) return;
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, b); g.fillRect(0, H - b, W, b);
  }
  function vignette(strength = 0.42) {
    const r = g.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.95);
    r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, `rgba(0,0,0,${strength})`);
    g.fillStyle = r; g.fillRect(0, 0, W, H);
  }
  function shadowText(text, x, y, font, fill, align = 'center', blur = 12) {
    g.font = font; g.textAlign = align; g.textBaseline = 'alphabetic';
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = blur; g.shadowOffsetY = 3;
    // NB: pull the px size out of the font string — parseInt() would read the weight
    const px = parseFloat((/(\d+(?:\.\d+)?)px/.exec(font) || [0, 20])[1]);
    g.lineWidth = Math.max(3, px * 0.1); g.strokeStyle = 'rgba(0,0,0,0.9)';
    g.strokeText(text, x, y);
    g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.fillStyle = fill; g.fillText(text, x, y);
    g.restore();
  }
  function titleCard(text, sub, u) {
    const a = Math.min(smooth(u * 3), smooth((1 - u) * 3));
    if (a <= 0.01) return;
    g.save(); g.globalAlpha = a;
    const y = H * 0.47 + (1 - easeOut(Math.min(1, u * 2.2))) * 26;
    shadowText(text, W / 2, y, FONT(Math.round(H * 0.115)), CREAM, 'center', 18);
    if (sub) shadowText(sub, W / 2, y + Math.round(H * 0.072), FONT(Math.round(H * 0.038), 700), GOLD, 'center', 10);
    g.restore();
  }
  function namePlate(name, tag, u) {
    const inU = smooth(Math.min(1, u * 5)), outU = smooth(Math.min(1, (1 - u) * 5));
    const a = Math.min(inU, outU);
    if (a <= 0.01) return;
    const pad = 26, x = Math.round(W * 0.062) - (1 - inU) * 60;
    const y = Math.round(H * 0.775);
    g.save(); g.globalAlpha = a;
    g.font = FONT(38); const nw = g.measureText(name).width;
    g.font = FONT(21, 700); const tw = tag ? g.measureText(tag).width : 0;
    const bw = Math.max(nw, tw) + pad * 2;
    g.fillStyle = 'rgba(12,10,8,0.72)';
    g.fillRect(x, y - 46, bw, tag ? 84 : 62);
    g.fillStyle = RED; g.fillRect(x, y - 46, 9, tag ? 84 : 62);
    shadowText(name, x + pad, y, FONT(38), CREAM, 'left', 8);
    if (tag) shadowText(tag, x + pad, y + 27, FONT(21, 700), GOLD, 'left', 6);
    g.restore();
  }
  function caption(text, u, opts = {}) {
    const a = Math.min(smooth(u * 6), smooth((1 - u) * 6));
    if (a <= 0.01 || !text) return;
    g.save(); g.globalAlpha = a;
    const size = Math.round(H * (opts.size || 0.042));
    const font = opts.sans ? SANS(size) : FONT(size, 700);
    g.font = font;
    const maxW = W * 0.82, words = String(text).split(' '), lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    const base = H - Math.round(H * (opts.bottom || 0.105)) - (lines.length - 1) * size * 1.2;
    lines.forEach((ln, i) => shadowText(ln, W / 2, base + i * size * 1.2, font, CREAM, 'center', 10));
    g.restore();
  }
  function flash(a, color = '#fff') {
    if (a <= 0.001) return;
    g.save(); g.globalAlpha = clamp01(a); g.fillStyle = color; g.fillRect(0, 0, W, H); g.restore();
  }
  function speedLines(u, n = 26) {
    const a = Math.min(1, u) * 0.5;
    if (a <= 0.01) return;
    g.save(); g.globalAlpha = a; g.strokeStyle = '#fff'; g.lineWidth = 3;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + u * 0.6;
      const r0 = H * (0.42 + (i % 3) * 0.08) + u * 120;
      const r1 = r0 + 90 + (i % 4) * 40;
      g.beginPath();
      g.moveTo(W / 2 + Math.cos(ang) * r0, H / 2 + Math.sin(ang) * r0);
      g.lineTo(W / 2 + Math.cos(ang) * r1, H / 2 + Math.sin(ang) * r1);
      g.stroke();
    }
    g.restore();
  }
  // phone-camera chrome: REC dot, running timecode, battery
  function recHud(tSec, opts = {}) {
    g.save();
    const m = Math.round(H * 0.045);
    const blink = (Math.floor(tSec * 1.6) % 2) === 0;
    if (blink) { g.fillStyle = '#e8281c'; g.beginPath(); g.arc(m + 10, m + 10, 9, 0, 7); g.fill(); }
    shadowText('REC', m + 30, m + 18, SANS(Math.round(H * 0.03), 800), '#fff', 'left', 6);
    const mm = String(Math.floor(tSec / 60)).padStart(2, '0');
    const ss = String(Math.floor(tSec % 60)).padStart(2, '0');
    const ff = String(Math.floor((tSec % 1) * 30)).padStart(2, '0');
    shadowText(`${mm}:${ss}:${ff}`, W - m, m + 18, SANS(Math.round(H * 0.03), 700), '#fff', 'right', 6);
    // battery
    const bw = 46, bh = 20, bx = W - m - bw, by = m + 34;
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2.5;
    g.strokeRect(bx, by, bw, bh);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(bx + bw + 3, by + 6, 4, 8);
    const lvl = opts.battery === undefined ? 0.42 : opts.battery;
    g.fillStyle = lvl < 0.25 ? '#e8281c' : '#fff';
    g.fillRect(bx + 3, by + 3, (bw - 6) * lvl, bh - 6);
    g.restore();
  }

  // ---- capture ----
  function grab(ov, style) {
    host.renderer.render(host.scene, host.camera);
    g.drawImage(host.renderer.domElement, 0, 0, W, H);
    if (!style || style.vignette !== false) vignette(style && style.vignette);
    if (ov) ov();
    if (style && style.bars !== undefined) bars(style.bars); else bars();
    buf.push([`f_${String(frameNo).padStart(6, '0')}.jpg`, out.toDataURL('image/jpeg', 0.92)]);
    frameNo++;
  }
  async function flush() {
    for (const [name, url] of buf) {
      const bin = atob(url.slice(url.indexOf(',') + 1));
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      await fetch(`${SINK}/${name}`, { method: 'POST', body: arr });
    }
    buf = [];
  }

  // ---- shot runner ----
  // shot = { id, cap:[a,b], slow:[a,b], events, cam(simMs,u), ov(simMs,u), style, ...host fields }
  async function runShot(sh) {
    if (host.setup) host.setup(sh);
    const [ca, cb] = sh.cap;
    const slow = sh.slow || [-1, -1];
    const start = frameNo;
    host.step(sh.events || [], cb / 1000, (sim, i) => {
      if (sim < ca || sim > cb) return;
      const inSlow = sim >= slow[0] && sim <= slow[1];
      if (!inSlow && i % 2 !== 0) return;      // 60fps sim → 30fps out; slow window keeps every frame
      const u = (sim - ca) / (cb - ca);
      if (sh.tick) sh.tick(sim, u);            // storyboard-owned actors (walkers, props)
      sh.cam(sim, u);
      grab(sh.ov ? () => sh.ov(sim, u) : null, sh.style);
    });
    await flush();
    return { id: sh.id, frames: frameNo - start, sec: +((frameNo - start) / FPS).toFixed(2) };
  }

  // ---- contact-sheet probe: render candidate framings as stills ----
  async function probe(specs, atMs = 0) {
    if (atMs) host.step([], atMs / 1000, () => {});
    for (let i = 0; i < specs.length; i++) {
      const sp = specs[i];
      place(sp.pos, sp.look, sp.fov || 50, sp.dutch || 0);
      host.renderer.render(host.scene, host.camera);
      g.drawImage(host.renderer.domElement, 0, 0, W, H);
      shadowText(sp.label || `#${i}`, 24, 56, FONT(34), GOLD, 'left', 8);
      const url = out.toDataURL('image/jpeg', 0.85);
      const bin = atob(url.slice(url.indexOf(',') + 1));
      const arr = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
      await fetch(`${SINK}/probe_${String(i).padStart(2, '0')}.jpg`, { method: 'POST', body: arr });
    }
    return specs.map((s, i) => s.label || `#${i}`);
  }

  // ---- driver ----
  function boot(shots) {
    host.renderer.setPixelRatio(1);
    host.renderer.setSize(W, H, false);
    host.camera.aspect = W / H;
    host.camera.updateProjectionMatrix();
    frameNo = 0; cursor = 0; marks.length = 0; report.length = 0;
    return { shots: shots.length, size: [W, H], fps: FPS };
  }
  // re-shoot a tail without redoing good footage — frames are named by index
  function resume(c, f) { cursor = c; frameNo = f; return { cursor, frameNo }; }

  async function runNext(shots, n = 1) {
    const done = [];
    for (let i = 0; i < n && cursor < shots.length; i++, cursor++) {
      const sh = shots[cursor];
      marks.push({ id: sh.id, t: now() });
      const r = await runShot(sh);
      report.push(r); done.push(r);
    }
    return { done, cursor, total: shots.length, frames: frameNo, sec: +(frameNo / FPS).toFixed(2), finished: cursor >= shots.length };
  }

  return {
    place, grab, flush, runShot, probe, boot, resume, runNext,
    bars, vignette, shadowText, titleCard, namePlate, caption, flash, speedLines, recHud,
    ctx: () => g, size: [W, H], fps: FPS,
    marks, report, frame: () => frameNo, time: now,
  };
}
