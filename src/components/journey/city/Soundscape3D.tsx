/**
 * Soundscape3D — the district's positional audio.
 *
 * The existing SoundscapeEngine owns the global storm bed (rain, wind,
 * thunder) and the lofi channel. This layer adds the things that have a
 * PLACE in the world, using the WebAudio panner graph so they arrive
 * from the direction they exist in and fade with real distance.
 *
 *   BASE        wind whose filter opens as you walk faster, and whose
 *               level tracks storm intensity
 *   NEON HUM    a mains buzz at each lit sign
 *   TRANSFORMER a low 50 Hz drone with a faint harmonic, near the poles
 *   VENTILATION broadband whoosh at rooftop fans
 *   TRAFFIC     a distant low rumble, always slightly ahead
 *   METAL CREAK occasional stressed-metal groans from the scaffolding
 *   DISTRICT    each quarter gets its own ambient bed that crossfades
 *               as you enter it
 *
 * Everything is generated — no audio files. Sources are pooled: only
 * the nearest few of each type are connected to the graph, and they are
 * re-targeted as you walk, so the node count stays flat.
 *
 * Nothing plays until the user enables sound (the existing dock
 * toggle), so autoplay policy is respected.
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildLampsSorted, districtAt, HERO_PLOTS } from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import { soundscape } from "../../../audio/soundscape";
import type { Quality } from "../lib/quality";

interface Emitter {
  panner: PannerNode;
  gain: GainNode;
  /** world position this voice is currently rendering */
  pos: THREE.Vector3;
  /** arc position, for the recycling window */
  s: number;
  active: boolean;
}

interface Pool {
  emitters: Emitter[];
  /** every candidate site in the district, sorted by s */
  sites: { s: number; pos: THREE.Vector3 }[];
  cursor: number;
}

/** Build a looping noise buffer. */
function noiseBuffer(ctx: AudioContext, seconds: number, brown: boolean) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    } else {
      d[i] = w;
    }
  }
  // taper the seam so the loop is inaudible
  const fade = Math.min(2000, Math.floor(len * 0.02));
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    d[i] *= k;
    d[len - 1 - i] *= k;
  }
  return buf;
}

function makePanner(ctx: AudioContext, refDistance: number, maxDistance: number) {
  const p = ctx.createPanner();
  p.panningModel = "HRTF";
  p.distanceModel = "inverse";
  p.refDistance = refDistance;
  p.maxDistance = maxDistance;
  p.rolloffFactor = 1.6;
  p.coneInnerAngle = 360;
  return p;
}

export default function Soundscape3D({ quality }: { quality: Quality }) {
  const { camera } = useThree();
  const built = useRef(false);
  const nodes = useRef<{
    ctx: AudioContext;
    bus: GainNode;
    wind: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode };
    traffic: { gain: GainNode; filter: BiquadFilterNode };
    neon: Pool;
    transformer: Pool;
    vent: Pool;
    creakAt: number;
    districtBed: { gain: GainNode; filter: BiquadFilterNode };
  } | null>(null);

  const forward = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  const frame = useRef(0);

  useEffect(() => {
    return () => {
      const n = nodes.current;
      if (!n) return;
      try {
        n.wind.src.stop();
        n.bus.disconnect();
      } catch {
        /* context may already be closed */
      }
      nodes.current = null;
      built.current = false;
    };
  }, []);

  /** Build the graph lazily, the first time the user has sound on. */
  const build = () => {
    const graph = soundscape.graph;
    if (!graph) return false;
    const { ctx, stormBus: dest } = graph;

    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(dest);

    const white = noiseBuffer(ctx, 4, false);
    const brown = noiseBuffer(ctx, 6, true);

    // ── wind: a filtered brown-noise bed that opens with speed ──
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = brown;
    windSrc.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 420;
    windFilter.Q.value = 0.7;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.18;
    windSrc.connect(windFilter).connect(windGain).connect(bus);
    windSrc.start();

    // ── distant traffic: a low rumble, always slightly ahead ──
    const trafficSrc = ctx.createBufferSource();
    trafficSrc.buffer = brown;
    trafficSrc.loop = true;
    const trafficFilter = ctx.createBiquadFilter();
    trafficFilter.type = "lowpass";
    trafficFilter.frequency.value = 190;
    trafficFilter.Q.value = 0.6;
    const trafficGain = ctx.createGain();
    trafficGain.gain.value = 0.1;
    trafficSrc.connect(trafficFilter).connect(trafficGain).connect(bus);
    trafficSrc.start();

    // ── district bed: a tonal pad that recolours per quarter ──
    const bedSrc = ctx.createBufferSource();
    bedSrc.buffer = white;
    bedSrc.loop = true;
    const bedFilter = ctx.createBiquadFilter();
    bedFilter.type = "bandpass";
    bedFilter.frequency.value = 800;
    bedFilter.Q.value = 4;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.035;
    bedSrc.connect(bedFilter).connect(bedGain).connect(bus);
    bedSrc.start();

    // ── pooled positional voices ──
    const lamps = buildLampsSorted();

    const mkPool = (
      count: number,
      sites: { s: number; pos: THREE.Vector3 }[],
      make: () => { out: AudioNode; stop: () => void },
      refDist: number,
      maxDist: number
    ): Pool => {
      const emitters: Emitter[] = [];
      for (let i = 0; i < count; i++) {
        const panner = makePanner(ctx, refDist, maxDist);
        const gain = ctx.createGain();
        gain.gain.value = 0;
        const voice = make();
        voice.out.connect(gain).connect(panner).connect(bus);
        emitters.push({
          panner,
          gain,
          pos: new THREE.Vector3(),
          s: -1e9,
          active: false,
        });
      }
      return { emitters, sites: sites.sort((a, b) => a.s - b.s), cursor: 0 };
    };

    // neon hum — a buzzy sawtooth pair at mains frequency
    const neonSites = lamps
      .filter((_, i) => i % 2 === 0)
      .map((l) => ({ s: l.s, pos: new THREE.Vector3(l.x, l.y + 4, l.z) }));
    const neon = mkPool(
      quality.simplified ? 2 : 3,
      neonSites,
      () => {
        const o1 = ctx.createOscillator();
        o1.type = "sawtooth";
        o1.frequency.value = 100;
        const o2 = ctx.createOscillator();
        o2.type = "square";
        o2.frequency.value = 200.7;
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 1400;
        f.Q.value = 6;
        const g = ctx.createGain();
        g.gain.value = 0.12;
        o1.connect(f);
        o2.connect(f);
        f.connect(g);
        o1.start();
        o2.start();
        return { out: g, stop: () => { o1.stop(); o2.stop(); } };
      },
      2.5,
      26
    );

    // transformers — a 50 Hz drone with a third harmonic
    const transformerSites = lamps
      .filter((_, i) => i % 5 === 0)
      .map((l) => ({ s: l.s, pos: new THREE.Vector3(l.x, l.y + 7, l.z) }));
    const transformer = mkPool(
      quality.simplified ? 1 : 2,
      transformerSites,
      () => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = 50;
        const o3 = ctx.createOscillator();
        o3.type = "sine";
        o3.frequency.value = 150;
        const g3 = ctx.createGain();
        g3.gain.value = 0.35;
        const g = ctx.createGain();
        g.gain.value = 0.5;
        o.connect(g);
        o3.connect(g3).connect(g);
        o.start();
        o3.start();
        return { out: g, stop: () => { o.stop(); o3.stop(); } };
      },
      3,
      22
    );

    // ventilation — broadband whoosh at rooftop level
    const ventSites = HERO_PLOTS.map((p) => ({
      s: p.s,
      pos: new THREE.Vector3(0, p.height, 0),
    }));
    const vent = mkPool(
      quality.simplified ? 1 : 2,
      ventSites,
      () => {
        const src = ctx.createBufferSource();
        src.buffer = white;
        src.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 620;
        f.Q.value = 1.1;
        const g = ctx.createGain();
        g.gain.value = 0.22;
        src.connect(f).connect(g);
        src.start();
        return { out: g, stop: () => src.stop() };
      },
      4,
      30
    );

    nodes.current = {
      ctx,
      bus,
      wind: { src: windSrc, filter: windFilter, gain: windGain },
      traffic: { gain: trafficGain, filter: trafficFilter },
      neon,
      transformer,
      vent,
      creakAt: 12,
      districtBed: { gain: bedGain, filter: bedFilter },
    };
    built.current = true;
    return true;
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Build only once the engine actually has a running context — i.e.
    // once the user has turned sound on. Never before.
    if (!built.current) {
      const enabled = soundscape.enabled.storm || soundscape.enabled.lofi;
      if (!enabled) return;
      if (!build()) return;
    }
    const n = nodes.current;
    if (!n) return;

    const t = n.ctx.currentTime;
    const cam = camera.position;

    // ── listener follows the camera, with orientation ──
    const listener = n.ctx.listener;
    camera.getWorldDirection(forward.current);
    up.current.set(0, 1, 0).applyQuaternion(camera.quaternion);
    if (listener.positionX) {
      listener.positionX.setTargetAtTime(cam.x, t, 0.02);
      listener.positionY.setTargetAtTime(cam.y, t, 0.02);
      listener.positionZ.setTargetAtTime(cam.z, t, 0.02);
      listener.forwardX.setTargetAtTime(forward.current.x, t, 0.05);
      listener.forwardY.setTargetAtTime(forward.current.y, t, 0.05);
      listener.forwardZ.setTargetAtTime(forward.current.z, t, 0.05);
      listener.upX.setTargetAtTime(up.current.x, t, 0.05);
      listener.upY.setTargetAtTime(up.current.y, t, 0.05);
      listener.upZ.setTargetAtTime(up.current.z, t, 0.05);
    } else {
      listener.setPosition(cam.x, cam.y, cam.z);
      listener.setOrientation(
        forward.current.x, forward.current.y, forward.current.z,
        up.current.x, up.current.y, up.current.z
      );
    }

    // ── the world bus fades in with the journey ──
    n.bus.gain.setTargetAtTime(journey.inObservatory ? 0.35 : 0.85, t, 0.4);

    // ── wind: opens with speed and storm ──
    const speed = Math.min(1, Math.abs(journey.velocity) / 30);
    n.wind.filter.frequency.setTargetAtTime(320 + speed * 900 + journey.storm * 380, t, 0.25);
    n.wind.gain.gain.setTargetAtTime(0.1 + journey.storm * 0.22 + speed * 0.1, t, 0.3);

    // ── traffic sits just ahead, quieter deeper into the district ──
    n.traffic.gain.gain.setTargetAtTime(0.11 * (1 - journey.progress * 0.5), t, 0.6);

    // ── district bed recolours per quarter ──
    const d = districtAt(journey.s);
    const bedFreq =
      d.kind === "luxury" ? 520 :
      d.kind === "dental" ? 1250 :
      d.kind === "studio" ? 880 :
      d.kind === "beauty" ? 700 : 400;
    n.districtBed.filter.frequency.setTargetAtTime(bedFreq, t, 1.2);

    // ── recycle the positional pools ──
    frame.current++;
    if (frame.current % 6 === 0) {
      const camS = journey.s;
      for (const pool of [n.neon, n.transformer, n.vent]) {
        while (
          pool.cursor < pool.sites.length - 1 &&
          pool.sites[pool.cursor].s < camS - 18
        )
          pool.cursor++;
        while (pool.cursor > 0 && pool.sites[pool.cursor - 1].s >= camS - 18) pool.cursor--;

        for (let i = 0; i < pool.emitters.length; i++) {
          const e = pool.emitters[i];
          const site = pool.sites[pool.cursor + i];
          if (!site) {
            e.gain.gain.setTargetAtTime(0, t, 0.3);
            continue;
          }
          const ds = site.s - camS;
          if (ds < -25 || ds > 55) {
            e.gain.gain.setTargetAtTime(0, t, 0.3);
            continue;
          }
          // move the panner only when the target actually changes, so a
          // voice never audibly jumps mid-note
          if (Math.abs(e.s - site.s) > 0.5) {
            e.s = site.s;
            e.pos.copy(site.pos);
            if (e.panner.positionX) {
              e.panner.positionX.setTargetAtTime(site.pos.x, t, 0.15);
              e.panner.positionY.setTargetAtTime(site.pos.y, t, 0.15);
              e.panner.positionZ.setTargetAtTime(site.pos.z, t, 0.15);
            } else {
              e.panner.setPosition(site.pos.x, site.pos.y, site.pos.z);
            }
          }
          e.gain.gain.setTargetAtTime(0.5, t, 0.5);
        }
      }
    }

    // ── metal creaks: rare, stressed, always somewhere off to a side ──
    n.creakAt -= dt;
    if (n.creakAt <= 0) {
      n.creakAt = 14 + Math.random() * 40;
      const ctx = n.ctx;
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      const base = 90 + Math.random() * 150;
      o.frequency.setValueAtTime(base, t);
      o.frequency.exponentialRampToValueAtTime(base * (0.6 + Math.random() * 0.3), t + 1.2);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 300 + Math.random() * 600;
      f.Q.value = 12;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      const p = makePanner(ctx, 4, 40);
      const side = Math.random() < 0.5 ? -1 : 1;
      const pp = [cam.x + side * (6 + Math.random() * 8), cam.y + 4 + Math.random() * 8, cam.z - 6 - Math.random() * 14];
      if (p.positionX) {
        p.positionX.value = pp[0];
        p.positionY.value = pp[1];
        p.positionZ.value = pp[2];
      } else {
        p.setPosition(pp[0], pp[1], pp[2]);
      }
      o.connect(f).connect(g).connect(p).connect(n.bus);
      o.start(t);
      o.stop(t + 1.5);
    }
  });

  return null;
}
