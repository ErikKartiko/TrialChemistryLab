// ------------------------------------------------------------------
// Procedural lab equipment — erlenmeyer, beaker, pipette, bottle,
// dropper, test tube + APD. Ball-stick style, swap-ready for .glb
// ------------------------------------------------------------------

import type { EquipmentSpec } from "../../data/experiments";

interface LiquidOpt { level: number; color: string; opacity?: number }

const GLASS = { color: "#bfe0ff", transparent: true, opacity: 0.20, roughness: 0.08, metalness: 0.1 } as const;
const LABEL_W = "#e8f4ff";

function Glass({ children }: { children?: React.ReactNode }) {
  return <group>{children}</group>;
}

function GlassMat() {
  return <meshStandardMaterial {...GLASS} side={2} depthWrite={false} />;
}

/** level: 0..1 mengisi wadah */
export function EquipmentModel({ type, liquid, tint = "#7fb8ff" }: { type: EquipmentSpec["type"]; liquid?: LiquidOpt; tint?: string }) {
  switch (type) {
    case "erlenmeyer": {
      const lv = Math.max(0, Math.min(1, liquid?.level ?? 0));
      return (
        <Glass>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.17, 0.52, 0.9, 24, 1, true]} />
            <GlassMat />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.52, 0.52, 0.12, 24]} />
            <GlassMat />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <torusGeometry args={[0.18, 0.02, 8, 24]} />
            <meshStandardMaterial {...GLASS} />
          </mesh>
          {lv > 0.01 && (
            <mesh position={[0, 0.13 + lv * 0.32, 0]}>
              <cylinderGeometry args={[0.16 + lv * 0.2, 0.26 + lv * 0.2, 0.42 * Math.max(0.25, lv), 20]} />
              <meshStandardMaterial color={liquid!.color} transparent opacity={liquid!.opacity ?? 0.72} roughness={0.25} depthWrite={false} />
            </mesh>
          )}
        </Glass>
      );
    }
    case "beaker":
      return (
        <Glass>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.8, 24, 1, true]} />
            <GlassMat />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.07, 24]} />
            <GlassMat />
          </mesh>
        </Glass>
      );
    case "bottle":
      return (
        <Glass>
          {liquid && (
            <mesh position={[0, 0.24 + liquid.level * 0.1, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.34 + liquid.level * 0.12, 16]} />
              <meshStandardMaterial color={liquid.color} transparent opacity={0.8} depthWrite={false} />
            </mesh>
          )}
          <mesh position={[0, 0.33, 0]}>
            <cylinderGeometry args={[0.29, 0.31, 0.66, 20]} />
            <meshStandardMaterial color={tint} transparent opacity={0.35} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.11, 0.13, 0.16, 14]} />
            <meshStandardMaterial color={tint} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, 0.84, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.08, 14]} />
            <meshStandardMaterial color="#e8f4ff" roughness={0.4} />
          </mesh>
          {/* etiket */}
          <mesh position={[0, 0.38, 0.315]}>
            <boxGeometry args={[0.3, 0.22, 0.012]} />
            <meshStandardMaterial color="#f4f8ff" roughness={0.6} />
          </mesh>
        </Glass>
      );
    case "dropper":
      return (
        <Glass>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshStandardMaterial color="#1e2c45" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.34, 10]} />
            <meshStandardMaterial color="#ffb0d9" transparent opacity={0.5} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.012, 0.05, 0.16, 10]} />
            <GlassMat />
          </mesh>
        </Glass>
      );
    case "pipette":
      return (
        <Glass>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.85, 10]} />
            <meshStandardMaterial color={liquid?.color ?? "#9cd8ff"} transparent opacity={liquid ? 0.55 : 0.18} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.014, 0.04, 0.14, 10]} />
            <GlassMat />
          </mesh>
          <mesh position={[0, 0.96, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color={liquid ? "#34d399" : "#2a3c5e"} roughness={0.5} />
          </mesh>
        </Glass>
      );
    case "testtube":
      return (
        <Glass>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.6, 16, 1, true]} />
            <GlassMat />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.13, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <GlassMat />
          </mesh>
        </Glass>
      );
    case "goggles":
      return (
        <Glass>
          {[-0.22, 0.22].map((x) => (
            <mesh key={x} position={[x, 0.3, 0]}>
              <cylinderGeometry args={[0.17, 0.17, 0.09, 20]} />
              <meshStandardMaterial color="#38e1ff" transparent opacity={0.3} depthWrite={false} />
            </mesh>
          ))}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.14, 0.05, 0.05]} />
            <meshStandardMaterial color={LABEL_W} />
          </mesh>
        </Glass>
      );
    case "gloves":
      return (
        <Glass>
          <mesh position={[-0.18, 0.28, 0]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.2, 0.42, 0.1]} />
            <meshStandardMaterial color="#facc15" roughness={0.7} />
          </mesh>
          <mesh position={[0.18, 0.28, 0]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.2, 0.42, 0.1]} />
            <meshStandardMaterial color="#facc15" roughness={0.7} />
          </mesh>
        </Glass>
      );
    case "labcoat":
      return (
        <Glass>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.55, 0.6, 0.14]} />
            <meshStandardMaterial color="#eef4ff" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.4, 0.2, 0.13]} />
            <meshStandardMaterial color="#dbe7ff" roughness={0.8} />
          </mesh>
        </Glass>
      );
  }
}
