// ------------------------------------------------------------------
// Progress store — localStorage backed, reactive via listeners
// v2: learning metrics (materi, pre-lab, keselamatan, lab runs, quiz per-kategori)
// ------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { ELEMENTS } from "../data/elements";
import { REACTIONS } from "../data/reactions";
import { MISSIONS } from "../data/missions";
import { EXPERIMENTS } from "../data/experiments";
import { MATERI } from "../data/curriculum";
import { EXPLORER_FORMULAS } from "../data/molecules";

export interface LabRun {
  id: string;            // experiment id
  errors: number;
  attempts: number;
  seconds: number;
  stars: number;         // 1..3
}

export interface ProgressState {
  // legacy (dipertahankan)
  explored: string[];
  discovered: string[];
  missions: string[];
  decomposed: string[];
  viewedMolecules: string[];
  quizBest: number;
  quizAttempts: number;
  // v2 pembelajaran
  materiRead: string[];                              // section ids
  prelabDone: string[];                              // experiment ids
  safetyDone: string[];
  labRuns: LabRun[];
  quizByCat: Record<string, { correct: number; total: number }>;
  soundOn: boolean;
}

const KEY = "arcl.progress.v2";

const EMPTY: ProgressState = {
  explored: [], discovered: [], missions: [], decomposed: [],
  viewedMolecules: [], quizBest: 0, quizAttempts: 0,
  materiRead: [], prelabDone: [], safetyDone: [], labRuns: [],
  quizByCat: {}, soundOn: true,
};

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("arcl.progress.v1");
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function save(next: Partial<ProgressState>) {
  state = { ...state, ...next };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  listeners.forEach((l) => l());
}

const addUnique = (list: string[], v: string) => (list.includes(v) ? list : [...list, v]);

export const progress = {
  exploreElement: (symbol: string) => save({ explored: addUnique(state.explored, symbol) }),
  discoverReaction: (id: string) => save({ discovered: addUnique(state.discovered, id) }),
  completeMission: (id: string) => save({ missions: addUnique(state.missions, id) }),
  decompose: (formula: string) => save({ decomposed: addUnique(state.decomposed, formula) }),
  viewMolecule: (formula: string) => save({ viewedMolecules: addUnique(state.viewedMolecules, formula) }),
  recordQuiz: (scorePct: number) =>
    save({ quizBest: Math.max(state.quizBest, scorePct), quizAttempts: state.quizAttempts + 1 }),
  // v2
  readMateri: (sectionId: string) => save({ materiRead: addUnique(state.materiRead, sectionId) }),
  completePrelab: (id: string) => save({ prelabDone: addUnique(state.prelabDone, id) }),
  completeSafety: (id: string) => save({ safetyDone: addUnique(state.safetyDone, id) }),
  recordLabRun: (run: LabRun) => {
    const runs = state.labRuns.filter((r) => r.id !== run.id);
    const bestPrev = state.labRuns.find((r) => r.id === run.id);
    const keep = bestPrev && bestPrev.stars > run.stars ? bestPrev : run;
    save({ labRuns: [...runs, keep] });
  },
  recordQuizCat: (cat: string, correct: boolean) => {
    const cur = state.quizByCat[cat] ?? { correct: 0, total: 0 };
    save({ quizByCat: { ...state.quizByCat, [cat]: { correct: cur.correct + (correct ? 1 : 0), total: cur.total + 1 } } });
  },
  setSound: (on: boolean) => save({ soundOn: on }),
  reset: () => save({ ...EMPTY }),
  get: () => state,
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state,
  );
}

// ---------------- metrik pembelajaran (Dashboard) ----------------

const TOTAL_MATERI_SECTIONS = MATERI.reduce((s, m) => s + m.sections.length, 0);

export interface LearningMetrics {
  materi: number;        // %
  molekul: number;       // %
  prosedur: number;      // % (akurasi prosedur lab)
  keselamatan: number;   // %
  kuis: number;          // %
  hots: number;          // %
  hotsAnswered: number;
  labRuns: number;
  labTotal: number;
  bestStars: number;
  totalErrors: number;
}

export function learningMetrics(p: ProgressState): LearningMetrics {
  const materi = Math.round((p.materiRead.length / Math.max(1, TOTAL_MATERI_SECTIONS)) * 100);

  const molSeen = new Set([...p.viewedMolecules, ...p.decomposed]).size;
  const molekul = Math.round((molSeen / EXPLORER_FORMULAS.length) * 100);

  const runs = p.labRuns;
  const totalErr = runs.reduce((s, r) => s + r.errors, 0);
  const totalAtt = runs.reduce((s, r) => s + r.attempts, 0);
  const prosedur = totalAtt > 0 ? Math.round(((totalAtt - totalErr) / totalAtt) * 100) : 0;

  const started = new Set([...p.safetyDone]).size;
  const keselamatan = EXPERIMENTS.length > 0 ? Math.round((started / EXPERIMENTS.length) * 100) : 0;

  const hotsCat = p.quizByCat["hots"];
  const hots = hotsCat && hotsCat.total > 0 ? Math.round((hotsCat.correct / hotsCat.total) * 100) : 0;

  return {
    materi, molekul, prosedur: runs.length === 0 ? 0 : prosedur, keselamatan,
    kuis: p.quizBest, hots, hotsAnswered: hotsCat?.total ?? 0,
    labRuns: runs.length, labTotal: EXPERIMENTS.length,
    bestStars: runs.reduce((m, r) => Math.max(m, r.stars), 0),
    totalErrors: totalErr,
  };
}

// ---------------- lencana (gamifikasi pendukung) ----------------

export interface Badge {
  id: string;
  name: string;
  desc: string;
  earned: boolean;
}

export function badgesOf(p: ProgressState): Badge[] {
  const m = learningMetrics(p);
  return [
    { id: "atom_explorer", name: "Penjelajah Atom", desc: "Eksplorasi 5 unsur berbeda dalam 3D", earned: p.explored.length >= 5 },
    { id: "molecule_builder", name: "Ekspertis Molekul", desc: "Pelajari 3 molekul & buka 2 misi/dekomposisi", earned: p.viewedMolecules.length >= 3 && (p.missions.length + p.decomposed.length) >= 2 },
    { id: "reaction_master", name: "Ahli Prosedur", desc: "Selesaikan Praktikum 01 dengan maksimal 2 kesalahan", earned: p.labRuns.some((r) => r.errors <= 2) },
    { id: "chemistry_expert", name: "Pemikir HOTS", desc: "Semua 7 reaksi ditemukan + kuis ≥ 80%", earned: p.discovered.length >= REACTIONS.length && p.quizBest >= 80 },
    { id: "lab_expert", name: "Ahli Laboratorium", desc: "Selesaikan praktikum tanpa kesalahan (3 bintang)", earned: p.labRuns.some((r) => r.stars >= 3) },
    { id: "problem_solver", name: "Pemecah Masalah Kimia", desc: "Tuntaskan pre-lab dan keselamatan penuh", earned: p.prelabDone.length >= 1 && p.safetyDone.length >= 1 && m.hots >= 60 },
  ];
}

export const totals = {
  elements: ELEMENTS.length,
  reactions: REACTIONS.length,
  missions: MISSIONS.length,
};
