// ------------------------------------------------------------------
// Reaction database — explicit, extensible list of allowed reactions
// A combination that is NOT listed here is "not in the database",
// never "chemically impossible".
// ------------------------------------------------------------------

export interface SpeciesCount {
  formula: string;
  coefficient: number;
}

export interface Reaction {
  id: string;
  name: string;
  reactants: SpeciesCount[];   // balanced, simplest integer form
  products: SpeciesCount[];
  reactionType: string;
  condition: string;
  energyType: "Exothermic" | "Endothermic";
  difficulty: 1 | 2 | 3;
  explanation: string;
  why: string;
  facts: string[];
}

export const REACTIONS: Reaction[] = [
  {
    id: "water_formation",
    name: "Formation of Water",
    reactants: [ { formula: "H2", coefficient: 2 }, { formula: "O2", coefficient: 1 } ],
    products: [ { formula: "H2O", coefficient: 2 } ],
    reactionType: "Combination (Synthesis)",
    condition: "Ignition / spark",
    energyType: "Exothermic",
    difficulty: 1,
    explanation: "Hydrogen reacts with oxygen to form water. The H–H and O=O bonds break, and new O–H bonds form.",
    why: "Hydrogen and oxygen combine to form water.\n\nThe atoms rearrange and form new chemical bonds. The atoms themselves are not destroyed — they are rearranged into a new substance. Because two H₂ molecules provide exactly 4 hydrogen atoms, they perfectly match the 2 oxygen atoms of one O₂ to build 2 water molecules.",
    facts: [ "This reaction powers hydrogen fuel-cell rockets.", "It releases a large amount of energy — the Hindenburg disaster is a dramatic example.", "The product is a compound with totally different properties from its reactants." ],
  },
  {
    id: "salt_formation",
    name: "Formation of Sodium Chloride",
    reactants: [ { formula: "Na", coefficient: 2 }, { formula: "Cl2", coefficient: 1 } ],
    products: [ { formula: "NaCl", coefficient: 2 } ],
    reactionType: "Combination (Synthesis)",
    condition: "Contact with chlorine gas",
    energyType: "Exothermic",
    difficulty: 2,
    explanation: "Sodium metal reacts with chlorine gas to form sodium chloride — ordinary table salt.",
    why: "Each sodium atom has one lonely valence electron, while each chlorine atom is missing exactly one. Sodium donates its electron to chlorine: Na becomes Na⁺ and Cl becomes Cl⁻.\n\nThe opposite charges attract, and billions of ions lock together into the cubic crystal lattice we call table salt. The atoms were not created or destroyed — only their electrons were rearranged.",
    facts: [ "A soft, explosive metal plus a toxic gas become the harmless salt on your fries.", "This is a classic example of an ionic bond.", "The crystal lattice gives salt its cubic shape." ],
  },
  {
    id: "carbon_combustion",
    name: "Combustion of Carbon",
    reactants: [ { formula: "C", coefficient: 1 }, { formula: "O2", coefficient: 1 } ],
    products: [ { formula: "CO2", coefficient: 1 } ],
    reactionType: "Combustion",
    condition: "Heat in oxygen",
    energyType: "Exothermic",
    difficulty: 1,
    explanation: "Carbon burns in oxygen to form carbon dioxide, releasing heat and light.",
    why: "When carbon is heated in oxygen, each carbon atom bonds with the two oxygen atoms of an O₂ molecule after its double bond breaks.\n\nThe product, CO₂, is linear: the carbon sits in the middle sharing two electron pairs with each oxygen. Rearranging the same atoms into CO₂ releases stored chemical energy as heat.",
    facts: [ "This is the chemistry of burning charcoal.", "Animals perform a slower version of this in respiration.", "CO₂ molecules absorb infrared light, making it a greenhouse gas." ],
  },
  {
    id: "magnesium_oxidation",
    name: "Oxidation of Magnesium",
    reactants: [ { formula: "Mg", coefficient: 2 }, { formula: "O2", coefficient: 1 } ],
    products: [ { formula: "MgO", coefficient: 2 } ],
    reactionType: "Combination (Synthesis)",
    condition: "Heat — magnesium ribbon burns",
    energyType: "Exothermic",
    difficulty: 2,
    explanation: "Magnesium burns in oxygen with a brilliant white flame, leaving white magnesium oxide ash.",
    why: "Magnesium has two valence electrons it readily gives away; oxygen needs exactly two to complete its shell. Each O atom from O₂ accepts two electrons from a magnesium atom.\n\nThe resulting Mg²⁺ and O²⁻ ions attract strongly into an ionic solid. The dazzling white light you see is the energy difference between the old bonds and the new ones.",
    facts: [ "The flash is so bright it was used in early photographic flash powder.", "One O₂ molecule serves exactly two Mg atoms — that is why the ratio is 2:1.", "Magnesium fires burn even hotter in pure oxygen." ],
  },
  {
    id: "ammonia_synthesis",
    name: "Synthesis of Ammonia (Haber Process)",
    reactants: [ { formula: "N2", coefficient: 1 }, { formula: "H2", coefficient: 3 } ],
    products: [ { formula: "NH3", coefficient: 2 } ],
    reactionType: "Combination (Synthesis)",
    condition: "High pressure, ~450°C, iron catalyst",
    energyType: "Exothermic",
    difficulty: 3,
    explanation: "Nitrogen and hydrogen combine under pressure over an iron catalyst to form ammonia.",
    why: "The N≡N triple bond is extremely strong, so this reaction needs high pressure, heat and a catalyst to proceed.\n\nOnce the N≡N and H–H bonds break, each nitrogen atom bonds with three hydrogen atoms, forming the pyramidal NH₃ molecule. Three H₂ molecules supply exactly the 6 hydrogen atoms needed to build 2 ammonia molecules.",
    facts: [ "The Haber process feeds roughly half of humanity through fertilizer.", "Laboratories work hard to 'fix' nitrogen because N≡N is so hard to break.", "Ammonia's sharp smell comes from this pyramid-shaped molecule." ],
  },
  {
    id: "calcium_oxidation",
    name: "Oxidation of Calcium",
    reactants: [ { formula: "Ca", coefficient: 2 }, { formula: "O2", coefficient: 1 } ],
    products: [ { formula: "CaO", coefficient: 2 } ],
    reactionType: "Combination (Synthesis)",
    condition: "Heat in air",
    energyType: "Exothermic",
    difficulty: 2,
    explanation: "Calcium metal reacts with oxygen when heated, forming calcium oxide — quicklime.",
    why: "Calcium, like magnesium, holds two valence electrons that it donates readily. Oxygen accepts two electrons per atom, so one O₂ molecule pairs up perfectly with two calcium atoms.\n\nThe product CaO is an ionic solid. Roasted limestone reverses this family of reactions — quicklime has been made in kilns for thousands of years.",
    facts: [ "Quicklime is a key ingredient of cement, mortar and steel refining.", "CaO reacts strongly with water, releasing heat.", "Calcium's brick-red flame test color reveals it in fireworks." ],
  },
  {
    id: "neutralization",
    name: "Neutralization of HCl by NaOH",
    reactants: [ { formula: "HCl", coefficient: 1 }, { formula: "NaOH", coefficient: 1 } ],
    products: [ { formula: "NaCl", coefficient: 1 }, { formula: "H2O", coefficient: 1 } ],
    reactionType: "Neutralization (Acid–Base)",
    condition: "Aqueous solution",
    energyType: "Exothermic",
    difficulty: 3,
    explanation: "Hydrochloric acid and sodium hydroxide neutralize each other, forming sodium chloride and water.",
    why: "The acid provides H⁺ ions and the base provides OH⁻ ions. When they meet, H⁺ + OH⁻ snap together to form water.\n\nThe leftover Na⁺ and Cl⁻ ions pair up as sodium chloride. Watch the atom count: every atom on the left appears on the right — the atoms simply swap partners. That swap is the entire reaction.",
    facts: [ "This acid + base → salt + water pattern defines neutralization.", "Your stomach uses HCl; antacids neutralize it exactly like this.", "The reaction warms the solution noticeably." ],
  },
];

export const reactionById = (id: string) => REACTIONS.find((r) => r.id === id);
