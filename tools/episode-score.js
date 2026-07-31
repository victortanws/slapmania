// ---------------------------------------------------------------------------
// episode-score.js — a gentle music-box bed for episodes (tools/episode.js).
//
//     const Sc = await import('/tools/episode-score.js'); await Sc.render(cue);
//
// No drums, no cracks: soft sine pads on a I–vi–IV–V wander, a sparse
// music-box melody, dawn birdsong. Synthesized in an OfflineAudioContext —
// zero asset files, as always.
// ---------------------------------------------------------------------------
const SINK = 'http://127.0.0.1:8998';
const SR = 44100;
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
const PENT = [0, 2, 4, 7, 9];                       // major pentatonic — cozy

function box(ctx, dest, t, freq, peak = 0.09) {     // music-box ping
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
  const h = ctx.createOscillator(); h.type = 'sine'; h.frequency.setValueAtTime(freq * 3.01, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  o.connect(g); const hg = ctx.createGain(); hg.gain.value = 0.18; h.connect(hg); hg.connect(g);
  g.connect(dest); o.start(t); o.stop(t + 1.5); h.start(t); h.stop(t + 1.5);
}
function pad(ctx, dest, t, root, dur, peak = 0.075) {
  for (const iv of [0, 7, 12, 16]) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(N(root + iv), t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + dur * 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
}
function chirp(ctx, dest, t, i) {
  const f0 = 2100 + (i * 733) % 900;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * 1.35, t + 0.07);
  o.frequency.exponentialRampToValueAtTime(f0 * 1.12, t + 0.14);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.04, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.2);
}

export async function render(cue) {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * (cue.dur + 1.5)), SR);
  const master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
  const BAR = 3.2;
  const PROG = [57, 54, 50, 52];                    // A–f#m–D–E, low register
  let bar = 0;
  for (let t = 0.2; t < cue.dur; t += BAR, bar++) {
    const root = PROG[bar % 4];
    pad(ctx, master, t, root - 12, BAR * 1.25);
    for (let k = 0; k < 4; k++) {                   // sparse deterministic ping pattern
      if ((bar * 7 + k * 3) % 5 < 2) continue;
      box(ctx, master, t + k * (BAR / 4) + ((bar + k) % 3) * 0.11,
        N(root + 12 + PENT[(bar * 2 + k * 3) % 5] + (k === 3 ? 12 : 0)));
    }
    for (let c = 0; c < 2; c++) {
      const ct = t + ((bar * 5 + c * 7) % 9) * 0.31;
      if (ct < cue.dur) chirp(ctx, master, ct, bar * 2 + c);
    }
  }
  box(ctx, master, Math.max(0, cue.dur - 2.2), N(69), 0.12);   // closing high ping

  const buf = await ctx.startRendering();
  const wav = encodeWav(buf);
  await fetch(`${SINK}/score.wav`, { method: 'POST', body: wav });
  return { seconds: +buf.duration.toFixed(2), bytes: wav.byteLength };
}

function encodeWav(buf) {
  const n = buf.length, ch = 2;
  const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  wr(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); wr(8, 'WAVE');
  wr(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
  out.setUint16(22, ch, true); out.setUint32(24, SR, true);
  out.setUint32(28, SR * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  wr(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (const src of [L, R]) {
      const v = Math.max(-1, Math.min(1, src[i]));
      out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2;
    }
  }
  return out.buffer;
}
