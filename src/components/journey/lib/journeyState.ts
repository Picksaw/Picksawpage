/**
 * journeyState — one mutable frame-state object shared by every system
 * in the City of Templates.
 *
 * Scroll drives `targetS` (metres along the street). The camera rig
 * integrates it into `s` with cinematic easing and publishes velocity,
 * storm intensity and the current lightning value. Fog, rain, lights,
 * audio and props all read from here instead of subscribing to React
 * state — zero re-renders per frame.
 */

export interface JourneyState {
  /** eased camera position along the street, in metres */
  s: number;
  /** raw scroll-driven target position, in metres */
  targetS: number;
  /** signed dolly speed, m/s (positive = walking forward) */
  velocity: number;
  /** 0..1 raw scroll progress through the journey spacer */
  progress: number;
  /** 0..1 storm intensity — rises as you walk deeper into the district */
  storm: number;
  /** 0..1 current lightning brightness (spikes, then decays) */
  bolt: number;
  /** index of the template plot currently framed, -1 when none */
  focused: number;
  /** 0..1 how strongly the focused plot is being approached */
  focusAmount: number;
  /** world-space camera position, mirrored for cheap distance maths */
  camX: number;
  camY: number;
  camZ: number;
  /** true while the observatory finale owns the frame */
  inObservatory: boolean;
  /** user asked for calm: no handheld noise, no sway, gentle everything */
  reducedMotion: boolean;
  /** seconds since the journey mounted */
  time: number;
}

export const journey: JourneyState = {
  s: 0,
  targetS: 0,
  velocity: 0,
  progress: 0,
  storm: 0,
  bolt: 0,
  focused: -1,
  focusAmount: 0,
  camX: 0,
  camY: 1.7,
  camZ: 0,
  inObservatory: false,
  reducedMotion: false,
  time: 0,
};

export function resetJourney() {
  journey.s = 0;
  journey.targetS = 0;
  journey.velocity = 0;
  journey.progress = 0;
  journey.storm = 0;
  journey.bolt = 0;
  journey.focused = -1;
  journey.focusAmount = 0;
  journey.inObservatory = false;
  journey.time = 0;
}
