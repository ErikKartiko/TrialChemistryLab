// ------------------------------------------------------------------
// Shared 3D stage — Canvas, lights, orbit controls with UI buttons
// ------------------------------------------------------------------

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RotateCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

export type V3 = [number, number, number];

// ---------- math helpers ----------
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};
export const smoothstep = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
export const lerpV3 = (a: V3, b: V3, t: number): V3 => [
  lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t),
];

/** deterministic pseudo random — mulberry32 */
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- stage ----------

interface Stage3DProps {
  children: ReactNode;
  className?: string;
  cameraPos?: V3;
  fov?: number;
  autoRotateInitial?: boolean;
  controls?: boolean;      // show rotate/zoom/reset overlay buttons
  floor?: boolean;         // grid floor + fog
  zoomSpeed?: number;
  overlay?: ReactNode;     // extra overlay content (top-left)
  controlLabels?: boolean; // show text labels next to icons
}

export function Stage3D({
  children, className = "", cameraPos = [0, 1, 7], fov = 42,
  autoRotateInitial = true, controls = true, floor = false, overlay,
}: Stage3DProps) {
  const ctrlRef = useRef<any>(null);
  const [rotating, setRotating] = useState(autoRotateInitial);

  const zoom = (factor: number) => {
    const c = ctrlRef.current;
    if (!c) return;
    const obj = c.object;
    const len = obj.position.length();
    const next = Math.min(28, Math.max(2.4, len * factor));
    obj.position.setLength(next);
    c.update();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: cameraPos, fov }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.62} />
        <directionalLight position={[5, 8, 6]} intensity={1.25} color="#dff2ff" />
        <pointLight position={[-6, -3, 4]} intensity={0.5} color="#38e1ff" />
        <pointLight position={[6, -4, -6]} intensity={0.35} color="#7c8cff" />
        {floor && (
          <>
            <fog attach="fog" args={["#04070f", 13, 30]} />
            <gridHelper args={[40, 40, "#1c3a68", "#0c1936"]} position={[0, -3.4, 0]} />
          </>
        )}
        {children}
        <OrbitControls
          ref={ctrlRef}
          makeDefault
          autoRotate={rotating}
          autoRotateSpeed={1.1}
          enablePan={false}
          minDistance={2.4}
          maxDistance={26}
        />
      </Canvas>

      {overlay}

      {controls && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-cyan-300/15 bg-[#060d1d]/80 px-2 py-1.5 backdrop-blur-md">
          <button
            onClick={() => setRotating((r) => !r)}
            title="Rotate"
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition ${
              rotating ? "bg-cyan-400/15 text-cyan-300" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <RotateCw size={14} className={rotating ? "animate-spin" : ""} style={{ animationDuration: "2.4s" }} />
            <span className="hidden sm:inline">Rotate</span>
          </button>
          <button onClick={() => zoom(0.78)} title="Zoom in" className="rounded-full px-2.5 py-1.5 text-slate-400 transition hover:text-slate-100">
            <ZoomIn size={15} />
          </button>
          <button onClick={() => zoom(1.28)} title="Zoom out" className="rounded-full px-2.5 py-1.5 text-slate-400 transition hover:text-slate-100">
            <ZoomOut size={15} />
          </button>
          <button onClick={() => ctrlRef.current?.reset()} title="Reset view" className="rounded-full px-2.5 py-1.5 text-slate-400 transition hover:text-slate-100">
            <Maximize2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
