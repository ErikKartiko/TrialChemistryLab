// ------------------------------------------------------------------
// ParticleView — visualisasi MIKROSKOPIS (ion & molekul) pada kanvas 2D
// Lembut, edukatif, tanpa klaim berlebihan: ion digambar berlabel.
// ------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { makeRng } from "../three/core";

export type ParticleStage = "naoh" | "hcl" | "mixing" | "neutral";

interface ParticleDef {
  label: string;
  color: string;
  r: number;
  group?: number;      // bergerak bersama grup (mis. H2O)
  plus?: boolean;
  minus?: boolean;
}

interface P { def: ParticleDef; x: number; y: number; vx: number; vy: number; ph: number }

const NA = { label: "Na⁺", color: "#a78bfa", r: 11 };
const OH = { label: "OH⁻", color: "#34d399", r: 11 };
const H = { label: "H⁺", color: "#ff5d5d", r: 7 };
const CL = { label: "Cl⁻", color: "#22c55e", r: 12 };
const H2O = { label: "H₂O", color: "#38bdf8", r: 13 };

function particlesFor(stage: ParticleStage, w: number, h: number): P[] {
  const rng = makeRng(stage.length * 991 + 7);
  const defs: ParticleDef[] = [];
  if (stage === "naoh") {
    for (let i = 0; i < 5; i++) { defs.push(NA, OH, H2O); }
  } else if (stage === "hcl") {
    for (let i = 0; i < 5; i++) { defs.push(H, CL, H2O); }
  } else if (stage === "mixing") {
    for (let i = 0; i < 4; i++) defs.push(NA, CL, H2O);
    for (let i = 0; i < 2; i++) defs.push(H, OH);
  } else {
    for (let i = 0; i < 4; i++) defs.push(NA, CL);
    for (let i = 0; i < 6; i++) defs.push(H2O);
  }
  return defs.map((def) => ({
    def,
    x: rng() * (w - 40) + 20,
    y: rng() * (h - 40) + 20,
    vx: (rng() - 0.5) * 0.5,
    vy: (rng() - 0.5) * 0.5,
    ph: rng() * Math.PI * 2,
  }));
}

export function ParticleView({ stage, caption, className = "" }: { stage: ParticleStage; caption?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let parts: P[] = [];
    let built = "";
    let t = 0;

    const resize = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const loop = () => {
      resize();
      const w = cv.clientWidth, h = cv.clientHeight;
      if (built !== stageRef.current) { parts = particlesFor(stageRef.current, w, h); built = stageRef.current; }
      t += 0.016;

      ctx.clearRect(0, 0, w, h);
      // latar "larutan"
      const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) / 1.2);
      g.addColorStop(0, "rgba(14,42,80,0.55)");
      g.addColorStop(1, "rgba(4,10,24,0.1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (const p of parts) {
        p.x += p.vx + Math.sin(t * 0.8 + p.ph) * 0.18;
        p.y += p.vy + Math.cos(t * 0.7 + p.ph * 1.3) * 0.16;
        const r = p.def.r;
        if (p.x < r) { p.x = r; p.vx *= -1; }
        if (p.x > w - r) { p.x = w - r; p.vx *= -1; }
        if (p.y < r) { p.y = r; p.vy *= -1; }
        if (p.y > h - r) { p.y = h - r; p.vy *= -1; }

        ctx.shadowColor = p.def.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.def.color + "cc";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(230,245,255,0.65)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#04101e";
        ctx.font = `700 ${Math.max(8, r * 0.62)}px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.def.label, p.x, p.y);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-cyan-300/15 bg-[#050c1a] ${className}`}>
      <canvas ref={ref} className="h-full w-full" />
      {caption && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-cyan-300/20 bg-[#04101e]/85 px-3 py-1 text-center font-mono text-[9px] tracking-wider whitespace-nowrap text-cyan-200 uppercase">
          {caption}
        </div>
      )}
    </div>
  );
}
