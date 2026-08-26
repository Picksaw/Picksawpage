import { readFileSync } from "node:fs";
const ATMO = readFileSync("src/components/journey/city/Atmosphere.tsx", "utf8");

/**
 * Overdraw analyser.
 *
 * Replicates the Atmosphere card distribution and the fragment shader's
 * alpha, then traces rays from the camera to measure how much opacity
 * accumulates per pixel. If that approaches 1.0 the frame washes out to
 * flat fog colour — which on a dark palette reads as "everything is black".
 */
const LAYERS = [
  { name:"ground", n:0.34, size:[2.2,6.5],  y:[-0.3,1.5], x:26,  span:44,  alpha:[0.10,0.22], far:[34,52] },
  { name:"near",   n:0.24, size:[5,13],     y:[0,12],     x:34,  span:60,  alpha:[0.045,0.10], far:[52,78] },
  { name:"mid",    n:0.26, size:[14,34],    y:[0,40],     x:90,  span:150, alpha:[0.03,0.075], far:[130,190] },
  { name:"far",    n:0.16, size:[45,110],   y:[0,120],    x:260, span:420, alpha:[0.025,0.06], far:[340,430] },
];
const TOTAL = 620, STORM = 0.5;
let seed = 0xf0611;
const rnd = () => { seed = (seed*16807)%2147483647; return seed/2147483647; };
const rng = (a,b) => a + rnd()*(b-a);
const smooth = (e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t);};

// build the card set exactly as the component does
const cards=[];
for (const L of LAYERS) {
  const n = Math.max(8, Math.round(TOTAL*L.n));
  for (let i=0;i<n;i++) cards.push({
    L, x:rng(-L.x,L.x), y:rng(L.y[0],L.y[1]), z:rng(-L.span,0),
    size:rng(L.size[0],L.size[1]), alpha:rng(L.alpha[0],L.alpha[1]),
  });
}

// wrap into the rolling volume around a camera at the origin (eye 1.7 m)
const CAM=[0,1.7,0];
for (const c of cards) {
  const rel = ((c.z - CAM[2] + c.L.span*0.35) % c.L.span + c.L.span) % c.L.span;
  c.z = CAM[2] - c.L.span*0.65 + rel;
}

/** mean of body^1.35 over the disc, matching the fragment shader */
function meanBody(){
  let s=0,n=0;
  for(let r=0;r<1;r+=0.01){ const b=Math.pow(1-smooth(0,1,r),1.35); s+=b*r; n+=r; }
  return s/n;
}
const MB = meanBody();

// trace rays across a 46-degree lens
const FOV=46*Math.PI/180, ASPECT=16/9;
let acc=[], maxAcc=0;
for (let iy=-6; iy<=6; iy++) for (let ix=-10; ix<=10; ix++) {
  const ay = (iy/6)*(FOV/2), ax = (ix/10)*(FOV/2)*ASPECT;
  const dir=[Math.sin(ax), Math.sin(ay), -Math.cos(ax)];
  let T=1;
  for (const c of cards) {
    const dx=c.x-CAM[0], dy=c.y-CAM[1], dz=c.z-CAM[2];
    const t = dx*dir[0]+dy*dir[1]+dz*dir[2];
    if (t<=0.5) continue;                       // behind or at the eye
    const dist=Math.hypot(dx,dy,dz);
    const perp=Math.hypot(dx-dir[0]*t, dy-dir[1]*t, dz-dir[2]*t);
    const radius=c.size/2;                      // quad spans `size`
    if (perp>radius) continue;
    const radiusFade=smooth(radius*0.6, radius*2.2, dist);
    const nearFade=smooth(1.2,6.0,dist)*radiusFade;
    const farFade=1-smooth(c.L.far[0],c.L.far[1],dist);
    // shader: density = body*(0.35+0.95*n), n~0.5 average
    let a = MB*(0.35+0.95*0.5)*c.alpha*nearFade*farFade*(0.7+STORM*0.6);
    a=Math.max(0,Math.min(1,a));
    T *= (1-a);
  }
  const A=1-T; acc.push(A); maxAcc=Math.max(maxAcc,A);
}
acc.sort((a,b)=>a-b);
const mean=acc.reduce((a,b)=>a+b,0)/acc.length;
const med=acc[Math.floor(acc.length/2)];

console.log("\nFOG CARD OVERDRAW  (camera at the street, storm 0.5)\n");
console.log(`  cards in the volume        ${cards.length}`);
console.log(`  mean accumulated opacity   ${(mean*100).toFixed(1)}%`);
console.log(`  median                     ${(med*100).toFixed(1)}%`);
console.log(`  worst pixel                ${(maxAcc*100).toFixed(1)}%`);
console.log(`\n  → anything above ~35% means the scene is veiled by flat fog colour.`);
console.log(`  → above ~70% the frame IS the fog colour: a black screen.\n`);

// how big is a near card on screen?
console.log("APPARENT SIZE OF THE NEAREST CARDS");
for (const L of LAYERS) {
  const r=L.size[1]/2, d=6;
  const deg=2*Math.atan(r/d)*180/Math.PI;
  console.log(`  ${L.name.padEnd(7)} largest ${L.size[1]} m across → ${deg.toFixed(0)}° of the frame at 6 m`);
}
console.log(`\n  (a 46° lens is the whole screen)\n`);

// count how many cards sit uncomfortably close
let close=0;
for (const c of cards){ const d=Math.hypot(c.x-CAM[0],c.y-CAM[1],c.z-CAM[2]); if(d<12 && d>1.2) close++; }
console.log(`  cards within 12 m of the eye: ${close}\n`);

let failures = 0;
const check = (label, ok, detail) => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};
console.log("VERDICT");
check("the frame is not veiled by flat fog", mean < 0.35, `${(mean*100).toFixed(1)}% mean opacity`);
check("no pixel is buried under fog", maxAcc < 0.70, `${(maxAcc*100).toFixed(1)}% worst`);
check("fog still reads as atmosphere", mean > 0.05, `${(mean*100).toFixed(1)}%`);
check("near fade scales with card radius",
  /smoothstep\(vRadius \* 0\.6, vRadius \* 2\.2, vDist\)/.test(ATMO));
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}\n`);
process.exit(failures === 0 ? 0 : 1);
