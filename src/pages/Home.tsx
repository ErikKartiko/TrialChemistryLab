import { useEffect } from "react";
import {
  BookOpen, Hexagon, FlaskConical, ClipboardCheck, BrainCircuit, ScanEye,
  ArrowRight, Play, Atom, Target, Sparkles, Eye, Shield, BarChart3,
} from "lucide-react";
import { Stage3D } from "../components/three/core";
import { MoleculeGroup } from "../components/three/MoleculeGroup";
import { moleculeByFormula, EXPLORER_FORMULAS } from "../data/molecules";
import { EXPERIMENTS } from "../data/experiments";
import { Formula, Btn, Panel } from "../components/ui";
import { useProgress, totals, learningMetrics } from "../services/progress";
import type { Nav, Route } from "../routes";

const TICKER = [
  "HCl + NaOH → NaCl + H2O", "2H2 + O2 → 2H2O", "H+ + OH- → H2O",
  "C + O2 → CO2", "N2 + 3H2 → 2NH3", "Fenolftalein: basa = merah muda",
];

const JOURNEY = [
  { n: "01", title: "PELAJARI", desc: "Pahami konsep kimia dengan bahasa sederhana dan contoh nyata.", icon: BookOpen, color: "#38e1ff", route: { page: "materi" as const } },
  { n: "02", title: "VISUALISASIKAN", desc: "Amati bentuk molekul dalam 3D — lihat yang tak terlihat mata.", icon: Hexagon, color: "#34d399", route: { page: "molecules" as const } },
  { n: "03", title: "PERSIAPKAN", desc: "Pre-Lab: kenali alat, bahan, prosedur, dan keselamatan kerja.", icon: Shield, color: "#facc15", route: { page: "vlab" as const, experiment: "exp-neutralization", vphase: "prelab" as const } },
  { n: "04", title: "PRAKTIKKAN", desc: "Lakukan simulasi praktikum tahap demi tahap dengan validasi.", icon: FlaskConical, color: "#f472b6", route: { page: "vlab" as const } },
  { n: "05", title: "ANALISIS", desc: "Hubungkan makroskopis, mikroskopis, dan simbolik dari hasilmu.", icon: Eye, color: "#c084fc", route: { page: "vlab" as const } },
  { n: "06", title: "EVALUASI", desc: "Kerjakan kuis dan soal HOTS untuk menguji penalaranmu.", icon: BrainCircuit, color: "#fb923c", route: { page: "quiz" as const } },
];

export function Home({ nav }: { nav: Nav }) {
  const p = useProgress();
  const m = learningMetrics(p);

  useEffect(() => { /* warm molecules */ void EXPLORER_FORMULAS; }, []);

  return (
    <div className="relative">
      {/* ================= HERO ================= */}
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-5 pt-28 pb-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-32">
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3.5 py-1.5 animate-fadeUp">
            <Sparkles size={13} className="text-cyan-300" />
            <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-cyan-300 uppercase">
              Media Pembelajaran Kimia Berbasis Augmented Reality
            </span>
          </div>

          <div className="space-y-4 animate-fadeUp d-1">
            <div className="font-display text-sm font-bold tracking-[0.35em] text-cyan-400 uppercase">Molecular Vision AR</div>
            <h1 className="font-display text-4xl leading-[1.06] font-bold tracking-tight text-white sm:text-6xl">
              Belajar Kimia.
              <br />
              Lihat <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent text-glow">Molekulnya.</span>
              <br />
              Lakukan Praktikumnya.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
              Media pembelajaran untuk siswa SMA/MA: memahami konsep, memvisualisasikan molekul,
              dan melakukan simulasi praktikum secara interaktif, sistematis, dan aman.
              <span className="mt-1 block font-mono text-[10px] tracking-[0.25em] text-cyan-400/80 uppercase">
                Visualisasikan · Simulasikan · Pahami
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 animate-fadeUp d-2">
            <Btn variant="primary" size="lg" onClick={() => nav({ page: "materi" })}>
              <BookOpen size={16} /> MULAI BELAJAR
            </Btn>
            <Btn variant="solid" size="lg" onClick={() => nav({ page: "vlab" })}>
              <FlaskConical size={16} /> MASUK VIRTUAL LAB
            </Btn>
            <Btn variant="ghost" size="lg" onClick={() => window.dispatchEvent(new CustomEvent("mvar-tour"))}>
              <Play size={15} /> DEMO MVAR
            </Btn>
          </div>

          <div className="flex flex-wrap gap-x-7 gap-y-2.5 pt-1 font-mono text-[10px] tracking-wider text-slate-500 animate-fadeUp d-3">
            <span><b className="text-cyan-300">{totals.elements}</b> UNSUR</span>
            <span><b className="text-cyan-300">{EXPERIMENTS.length}</b> PRAKTIKUM TERSTRUKTUR</span>
            <span><b className="text-cyan-300">{totals.reactions}</b> REAKSI</span>
            <span><b className="text-cyan-300">{m.labRuns}</b> LAB SELESAI</span>
          </div>
        </div>

        {/* hero 3D */}
        <div className="relative h-[340px] sm:h-[440px] animate-fadeUp d-2">
          <div className="absolute inset-0 rounded-[2rem] border border-cyan-300/10 bg-gradient-to-b from-cyan-400/[0.05] to-transparent" />
          <Stage3D className="h-full w-full" cameraPos={[0, 0.6, 7.4]} fov={40} controls={false}>
            <MoleculeGroup spec={moleculeByFormula("H2O")!} scale={1.25} />
            <MoleculeGroup spec={moleculeByFormula("NaOH")!} scale={0.62} position={[-2.55, 1.3, -1]} />
            <MoleculeGroup spec={moleculeByFormula("HCl")!} scale={0.6} position={[2.5, -1.2, -0.6]} />
            <mesh rotation={[Math.PI / 2.5, 0.4, 0]}>
              <torusGeometry args={[2.6, 0.012, 8, 128]} />
              <meshBasicMaterial color="#38e1ff" transparent opacity={0.25} />
            </mesh>
          </Stage3D>
          <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex items-end justify-between">
            <div className="rounded-xl border border-cyan-300/20 bg-[#060d1d]/85 px-3.5 py-2.5 backdrop-blur-md">
              <div className="font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">Visualisasi Molekuler</div>
              <div className="font-display text-sm font-bold text-white">Air · <Formula text="H2O" /></div>
            </div>
            <div className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 font-mono text-[9px] font-semibold tracking-[0.2em] text-emerald-300 uppercase">
              Siap Simulasi
            </div>
          </div>
        </div>
      </section>

      {/* ticker */}
      <div className="relative overflow-hidden border-y border-cyan-300/10 bg-[#050c1a]/70 py-2.5">
        <div className="marquee-track gap-10">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap">
              <Formula text={t} className="text-[12px] text-slate-400" />
              <span className="h-1 w-1 rounded-full bg-cyan-400/50" />
            </span>
          ))}
        </div>
      </div>

      {/* ================= ALUR PEMBELAJARAN ================= */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="h-px w-8 bg-cyan-400/60" />
          <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-cyan-400 uppercase">Alur Pembelajaran MVAR</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {JOURNEY.map((j, i) => (
            <button
              key={j.n}
              onClick={() => nav(j.route)}
              className="group glass relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/35 animate-fadeUp"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-15 blur-2xl transition group-hover:opacity-40" style={{ background: j.color }} />
              <div className="flex items-start justify-between">
                <span className="font-display text-2xl font-bold" style={{ color: `${j.color}66` }}>{j.n}</span>
                <span className="rounded-xl border border-white/10 bg-white/5 p-2" style={{ color: j.color }}><j.icon size={17} /></span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold tracking-wide text-white">{j.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{j.desc}</p>
              <div className="mt-3 flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: j.color }}>
                Buka <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
              </div>
              {i < JOURNEY.length - 1 && (
                <div className="absolute right-4 bottom-4 hidden text-slate-700 lg:block"><ArrowRight size={13} className="rotate-90 xl:rotate-0" /></div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ================= REKOMENDASI ================= */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <Panel className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -top-14 -left-14 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.3em] text-emerald-300 uppercase">
                <Target size={12} /> Rekomendasi Pembelajaran
              </div>
              <h3 className="mt-1.5 font-display text-xl font-bold text-white">Asam dan Basa — Jalur Lengkap</h3>
              <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-400">
                Satu topik utuh dari konsep sampai evaluasi — dirancang untuk SMA/MA dan menjadi fondasi titrasi.
              </p>
            </div>
            <Btn variant="primary" size="lg" onClick={() => nav({ page: "materi" })}>
              Mulai Jalur Ini <ArrowRight size={15} />
            </Btn>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {([
              { label: "Materi", route: { page: "materi" } },
              { label: "Molekul 3D", route: { page: "molecules" } },
              { label: "Pre-Lab", route: { page: "vlab", experiment: "exp-neutralization", vphase: "prelab" } },
              { label: "Virtual Lab", route: { page: "vlab", experiment: "exp-neutralization" } },
              { label: "Post-Lab", route: { page: "vlab", experiment: "exp-neutralization" } },
              { label: "Kuis HOTS", route: { page: "quiz", category: "hots" } },
            ] as { label: string; route: Route }[]).map((s, i, arr) => (
              <span key={s.label} className="flex items-center gap-1.5">
                <button
                  onClick={() => nav(s.route)}
                  className="rounded-full border border-slate-600/40 px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-wider text-slate-300 transition hover:border-emerald-300/50 hover:text-emerald-200"
                >
                  {s.label}
                </button>
                {i < arr.length - 1 && <ArrowRight size={11} className="text-slate-600" />}
              </span>
            ))}
          </div>
        </Panel>

        {/* shortcut sekunder */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Atom, label: "Eksplorasi Unsur", route: { page: "elements" as const }, color: "#38e1ff" },
            { icon: ScanEye, label: "AR Molekul", route: { page: "ar" as const }, color: "#34d399" },
            { icon: ClipboardCheck, label: "Misi & Lencana", route: { page: "missions" as const }, color: "#facc15" },
            { icon: BarChart3, label: "Hasil Belajar", route: { page: "progress" as const }, color: "#c084fc" },
          ].map((s) => (
            <button key={s.label} onClick={() => nav(s.route)} className="glass group flex items-center gap-3 rounded-2xl p-4 text-left transition hover:border-cyan-300/30">
              <span className="rounded-lg border border-white/10 bg-white/5 p-2" style={{ color: s.color }}><s.icon size={15} /></span>
              <span className="text-xs font-semibold text-slate-200">{s.label}</span>
              <ArrowRight size={12} className="ml-auto text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
