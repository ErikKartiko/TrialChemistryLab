import { BookOpen, Hexagon, FlaskConical, ShieldCheck, BrainCircuit, GraduationCap, Award, RotateCcw, Lock, Atom, Target, Scissors, Star, AlertTriangle } from "lucide-react";
import { Heading, Btn, Bar } from "../components/ui";
import { useProgress, badgesOf, learningMetrics, progress, totals } from "../services/progress";
import type { Nav } from "../routes";

export function Dashboard({ nav }: { nav: Nav }) {
  const p = useProgress();
  const m = learningMetrics(p);
  const badges = badgesOf(p);

  const dims = [
    { icon: BookOpen, label: "Materi", value: m.materi, color: "#38e1ff", note: "bagian dibaca" },
    { icon: Hexagon, label: "Pemahaman Molekul", value: m.molekul, color: "#34d399", note: "molekul dipelajari" },
    { icon: FlaskConical, label: "Prosedur Praktikum", value: m.prosedur, color: "#f472b6", note: "akurasi langkah" },
    { icon: ShieldCheck, label: "Keselamatan", value: m.keselamatan, color: "#facc15", note: "modul keselamatan" },
    { icon: BrainCircuit, label: "Kuis", value: m.kuis, color: "#c084fc", note: "skor terbaik" },
    { icon: GraduationCap, label: "HOTS", value: m.hots, color: "#fb923c", note: `${m.hotsAnswered} soal dikerjakan` },
  ];

  const tiles = [
    { label: "Bagian materi selesai", value: p.materiRead.length, icon: BookOpen },
    { label: "Molekul dipelajari", value: new Set([...p.viewedMolecules, ...p.decomposed]).size, icon: Hexagon },
    { label: "Praktikum selesai", value: `${m.labRuns}/${m.labTotal}`, icon: FlaskConical },
    { label: "Reaksi ditemukan", value: `${p.discovered.length}/${totals.reactions}`, icon: Target },
    { label: "Unsur dieksplorasi", value: `${p.explored.length}/${totals.elements}`, icon: Atom },
    { label: "Kesalahan prosedur", value: m.totalErrors, icon: AlertTriangle },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 pt-28 pb-16 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading kicker="Dashboard" title="Hasil Belajar" desc="Potret perkembangan pembelajaranmu di seluruh ekosistem MVAR — bukan sekadar poin permainan." />
        <Btn variant="danger" size="sm" onClick={() => { if (confirm("Hapus seluruh progres belajar?")) progress.reset(); }}>
          <RotateCcw size={13} /> Reset
        </Btn>
      </div>

      {/* dimensi belajar */}
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dims.map((d, i) => (
          <div key={d.label} className="glass rounded-2xl p-5 animate-fadeUp" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="rounded-lg border border-white/10 bg-white/5 p-2" style={{ color: d.color }}><d.icon size={15} /></span>
                <div>
                  <div className="text-xs font-bold text-slate-100">{d.label}</div>
                  <div className="font-mono text-[9px] text-slate-500">{d.note}</div>
                </div>
              </div>
              <span className="font-mono text-base font-bold" style={{ color: d.color }}>{d.value}%</span>
            </div>
            <Bar value={d.value} max={100} color={d.color} className="mt-3.5" />
          </div>
        ))}
      </div>

      {/* virtual lab */}
      <div className="glass-bright mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <FlaskConical size={20} className="text-cyan-300" />
          <div>
            <div className="font-display text-sm font-bold text-white">Virtual Lab: {m.labRuns}/{m.labTotal} eksperimen selesai</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="flex items-center gap-0.5">
                {[1, 2, 3].map((s) => <Star key={s} size={12} className={s <= m.bestStars ? "fill-amber-300 text-amber-300" : "text-slate-600"} />)}
              </span>
              <span className="font-mono text-[9px] tracking-wider text-slate-500 uppercase">bintang terbaik</span>
            </div>
          </div>
        </div>
        <Btn variant="solid" size="sm" onClick={() => nav({ page: "vlab" })}>Lanjut Praktikum</Btn>
      </div>

      {/* statistik */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t, i) => (
          <div key={t.label} className="glass rounded-2xl p-4 text-center animate-fadeUp" style={{ animationDelay: `${i * 0.04}s` }}>
            <t.icon size={16} className="mx-auto text-cyan-400/80" />
            <div className="mt-2 font-mono text-xl font-bold text-white">{t.value}</div>
            <div className="mt-0.5 text-[9px] leading-tight text-slate-500">{t.label}</div>
          </div>
        ))}
      </div>

      {/* lencana */}
      <div className="glass mt-6 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <Award size={18} className="text-amber-300" />
          <h3 className="font-display text-lg font-bold text-white">Lencana Pembelajaran</h3>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <div key={b.id} className={`relative overflow-hidden rounded-2xl border p-5 transition ${b.earned ? "border-amber-300/40 bg-gradient-to-b from-amber-400/10 to-transparent" : "border-slate-700/40 bg-white/[0.02] opacity-60"}`}>
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${b.earned ? "border-amber-300/50 bg-amber-400/15 text-amber-300" : "border-slate-600/40 bg-slate-800/40 text-slate-500"}`}>
                {b.earned ? <Award size={20} /> : <Lock size={17} />}
              </div>
              <div className={`mt-3 font-display text-sm font-bold ${b.earned ? "text-white" : "text-slate-400"}`}>{b.name}</div>
              <div className="mt-1 text-[10px] leading-relaxed text-slate-500">{b.desc}</div>
              {b.earned && <div className="mt-2.5 font-mono text-[9px] font-bold tracking-[0.25em] text-amber-300 uppercase">Diperoleh</div>}
            </div>
          ))}
        </div>
      </div>

      {/* aksi lanjutan */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Btn variant="ghost" size="lg" onClick={() => nav({ page: "materi" })}><BookOpen size={15} /> Kembali ke Materi</Btn>
        <Btn variant="ghost" size="lg" onClick={() => nav({ page: "lab" })}><FlaskConical size={15} /> Eksplorasi Reaksi</Btn>
        <Btn variant="ghost" size="lg" onClick={() => nav({ page: "molecules" })}><Scissors size={15} /> Bedah Molekul</Btn>
      </div>
    </div>
  );
}
