// ------------------------------------------------------------------
// "SEE WHAT YOU CANNOT SEE" — adegan 3D tingkat partikel.
// Ion H⁺ dan OH⁻ benar-benar bergabung membentuk molekul H₂O,
// sementara Na⁺ dan Cl⁻ tetap sebagai ion spektator.
// Timeline dapat diputar otomatis maupun digeser manual.
// ------------------------------------------------------------------

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { makeRng, clamp01, easeInOut, smoothstep } from "../three/core";

const C = {
  H: "#ff5d5d",
  O: "#38bdf8",
  Na: "#a78bfa",
  Cl: "#22c55e",
};

export const MOLECULAR_PHASES = [
  { t: 0.06, label: "1 · Ion terpisah", desc: "HCl → H⁺ + Cl⁻   ·   NaOH → Na⁺ + OH⁻. Semua ion bergerak bebas dalam air." },
  { t: 0.34, label: "2 · Ion bertemu", desc: "Larutan bercampur. Ion H⁺ dan OH⁻ saling mendekat karena muatan berlawanan." },
  { t: 0.60, label: "3 · Ikatan terbentuk", desc: "Setiap H⁺ bergabung dengan satu OH⁻ — terbentuk molekul air H₂O yang netral." },
  { t: 0.88, label: "4 · Setelah netralisasi", desc: "Yang tersisa: molekul H₂O, serta Na⁺ dan Cl⁻ sebagai ion spektator (garam terlarut)." },
];

interface Pair {
  // posisi awal
  hStart: THREE.Vector3;
  ohStart: THREE.Vector3;
  meet: THREE.Vector3;      // titik pertemuan
  seed: number;
  // orientasi molekul air hasil
  tilt: number;
}

interface Spect {
  kind: "Na" | "Cl";
  base: THREE.Vector3;
  seed: number;
}

function useScene() {
  return useMemo(() => {
    const rng = makeRng(20260214);
    const pairs: Pair[] = [];
    const N = 5;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      pairs.push({
        hStart: new THREE.Vector3(-2.7 - rng() * 0.9, Math.sin(a) * 1.15 + (rng() - 0.5) * 0.5, (rng() - 0.5) * 1.7),
        ohStart: new THREE.Vector3(2.7 + rng() * 0.9, Math.cos(a) * 1.15 + (rng() - 0.5) * 0.5, (rng() - 0.5) * 1.7),
        meet: new THREE.Vector3(Math.cos(a) * 1.75, Math.sin(a * 1.3) * 1.05, Math.sin(a) * 1.1),
        seed: rng() * 100,
        tilt: rng() * Math.PI,
      });
    }
    const spectators: Spect[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.6;
      spectators.push({ kind: "Cl", base: new THREE.Vector3(Math.cos(a) * 3.15, Math.sin(a) * 1.5 + 0.3, Math.sin(a * 0.7) * 1.4), seed: rng() * 100 });
      spectators.push({ kind: "Na", base: new THREE.Vector3(Math.cos(a + 0.8) * 3.15, Math.sin(a + 0.8) * 1.5 - 0.3, Math.cos(a * 0.9) * 1.4), seed: rng() * 100 });
    }
    return { pairs, spectators };
  }, []);
}

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function Particles({ tRef, labels }: { tRef: React.MutableRefObject<number>; labels: boolean }) {
  const { pairs, spectators } = useScene();
  const hRefs = useRef<THREE.Mesh[]>([]);
  const oRefs = useRef<THREE.Mesh[]>([]);
  const h2Refs = useRef<THREE.Mesh[]>([]);      // H bawaan OH⁻
  const bondRefs = useRef<THREE.Mesh[][]>([]);
  const flashRefs = useRef<THREE.Mesh[]>([]);
  const spRefs = useRef<THREE.Mesh[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  hRefs.current = []; oRefs.current = []; h2Refs.current = []; bondRefs.current = []; flashRefs.current = []; spRefs.current = [];

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const t = tRef.current;

    // fase: 0-.3 terpisah | .3-.55 mendekat | .55-.75 bergabung | .75-1 hasil
    const approach = easeInOut(clamp01((t - 0.28) / 0.3));
    const merged = smoothstep(0.55, 0.76, t);

    pairs.forEach((p, i) => {
      const wob = (s: number, amp = 0.14) => Math.sin(time * 1.1 + s) * amp;

      // --- posisi OH⁻ (O sebagai pusat) ---
      const oMesh = oRefs.current[i];
      const hOwn = h2Refs.current[i];   // H milik OH⁻
      const hFree = hRefs.current[i];   // H⁺ bebas
      if (!oMesh || !hOwn || !hFree) return;

      v1.copy(p.ohStart).lerp(p.meet, approach);
      v1.x += wob(p.seed) * (1 - merged * 0.6);
      v1.y += wob(p.seed * 1.7, 0.11);
      oMesh.position.copy(v1);

      // H milik OH⁻ : mengorbit O, lalu menempati sudut air
      const angOwn = merged > 0 ? p.tilt + 0.92 : p.tilt + time * 0.55;
      hOwn.position.set(
        v1.x + Math.cos(angOwn) * 0.66,
        v1.y + Math.sin(angOwn) * 0.66 * 0.85 + 0.05,
        v1.z + Math.sin(angOwn * 0.8) * 0.16,
      );

      // H⁺ bebas → menuju sisi berlawanan molekul air
      v2.copy(p.hStart).lerp(p.meet, approach);
      v2.x += wob(p.seed * 2.3) * (1 - merged);
      v2.y += wob(p.seed * 0.6, 0.12) * (1 - merged);
      const angFree = p.tilt - 0.92;
      const targetX = v1.x + Math.cos(angFree) * 0.66;
      const targetY = v1.y + Math.sin(angFree) * 0.66 * 0.85 + 0.05;
      const targetZ = v1.z + Math.sin(angFree * 0.8) * 0.16;
      hFree.position.set(
        THREE.MathUtils.lerp(v2.x, targetX, merged),
        THREE.MathUtils.lerp(v2.y, targetY, merged),
        THREE.MathUtils.lerp(v2.z, targetZ, merged),
      );

      // pijar saat bergabung
      const fl = flashRefs.current[i];
      if (fl) {
        const burst = Math.sin(Math.PI * clamp01((t - 0.55) / 0.24));
        fl.visible = burst > 0.02;
        fl.position.copy(v1);
        fl.scale.setScalar(0.5 + burst * 1.7);
        (fl.material as THREE.MeshBasicMaterial).opacity = burst * 0.5;
      }

      // ikatan O–H (muncul setelah bergabung)
      const bonds = bondRefs.current[i];
      if (bonds) {
        [hOwn, hFree].forEach((hm, k) => {
          const bm = bonds[k];
          if (!bm) return;
          // ikatan H milik OH⁻ sudah ada sejak awal; ikatan H⁺ baru terbentuk
          const strength = k === 0 ? 1 : merged;
          bm.visible = strength > 0.05;
          if (!bm.visible) return;
          v2.subVectors(hm.position, v1);
          const len = v2.length();
          v2.normalize();
          bm.position.copy(v1).addScaledVector(v2, len / 2);
          bm.quaternion.setFromUnitVectors(UP, v2);
          bm.scale.set(strength, len, strength);
          (bm.material as THREE.MeshStandardMaterial).opacity = 0.75 * strength;
        });
      }

      // label ion → berubah menjadi H₂O
      const lb = labelRefs.current[i];
      if (lb) lb.textContent = merged > 0.6 ? "H₂O" : "OH⁻";
    });

    // ion spektator: hanya melayang
    spectators.forEach((s, i) => {
      const m = spRefs.current[i];
      if (!m) return;
      m.position.set(
        s.base.x + Math.sin(time * 0.55 + s.seed) * 0.3,
        s.base.y + Math.cos(time * 0.45 + s.seed * 1.4) * 0.26,
        s.base.z + Math.sin(time * 0.5 + s.seed * 0.7) * 0.24,
      );
    });
  });

  return (
    <group>
      {/* pasangan H⁺ + OH⁻ → H₂O */}
      {pairs.map((_p, i) => (
        <group key={i}>
          {/* O */}
          <mesh ref={(m) => { if (m) oRefs.current[i] = m; }}>
            <sphereGeometry args={[0.42, 26, 26]} />
            <meshStandardMaterial color={C.O} emissive={C.O} emissiveIntensity={0.25} roughness={0.3} />
            {labels && i < 3 && (
              <Html position={[0, 0.72, 0]} center zIndexRange={[20, 0]}>
                <div
                  ref={(el) => { labelRefs.current[i] = el; }}
                  className="rounded-full border border-sky-300/50 bg-[#04101e]/90 px-2 py-0.5 font-mono text-[9px] font-bold whitespace-nowrap text-sky-200"
                >OH⁻</div>
              </Html>
            )}
          </mesh>
          {/* H milik OH⁻ */}
          <mesh ref={(m) => { if (m) h2Refs.current[i] = m; }}>
            <sphereGeometry args={[0.24, 20, 20]} />
            <meshStandardMaterial color="#eef4ff" emissive="#9fb8ff" emissiveIntensity={0.2} roughness={0.3} />
          </mesh>
          {/* H⁺ bebas */}
          <mesh ref={(m) => { if (m) hRefs.current[i] = m; }}>
            <sphereGeometry args={[0.26, 20, 20]} />
            <meshStandardMaterial color={C.H} emissive={C.H} emissiveIntensity={0.55} roughness={0.25} />
            {labels && i < 3 && (
              <Html position={[0, 0.52, 0]} center zIndexRange={[20, 0]}>
                <div className="rounded-full border border-rose-300/50 bg-[#04101e]/90 px-2 py-0.5 font-mono text-[9px] font-bold whitespace-nowrap text-rose-200">H⁺</div>
              </Html>
            )}
          </mesh>
          {/* ikatan */}
          <group ref={(g) => { if (g) bondRefs.current[i] = g.children as unknown as THREE.Mesh[]; }}>
            {[0, 1].map((k) => (
              <mesh key={k}>
                <cylinderGeometry args={[0.075, 0.075, 1, 10]} />
                <meshStandardMaterial color="#cfe6ff" transparent opacity={0.75} emissive="#9cc8ff" emissiveIntensity={0.3} />
              </mesh>
            ))}
          </group>
          {/* pijar energi */}
          <mesh ref={(m) => { if (m) flashRefs.current[i] = m; }} visible={false}>
            <sphereGeometry args={[0.7, 16, 16]} />
            <meshBasicMaterial color="#ffd18a" transparent opacity={0} />
          </mesh>
        </group>
      ))}

      {/* ion spektator */}
      {spectators.map((s, i) => (
        <mesh key={i} ref={(m) => { if (m) spRefs.current[i] = m; }}>
          <sphereGeometry args={[s.kind === "Na" ? 0.34 : 0.44, 22, 22]} />
          <meshStandardMaterial color={C[s.kind]} emissive={C[s.kind]} emissiveIntensity={0.18} roughness={0.35} transparent opacity={0.82} />
          {i < 2 && (
            <Html position={[0, 0.7, 0]} center zIndexRange={[20, 0]}>
              <div className="rounded-full border border-slate-400/40 bg-[#04101e]/85 px-2 py-0.5 font-mono text-[8px] font-bold whitespace-nowrap text-slate-300">
                {s.kind === "Na" ? "Na⁺" : "Cl⁻"} · spektator
              </div>
            </Html>
          )}
        </mesh>
      ))}
    </group>
  );
}

/** wadah larutan transparan sebagai konteks ruang */
function SolutionBox() {
  return (
    <mesh>
      <boxGeometry args={[9.4, 5.2, 4.6]} />
      <meshBasicMaterial color="#38e1ff" wireframe transparent opacity={0.07} />
    </mesh>
  );
}

export function MolecularView({
  progress, labels = true, className = "",
}: { progress: number; labels?: boolean; className?: string }) {
  const tRef = useRef(progress);
  tRef.current = progress;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#04101e] ${className}`}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 1.2, 9.2], fov: 44 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.72} />
        <directionalLight position={[5, 7, 6]} intensity={1.1} color="#e6f2ff" />
        <pointLight position={[-6, -2, 4]} intensity={0.55} color="#38e1ff" />
        <SolutionBox />
        <Particles tRef={tRef} labels={labels} />
        <OrbitControls makeDefault enablePan={false} minDistance={5} maxDistance={15} maxPolarAngle={Math.PI * 0.75} />
      </Canvas>
    </div>
  );
}
