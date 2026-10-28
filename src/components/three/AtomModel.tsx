// ------------------------------------------------------------------
// Bohr-style 3D atom — nucleus (protons + neutrons), electron shells
// and orbiting electrons. Placeholder-free: generated procedurally.
// Can later be replaced by .glb assets per element.
// ------------------------------------------------------------------

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ElementData } from "../../data/elements";
import { makeRng } from "./core";

interface AtomModelProps {
  element: ElementData;
  showShells?: boolean;
  spin?: boolean;
}

export function AtomModel({ element, showShells = true, spin = true }: AtomModelProps) {
  const root = useRef<THREE.Group>(null!);
  const electronRefs = useRef<THREE.Mesh[]>([]);

  const protons = element.number;
  const neutrons = Math.max(0, Math.round(element.mass) - protons);

  const nucleons = useMemo(() => {
    const rng = makeRng(element.number * 7919);
    const total = Math.min(protons + neutrons, 56);
    const cluster = 0.18 + 0.075 * Math.cbrt(total);
    const rNucleon = total > 30 ? 0.085 : 0.105;
    const arr: { pos: [number, number, number]; proton: boolean }[] = [];
    for (let i = 0; i < total; i++) {
      // compact golden-sphere packing
      const y = 1 - (i / Math.max(1, total - 1)) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * 2.39996323;
      const jitter = () => (rng() - 0.5) * 0.22;
      arr.push({
        pos: [
          Math.cos(theta) * rad * cluster + jitter() * cluster,
          y * cluster * 0.9 + jitter() * cluster,
          Math.sin(theta) * rad * cluster + jitter() * cluster,
        ],
        proton: rng() < protons / Math.max(1, protons + neutrons),
      });
    }
    return { arr, rNucleon };
  }, [element]);

  const shells = useMemo(() => {
    return element.shells.map((count, i) => {
      const rng = makeRng(element.number * 131 + i * 17);
      return {
        count,
        radius: 1.15 + i * 0.68,
        tiltX: 1.25 - i * 0.22 + (rng() - 0.5) * 0.3,
        tiltZ: (rng() - 0.5) * 0.8,
        speed: (i % 2 === 0 ? 1 : -1) * (0.9 / (i * 0.75 + 1)),
        offset: rng() * Math.PI * 2,
      };
    });
  }, [element]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spin && root.current) root.current.rotation.y = t * 0.12;
    let idx = 0;
    for (const s of shells) {
      for (let j = 0; j < s.count; j++) {
        const mesh = electronRefs.current[idx++];
        if (!mesh) continue;
        const a = s.offset + (j / s.count) * Math.PI * 2 + t * s.speed;
        mesh.position.set(Math.cos(a) * s.radius, Math.sin(a) * s.radius, 0);
      }
    }
  });

  electronRefs.current = [];
  let eIdx = 0;

  return (
    <group ref={root}>
      {/* nucleus */}
      <group>
        {nucleons.arr.map((n, i) => (
          <mesh key={i} position={n.pos}>
            <sphereGeometry args={[nucleons.rNucleon, 14, 14]} />
            <meshStandardMaterial
              color={n.proton ? "#ff5f6d" : "#a7b4c8"}
              emissive={n.proton ? "#ff2d3f" : "#1c2b44"}
              emissiveIntensity={n.proton ? 0.5 : 0.25}
              roughness={0.35}
            />
          </mesh>
        ))}
        {/* nucleus glow */}
        <mesh>
          <sphereGeometry args={[0.42 + 0.1 * Math.cbrt(protons + neutrons), 18, 18]} />
          <meshBasicMaterial color="#ff7b85" transparent opacity={0.10} />
        </mesh>
      </group>

      {/* electron shells + electrons */}
      {shells.map((s, si) => (
        <group key={si} rotation={[s.tiltX, 0, s.tiltZ]}>
          <mesh>
            <torusGeometry args={[s.radius, 0.011, 8, 128]} />
            <meshBasicMaterial color="#4cc9ff" transparent opacity={showShells ? 0.3 : 0.05} />
          </mesh>
          {Array.from({ length: s.count }).map((_, j) => (
            <mesh
              key={j}
              ref={(m) => { if (m) electronRefs.current[eIdx++] = m; }}
            >
              <sphereGeometry args={[0.085, 12, 12]} />
              <meshStandardMaterial color="#9ff6ff" emissive="#38e1ff" emissiveIntensity={1.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
