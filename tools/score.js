// ---------------------------------------------------------------------------
// score.js — offline soundtrack renderer for SlapMania trailers.
//
// Renders the whole music + SFX bed into an OfflineAudioContext and POSTs it to
// the frame sink as a 16-bit WAV. Dialogue is mixed in afterwards by ffmpeg, so
// this file owns only the band and the bangs.
//
//     const Sc = await import('/tools/score.js');
//     await Sc.render(cueSheet);     // {dur, shots:[{id,t}], hits:[t,...]}
//
// Everything is synthesized — same house rule as the game's own audio.js: no
// asset files anywhere in this project.
// ---------------------------------------------------------------------------
const SINK = 'http://127.0.0.1:8998';
const SR = 44100;

// --- note helpers -----------------------------------------------------------
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);           // midi → Hz
const PENT = [0, 3, 5, 7, 10];                                // minor pentatonic

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

// plucked string-ish: two detuned triangles with a fast decay
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
  // deterministic LCG — a re-render must match the last one sample for sample
  let s = 22222;
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

// THE SLAP: a wide noise crack over a pitched thump. Power scales brightness.
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

// the arm coming round: filtered noise swelling then cut
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

// a crowd is just a lot of filtered noise that breathes
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
  const root = 57; // A
  [[0, 0], [4, 0.13], [7, 0.26], [12, 0.39]].forEach(([iv, off]) => {
    tone(ctx, dest, t + off, N(root + iv), 0.9, 'sawtooth', 0.16);
    tone(ctx, dest, t + off, N(root + iv + 12), 0.7, 'triangle', 0.1);
  });
  kick(ctx, dest, t, 0.9); snare(ctx, dest, t + 0.39, 0.4);
}

// ---------------------------------------------------------------------------
// arrangement: which band is playing over which act
// ---------------------------------------------------------------------------
const BPM = 132;
const BEAT = 60 / BPM;

// [startSec, endSec, mode] — mode picks the instrumentation
function sections(cue) {
  const at = (id) => (cue.shots.find((s) => s.id === id) || { t: 0 }).t;
  return [
    { a: 0, b: at('s04_hank'), mode: 'open' },     // the fair wakes up
    { a: at('s04_hank'), b: at('s08_valley'), mode: 'rounds' },  // full hoedown
    { a: at('s08_valley'), b: at('s13_cat'), mode: 'valley' },   // synthetic, glossy
    { a: at('s13_cat'), b: at('s16_celebrate'), mode: 'couch' }, // sparse and uneasy
    { a: at('s16_celebrate'), b: cue.dur, mode: 'finale' },      // everything at once
  ];
}

function band(ctx, dest, cue) {
  const secs = sections(cue);
  const CHORDS = { open: [45, 45, 50, 52], rounds: [45, 52, 50, 45], valley: [44, 51, 49, 44], couch: [42, 42, 43, 41], finale: [45, 50, 52, 45] };
  for (const sec of secs) {
    const chords = CHORDS[sec.mode];
    let bar = 0;
    for (let t = sec.a; t < sec.b; t += BEAT * 4, bar++) {
      const root = chords[bar % 4];
      const quiet = sec.mode === 'couch';
      // bass on 1 and 3
      tone(ctx, dest, t, N(root - 12), 0.42, quiet ? 'sine' : 'triangle', quiet ? 0.16 : 0.26);
      if (!quiet) tone(ctx, dest, t + BEAT * 2, N(root - 12), 0.38, 'triangle', 0.2);
      // drums
      if (sec.mode === 'rounds' || sec.mode === 'finale') {
        for (let bt = 0; bt < 4; bt++) {
          if (bt % 2 === 0) kick(ctx, dest, t + bt * BEAT, 0.6);
          else snare(ctx, dest, t + bt * BEAT, 0.24);
        }
      } else if (sec.mode === 'valley') {
        for (let bt = 0; bt < 4; bt++) kick(ctx, dest, t + bt * BEAT, 0.34);
      }
      // melody: pentatonic 8ths, banjo in the country acts, saw in the valley
      const type = sec.mode === 'valley' ? 'sawtooth' : 'triangle';
      const steps = quiet ? 2 : 8;
      for (let k = 0; k < steps; k++) {
        const deg = PENT[(bar * 3 + k * 2) % PENT.length];
        const oct = (k % 4 === 3) ? 12 : 0;
        const tt = t + k * (BEAT * 4 / steps);
        if (tt >= sec.b) break;
        if (sec.mode === 'valley') tone(ctx, dest, tt, N(root + deg + 12 + oct), 0.3, type, 0.075);
        else pluck(ctx, dest, tt, N(root + deg + 12 + oct), quiet ? 1.1 : 0.3, quiet ? 0.05 : 0.13);
      }
      // the couch gets a clock instead of a kit
      if (quiet) { snare(ctx, dest, t, 0.06); snare(ctx, dest, t + BEAT * 2, 0.05); }
    }
  }
}

// ---------------------------------------------------------------------------
export async function render(cue) {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * (cue.dur + 1.5)), SR);
  const master = ctx.createGain();
  master.gain.value = 0.62;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.18;
  master.connect(comp); comp.connect(ctx.destination);

  const musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
  const sfxBus = ctx.createGain(); sfxBus.gain.value = 1.0; sfxBus.connect(master);

  band(ctx, musicBus, cue);

  for (const h of cue.hits) {
    whoosh(ctx, sfxBus, h - 0.34, 0.34, 0.3);
    crack(ctx, sfxBus, h, h > cue.dur - 8 ? 1.0 : 0.85);
    cheer(ctx, sfxBus, h + 0.12, 1.9, 0.18);
  }
  cheer(ctx, sfxBus, 0.2, 4.2, 0.2);                    // the fair, already roaring
  cheer(ctx, sfxBus, (cue.shots.find((s) => s.id === 's16_celebrate') || { t: 77 }).t, 4.0, 0.26);
  fanfare(ctx, sfxBus, (cue.shots.find((s) => s.id === 's19_logo') || { t: 87 }).t + 0.15);

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
