// ------------------------------------------------------------------
// Element database — 23 elements for the prototype periodic table
// ------------------------------------------------------------------

export type Category =
  | "nonmetal"
  | "noble-gas"
  | "alkali-metal"
  | "alkaline-earth"
  | "metalloid"
  | "halogen"
  | "transition-metal"
  | "post-transition-metal";

export interface ElementData {
  symbol: string;
  name: string;
  number: number;
  mass: number;
  category: Category;
  group: number;
  period: number;
  shells: number[];        // electrons per shell (drives the 3D atom viewer)
  config: string;          // electron configuration (unicode superscripts)
  valence: number;         // valence electrons
  radius: number;          // visual radius of the 3D atomic sphere
  color: string;           // 3D ball color
  state: "Gas" | "Solid" | "Liquid";
  fact: string;
}

export const CATEGORY_META: Record<Category, { label: string; color: string; soft: string }> = {
  nonmetal:              { label: "Nonmetal",             color: "#38e1ff", soft: "rgba(56,225,255,0.14)" },
  "noble-gas":           { label: "Noble Gas",            color: "#c084fc", soft: "rgba(192,132,252,0.13)" },
  "alkali-metal":        { label: "Alkali Metal",         color: "#fb7185", soft: "rgba(251,113,133,0.13)" },
  "alkaline-earth":      { label: "Alkaline Earth Metal", color: "#fb923c", soft: "rgba(251,146,60,0.13)" },
  metalloid:             { label: "Metalloid",            color: "#34d399", soft: "rgba(52,211,153,0.13)" },
  halogen:               { label: "Halogen",              color: "#facc15", soft: "rgba(250,204,21,0.13)" },
  "transition-metal":    { label: "Transition Metal",     color: "#60a5fa", soft: "rgba(96,165,250,0.13)" },
  "post-transition-metal":{ label: "Post-transition Metal",color: "#94a3b8", soft: "rgba(148,163,184,0.14)" },
};

export const ELEMENTS: ElementData[] = [
  { symbol: "H",  name: "Hydrogen",   number: 1,  mass: 1.008,   category: "nonmetal",               group: 1,  period: 1, shells: [1],          config: "1s¹",              valence: 1, radius: 0.34, color: "#eef4ff", state: "Gas",   fact: "The lightest and most abundant element in the universe — the fuel of stars." },
  { symbol: "He", name: "Helium",     number: 2,  mass: 4.0026,  category: "noble-gas",              group: 18, period: 1, shells: [2],          config: "1s²",              valence: 2, radius: 0.30, color: "#f0abfc", state: "Gas",   fact: "A noble gas so unreactive it has never formed a stable compound." },
  { symbol: "Li", name: "Lithium",    number: 3,  mass: 6.94,    category: "alkali-metal",           group: 1,  period: 2, shells: [2, 1],       config: "1s² 2s¹",          valence: 1, radius: 0.58, color: "#c084fc", state: "Solid", fact: "The lightest metal — it powers the batteries inside phones and laptops." },
  { symbol: "Be", name: "Beryllium",  number: 4,  mass: 9.0122,  category: "alkaline-earth",         group: 2,  period: 2, shells: [2, 2],       config: "1s² 2s²",          valence: 2, radius: 0.50, color: "#86efac", state: "Solid", fact: "A very light, stiff metal used in aerospace structures and X-ray windows." },
  { symbol: "B",  name: "Boron",      number: 5,  mass: 10.81,   category: "metalloid",              group: 13, period: 2, shells: [2, 3],       config: "1s² 2s² 2p¹",      valence: 3, radius: 0.44, color: "#fbbf24", state: "Solid", fact: "A metalloid essential for borosilicate glass and plant growth." },
  { symbol: "C",  name: "Carbon",     number: 6,  mass: 12.011,  category: "nonmetal",               group: 14, period: 2, shells: [2, 4],       config: "1s² 2s² 2p²",      valence: 4, radius: 0.42, color: "#9fb0c9", state: "Solid", fact: "The backbone of every known form of life — and of diamonds and graphite." },
  { symbol: "N",  name: "Nitrogen",   number: 7,  mass: 14.007,  category: "nonmetal",               group: 15, period: 2, shells: [2, 5],       config: "1s² 2s² 2p³",      valence: 5, radius: 0.40, color: "#60a5fa", state: "Gas",   fact: "Makes up about 78% of the air you are breathing right now." },
  { symbol: "O",  name: "Oxygen",     number: 8,  mass: 15.999,  category: "nonmetal",               group: 16, period: 2, shells: [2, 6],       config: "1s² 2s² 2p⁴",      valence: 6, radius: 0.40, color: "#ff5d5d", state: "Gas",   fact: "Essential for respiration and combustion — 21% of Earth's atmosphere." },
  { symbol: "F",  name: "Fluorine",   number: 9,  mass: 18.998,  category: "halogen",                group: 17, period: 2, shells: [2, 7],       config: "1s² 2s² 2p⁵",      valence: 7, radius: 0.38, color: "#4ade80", state: "Gas",   fact: "The most reactive element of all — it can even make some noble gases react." },
  { symbol: "Ne", name: "Neon",       number: 10, mass: 20.180,  category: "noble-gas",              group: 18, period: 2, shells: [2, 8],       config: "1s² 2s² 2p⁶",      valence: 8, radius: 0.37, color: "#f472b6", state: "Gas",   fact: "Glows orange-red when electrified — the classic sign gas." },
  { symbol: "Na", name: "Sodium",     number: 11, mass: 22.990,  category: "alkali-metal",           group: 1,  period: 3, shells: [2, 8, 1],    config: "1s² 2s² 2p⁶ 3s¹",  valence: 1, radius: 0.66, color: "#a78bfa", state: "Solid", fact: "A soft metal that reacts violently with water and forms half of table salt." },
  { symbol: "Mg", name: "Magnesium",  number: 12, mass: 24.305,  category: "alkaline-earth",         group: 2,  period: 3, shells: [2, 8, 2],    config: "1s² 2s² 2p⁶ 3s²",  valence: 2, radius: 0.60, color: "#34d399", state: "Solid", fact: "Burns with a brilliant white flame — used in flares and fireworks." },
  { symbol: "Al", name: "Aluminium",  number: 13, mass: 26.982,  category: "post-transition-metal",  group: 13, period: 3, shells: [2, 8, 3],    config: "1s² 2s² 2p⁶ 3s² 3p¹", valence: 3, radius: 0.62, color: "#c3cede", state: "Solid", fact: "The most abundant metal in Earth's crust — light, strong and recyclable." },
  { symbol: "Si", name: "Silicon",    number: 14, mass: 28.085,  category: "metalloid",              group: 14, period: 3, shells: [2, 8, 4],    config: "1s² 2s² 2p⁶ 3s² 3p²", valence: 4, radius: 0.50, color: "#eab308", state: "Solid", fact: "The semiconductor heart of every computer chip on the planet." },
  { symbol: "P",  name: "Phosphorus", number: 15, mass: 30.974,  category: "nonmetal",               group: 15, period: 3, shells: [2, 8, 5],    config: "1s² 2s² 2p⁶ 3s² 3p³", valence: 5, radius: 0.46, color: "#fb923c", state: "Solid", fact: "So reactive that white phosphorus ignites spontaneously in air." },
  { symbol: "S",  name: "Sulfur",     number: 16, mass: 32.06,   category: "nonmetal",               group: 16, period: 3, shells: [2, 8, 6],    config: "1s² 2s² 2p⁶ 3s² 3p⁴", valence: 6, radius: 0.46, color: "#fde047", state: "Solid", fact: "The smell of rotten eggs and volcanic springs — brimstone of the ancients." },
  { symbol: "Cl", name: "Chlorine",   number: 17, mass: 35.45,   category: "halogen",                group: 17, period: 3, shells: [2, 8, 7],    config: "1s² 2s² 2p⁶ 3s² 3p⁵", valence: 7, radius: 0.44, color: "#22c55e", state: "Gas",   fact: "A greenish gas — disinfects swimming pools and forms the other half of salt." },
  { symbol: "Ar", name: "Argon",      number: 18, mass: 39.948,  category: "noble-gas",              group: 18, period: 3, shells: [2, 8, 8],    config: "1s² 2s² 2p⁶ 3s² 3p⁶", valence: 8, radius: 0.43, color: "#d8b4fe", state: "Gas",   fact: "An inert gas hiding in roughly 1% of the atmosphere, used inside light bulbs." },
  { symbol: "K",  name: "Potassium",  number: 19, mass: 39.098,  category: "alkali-metal",           group: 1,  period: 4, shells: [2, 8, 8, 1], config: "1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹", valence: 1, radius: 0.76, color: "#b79dfa", state: "Solid", fact: "Vital for nerve signals — bananas are famously rich in it." },
  { symbol: "Ca", name: "Calcium",    number: 20, mass: 40.078,  category: "alkaline-earth",         group: 2,  period: 4, shells: [2, 8, 8, 2], config: "1s² 2s² 2p⁶ 3s² 3p⁶ 4s²", valence: 2, radius: 0.70, color: "#e7e5e4", state: "Solid", fact: "Builds your bones, teeth, seashells and every limestone cliff." },
  { symbol: "Fe", name: "Iron",       number: 26, mass: 55.845,  category: "transition-metal",       group: 8,  period: 4, shells: [2, 8, 14, 2], config: "[Ar] 3d⁶ 4s²",    valence: 2, radius: 0.62, color: "#f97316", state: "Solid", fact: "The core of our planet and the reason your blood is red." },
  { symbol: "Cu", name: "Copper",     number: 29, mass: 63.546,  category: "transition-metal",       group: 11, period: 4, shells: [2, 8, 18, 1], config: "[Ar] 3d¹⁰ 4s¹",   valence: 1, radius: 0.60, color: "#e0915a", state: "Solid", fact: "Humanity's first metal — still wiring the entire electrical world." },
  { symbol: "Zn", name: "Zinc",       number: 30, mass: 65.38,   category: "transition-metal",       group: 12, period: 4, shells: [2, 8, 18, 2], config: "[Ar] 3d¹⁰ 4s²",   valence: 2, radius: 0.60, color: "#7dd3fc", state: "Solid", fact: "Protects steel from rust (galvanizing) and supports your immune system." },
];

export const elementBySymbol = (symbol: string): ElementData | undefined =>
  ELEMENTS.find((e) => e.symbol === symbol);

/** Species formula each element contributes to the Reaction Lab palette */
export const ELEMENT_SPECIES: Record<string, string> = {
  H: "H2", He: "He", C: "C", N: "N2", O: "O2", Na: "Na", Cl: "Cl2",
  Mg: "Mg", Ca: "Ca", Fe: "Fe", Cu: "Cu", Zn: "Zn",
};
