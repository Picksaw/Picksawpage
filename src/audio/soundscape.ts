/**
 * SoundscapeEngine — fully synthesized WebAudio sound design for Picksaw V2.
 *
 *  STORM bus  : layered rain (far hiss / mid wash / near drops) whose level
 *               tracks storm intensity, wind gusts, and thunder bursts that
 *               trigger on real lightning strikes from the storm canvas.
 *  LOFI bus   : a generative lofi-hiphop loop — swung drums, warm e-piano
 *               chords, sub bass, vinyl crackle. Composed live in the
 *               browser, so there are no audio files and no licensing.
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

// ── lofi composition data ──────────────────────────────────────────────────
// 74 BPM, swung 8ths. Dm9 → G13 → Cmaj9 → Am9 — a warm ii-V-I-vi loop.

const BPM = 74;
const BEAT = 60 / BPM;
const SWING = 0.016;

// Chord voicings as semitone offsets from C4-ish region (midi numbers).
const PROGRESSION: { chord: number[]; bass: number }[] = [
  { chord: [62, 65, 69, 72, 76], bass: 38 }, // Dm9  (D F A C E)
  { chord: [55, 59, 64, 67, 74], bass: 31 }, // G13  (G B E G D)
  { chord: [60, 64, 67, 71, 76], bass: 36 }, // Cmaj9 (C E G B E)
  { chord: [57, 60, 64, 67, 72], bass: 33 }, // Am9  (A C E G C)
];

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

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
  private step = 0; // 8th-note steps, 8 per bar → 4 bars loop = 32 steps
  private lofiRunning = false;

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

      this.stormBus = ctx.createGain();
      this.stormBus.gain.value = 0;
      const stormWarmth = ctx.createBiquadFilter();
      stormWarmth.type = "highpass";
      stormWarmth.frequency.value = 60;
      this.stormBus.connect(stormWarmth).connect(this.master);

      this.lofiBus = ctx.createGain();
      this.lofiBus.gain.value = 0;
      // gentle warmth on the music bus
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 5200;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 45;
      this.lofiBus.connect(lp).connect(hp).connect(this.master);

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

    // Layer 1 — distant fine rain: airy hiss
    this.rainFar = layer(2600, 0.4, "bandpass");
    // Layer 2 — mid wash
    this.rainMid = layer(900, 0.35, "lowpass");
    // Layer 3 — near heavy drops: darker, fatter
    this.rainNear = layer(300, 0.4, "lowpass");

    // wind gusts — slow LFO opening the mid layer
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
    // Base mix is clearly audible even at the top of the page (calm rain),
    // and deepens as the storm grows with scroll.
    const ramp = (g: GainNode, v: number) =>
      g.gain.setTargetAtTime(v, t, 0.6);
    ramp(this.rainFar!.gain, 0.16 + s * 0.12);
    ramp(this.rainMid!.gain, 0.26 + s * 0.24);
    ramp(this.rainNear!.gain, 0.13 + s * 0.18);
    this.rainMid!.filter.frequency.setTargetAtTime(800 + s * 900, t, 0.8);
    this.rainNear!.filter.frequency.setTargetAtTime(240 + s * 280, t, 0.8);
    this.windLfoGain!.gain.setTargetAtTime(140 + s * 460, t, 0.8);
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
      cg.gain.exponentialRampToValueAtTime(0.28 * i, t0 + 0.012);
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
    rg.gain.exponentialRampToValueAtTime(0.5 * i, t0 + 0.09 + Math.random() * 0.12);
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
    sg.gain.exponentialRampToValueAtTime(0.3 * i, t0 + 0.06);
    sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
    sub.connect(sg).connect(out);
    sub.start(t0);
    sub.stop(t0 + 1.6);
  }

  // ── generative lofi ──────────────────────────────────────────────────────

  private startLofi() {
    if (this.lofiRunning) return;
    this.lofiRunning = true;
    this.step = 0;
    this.nextNoteTime = this.ctx!.currentTime + 0.08;
    const tick = () => {
      if (!this.lofiRunning) return;
      const ctx = this.ctx!;
      while (this.nextNoteTime < ctx.currentTime + 0.65) {
        this.scheduleStep(this.step, this.nextNoteTime);
        const swing = this.step % 2 === 1 ? SWING : 0;
        this.nextNoteTime += BEAT / 2 + (this.step % 2 === 0 ? swing : -swing);
        this.step = (this.step + 1) % 32;
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
    const bar = Math.floor(step / 8);
    const isOffbeat = step % 2 === 1;
    const { chord, bass } = PROGRESSION[bar];

    // drums
    if (step % 8 === 0 || (step % 8 === 6 && Math.random() < 0.22)) this.kick(time, 0.8 + Math.random() * 0.15);
    if (step % 8 === 4) this.snare(time, 0.5 + Math.random() * 0.2);
    this.hat(time, step % 8 === 2 ? 0.4 : 0.16 + Math.random() * 0.12, isOffbeat);

    // bass on 1 and 3
    if (step % 8 === 0) this.bassNote(midiToFreq(bass), time, BEAT * 0.9);
    if (step % 8 === 4 && Math.random() < 0.6)
      this.bassNote(midiToFreq(bass + (Math.random() < 0.5 ? 7 : 5)), time, BEAT * 0.6);

    // e-piano chord on the downbeat + occasional soft re-hit
    if (step % 8 === 0) this.epiano(chord, time, 0.9);
    if ((step % 8 === 3 || step % 8 === 5) && Math.random() < 0.3)
      this.epiano(chord.slice(1), time, 0.32);

    // sparse melody — pentatonic fragments over the chord
    if (Math.random() < 0.12) {
      const note = chord[Math.floor(Math.random() * chord.length)] + 12;
      this.epiano([note], time + SWING, 0.3);
    }

    // vinyl crackle
    if (Math.random() < 0.5) this.crackle(time);
  }

  private epiano(notes: number[], time: number, vel: number) {
    const ctx = this.ctx!;
    for (const midi of notes) {
      const freq = midiToFreq(midi);
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1750;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.085 * vel, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 1.5);
      // two slightly detuned voices = warm electric-piano shimmer
      const o1 = ctx.createOscillator();
      o1.type = "sine";
      o1.frequency.value = freq;
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = freq * 1.004;
      o2.detune.value = 4;
      const o2g = ctx.createGain();
      o2g.gain.value = 0.35;
      o1.connect(filter);
      o2.connect(o2g).connect(filter);
      filter.connect(g).connect(this.lofiBus!);
      o1.start(time);
      o2.start(time);
      o1.stop(time + 1.7);
      o2.stop(time + 1.7);
    }
  }

  private bassNote(freq: number, time: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.16, time + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g).connect(this.lofiBus!);
    o.start(time);
    o.stop(time + dur + 0.1);
  }

  private kick(time: number, vel: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(120, time);
    o.frequency.exponentialRampToValueAtTime(42, time + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.32 * vel, time + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    o.connect(g).connect(this.lofiBus!);
    o.start(time);
    o.stop(time + 0.3);
  }

  private snare(time: number, vel: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffers!.white;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1900;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.09 * vel, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
    src.connect(f).connect(g).connect(this.lofiBus!);
    src.start(time, Math.random() * 2);
    src.stop(time + 0.25);
  }

  private hat(time: number, vel: number, off: boolean) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffers!.white;
    src.playbackRate.value = 1.6;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 8200;
    const g = ctx.createGain();
    const v = 0.035 * vel * (off ? 1.2 : 1);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(v, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    src.connect(f).connect(g).connect(this.lofiBus!);
    src.start(time, Math.random() * 2);
    src.stop(time + 0.08);
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
    g.gain.exponentialRampToValueAtTime(0.02 + Math.random() * 0.02, time + 0.001);
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
      window.setTimeout(() => this.thunder(0.55), 350);
    }
    return this.prefs[channel];
  }

  private applyChannels() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;

    // STORM
    this.stormBus!.gain.setTargetAtTime(this.prefs.storm ? 1 : 0, t, 0.4);
    if (this.prefs.storm) {
      this.setStormLevel(this.stormLevel);
    } else {
      // fade layers down
      for (const l of [this.rainFar, this.rainMid, this.rainNear]) {
        l!.gain.gain.setTargetAtTime(0, t, 0.4);
      }
      this.windLfoGain!.gain.setTargetAtTime(0, t, 0.4);
    }

    // LOFI
    this.lofiBus!.gain.setTargetAtTime(this.prefs.lofi ? 0.85 : 0, t, 0.5);
    if (this.prefs.lofi) {
      this.startLofi();
    } else if (!this.prefs.lofi) {
      // stop scheduling; scheduled notes ring out naturally
      window.setTimeout(() => {
        if (!this.prefs.lofi) this.stopLofi();
      }, 900);
    }
  }

  /** Restore saved prefs without enabling audio (autoplay-safe). */
  preflight() {
    // Called on mount — nothing audible happens until a user gesture
    // reaches toggle(). We deliberately do NOT auto-resume here.
    return this.prefs;
  }
}

export const soundscape = new SoundscapeEngine();
