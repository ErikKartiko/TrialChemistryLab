// ------------------------------------------------------------------
// Reaction animation engine — a 6-stage molecular choreography:
// REACTANTS → COLLISION → BOND BREAKING → REARRANGEMENT → PRODUCT
// Atom tracks are auto-derived from molecule data + reaction ratios.
// ------------------------------------------------------------------

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Reaction } from "../../data/reactions";
import { moleculeByFormula } from "../../data/molecules";
import { elementBySymbol } from "../../data/elements";
import { clamp01, easeInOut, smoothstep, lerpV3, makeRng, type V3 } from "./core";

const S = 0.62; // structure scale inside the animation

interface SceneAtom {
  el: string; color: string; radius: number;
  p0: V3; p1: V3; p2: V3;
  seed: number;
}
interface SceneBond { a: number; b: number; order: number; kind: "reactant" | "product" }

function placeInstances(instances: string[], shift: number): V3[] {
  const n = instances.length;
  const spacing = Math.min(2.6, 9 / Math.max(1, n));
  return instances.map((_, i) => [
    (i - (n - 1) / 2) * spacing + shift,
    i % 2 === 0 ? 0.4 : -0.35,
    i % 2 === 0 ? -0.35 : 0.4,
  ]);
}

function buildScene(reaction: Reaction): { atoms: SceneAtom[]; bonds: SceneBond[] } {
  const atoms: SceneAtom[] = [];
  const bonds: SceneBond[] = [];
  const rng = makeRng(reaction.id.length * 2654435761 % 2147483647);

  const reactantInstances = reaction.reactants.flatMap((r) => Array(r.coefficient).fill(r.formula) as string[]);
  const productInstances = reaction.products.flatMap((p) => Array(p.coefficient).fill(p.formula) as string[]);

  const rBases = placeInstances(reactantInstances, -1.5);
  const pBases = placeInstances(productInstances, 1.5);

  // ---- reactant atoms (p0) ----
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  reactantInstances.forEach((formula, inst) => {
    const spec = moleculeByFormula(formula)!;
    const base = rBases[inst];
    e.set((rng() - 0.5) * 0.9, rng() * Math.PI, (rng() - 0.5) * 0.6);
    q.setFromEuler(e);
    const offset = atoms.length;
    spec.atoms.forEach((a) => {
      const el = elementBySymbol(a.el)!;
      v.set(...a.pos).multiplyScalar(S).applyQuaternion(q);
      atoms.push({
        el: a.el, color: el.color, radius: el.radius * 0.92 * S + 0.12,
        p0: [base[0] + v.x, base[1] + v.y, base[2] + v.z],
        p1: [0, 0, 0], p2: [0, 0, 0],
        seed: rng() * 100,
      });
    });
    spec.bonds.forEach((b) => bonds.push({ a: offset + b.a, b: offset + b.b, order: b.order, kind: "reactant" }));
  });

  // ---- product targets (p2) via element-conserving greedy map ----
  const targetsByEl: Record<string, V3[]> = {};
  productInstances.forEach((formula, inst) => {
    const spec = moleculeByFormula(formula)!;
    const base = pBases[inst];
    e.set((rng() - 0.5) * 0.5, rng() * Math.PI, (rng() - 0.5) * 0.4);
    q.setFromEuler(e);
    spec.atoms.forEach((a) => {
      v.set(...a.pos).multiplyScalar(S).applyQuaternion(q);
      (targetsByEl[a.el] ||= []).push([base[0] + v.x, base[1] + v.y + 0.05, base[2] + v.z]);
    });
  });

  // ---- cloud positions (p1): golden spiral scatter around the center ----
  const n = atoms.length;
  atoms.forEach((atom, i) => {
    const theta = i * 2.39996323;
    const r = 1.45 * Math.sqrt((i + 0.5) / n);
    atom.p1 = [Math.cos(theta) * r * 1.35, Math.sin(theta) * r + 0.15, Math.cos(theta * 1.71 + 1) * 0.85];
    const t = targetsByEl[atom.el]?.shift();
    atom.p2 = t ?? [0, 0, 0];
  });

  // ---- product bonds, mapped from conserved atom order ----
  {
    const byEl: Record<string, number[]> = {};
    atoms.forEach((a, i) => (byEl[a.el] ||= []).push(i));
    const pools: Record<string, number[]> = {};
    for (const k of Object.keys(byEl)) pools[k] = [...byEl[k]];
    productInstances.forEach((formula) => {
      const spec = moleculeByFormula(formula)!;
      const idxPool: Record<string, number[]> = {};
      const localIdx: number[] = spec.atoms.map((a) => {
        // consume product atoms in the same order they were queued above
        idxPool[a.el] ||= pools[a.el];
        return idxPool[a.el].shift()!;
      });
      spec.bonds.forEach((b) => bonds.push({ a: localIdx[b.a], b: localIdx[b.b], order: b.order, kind: "product" }));
    });
  }

  return { atoms, bonds };
}

export const stageOf = (t: number) =>
  t < 0.14 ? 0 : t < 0.42 ? 1 : t < 0.62 ? 2 : t < 0.88 ? 3 : t < 0.985 ? 4 : 5;

const UP = new THREE.Vector3(0, 1, 0);

function atomPosAt(atom: SceneAtom, t: number, time: number, out: THREE.Vector3) {
  let p: V3;
  if (t < 0.42) p = lerpV3(atom.p0, atom.p1, easeInOut((t - 0.13) / 0.29));
  else p = lerpV3(atom.p1, atom.p2, easeInOut((t - 0.60) / 0.27));

  out.set(p[0], p[1], p[2]);

  const idle = 1 - smoothstep(0.08, 0.2, t);
  if (idle > 0) out.y += Math.sin(time * 1.4 + atom.seed) * 0.09 * idle;

  const shakeWin = Math.sin(Math.PI * clamp01((t - 0.40) / 0.24));
  if (shakeWin > 0.01) {
    const amp = 0.16 * shakeWin;
    out.x += Math.sin(time * 21 + atom.seed * 7) * amp;
    out.y += Math.cos(time * 19 + atom.seed * 13) * amp * 0.8;
    out.z += Math.sin(time * 17 + atom.seed * 3) * amp * 0.6;
  }

  const settle = smoothstep(0.9, 0.99, t);
  if (settle > 0) out.y += Math.sin(time * 1.1 + atom.seed) * 0.05 * settle;
}

interface InnerProps {
  reaction: Reaction;
  playing: boolean;
  runId: number;
  duration: number;
  onStage: (i: number) => void;
  onComplete: () => void;
}

function ReactionInner({ reaction, playing, runId, duration, onStage, onComplete }: InnerProps) {
  const { atoms, bonds } = useMemo(() => buildScene(reaction), [reaction]);
  const atomRefs = useRef<THREE.Mesh[]>([]);
  const bondRefs = useRef<THREE.Group[]>([]);
  const flashRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const progress = useRef(0);
  const lastStage = useRef(-1);
  const completed = useRef(false);
  const tmp = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const perp = useRef(new THREE.Vector3());

  useEffect(() => {
    progress.current = 0;
    lastStage.current = -1;
    completed.current = false;
  }, [runId, reaction]);

  useEffect(() => {
    if (bondRefs.current.length === 0) return;
  }, []);

  useFrame(({ clock }, dt) => {
    const time = clock.getElapsedTime();
    if (playing && progress.current < 1) {
      progress.current = Math.min(1, progress.current + dt / duration);
    }
    const t = progress.current;

    const stage = stageOf(t);
    if (stage !== lastStage.current) {
      lastStage.current = stage;
      onStage(stage);
    }
    if (t >= 1 && !completed.current) {
      completed.current = true;
      onComplete();
    }

    atoms.forEach((a, i) => {
      const mesh = atomRefs.current[i];
      if (!mesh) return;
      atomPosAt(a, t, time, tmp.current);
      mesh.position.copy(tmp.current);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const hot = Math.sin(Math.PI * clamp01((t - 0.40) / 0.26));
      const proud = smoothstep(0.88, 0.98, t);
      mat.emissiveIntensity = 0.14 + hot * 0.85 + proud * 0.35;
    });

    bonds.forEach((b, bi) => {
      const g = bondRefs.current[bi];
      if (!g) return;
      const strength = b.kind === "reactant"
        ? 1 - smoothstep(0.44, 0.60, t)
        : smoothstep(0.80, 0.93, t);
      g.visible = strength > 0.02;
      if (!g.visible) return;

      const a = atomRefs.current[b.a].position;
      const c = atomRefs.current[b.b].position;
      dir.current.subVectors(c, a);
      const len = dir.current.length();
      dir.current.normalize();

      g.children.forEach((mesh, k) => {
        // multi-bond offsets
        const spreads = b.order === 1 ? [0] : b.order === 2 ? [-0.13, 0.13] : [-0.16, 0, 0.16];
        perp.current.set(dir.current.y, dir.current.z, dir.current.x).cross(dir.current).normalize().multiplyScalar(spreads[k] ?? 0);
        mesh.position.copy(a).add(c).multiplyScalar(0.5).add(perp.current);
        mesh.quaternion.setFromUnitVectors(UP, dir.current);
        mesh.scale.set(Math.max(0.2, strength), len, Math.max(0.2, strength));
        const m = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
        m.opacity = 0.85 * strength;
      });
    });

    // energy flash for exothermic reactions
    if (flashRef.current) {
      const f = smoothstep(0.47, 0.55, t) * (1 - smoothstep(0.56, 0.85, t));
      const grow = easeInOut(clamp01((t - 0.47) / 0.38));
      flashRef.current.visible = f > 0.01 && reaction.energyType === "Exothermic";
      flashRef.current.scale.setScalar(0.3 + grow * 5.2);
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = 0.30 * f;
      if (lightRef.current) lightRef.current.intensity = f * 90;
    }
  });

  atomRefs.current = [];
  bondRefs.current = [];

  return (
    <group>
      {atoms.map((a, i) => (
        <mesh key={i} ref={(m) => { if (m) atomRefs.current[i] = m; }}>
          <sphereGeometry args={[a.radius, 24, 24]} />
          <meshStandardMaterial color={a.color} emissive={a.color} emissiveIntensity={0.14} roughness={0.28} />
        </mesh>
      ))}
      {bonds.map((b, bi) => (
        <group key={bi} ref={(g) => { if (g) bondRefs.current[bi] = g; }}>
          {Array.from({ length: b.order }).map((_, k) => (
            <mesh key={k}>
              <cylinderGeometry args={[b.order === 1 ? 0.075 : 0.055, b.order === 1 ? 0.075 : 0.055, 1, 10]} />
              <meshStandardMaterial
                color={b.kind === "reactant" ? "#dcecff" : "#8ff2ff"}
                emissive={b.kind === "reactant" ? "#9cc8ff" : "#38e1ff"}
                emissiveIntensity={0.35}
                transparent
                opacity={0.85}
              />
            </mesh>
          ))}
        </group>
      ))}
      {/* shockwave flash */}
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[1, 28, 28]} />
        <meshBasicMaterial color="#ffb45e" transparent opacity={0} wireframe />
      </mesh>
      <pointLight ref={lightRef} color="#ffc27a" intensity={0} distance={18} decay={2} />
    </group>
  );
}

interface ReactionSceneProps {
  reaction: Reaction;
  playing: boolean;
  runId: number;
  duration?: number;
  onStage?: (i: number) => void;
  onComplete?: () => void;
  className?: string;
}

export function ReactionScene({
  reaction, playing, runId, duration = 14, onStage = () => {}, onComplete = () => {}, className = "",
}: ReactionSceneProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 1.1, 10.4], fov: 40 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 6]} intensity={1.2} color="#dff2ff" />
        <pointLight position={[-6, -3, 4]} intensity={0.5} color="#38e1ff" />
        <fog attach="fog" args={["#04070f", 15, 30]} />
        <gridHelper args={[40, 40, "#1c3a68", "#0c1936"]} position={[0, -3.2, 0]} />
        <ReactionInner reaction={reaction} playing={playing} runId={runId} duration={duration} onStage={onStage} onComplete={onComplete} />
        <OrbitControls makeDefault enablePan={false} enableZoom={false} minPolarAngle={Math.PI * 0.28} maxPolarAngle={Math.PI * 0.62} />
      </Canvas>
    </div>
  );
}
