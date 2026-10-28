// ------------------------------------------------------------------
// Bench — Meja Praktikum Virtual berbasis PROSEDUR
// 13 langkah tervalidasi · kurva titrasi nyata · fitur signature
// "SEE WHAT YOU CANNOT SEE" (makroskopis ↔ mikroskopis ↔ simbolik)
// ------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  ClipboardList, Lightbulb, ShieldAlert, FlaskConical, Droplets, RefreshCcw,
  Eye, CheckCircle2, ChevronRight, Timer, XCircle, Microscope, Sigma, Atom,
  Pause, Play, Sparkles, ArrowRight,
} from "lucide-react";
import type { Experiment } from "../../data/experiments";
import { EquipmentModel } from "./Equipment3D";
import { MolecularView, MOLECULAR_PHASES } from "./MolecularView";
import { Btn, Formula } from "../ui";
import { sfx } from "../../services/sound";

// ---------------- posisi & kimia ----------------

type V3 = [number, number, number];
const A = {
  zone: [0, 0.045, 0.4] as V3,
  erlenmeyer: [0, 0.05, 0.4] as V3,
  hcl: [-2.35, 0.05, -0.6] as V3,
  naoh: [-1.5, 0.05, -0.6] as V3,
  indicator: [1.15, 0.05, -0.65] as V3,
  pipette: [2.0, 0.06, 0.25] as V3,
  beaker: [2.5, 0.05, -0.5] as V3,
  waste: [-2.5, 0.045, 1.15] as V3,
};

/** kurva titrasi asam kuat–basa kuat, titik ekuivalen pada 20 tetes */
const EQ_DROPS = 20;
export const pHOf = (drops: number) =>
  drops <= EQ_DROPS
    ? 7 - 5.2 * Math.tanh((EQ_DROPS - drops) * 0.28)
    : 7 + 3.2 * Math.tanh((drops - EQ_DROPS) * 0.55);

const PINK_PH = 8.2;
const isEndpoint = (ph: number) => ph >= PINK_PH && ph <= 9.4;
const isOvershoot = (ph: number) => ph > 9.7;

const cA = new THREE.Color(), cB = new THREE.Color();
function liquidColor(indicator: boolean, ph: number, hasLiquid: boolean): string {
  if (!hasLiquid) return "#9fd4ff";
  if (!indicator) return "#a9d8ff";
  const k = Math.min(1, Math.max(0, (ph - PINK_PH) / 1.6));
  cA.set("#bfe3ff"); cB.set("#ff4fa3");
  return `#${cA.lerp(cB, k).getHexString()}`;
}

export interface RunStats {
  errors: number; attempts: number; seconds: number; stars: number;
  recordOk: boolean; analyzeOk: boolean; overshoot: number; usedHints: number;
}

// ---------------- 3D ----------------

const ZONE_LABEL: Record<string, string> = {
  "zone-bench": "AREA KERJA",
  "eq-erlenmeyer": "ERLENMEYER",
  "mat-hcl": "BOTOL HCl",
  "mat-naoh": "BOTOL NaOH",
  "zone-waste": "LIMBAH",
};

function DropZone({ id, pos, active, onDropTool, picked }: {
  id: string; pos: V3; active: boolean; onDropTool: (t: string, z: string) => void; picked: string | null;
}) {
  const [over, setOver] = useState(false);
  return (
    <Html position={pos} center zIndexRange={[30, 0]}>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const t = e.dataTransfer.getData("vlab-tool"); if (t) onDropTool(t, id); }}
        onClick={() => { if (picked) onDropTool(picked, id); }}
        className={`flex h-16 w-16 -translate-y-2 cursor-pointer items-center justify-center rounded-full border-2 border-dashed text-center font-mono text-[7px] leading-tight font-bold tracking-wider transition-all ${
          over ? "scale-110 border-emerald-300 bg-emerald-400/25 text-emerald-200"
          : active ? "demo-glow border-cyan-300/90 bg-cyan-400/15 text-cyan-200"
          : "border-slate-500/35 bg-slate-900/25 text-slate-500"
        }`}
        style={{ userSelect: "none" }}
      >
        {ZONE_LABEL[id] ?? "TARGET"}
      </div>
    </Html>
  );
}

interface SceneProps {
  placed: boolean; removed: boolean; pipette: "hcl" | "naoh" | null;
  vol: number; lcolor: string; pourSrc: string | null; pourT: number; swirlT: number;
  activeTargets: string[]; onDropTool: (t: string, z: string) => void; picked: string | null;
}

function BenchScene({ placed, removed, pipette, vol, lcolor, pourSrc, pourT, swirlT, activeTargets, onDropTool, picked }: SceneProps) {
  const erl = useRef<THREE.Group>(null!);
  const srcRefs = useRef<Record<string, THREE.Group | null>>({});
  const base: Record<string, V3> = { "mat-hcl": A.hcl, "mat-naoh": A.naoh, "mat-indicator": A.indicator, pipette: A.pipette };

  useFrame(() => {
    if (erl.current) {
      const s = swirlT > 0 ? Math.min(1, swirlT) : 0;
      erl.current.rotation.z = s > 0 ? Math.sin(s * Math.PI * 6) * 0.13 * (1 - s * 0.35) : 0;
    }
    for (const [id, g] of Object.entries(srcRefs.current)) {
      if (!g) continue;
      const b = base[id];
      if (!b) continue;
      if (pourSrc !== id) {
        g.position.lerp(new THREE.Vector3(...b), 0.2);
        g.rotation.z += (0 - g.rotation.z) * 0.2;
        continue;
      }
      const k = pourT < 0.5 ? Math.min(1, pourT / 0.32) : Math.max(0, 1 - (pourT - 0.66) / 0.34);
      const ke = Math.max(0, Math.min(1, k));
      g.position.set(b[0] + (0.34 - b[0]) * ke, b[1] + (1.38 - b[1]) * ke, b[2] + (0.46 - b[2]) * ke);
      g.rotation.z = -0.95 * ke;
    }
  });

  const streamOn = pourSrc !== null && pourT > 0.26 && pourT < 0.74;
  const streamColor = pourSrc === "mat-hcl" ? "#ffb3a3" : pourSrc === "mat-naoh" ? "#8fe3b4" : pourSrc === "mat-indicator" ? "#ffb0d9" : "#cfe6ff";

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[4, 7, 5]} intensity={1.25} color="#e6f2ff" />
      <pointLight position={[-5, 3, 4]} intensity={0.5} color="#38e1ff" />
      <fog attach="fog" args={["#04070f", 12, 26]} />

      <mesh position={[0, -0.17, 0]}>
        <boxGeometry args={[8.6, 0.34, 4.8]} />
        <meshStandardMaterial color="#101d38" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.5, 4.7]} />
        <meshStandardMaterial color="#16294e" roughness={0.8} />
      </mesh>
      <gridHelper args={[30, 30, "#16294e", "#0a1428"]} position={[0, -0.35, 0]} />
      <mesh position={[0, 0.7, -2.0]}>
        <boxGeometry args={[8.6, 0.14, 0.7]} />
        <meshStandardMaterial color="#101d38" roughness={0.7} />
      </mesh>

      {/* botol HCl (analit) */}
      <group ref={(g) => { srcRefs.current["mat-hcl"] = g; }} position={A.hcl}>
        <EquipmentModel type="bottle" liquid={{ level: 0.8, color: "#ff9d8a" }} tint="#a8503f" />
        <Html position={[0, 1.06, 0]} center zIndexRange={[20, 0]}>
          <div className="rounded-md border border-rose-300/30 bg-[#04101e]/85 px-2 py-0.5 font-mono text-[8px] font-bold whitespace-nowrap text-rose-200">HCl 0,1 M · asam</div>
        </Html>
      </group>

      {/* botol NaOH (titran) */}
      <group ref={(g) => { srcRefs.current["mat-naoh"] = g; }} position={A.naoh}>
        <EquipmentModel type="bottle" liquid={{ level: 0.8, color: "#7fd8a8" }} tint="#3f8f68" />
        <Html position={[0, 1.06, 0]} center zIndexRange={[20, 0]}>
          <div className="rounded-md border border-emerald-300/30 bg-[#04101e]/85 px-2 py-0.5 font-mono text-[8px] font-bold whitespace-nowrap text-emerald-200">NaOH 0,1 M · basa</div>
        </Html>
      </group>

      {/* indikator */}
      <group ref={(g) => { srcRefs.current["mat-indicator"] = g; }} position={A.indicator}>
        <EquipmentModel type="dropper" />
        <Html position={[0, 0.92, 0]} center zIndexRange={[20, 0]}>
          <div className="rounded-md border border-pink-300/30 bg-[#04101e]/85 px-2 py-0.5 font-mono text-[8px] font-bold whitespace-nowrap text-pink-200">Fenolftalein</div>
        </Html>
      </group>

      {/* pipet */}
      <group ref={(g) => { srcRefs.current["pipette"] = g; }} position={A.pipette} rotation={[0, 0, -0.15]}>
        <EquipmentModel type="pipette" liquid={pipette ? { level: 1, color: pipette === "hcl" ? "#ff9d8a" : "#7fd8a8" } : undefined} />
        <Html position={[0, 1.2, 0]} center zIndexRange={[20, 0]}>
          <div className="rounded-md border border-cyan-300/30 bg-[#04101e]/85 px-2 py-0.5 font-mono text-[8px] font-bold whitespace-nowrap text-cyan-200">
            Pipet{pipette ? ` · ${pipette === "hcl" ? "HCl" : "NaOH"}` : ""}
          </div>
        </Html>
      </group>

      <group position={A.beaker}><EquipmentModel type="beaker" /></group>

      {/* wadah limbah */}
      <group position={A.waste}>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.42, 0.36, 0.56, 18]} />
          <meshStandardMaterial color="#2b1d12" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.57, 0]}>
          <torusGeometry args={[0.42, 0.035, 8, 24]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.2} />
        </mesh>
        <Html position={[0, 0.92, 0]} center zIndexRange={[20, 0]}>
          <div className="rounded-md border border-amber-300/30 bg-[#04101e]/85 px-2 py-0.5 font-mono text-[8px] font-bold whitespace-nowrap text-amber-200">Wadah Limbah</div>
        </Html>
      </group>

      {/* erlenmeyer */}
      {placed && !removed && (
        <group ref={erl} position={A.erlenmeyer}>
          <EquipmentModel type="erlenmeyer" liquid={vol > 0 ? { level: vol, color: lcolor, opacity: 0.78 } : undefined} />
        </group>
      )}

      {streamOn && (
        <mesh position={[0.18, 0.98, 0.43]} rotation={[0, 0, -0.12]}>
          <cylinderGeometry args={[0.014, 0.02, 0.62, 8]} />
          <meshStandardMaterial color={streamColor} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}

      {/* zona drop aktif */}
      {activeTargets.includes("zone-bench") && <DropZone id="zone-bench" pos={A.zone} active onDropTool={onDropTool} picked={picked} />}
      {placed && !removed && <DropZone id="eq-erlenmeyer" pos={[A.erlenmeyer[0], 1.4, A.erlenmeyer[2]]} active={activeTargets.includes("eq-erlenmeyer")} onDropTool={onDropTool} picked={picked} />}
      <DropZone id="mat-hcl" pos={[A.hcl[0], 1.3, A.hcl[2]]} active={activeTargets.includes("mat-hcl")} onDropTool={onDropTool} picked={picked} />
      <DropZone id="mat-naoh" pos={[A.naoh[0], 1.3, A.naoh[2]]} active={activeTargets.includes("mat-naoh")} onDropTool={onDropTool} picked={picked} />
      <DropZone id="zone-waste" pos={[A.waste[0], 1.05, A.waste[2]]} active={activeTargets.includes("zone-waste")} onDropTool={onDropTool} picked={picked} />

      <Html position={[-3.0, 0.42, 1.9]} zIndexRange={[10, 0]}>
        <div className="rounded-lg border border-cyan-300/20 bg-[#04101e]/80 px-2.5 py-1 font-mono text-[8px] tracking-[0.2em] whitespace-nowrap text-cyan-300/80 uppercase">
          MVAR · Meja Praktikum Virtual
        </div>
      </Html>

      <OrbitControls makeDefault enablePan={false} enableZoom={false} minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.47} minAzimuthAngle={-0.55} maxAzimuthAngle={0.55} />
    </>
  );
}

// ================== BENCH ==================

export function Bench({ experiment, onComplete, onExit }: {
  experiment: Experiment; onComplete: (s: RunStats) => void; onExit: () => void;
}) {
  const steps = experiment.steps;
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];

  const [placed, setPlaced] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [pipette, setPipette] = useState<"hcl" | "naoh" | null>(null);
  const [vol, setVol] = useState(0);
  const [indicator, setIndicator] = useState(false);
  const [drops, setDrops] = useState(0);

  const [errors, setErrors] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [overshoot, setOvershoot] = useState(0);
  const [usedHints, setUsedHints] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [recordOk, setRecordOk] = useState(false);
  const [analyzeOk, setAnalyzeOk] = useState(false);

  const [feedback, setFeedback] = useState<{ kind: "ok" | "err" | "info"; text: string; safety?: boolean } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [choice, setChoice] = useState<number | null>(null);

  const [obsOpen, setObsOpen] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [sigMode, setSigMode] = useState<"macro" | "micro" | "symbolic">("micro");
  const [molT, setMolT] = useState(0.06);
  const [molPlaying, setMolPlaying] = useState(true);

  const [pourSrc, setPourSrc] = useState<string | null>(null);
  const [pourT, setPourT] = useState(0);
  const [swirlT, setSwirlT] = useState(0);
  const startRef = useRef(Date.now());

  const ph = drops > 0 || vol > 0 ? pHOf(drops) : 7;
  const hasLiquid = vol > 0;
  const lcolor = liquidColor(indicator, ph, hasLiquid);
  const pink = indicator && ph >= PINK_PH;

  // timer + animasi
  useEffect(() => {
    const iv = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
      setPourT((t) => (t > 0 ? (t >= 1 ? 0 : t + 0.16) : t));
      setSwirlT((t) => (t > 0 ? (t >= 1 ? 0 : t + 0.2) : t));
    }, 200);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => { if (pourT === 0) setPourSrc(null); }, [pourT]);

  // timeline molekuler
  useEffect(() => {
    if (!sigOpen || !molPlaying || sigMode !== "micro") return;
    const iv = setInterval(() => setMolT((t) => (t >= 1 ? 1 : t + 0.006)), 40);
    return () => clearInterval(iv);
  }, [sigOpen, molPlaying, sigMode]);

  const say = (kind: "ok" | "err" | "info", text: string, safety = false) => {
    setFeedback({ kind, text, safety });
    sfx(kind === "ok" ? "ok" : kind === "err" ? "err" : "step");
  };

  const activeTargets = useMemo(() => (step.action.kind === "drag" ? [step.action.target] : []), [step]);
  const activeTool = step.action.kind === "drag" ? step.action.tool : null;

  const advance = useCallback(() => {
    if (stepIdx + 1 >= steps.length) {
      const stars = errors === 0 ? 3 : errors <= 2 ? 2 : 1;
      sfx("complete");
      onComplete({
        errors, attempts, seconds: Math.floor((Date.now() - startRef.current) / 1000), stars,
        recordOk, analyzeOk, overshoot, usedHints,
      });
    } else {
      setStepIdx((i) => i + 1);
      setChoice(null);
    }
  }, [stepIdx, steps.length, errors, attempts, recordOk, analyzeOk, overshoot, usedHints, onComplete]);

  const startPour = (src: string) => { setPourSrc(src); setPourT(0.04); };

  // ---------- validasi drag & drop ----------
  const onDropTool = useCallback((tool: string, target: string) => {
    setPicked(null);
    if (step.action.kind !== "drag") {
      say("info", "Tahap ini bukan pemindahan alat — gunakan panel aksi di sebelah kiri.");
      return;
    }
    setAttempts((a) => a + 1);
    const want = step.action;

    if (tool !== want.tool) {
      setErrors((e) => e + 1);
      say("err", `Alat/bahan yang dipilih belum sesuai dengan langkah saat ini. ${step.wrongTool}`);
      return;
    }
    if (target !== want.target) {
      setErrors((e) => e + 1);
      say("err", `Target belum tepat. ${step.wrongTarget}`);
      return;
    }

    switch (step.id) {
      case "s1":
        setPlaced(true);
        say("ok", "Benar. Erlenmeyer terpasang di area kerja — lanjutkan ke langkah berikutnya.");
        break;
      case "s2":
        setPipette("hcl");
        say("ok", "Benar. Pipet kini berisi larutan HCl (asam).");
        break;
      case "s3":
        startPour("pipette"); setVol(0.5);
        window.setTimeout(() => setPipette(null), 1100);
        say("ok", "Benar. 20 mL HCl masuk ke Erlenmeyer — larutan sekarang bersifat asam (pH ≈ 1,8).");
        break;
      case "s4":
        startPour("mat-indicator"); setIndicator(true); setVol((v) => v + 0.03);
        say("ok", "Benar — dan perhatikan: larutan TETAP TAK BERWARNA. Itu membuktikan larutan masih asam. Fenolftalein baru merah muda dalam suasana basa.");
        break;
      case "s5":
        setPipette("naoh");
        say("ok", "Benar. Pipet kini berisi NaOH — inilah titran yang akan menetralkan asam.");
        break;
      case "s6":
        startPour("pipette"); setDrops(8); setVol((v) => Math.min(0.72, v + 0.08));
        window.setTimeout(() => setPipette(null), 1100);
        say("ok", "Benar. Netralisasi dimulai — ion OH⁻ mulai bergabung dengan ion H⁺ membentuk air.");
        break;
      case "s13":
        setRemoved(true);
        say("ok", "Benar. Limbah dibuang pada tempatnya — praktikum selesai dengan prosedur lengkap.");
        break;
      default:
        say("ok", "Benar. Lanjutkan ke langkah berikutnya.");
    }
    if (step.safety) window.setTimeout(() => say("info", step.safety!, true), 1500);
    window.setTimeout(advance, 1000);
  }, [step, advance]);

  // ---------- aksi khusus ----------
  const doSwirl = () => {
    if (step.action.kind !== "swirl") return;
    setAttempts((a) => a + 1);
    setSwirlT(0.04);
    say("ok", "Benar. Larutan tercampur homogen — perubahan warna kini dapat dibaca dengan tepat.");
    window.setTimeout(advance, 1200);
  };

  const addDrop = () => {
    if (step.action.kind !== "titrate") return;
    sfx("drop");
    const d = drops + 1;
    setDrops(d);
    setVol((v) => Math.min(0.9, v + 0.006));
    const np = pHOf(d);
    if (isEndpoint(np)) {
      setAttempts((a) => a + 1);
      say("ok", `TITIK AKHIR TERCAPAI! pH ≈ ${np.toFixed(1)} — warna merah muda muncul dan bertahan. Seluruh ion H⁺ telah dinetralkan.`);
      window.setTimeout(advance, 1900);
    } else if (isOvershoot(np)) {
      setErrors((e) => e + 1);
      setOvershoot((o) => o + 1);
      setAttempts((a) => a + 1);
      say("err", `Titik akhir TERLEWATI (pH ≈ ${np.toFixed(1)}). Warna merah muda menjadi terlalu pekat karena OH⁻ kini berlebih. Pada praktikum nyata, titrasi harus diulang. Lanjutkan untuk mempelajari dampaknya.`);
      window.setTimeout(advance, 2600);
    }
  };

  const openObserve = () => {
    if (step.action.kind !== "observe") return;
    setAttempts((a) => a + 1);
    setObsOpen(true);
  };
  const closeObserve = () => {
    setObsOpen(false);
    say("ok", "Pengamatan makroskopis tercatat. Sekarang lihat apa yang tidak bisa dilihat mata.");
    window.setTimeout(advance, 700);
  };

  const openSignature = () => {
    if (step.action.kind !== "molecular") return;
    setAttempts((a) => a + 1);
    setSigMode("micro"); setMolT(0.06); setMolPlaying(true);
    setSigOpen(true);
  };
  const closeSignature = () => {
    setSigOpen(false);
    say("ok", "Hebat — kamu sudah menghubungkan tiga tingkat representasi kimia.");
    window.setTimeout(advance, 700);
  };

  const answer = (i: number) => {
    if (step.action.kind !== "record" && step.action.kind !== "analyze") return;
    if (choice !== null) return;
    setChoice(i);
    setAttempts((a) => a + 1);
    if (i === step.action.answerIndex) {
      if (step.id === "s11") setRecordOk(true); else setAnalyzeOk(true);
      say("ok", step.id === "s11"
        ? "Benar. Larutan berubah merah muda dan terbentuk NaCl serta H₂O."
        : "Benar. Ion H⁺ dan OH⁻ bergabung membentuk air — Na⁺ dan Cl⁻ hanya ion spektator.");
      window.setTimeout(advance, 1700);
    } else {
      setErrors((e) => e + 1);
      setChoice(null);
      sfx("err");
      say("err", "Belum tepat. Tinjau kembali panel pengamatan dan tampilan tingkat molekul, lalu coba lagi.");
    }
  };

  // ---------- inventaris ----------
  const chips = useMemo(() => {
    const pipetteChip = pipette === "hcl"
      ? { id: "pipette-hcl", label: "Pipet (HCl)", color: "#ff9d8a" }
      : pipette === "naoh"
        ? { id: "pipette-naoh", label: "Pipet (NaOH)", color: "#7fd8a8" }
        : { id: "eq-pipette", label: "Pipet kosong", color: "#38e1ff" };
    return [
      { id: "eq-erlenmeyer", label: "Erlenmeyer", color: "#7fb8ff" },
      pipetteChip,
      { id: "mat-hcl-src", label: "Botol HCl", color: "#fb7185" },
      { id: "mat-naoh-src", label: "Botol NaOH", color: "#34d399" },
      { id: "mat-indicator", label: "Fenolftalein", color: "#ff6ec7" },
    ];
  }, [pipette]);

  const tgtInfo = step.action.kind === "drag"
    ? `Seret ${chips.find((c) => c.id === activeTool)?.label ?? activeTool} → ${ZONE_LABEL[step.action.target] ?? step.action.target}`
    : "Gunakan panel aksi";

  const phaseIdx = MOLECULAR_PHASES.reduce((acc, p, i) => (molT >= p.t - 0.14 ? i : acc), 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      {/* ================= PANEL PROSEDUR ================= */}
      <div className="space-y-3">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">{step.no} / {steps.length}</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <Timer size={12} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-2 flex gap-0.5">
            {steps.map((s, i) => (
              <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i < stepIdx ? "bg-emerald-400" : i === stepIdx ? "bg-cyan-400 animate-pulse" : "bg-slate-700/60"}`} />
            ))}
          </div>

          <h3 className="mt-3 font-display text-lg font-bold text-white">{step.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{step.instruction}</p>

          <details className="mt-2" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) setUsedHints((h) => h + 1); }}>
            <summary className="flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-wider text-amber-300/90 uppercase"><Lightbulb size={11} /> Petunjuk</summary>
            <p className="mt-1.5 rounded-lg border border-amber-300/20 bg-amber-400/5 px-3 py-2 text-[11px] leading-relaxed text-amber-100/90">{step.hint}</p>
          </details>

          <div className="mt-3 rounded-lg bg-black/25 px-3 py-2 font-mono text-[9px] tracking-wider text-slate-400 uppercase">{tgtInfo}</div>

          {step.concept && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-cyan-300/15 bg-cyan-400/5 px-3 py-2">
              <Atom size={12} className="mt-0.5 shrink-0 text-cyan-300" />
              <p className="text-[10px] leading-relaxed text-cyan-100/90">{step.concept}</p>
            </div>
          )}

          {step.safety && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-3 py-2">
              <ShieldAlert size={13} className="mt-0.5 shrink-0 text-rose-300" />
              <p className="text-[10px] leading-relaxed text-rose-100/90">{step.safety}</p>
            </div>
          )}
        </div>

        {/* aksi khusus */}
        {step.action.kind === "swirl" && (
          <Btn variant="primary" size="lg" className="w-full demo-glow" onClick={doSwirl}>
            <RefreshCcw size={16} /> GOJOG LARUTAN
          </Btn>
        )}

        {step.action.kind === "titrate" && (
          <div className="glass space-y-3 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">Titrasi · {drops} tetes NaOH</span>
              <span className={`font-mono text-sm font-bold ${isEndpoint(ph) ? "text-emerald-300" : isOvershoot(ph) ? "text-pink-300" : "text-cyan-200"}`}>pH {ph.toFixed(1)}</span>
            </div>
            <div className="relative h-2.5 rounded-full" style={{ background: "linear-gradient(90deg,#ff5d5d,#ff9d5d 20%,#fde047 40%,#34d399 52%,#38bdf8 70%,#a78bfa)" }}>
              <span className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-white shadow-[0_0_8px_#fff] transition-[left] duration-300" style={{ left: `${(ph / 14) * 100}%` }} />
              <span className="absolute -top-1 h-4.5 w-px bg-emerald-300/70" style={{ left: "50%", height: 18, top: -4 }} />
            </div>
            <div className={`rounded-lg border px-3 py-2 text-[10px] leading-relaxed ${pink ? "border-pink-300/40 bg-pink-400/10 text-pink-100" : "border-slate-600/30 bg-white/[0.02] text-slate-300"}`}>
              {pink
                ? "MERAH MUDA MUNCUL — asam telah habis dinetralkan. Hentikan penetesan!"
                : ph > 5.5
                  ? "Semburat merah muda mulai terlihat lalu hilang saat digojog — titik akhir sudah sangat dekat, teteskan pelan-pelan."
                  : "Larutan masih tak berwarna: ion H⁺ masih tersisa. Lanjutkan penetesan."}
            </div>
            <Btn variant="primary" size="lg" className="w-full" onClick={addDrop}>
              <Droplets size={16} /> +1 TETES NaOH
            </Btn>
          </div>
        )}

        {step.action.kind === "observe" && (
          <Btn variant="primary" size="lg" className="w-full demo-glow" onClick={openObserve}>
            <Eye size={16} /> AMATI PERUBAHAN
          </Btn>
        )}

        {step.action.kind === "molecular" && (
          <button
            onClick={openSignature}
            className="demo-glow w-full rounded-2xl border border-cyan-300/50 bg-gradient-to-r from-cyan-400/20 to-indigo-500/20 px-4 py-4 text-left transition hover:from-cyan-400/30 hover:to-indigo-500/30"
          >
            <div className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-[0.25em] text-cyan-300 uppercase">
              <Sparkles size={11} /> Fitur Signature MVAR
            </div>
            <div className="mt-1 flex items-center gap-2 font-display text-base font-bold text-white">
              <Microscope size={17} className="text-cyan-300" /> LIHAT PADA TINGKAT MOLEKUL
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-300">Saksikan ion H⁺ dan OH⁻ benar-benar bergabung membentuk air.</p>
          </button>
        )}

        {(step.action.kind === "record" || step.action.kind === "analyze") && (
          <div className="glass space-y-2 rounded-2xl p-4">
            {step.action.options.map((o, i) => (
              <button
                key={i}
                onClick={() => answer(i)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${choice === i ? "border-cyan-300/50 bg-cyan-400/10" : "border-slate-600/30 bg-white/[0.02] text-slate-200 hover:border-cyan-300/30"}`}
              >
                <span className="font-mono text-[10px] font-bold text-slate-500">{String.fromCharCode(65 + i)}. </span>{o}
              </button>
            ))}
          </div>
        )}

        {/* statistik */}
        <div className="glass rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="font-mono text-lg font-bold text-emerald-300">{Math.max(0, attempts - errors)}</div><div className="font-mono text-[8px] tracking-wider text-slate-500 uppercase">Benar</div></div>
            <div><div className="font-mono text-lg font-bold text-rose-300">{errors}</div><div className="font-mono text-[8px] tracking-wider text-slate-500 uppercase">Kesalahan</div></div>
            <div><div className="font-mono text-lg font-bold text-cyan-300">{attempts}</div><div className="font-mono text-[8px] tracking-wider text-slate-500 uppercase">Percobaan</div></div>
          </div>
        </div>

        <Btn variant="ghost" size="sm" className="w-full" onClick={onExit}>Keluar Praktikum</Btn>
      </div>

      {/* ================= MEJA 3D ================= */}
      <div className="relative min-h-[460px] overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#050c1a] xl:min-h-[580px]">
        <Canvas dpr={[1, 2]} camera={{ position: [0, 3.3, 6.0], fov: 42 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
          <BenchScene
            placed={placed} removed={removed} pipette={pipette} vol={vol} lcolor={lcolor}
            pourSrc={pourSrc} pourT={pourT} swirlT={swirlT}
            activeTargets={activeTargets} onDropTool={onDropTool} picked={picked}
          />
        </Canvas>

        {/* indikator status larutan */}
        {hasLiquid && !removed && (
          <div className="absolute top-3 left-3 z-20 rounded-xl border border-slate-600/40 bg-[#04101e]/85 px-3 py-2 backdrop-blur-md">
            <div className="font-mono text-[8px] tracking-[0.2em] text-slate-500 uppercase">Larutan dalam Erlenmeyer</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ background: lcolor }} />
              <span className="font-mono text-[11px] font-bold text-white">pH {ph.toFixed(1)}</span>
              <span className={`font-mono text-[9px] font-bold tracking-wider uppercase ${ph < 6.5 ? "text-rose-300" : ph > 7.5 ? "text-violet-300" : "text-emerald-300"}`}>
                {ph < 6.5 ? "asam" : ph > 7.5 ? "basa" : "netral"}
              </span>
            </div>
            {indicator && <div className="mt-0.5 font-mono text-[8px] text-slate-400">Fenolftalein: {pink ? "MERAH MUDA" : "tak berwarna"}</div>}
          </div>
        )}

        {/* feedback */}
        {feedback && (
          <div className={`absolute top-3 left-1/2 z-20 w-[min(540px,90%)] -translate-x-1/2 rounded-2xl border px-4 py-3 backdrop-blur-md animate-fadeUp ${
            feedback.kind === "ok" ? "border-emerald-300/40 bg-emerald-500/10"
            : feedback.kind === "err" ? "border-rose-300/40 bg-rose-500/10"
            : feedback.safety ? "border-amber-300/40 bg-amber-500/10" : "border-cyan-300/40 bg-cyan-500/10"}`}>
            <div className="flex items-start gap-2.5">
              {feedback.kind === "ok" ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" />
                : feedback.kind === "err" ? <XCircle size={17} className="mt-0.5 shrink-0 text-rose-300" />
                : feedback.safety ? <ShieldAlert size={17} className="mt-0.5 shrink-0 text-amber-300" />
                : <Lightbulb size={17} className="mt-0.5 shrink-0 text-cyan-300" />}
              <div>
                <div className={`font-mono text-[9px] font-bold tracking-[0.2em] uppercase ${
                  feedback.kind === "ok" ? "text-emerald-300" : feedback.kind === "err" ? "text-rose-300" : feedback.safety ? "text-amber-300" : "text-cyan-300"}`}>
                  {feedback.kind === "ok" ? "Benar" : feedback.kind === "err" ? "Langkah belum tepat — coba lagi" : feedback.safety ? "Perhatian — Keselamatan" : "Info"}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-100">{feedback.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* inventaris */}
        <div className="absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-center justify-center gap-1.5">
          {chips.map((c) => (
            <button
              key={c.id}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData("vlab-tool", c.id); setPicked(c.id); }}
              onClick={() => setPicked((pv) => (pv === c.id ? null : c.id))}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wide transition ${
                picked === c.id ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
                : activeTool === c.id ? "demo-glow border-cyan-300/60 bg-cyan-400/10 text-cyan-200"
                : "border-slate-600/40 bg-[#0a1428]/85 text-slate-300 hover:border-cyan-300/40"}`}
              style={{ borderLeftWidth: 3, borderLeftColor: c.color }}
            >
              <FlaskConical size={11} style={{ color: c.color }} /> {c.label}
            </button>
          ))}
        </div>

        {picked && (
          <div className="pointer-events-none absolute top-3 right-3 z-20 rounded-full border border-cyan-300/40 bg-[#04101e]/90 px-3 py-1.5 font-mono text-[9px] font-bold tracking-wider text-cyan-200 uppercase">
            Dipilih: {chips.find((c) => c.id === picked)?.label} — ketuk target
          </div>
        )}
      </div>

      {/* ================= PANEL OBSERVASI (makro) ================= */}
      {obsOpen && (
        <Overlay onClose={() => setObsOpen(false)}>
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-cyan-300" />
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase">Langkah 09 · Observasi</div>
              <h3 className="mt-0.5 font-display text-xl font-bold text-white">Apa yang terlihat oleh matamu?</h3>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: "Sebelum", c: "#bfe3ff", d: "HCl + indikator: tak berwarna" },
              { label: "Selama", c: "#ffc9e4", d: "Semburat merah muda lalu hilang" },
              { label: "Titik akhir", c: "#ff4fa3", d: "Merah muda tetap bertahan" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-600/25 p-3 text-center">
                <div className="mx-auto h-20 w-full rounded-lg border border-white/10" style={{ background: `linear-gradient(180deg, ${s.c}22, ${s.c}77)`, boxShadow: `inset 0 -10px 22px ${s.c}55` }} />
                <div className="mt-2 font-mono text-[9px] font-bold tracking-wider text-slate-400 uppercase">{s.label}</div>
                <div className="mt-0.5 text-[10px] leading-tight text-slate-300">{s.d}</div>
              </div>
            ))}
          </div>

          <ul className="mt-4 space-y-1.5">
            {experiment.observation.macro.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><ChevronRight size={12} className="mt-0.5 shrink-0 text-cyan-400" />{p}</li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-400/5 px-4 py-3">
            <div className="font-mono text-[9px] font-bold tracking-[0.2em] text-amber-300 uppercase">Catatan ilmiah</div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
              Yang barusan kamu tulis adalah OBSERVASI — fakta yang teramati. Penyebabnya belum terlihat sama sekali.
              Pertanyaan besarnya: <b className="text-amber-200">apa yang sebenarnya terjadi di dalam larutan?</b>
            </p>
          </div>

          <Btn variant="primary" size="lg" className="mt-4 w-full" onClick={closeObserve}>
            Lanjut — Cari Tahu Penyebabnya <ArrowRight size={15} />
          </Btn>
        </Overlay>
      )}

      {/* ================= SIGNATURE: SEE WHAT YOU CANNOT SEE ================= */}
      {sigOpen && (
        <Overlay wide onClose={() => setSigOpen(false)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase">
                <Sparkles size={11} /> See What You Cannot See
              </div>
              <h3 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">Netralisasi HCl + NaOH</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {([["macro", "MAKROSKOPIS", Eye], ["micro", "MIKROSKOPIS", Microscope], ["symbolic", "SIMBOLIK", Sigma]] as const).map(([m, label, Icon]) => (
                <button
                  key={m}
                  onClick={() => { setSigMode(m); sfx("tick"); }}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider transition ${sigMode === m ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-slate-600/40 text-slate-400 hover:text-slate-200"}`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* --- MAKROSKOPIS --- */}
          {sigMode === "macro" && (
            <div className="mt-5 animate-fadeUp">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[260px_1fr]">
                <div className="relative overflow-hidden rounded-2xl border border-slate-600/25 bg-gradient-to-b from-[#0a1830] to-[#04101e] p-5">
                  <div className="mx-auto h-40 w-28 rounded-b-[3rem] rounded-t-lg border-2 border-white/15" style={{ background: `linear-gradient(180deg, transparent 22%, ${lcolor}bb 22%)` }} />
                  <div className="mt-3 text-center font-mono text-[10px] tracking-wider text-slate-400 uppercase">yang terlihat mata</div>
                  <div className="mt-0.5 text-center text-sm font-bold text-white">{pink ? "Merah muda" : "Tak berwarna"}</div>
                </div>
                <div>
                  <ul className="space-y-1.5">
                    {experiment.observation.macro.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><ChevronRight size={12} className="mt-0.5 shrink-0 text-cyan-400" />{p}</li>
                    ))}
                  </ul>
                  <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-300">
                    Perubahan warna hanyalah <b className="text-cyan-200">tanda</b>. Buka tab MIKROSKOPIS untuk melihat penyebab sebenarnya.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- MIKROSKOPIS (inti fitur) --- */}
          {sigMode === "micro" && (
            <div className="mt-5 animate-fadeUp">
              <MolecularView progress={molT} className="h-[300px] sm:h-[360px]" />

              {/* timeline */}
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => setMolPlaying((v) => !v)} className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 p-2 text-cyan-200 transition hover:bg-cyan-400/20" title={molPlaying ? "Jeda" : "Putar"}>
                  {molPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.005} value={molT}
                  onChange={(e) => { setMolT(Number(e.target.value)); setMolPlaying(false); }}
                  className="lab-slider flex-1"
                />
                <button onClick={() => { setMolT(0.06); setMolPlaying(true); }} className="rounded-lg border border-slate-600/40 p-2 text-slate-300 transition hover:text-white" title="Ulang">
                  <RefreshCcw size={14} />
                </button>
              </div>

              {/* fase */}
              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {MOLECULAR_PHASES.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => { setMolT(p.t); setMolPlaying(false); sfx("tick"); }}
                    className={`rounded-xl border px-2.5 py-2 text-left transition ${i === phaseIdx ? "border-cyan-300/60 bg-cyan-400/12" : "border-slate-600/30 hover:border-cyan-300/30"}`}
                  >
                    <div className={`font-mono text-[9px] font-bold tracking-wider ${i === phaseIdx ? "text-cyan-200" : "text-slate-400"}`}>{p.label}</div>
                  </button>
                ))}
              </div>
              <p className="mt-2.5 rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-4 py-3 text-xs leading-relaxed text-slate-200 animate-fadeIn" key={phaseIdx}>
                {MOLECULAR_PHASES[phaseIdx].desc}
              </p>

              {/* legenda */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[["H⁺", "#ff5d5d", "ion hidrogen (asam)"], ["OH⁻", "#38bdf8", "ion hidroksida (basa)"], ["Na⁺", "#a78bfa", "ion spektator"], ["Cl⁻", "#22c55e", "ion spektator"], ["H₂O", "#cfe6ff", "produk netralisasi"]].map(([l, c, d]) => (
                  <span key={l} className="flex items-center gap-1.5 rounded-full border border-slate-600/35 bg-white/[0.02] px-2.5 py-1 text-[9px] text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /> <b className="text-slate-100">{l}</b> · {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* --- SIMBOLIK --- */}
          {sigMode === "symbolic" && (
            <div className="mt-5 animate-fadeUp">
              <div className="rounded-2xl border border-cyan-300/20 bg-[#04101e]/70 p-6 text-center">
                <div className="font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">Persamaan molekuler</div>
                <Formula text={experiment.observation.symbolic.equation} className="mt-1.5 block text-2xl font-bold text-white sm:text-3xl" />

                <div className="mx-auto mt-4 max-w-lg rounded-xl border border-slate-600/30 bg-white/[0.02] p-3">
                  <div className="font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">Persamaan ion lengkap</div>
                  <div className="mt-1 font-mono text-sm text-slate-200">H⁺ + Cl⁻ + Na⁺ + OH⁻ → Na⁺ + Cl⁻ + H₂O</div>
                </div>

                <div className="mx-auto mt-3 max-w-sm rounded-xl border border-pink-300/30 bg-pink-400/8 p-3">
                  <div className="font-mono text-[9px] tracking-[0.25em] text-pink-300 uppercase">Persamaan ion bersih</div>
                  <div className="mt-1 font-mono text-xl font-bold text-pink-100">H⁺ + OH⁻ → H₂O</div>
                  <div className="mt-1 text-[10px] text-slate-400">inilah reaksi yang baru saja kamu saksikan</div>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5">
                {experiment.observation.symbolic.points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><ChevronRight size={12} className="mt-0.5 shrink-0 text-cyan-400" />{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* jembatan tiga representasi */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {([
              ["macro", "APA YANG DIAMATI", pink ? "Larutan menjadi merah muda" : "Larutan tak berwarna", "#38e1ff"],
              ["micro", "APA YANG TERJADI", "H⁺ + OH⁻ bergabung jadi H₂O", "#34d399"],
              ["symbolic", "BAGAIMANA DITULIS", "HCl + NaOH → NaCl + H₂O", "#c084fc"],
            ] as const).map(([m, title, desc, color]) => (
              <button
                key={m}
                onClick={() => { setSigMode(m); sfx("tick"); }}
                className={`rounded-xl border px-3.5 py-2.5 text-left transition ${sigMode === m ? "bg-white/[0.06]" : "bg-white/[0.02] hover:bg-white/[0.04]"}`}
                style={{ borderColor: sigMode === m ? color : "rgba(94,120,160,0.22)" }}
              >
                <div className="font-mono text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color }}>{title}</div>
                <div className="mt-0.5 text-[11px] leading-tight text-slate-200">{desc}</div>
              </button>
            ))}
          </div>

          <Btn variant="primary" size="lg" className="mt-4 w-full" onClick={closeSignature}>
            <ClipboardList size={15} /> Saya Paham — Lanjut Mencatat Hasil
          </Btn>
        </Overlay>
      )}

    </div>
  );
}

function Overlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#020610]/88 backdrop-blur-sm" />
      <div
        className={`glass relative max-h-[90vh] w-full overflow-y-auto rounded-3xl p-6 animate-fadeUp ${wide ? "max-w-4xl" : "max-w-2xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
