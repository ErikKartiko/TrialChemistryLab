// ------------------------------------------------------------------
// Chemistry Engine — validation, formatting and lookup functions
// ------------------------------------------------------------------

import { ELEMENTS, elementBySymbol, type ElementData } from "../data/elements";
import { MOLECULES, moleculeByFormula, type MoleculeSpec } from "../data/molecules";
import { REACTIONS, reactionById, type Reaction, type SpeciesCount } from "../data/reactions";

export const getElement = (symbol: string): ElementData | undefined => elementBySymbol(symbol);
export const getMolecule = (formula: string): MoleculeSpec | undefined => moleculeByFormula(formula);
export const getReaction = (id: string): Reaction | undefined => reactionById(id);
export { ELEMENTS, MOLECULES, REACTIONS };

// ---------------- formula tokenizing (for <sub> rendering) ----------------

export interface FormulaToken { text: string; sub: boolean }

/** "H2O" -> [{text:"H"},{text:"2",sub},{text:"O"}] ; also handles → + coefficients */
export function formulaTokens(s: string): FormulaToken[] {
  const out: FormulaToken[] = [];
  for (const ch of s) {
    if (/\d/.test(ch)) {
      const prev = out[out.length - 1];
      if (prev && prev.sub) prev.text += ch;
      else out.push({ text: ch, sub: true });
    } else {
      const prev = out[out.length - 1];
      if (prev && !prev.sub && ch !== " ") prev.text += ch;
      else out.push({ text: ch, sub: false });
    }
  }
  return out;
}

export const UNICODE_SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
};
export const subScript = (s: string) => s.replace(/\d/g, (d) => UNICODE_SUB[d] ?? d);

/** side of an equation, e.g. [ {H2,2},{O2,1} ] -> "2H2 + O2" */
export const sideText = (side: SpeciesCount[]) =>
  side.map((s) => `${s.coefficient > 1 ? s.coefficient : ""}${s.formula}`).join(" + ");

/** full equation string (plain digits — render with formulaTokens) */
export const equationText = (r: Reaction) => `${sideText(r.reactants)} → ${sideText(r.products)}`;

/** text for a user's mixture, e.g. {H2:2, O2:1} -> "2H2 + O2" */
export function mixtureText(counts: Record<string, number>): string {
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([f, n]) => `${n > 1 ? n : ""}${f}`)
    .join(" + ");
}

// ---------------- validation ----------------

export type ValidationStatus = "empty" | "valid" | "incomplete" | "excess" | "no-reaction";

export interface ValidationResult {
  status: ValidationStatus;
  reaction?: Reaction;
  multiple?: number;
  missing: SpeciesCount[];   // species still needed (incomplete)
  remove: SpeciesCount[];    // species in excess or unrelated (excess)
  hint: string;
  learningTip?: string;
  haveText: string;
  expectedText?: string;
}

const reqMap = (r: Reaction) => {
  const m: Record<string, number> = {};
  for (const s of r.reactants) m[s.formula] = s.coefficient;
  return m;
};

const prettySpecies = (formula: string) => {
  const mol = getMolecule(formula);
  return mol ? `${subScript(formula)} (${mol.name})` : subScript(formula);
};

/**
 * Validate a user's mixture against the explicit reaction database.
 * Returns educational feedback with concrete hints — never a bare ERROR.
 */
export function validateMixture(counts: Record<string, number>): ValidationResult {
  const active = Object.entries(counts).filter(([, n]) => n > 0);
  const haveText = mixtureText(counts);

  if (active.length === 0) {
    return {
      status: "empty", missing: [], remove: [], hint: "Add atoms or molecules to the reaction area first.",
      haveText: "",
    };
  }

  const userSet = active.map(([f]) => f);
  const userMap: Record<string, number> = {};
  for (const [f, n] of active) userMap[f] = n;

  // ---- exact integer-multiple ratio match ----
  for (const r of REACTIONS) {
    const req = reqMap(r);
    const reqSet = Object.keys(req);
    if (reqSet.length !== userSet.length || !reqSet.every((f) => userMap[f] > 0)) continue;
    const k = reqSet.every((f) => userMap[f] % req[f] === 0 && userMap[f] / req[f] === userMap[reqSet[0]] / req[reqSet[0]])
      ? userMap[reqSet[0]] / req[reqSet[0]]
      : 0;
    if (k >= 1) {
      return {
        status: "valid", reaction: r, multiple: k, missing: [], remove: [],
        hint: k > 1
          ? `Your mixture is ${k}× the balanced equation — perfectly proportional. The simulation uses the simplest whole-number coefficients.`
          : "The atoms balance exactly. Ready to simulate.",
        haveText, expectedText: equationText(r),
      };
    }
  }

  // ---- candidate = reaction whose required set contains the most user species ----
  let best: Reaction | undefined;
  let bestScore = -1;
  for (const r of REACTIONS) {
    const req = reqMap(r);
    const overlap = userSet.filter((f) => req[f] !== undefined).length;
    const subset = userSet.every((f) => req[f] !== undefined) ? 1 : 0;
    const score = subset * 10 + overlap / Object.keys(req).length;
    if (overlap > 0 && score > bestScore) { bestScore = score; best = r; }
  }

  if (!best) {
    const syms = userSet.map((f) => prettySpecies(f)).join(" + ");
    return {
      status: "no-reaction", missing: [], remove: [],
      hint: `No reaction in the current database uses ${syms} together.`,
      learningTip: "This does NOT mean these species can never react. The prototype database only covers the reactions defined so far — try another combination, or investigate real reaction conditions (heat, catalysts, solvents).",
      haveText,
    };
  }

  // ---- compare against best candidate ----
  const req = reqMap(best);
  const unrelated = userSet.filter((f) => req[f] === undefined);

  // largest whole-number multiple fully covered by what the user added
  let k = Infinity;
  for (const f of Object.keys(req)) k = Math.min(k, Math.floor((userMap[f] ?? 0) / req[f]));
  if (!isFinite(k) || k < 0) k = 0;

  const missing: SpeciesCount[] = [];
  const remove: SpeciesCount[] = [];
  const targetK = Math.max(k, 1);
  for (const f of Object.keys(req)) {
    const need = req[f] * targetK;
    const have = userMap[f] ?? 0;
    if (have < need) missing.push({ formula: f, coefficient: need - have });
    else if (have > need) remove.push({ formula: f, coefficient: have - need });
  }
  for (const f of unrelated) remove.push({ formula: f, coefficient: userMap[f] });

  const expectedText = equationText(best);
  const speciesLabel = (s: SpeciesCount) =>
    `${s.coefficient} × ${prettySpecies(s.formula)}`;

  if (missing.length > 0) {
    const hints = missing.map((s) => {
      const mol = getMolecule(s.formula);
      const unit = mol && mol.kind === "atom" ? "atom" : "molecule";
      return s.coefficient === 1 ? `Add another ${subScript(s.formula)} ${unit}.` : `Add ${s.coefficient} more ${subScript(s.formula)} ${unit}s.`;
    });
    return {
      status: "incomplete", reaction: best, missing, remove,
      hint: hints.join(" "),
      learningTip: `Balanced target: ${subScript(sideText(best.reactants))} → ${subScript(sideText(best.products))}. Every atom on the left must appear on the right.`,
      haveText, expectedText,
    };
  }

  if (remove.length > 0) {
    return {
      status: "excess", reaction: best, missing, remove,
      hint: `Too many particles: remove ${remove.map(speciesLabel).join(" and ")}${unrelated.length > 0 ? " — not every substance participates in this reaction." : " to hit the exact ratio."}`,
      learningTip: `Chemistry is about exact atom ratios: ${subScript(sideText(best.reactants))}.`,
      haveText, expectedText,
    };
  }

  // integer ratio but non-integer multiple (e.g. 1 H2 + 0.5 O2 impossible here) — fallback
  return {
    status: "no-reaction", missing, remove,
    hint: "This ratio does not match any reaction in the database.",
    learningTip: "Try scaling each species to whole-number molecules that match a balanced equation.",
    haveText, expectedText,
  };
}

/** learning-mode nudges based on the current mixture */
export function learningNudge(counts: Record<string, number>): string | null {
  const active = Object.keys(counts).filter((f) => counts[f] > 0);
  if (active.length === 0) return "Add 2 × H₂ molecules and 1 × O₂ molecule to make water — or explore freely.";
  return null;
}
