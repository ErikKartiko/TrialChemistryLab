import { useEffect, useMemo, useState } from "react";
import { Scissors, RefreshCcw, Atom, Link2, Shapes, Scale, FlaskConical, Eye, Tags, Type, ScanEye, Sparkles, Network } from "lucide-react";
import { EXPLORER_FORMULAS, moleculeByFormula, compositionOf } from "../data/molecules";
import { elementBySymbol } from "../data/elements";
import { PALETTE_FORMULAS } from "../data/molecules";
import { Heading, Btn, Tag, Formula } from "../components/ui";
import { Stage3D } from "../components/three/core";
import { MoleculeGroup } from "../components/three/MoleculeGroup";
import { ParticleView } from "../components/lab/ParticleView";
import { progress } from "../services/progress";
import { REACTIONS } from "../data/reactions";
import { sfx } from "../services/sound";
import type { Nav } from "../routes";

export function MoleculeExplorer({ nav, initialFormula }: { nav: Nav; initialFormula?: string }) {
  const [formula, setFormula] = useState(initialFormula && moleculeByFormula(initialFormula) ? initialFormula : "H2O");
  const [decomposed, setDecomposed] = useState(false);
  const [labels, setLabels] = useState(true);
  const [bonds, setBonds] = useState(true);
  const [showFormula, setShowFormula] = useState(true);
  const spec = moleculeByFormula(formula)!;

  useEffect(() => {
    progress.viewMolecule(formula);
    setDecomposed(false);
  }, [formula]);

  useEffect(() => {
    if (decomposed) progress.decompose(formula);
  }, [decomposed, formula]);

  const comp = compositionOf(spec);
  const atomTotal = spec.atoms.length;
  const seed = spec.free && PALETTE_FORMULAS.includes(formula) ? formula : null;
  const producer = REACTIONS.find((r) => r.products.some((pd) => pd.formula === formula));

  // "lihat yang tak terlihat": tingkat partikel dari spesies terkait
  const particleStage = useMemo(() => {
    if (formula === "HCl") return "hcl" as const;
    if (formula === "NaOH") return "naoh" as const;
    return "neutral" as const;
  }, [formula]);

  const toggle = (fn: (v: boolean) => void, v: boolean) => { fn(v); sfx("tick"); };

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-16 sm:px-8">
      <Heading
        kicker="Visualisasi Molekuler"
        title="Molekul 3D"
        desc="Putar, perbesar, beri label, dan bedah molekul menjadi atom penyusunnya — jembatan antara konsep abstrak dan dunia mikroskopis."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* daftar molekul */}
        <div className="glass order-2 rounded-2xl p-3.5 lg:order-1">
          <div className="mb-2 px-1 font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">Pustaka Molekul</div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {EXPLORER_FORMULAS.map((f) => {
              const mol = moleculeByFormula(f)!;
              const active = f === formula;
              return (
                <button
                  key={f}
                  onClick={() => { setFormula(f); sfx("tick"); }}
                  className={`rounded-xl border p-3 text-left transition ${active ? "border-cyan-300/50 bg-cyan-400/10" : "border-slate-600/25 bg-white/[0.02] hover:border-cyan-300/25"}`}
                >
                  <Formula text={f} className={`text-lg font-bold ${active ? "text-cyan-200" : "text-white"}`} />
                  <div className="mt-0.5 text-[10px] tracking-wide text-slate-400 uppercase">{mol.name}</div>
                  <div className="mt-1.5 flex -space-x-1">
                    {Object.keys(compositionOf(mol)).map((el) => (
                      <span key={el} className="h-3 w-3 rounded-full border border-[#060d1d]" style={{ background: elementBySymbol(el)?.color }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.2em] text-cyan-300 uppercase"><Sparkles size={10} /> Lihat yang tak terlihat</div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-300">
              Larutan terlihat bening — tetapi di dalamnya jutaan partikel bergerak. Mode MIKROSKOPIS di bawah membayangkannya untukmu.
            </p>
            <ParticleView stage={particleStage} className="mt-2.5 h-32" caption={formula === "HCl" ? "H⁺ & Cl⁻ bergerak bebas" : formula === "NaOH" ? "Na⁺ & OH⁻ bergerak bebas" : "partikel dalam larutan"} />
          </div>
        </div>

        {/* detail */}
        <div className="order-1 grid grid-cols-1 gap-4 lg:order-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {/* 3D */}
          <div className="relative min-h-[400px] overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#050c1a]">
            <Stage3D className="h-full min-h-[400px]" cameraPos={[0, 0.6, 6.2]} fov={42} floor>
              <MoleculeGroup spec={spec} scale={1.35} decompose={decomposed} labels={labels} showBonds={bonds} />
            </Stage3D>

            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
              <Tag color={decomposed ? "#fb923c" : "#34d399"}>{decomposed ? "Terurai" : "Utuh"}</Tag>
              <Tag color="#94a3b8">{spec.kind === "ionic" ? "Senyawa Ion" : spec.kind === "atom" ? "Atom" : "Molekul"}</Tag>
            </div>

            {showFormula && (
              <div className="absolute right-3 top-3 z-10 rounded-xl border border-cyan-300/25 bg-[#04101e]/90 px-4 py-2 backdrop-blur-md">
                <Formula text={spec.formula} className="text-2xl font-bold text-white" />
              </div>
            )}

            {/* kontrol tampilan */}
            <div className="absolute inset-x-3 bottom-14 z-10 flex flex-wrap items-center justify-center gap-1.5">
              <Ctrl on={labels} onClick={() => toggle(setLabels, !labels)} icon={Tags} label="ATOM" />
              <Ctrl on={bonds} onClick={() => toggle(setBonds, !bonds)} icon={Network} label="IKATAN" />
              <Ctrl on={showFormula} onClick={() => toggle(setShowFormula, !showFormula)} icon={Type} label="RUMUS" />
              <button
                onClick={() => { setDecomposed((d) => !d); sfx(decomposed ? "step" : "ok"); }}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[9px] font-bold tracking-wider transition ${decomposed ? "border-orange-300/60 bg-orange-400/15 text-orange-200" : "border-cyan-300/60 bg-cyan-400/15 text-cyan-200"}`}
              >
                {decomposed ? <RefreshCcw size={11} /> : <Scissors size={11} />}
                {decomposed ? "GABUNGKAN" : "PISAH ATOM"}
              </button>
            </div>

            {decomposed && (
              <div className="absolute inset-x-3 bottom-2 z-10 text-center animate-fadeUp">
                <span className="rounded-full border border-orange-300/25 bg-[#120a04]/85 px-3 py-1 font-mono text-[9px] tracking-wider text-orange-200">
                  {Object.entries(comp).map(([el, n]) => `${n} atom ${elementBySymbol(el)?.name}`).join("  ·  ")}
                </span>
              </div>
            )}
          </div>

          {/* info pembelajaran */}
          <div className="glass flex flex-col rounded-2xl p-5">
            <div className="font-mono text-[10px] tracking-[0.3em] text-slate-500 uppercase">{spec.kind === "ionic" ? "Senyawa ion" : spec.kind.toUpperCase()}</div>
            <h3 className="mt-1 font-display text-2xl font-bold tracking-tight text-white uppercase sm:text-3xl">{spec.name}</h3>
            <Formula text={spec.formula} className="mt-1 text-xl font-bold text-cyan-300" />

            <div className="mt-4 space-y-2">
              <InfoRow icon={Atom} label="Unsur & Jumlah Atom">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(comp).map(([el, n]) => (
                    <span key={el} className="flex items-center gap-1.5 rounded-full border border-slate-600/40 bg-white/[0.03] px-2.5 py-1 text-[11px]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: elementBySymbol(el)?.color }} />
                      <span className="text-slate-200">{n} {elementBySymbol(el)?.name}</span>
                    </span>
                  ))}
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-200">Total {atomTotal} atom</span>
                </div>
              </InfoRow>
              <InfoRow icon={Shapes} label="Bentuk / Geometri"><span className="text-slate-200">{spec.geometry}</span></InfoRow>
              <InfoRow icon={Link2} label="Jenis Ikatan"><span className="text-slate-200">{spec.bondType}</span></InfoRow>
              <InfoRow icon={Scale} label="Massa Molekul"><span className="font-mono text-slate-200">{spec.molarMass} g/mol</span></InfoRow>
            </div>

            <p className="mt-3.5 rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-3.5 text-xs leading-relaxed text-slate-300">{spec.summary}</p>

            {spec.role && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-300/20 bg-emerald-400/5 p-3.5">
                <Eye size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                <div>
                  <div className="font-mono text-[9px] font-bold tracking-[0.2em] text-emerald-300 uppercase">Peran dalam materi</div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-200">{spec.role}</p>
                </div>
              </div>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <Btn
                variant="ghost" size="sm"
                onClick={() => nav({ page: "ar", element: Object.keys(comp)[0] })}
              >
                <ScanEye size={13} /> Lihat di AR
              </Btn>
              {(seed || producer) && (
                <Btn
                  variant="solid" size="sm"
                  onClick={() => nav({ page: "lab", seed: seed ? { [seed]: 1 } : Object.fromEntries(producer!.reactants.map((r) => [r.formula, r.coefficient])) })}
                >
                  <FlaskConical size={13} /> {seed ? "Pakai di Simulasi" : "Sintesis di Simulasi"}
                </Btn>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ctrl({ on, onClick, icon: Icon, label }: { on: boolean; onClick: () => void; icon: typeof Tags; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[9px] font-bold tracking-wider transition ${on ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-200" : "border-slate-600/40 bg-[#0a1428]/80 text-slate-400 hover:text-slate-200"}`}
    >
      <Icon size={11} /> {label}
    </button>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: typeof Atom; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-600/20 bg-white/[0.02] px-3.5 py-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-cyan-400" />
      <div className="flex-1">
        <div className="font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase">{label}</div>
        <div className="mt-0.5 text-xs">{children}</div>
      </div>
    </div>
  );
}
