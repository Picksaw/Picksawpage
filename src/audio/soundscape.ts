/**
 * SoundscapeEngine — fully synthesized WebAudio sound design for Picksaw V2.
 *
 *  STORM bus  : layered rain (far hiss / mid wash / near drops) whose level
 *               tracks storm intensity, wind gusts, and thunder bursts that
 *               trigger on real lightning strikes from the storm canvas.
 *  LOFI bus   : a generative lofi-hiphop arrangement — 8-bar form with a
 *               borrowed-chord turnaround, arpeggiated rootless Rhodes
 *               voicings, a call-and-response melody through tape echo,
 *               boom-bap drums (ghost snares, open hats, swung 8ths),
 *               walking bass, vinyl crackle, stereo placement and soft
 *               tape saturation. Composed live in the browser — no audio
 *               files, no licensing, never the same twice.
 *  SFX bus    : tiny UI blips for hovers, toggles and success states.
 *
 * Everything starts silent. Channels are enabled by the user (dock buttons)
 * so we never autoplay audio.
 */

type Channel = "storm" | "lofi";

const STORAGE_KEY = "picksaw:sound";

interface SavedPrefs {
  storm: boolean;
  lofi: boolean;
}

function loadPrefs(): SavedPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { storm: false, lofi: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { storm: false, lofi: false };
}

// ── helpers ────────────────────────────────────────────────────────────────

function makeNoiseBuffer(ctx: AudioContext, seconds: number, kind: "white" | "brown") {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (kind === "white") {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } else {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
  }
  return buffer;
}

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// ── lofi arrangement data ──────────────────────────────────────────────────
// 74 BPM · swung 8ths · 8-bar form:
//   | Cmaj9 | Am9 | Fmaj9 | G13 | Cmaj9 | Am9 | Ebmaj9* | Dm9 |
//   (*borrowed bII — the warm "produced" turnaround) → loops to C.

const BPM = 74;
const BEAT = 60 / BPM;
const SWING = 0.055; // seconds of swing on off-beat 8ths (~15%)
const STEPS_PER_BAR = 8; // eighth notes
const BARS = 8;
const TOTAL_STEPS = STEPS_PER_BAR * BARS;

interface BarChart {
  chord: number[]; // rootless voicing (midi)
  bass: number; // bass root (midi, low)
  bassFifth: number; // for walking moments
}

const CHART: BarChart[] = [
  { chord: [64, 67, 71, 74], bass: 36, bassFifth: 43 }, // Cmaj9  (E G B D)
  { chord: [60, 64, 67, 71], bass: 33, bassFifth: 40 }, // Am9    (C E G B)
  { chord: [65, 69, 72, 76], bass: 41, bassFifth: 48 }, // Fmaj9  (F A C E)
  { chord: [59, 62, 64, 69], bass: 43, bassFifth: 50 }, // G13    (B D E A)
  { chord: [64, 67, 71, 74], bass: 36, bassFifth: 43 }, // Cmaj9
  { chord: [60, 64, 67, 71], bass: 33, bassFifth: 40 }, // Am9
  { chord: [63, 67, 70, 74], bass: 39, bassFifth: 46 }, // Ebmaj9 (borrowed)
  { chord: [62, 65, 69, 72], bass: 38, bassFifth: 45 }, // Dm9    (turnaround)
];

// Melody pool — C major pentatonic + colour tones, two octaves.
const MELODY_SCALE = [72, 74, 76, 79, 81, 84, 86, 88, 91];

// ── engine ─────────────────────────────────────────────────────────────────

export class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private stormBus: GainNode | null = null;
  private lofiBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;

  // rain layers
  private rainFar: { gain: GainNode; filter: BiquadFilterNode } | null = null;
  private rainMid: { gain: GainNode; filter: BiquadFilterNode } | null = null;
  private rainNear: { gain: GainNode; filter: BiquadFilterNode } | null = null;
  private windLfoGain: GainNode | null = null;

  private noiseBuffers: { white: AudioBuffer; brown: AudioBuffer } | null = null;
  private sources: AudioBufferSourceNode[] = [];

  // lofi scheduler
  private schedulerId: number | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private lofiRunning = false;
  private melodyEcho: GainNode | null = null; // send for the lead voice
  private melodyWalk = 4; // random-walk index into MELODY_SCALE

  private stormLevel = 0; // 0..1 target used by rain mixer
  private prefs: SavedPrefs = loadPrefs();

  get enabled() {
    return { storm: this.prefs.storm, lofi: this.prefs.lofi };
  }

  // ── lifecycle ────────────────────────────────────────────────────────────

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctor();
      this.ctx = ctx;

      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(ctx.destination);

      // STORM chain — highshelf tames top-end hiss so rain stays soft
      this.stormBus = ctx.createGain();
      this.stormBus.gain.value = 0;
      const stormHiss = ctx.createBiquadFilter();
      stormHiss.type = "highshelf";
      stormHiss.frequency.value = 3400;
      stormHiss.gain.value = -4;
      const stormWarmth = ctx.createBiquadFilter();
      stormWarmth.type = "highpass";
      stormWarmth.frequency.value = 60;
      this.stormBus.connect(stormHiss).connect(stormWarmth).connect(this.master);

      // LOFI chain — warmth filters + gentle tape saturation
      this.lofiBus = ctx.createGain();
      this.lofiBus.gain.value = 0;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 5200;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 45;
      const sat = ctx.createWaveShaper();
      sat.curve = makeSaturationCurve(1.6);
      sat.oversample = "2x";
      this.lofiBus.connect(lp).connect(hp).connect(sat).connect(this.master);

      // tape echo for the melody — dotted 8th, dark repeats
      const delay = ctx.createDelay(1.5);
      delay.delayTime.value = BEAT * 0.75; // dotted 8th
      const feedback = ctx.createGain();
      feedback.gain.value = 0.34;
      const echoTone = ctx.createBiquadFilter();
      echoTone.type = "lowpass";
      echoTone.frequency.value = 2200;
      this.melodyEcho = ctx.createGain();
      this.melodyEcho.gain.value = 0.55;
      this.melodyEcho.connect(delay);
      delay.connect(echoTone).connect(feedback).connect(delay); // loop
      delay.connect(this.lofiBus);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.5;
      this.sfxBus.connect(this.master);

      this.noiseBuffers = {
        white: makeNoiseBuffer(ctx, 4, "white"),
        brown: makeNoiseBuffer(ctx, 5, "brown"),
      };

      this.buildRain();
      return ctx;
    } catch {
      return null;
    }
  }

  private loopNoise(buffer: AudioBuffer): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.start(ctx.currentTime + Math.random() * 0.1);
    this.sources.push(src);
    return src;
  }

  // ── rain / storm ambience ────────────────────────────────────────────────

  private buildRain() {
    const ctx = this.ctx!;
    const { white } = this.noiseBuffers!;

    const layer = (freq: number, q: number, type: BiquadFilterType) => {
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const src = this.loopNoise(white);
      src.connect(filter).connect(gain).connect(this.stormBus!);
      return { gain, filter };
    };

    // Layer 1 — distant rain: BROWN noise (deep, soft rumble-wash —
    // white noise here is what read as TV static)
    const farSrc = this.loopNoise(this.noiseBuffers!.brown);
    const farFilter = ctx.createBiquadFilter();
    farFilter.type = "lowpass";
    farFilter.frequency.value = 900;
    farFilter.Q.value = 0.3;
    const farGain = ctx.createGain();
    farGain.gain.value = 0;
    farSrc.connect(farFilter).connect(farGain).connect(this.stormBus!);
    this.rainFar = { gain: farGain, filter: farFilter };
    // Layer 2 — the body of the rain (white, softened)
    this.rainMid = layer(850, 0.3, "lowpass");
    // Layer 3 — near heavy drops: darker, fatter
    this.rainNear = layer(300, 0.4, "lowpass");

    // ── organic life: constant-level noise reads as "static", real rain
    // swells and recedes. Slow LFOs at incommensurate rates on each layer.
    const swell = (rate: number, depth: number, target: AudioParam) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = rate;
      const g = ctx.createGain();
      g.gain.value = depth;
      osc.connect(g).connect(target);
      osc.start();
      this.sources.push(osc as unknown as AudioBufferSourceNode);
    };
    swell(0.11, 0.014, this.rainFar.gain.gain); // distant breathing
    swell(0.073, 0.024, this.rainMid.gain.gain); // main swell
    swell(0.053, 0.011, this.rainNear.gain.gain);
    // droplet patter — light fast modulation on the near layer
    swell(3.3, 0.009, this.rainNear.gain.gain);
    swell(5.1, 0.006, this.rainNear.gain.gain);

    // wind gusts — slow LFO opening the mid filter (gentle)
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    this.windLfoGain = ctx.createGain();
    this.windLfoGain.gain.value = 0;
    lfo.connect(this.windLfoGain).connect(this.rainMid.filter.frequency);
    lfo.start();
    this.sources.push(lfo as unknown as AudioBufferSourceNode);
  }

  /** Called whenever the scroll-driven storm level changes. */
  setStormLevel(level: number) {
    this.stormLevel = Math.max(0, Math.min(1, level));
    if (!this.ctx || !this.prefs.storm) return;
    const t = this.ctx.currentTime;
    const s = this.stormLevel;
    // Background rain — genuinely LOW: felt more than heard at calm,
    // a soft presence at full storm.
    const ramp = (g: GainNode, v: number) =>
      g.gain.setTargetAtTime(v, t, 0.9);
    ramp(this.rainFar!.gain, 0.032 + s * 0.03);
    ramp(this.rainMid!.gain, 0.07 + s * 0.07);
    ramp(this.rainNear!.gain, 0.042 + s * 0.05);
    this.rainMid!.filter.frequency.setTargetAtTime(750 + s * 800, t, 1.0);
    this.rainNear!.filter.frequency.setTargetAtTime(230 + s * 240, t, 1.0);
    this.windLfoGain!.gain.setTargetAtTime(70 + s * 220, t, 1.0);
  }

  /** Thunder burst synced to a lightning strike. intensity 0..1+ */
  thunder(intensity: number) {
    if (!this.ctx || !this.prefs.storm || !this.noiseBuffers) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.03 + Math.random() * 0.12; // sound lags flash slightly
    const i = Math.max(0.3, Math.min(1.2, intensity));
    const out = this.stormBus!;

    // crack — sharp high transient for close strikes
    if (i > 0.55) {
      const crack = ctx.createBufferSource();
      crack.buffer = this.noiseBuffers.white;
      const cf = ctx.createBiquadFilter();
      cf.type = "highpass";
      cf.frequency.value = 1400;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.0001, t0);
      cg.gain.exponentialRampToValueAtTime(0.2 * i, t0 + 0.012);
      cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      crack.connect(cf).connect(cg).connect(out);
      crack.start(t0, Math.random() * 2, 0.4);
      crack.stop(t0 + 0.5);
    }

    // rumble — brown noise, falling lowpass, long exponential tail
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.noiseBuffers.brown;
    rumble.playbackRate.value = 0.32 + Math.random() * 0.26;
    const rf = ctx.createBiquadFilter();
    rf.type = "lowpass";
    rf.frequency.setValueAtTime(180 * i, t0);
    rf.frequency.exponentialRampToValueAtTime(55, t0 + 2.6);
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0.0001, t0);
    rg.gain.exponentialRampToValueAtTime(0.4 * i, t0 + 0.09 + Math.random() * 0.12);
    rg.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.4 + Math.random() * 1.6);
    rumble.connect(rf).connect(rg).connect(out);
    rumble.start(t0, Math.random() * 2);
    rumble.stop(t0 + 4.5);

    // sub thump you feel in your chest
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(52, t0);
    sub.frequency.exponentialRampToValueAtTime(30, t0 + 1.1);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t0);
    sg.gain.exponentialRampToValueAtTime(0.22 * i, t0 + 0.06);
    sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
    sub.connect(sg).connect(out);
    sub.start(t0);
    sub.stop(t0 + 1.6);
  }

  // ── generative lofi — the arrangement ────────────────────────────────────

  private startLofi() {
    if (this.lofiRunning) return;
    this.lofiRunning = true;
    this.step = 0;
    this.nextNoteTime = this.ctx!.currentTime + 0.08;
    const tick = () => {
      if (!this.lofiRunning) return;
      const ctx = this.ctx!;
      while (this.nextNoteTime < ctx.currentTime + 0.65) {
        const swing = this.step % 2 === 1 ? SWING : 0;
        this.scheduleStep(this.step, this.nextNoteTime + swing);
        this.nextNoteTime += BEAT / 2 + (this.step % 2 === 0 ? SWING : -SWING);
        this.step = (this.step + 1) % TOTAL_STEPS;
      }
      this.schedulerId = window.setTimeout(tick, 180);
    };
    tick();
  }

  private stopLofi() {
    this.lofiRunning = false;
    if (this.schedulerId !== null) {
      clearTimeout(this.schedulerId);
      this.schedulerId = null;
    }
  }

  private scheduleStep(step: number, time: number) {
    const bar = Math.floor(step / STEPS_PER_BAR) % BARS;
    const inBar = step % STEPS_PER_BAR; // 0..7 (eighth notes)
    const chart = CHART[bar];
    const isBeat1 = inBar === 0;
    const isBeat2 = inBar === 2;
    const isBeat3 = inBar === 4;
    const isBeat4 = inBar === 6;
    const isOff = inBar % 2 === 1;
    const bBar = bar % 2 === 1; // alternate drum pattern per bar

    // ── drums (boom-bap, humanized) ─────────────────────────
    if (isBeat1 || (inBar === 5 && Math.random() < 0.85) || (bBar && inBar === 3 && Math.random() < 0.3)) {
      this.kick(time, 0.78 + Math.random() * 0.18);
    }
    if (isBeat2 || isBeat4) {
      this.snare(time, 0.5 + Math.random() * 0.18, false);
    }
    // ghost snare
    if ((inBar === 1 || inBar === 7) && Math.random() < 0.16) {
      this.snare(time, 0.16 + Math.random() * 0.08, true);
    }
    // hats — swung 8ths, accented on beats, open hat end of every 2nd bar
    const openHat = inBar === 7 && bar % 2 === 1;
    this.hat(time, isOff ? 0.14 + Math.random() * 0.08 : 0.24 + Math.random() * 0.12, openHat);

    // ── bass — walking roots with approach notes ────────────
    if (isBeat1) this.bassNote(midiToFreq(chart.bass), time, BEAT * 1.1, 0.16);
    if (isBeat3) {
      const fifth = Math.random() < 0.45;
      this.bassNote(midiToFreq(fifth ? chart.bassFifth : chart.bass), time, BEAT * 0.8, 0.12);
    }
    // approach note into the next bar's root
    if (inBar === 7 && Math.random() < 0.4) {
      const next = CHART[(bar + 1) % BARS].bass;
      const approach = Math.random() < 0.5 ? next + 1 : next - 1;
      this.bassNote(midiToFreq(approach), time, BEAT * 0.45, 0.09);
    }

    // ── Rhodes — arpeggiated rootless voicing on the downbeat,
    //    soft re-hit mid-bar ──────────────────────────────────
    if (isBeat1) {
      this.rhodes(chart.chord, time, 0.95);
    }
    if (inBar === 4 && Math.random() < 0.35) {
      this.rhodes(chart.chord.slice(1), time, 0.3);
    }

    // ── melody — call & response over the 8-bar form ────────
    // Calls on even-bar downbeats, answers sprinkled on off-beats.
    if (isBeat1 && bar % 2 === 0 && Math.random() < 0.85) {
      const notes = 3 + Math.floor(Math.random() * 3);
      let t = time;
      for (let n = 0; n < notes; n++) {
        // random walk over the scale, occasionally leaping
        const move = Math.random() < 0.22 ? (Math.random() < 0.5 ? -3 : 3) : Math.random() < 0.5 ? -1 : 1;
        this.melodyWalk = Math.max(0, Math.min(MELODY_SCALE.length - 1, this.melodyWalk + move));
        this.lead(midiToFreq(MELODY_SCALE[this.melodyWalk]), t, 0.55 + Math.random() * 0.4);
        t += (BEAT / 2) * (Math.random() < 0.3 ? 2 : 1);
      }
    } else if (isOff && bar % 2 === 1 && Math.random() < 0.14) {
      this.melodyWalk = Math.max(0, Math.min(MELODY_SCALE.length - 1, this.melodyWalk + (Math.random() < 0.5 ? -2 : 2)));
      this.lead(midiToFreq(MELODY_SCALE[this.melodyWalk]), time, 0.4);
    }

    // ── vinyl crackle ────────────────────────────────────────
    if (Math.random() < 0.5) this.crackle(time);
  }

  /** Warm Rhodes-ish voice: staggered notes = a hand, not a chord block. */
  private rhodes(notes: number[], time: number, vel: number) {
    const ctx = this.ctx!;
    notes.forEach((midi, i) => {
      const t = time + i * 0.035; // arpeggiated by ~35ms
      const freq = midiToFreq(midi);
      const g = ctx.createGain();
      const humanize = 0.85 + Math.random() * 0.3;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.075 * vel * humanize, t + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1750;

      const o1 = ctx.createOscillator();
      o1.type = "sine";
      o1.frequency.value = freq;
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = freq * 1.005;
      o2.detune.value = 4;
      const o2g = ctx.createGain();
      o2g.gain.value = 0.4;
      o1.connect(filter);
      o2.connect(o2g).connect(filter);
      filter.connect(g);

      // place the Rhodes slightly left
      this.connectPanned(g, -0.18);

      o1.start(t);
      o2.start(t);
      o1.stop(t + 1.8);
      o2.stop(t + 1.8);
    });
  }

  /** Lead voice with vibrato character + tape-echo send. */
  private lead(freq: number, time: number, vel: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.06 * vel, time + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.9);

    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    // gentle vibrato
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const vibGain = ctx.createGain();
    vibGain.gain.value = freq * 0.004;
    vib.connect(vibGain).connect(o.frequency);

    o.connect(g);
    this.connectPanned(g, 0.22); // melody sits right
    g.connect(this.melodyEcho!); // …and feeds the tape echo

    o.start(time);
    vib.start(time);
    o.stop(time + 1.1);
    vib.stop(time + 1.1);
  }

  /** Connect through a StereoPanner when available (Safari-safe). */
  private connectPanned(node: AudioNode, pan: number) {
    const ctx = this.ctx!;
    if (typeof ctx.createStereoPanner === "function") {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node.connect(p).connect(this.lofiBus!);
    } else {
      node.connect(this.lofiBus!);
    }
  }

  private bassNote(freq: number, time: number, dur: number, vel: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = freq * 2; // soft harmonic so it reads on phones
    const o2g = ctx.createGain();
    o2g.gain.value = 0.18;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vel, time + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g);
    o2.connect(o2g).connect(g);
    g.connect(this.lofiBus!);
    o.start(time);
    o2.start(time);
    o.stop(time + dur + 0.1);
    o2.stop(time + dur + 0.1);
  }

  private kick(time: number, vel: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(120, time);
    o.frequency.exponentialRampToValueAtTime(42, time + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.3 * vel, time + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    o.connect(g).connect(this.lofiBus!);
    o.start(time);
    o.stop(time + 0.3);
  }

  private snare(time: number, vel: number, ghost: boolean) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffers!.white;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = ghost ? 2600 : 1900;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.085 * vel, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, time + (ghost ? 0.07 : 0.16));
    src.connect(f).connect(g);
    this.connectPanned(g, 0.06);
    src.start(time, Math.random() * 2);
    src.stop(time + 0.25);
  }

  private hat(time: number, vel: number, open: boolean) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffers!.white;
    src.playbackRate.value = 1.6;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 8200;
    const g = ctx.createGain();
    const v = 0.032 * vel;
    const dur = open ? 0.22 : 0.05;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(v, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(f).connect(g);
    this.connectPanned(g, 0.18);
    src.start(time, Math.random() * 3);
    src.stop(time + dur + 0.05);
  }

  private crackle(time: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffers!.white;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 4800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.018 + Math.random() * 0.018, time + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.012);
    src.connect(f).connect(g).connect(this.lofiBus!);
    src.start(time, Math.random() * 3);
    src.stop(time + 0.03);
  }

  // ── UI sfx ───────────────────────────────────────────────────────────────

  blip(kind: "hover" | "click" | "toggle" | "success" = "hover") {
    if (!this.ctx) return;
    if (!this.prefs.storm && !this.prefs.lofi) return; // respect "all quiet" state
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const table: Record<typeof kind, { f0: number; f1: number; dur: number; v: number }> = {
      hover: { f0: 880, f1: 1320, dur: 0.05, v: 0.05 },
      click: { f0: 660, f1: 220, dur: 0.09, v: 0.1 },
      toggle: { f0: 520, f1: 1040, dur: 0.12, v: 0.09 },
      success: { f0: 660, f1: 1760, dur: 0.3, v: 0.11 },
    };
    const { f0, f1, dur, v } = table[kind];
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfxBus!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // ── channel toggles ──────────────────────────────────────────────────────

  async toggle(channel: Channel): Promise<boolean> {
    const ctx = this.ensureCtx();
    if (!ctx) return false;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    this.prefs[channel] = !this.prefs[channel];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
    } catch {
      /* ignore */
    }
    this.applyChannels();
    // Immediate feedback so enabling never feels like a dead button
    if (channel === "storm" && this.prefs.storm) {
      window.setTimeout(() => this.thunder(0.45), 350);
    }
    return this.prefs[channel];
  }

  private applyChannels() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;

    // STORM
    this.stormBus!.gain.setTargetAtTime(this.prefs.storm ? 0.85 : 0, t, 0.5);
    if (this.prefs.storm) {
      this.setStormLevel(this.stormLevel);
    } else {
      for (const l of [this.rainFar, this.rainMid, this.rainNear]) {
        l!.gain.gain.setTargetAtTime(0, t, 0.4);
      }
      this.windLfoGain!.gain.setTargetAtTime(0, t, 0.4);
    }

    // LOFI
    this.lofiBus!.gain.setTargetAtTime(this.prefs.lofi ? 0.9 : 0, t, 0.5);
    if (this.prefs.lofi) {
      this.startLofi();
    } else {
      // stop scheduling; scheduled notes ring out naturally
      window.setTimeout(() => {
        if (!this.prefs.lofi) this.stopLofi();
      }, 900);
    }
  }
}

/** Soft tanh saturation curve for the music bus. */
function makeSaturationCurve(k: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

export const soundscape = new SoundscapeEngine();
