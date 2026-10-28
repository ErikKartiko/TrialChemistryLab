import { useEffect, useMemo, useState } from "react";
import { Atom, CircleDot, Layers, ScanEye, FlaskConical, Zap } from "lucide-react";
import { ELEMENTS, CATEGORY_META, ELEMENT_SPECIES, type ElementData } from "../data/elements";
import { Heading, Modal, Btn, Tag } from "../components/ui";
import { Stage3D } from "../components/three/core";
import { AtomModel } from "../components/three/AtomModel";
import { progress, useProgress } from "../services/progress";
import type { Nav } from "../routes";

export function Explore({ nav, initialSymbol }: { nav: Nav; initialSymbol?: string }) {
  const [selected, setSelected] = useState<ElementData | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const progressState = useProgress();

  useEffect(() => {
    if (initialSymbol) {
      const el = ELEMENTS.find((e) => e.symbol === initialSymbol);
      if (el) setSelected(el);
    }
  }, [initialSymbol]);

  useEffect(() => {
    if (selected) progress.exploreElement(selected.symbol);
  }, [selected]);

  const categories = useMemo(() => Object.entries(CATEGORY_META), []);

  const visible = (el: ElementData) => filter === "all" || el.category === filter;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-16 sm:px-8">
      <Heading
        kicker="Module 01 — Matter"
        title="Explore Elements"
        desc="Tap any element card to open its 3D atomic model. Rotate, zoom and inspect the electron shells that drive all chemistry."
      />

      {/* legend / filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase transition ${filter === "all" ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-200" : "border-slate-600/40 text-slate-400 hover:text-slate-200"}`}
        >
          All
        </button>
        {categories.map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? "all" : key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase transition ${filter === key ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"}`}
            style={{ borderColor: filter === key ? meta.color : `${meta.color}30` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
          </button>
        ))}
      </div>

      {/* periodic table */}
      <div className="glass mt-6 overflow-x-auto rounded-2xl p-4">
        <div className="grid min-w-[920px] grid-cols-[repeat(18,minmax(0,1fr))] gap-1.5" style={{ gridTemplateRows: "repeat(4, minmax(84px, auto))" }}>
          {ELEMENTS.map((el) => {
            const meta = CATEGORY_META[el.category];
            const dim = !visible(el);
            const explored = progressState.explored.includes(el.symbol);
            return (
              <button
                key={el.symbol}
                onClick={() => setSelected(el)}
                style={{
                  gridColumnStart: el.group, gridRowStart: el.period,
                  background: dim ? "transparent" : meta.soft,
                  borderColor: dim ? "rgba(94,120,160,0.14)" : `${meta.color}45`,
                  opacity: dim ? 0.22 : 1,
                }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-lg border p-1.5 text-left transition-all duration-200 hover:scale-[1.06] hover:z-10 hover:shadow-[0_0_18px_rgba(56,225,255,0.25)]"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[9px] text-slate-400">{el.number}</span>
                  {explored && <span className="h-1 w-1 rounded-full bg-emerald-400" title="Explored" />}
                </div>
                <div className="font-display text-lg leading-none font-bold" style={{ color: dim ? "#64748b" : meta.color }}>
                  {el.symbol}
                </div>
                <div>
                  <div className="truncate text-[9px] font-medium text-slate-300">{el.name}</div>
                  <div className="font-mono text-[8px] text-slate-500">{el.mass}</div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center font-mono text-[10px] tracking-wider text-slate-600">
          23 ELEMENTS · PROTOTYPE PERIODIC TABLE — GAPS MARK ELEMENTS COMING IN NEXT BUILD
        </p>
      </div>

      {/* ================= DETAIL MODAL ================= */}
      <Modal open={!!selected} onClose={() => setSelected(null)} wide>
        {selected && <ElementDetail el={selected} nav={nav} onClose={() => setSelected(null)} />}
      </Modal>
    </div>
  );
}

// --------------------------------------------------------------------

function ElementDetail({ el, nav, onClose }: { el: ElementData; nav: Nav; onClose: () => void }) {
  const meta = CATEGORY_META[el.category];
  const [showConfig, setShowConfig] = useState(false);
  const seedSpecies = ELEMENT_SPECIES[el.symbol];

  const stats: [string, React.ReactNode][] = [
    ["Atomic Number", el.number],
    ["Atomic Mass", `${el.mass} u`],
    ["Category", <Tag color={meta.color}>{meta.label}</Tag>],
    ["State (25°C)", el.state],
    ["Electron Config.", <span className="font-mono text-xs">{el.config}</span>],
    ["Valence Electrons", el.valence],
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_1.1fr]">
      {/* left: identity */}
      <div>
        <div className="flex items-center gap-3">
          <div
            className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border"
            style={{ background: meta.soft, borderColor: `${meta.color}55`, color: meta.color }}
          >
            <span className="font-mono text-[9px]">{el.number}</span>
            <span className="font-display text-2xl font-bold">{el.symbol}</span>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-slate-500 uppercase">{meta.label}</div>
            <h3 className="font-display text-3xl font-bold tracking-tight text-white uppercase">{el.name}</h3>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-600/25 bg-white/[0.03] px-3 py-2.5">
              <div className="font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase">{k}</div>
              <div className="mt-0.5 text-sm font-semibold text-slate-100">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-400/5 px-3.5 py-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] text-cyan-400 uppercase"><Zap size={10} /> Did you know</div>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{el.fact}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Btn variant="solid" size="sm" onClick={() => setShowConfig((s) => !s)}>
            <Layers size={13} /> {showConfig ? "Hide" : "Show"} Electron Configuration
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => { onClose(); nav({ page: "ar", element: el.symbol }); }}>
            <ScanEye size={13} /> View in AR
          </Btn>
          {seedSpecies && (
            <Btn
              variant="primary" size="sm"
              onClick={() => { onClose(); nav({ page: "lab", seed: { [seedSpecies]: 1 } }); }}
              title={`Add ${seedSpecies} to the Reaction Lab`}
            >
              <FlaskConical size={13} /> Send to Reaction Lab
            </Btn>
          )}
        </div>
      </div>

      {/* right: 3D atom */}
      <div className="relative min-h-[320px]">
        <Stage3D className="h-full min-h-[320px] rounded-2xl border border-cyan-300/10 bg-[#050c1a]/60" cameraPos={[0, 0.4, 6.4]} fov={42}>
          <AtomModel element={el} showShells />
        </Stage3D>

        {showConfig && (
          <div className="absolute top-3 left-3 max-w-[220px] rounded-xl border border-cyan-300/25 bg-[#04101e]/90 p-3 backdrop-blur-md animate-fadeIn">
            <div className="font-mono text-[9px] tracking-[0.2em] text-cyan-300 uppercase">Electron Configuration</div>
            <div className="mt-1 font-mono text-sm font-semibold text-white">{el.config}</div>
            <div className="mt-2 space-y-1">
              {el.shells.map((n, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] text-slate-300">
                  <CircleDot size={9} className="text-cyan-400" />
                  Shell {i + 1}: <b className="text-white">{n}</b> electron{n > 1 ? "s" : ""}
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-cyan-300/15 pt-2 text-[10px] leading-relaxed text-slate-400">
              Outer shell: <b className="text-cyan-300">{el.valence} valence electron{el.valence > 1 ? "s" : ""}</b> — these decide how {el.name} bonds.
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 rounded-full border border-white/10 bg-[#060d1d]/80 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-slate-400 uppercase">
          <Atom size={10} className="mr-1 inline text-cyan-300" /> Bohr Model
        </div>
      </div>
    </div>
  );
}
