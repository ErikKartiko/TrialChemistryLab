// ------------------------------------------------------------------
// Chemistry Missions — guided learning objectives
// ------------------------------------------------------------------

export interface Mission {
  id: string;
  index: string;
  title: string;
  briefing: string;
  kind: "build" | "balance";
  targetReactionId?: string;   // for kind === "build"
  targetHint: string;          // formula string shown to the student
  reward: string;
}

export const MISSIONS: Mission[] = [
  {
    id: "m_water",
    index: "01",
    title: "Build Water",
    briefing: "Combine Hydrogen and Oxygen molecules in the correct ratio to synthesize Water.",
    kind: "build",
    targetReactionId: "water_formation",
    targetHint: "2H₂ + O₂ → 2H₂O",
    reward: "Molecule Builder",
  },
  {
    id: "m_co2",
    index: "02",
    title: "Build Carbon Dioxide",
    briefing: "Burn Carbon in Oxygen. Watch a single carbon atom lock into a linear CO₂ molecule.",
    kind: "build",
    targetReactionId: "carbon_combustion",
    targetHint: "C + O₂ → CO₂",
    reward: "Molecule Builder",
  },
  {
    id: "m_ammonia",
    index: "03",
    title: "Build Ammonia",
    briefing: "Break the mighty N≡N triple bond and fix nitrogen with hydrogen — the Haber process.",
    kind: "build",
    targetReactionId: "ammonia_synthesis",
    targetHint: "N₂ + 3H₂ → 2NH₃",
    reward: "Molecule Builder",
  },
  {
    id: "m_neutral",
    index: "04",
    title: "Neutralization",
    briefing: "Acid meets base. Neutralize hydrochloric acid with sodium hydroxide to get salt and water.",
    kind: "build",
    targetReactionId: "neutralization",
    targetHint: "HCl + NaOH → NaCl + H₂O",
    reward: "Molecule Builder",
  },
  {
    id: "m_balance",
    index: "05",
    title: "Balance the Reaction",
    briefing: "Atoms are never created or destroyed. Fill in the coefficients so both sides hold the same atoms.",
    kind: "balance",
    targetHint: "__ H₂ + __ O₂ → __ H₂O",
    reward: "Equation Master",
  },
];

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);
