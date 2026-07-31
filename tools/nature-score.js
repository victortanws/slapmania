// ---------------------------------------------------------------------------
// nature-score.js — soundtrack for the "SLAPPING GROUNDS" nature-doc trailer.
//
//     const Sc = await import('/tools/nature-score.js');
//     await Sc.render(cue);   // {dur, shots:[{id,t}], hits:[t,...]}
//
// Four moods keyed off the storyboard's shot marks: a hushed documentary open
// (pads + synthesized dawn birdsong), the montage hoedown, a heartbeat under
// the faceoff, and the full band from contact to the logo. All synthesized in
// an OfflineAudioContext — no asset files, same house rule as audio.js.
// ---------------------------------------------------------------------------
const SINK = 'http://127.0.0.1:8998';
const SR = 44100;

const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
const PENT = [0, 3, 5, 7, 10];

function env(ctx, node, t, a, d, peak = 0.3) {
  const gg = ctx.createGain();
  gg.gain.setValueAtTime(0.0001, t);
  gg.gain.exponentialRampToValueAtTime(peak, t + a);
  gg.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  node.connect(gg);
  return gg;
}
function tone(ctx, dest, t, freq, dur, type = 'triangle', peak = 0.25, detune = 0) {
  const o = ctx.createOscillator();
  o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.setValueAtTime(detune, t);
  const gg = env(ctx, o, t, 0.006, dur, peak);
  gg.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}
function pluck(ctx, dest, t, freq, dur = 0.26, peak = 0.16) {
  tone(ctx, dest, t, freq, dur, 'triangle', peak, -6);
  tone(ctx, dest, t, freq * 2.005, dur * 0.55, 'triangle', peak * 0.4, +7);
}
function kick(ctx, dest, t, peak = 0.75) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(135, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.085);
  const gg = env(ctx, o, t, 0.004, 0.16, peak);
  gg.connect(dest);
  o.start(t); o.stop(t + 0.25);
}
function noiseBuf(ctx, sec) {
  const b = ctx.createBuffer(1, Math.ceil(SR * sec), SR);
  const d = b.getChannelData(0);
  let s = 22222;   // deterministic LCG — re-renders must match sample for sample
  for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff) - 1; }
  return b;
}
function snare(ctx, dest, t, peak = 0.32) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, 0.2);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
  const gg = ctx.createGain();
  gg.gain.setValueAtTime(peak, t); gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  src.connect(hp); hp.connect(gg); gg.connect(dest);
  src.start(t); src.stop(t + 0.2);
}
function crack(ctx, dest, t, power = 1) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, 0.35);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.setValueAtTime(2600 * power, t);
  bp.frequency.exponentialRampToValueAtTime(600, t + 0.16);
  bp.Q.value = 0.8;
  const gg = ctx.createGain();
  gg.gain.setValueAtTime(0.0001, t);
  gg.gain.exponentialRampToValueAtTime(0.95 * power, t + 0.004);
  gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  src.connect(bp); bp.connect(gg); gg.connect(dest);
  src.start(t); src.stop(t + 0.35);
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.13);
  const og = env(ctx, o, t, 0.003, 0.22, 0.6 * power);
  og.connect(dest); o.start(t); o.stop(t + 0.3);
}
function whoosh(ctx, dest, t, dur = 0.42, peak = 0.3) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, dur + 0.1);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.6;
  bp.frequency.setValueAtTime(320, t);
  bp.frequency.exponentialRampToValueAtTime(2400, t + dur);
  const gg = ctx.createGain();
  gg.gain.setValueAtTime(0.0001, t);
  gg.gain.exponentialRampToValueAtTime(peak, t + dur * 0.8);
  gg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
  src.connect(bp); bp.connect(gg); gg.connect(dest);
  src.start(t); src.stop(t + dur + 0.1);
}
function cheer(ctx, dest, t, dur = 2.0, peak = 0.22) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, dur + 0.2); src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.55;
  const gg = ctx.createGain();
  gg.gain.setValueAtTime(0.0001, t);
  gg.gain.linearRampToValueAtTime(peak, t + 0.28);
  gg.gain.linearRampToValueAtTime(peak * 0.6, t + dur * 0.6);
  gg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp); bp.connect(gg); gg.connect(dest);
  src.start(t); src.stop(t + dur + 0.1);
}
function fanfare(ctx, dest, t) {
  const root = 57;
  [[0, 0], [4, 0.13], [7, 0.26], [12, 0.39]].forEach(([iv, off]) => {
    tone(ctx, dest, t + off, N(root + iv), 0.9, 'sawtooth', 0.16);
    tone(ctx, dest, t + off, N(root + iv + 12), 0.7, 'triangle', 0.1);
  });
  kick(ctx, dest, t, 0.9); snare(ctx, dest, t + 0.39, 0.4);
}
// a dawn bird: a quick two-note gliss chirp, deterministic per index
function chirp(ctx, dest, t, i) {
  const f0 = 2100 + (i * 733) % 900;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * 1.35, t + 0.07);
  o.frequency.exponentialRampToValueAtTime(f0 * 1.12, t + 0.14);
  const gg = env(ctx, o, t, 0.01, 0.16, 0.045);
  gg.connect(dest); o.start(t); o.stop(t + 0.2);
}
// documentary pad: a soft slow-attack chord
function pad(ctx, dest, t, root, dur, peak = 0.09) {
  for (const iv of [0, 7, 12, 16]) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(N(root + iv), t);
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(0.0001, t);
    gg.gain.linearRampToValueAtTime(peak, t + dur * 0.35);
    gg.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(gg); gg.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  }
}

const BPM = 132;
const BEAT = 60 / BPM;

export async function render(cue) {
  const at = (id, dflt) => { const s = cue.shots.find((x) => x.id === id); return s ? s.t : dflt; };
  const mainHit = cue.hits.length ? Math.max(...cue.hits.filter((h) => h < at('f03_flight', 1e9))) : 46;
  const secs = [
    { a: 0, b: at('m01_vegas', 28), mode: 'open' },
    { a: at('m01_vegas', 28), b: at('f01_faceoff', 42), mode: 'hoedown' },
    { a: at('f01_faceoff', 42), b: mainHit, mode: 'tension' },
    { a: mainHit, b: cue.dur, mode: 'finale' },
  ];

  const ctx = new OfflineAudioContext(2, Math.ceil(SR * (cue.dur + 1.5)), SR);
  const master = ctx.createGain(); master.gain.value = 0.62;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.18;
  master.connect(comp); comp.connect(ctx.destination);
  const musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
  const sfxBus = ctx.createGain(); sfxBus.gain.value = 1.0; sfxBus.connect(master);

  const CHORDS = { open: [45, 43, 45, 48], hoedown: [45, 52, 50, 45], tension: [42, 42, 43, 41], finale: [45, 50, 52, 45] };
  for (const sec of secs) {
    const chords = CHORDS[sec.mode];
    let bar = 0;
    for (let t = sec.a; t < sec.b; t += BEAT * 4, bar++) {
      const root = chords[bar % 4];
      if (sec.mode === 'open') {
        pad(ctx, musicBus, t, root - 12, BEAT * 4.4);
        if (bar % 2 === 1) pluck(ctx, musicBus, t + BEAT, N(root + 12 + PENT[bar % 5]), 1.2, 0.05);
        for (let c = 0; c < 3; c++) {
          const ct = t + ((bar * 7 + c * 5) % 11) * 0.33;
          if (ct < sec.b) chirp(ctx, musicBus, ct, bar * 3 + c);
        }
      } else if (sec.mode === 'hoedown') {
        tone(ctx, musicBus, t, N(root - 12), 0.42, 'triangle', 0.26);
        tone(ctx, musicBus, t + BEAT * 2, N(root - 12), 0.38, 'triangle', 0.2);
        for (let bt = 0; bt < 4; bt++) {
          if (bt % 2 === 0) kick(ctx, musicBus, t + bt * BEAT, 0.6);
          else snare(ctx, musicBus, t + bt * BEAT, 0.24);
        }
        for (let k = 0; k < 8; k++) {
          const deg = PENT[(bar * 3 + k * 2) % PENT.length];
          const tt = t + k * (BEAT / 2);
          if (tt >= sec.b) break;
          pluck(ctx, musicBus, tt, N(root + deg + 12 + ((k % 4 === 3) ? 12 : 0)), 0.3, 0.13);
        }
      } else if (sec.mode === 'tension') {
        tone(ctx, musicBus, t, N(root - 12), 1.4, 'sine', 0.15);
        pluck(ctx, musicBus, t + BEAT * 2, N(root + PENT[bar % 5]), 1.1, 0.05);
        // the heartbeat: lub-dub at rest, tightening as the swing nears
        const hb = 0.9 - 0.25 * Math.min(1, (t - sec.a) / Math.max(1, sec.b - sec.a));
        for (let h = t; h < Math.min(t + BEAT * 4, sec.b - 0.2); h += hb) {
          kick(ctx, musicBus, h, 0.4); kick(ctx, musicBus, h + 0.26, 0.22);
        }
      } else {
        tone(ctx, musicBus, t, N(root - 12), 0.42, 'triangle', 0.26);
        tone(ctx, musicBus, t + BEAT * 2, N(root - 12), 0.38, 'triangle', 0.2);
        for (let bt = 0; bt < 4; bt++) {
          if (bt % 2 === 0) kick(ctx, musicBus, t + bt * BEAT, 0.6);
          else snare(ctx, musicBus, t + bt * BEAT, 0.28);
        }
        for (let k = 0; k < 8; k++) {
          const deg = PENT[(bar * 3 + k * 2) % PENT.length];
          const tt = t + k * (BEAT / 2);
          if (tt >= sec.b) break;
          pluck(ctx, musicBus, tt, N(root + deg + 12 + ((k % 4 === 3) ? 12 : 0)), 0.3, 0.13);
          if (k % 2 === 0) tone(ctx, musicBus, tt, N(root + deg + 24), 0.2, 'sawtooth', 0.04);
        }
      }
    }
  }

  for (const h of cue.hits) {
    whoosh(ctx, sfxBus, h - 0.34, 0.34, 0.3);
    crack(ctx, sfxBus, h, Math.abs(h - mainHit) < 0.01 ? 1.0 : 0.85);
    cheer(ctx, sfxBus, h + 0.12, Math.abs(h - mainHit) < 0.01 ? 3.4 : 1.6, Math.abs(h - mainHit) < 0.01 ? 0.24 : 0.15);
  }
  cheer(ctx, sfxBus, 0.2, 3.6, 0.1);                       // the fair, far away
  const replayT = at('f05_replay', 0);
  if (replayT) crack(ctx, sfxBus, replayT + 0.9, 0.5);     // the slow-mo thump
  fanfare(ctx, sfxBus, at('f06_end', cue.dur - 7) + 3.6);  // under the logo

  const buf = await ctx.startRendering();
  const wav = encodeWav(buf);
  await fetch(`${SINK}/score.wav`, { method: 'POST', body: wav });
  return { seconds: +buf.duration.toFixed(2), hits: cue.hits.length, bytes: wav.byteLength };
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
