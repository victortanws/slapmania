// All SFX synthesized with WebAudio — no assets.
export class Sfx {
  constructor() {
    this.ctx = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(ctx.destination);

      // 2s white-noise buffer reused by everything
      const len = ctx.sampleRate * 2;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      // looping whoosh, gain follows hand speed
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      this.whooshFilter = ctx.createBiquadFilter();
      this.whooshFilter.type = 'bandpass';
      this.whooshFilter.frequency.value = 300;
      this.whooshFilter.Q.value = 1.2;
      this.whooshGain = ctx.createGain();
      this.whooshGain.gain.value = 0;
      src.connect(this.whooshFilter).connect(this.whooshGain).connect(this.master);
      src.start();

      // soft crowd murmur bed — swells with excitement
      const bed = ctx.createBufferSource();
      bed.buffer = this.noiseBuf;
      bed.loop = true;
      // low-passed rumble reads as a distant crowd; narrow bandpass noise
      // reads as someone whispering in your ear — never do that
      this.bedFilter = ctx.createBiquadFilter();
      this.bedFilter.type = 'lowpass';
      this.bedFilter.frequency.value = 380;
      this.bedFilter.Q.value = 0.7;
      this.bedGain = ctx.createGain();
      this.bedGain.gain.value = 0.01;
      bed.connect(this.bedFilter).connect(this.bedGain).connect(this.master);
      bed.start();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setBed(level) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.bedGain.gain.setTargetAtTime(0.005 + level * 0.04, t, 0.25);
    this.bedFilter.frequency.setTargetAtTime(380 + level * 260, t, 0.3);
  }

  // a scatter of overlapping palm-hits with randomized tone — applause, not crickets
  clap() {
    if (!this.ctx) return;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      setTimeout(() => this.burst({
        dur: 0.02 + Math.random() * 0.035,
        gain: 0.08 + Math.random() * 0.14,
        filter: 'bandpass',
        freq: 900 + Math.random() * 1500,
        q: 1.1,
      }), i * (12 + Math.random() * 28));
    }
  }

  // a loose "yeahhh" from somewhere in the stands — low and wide, not breathy
  cheerlet() {
    this.burst({
      dur: 0.45 + Math.random() * 0.4,
      gain: 0.04 + Math.random() * 0.05,
      filter: 'bandpass',
      freq: 320 + Math.random() * 180,
      q: 0.5,
    });
  }

  whoosh(speed) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const g = Math.min(0.55, Math.max(0, (speed - 2.5) / 16));
    this.whooshGain.gain.setTargetAtTime(g, t, 0.03);
    this.whooshFilter.frequency.setTargetAtTime(150 + speed * 70, t, 0.03);
  }

  burst({ dur = 0.1, gain = 0.5, filter = 'lowpass', freq = 2000, q = 0.8 }) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = filter; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  // bright (0..1, default 0.5) = CHAIN QUALITY: a crisp chain SNAPS (hot, hissy
  // highpass + higher thump), a sloppy one THUDS — the ear learns the difference
  // between technique and luck faster than any meter teaches it
  crack(power, bright = 0.5) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    this.burst({ dur: 0.07 + 0.04 * (1 - bright), gain: (0.55 + 0.75 * bright) * power, filter: 'highpass', freq: 1000 + 1400 * bright });
    this.burst({ dur: 0.16, gain: (0.85 - 0.3 * bright) * power, filter: 'lowpass', freq: 900 });
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140 + 60 * bright, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4 * power, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // per-link grade ping — the instant a chain key is judged, the EAR gets the
  // grade before the eye does. tier 3 = bright two-note sparkle, 2 = mid ping,
  // 1 = dull blip, 4 = FULL CHAIN arpeggio (every link PERFECT)
  grade(tier) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const ping = (freq, at, dur = 0.09, gain = 0.16, type = 'sine') => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(gain, t + at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(g).connect(this.master); o.start(t + at); o.stop(t + at + dur + 0.02);
    };
    if (tier >= 4) { ping(880, 0); ping(1175, 0.07); ping(1568, 0.14, 0.16, 0.2); }
    else if (tier === 3) { ping(880, 0); ping(1320, 0.06, 0.12, 0.18); }
    else if (tier === 2) ping(660, 0, 0.08, 0.12);
    else ping(210, 0, 0.09, 0.1, 'triangle');
  }

  // shot-clock tick: a dry woodblock, pitch climbing as the seconds die
  tick(urgency = 0) {
    if (!this.ctx) return;
    this.burst({ dur: 0.035, gain: 0.22 + urgency * 0.1, filter: 'bandpass', freq: 1500 + urgency * 500, q: 9 });
  }

  gasp() {
    this.burst({ dur: 0.4, gain: 0.14, filter: 'bandpass', freq: 520, q: 0.5 });
  }

  crowd(tier) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 620; f.Q.value = 0.5;
    const g = ctx.createGain();
    const peak = 0.08 + tier * 0.09;
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.6 + tier * 0.5);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random());
    src.stop(t + 2.5 + tier * 0.5);
  }

  // an ethereal choir pad — the SlapMasters of old make themselves known
  choir() {
    if (!this.ctx) return;
    const ctx = this.ctx, t0 = ctx.currentTime;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, t0);
    master.gain.exponentialRampToValueAtTime(0.16, t0 + 0.9);
    master.gain.setValueAtTime(0.16, t0 + 3.2);
    master.gain.exponentialRampToValueAtTime(0.001, t0 + 5.2);
    lp.connect(master).connect(this.master);
    for (const f of [261.6, 329.6, 392.0, 523.25]) {
      for (const det of [-3, 3]) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = f;
        o.detune.value = det;
        const og = ctx.createGain();
        og.gain.value = 0.22;
        o.connect(og).connect(lp);
        o.start(t0);
        o.stop(t0 + 5.4);
      }
    }
  }

  // a triumphant little bugle run for the slapmaster coronation
  fanfare() {
    if (!this.ctx) return;
    const ctx = this.ctx, t0 = ctx.currentTime;
    const notes = [[523.25, 0], [659.25, 0.13], [783.99, 0.26], [1046.5, 0.42]];
    for (const [f, dt] of notes) {
      for (const [type, g] of [['square', 0.06], ['triangle', 0.09]]) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        const gn = ctx.createGain();
        const t = t0 + dt;
        const dur = dt >= 0.42 ? 0.7 : 0.18;
        gn.gain.setValueAtTime(0.001, t);
        gn.gain.exponentialRampToValueAtTime(g, t + 0.02);
        gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(gn).connect(this.master);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    }
  }

  // wood barricade smash: thump + crack + splinters + trailing clacks
  crash() {
    if (!this.ctx) return;
    this.burst({ dur: 0.18, gain: 0.7, filter: 'lowpass', freq: 260 });
    this.burst({ dur: 0.1, gain: 0.5, filter: 'bandpass', freq: 950, q: 0.8 });
    this.burst({ dur: 0.07, gain: 0.4, filter: 'highpass', freq: 2200 });
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.burst({
        dur: 0.03, gain: 0.12 + Math.random() * 0.1,
        filter: 'bandpass', freq: 1200 + Math.random() * 900, q: 2,
      }), 60 + i * (50 + Math.random() * 60));
    }
  }

  // a real moo is "mmm-OOOO-oo": it starts closed-mouth and muffled, the mouth
  // OPENS (filter sweeps up, pitch rises), then it sags and closes at the tail
  moo() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const DUR = 1.45;

    // the mouth: a lowpass that opens wide mid-bellow
    const mouth = ctx.createBiquadFilter();
    mouth.type = 'lowpass'; mouth.Q.value = 1.4;
    mouth.frequency.setValueAtTime(240, t);              // closed "mmm"
    mouth.frequency.exponentialRampToValueAtTime(1250, t + 0.55); // open "OOO"
    mouth.frequency.exponentialRampToValueAtTime(420, t + DUR);   // closing "oo"

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.18); // the hum
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.6);   // the bellow
    g.gain.setValueAtTime(0.2, t + 0.95);
    g.gain.exponentialRampToValueAtTime(0.001, t + DUR);
    mouth.connect(g).connect(this.master);

    // throat formants give it the hollow cow-chest resonance
    for (const [f0, f1, q, gn] of [[380, 620, 5, 0.55], [760, 1050, 6, 0.3]]) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = q;
      bp.frequency.setValueAtTime(f0, t);
      bp.frequency.exponentialRampToValueAtTime(f1, t + 0.55);
      bp.frequency.exponentialRampToValueAtTime(f0 * 0.9, t + DUR);
      const bg = ctx.createGain();
      bg.gain.value = gn;
      bp.connect(bg).connect(g);
      mouth.formants = mouth.formants || [];
      mouth.formants.push(bp);
    }

    // vibrato that widens as she commits to the bellow
    const vib = ctx.createOscillator();
    vib.frequency.value = 4.5;
    const vibG = ctx.createGain();
    vibG.gain.setValueAtTime(2, t);
    vibG.gain.linearRampToValueAtTime(7, t + 0.7);
    vib.connect(vibG);

    // fundamental rises into the open vowel, sags at the tail — plus a
    // sub-octave triangle for the chest
    for (const [type, mult, gn] of [['sawtooth', 1, 1], ['triangle', 0.5, 0.7]]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(82 * mult, t);
      o.frequency.exponentialRampToValueAtTime(126 * mult, t + 0.55);
      o.frequency.setValueAtTime(126 * mult, t + 0.85);
      o.frequency.exponentialRampToValueAtTime(72 * mult, t + DUR);
      vibG.connect(o.frequency);
      const og = ctx.createGain();
      og.gain.value = gn;
      o.connect(og).connect(mouth);
      mouth.formants.forEach((bp) => o.connect(bp));
      o.start(t); o.stop(t + DUR + 0.05);
    }
    vib.start(t); vib.stop(t + DUR + 0.05);
  }

  // an indignant bird: two sharp falling chirps
  squawk() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const st = t + i * 0.11;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(1350 + Math.random() * 350, st);
      o.frequency.exponentialRampToValueAtTime(620, st + 0.09);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.06, st + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.1);
      o.connect(g).connect(this.master);
      o.start(st);
      o.stop(st + 0.12);
    }
  }

  // a ghost's put-upon wail (haunted fair): two detuned sines sliding down
  wail() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    for (const det of [0, 7]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260 + det, t);
      osc.frequency.exponentialRampToValueAtTime(150 + det, t + 0.9);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
      osc.connect(g).connect(this.master);
      osc.start(t);
      osc.stop(t + 1);
    }
  }

  // THE GREAT GONG (dojo): deep inharmonic bell partials + a mallet strike,
  // long decay — rung when a flyer reaches the 62m wall in the dojo world
  gong() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    for (const [ratio, g0, dur] of [[1, 0.5, 4.5], [1.51, 0.16, 3.4], [2.76, 0.22, 2.8], [5.4, 0.1, 1.6]]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 82 * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(g0 * 0.4, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      osc.connect(g).connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    }
    this.burst({ dur: 0.06, gain: 0.3, filter: 'bandpass', freq: 900, q: 1.2 }); // the mallet
  }

  // 'foul' (default): three sharp pips. 'start': one long authoritative blast —
  // the referee's "clock is running" call, distinct from the foul by shape.
  whistle(kind = 'foul') {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    if (kind === 'start') {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1900, t);
      osc.frequency.exponentialRampToValueAtTime(2350, t + 0.05); // the blow "catches"
      const vib = ctx.createOscillator();
      vib.frequency.value = 32;
      const vg = ctx.createGain();
      vg.gain.value = 110;
      vib.connect(vg).connect(osc.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.03);
      g.gain.setValueAtTime(0.15, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
      osc.connect(g).connect(this.master);
      osc.start(t); vib.start(t);
      osc.stop(t + 0.5); vib.stop(t + 0.5);
      return;
    }
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 2350;
      const vib = ctx.createOscillator();
      vib.frequency.value = 35;
      const vg = ctx.createGain();
      vg.gain.value = 120;
      vib.connect(vg).connect(osc.frequency);
      const g = ctx.createGain();
      const t0 = t + i * 0.22;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
      osc.connect(g).connect(this.master);
      osc.start(t0); vib.start(t0);
      osc.stop(t0 + 0.2); vib.stop(t0 + 0.2);
    }
  }
}
