// Campaign cutscenes: video-game dialogue over the live 3D scene. Lines are
// { who, text, shot } — shot picks the camera ('player' | 'opp' | 'wide');
// main.js freezes the state machine and drives the close-up while active.
// Self-contained DOM; any click/key advances, SKIP ends the scene.

const $ = (id) => document.getElementById(id);
let queue = [];
let idx = 0;
let active = false;
let onEnd = null;

function render() {
  const l = queue[idx];
  $('dlgName').textContent = l.who;
  $('dlgText').textContent = l.text;
  $('dlg').classList.remove('hidden');
}

export const isActive = () => active;
export const currentShot = () => (active && queue[idx] ? queue[idx].shot || 'wide' : 'wide');

export function play(lines, done) {
  if (!lines || !lines.length) { done && done(); return; }
  queue = lines;
  idx = 0;
  active = true;
  onEnd = done || null;
  render();
}

export function advance() {
  if (!active) return;
  idx++;
  if (idx >= queue.length) stop();
  else render();
}

export function stop() {
  if (!active) return;
  active = false;
  $('dlg').classList.add('hidden');
  const cb = onEnd;
  onEnd = null;
  if (cb) cb();
}

// wire the box itself (module loads after DOM — script is type=module at body end)
$('dlgSkip').addEventListener('click', (e) => { e.stopPropagation(); stop(); });
document.querySelector('#dlg .dlgBox').addEventListener('click', () => advance());
