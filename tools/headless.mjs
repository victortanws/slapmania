// ---------------------------------------------------------------------------
// headless.mjs — run the offline cinematic renderer without a human at a Mac.
//
// Launches headless Chromium (Playwright, SwiftShader WebGL), serves the repo,
// serves the CDN import map from a local vendor dir (so no outbound network is
// needed), boots a storyboard module (tools/nature.js, promo.js, …) and drives
// it shot by shot exactly as a person would from the console. Frames + audio
// still flow through tools/framesink.py — start it (and a static server)
// yourself, or let this script spawn both.
//
//   node tools/headless.mjs --module /tools/nature.js --frames /tmp/frames \
//        --vendor /path/with/three.module.js+cannon-es.js [--score /tools/nature-score.js]
//
// The storyboard may expose window.__cine (marks, contact frames…); whatever
// it leaves there is written to <frames>/marks.json for the assembler and the
// VO timeline. Works anywhere Playwright's Chromium runs — including CI boxes.
// ---------------------------------------------------------------------------
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODULE = arg('module', '/tools/nature.js');
const FRAMES = arg('frames', '/tmp/frames');
const VENDOR = arg('vendor', '');
const SCORE = arg('score', '');
const PORT = +arg('port', 8994);
const SINK = +arg('sink', 8998);
const SHOTS_N = +arg('shots', 999);

const kids = [];
const spawnKid = (cmd, args) => {
  const p = spawn(cmd, args, { stdio: 'ignore' });
  kids.push(p);
  return p;
};
process.on('exit', () => kids.forEach((k) => k.kill()));

spawnKid('python3', [join(ROOT, 'tools/framesink.py'), String(SINK), FRAMES]);
spawnKid('python3', ['-m', 'http.server', String(PORT), '-d', ROOT, '--bind', '127.0.0.1']);
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl',
         '--disable-web-security', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 400)));

// the import map points at jsdelivr; serve those two files from the vendor dir
// and refuse everything else off-box so a sandboxed render can't stall on I/O
await page.route('**/*', (route) => {
  const url = route.request().url();
  if (url.includes('cdn.jsdelivr.net') && VENDOR) {
    const file = url.includes('three') ? 'three.module.js' : 'cannon-es.js';
    const p = join(VENDOR, file);
    if (existsSync(p)) {
      return route.fulfill({ body: readFileSync(p), contentType: 'application/javascript' });
    }
  }
  if (url.startsWith(`http://127.0.0.1`) || url.startsWith('http://localhost')) return route.continue();
  return route.abort();
});

await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__slapp && window.__slapp.stage && window.__slapp.stage.renderer,
  null, { timeout: 30000 });
console.log('game booted; webgl:', await page.evaluate(() => {
  const gl = window.__slapp.stage.renderer.getContext();
  return gl.getParameter(gl.VERSION);
}));

const bootInfo = await page.evaluate(async (mod) => {
  window.__mod = await import(mod);
  return await window.__mod.boot();
}, MODULE);
console.log('storyboard boot:', JSON.stringify(bootInfo));

// splice-reshoot: jump to shot N / frame F; downstream frames on disk stay
// valid as long as no cap/slow window changed (frame counts are deterministic)
const rc = arg('resume-cursor', ''), rf = arg('resume-frame', '');
if (rc !== '') {
  console.log('resume:', await page.evaluate((r) => JSON.stringify(window.__mod.resume(r.c, r.f)),
    { c: +rc, f: +rf }));
}

let done = false;
for (let i = 0; i < SHOTS_N && !done; i++) {
  const r = await page.evaluate(() => window.__mod.runNext(1));
  console.log(`shot ${r.cursor}/${r.total}  ${r.done[0] ? r.done[0].id : ''}  ` +
    `${r.done[0] ? r.done[0].frames : 0}f  total ${r.sec}s`);
  done = r.finished;
}

const marks = await page.evaluate(() => ({
  shots: window.__mod.cues ? window.__mod.cues() : [],
  extra: window.__cine || {},
}));
writeFileSync(join(FRAMES, 'marks.json'), JSON.stringify(marks, null, 2));
console.log('marks written:', JSON.stringify(marks.extra));

if (SCORE) {
  const sc = await page.evaluate(async (m) => {
    const S = await import(m.mod);
    return await S.render(m.cue);
  }, { mod: SCORE, cue: buildCue(marks) });
  console.log('score:', JSON.stringify(sc));
}

function buildCue(marks) {
  const last = marks.shots[marks.shots.length - 1];
  const dur = (marks.extra && marks.extra.totalSec) || (last ? last.t + 8 : 60);
  return { dur, shots: marks.shots, hits: (marks.extra && marks.extra.hits) || [] };
}

await browser.close();
process.exit(0);
