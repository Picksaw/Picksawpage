/**
 * SectionPanels — Trust, Process and Contact, mounted in the hallway.
 *
 * These three used to be ordinary DOM sections that took over once the
 * canvas faded, which meant the site changed modes halfway through: a
 * cinematic walk, then an abrupt switch to a normal scrolling page.
 * They are now three more stations further down the same corridor.
 *
 * Each panel is drawn to a canvas and mapped onto a plane, for the same
 * reason the paintings are: text rendered this way sits IN the world,
 * takes the fog, catches the lightning, and moves with the dolly. An
 * HTML overlay would float on top and undo the point of the hallway.
 *
 * Contact needs real interaction, so it carries clickable hit-planes
 * over its buttons — positioned from the SAME rectangles the canvas
 * draws, so the clickable area can never drift from what is lit.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SITE_TEXTS, type Lang } from "../../config/siteTexts";
import { layerOpacity, sectionZ, useFitScale } from "./Corridor";

const PANEL_W = 5.6;
const PANEL_H = 3.2;
const FOCUS_DIST = 4.2;

/** Canvas resolution — enough for crisp text at the focus station. */
const CW = 1680;
const CH = 960;

const FONT = (fa: boolean) => (fa ? "Vazirmatn Variable" : "Sora Variable");

// ── shared drawing helpers ─────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The glass slab every panel is engraved into. */
function drawSlab(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CW, CH);
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "rgba(12,18,32,0.90)");
  g.addColorStop(1, "rgba(5,8,16,0.94)");
  ctx.fillStyle = g;
  roundRect(ctx, 8, 8, CW - 16, CH - 16, 34);
  ctx.fill();

  // lit top bevel, dark stand-off beneath — a mounted pane, not a card
  ctx.strokeStyle = "rgba(159,232,255,0.22)";
  ctx.lineWidth = 3;
  roundRect(ctx, 8, 8, CW - 16, CH - 16, 34);
  ctx.stroke();
  ctx.strokeStyle = "rgba(79,216,255,0.10)";
  ctx.lineWidth = 10;
  roundRect(ctx, 3, 3, CW - 6, CH - 6, 38);
  ctx.stroke();
}

function drawHeading(
  ctx: CanvasRenderingContext2D,
  title: string,
  sub: string,
  fa: boolean
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = fa ? "rtl" : "ltr";

  ctx.shadowColor = "rgba(79,216,255,0.55)";
  ctx.shadowBlur = 26;
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 76px '${FONT(fa)}', sans-serif`;
  ctx.fillText(title, CW / 2, 108);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(150,178,205,0.95)";
  ctx.font = `500 34px '${FONT(fa)}', sans-serif`;
  ctx.fillText(sub, CW / 2, 176);

  const grad = ctx.createLinearGradient(CW * 0.25, 0, CW * 0.75, 0);
  grad.addColorStop(0, "rgba(79,216,255,0)");
  grad.addColorStop(0.5, "rgba(79,216,255,0.7)");
  grad.addColorStop(1, "rgba(79,216,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(CW * 0.25, 212, CW * 0.5, 2);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// ── the three panels ───────────────────────────────────────────────────────

function drawTrust(ctx: CanvasRenderingContext2D, t: Record<string, string>, fa: boolean) {
  drawSlab(ctx);
  drawHeading(ctx, t.trustTitle, t.trustSubtitle, fa);

  const stats = [
    { value: "10+", label: t.statTemplates },
    { value: fa ? "فا / EN" : "EN / FA", label: t.statBilingual },
    { value: "100%", label: t.statResponsive },
    { value: "⚡", label: t.statFast },
  ];

  const cardW = 340;
  const cardH = 300;
  const gap = 36;
  const totalW = stats.length * cardW + (stats.length - 1) * gap;
  let x = (CW - totalW) / 2;
  const y = 330;

  for (const s of stats) {
    const cg = ctx.createLinearGradient(x, y, x, y + cardH);
    cg.addColorStop(0, "rgba(20,30,50,0.75)");
    cg.addColorStop(1, "rgba(10,16,28,0.8)");
    ctx.fillStyle = cg;
    roundRect(ctx, x, y, cardW, cardH, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(159,232,255,0.16)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, cardW, cardH, 22);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(79,216,255,0.5)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#eaf6ff";
    ctx.font = `800 72px '${FONT(fa)}', sans-serif`;
    ctx.fillText(s.value, x + cardW / 2, y + 118);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(160,188,214,0.95)";
    ctx.font = `500 27px '${FONT(fa)}', sans-serif`;
    for (const [i, line] of wrap(ctx, s.label, cardW - 56).entries()) {
      ctx.fillText(line, x + cardW / 2, y + 196 + i * 36);
    }
    x += cardW + gap;
  }
}

function drawProcess(ctx: CanvasRenderingContext2D, t: Record<string, string>, fa: boolean) {
  drawSlab(ctx);
  drawHeading(ctx, t.processTitle, t.processSubtitle, fa);

  const stages = [
    { title: t.stageDiscoverTitle, desc: t.stageDiscoverDesc },
    { title: t.stageDesignTitle, desc: t.stageDesignDesc },
    { title: t.stagePersonalizeTitle, desc: t.stagePersonalizeDesc },
    { title: t.stageLaunchTitle, desc: t.stageLaunchDesc },
  ];

  const colW = 356;
  const gap = 28;
  const totalW = stages.length * colW + (stages.length - 1) * gap;
  const left = (CW - totalW) / 2;
  const y = 320;

  // the current running through all four
  const line = ctx.createLinearGradient(left, 0, left + totalW, 0);
  line.addColorStop(0, "rgba(79,216,255,0.05)");
  line.addColorStop(0.5, "rgba(79,216,255,0.6)");
  line.addColorStop(1, "rgba(79,216,255,0.05)");
  ctx.fillStyle = line;
  ctx.fillRect(left, y + 34, totalW, 2);

  stages.forEach((st, i) => {
    const cx = left + i * (colW + gap) + colW / 2;

    ctx.beginPath();
    ctx.arc(cx, y + 35, 26, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(8,14,26,0.98)";
    ctx.fill();
    ctx.strokeStyle = "rgba(79,216,255,0.75)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#9fe8ff";
    ctx.font = `700 28px '${FONT(fa)}', sans-serif`;
    ctx.fillText(String(i + 1), cx, y + 36);

    ctx.fillStyle = "#ffffff";
    ctx.font = `700 34px '${FONT(fa)}', sans-serif`;
    ctx.fillText(st.title, cx, y + 122);

    ctx.fillStyle = "rgba(150,178,205,0.92)";
    ctx.font = `400 25px '${FONT(fa)}', sans-serif`;
    for (const [k, l] of wrap(ctx, st.desc, colW - 40).entries()) {
      ctx.fillText(l, cx, y + 176 + k * 34);
    }
  });
}

/** Contact: the layout is fixed so the 3D hit-planes can line up with it. */
const CONTACT_BUTTONS = [
  { key: "whatsappCta", accent: "#25d366" },
  { key: "callCta", accent: "#4fd8ff" },
  { key: "followCta", accent: "#e1306c" },
] as const;

const BTN_W = 420;
const BTN_H = 108;
const BTN_GAP = 40;
const BTN_Y = 430;

function contactButtonRects() {
  const total = CONTACT_BUTTONS.length * BTN_W + (CONTACT_BUTTONS.length - 1) * BTN_GAP;
  const left = (CW - total) / 2;
  return CONTACT_BUTTONS.map((b, i) => ({
    ...b,
    x: left + i * (BTN_W + BTN_GAP),
    y: BTN_Y,
    w: BTN_W,
    h: BTN_H,
  }));
}

function drawContact(
  ctx: CanvasRenderingContext2D,
  t: Record<string, string>,
  fa: boolean,
  hover: number
) {
  drawSlab(ctx);
  drawHeading(ctx, t.contactTitle, t.contactSubtitle, fa);

  contactButtonRects().forEach((b, i) => {
    const on = hover === i;
    const bg = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    if (on) {
      bg.addColorStop(0, "rgba(255,255,255,0.97)");
      bg.addColorStop(1, "rgba(226,236,248,0.95)");
    } else {
      bg.addColorStop(0, "rgba(22,32,52,0.9)");
      bg.addColorStop(1, "rgba(12,18,32,0.92)");
    }
    ctx.fillStyle = bg;
    roundRect(ctx, b.x, b.y, b.w, b.h, 26);
    ctx.fill();

    ctx.strokeStyle = on ? b.accent : "rgba(159,232,255,0.22)";
    ctx.lineWidth = on ? 4 : 2;
    roundRect(ctx, b.x, b.y, b.w, b.h, 26);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = on ? "#0a0f1a" : "#eaf6ff";
    ctx.font = `700 34px '${FONT(fa)}', sans-serif`;
    ctx.fillText(t[b.key], b.x + b.w / 2, b.y + b.h / 2);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(140,166,192,0.9)";
  ctx.font = `400 27px '${FONT(fa)}', sans-serif`;
  ctx.fillText(t.contactNote, CW / 2, 640);

  ctx.fillStyle = "rgba(100,124,150,0.8)";
  ctx.font = `500 22px '${FONT(fa)}', sans-serif`;
  ctx.fillText(
    fa ? "پایان راهرو — برای بازگشت اسکرول کنید" : "END OF THE HALL — SCROLL TO RETURN",
    CW / 2,
    CH - 62
  );
}

// ── one panel in the world ─────────────────────────────────────────────────

type Kind = "trust" | "process" | "contact";

function Panel({
  kind,
  index,
  lang,
  onOpen,
}: {
  kind: Kind;
  index: number;
  lang: Lang;
  onOpen: (href: string) => void;
}) {
  const t = SITE_TEXTS[lang];
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const hover = useRef(-1);
  const [, redraw] = useState(0);
  const z = sectionZ(index);
  const fit = useFitScale(PANEL_W, PANEL_H, FOCUS_DIST, 0.94, 0.82);

  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = CW;
    c.height = CH;
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return { canvas: c, texture };
  }, []);

  // (re)draw whenever language or hover changes
  useEffect(() => {
    const ctx = tex.canvas.getContext("2d")!;
    const fa = lang === "fa";
    if (kind === "trust") drawTrust(ctx, t, fa);
    else if (kind === "process") drawProcess(ctx, t, fa);
    else drawContact(ctx, t, fa, hover.current);
    tex.texture.needsUpdate = true;
  });

  // fonts may land after first paint
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && redraw((n) => n + 1));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => () => tex.texture.dispose(), [tex]);

  useFrame(({ camera }) => {
    const op = layerOpacity(camera.position.z, z);
    if (mat.current) mat.current.opacity = op;
    if (glow.current) glow.current.opacity = 0.1 * op;
    if (group.current) {
      group.current.scale.setScalar(fit);
      group.current.position.x = (camera.position.x || 0) * 0.06;
    }
  });

  const links = useMemo(() => {
    const PHONE = "+989380215823";
    const msg = encodeURIComponent(
      lang === "fa"
        ? "سلام! درباره ساخت وب‌سایت سوال داشتم."
        : "Hi! I'd like to talk about a website."
    );
    return [
      `https://wa.me/${PHONE.replace("+", "")}?text=${msg}`,
      `tel:${PHONE}`,
      "https://www.instagram.com/picksawm/",
    ];
  }, [lang]);

  // Hit-planes over the contact buttons, from the SAME rects the canvas
  // drew, so the clickable area always matches what is lit.
  const hits = useMemo(() => {
    if (kind !== "contact") return [];
    return contactButtonRects().map((b, i) => ({
      i,
      x: ((b.x + b.w / 2) / CW - 0.5) * PANEL_W,
      y: -((b.y + b.h / 2) / CH - 0.5) * PANEL_H,
      w: (b.w / CW) * PANEL_W,
      h: (b.h / CH) * PANEL_H,
    }));
  }, [kind]);

  const setHover = (i: number) => {
    if (hover.current === i) return;
    hover.current = i;
    document.body.style.cursor = i >= 0 ? "pointer" : "";
    redraw((n) => n + 1);
  };

  return (
    <group ref={group} position={[0, 0, z]}>
      {/* halo */}
      <mesh position={[0, 0, -0.09]}>
        <planeGeometry args={[PANEL_W + 0.55, PANEL_H + 0.55]} />
        <meshBasicMaterial
          ref={glow}
          color="#4fd8ff"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* the panel itself */}
      <mesh>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <meshBasicMaterial
          ref={mat}
          map={tex.texture}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* contact buttons as real objects in the corridor */}
      {hits.map((h) => (
        <mesh
          key={h.i}
          position={[h.x, h.y, 0.02]}
          visible={false}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(h.i);
          }}
          onPointerOut={() => setHover(-1)}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(links[h.i]);
          }}
        >
          <planeGeometry args={[h.w, h.h]} />
        </mesh>
      ))}
    </group>
  );
}

export default function SectionPanels({
  lang,
  onOpen,
}: {
  lang: Lang;
  onOpen: (href: string) => void;
}) {
  return (
    <>
      <Panel kind="trust" index={0} lang={lang} onOpen={onOpen} />
      <Panel kind="process" index={1} lang={lang} onOpen={onOpen} />
      <Panel kind="contact" index={2} lang={lang} onOpen={onOpen} />
    </>
  );
}
