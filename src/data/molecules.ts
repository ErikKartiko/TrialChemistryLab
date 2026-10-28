// ------------------------------------------------------------------
// Molecule database — ball-and-stick 3D structures + education data
// positions are in ~Å units, scaled down at render time
// ------------------------------------------------------------------

export interface MolAtom {
  el: string;
  pos: [number, number, number];
}

export interface MolBond {
  a: number;      // atom index
  b: number;      // atom index
  order: 1 | 2 | 3;
}

export interface MoleculeSpec {
  formula: string;        // plain, e.g. "H2O"
  name: string;           // "Water"
  kind: "molecule" | "atom" | "ionic";
  atoms: MolAtom[];
  bonds: MolBond[];
  geometry: string;
  bondType: string;
  molarMass: number;      // g/mol
  summary: string;
  free?: boolean;         // appears in the free palette of the Reaction Lab
  role?: string;          // peran molekul dalam materi pembelajaran
}

export const MOLECULES: MoleculeSpec[] = [
  {
    formula: "H2", name: "Hydrogen Gas", kind: "molecule", free: true,
    atoms: [ { el: "H", pos: [-0.42, 0, 0] }, { el: "H", pos: [0.42, 0, 0] } ],
    bonds: [ { a: 0, b: 1, order: 1 } ],
    geometry: "Linear (diatomic)", bondType: "Nonpolar covalent", molarMass: 2.016,
    summary: "Two hydrogen atoms share one pair of electrons, forming the simplest molecule in existence.",
  },
  {
    formula: "O2", name: "Oxygen Gas", kind: "molecule", free: true,
    atoms: [ { el: "O", pos: [-0.66, 0, 0] }, { el: "O", pos: [0.66, 0, 0] } ],
    bonds: [ { a: 0, b: 1, order: 2 } ],
    geometry: "Linear (diatomic)", bondType: "Double covalent", molarMass: 31.998,
    summary: "The O=O double bond holds the oxygen we breathe — and the oxidant behind every flame.",
  },
  {
    formula: "N2", name: "Nitrogen Gas", kind: "molecule", free: true,
    atoms: [ { el: "N", pos: [-0.58, 0, 0] }, { el: "N", pos: [0.58, 0, 0] } ],
    bonds: [ { a: 0, b: 1, order: 3 } ],
    geometry: "Linear (diatomic)", bondType: "Triple covalent", molarMass: 28.014,
    summary: "The N≡N triple bond is one of the strongest in chemistry — breaking it takes serious energy.",
  },
  {
    formula: "Cl2", name: "Chlorine Gas", kind: "molecule", free: true,
    atoms: [ { el: "Cl", pos: [-1.0, 0, 0] }, { el: "Cl", pos: [1.0, 0, 0] } ],
    bonds: [ { a: 0, b: 1, order: 1 } ],
    geometry: "Linear (diatomic)", bondType: "Nonpolar covalent", molarMass: 70.9,
    summary: "A greenish reactive gas. Each chlorine atom is one electron short of a noble-gas shell.",
  },
  {
    formula: "H2O", name: "Water", kind: "molecule",
    atoms: [
      { el: "O", pos: [0, 0.1, 0] },
      { el: "H", pos: [0.62, 0.82, 0] },
      { el: "H", pos: [-0.62, 0.82, 0] },
    ],
    bonds: [ { a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 } ],
    geometry: "Bent (104.5°)", bondType: "Polar covalent", molarMass: 18.015,
    summary: "The bent shape makes water polar — the reason it dissolves almost everything and sustains life.",
  },
  {
    formula: "CO2", name: "Carbon Dioxide", kind: "molecule",
    atoms: [
      { el: "C", pos: [0, 0, 0] },
      { el: "O", pos: [-1.24, 0, 0] },
      { el: "O", pos: [1.24, 0, 0] },
    ],
    bonds: [ { a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 2 } ],
    geometry: "Linear (180°)", bondType: "Double covalent", molarMass: 44.009,
    summary: "A linear molecule produced by combustion and respiration — a key greenhouse gas.",
  },
  {
    formula: "NH3", name: "Ammonia", kind: "molecule",
    atoms: [
      { el: "N", pos: [0, 0.42, 0] },
      { el: "H", pos: [0.95, -0.3, 0] },
      { el: "H", pos: [-0.48, -0.3, 0.82] },
      { el: "H", pos: [-0.48, -0.3, -0.82] },
    ],
    bonds: [ { a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 } ],
    geometry: "Trigonal pyramidal (107°)", bondType: "Polar covalent", molarMass: 17.031,
    summary: "Nitrogen's lone pair squeezes the H atoms into a pyramid. The basis of modern fertilizers.",
  },
  {
    formula: "HCl", name: "Hydrogen Chloride", kind: "molecule", free: true,
    atoms: [ { el: "H", pos: [-0.72, 0, 0] }, { el: "Cl", pos: [0.72, 0, 0] } ],
    bonds: [ { a: 0, b: 1, order: 1 } ],
    geometry: "Linear (diatomic)", bondType: "Polar covalent", molarMass: 36.458,
    summary: "Dissolved in water it becomes hydrochloric acid — the same acid working in your stomach.",
  },
  {
    formula: "NaOH", name: "Sodium Hydroxide", kind: "ionic", free: true,
    atoms: [
      { el: "O", pos: [0, 0, 0] },
      { el: "Na", pos: [1.35, 0, 0] },
      { el: "H", pos: [-0.9, 0.45, 0] },
    ],
    bonds: [ { a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 } ],
    geometry: "Ionic pair (Na⁺ / OH⁻)", bondType: "Ionic + covalent", molarMass: 39.997,
    summary: "A strong base: Na⁺ ions paired with hydroxide OH⁻. It neutralizes acids to form salt and water.",
  },
  {
    formula: "NaCl", name: "Sodium Chloride", kind: "ionic",
    atoms: [ { el: "Na", pos: [1.25, 0, 0] }, { el: "Cl", pos: [-1.25, 0, 0] } ],
    bonds: [ { a: 0, b: 1, order: 1 } ],
    geometry: "Ionic lattice (pair shown)", bondType: "Ionic", molarMass: 58.44,
    summary: "Table salt: Na donates an electron to Cl, and the resulting ions attract into a crystal lattice.",
  },
  {
    formula: "MgO", name: "Magnesium Oxide", kind: "ionic",
    atoms: [ { el: "Mg", pos: [1.05, 0, 0] }, { el: "O", pos: [-1.05, 0, 0] } ],
    bonds: [ { a: 0, b: 1, order: 1 } ],
    geometry: "Ionic lattice (pair shown)", bondType: "Ionic", molarMass: 40.304,
    summary: "The white ash left when magnesium ribbon burns brilliantly in air.",
  },
  {
    formula: "CaO", name: "Calcium Oxide", kind: "ionic",
    atoms: [ { el: "Ca", pos: [1.15, 0, 0] }, { el: "O", pos: [-1.15, 0, 0] } ],
    bonds: [ { a: 0, b: 1, order: 1 } ],
    geometry: "Ionic lattice (pair shown)", bondType: "Ionic", molarMass: 56.077,
    summary: "Quicklime — produced when calcium burns; a key ingredient of cement and mortar.",
  },
  // ---- mono-atomic species (elements as solids / noble gas) ----
  {
    formula: "Na", name: "Sodium Atom", kind: "atom", free: true,
    atoms: [ { el: "Na", pos: [0, 0, 0] } ], bonds: [],
    geometry: "Mono-atomic", bondType: "Metallic (in bulk)", molarMass: 22.99,
    summary: "Elemental sodium — a soft, silvery metal stored under oil because it reacts fiercely with air.",
  },
  {
    formula: "C", name: "Carbon Atom", kind: "atom", free: true,
    atoms: [ { el: "C", pos: [0, 0, 0] } ], bonds: [],
    geometry: "Mono-atomic", bondType: "Covalent network (in bulk)", molarMass: 12.011,
    summary: "A single carbon atom — in bulk carbon, atoms link into networks like graphite or diamond.",
  },
  {
    formula: "Mg", name: "Magnesium Atom", kind: "atom", free: true,
    atoms: [ { el: "Mg", pos: [0, 0, 0] } ], bonds: [],
    geometry: "Mono-atomic", bondType: "Metallic (in bulk)", molarMass: 24.305,
    summary: "Elemental magnesium ribbon — it burns in oxygen with a dazzling white light.",
  },
  {
    formula: "Ca", name: "Calcium Atom", kind: "atom", free: true,
    atoms: [ { el: "Ca", pos: [0, 0, 0] } ], bonds: [],
    geometry: "Mono-atomic", bondType: "Metallic (in bulk)", molarMass: 40.078,
    summary: "Elemental calcium — an alkaline earth metal that reacts with both oxygen and water.",
  },
  {
    formula: "Fe", name: "Iron Atom", kind: "atom", free: true,
    atoms: [ { el: "Fe", pos: [0, 0, 0] } ], bonds: [],
    geometry: "Mono-atomic", bondType: "Metallic (in bulk)", molarMass: 55.845,
    summary: "Elemental iron. It can react with oxygen to form rust — but that reaction needs water and time.",
  },
  {
    formula: "Cu", name: "Copper Atom", kind: "atom", free: true,
    atoms: [ { el: "Cu", pos: [0, 0, 0] } ], bonds: [],
    geometry: "Mono-atomic", bondType: "Metallic (in bulk)", molarMass: 63.546,
    summary: "Elemental copper — fairly unreactive, which is why it was the first metal humans ever used.",
  },
  {
    formula: "Zn", name: "Zinc Atom", kind: "atom", free: true,
    atoms: [ { el: "Zn", pos: [0, 0, 0] } ], bonds: [],
    geometry: "Mono-atomic", bondType: "Metallic (in bulk)", molarMass: 65.38,
    summary: "Elemental zinc. It reacts with acids and hot oxygen, but not with the cold mixtures in this lab.",
  },
  {
    formula: "He", name: "Helium Atom", kind: "atom", free: true,
    atoms: [ { el: "He", pos: [0, 0, 0] } ], bonds: [],
    geometry: "Mono-atomic", bondType: "None (stable alone)", molarMass: 4.0026,
    summary: "A noble gas with a full outer shell — helium essentially never forms chemical bonds.",
  },
];

export const moleculeByFormula = (formula: string): MoleculeSpec | undefined =>
  MOLECULES.find((m) => m.formula === formula);

// peran molekul dalam materi pembelajaran (Asam & Basa, dll.)
const ROLES: Record<string, string> = {
  HCl: "Asam kuat — sumber ion H⁺ dalam air. Inilah titran yang menetralkan basa pada Praktikum 01.",
  NaOH: "Basa kuat — sumber ion OH⁻. Larutan yang dianalisis (analit) saat titrasi netralisasi.",
  H2O: "Produk inti netralisasi: ion H⁺ dan OH⁻ bergabung membentuk molekul air.",
  NaCl: "Garam hasil netralisasi — terbentuk dari ion spektator Na⁺ dan Cl⁻.",
  O2: "Oksidator dalam reaksi pembakaran — bergabung dengan C, Mg, dan Ca.",
  H2: "Bahan bakar masa depan — bereaksi dengan oksigen membentuk air.",
  CO2: "Produk pembakaran karbon dan respirasi — molekul linear gas rumah kaca.",
  NH3: "Bahan dasar pupuk — dibuat lewat sintesis Haber dari N₂ dan H₂.",
  MgO: "Abu putih hasil pembakaran pita magnesium dalam oksigen.",
};
for (const m of MOLECULES) {
  const r = ROLES[m.formula];
  if (r) m.role = r;
}

/** count atoms per element inside a molecule, e.g. H2O -> { H: 2, O: 1 } */
export function compositionOf(spec: MoleculeSpec): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of spec.atoms) out[a.el] = (out[a.el] ?? 0) + 1;
  return out;
}

/** molecules featured in the Molecule Explorer */
export const EXPLORER_FORMULAS = ["H2", "O2", "H2O", "CO2", "NH3", "NaCl", "MgO"];

/** species offered in the Reaction Lab free palette (order matters) */
export const PALETTE_FORMULAS = ["H2", "O2", "N2", "Cl2", "Na", "C", "Mg", "Ca", "HCl", "NaOH", "Fe", "Cu", "Zn", "He"];
