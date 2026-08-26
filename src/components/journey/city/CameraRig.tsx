/**
 * CameraRig — the film camera.
 *
 * Scroll sets a target in metres; this rig is a physical object that
 * chases it. See lib/cameraModel.ts for the layer breakdown (dolly
 * spring, asymmetric braking, gait sway, handheld noise, idle breath,
 * dynamic FOV). This component's job is to compose those layers onto a
 * three.js camera and publish the result into `journey` so the whole
 * district can react to where the visitor is and how fast they move.
 *
 * Framing behaviour: as the rig approaches a hero plot it turns its
 * head toward the façade and the lens compresses slightly, so the
 * building is presented rather than merely passed. The turn is capped
 * well below the point where the street leaves the frame.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  EYE_HEIGHT,
  HERO_PLOTS,
  JOURNEY_LENGTH,
  pathHeading,
  pathPoint,
} from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import {
  CALM_TUNING,
  DEFAULT_TUNING,
  MOBILE_TUNING,
  dollyStep,
  operator,
  smoothstep,
} from "../lib/cameraModel";
import type { Quality } from "../lib/quality";

export default function CameraRig({ quality }: { quality: Quality }) {
  const { camera, size } = useThree();

  const tuning = useMemo(() => {
    if (quality.reducedMotion) return CALM_TUNING;
    return quality.isMobile ? MOBILE_TUNING : DEFAULT_TUNING;
  }, [quality]);

  const pointer = useRef({ x: 0, y: 0 });
  const easedPointer = useRef({ x: 0, y: 0 });
  const speed01 = useRef(0);
  const idle01 = useRef(1);
  const headTurn = useRef(0);
  const fovRef = useRef(tuning.fov);

  // Start the eye exactly on the street. Seeding it at the origin makes
  // the very first frame a hard pan as it snaps onto the path.
  const eye = useRef(
    (() => {
      const p = pathPoint(0);
      return new THREE.Vector3(p.x, p.y + EYE_HEIGHT, p.z);
    })()
  );
  const look = useRef(new THREE.Vector3());
  const primed = useRef(false);
  /** last scroll target, to detect whether scroll is still driving */
  const lastTarget = useRef(0);
  /** seconds since the scroll target last changed */
  const sinceInput = useRef(99);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpEuler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const axisZ = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  // portrait phones need a wider lens or the street never enters frame
  const baseFov = useMemo(() => {
    const portrait = size.width / size.height < 0.8;
    return portrait ? Math.max(tuning.fov, 62) : tuning.fov;
  }, [tuning.fov, size.width, size.height]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    journey.time += dt;

    // ── 1. the dolly ──────────────────────────────────────────────
    // Is SCROLL still driving? Measured from the raw target, with a
    // 120 ms hold-off so wheel notches between events don't flip the
    // rig into coast mode mid-gesture.
    if (Math.abs(journey.targetS - lastTarget.current) > 0.02) sinceInput.current = 0;
    else sinceInput.current += dt;
    lastTarget.current = journey.targetS;
    const driving = sinceInput.current < 0.12;

    const prevS = journey.s;
    journey.s = dollyStep(journey.s, journey.targetS, driving, dt, tuning);
    const rawV = dt > 0 ? (journey.s - prevS) / dt : 0;
    // smooth the reported velocity so downstream systems (rain, fog,
    // audio) never see a single-frame spike
    journey.velocity += (rawV - journey.velocity) * Math.min(1, dt * 9);
    journey.progress = THREE.MathUtils.clamp(journey.s / JOURNEY_LENGTH, 0, 1);

    const sp = Math.min(1, Math.abs(journey.velocity) / 26);
    speed01.current += (sp - speed01.current) * Math.min(1, dt * 4);
    const idleTarget = 1 - Math.min(1, Math.abs(journey.velocity) / 2.2);
    idle01.current += (idleTarget - idle01.current) * Math.min(1, dt * 1.6);

    // storm intensity rises with depth AND with how hard you're moving
    const stormTarget =
      0.16 + journey.progress * 0.68 + speed01.current * 0.16;
    journey.storm += (stormTarget - journey.storm) * Math.min(1, dt * 0.9);

    // ── 2. where the street is ────────────────────────────────────
    const p = pathPoint(journey.s);
    const px = p.x;
    const py = p.y;
    const pz = p.z;
    const heading = p.heading;

    // ── 3. framing: turn toward the nearest hero plot ─────────────
    let framing = 0;
    let framingSide = 0;
    for (const plot of HERO_PLOTS) {
      const ds = plot.s - journey.s;
      // strongest just before and at the façade, releasing after
      const a = smoothstep(52, 8, Math.abs(ds));
      if (a > framing) {
        framing = a;
        framingSide = plot.side;
      }
    }
    journey.focusAmount += (framing - journey.focusAmount) * Math.min(1, dt * 3);
    const turnTarget = framingSide * framing * 0.3; // ≤ 17°, street stays in frame
    headTurn.current += (turnTarget - headTurn.current) * Math.min(1, dt * 2.4);

    // ── 4. the operator ───────────────────────────────────────────
    const op = operator(journey.time, speed01.current, idle01.current, tuning);

    // pointer look — slow, weighted, never twitchy
    const pk = Math.min(1, dt * 2.6);
    easedPointer.current.x += (pointer.current.x - easedPointer.current.x) * pk;
    easedPointer.current.y += (pointer.current.y - easedPointer.current.y) * pk;
    const look01 = quality.reducedMotion ? 0 : 1;
    const lx = easedPointer.current.x * look01;
    const ly = easedPointer.current.y * look01;

    // ── 5. compose the eye ────────────────────────────────────────
    // lateral offset is perpendicular to the street heading
    const nx = Math.cos(heading);
    const nz = Math.sin(heading);
    const lateral = op.offsetX + lx * 1.15;

    const targetX = px + nx * lateral;
    const targetY = py + EYE_HEIGHT + op.offsetY - ly * 0.3;
    const targetZ = pz + nz * lateral;

    // First frame: land exactly on the mark instead of easing in from
    // wherever the camera prop happened to put us (that reads as a whip pan).
    const follow = primed.current ? 1 - Math.exp(-dt * 14) : 1;
    eye.current.x += (targetX - eye.current.x) * follow;
    eye.current.y += (targetY - eye.current.y) * follow;
    eye.current.z += (targetZ - eye.current.z) * follow;
    camera.position.copy(eye.current);

    // ── 6. aim ────────────────────────────────────────────────────
    // Look further ahead at speed (a walker scans the road), and turn
    // toward the framed façade.
    const lookAhead = 20 + speed01.current * 26;
    const ahead = pathPoint(journey.s + lookAhead);
    const aheadHeading = pathHeading(journey.s + lookAhead);
    const anx = Math.cos(aheadHeading);
    const anz = Math.sin(aheadHeading);
    // headTurn pushes the aim point sideways, toward the building
    const aimLateral = headTurn.current * 22 + lx * 4.2;

    look.current.set(
      ahead.x + anx * aimLateral,
      ahead.y + EYE_HEIGHT - 0.4 - ly * 1.5 + framing * 2.6,
      ahead.z + anz * aimLateral
    );
    camera.lookAt(look.current);

    // operator's yaw/pitch/roll ride on top of the aim
    tmpEuler.set(op.pitch, op.yaw, 0, "YXZ");
    tmpQuat.setFromEuler(tmpEuler);
    camera.quaternion.multiply(tmpQuat);
    camera.rotateOnWorldAxis(axisZ, op.roll);

    // ── 7. the lens ───────────────────────────────────────────────
    const cam = camera as THREE.PerspectiveCamera;
    const fovTarget =
      baseFov + speed01.current * tuning.fovSpeed - framing * tuning.fovFocus;
    fovRef.current += (fovTarget - fovRef.current) * Math.min(1, dt * 2.2);
    if (Math.abs(cam.fov - fovRef.current) > 0.01) {
      cam.fov = fovRef.current;
      cam.updateProjectionMatrix();
    }

    journey.camX = camera.position.x;
    journey.camY = camera.position.y;
    journey.camZ = camera.position.z;
    primed.current = true;
  });

  return null;
}
