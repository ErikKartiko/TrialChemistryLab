import { Atom, Hexagon, Boxes, ArrowLeftRight, Percent, Link2, Scale, Layers } from "lucide-react";
import { Heading, Formula } from "../components/ui";
import { REACTIONS } from "../data/reactions";

const CONCEPTS = [
  {
    icon: Atom, color: "#38e1ff", term: "Element",
    def: "A pure substance made of only one kind of atom, defined by its proton count (atomic number).",
    ex: "Hydrogen (H) is element 1 — every H atom has exactly 1 proton.",
  },
  {
    icon: Atom, color: "#34d399", term: "Atom",
    def: "The smallest unit of an element: a nucleus of protons & neutrons, wrapped in electron shells.",
    ex: "One oxygen atom: 8 protons, 8 electrons — 6 of them valence, hungry to bond.",
  },
  {
    icon: Hexagon, color: "#f472b6", term: "Molecule",
    def: "Two or more atoms held together by chemical bonds — it can be one element or several.",
    ex: "O₂ is a molecule (one element). H₂O is a molecule too — and also a compound.",
  },
  {
    icon: Boxes, color: "#c084fc", term: "Compound",
    def: "A substance whose molecules contain two or more DIFFERENT elements in fixed ratios.",
    ex: "Water, CO₂ and NaCl are compounds. O₂ is not — it has only one element.",
  },
  {
    icon: ArrowLeftRight, color: "#fb923c", term: "Reactant → Product",
    def: "Reactants are what you start with; products are what forms. The arrow → means 'reacts to give'.",
    ex: "In 2H₂ + O₂ → 2H₂O, hydrogen and oxygen are reactants; water is the product.",
  },
  {
    icon: Layers, color: "#facc15", term: "Coefficient vs Subscript",
    def: "The big number BEFORE a formula counts whole molecules. The small subscript counts atoms INSIDE one molecule.",
    ex: "2H₂O = two water molecules, each built from 2 H atoms and 1 O atom.",
  },
  {
    icon: Link2, color: "#60a5fa", term: "Chemical Bond",
    def: "The force holding atoms together: covalent (sharing electrons), ionic (transfer + attraction), or metallic.",
    ex: "H–H is covalent. Na⁺Cl⁻ is ionic. Copper wire is a metallic bond sea.",
  },
  {
    icon: Scale, color: "#fb7185", term: "Conservation of Atoms",
    def: "In a chemical reaction, atoms are rearranged — never created, never destroyed. Both sides must balance.",
    ex: "2H₂ + O₂ → 2H₂O: 4 H atoms and 2 O atoms on BOTH sides of the arrow.",
  },
];

export function Learn() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-28 pb-16 sm:px-8">
      <Heading
        kicker="Module 06 — Foundations"
        title="Learn Chemistry"
        desc="The vocabulary of chemistry, defined precisely. Every term here is used consistently across the whole lab."
      />

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CONCEPTS.map((c, i) => (
          <div key={c.term} className="glass rounded-2xl p-5 transition hover:border-cyan-300/25 animate-fadeUp" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-2.5" style={{ color: c.color }}>
              <c.icon size={18} />
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-white">{c.term}</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{c.def}</p>
            <div className="mt-3 rounded-lg bg-black/25 px-3 py-2 text-[10px] leading-relaxed text-slate-300">
              <span className="font-mono text-[8px] tracking-[0.2em] text-slate-500 uppercase">Example — </span>
              {c.ex}
            </div>
          </div>
        ))}
      </div>

      {/* reaction type gallery */}
      <div className="glass mt-8 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <Percent size={16} className="text-cyan-300" />
          <h3 className="font-display text-lg font-bold text-white">Reaction Types in this Lab</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">Every reaction in the database, grouped by how its atoms rearrange.</p>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {REACTIONS.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-600/25 bg-white/[0.02] p-4 transition hover:border-cyan-300/25">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-white">{r.name}</span>
                <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-2 py-0.5 font-mono text-[9px] tracking-wider text-violet-300 uppercase">{r.reactionType}</span>
              </div>
              <div className="mt-2.5 flex justify-center rounded-lg bg-black/25 py-2">
                <Formula text={`${r.reactants.map(s => `${s.coefficient > 1 ? s.coefficient : ""}${s.formula}`).join(" + ")} → ${r.products.map(s => `${s.coefficient > 1 ? s.coefficient : ""}${s.formula}`).join(" + ")}`} className="text-sm font-bold text-cyan-100" />
              </div>
              <p className="mt-2.5 text-[10px] leading-relaxed text-slate-500">{r.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* notation rules */}
      <div className="glass-bright mt-8 rounded-3xl p-6 sm:p-8">
        <h3 className="font-display text-lg font-bold text-white">Notation Rules — read any equation</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-[#04101e]/60 p-4 text-center">
            <Formula text="2H2O" className="text-2xl font-bold text-white" />
            <p className="mt-2 text-[11px] text-slate-400">The <b className="text-cyan-300">2</b> in front is the <b>coefficient</b>: two separate molecules.</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-[#04101e]/60 p-4 text-center">
            <Formula text="H2O" className="text-2xl font-bold text-white" />
            <p className="mt-2 text-[11px] text-slate-400">The subscript <b className="text-cyan-300">₂</b> counts atoms: 2 hydrogens inside ONE molecule.</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-[#04101e]/60 p-4 text-center">
            <Formula text="2H2 + O2 → 2H2O" className="text-lg font-bold text-white" />
            <p className="mt-2 text-[11px] text-slate-400"><b className="text-cyan-300">→</b> means "react to give" — never write "=" in chemistry.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
