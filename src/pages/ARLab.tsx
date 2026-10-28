import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  ScanEye, Video, VideoOff, Plus, Trash2, Info, Combine, RotateCcw, RotateCw,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, RefreshCcw,
  Hand, Grab, Scaling, Camera, Loader2, MousePointer2,
} from "lucide-react";
import { ELEMENT_SPECIES, elementBySymbol, CATEGORY_META } from "../data/elements";
import { moleculeByFormula, compositionOf } from "../data/molecules";
import { Btn, Tag, Modal, Formula } from "../components/ui";
import { MoleculeGroup } from "../components/three/MoleculeGroup";
import { HandTracker, HAND_CONNECTIONS, type HandFrame } from "../services/handTracking";
import type { Nav } from "../routes";

interface PlacedItem {
  id: number;
  formula: string;
  pos: [number, number, number];
  rotY: number;
  scale: number;
}

let nextId = 1;

const toast = (title: string, desc?: string) =>
  window.dispatchEvent(new CustomEvent("arcl-toast", { detail: { title, desc } }));

const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// ------------------------------------------------------------------
// video-frame → container-pixel mapping (object-cover + mirror)
// ------------------------------------------------------------------
function makeVideoMapper(video: HTMLVideoElement, box: HTMLElement) {
  const vw = video.videoWidth || 16, vh = video.videoHeight || 9;
  const cw = box.clientWidth, ch = box.clientHeight;
  const scale = Math.max(cw / vw, ch / vh);
  const ox = (cw - vw * scale) / 2, oy = (ch - vh * scale) / 2;
  return (nx: number, ny: number) => ({
    x: cw - (ox + nx * vw * scale),   // mirrored — matches the CSS video
    y: oy + ny * vh * scale,
  });
}

const tmpProj = new THREE.Vector3();
function worldToScreen(pos: [number, number, number], cam: THREE.Camera, box: HTMLElement) {
  tmpProj.set(pos[0], pos[1] + 0.35, pos[2]).project(cam);
  return {
    x: (tmpProj.x * 0.5 + 0.5) * box.clientWidth,
    y: (-tmpProj.y * 0.5 + 0.5) * box.clientHeight,
    behind: tmpProj.z > 1,
  };
}

const tmpDir = new THREE.Vector3();
const tmpOrg = new THREE.Vector3();
function screenToPlaneY(px: { x: number; y: number }, cam: THREE.Camera, box: HTMLElement, planeY: number): [number, number, number] | null {
  tmpDir.set((px.x / box.clientWidth) * 2 - 1, -(px.y / box.clientHeight) * 2 + 1, 0.5).unproject(cam);
  cam.getWorldPosition(tmpOrg);
  tmpDir.sub(tmpOrg).normalize();
  if (Math.abs(tmpDir.y) < 1e-4) return null;
  const t = (planeY - tmpOrg.y) / tmpDir.y;
  if (t < 0) return null;
  return [
    clampN(tmpOrg.x + tmpDir.x * t, -7.5, 7.5),
    planeY,
    clampN(tmpOrg.z + tmpDir.z * t, -7.5, 7.5),
  ];
}

// ------------------------------------------------------------------
// ambient light estimation from the camera feed (ARCore-style)
// ------------------------------------------------------------------
let sampleCanvas: HTMLCanvasElement | null = null;
function sampleLight(video: HTMLVideoElement): { intensity: number; warm: number } | null {
  if (!sampleCanvas) {
    sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 8; sampleCanvas.height = 6;
  }
  const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try { ctx.drawImage(video, 0, 0, 8, 6); } catch { return null; }
  const d = ctx.getImageData(0, 0, 8, 6).data;
  let r = 0, g = 0, b = 0;
  const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  r /= n; g /= n; b /= n;
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const warm = clampN(((r - b) / 255) * 2 + 0.5, 0, 1);
  return { intensity: 0.55 + luma * 0.85, warm };
}

// ------------------------------------------------------------------
// 3D helpers
// ------------------------------------------------------------------

function Ring({ color, radius = 0.85 }: { color: string; radius?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(t * 3.2) * 0.06);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(t * 3.2) * 0.18;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.88, 0]}>
      <torusGeometry args={[radius, 0.02, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
}

function CameraSync({ camRef }: { camRef: React.MutableRefObject<THREE.Camera | null> }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => { camRef.current = camera as THREE.Camera; }, [camera, camRef]);
  return null;
}

function LightRig({ envRef }: { envRef: React.MutableRefObject<{ intensity: number; warm: number }> }) {
  const amb = useRef<THREE.AmbientLight>(null!);
  const key = useRef<THREE.DirectionalLight>(null!);
  const cCool = useMemo(() => new THREE.Color("#cfe4ff"), []);
  const cWarm = useMemo(() => new THREE.Color("#ffe0bd"), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const e = envRef.current;
    if (amb.current) amb.current.intensity += (e.intensity - amb.current.intensity) * 0.06;
    if (key.current) { tmp.lerpColors(cCool, cWarm, e.warm); key.current.color.lerp(tmp, 0.06); }
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.85} />
      <directionalLight ref={key} position={[5, 8, 6]} intensity={1.2} />
      <pointLight position={[-6, 3, 4]} intensity={0.5} color="#38e1ff" />
    </>
  );
}

interface SceneProps {
  items: PlacedItem[];
  selectedId: number | null;
  hoverId: number | null;
  grabbingId: number | null;
  sim: boolean;
  onSelect: (id: number) => void;
  onPlace: (p: [number, number, number]) => void;
  camRef: React.MutableRefObject<THREE.Camera | null>;
  envRef: React.MutableRefObject<{ intensity: number; warm: number }>;
}

function ARScene({ items, selectedId, hoverId, grabbingId, sim, onSelect, onPlace, camRef, envRef }: SceneProps) {
  return (
    <>
      <CameraSync camRef={camRef} />
      <LightRig envRef={envRef} />
      {sim && (
        <>
          <fog attach="fog" args={["#04070f", 12, 26]} />
          <gridHelper args={[36, 36, "#1c3a68", "#0c1936"]} position={[0, -0.9, 0]} />
        </>
      )}

      {items.map((it) => (
        <group key={it.id} position={it.pos} rotation={[0, it.rotY, 0]} scale={it.scale}>
          <group onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); onSelect(it.id); }}>
            <MoleculeGroup spec={moleculeByFormula(it.formula)!} scale={1.1} spin={false} position={[0, 0, 0]} />
            <mesh>
              <sphereGeometry args={[1.05, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
          {grabbingId === it.id && <Ring color="#34d399" radius={1.0} />}
          {selectedId === it.id && grabbingId !== it.id && <Ring color="#38e1ff" />}
          {hoverId === it.id && selectedId !== it.id && grabbingId !== it.id && <Ring color="#facc15" radius={0.78} />}
        </group>
      ))}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.9, 0]}
        onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); onPlace([e.point.x, 0.05, e.point.z]); }}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

// ------------------------------------------------------------------
// page
// ------------------------------------------------------------------

type TrackState = "idle" | "loading" | "ready" | "error";

export function ARLab({ nav, initialElement }: { nav: Nav; initialElement?: string }) {
  const [mode, setMode] = useState<"detecting" | "ar" | "sim">("detecting");
  const [element, setElement] = useState(initialElement && ELEMENT_SPECIES[initialElement] ? initialElement : "H");
  const [items, setItems] = useState<PlacedItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [grabbingId, setGrabbingId] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [trackState, setTrackState] = useState<TrackState>("idle");
  const [trackMsg, setTrackMsg] = useState("");
  const [handOn, setHandOn] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<THREE.Camera | null>(null);
  const envRef = useRef({ intensity: 0.85, warm: 0.4 });

  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const selectedIdRef = useRef(selectedId);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  const hoverRef = useRef<number | null>(null);
  const grabRef = useRef<number | null>(null);
  const twoHandRef = useRef<{ id: number; d0: number; a0: number; s0: number; r0: number } | null>(null);

  // ---------- camera ----------
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-camera");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (videoRef.current) videoRef.current.srcObject = stream;
        setMode("ar");
      } catch {
        if (!cancelled) setMode("sim");
      }
    })();
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  // ---------- light estimation ----------
  useEffect(() => {
    if (mode !== "ar") { envRef.current = { intensity: 0.85, warm: 0.4 }; return; }
    const iv = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      const s = sampleLight(v);
      if (s) envRef.current = s;
    }, 650);
    return () => clearInterval(iv);
  }, [mode]);

  // ---------- gesture engine ----------
  const processHands = useCallback((frame: HandFrame, map: (x: number, y: number) => { x: number; y: number }) => {
    const cam = camRef.current, box = containerRef.current;
    if (!cam || !box) return;

    const hands = frame.hands.map((h) => ({
      ...h,
      px: map(h.pinchPoint.x, h.pinchPoint.y),
      palmPx: map(h.palm.x, h.palm.y),
    }));

    const nearestTo = (p: { x: number; y: number }, maxD: number): number | null => {
      let best: { id: number; d: number } | null = null;
      for (const it of itemsRef.current) {
        const sp = worldToScreen(it.pos, cam, box);
        if (sp.behind) continue;
        const d = Math.hypot(sp.x - p.x, sp.y - p.y);
        if (d < maxD && (!best || d < best.d)) best = { id: it.id, d };
      }
      return best?.id ?? null;
    };

    const grabbingHand = hands.find((h) => h.grabbing);

    if (grabbingHand) {
      twoHandRef.current = null;
      // acquire a grab target once
      if (grabRef.current == null) {
        const hit = nearestTo(grabbingHand.px, 160) ?? nearestTo(grabbingHand.px, 400);
        if (hit != null) {
          grabRef.current = hit;
          setGrabbingId(hit);
          setSelectedId(hit);
        }
      }
      // drag the held atom through the ground plane
      if (grabRef.current != null) {
        const t = screenToPlaneY(grabbingHand.px, cam, box, 0.05);
        if (t && itemsRef.current.some((i) => i.id === grabRef.current)) {
          const gid = grabRef.current;
          setItems((arr) => arr.map((i) => i.id === gid
            ? { ...i, pos: [i.pos[0] + (t[0] - i.pos[0]) * 0.45, 0.05, i.pos[2] + (t[2] - i.pos[2]) * 0.45] }
            : i));
        } else if (grabRef.current != null && !itemsRef.current.some((i) => i.id === grabRef.current)) {
          grabRef.current = null;
          setGrabbingId(null);
        }
      }
      if (hoverRef.current !== null) { hoverRef.current = null; setHoverId(null); }
      return;
    }

    // released
    if (grabRef.current != null) { grabRef.current = null; setGrabbingId(null); }

    // hover feedback (nearest atom glows amber)
    let hv: number | null = null;
    if (hands[0]) hv = nearestTo(hands[0].px, 130);
    if (hv !== hoverRef.current) { hoverRef.current = hv; setHoverId(hv); }

    // two-hand transform: distance → scale, twist → rotate
    if (hands.length === 2) {
      const a = hands[0].palmPx, b = hands[1].palmPx;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      let target = itemsRef.current.find((i) => i.id === selectedIdRef.current) ?? null;
      if (!target) {
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const hit = nearestTo(mid, 260);
        if (hit != null) target = itemsRef.current.find((i) => i.id === hit) ?? null;
      }
      if (target) {
        const th = twoHandRef.current;
        if (!th || th.id !== target.id) {
          twoHandRef.current = { id: target.id, d0: Math.max(70, d), a0: ang, s0: target.scale, r0: target.rotY };
        } else {
          const s = clampN(th.s0 * (d / th.d0), 0.45, 2.4);
          const r = th.r0 - (ang - th.a0) * 1.6;
          setItems((arr) => arr.map((i) => (i.id === th.id ? { ...i, scale: s, rotY: r } : i)));
          setSelectedId(th.id);
        }
      }
    } else {
      twoHandRef.current = null;
    }
  }, []);

  const drawOverlay = useCallback((frame: HandFrame, map: (x: number, y: number) => { x: number; y: number }) => {
    const cv = overlayRef.current, box = containerRef.current;
    if (!cv || !box) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = box.clientWidth, h = box.clientHeight;
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    for (const hand of frame.hands) {
      const pts = hand.points.map((p) => map(p.x, p.y));
      const color = hand.grabbing ? "#34d399" : "#38e1ff";

      // skeleton
      ctx.strokeStyle = hand.grabbing ? "rgba(52,211,153,0.85)" : "rgba(56,225,255,0.65)";
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.moveTo(pts[a].x, pts[a].y);
        ctx.lineTo(pts[b].x, pts[b].y);
      }
      ctx.stroke();

      // joints
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(230,250,255,0.9)";
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill(); }
      // emphasized fingertips
      ctx.fillStyle = color;
      for (const j of [4, 8]) { ctx.beginPath(); ctx.arc(pts[j].x, pts[j].y, 4.5, 0, Math.PI * 2); ctx.fill(); }

      // pinch cursor
      const px = map(hand.pinchPoint.x, hand.pinchPoint.y);
      const r = 16 - Math.min(12, hand.pinchRatio * 12);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(px.x, px.y, r, 0, Math.PI * 2);
      ctx.stroke();
      if (hand.grabbing) {
        ctx.fillStyle = "rgba(52,211,153,0.9)";
        ctx.beginPath(); ctx.arc(px.x, px.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }, []);

  // ---------- hand tracker lifecycle ----------
  useEffect(() => {
    if (mode !== "ar" || !handOn) {
      setTrackState("idle");
      grabRef.current = null; twoHandRef.current = null;
      setGrabbingId(null); setHoverId(null); hoverRef.current = null;
      const cv = overlayRef.current;
      cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
      return;
    }
    let alive = true;
    let raf = 0;
    const tracker = new HandTracker();
    setTrackState("loading");
    setTrackMsg("Loading tracking runtime…");

    tracker.init(setTrackMsg).then((ok) => {
      if (!alive) { tracker.dispose(); return; }
      if (!ok) { setTrackState("error"); return; }
      setTrackState("ready");
      setTrackMsg("");
      const loop = () => {
        const v = videoRef.current, box = containerRef.current;
        if (v && box) {
          const f = tracker.detect(v);
          if (f) {
            const map = makeVideoMapper(v, box);
            processHands(f, map);
            drawOverlay(f, map);
          }
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      tracker.dispose();
      grabRef.current = null; twoHandRef.current = null;
      setGrabbingId(null); setHoverId(null); hoverRef.current = null;
    };
  }, [mode, handOn, processHands, drawOverlay]);

  // ---------- ui helpers ----------
  const species = ELEMENT_SPECIES[element];
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const addAtom = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.8 + Math.random() * 1.8;
    const item: PlacedItem = {
      id: nextId++,
      formula: species,
      pos: [Math.cos(angle) * r, 0.05, Math.sin(angle) * r - 0.6],
      rotY: Math.random() * Math.PI * 2,
      scale: 1,
    };
    setItems((arr) => [...arr, item]);
    setSelectedId(item.id);
  }, [species]);

  const updateSelected = (patch: Partial<PlacedItem>) => {
    if (!selected) return;
    setItems((arr) => arr.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  const nudge = (dx: number, dz: number) => {
    if (!selected) return;
    updateSelected({ pos: [selected.pos[0] + dx, selected.pos[1], selected.pos[2] + dz] });
  };

  const removeSelected = () => {
    if (!selected) return;
    if (grabRef.current === selected.id) { grabRef.current = null; setGrabbingId(null); }
    setItems((arr) => arr.filter((i) => i.id !== selected.id));
    setSelectedId(null);
  };

  const combineAll = () => {
    const seed: Record<string, number> = {};
    for (const it of items) seed[it.formula] = (seed[it.formula] ?? 0) + 1;
    nav({ page: "lab", seed });
  };

  // ---------- AR snapshot ----------
  const capture = useCallback(() => {
    const box = containerRef.current;
    if (!box) return;
    const rectW = box.clientWidth, rectH = box.clientHeight;
    const glCanvas = box.querySelector("canvas:not([data-overlay])") as HTMLCanvasElement | null;

    const out = document.createElement("canvas");
    out.width = rectW * 2; out.height = rectH * 2;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);

    const v = videoRef.current;
    if (mode === "ar" && v && v.readyState >= 2 && v.videoWidth > 0) {
      const vw = v.videoWidth, vh = v.videoHeight;
      const scale = Math.max(rectW / vw, rectH / vh);
      const w = vw * scale, h = vh * scale;
      ctx.save();
      ctx.translate(rectW, 0); ctx.scale(-1, 1);      // mirror, like the live view
      ctx.drawImage(v, (rectW - w) / 2, (rectH - h) / 2, w, h);
      ctx.restore();
      const grd = ctx.createLinearGradient(0, rectH * 0.55, 0, rectH);
      grd.addColorStop(0, "rgba(2,6,16,0)"); grd.addColorStop(1, "rgba(2,6,16,0.45)");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, rectW, rectH);
    } else {
      const grd = ctx.createLinearGradient(0, 0, 0, rectH);
      grd.addColorStop(0, "#081226"); grd.addColorStop(1, "#030712");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, rectW, rectH);
    }

    if (glCanvas) ctx.drawImage(glCanvas, 0, 0, rectW, rectH);
    if (overlayRef.current && trackState === "ready") ctx.drawImage(overlayRef.current, 0, 0, rectW, rectH);

    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.fillStyle = "rgba(56,225,255,0.85)";
    ctx.fillText("AR CHEMISTRY LAB", 14, rectH - 14);

    out.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "ar-chemistry-lab.png";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast("AR snapshot captured", "Saved as ar-chemistry-lab.png");
    }, "image/png");
  }, [mode, trackState]);

  const selInfo = useMemo(() => {
    if (!selected) return null;
    const spec = moleculeByFormula(selected.formula)!;
    const firstEl = Object.keys(compositionOf(spec))[0];
    return { spec, el: elementBySymbol(firstEl)! };
  }, [selected]);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[1500px] flex-col px-4 pt-20 pb-4 sm:px-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ScanEye size={17} className="text-cyan-300" />
            <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">AR CHEMISTRY LAB</h2>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {mode === "ar" ? "Your hands are the controller — pinch to grab an atom." : "Place an element in your environment, then combine."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "ar" ? (
            <>
              <Tag color="#34d399"><Video size={10} /> AR Mode — camera live</Tag>
              {trackState === "ready" && <Tag color="#34d399"><Hand size={10} /> Hand control ON</Tag>}
              {trackState === "loading" && <Tag color="#facc15"><Loader2 size={10} className="animate-spin" /> {trackMsg || "Hand tracking…"}</Tag>}
              {trackState === "error" && <Tag color="#94a3b8"><Hand size={10} /> Hand tracking unavailable</Tag>}
              {(trackState === "ready" || !handOn) && (
                <button
                  onClick={() => setHandOn((o) => !o)}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider transition ${handOn ? "border-emerald-300/40 text-emerald-300" : "border-slate-600/40 text-slate-400 hover:text-slate-200"}`}
                  title="Toggle hand control"
                >
                  {handOn ? "HANDS ON" : "HANDS OFF"}
                </button>
              )}
            </>
          ) : mode === "sim" ? (
            <Tag color="#fb923c"><VideoOff size={10} /> AR unavailable — Simulation Mode active</Tag>
          ) : (
            <Tag color="#94a3b8">Detecting sensors…</Tag>
          )}
        </div>
      </div>

      {/* viewport */}
      <div ref={containerRef} className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#050c1a]">
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${mode === "ar" ? "opacity-100" : "opacity-0"}`}
          style={{ transform: "scaleX(-1)" }}
        />
        {mode === "ar" && <div className="absolute inset-0 bg-gradient-to-t from-[#020610]/60 via-transparent to-[#020610]/40" />}

        <Canvas dpr={[1, 2]} camera={{ position: [0, 2.2, 6.4], fov: 45 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} style={{ background: "transparent" }}>
          <ARScene
            items={items}
            selectedId={selectedId}
            hoverId={hoverId}
            grabbingId={grabbingId}
            sim={mode !== "ar"}
            onSelect={setSelectedId}
            onPlace={(p) => (selected ? updateSelected({ pos: p }) : undefined)}
            camRef={camRef}
            envRef={envRef}
          />
          <OrbitControls makeDefault enablePan={false} minDistance={2.6} maxDistance={14} maxPolarAngle={Math.PI * 0.55} />
        </Canvas>

        {/* hand skeleton overlay */}
        <canvas ref={overlayRef} data-overlay className="pointer-events-none absolute inset-0 h-full w-full" />

        {items.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-fadeUp">
              <ScanEye size={34} className="mx-auto text-slate-500" />
              <div className="mt-2 font-display text-sm font-bold text-slate-300">Place an element in your environment</div>
              <div className="text-[11px] text-slate-500">
                Tap <b className="text-cyan-300">＋ Add Atom</b> below{mode === "ar" && trackState === "ready" ? " — then pinch it to move it with your hand" : " — then tap the floor to move it"}.
              </div>
            </div>
          </div>
        )}

        {/* gesture guide (AR + tracking only) */}
        {mode === "ar" && trackState === "ready" && (
          <div className="absolute bottom-3 left-3 z-10 hidden w-[210px] rounded-2xl border border-cyan-300/20 bg-[#04101e]/85 p-3 backdrop-blur-md sm:block">
            <div className="font-mono text-[9px] tracking-[0.25em] text-cyan-300 uppercase">Hand Controls</div>
            <div className="mt-2 space-y-1.5 text-[10px] leading-snug text-slate-300">
              <div className="flex items-center gap-2"><Grab size={12} className="shrink-0 text-emerald-300" /> Pinch near an atom to grab & move it</div>
              <div className="flex items-center gap-2"><Scaling size={12} className="shrink-0 text-cyan-300" /> Two hands apart / closer = resize</div>
              <div className="flex items-center gap-2"><RefreshCcw size={12} className="shrink-0 text-cyan-300" /> Twist two hands = rotate</div>
              <div className="flex items-center gap-2"><MousePointer2 size={12} className="shrink-0 text-amber-300" /> Hover = highlight atom</div>
            </div>
            {grabbingId != null && (
              <div className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 font-mono text-[9px] font-bold tracking-wider text-emerald-300 uppercase animate-fadeIn">
                Grabbing — move your hand
              </div>
            )}
          </div>
        )}

        {/* selected item info chip */}
        {selInfo && (
          <div className="absolute top-3 left-3 z-10 rounded-2xl border border-cyan-300/25 bg-[#04101e]/90 px-4 py-3 backdrop-blur-md animate-fadeUp">
            <div className="font-mono text-[9px] tracking-[0.2em] text-cyan-400 uppercase">{selInfo.spec.name}</div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: selInfo.el.color }} />
              <span className="font-display text-base font-bold text-white uppercase">{selInfo.el.name}</span>
              <span className="font-mono text-xs text-slate-400">{selInfo.el.symbol} · Z={selInfo.el.number}</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              <Btn size="sm" variant="solid" onClick={() => setInfoOpen(true)}><Info size={12} /> INFO</Btn>
              <Btn size="sm" variant="danger" onClick={removeSelected}><Trash2 size={12} /> REMOVE</Btn>
            </div>
          </div>
        )}

        {/* snapshot button */}
        <button
          onClick={capture}
          title="Capture AR snapshot"
          className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full border border-cyan-300/25 bg-[#04101e]/85 px-3.5 py-2 text-[11px] font-semibold text-cyan-200 backdrop-blur-md transition hover:bg-cyan-400/20"
        >
          <Camera size={14} /> <span className="hidden sm:inline">Snapshot</span>
        </button>

        {/* manipulation controls */}
        {selected && (
          <div className="absolute right-3 bottom-3 left-3 z-10 flex flex-wrap items-center justify-center gap-2 sm:left-auto sm:w-[260px] sm:flex-col sm:items-stretch">
            <div className="glass grid grid-cols-3 gap-1 rounded-2xl p-2 sm:order-2">
              <span />
              <button onClick={() => nudge(0, -0.45)} className="rounded-lg border border-slate-600/30 p-2 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-200" title="Move forward"><ChevronUp size={15} className="mx-auto" /></button>
              <span />
              <button onClick={() => nudge(-0.45, 0)} className="rounded-lg border border-slate-600/30 p-2 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-200" title="Move left"><ChevronLeft size={15} className="mx-auto" /></button>
              <button onClick={() => nudge(0, 0.45)} className="rounded-lg border border-slate-600/30 p-2 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-200" title="Move back"><ChevronDown size={15} className="mx-auto" /></button>
              <button onClick={() => nudge(0.45, 0)} className="rounded-lg border border-slate-600/30 p-2 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-200" title="Move right"><ChevronRight size={15} className="mx-auto" /></button>
            </div>
            <div className="glass flex items-center gap-2 rounded-2xl p-2">
              <button onClick={() => updateSelected({ rotY: selected.rotY - 0.5 })} className="rounded-lg border border-slate-600/30 p-2 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-200" title="Rotate left"><RotateCcw size={14} /></button>
              <input
                type="range" min={0.5} max={2} step={0.05} value={selected.scale}
                onChange={(e) => updateSelected({ scale: Number(e.target.value) })}
                className="lab-slider w-24 sm:w-full" title="Scale"
              />
              <button onClick={() => updateSelected({ rotY: selected.rotY + 0.5 })} className="rounded-lg border border-slate-600/30 p-2 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-200" title="Rotate right"><RotateCw size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* bottom control bar */}
      <div className="glass mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">Selected</span>
          <select
            value={element}
            onChange={(e) => setElement(e.target.value)}
            className="rounded-lg border border-cyan-300/30 bg-[#04101e] px-2.5 py-1.5 text-xs font-semibold text-cyan-200 outline-none"
          >
            {Object.keys(ELEMENT_SPECIES).map((sym) => (
              <option key={sym} value={sym}>{elementBySymbol(sym)?.name} ({sym})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="solid" onClick={addAtom}><Plus size={15} /> Add Atom</Btn>
          <Btn variant="primary" onClick={combineAll} disabled={items.length === 0}><Combine size={15} /> Combine ({items.length})</Btn>
          <Btn variant="danger" onClick={() => { setItems([]); setSelectedId(null); grabRef.current = null; setGrabbingId(null); }} disabled={items.length === 0}><RefreshCcw size={14} /> Reset</Btn>
        </div>
      </div>

      {/* info modal */}
      <Modal open={infoOpen} onClose={() => setInfoOpen(false)}>
        {selInfo && (() => {
          const meta = CATEGORY_META[selInfo.el.category];
          return (
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border" style={{ background: meta.soft, borderColor: `${meta.color}55`, color: meta.color }}>
                  <span className="font-mono text-[8px]">{selInfo.el.number}</span>
                  <span className="font-display text-xl font-bold">{selInfo.el.symbol}</span>
                </div>
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">{meta.label}</div>
                  <h3 className="font-display text-2xl font-bold text-white uppercase">{selInfo.el.name}</h3>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-slate-600/25 bg-white/[0.03] px-3 py-2"><span className="text-slate-500">Atomic Number</span><br /><b className="text-white">{selInfo.el.number}</b></div>
                <div className="rounded-lg border border-slate-600/25 bg-white/[0.03] px-3 py-2"><span className="text-slate-500">Atomic Mass</span><br /><b className="text-white">{selInfo.el.mass} u</b></div>
                <div className="rounded-lg border border-slate-600/25 bg-white/[0.03] px-3 py-2"><span className="text-slate-500">Config</span><br /><b className="font-mono text-white">{selInfo.el.config}</b></div>
                <div className="rounded-lg border border-slate-600/25 bg-white/[0.03] px-3 py-2"><span className="text-slate-500">Valence e⁻</span><br /><b className="text-white">{selInfo.el.valence}</b></div>
              </div>
              <p className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-400/5 px-3 py-2.5 text-[11px] leading-relaxed text-slate-300">{selInfo.el.fact}</p>
              <Formula text={selInfo.spec.formula} className="mt-3 block text-center text-lg font-bold text-cyan-200" />
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
