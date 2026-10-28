import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlaskConical, Play, RotateCcw, Trash2, Plus, Minus, CheckCircle2,
  Info, Combine, GraduationCap, FlaskRound, HelpCircle, ArrowRight, X, Flame, Wind, TestTubes,
} from "lucide-react";
import { PALETTE_FORMULAS, moleculeByFormula, compositionOf } from "../data/molecules";
import { elementBySymbol } from "../data/elements";
import { missionById } from "../data/missions";
import { validateMixture, mixtureText, equationText, sideText, subScript, type ValidationResult } from "../services/chemistryEngine";
import { progress } from "../services/progress";
import { Btn, Formula, Tag, Toggle, Modal } from "../components/ui";
import { Stage3D } from "../components/three/core";
import { MoleculeGroup } from "../components/three/MoleculeGroup";
import { ReactionScene } from "../components/three/ReactionScene";
import type { Nav } from "../routes";

const STAGES = [
  { title: "Stage 1 — Reactants", desc: "Starting molecules with their original bonds and arrangement." },
  { title: "Stage 2 — Collision", desc: "Molecules rush toward each other and collide with enough energy." },
  { title: "Stage 3 — Bond Breaking", desc: "Old bonds absorb energy, weaken, then break apart." },
  { title: "Stage 4 — Rearrangement", desc: "Freed atoms glide into a new, more stable configuration." },
  { title: "Stage 5 — Product Formed", desc: "New bonds lock in — a new substance with new properties." },
  { title: "Complete", desc: "Reaction complete. Same atoms — a brand-new arrangement." },
];

const STAGE_ICONS = [Wind, Combine, X, TestTubes, Flame, CheckCircle2];

const toast = (title: string, desc?: string) =>
  window.dispatchEvent(new CustomEvent("arcl-toast", { detail: { title, desc } }));

interface LabProps {
  nav: Nav;
  demo?: boolean;
  missionId?: string;
  seed?: Record<string, number>;
  tick?: number;
}

export function ReactionLab({ nav, demo, missionId, seed, tick }: LabProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<"build" | "animating" | "result">("build");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [runId, setRunId] = useState(0);
  const [stage, setStage] = useState(0);
  const [learning, setLearning] = useState(() => {
    try { return localStorage.getItem("arcl.learning") !== "free"; } catch { return true; }
  });
  const [whyOpen, setWhyOpen] = useState(false);
  const [demoCaption, setDemoCaption] = useState<string | null>(null);
  const [demoTarget, setDemoTarget] = useState<string | null>(null);
  const [demoActive, setDemoActive] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const mission = missionId ? missionById(missionId) : undefined;
  const reaction = validation?.reaction;

  // live refs so the demo runner never works on stale closures
  const countsRef = useRef(counts);
  useEffect(() => { countsRef.current = counts; }, [counts]);

  // ---------- helpers ----------
  const addSpecies = useCallback((formula: string, delta: number) => {
    setCounts((c) => {
      const next = { ...c, [formula]: Math.max(0, Math.min(6, (c[formula] ?? 0) + delta)) };
      if (next[formula] === 0) delete next[formula];
      return next;
    });
    setValidation(null);
    if (phase === "result") setPhase("build");
  }, [phase]);

  const totalParticles = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  const combine = useCallback(() => {
    const v = validateMixture(counts);
    setValidation(v);
    return v;
  }, [counts]);

  const simulate = useCallback(() => {
    if (!validation || validation.status !== "valid") return;
    setPhase("animating");
    setStage(0);
    setRunId((r) => r + 1);
  }, [validation]);

  const reset = useCallback(() => {
    setCounts({});
    setValidation(null);
    setPhase("build");
    setStage(0);
    setDemoCaption(null);
    setDemoTarget(null);
  }, []);

  useEffect(() => {
    if (seed) setCounts((c) => ({ ...c, ...seed }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, tick]);

  useEffect(() => {
    try { localStorage.setItem("arcl.learning", learning ? "learn" : "free"); } catch { /* noop */ }
  }, [learning]);

  // ---------- reaction complete ----------
  const handleComplete = useCallback(() => {
    if (!reaction) return;
    progress.discoverReaction(reaction.id);
    if (mission?.targetReactionId === reaction.id) {
      progress.completeMission(mission.id);
      toast(`Mission ${mission.index} complete — ${mission.title}`, equationText(reaction));
    } else {
      toast("Reaction discovered", `${reaction.name} — ${equationText(reaction)}`);
    }
    window.setTimeout(() => setPhase("result"), 900);
  }, [reaction, mission]);

  // ---------- demo runner ----------
  useEffect(() => {
    if (!demo) return;
    reset();
    setDemoActive(true);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const steps: { caption: string; target?: string | null; delay: number; action?: () => void }[] = [
      { caption: "DEMO 1/6 — We will make water. Selecting Hydrogen…", target: "H2", delay: 1600 },
      { caption: "DEMO 2/6 — Add the first H₂ molecule…", target: "H2", delay: 1300, action: () => addSpecies("H2", 1) },
      { caption: "DEMO 2/6 — …and a second H₂ molecule.", target: "H2", delay: 1300, action: () => addSpecies("H2", 1) },
      { caption: "DEMO 3/6 — Now select Oxygen and add one O₂ molecule.", target: "O2", delay: 1500, action: () => addSpecies("O2", 1) },
      { caption: "DEMO 4/6 — Press COMBINE to validate the mixture.", target: "combine", delay: 1800,
        action: () => setValidation(validateMixture(countsRef.current)) },
      { caption: "DEMO 5/6 — Reaction found: 2H₂ + O₂ → 2H₂O. Simulating…", target: "simulate", delay: 2400,
        action: () => { setPhase("animating"); setStage(0); setRunId((r) => r + 1); } },
      { caption: "DEMO 6/6 — Watch: collision → bond breaking → rearrangement → water.", target: null, delay: 15000 },
    ];

    let i = 0;
    const run = () => {
      if (cancelled) return;
      if (i >= steps.length) { setDemoCaption("Demo complete — Water synthesized. Explore the result!"); setDemoTarget(null); setDemoActive(false); return; }
      const s = steps[i++];
      setDemoCaption(s.caption);
      setDemoTarget(s.target ?? null);
      s.action?.();
      timer = setTimeout(run, s.delay);
    };
    timer = setTimeout(run, 900);

    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, tick]);

  // ---------- idle stage molecules ----------
  const stageMolecules = useMemo(() => {
    const items: { formula: string; key: string }[] = [];
    for (const [f, n] of Object.entries(counts)) {
      for (let i = 0; i < Math.min(n, 3); i++) items.push({ formula: f, key: `${f}-${i}` });
    }
    return items.slice(0, 8);
  }, [counts]);

  const palette = PALETTE_FORMULAS.map((f) => moleculeByFormula(f)!);

  const stagePos = (i: number, n: number): [number, number, number] => {
    const spacing = Math.min(2.2, 7.4 / Math.max(1, n));
    return [(i - (n - 1) / 2) * spacing, i % 2 === 0 ? 0.3 : -0.35, i % 2 === 0 ? -0.25 : 0.35];
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-24 pb-14 sm:px-6">
      {/* header row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-8 bg-cyan-400/60" />
            <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-cyan-400 uppercase">Module 02 — Synthesis</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Reaction Lab</h2>
          <p className="mt-1 max-w-lg text-sm text-slate-400">
            Add atoms & molecules, press <b className="text-slate-200">COMBINE</b>, watch the atoms rearrange.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Toggle
            on={learning}
            onChange={setLearning}
            labelOn="Learning Mode"
            labelOff="Free Experiment"
          />
          <Btn variant="ghost" size="sm" onClick={() => nav({ page: "lab", demo: true })}>
            <Play size={13} /> TRY DEMO
          </Btn>
        </div>
      </div>

      {/* mission banner */}
      {mission && (
        <div className="glass-bright mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <GraduationCap size={18} className="text-cyan-300" />
            <div>
              <div className="font-mono text-[9px] tracking-[0.25em] text-cyan-300 uppercase">Mission {mission.index} — {mission.title}</div>
              <div className="text-xs text-slate-300">{mission.briefing}</div>
            </div>
          </div>
          <Formula text={mission.targetHint} className="rounded-lg border border-cyan-300/25 bg-[#04101e]/70 px-3 py-1.5 text-sm text-white" />
        </div>
      )}

      {/* demo caption */}
      {demoCaption && (
        <div className="animate-fadeUp fixed inset-x-4 top-20 z-50 mx-auto max-w-xl rounded-2xl border border-cyan-300/40 bg-[#04101e]/95 px-5 py-3.5 shadow-[0_0_40px_rgba(34,211,238,0.3)] backdrop-blur-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              </span>
              <span className="text-xs font-semibold text-cyan-100">{demoCaption}</span>
            </div>
            <button onClick={() => { setDemoCaption(null); setDemoTarget(null); setDemoActive(false); }} className="text-slate-500 hover:text-white" title="Dismiss demo">
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* =================== MAIN GRID =================== */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[290px_minmax(0,1fr)_350px]">
        {/* ---------- palette ---------- */}
        <div className="glass order-2 rounded-2xl p-4 xl:order-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">Substances</h3>
            <Tag color="#94a3b8">{totalParticles} in lab</Tag>
          </div>
          <p className="mb-2.5 px-0.5 font-mono text-[9px] tracking-wider text-slate-600 uppercase">Drag a card into the stage — or tap ＋</p>
          <div className="grid max-h-[560px] grid-cols-2 gap-2 overflow-y-auto pr-1 xl:grid-cols-1">
            {palette.map((spec) => {
              const n = counts[spec.formula] ?? 0;
              const comp = compositionOf(spec);
              const glow = demoTarget === spec.formula;
              return (
                <div
                  key={spec.formula}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/arcl-species", spec.formula); e.dataTransfer.effectAllowed = "copy"; }}
                  title="Drag into the reaction area, or tap ＋"
                  className={`cursor-grab rounded-xl border p-2.5 transition active:cursor-grabbing ${n > 0 ? "border-cyan-300/40 bg-cyan-400/[0.07]" : "border-slate-600/25 bg-white/[0.02]"} ${glow ? "demo-glow border-cyan-300/70" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {Object.keys(comp).slice(0, 3).map((el) => (
                          <span key={el} className="h-3.5 w-3.5 rounded-full border border-[#060d1d]" style={{ background: elementBySymbol(el)?.color }} />
                        ))}
                      </div>
                      <div>
                        <Formula text={spec.formula} className="text-sm font-bold text-white" />
                        <div className="text-[9px] tracking-wide text-slate-500 uppercase">{spec.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => addSpecies(spec.formula, -1)} disabled={n === 0} className="rounded-md border border-slate-600/40 p-1 text-slate-400 transition hover:text-white disabled:opacity-25" title="Remove one">
                        <Minus size={12} />
                      </button>
                      <span className={`w-5 text-center font-mono text-xs font-bold ${n > 0 ? "text-cyan-300" : "text-slate-600"}`}>{n}</span>
                      <button onClick={() => addSpecies(spec.formula, 1)} className="rounded-md border border-cyan-300/40 bg-cyan-400/10 p-1 text-cyan-300 transition hover:bg-cyan-400/25" title="Add one">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------- center stage ---------- */}
        <div className="order-1 xl:order-2">
          <div
            className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#050c1a]"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.getData("text/arcl-species");
              if (f && moleculeByFormula(f)) addSpecies(f, 1);
            }}
          >
            {dragOver && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-cyan-300/70 bg-cyan-400/10">
                <span className="rounded-xl border border-cyan-300/40 bg-[#04101e]/90 px-4 py-2 font-mono text-[11px] font-bold tracking-[0.2em] text-cyan-200 uppercase">
                  Drop to add substance
                </span>
              </div>
            )}
            {/* top-left badge */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <Tag color={phase === "animating" ? "#fb923c" : phase === "result" ? "#34d399" : "#38e1ff"}>
                <FlaskRound size={10} />
                {phase === "animating" ? "Simulating" : phase === "result" ? "Product formed" : "Reactants"}
              </Tag>
              {totalParticles > 0 && phase === "build" && <Tag color="#94a3b8">{totalParticles} particle{totalParticles > 1 ? "s" : ""}</Tag>}
            </div>

            {phase === "animating" && reaction ? (
              <ReactionScene
                reaction={reaction}
                playing
                runId={runId}
                className="h-[400px] sm:h-[460px]"
                onStage={(s) => setStage(s)}
                onComplete={handleComplete}
              />
            ) : phase === "result" && reaction ? (
              <div className="grid h-[400px] grid-cols-1 sm:h-[460px] sm:grid-cols-2">
                {reaction.products.map((p) => {
                  const spec = moleculeByFormula(p.formula)!;
                  return (
                    <div key={p.formula} className="relative border-slate-600/20 sm:border-l first:border-l-0">
                      <Stage3D className="h-full w-full" cameraPos={[0, 0.4, 5.6]} fov={42} controls={false}>
                        <MoleculeGroup spec={spec} scale={1.15} />
                      </Stage3D>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl border border-emerald-300/25 bg-[#04101e]/85 px-3.5 py-2 text-center backdrop-blur-md">
                        <div className="font-mono text-[8px] tracking-[0.25em] text-emerald-300 uppercase">Product{p.coefficient > 1 ? ` × ${p.coefficient}` : ""}</div>
                        <div className="font-display text-sm font-bold text-white">{spec.name} · <Formula text={p.formula} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Stage3D className="h-[400px] sm:h-[460px]" cameraPos={[0, 1, 8.6]} fov={42} floor>
                {stageMolecules.map((m, i) => (
                  <MoleculeGroup key={m.key} spec={moleculeByFormula(m.formula)!} scale={0.95} position={stagePos(i, stageMolecules.length)} />
                ))}
              </Stage3D>
            )}

            {/* empty state */}
            {phase === "build" && totalParticles === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-fadeUp">
                  <FlaskConical size={34} className="mx-auto text-slate-600" />
                  <div className="mt-3 font-display text-sm font-bold text-slate-400">Reaction area is empty</div>
                  <div className="mx-auto mt-1 max-w-[240px] text-[11px] leading-relaxed text-slate-600">
                    {learning ? "Tap ＋ on the substance cards — try 2 × H₂ and 1 × O₂." : "Add substances from the palette to begin an experiment."}
                  </div>
                </div>
              </div>
            )}

            {/* animating stage caption */}
            {phase === "animating" && (
              <div className="absolute inset-x-0 top-3 z-10 flex justify-center pointer-events-none">
                <div className="max-w-[92%] rounded-2xl border border-orange-300/25 bg-[#120a04]/85 px-5 py-2.5 text-center backdrop-blur-md">
                  <div className="font-display text-xs font-bold tracking-wide text-orange-200">{STAGES[stage].title}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{STAGES[stage].desc}</div>
                </div>
              </div>
            )}
          </div>

          {/* stage tracker while animating */}
          {phase === "animating" && (
            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {STAGES.map((s, i) => {
                const Icon = STAGE_ICONS[i];
                const state = i < stage ? "done" : i === stage ? "active" : "todo";
                return (
                  <div key={i} className={`rounded-xl border px-2 py-2 text-center transition ${state === "active" ? "border-orange-300/50 bg-orange-400/10" : state === "done" ? "border-emerald-300/30 bg-emerald-400/5" : "border-slate-700/40 bg-white/[0.02]"}`}>
                    <Icon size={14} className={`mx-auto ${state === "active" ? "text-orange-300" : state === "done" ? "text-emerald-400" : "text-slate-600"}`} />
                    <div className={`mt-1 hidden font-mono text-[8px] tracking-wider uppercase sm:block ${state === "active" ? "text-orange-200" : state === "done" ? "text-emerald-300/80" : "text-slate-600"}`}>
                      {s.title.replace("Stage ", "S").split("—")[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* live mixture + actions */}
          <div className="glass mt-3 flex flex-col items-center justify-between gap-3 rounded-2xl px-4 py-3.5 sm:flex-row">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">Mixture</span>
              {totalParticles > 0 ? (
                <Formula text={mixtureText(counts)} className="text-base font-bold whitespace-nowrap text-white" />
              ) : (
                <span className="text-sm text-slate-600">—</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {phase === "result" ? (
                <>
                  <Btn variant="ghost" size="sm" onClick={() => setPhase("build")}><RotateCcw size={13} /> Run Again</Btn>
                  <Btn variant="danger" size="sm" onClick={reset}><Trash2 size={13} /> New Experiment</Btn>
                </>
              ) : (
                <>
                  <Btn variant="ghost" size="sm" onClick={reset} disabled={totalParticles === 0 && !validation}><RotateCcw size={13} /> Reset</Btn>
                  <Btn
                    variant="primary" size="md"
                    onClick={combine}
                    disabled={totalParticles === 0 || phase === "animating" || demoActive}
                    className={demoTarget === "combine" ? "demo-glow" : ""}
                  >
                    <Combine size={15} /> COMBINE
                  </Btn>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ---------- right panel ---------- */}
        <div className="order-3 space-y-3">
          {/* validation panel */}
          <div className="glass rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white">Analysis</h3>
              <Tag color="#94a3b8">{phase === "result" ? "Complete" : "Validator"}</Tag>
            </div>

            {!validation && phase !== "result" && (
              <div className="rounded-xl border border-dashed border-slate-600/40 p-4 text-center">
                <Info size={18} className="mx-auto text-slate-500" />
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  {learning
                    ? "Learning mode: combine 2 H₂ + 1 O₂ to synthesize water, or explore any mixture — I'll give you hints."
                    : "Free experiment: build any mixture and press COMBINE to check it against the reaction database."}
                </p>
              </div>
            )}

            {validation && phase !== "result" && (
              <ValidationPanel v={validation} onSimulate={simulate} simulateGlow={demoTarget === "simulate"} disableSimulate={demoActive} />
            )}

            {phase === "result" && reaction && (
              <div className="space-y-3 animate-fadeUp">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-300/35 bg-emerald-400/10 px-3.5 py-3">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-300" />
                  <div>
                    <div className="font-mono text-[10px] font-bold tracking-[0.2em] text-emerald-300 uppercase">Reaction Complete</div>
                    <Formula text={equationText(reaction)} className="text-sm font-bold text-white" />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-600/25 bg-white/[0.02] p-3.5">
                  <div className="font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase">Product{reaction.products.length > 1 ? "s" : ""}</div>
                  <div className="mt-1 font-display text-base font-bold text-white">
                    {reaction.products.map((p) => moleculeByFormula(p.formula)!.name).join(" + ")}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Tag color="#c084fc">{reaction.reactionType}</Tag>
                    <Tag color="#fb923c">{reaction.energyType}</Tag>
                    <Tag color="#94a3b8">{reaction.condition}</Tag>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{reaction.explanation}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Btn variant="solid" size="sm" onClick={() => setWhyOpen(true)}>
                    <HelpCircle size={13} /> Why does this happen?
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={() => nav({ page: "molecules", molecule: reaction.products[0].formula })}>
                    Inspect Product <ArrowRight size={13} />
                  </Btn>
                </div>
              </div>
            )}
          </div>

          {/* reactant chips editor */}
          <div className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white">Reactants</h3>
              <button onClick={reset} className="font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase transition hover:text-rose-300" title="Clear all">Clear</button>
            </div>
            {totalParticles === 0 ? (
              <div className="text-[11px] text-slate-600">No particles yet — add them from the substance palette.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(counts).filter(([, n]) => n > 0).map(([f, n]) => (
                  <div key={f} className="flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-400/[0.07] py-1 pr-1 pl-2.5">
                    <Formula text={f} className="text-[11px] font-bold text-white" />
                    <span className="font-mono text-[10px] text-cyan-300">×{n}</span>
                    <button onClick={() => addSpecies(f, -1)} className="rounded-full p-0.5 text-slate-400 hover:text-rose-300" title="Remove one"><Minus size={11} /></button>
                    <button onClick={() => addSpecies(f, 1)} className="rounded-full p-0.5 text-slate-400 hover:text-cyan-200" title="Add one"><Plus size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* learning hint card */}
          {learning && phase !== "result" && (
            <div className="glass-bright rounded-2xl p-4 animate-fadeUp">
              <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] text-cyan-300 uppercase"><GraduationCap size={11} /> Teaching Assistant</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
                {mission
                  ? `Mission target: ${mission.targetHint.replace(/_/g, "?")}. Build it with the palette, then COMBINE.`
                  : totalParticles === 0
                    ? "Start simple: add 2 hydrogen molecules (H₂) and 1 oxygen molecule (O₂)."
                    : "Coefficients matter — a reaction only proceeds when the atom ratio matches a balanced equation. Watch the validator's hints."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =================== WHY MODAL =================== */}
      <Modal
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        title={
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase">Why does this happen?</div>
            <h3 className="mt-1 font-display text-xl font-bold text-white">{reaction?.name}</h3>
          </div>
        }
      >
        {reaction && (
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-4 py-3 text-center">
              <Formula text={equationText(reaction)} className="text-lg font-bold text-white" />
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line text-slate-300">{reaction.why}</p>
            <div className="rounded-xl border border-amber-300/25 bg-amber-400/5 p-3.5">
              <div className="font-mono text-[9px] tracking-[0.2em] text-amber-300 uppercase">Core idea — conservation of atoms</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Count them: {reaction.reactants.map((r) => `${subScript(r.formula)} × ${r.coefficient}`).join(" + ")} contains exactly the same atoms as {reaction.products.map((p) => `${subScript(p.formula)} × ${p.coefficient}`).join(" + ")}. Nothing was created. Nothing was destroyed. Atoms only changed partners.
              </p>
            </div>
            <div className="grid gap-2">
              {reaction.facts.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-600/25 bg-white/[0.02] px-3 py-2.5 text-xs text-slate-300">
                  <Flame size={12} className="mt-0.5 shrink-0 text-orange-300" /> {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// --------------------------------------------------------------------

function ValidationPanel({ v, onSimulate, simulateGlow, disableSimulate }: { v: ValidationResult; onSimulate: () => void; simulateGlow?: boolean; disableSimulate?: boolean }) {
  if (v.status === "empty") {
    return (
      <div className="rounded-xl border border-slate-600/30 p-4 text-center text-[11px] text-slate-400">{v.hint}</div>
    );
  }

  if (v.status === "valid" && v.reaction) {
    return (
      <div className="space-y-3 animate-fadeUp">
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-300/35 bg-emerald-400/10 p-3.5">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />
          <div>
            <div className="font-mono text-[10px] font-bold tracking-[0.2em] text-emerald-300 uppercase">✓ Reaction Found</div>
            <div className="mt-0.5 font-display text-sm font-bold text-white">{v.reaction.name}</div>
            <Formula text={equationText(v.reaction)} className="mt-1 block text-base font-bold text-white" />
          </div>
        </div>
        {v.multiple && v.multiple > 1 && (
          <p className="rounded-lg border border-sky-300/25 bg-sky-400/5 px-3 py-2 text-[10px] leading-relaxed text-sky-200">{v.hint}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Tag color="#c084fc">{v.reaction.reactionType}</Tag>
          <Tag color="#fb923c">{v.reaction.energyType}</Tag>
        </div>
        <Btn variant="primary" size="lg" className={`w-full ${simulateGlow ? "demo-glow" : ""}`} onClick={onSimulate} disabled={disableSimulate}>
          <Play size={16} /> SIMULATE REACTION
        </Btn>
      </div>
    );
  }

  const isNoReaction = v.status === "no-reaction";
  const color = isNoReaction ? "#94a3b8" : v.status === "excess" ? "#fb7185" : "#facc15";
  const title = isNoReaction ? "NOT IN DATABASE" : v.status === "excess" ? "⚠ TOO MANY PARTICLES" : "⚠ INCOMPLETE REACTION";

  return (
    <div className="space-y-3 animate-fadeUp">
      <div className="rounded-xl border p-3.5" style={{ borderColor: `${color}45`, background: `${color}0d` }}>
        <div className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color }}>{title}</div>
        <div className="mt-2.5 space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 font-mono text-[9px] tracking-wider text-slate-500 uppercase">You have</span>
            <Formula text={v.haveText || "—"} className="font-bold text-white" />
          </div>
          {v.expectedText && (
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 font-mono text-[9px] tracking-wider text-slate-500 uppercase">Expected</span>
              <Formula text={v.reaction ? `${sideText(v.reaction.reactants)} → ${sideText(v.reaction.products)}` : v.expectedText} className="font-bold text-cyan-200" />
            </div>
          )}
        </div>
        <div className="mt-3 rounded-lg bg-black/25 px-3 py-2.5">
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color }}>Hint</div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-200">{v.hint}</p>
        </div>
        {v.learningTip && (
          <p className="mt-2 text-[10px] leading-relaxed text-slate-400 italic">{v.learningTip}</p>
        )}
      </div>
    </div>
  );
}
