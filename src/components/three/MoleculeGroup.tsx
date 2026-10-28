// ------------------------------------------------------------------
// Ball-and-stick molecule — generated from MoleculeSpec data.
// Supports smooth DECOMPOSE animation (atoms drift apart, bonds fade).
// Swap-ready: replace the geometry builders with .glb loaders later.
// ------------------------------------------------------------------

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { MoleculeSpec } from "../../data/molecules";
import { elementBySymbol } from "../../data/elements";
import { easeInOut, makeRng } from "./core";

const UP = new THREE.Vector3(0, 1, 0);
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const tmpPerp = new THREE.Vector3();

interface MoleculeGroupProps {
  spec: MoleculeSpec;
  scale?: number;        // structure scale
  spin?: boolean;
  decompose?: boolean;   // drive explode animation
  atomScale?: number;
  position?: [number, number, number];
  labels?: boolean;      // tampilkan label simbol atom
  showBonds?: boolean;   // tampilkan batang ikatan
}

export function MoleculeGroup({
  spec, scale = 1, spin = true, decompose = false, atomScale = 1, position = [0, 0, 0],
  labels = false, showBonds = true,
}: MoleculeGroupProps) {
  const group = useRef<THREE.Group>(null!);
  const atomRefs = useRef<THREE.Mesh[]>([]);
  const bondRefs = useRef<THREE.Group[]>([]);
  const explode = useRef(0);

  const data = useMemo(() => {
    const rng = makeRng(spec.formula.length * 887 + spec.atoms.length * 31);
    const atoms = spec.atoms.map((a, i) => {
      const el = elementBySymbol(a.el)!;
      const p = new THREE.Vector3(...a.pos).multiplyScalar(scale);
      // decompose target: push outward from centroid + deterministic jitter
      const dir = p.lengthSq() > 0.001 ? p.clone().normalize() : new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
      const spread = p.clone().add(dir.multiplyScalar(2.6 * scale))
        .add(new THREE.Vector3((rng() - 0.5) * 0.7, (rng() - 0.5) * 0.7, (rng() - 0.5) * 0.7));
      return { el, base: p, spread, radius: el.radius * 0.85 * Math.min(scale, 1) * atomScale, seed: i * 1.618 + rng() * 3 };
    });
    const bonds = spec.bonds.map((b) => ({ ...b }));
    return { atoms, bonds };
  }, [spec, scale, atomScale]);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    explode.current += ((decompose ? 1 : 0) - explode.current) * Math.min(1, dt * 2.2);
    const e = easeInOut(Math.min(1, Math.max(0, explode.current)));

    if (spin && group.current && e < 0.4) group.current.rotation.y = t * 0.32;

    // atoms
    data.atoms.forEach((a, i) => {
      const mesh = atomRefs.current[i];
      if (!mesh) return;
      mesh.position.lerpVectors(a.base, a.spread, e);
      if (e > 0.02) {
        mesh.position.y += Math.sin(t * 1.4 + a.seed) * 0.08 * e;
        mesh.position.x += Math.cos(t * 1.1 + a.seed * 2) * 0.06 * e;
      }
    });

    // bonds
    data.bonds.forEach((b, bi) => {
      const g = bondRefs.current[bi];
      if (!g) return;
      const a = atomRefs.current[b.a]?.position ?? tmpA.set(0, 0, 0);
      const c = atomRefs.current[b.b]?.position ?? tmpB.set(0, 0, 0);
      tmpDir.subVectors(c, a);
      const len = tmpDir.length();
      tmpDir.normalize();
      g.children.forEach((mesh, k) => {
        const off = bondOffset(tmpDir, b.order, k);
        mesh.position.copy(a).add(c).multiplyScalar(0.5).add(off);
        mesh.quaternion.setFromUnitVectors(UP, tmpDir);
        mesh.scale.set(1, len, 1);
        const m = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
        m.opacity = 0.85 * (1 - e);
      });
      g.visible = e < 0.97;
    });
  });

  atomRefs.current = [];
  bondRefs.current = [];

  return (
    <group position={position}>
      <group ref={group}>
        {data.atoms.map((a, i) => (
          <mesh key={i} ref={(m) => { if (m) atomRefs.current[i] = m; }}>
            <sphereGeometry args={[a.radius, 28, 28]} />
            <meshStandardMaterial
              color={a.el.color}
              emissive={a.el.color}
              emissiveIntensity={0.14}
              roughness={0.28}
              metalness={a.el.category.includes("metal") ? 0.55 : 0.1}
            />
            {labels && (
              <Html position={[0, a.radius + 0.28, 0]} center zIndexRange={[20, 0]}>
                <span
                  className="rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold whitespace-nowrap"
                  style={{ color: a.el.color, borderColor: `${a.el.color}66`, background: "rgba(4,12,24,0.85)" }}
                >
                  {a.el.symbol} · {a.el.name}
                </span>
              </Html>
            )}
          </mesh>
        ))}
        {showBonds && data.bonds.map((b, bi) => (
          <group key={bi} ref={(g) => { if (g) bondRefs.current[bi] = g; }}>
            {Array.from({ length: b.order }).map((_, k) => (
              <mesh key={k}>
                <cylinderGeometry args={[b.order === 1 ? 0.085 : 0.06, b.order === 1 ? 0.085 : 0.06, 1, 12]} />
                <meshStandardMaterial color="#cfe6ff" transparent opacity={0.85} emissive="#9cc8ff" emissiveIntensity={0.25} roughness={0.4} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

const orderSpread = (order: number) => (order === 1 ? [0] : order === 2 ? [-0.14, 0.14] : [-0.17, 0, 0.17]);

function bondOffset(dir: THREE.Vector3, order: number, k: number): THREE.Vector3 {
  if (order === 1) return tmpPerp.set(0, 0, 0);
  const spread = orderSpread(order)[k] ?? 0;
  // pick a stable perpendicular
  tmpPerp.set(dir.y, dir.z, dir.x);
  tmpPerp.cross(dir).normalize().multiplyScalar(spread);
  return tmpPerp.clone();
}
