import { useEffect, useState } from "react";
import {
  BookOpen, Target, Atom, AlertTriangle, Droplets, FlaskConical, ChevronRight,
  ShieldAlert, Beaker, Boxes, CheckCircle2, Lightbulb, GraduationCap, Eye, ArrowRight,
} from "lucide-react";
import { MATERI } from "../data/curriculum";
import { moleculeByFormula } from "../data/molecules";
import { Btn, Tag, Bar, Formula } from "../components/ui";
import { Stage3D } from "../components/three/core";
import { MoleculeGroup } from "../components/three/MoleculeGroup";
import { progress, useProgress } from "../services/progress";
import { sfx } from "../services/sound";
import type { Nav } from "../routes";

export function Materi({ nav }: { nav: Nav }) {
  const m = MATERI[0];
  const [active, setActive] = useState(m.sections[0].id);
  const p = useProgress();
  const section = m.sections.find((s) => s.id === active)!;

  useEffect(() => { progress.readMateri(active); }, [active]);

  const readPct = Math.round((p.materiRead.length / m.sections.length) * 100);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-16 sm:px-8">
      {/* header modul */}
      <div className="glass-bright relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Tag color="#38e1ff"><BookOpen size={10} /> Materi Kimia</Tag>
              <Tag color="#94a3b8">{m.grade}</Tag>
              <Tag color="#94a3b8">{m.duration}</Tag>
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{m.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{m.intro}</p>
          </div>
          <div className="w-48">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-wider text-slate-400 uppercase">
              <span>Dibaca</span><span className="text-cyan-300">{readPct}%</span>
            </div>
            <Bar value={p.materiRead.length} max={m.sections.length} className="mt-1.5" />
          </div>
        </div>

        {/* tujuan */}
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {m.objectives.map((o, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-cyan-300/15 bg-cyan-400/5 px-3.5 py-2.5 text-[11px] text-slate-200">
              <Target size={13} className="mt-0.5 shrink-0 text-cyan-300" /> {o}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* navigasi bagian */}
        <div className="glass h-fit rounded-2xl p-3 lg:sticky lg:top-20">
          <div className="px-1.5 pb-2 font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">Daftar Isi</div>
          <div className="flex gap-1.5 overflow-x-auto lg:flex-col">
            {m.sections.map((s, i) => {
              const read = p.materiRead.includes(s.id);
              const on = s.id === active;
              return (
                <button
                  key={s.id}
                  onClick={() => { setActive(s.id); sfx("tick"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`flex w-full min-w-[190px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition lg:min-w-0 ${on ? "border-cyan-300/50 bg-cyan-400/10 text-white" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[9px] font-bold ${read ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-300" : "border-slate-600/50 text-slate-500"}`}>
                    {read ? <CheckCircle2 size={11} /> : i + 1}
                  </span>
                  {s.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* konten bagian */}
        <div key={active} className="animate-fadeUp space-y-4">
          <div className="glass rounded-3xl p-6 sm:p-8">
            <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase">Bagian {m.sections.findIndex((s) => s.id === active) + 1} dari {m.sections.length}</div>
            <h3 className="mt-1.5 font-display text-2xl font-bold text-white">{section.title}</h3>

            <div className="mt-4 space-y-3">
              {section.body.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-300">{para}</p>
              ))}
            </div>

            {/* visual sesuai jenis */}
            {section.visual?.kind === "molecules" && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#050c1a]">
                <div className="grid grid-cols-3 divide-x divide-slate-700/30">
                  {["HCl", "NaOH", "H2O"].map((f) => (
                    <div key={f} className="relative">
                      <Stage3D className="h-44" cameraPos={[0, 0.3, 4.6]} fov={42} controls={false}>
                        <MoleculeGroup spec={moleculeByFormula(f)!} scale={1.1} />
                      </Stage3D>
                      <div className="pb-2.5 text-center">
                        <Formula text={f} className="text-sm font-bold text-white" />
                        <div className="font-mono text-[8px] tracking-wider text-slate-500 uppercase">{moleculeByFormula(f)!.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => nav({ page: "molecules", molecule: section.visual!.focus })} className="flex w-full items-center justify-center gap-1.5 border-t border-slate-700/30 py-2.5 font-mono text-[10px] font-bold tracking-wider text-cyan-300 uppercase transition hover:bg-cyan-400/5">
                  <Eye size={12} /> Pelajari molekulnya di Molekul 3D <ArrowRight size={11} />
                </button>
              </div>
            )}

            {section.visual?.kind === "compare" && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[{ title: "SIFAT ASAM", color: "#fb7185", items: m.acidTraits }, { title: "SIFAT BASA", color: "#60a5fa", items: m.baseTraits }].map((col) => (
                  <div key={col.title} className="rounded-2xl border p-4" style={{ borderColor: `${col.color}35`, background: `${col.color}0a` }}>
                    <div className="font-mono text-[10px] font-bold tracking-[0.25em]" style={{ color: col.color }}>{col.title}</div>
                    <div className="mt-3 space-y-2">
                      {col.items.map((t) => (
                        <div key={t.title} className="flex items-start gap-2.5 text-[11px]">
                          <Atom size={12} className="mt-0.5 shrink-0" style={{ color: col.color }} />
                          <div><b className="text-slate-100">{t.title}</b> <span className="text-slate-400">— {t.text}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.visual?.kind === "indicators" && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-600/25">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/40 bg-white/[0.03] font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase">
                      <th className="px-4 py-2.5">Indikator</th>
                      <th className="px-4 py-2.5">Dalam Asam</th>
                      <th className="px-4 py-2.5">Dalam Basa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.indicators.map((ind) => (
                      <tr key={ind.name} className="border-b border-slate-800/50 last:border-0">
                        <td className="px-4 py-2.5 font-semibold text-slate-200">
                          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: ind.color }} />{ind.name}
                        </td>
                        <td className="px-4 py-2.5 text-rose-300">{ind.inAcid}</td>
                        <td className="px-4 py-2.5 text-emerald-300">{ind.inBase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {section.visual?.kind === "ph" && (
              <div className="mt-5 rounded-2xl border border-slate-600/25 bg-white/[0.02] p-4">
                <div className="relative h-3.5 rounded-full" style={{ background: "linear-gradient(90deg,#ff5d5d,#ff9d5d 18%,#fde047 36%,#34d399 52%,#38bdf8 72%,#818cf8 88%,#c084fc)" }} />
                <div className="mt-1 flex justify-between font-mono text-[9px] text-slate-500">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => <span key={n}>{n}</span>)}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.phExamples.map((e) => (
                    <span key={e.label} className="rounded-full border border-slate-600/40 bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] text-slate-300">
                      {e.label} <b className="text-cyan-300">{e.ph}</b>
                    </span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[9px] tracking-wider uppercase">
                  <span className="rounded-lg bg-rose-400/10 py-1.5 text-rose-300">Asam &lt; 7</span>
                  <span className="rounded-lg bg-emerald-400/10 py-1.5 text-emerald-300">Netral = 7</span>
                  <span className="rounded-lg bg-violet-400/10 py-1.5 text-violet-300">Basa &gt; 7</span>
                </div>
              </div>
            )}

            {/* contoh kontekstual */}
            {section.example && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/5 p-4">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                <div>
                  <div className="text-xs font-bold text-emerald-200">{section.example.title}</div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">{section.example.text}</p>
                </div>
              </div>
            )}

            {/* poin kunci */}
            <div className="mt-5 flex flex-wrap gap-2">
              {section.keyPoints.map((k) => (
                <span key={k} className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-semibold text-cyan-200">{k}</span>
              ))}
            </div>
          </div>

          {/* alat & bahan + keselamatan */}
          {active === "netralisasi" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase"><Beaker size={12} /> Alat</div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">{m.toolMaterialLinks.tools.map((t) => <Tag key={t} color="#94a3b8">{t}</Tag>)}</div>
                <div className="mt-3 flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase"><Boxes size={12} /> Bahan</div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">{m.toolMaterialLinks.materials.map((t) => <Tag key={t} color="#f472b6">{t}</Tag>)}</div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.2em] text-rose-300 uppercase"><ShieldAlert size={12} /> Keselamatan</div>
                <ul className="mt-2.5 space-y-1.5">
                  {m.safety.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-300"><AlertTriangle size={10} className="mt-0.5 shrink-0 text-amber-300" />{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* navigasi bagian berikutnya */}
          <div className="flex items-center justify-between">
            {(() => {
              const idx = m.sections.findIndex((s) => s.id === active);
              const next = m.sections[idx + 1];
              const prev = m.sections[idx - 1];
              return (
                <>
                  <Btn variant="ghost" size="md" disabled={!prev} onClick={() => prev && setActive(prev.id)}>Sebelumnya</Btn>
                  {next ? (
                    <Btn variant="primary" size="md" onClick={() => { setActive(next.id); sfx("ok"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                      Lanjut — {next.title} <ChevronRight size={14} />
                    </Btn>
                  ) : (
                    <Btn variant="primary" size="lg" onClick={() => nav({ page: "vlab", experiment: m.experimentId, vphase: "prelab" })}>
                      <FlaskConical size={15} /> Lanjut — PRE-LAB Praktikum
                    </Btn>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* rantai pembelajaran */}
      <LearningChain nav={nav} current="materi" />

      {/* footer CTA */}
      <div className="glass mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <GraduationCap size={22} className="text-cyan-300" />
          <div>
            <div className="font-display text-base font-bold text-white">Sudah memahami materinya?</div>
            <p className="text-xs text-slate-400">Uji pemahamanmu dengan kuis kategori Konsep &amp; Molekul.</p>
          </div>
        </div>
        <Btn variant="solid" size="md" onClick={() => nav({ page: "quiz", category: "konsep" })}>
          <Droplets size={14} /> Kerjakan Kuis
        </Btn>
      </div>
    </div>
  );
}

// ---------- rantai pembelajaran lintas halaman ----------
export function LearningChain({ nav, current }: { nav: Nav; current: string }) {
  const steps = [
    { id: "materi", label: "Materi", page: "materi" as const },
    { id: "molecules", label: "Molekul 3D", page: "molecules" as const },
    { id: "prelab", label: "Pre-Lab", page: "vlab" as const, route: { experiment: "exp-neutralization", vphase: "prelab" as const } },
    { id: "vlab", label: "Virtual Lab", page: "vlab" as const },
    { id: "quiz", label: "Kuis", page: "quiz" as const },
    { id: "progress", label: "Progres", page: "progress" as const },
  ];
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <div className="mt-8 flex flex-wrap items-center gap-1.5 rounded-2xl border border-cyan-300/12 bg-[#050c1a]/70 px-4 py-3">
      <span className="mr-2 font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">Alur belajar</span>
      {steps.map((s, i) => (
        <span key={s.id} className="flex items-center gap-1.5">
          <button
            onClick={() => nav({ page: s.page, ...(s.route ?? {}) })}
            className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider transition ${
              i === idx ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : i < idx ? "border-emerald-300/30 text-emerald-300/80" : "border-slate-600/35 text-slate-400 hover:text-slate-200"
            }`}
          >
            {s.label}
          </button>
          {i < steps.length - 1 && <ChevronRight size={11} className="text-slate-600" />}
        </span>
      ))}
    </div>
  );
}
