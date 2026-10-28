// ------------------------------------------------------------------
// POST-LAB — hasil pengamatan, persamaan, penjelasan molekuler,
// pertanyaan analisis berumpan balik, 6 soal HOTS berkategori,
// dan RAPOR HASIL PRAKTIKUM + rekomendasi pembelajaran.
// ------------------------------------------------------------------

import { useMemo, useRef, useState } from "react";
import {
  Eye, Sigma, Microscope, Lightbulb, GraduationCap, ClipboardList, Star, Play,
  BarChart3, CheckCircle2, AlertTriangle, Sparkles, ChevronRight, Award, PenLine,
} from "lucide-react";
import type { Experiment } from "../../data/experiments";
import { HOTS_TYPE_LABEL } from "../../data/experiments";
import type { RunStats } from "./Bench";
import { MolecularView } from "./MolecularView";
import { Btn, Formula, Tag, Panel, Bar } from "../ui";
import { progress } from "../../services/progress";
import { sfx } from "../../services/sound";
import type { Nav } from "../../routes";

const toast = (title: string, desc?: string) =>
  window.dispatchEvent(new CustomEvent("arcl-toast", { detail: { title, desc } }));

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** hitung cakupan kata kunci pada jawaban bebas siswa */
function coverage(text: string, keywords: string[]): { hit: string[]; miss: string[]; pct: number } {
  const t = text.toLowerCase();
  const hit = keywords.filter((k) => t.includes(k.toLowerCase()));
  const miss = keywords.filter((k) => !t.includes(k.toLowerCase()));
  const lenBonus = t.trim().split(/\s+/).length >= 20 ? 0.1 : 0;
  return { hit, miss, pct: clamp((hit.length / Math.max(1, keywords.length) + lenBonus) * 100) };
}

function SectionHead({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-2">
      <Icon size={15} className="text-cyan-300" />
      <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-cyan-200 uppercase">{label}</span>
    </div>
  );
}

export function PostLab({ exp, run, nav, onAgain }: { exp: Experiment; run: RunStats; nav: Nav; onAgain: () => void }) {
  const [analysis, setAnalysis] = useState("");
  const [analysisChecked, setAnalysisChecked] = useState(false);
  const [hots, setHots] = useState<Record<string, { text: string; checked: boolean }>>({});
  const [reflection, setReflection] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const savedRef = useRef(false);

  // ---------- penilaian analisis ----------
  const aq = exp.analysisQuestion;
  const aCov = useMemo(() => coverage(analysis, aq.keywords.map((k) => k.word)), [analysis, aq]);

  const hotsScores = useMemo(() => {
    return exp.postlab.hots.map((h) => {
      const st = hots[h.id];
      if (!st?.checked) return null;
      return coverage(st.text, h.keywords).pct;
    });
  }, [hots, exp.postlab.hots]);

  const hotsAnswered = hotsScores.filter((s) => s !== null).length;
  const hotsAvg = hotsAnswered > 0 ? clamp(hotsScores.reduce<number>((a, b) => a + (b ?? 0), 0) / hotsAnswered) : 0;

  // ---------- 6 dimensi rapor ----------
  const dims = useMemo(() => {
    const prosedur = run.attempts > 0 ? clamp(((run.attempts - run.errors) / run.attempts) * 100) : 0;
    const keselamatan = clamp(100 - run.overshoot * 12 - Math.max(0, run.errors - 3) * 4);
    const konsep = clamp((run.recordOk ? 62 : 24) + (run.usedHints <= 3 ? 38 : 24));
    const molekul = clamp((run.analyzeOk ? 70 : 30) + 30);
    const analisis = analysisChecked ? aCov.pct : 0;
    const hotsDim = hotsAvg;
    return [
      { key: "Ketepatan Prosedur", value: prosedur, color: "#38e1ff" },
      { key: "Keselamatan", value: keselamatan, color: "#facc15" },
      { key: "Pemahaman Konsep", value: konsep, color: "#34d399" },
      { key: "Pemahaman Molekul", value: molekul, color: "#c084fc" },
      { key: "Kemampuan Analisis", value: analisis, color: "#fb923c" },
      { key: "HOTS", value: hotsDim, color: "#f472b6" },
    ];
  }, [run, analysisChecked, aCov.pct, hotsAvg]);

  const overall = clamp(dims.reduce((s, d) => s + d.value, 0) / dims.length);

  const save = () => {
    if (savedRef.current) return;
    savedRef.current = true;
    progress.recordLabRun({ id: exp.id, errors: run.errors, attempts: run.attempts, seconds: run.seconds, stars: run.stars });
    progress.discoverReaction("neutralization");
    hotsScores.forEach((s) => { if (s !== null) progress.recordQuizCat("hots", s >= 60); });
    sfx("complete");
    toast("Hasil praktikum tersimpan", `${exp.title} · nilai keseluruhan ${overall}`);
  };

  const openReport = () => { save(); setReportOpen(true); sfx("complete"); };

  const recFor = (dimName: string, value: number) => {
    const r = exp.recommendations.find((x) => x.dim === dimName);
    if (!r) return "";
    return value >= 80 ? r.high : value >= 55 ? r.mid : r.low;
  };

  return (
    <div className="animate-fadeUp mx-auto max-w-4xl">
      {/* ---------- header hasil ---------- */}
      <div className="glass-bright rounded-3xl p-6 text-center">
        <div className="font-mono text-[10px] tracking-[0.3em] text-emerald-300 uppercase">Post-Lab · Praktikum Selesai</div>
        <div className="mt-3 flex justify-center gap-1">
          {[1, 2, 3].map((s) => <Star key={s} size={28} className={s <= run.stars ? "fill-amber-300 text-amber-300" : "text-slate-600"} />)}
        </div>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">{exp.title}</h2>
        <div className="mx-auto mt-4 grid max-w-lg grid-cols-4 gap-2">
          {[
            { v: run.attempts, l: "Percobaan" },
            { v: run.errors, l: "Kesalahan" },
            { v: run.overshoot, l: "Titik terlewati" },
            { v: `${Math.floor(run.seconds / 60)}:${String(run.seconds % 60).padStart(2, "0")}`, l: "Durasi" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-slate-600/25 bg-white/[0.02] py-2.5">
              <div className="font-mono text-lg font-bold text-cyan-300">{s.v}</div>
              <div className="font-mono text-[8px] tracking-wider text-slate-500 uppercase">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- 1. hasil pengamatan ---------- */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={Eye} label="1 · Hasil Pengamatan" />
        <p className="text-xs leading-relaxed text-slate-300">{exp.postlab.summary}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {exp.observation.macro.points.slice(0, 4).map((p, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-600/20 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-300">
              <ChevronRight size={11} className="mt-0.5 shrink-0 text-cyan-400" />{p}
            </div>
          ))}
        </div>
      </Panel>

      {/* ---------- 2. hasil reaksi & persamaan ---------- */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={Sigma} label="2 · Hasil Reaksi & Persamaan Kimia" />
        <div className="rounded-xl border border-cyan-300/20 bg-[#04101e]/70 py-4 text-center">
          <Formula text={exp.postlab.equation} className="text-xl font-bold text-white" />
          <div className="mx-auto mt-3 max-w-xs rounded-lg border border-pink-300/25 bg-pink-400/8 py-2">
            <div className="font-mono text-[8px] tracking-[0.25em] text-pink-300 uppercase">Persamaan ion bersih</div>
            <div className="font-mono text-base font-bold text-pink-100">H⁺ + OH⁻ → H₂O</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <Tag color="#c084fc">Netralisasi</Tag>
          <Tag color="#fb923c">Eksoterm</Tag>
          <Tag color="#34d399">Produk: NaCl + H₂O</Tag>
        </div>
      </Panel>

      {/* ---------- 3. penjelasan molekuler ---------- */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={Microscope} label="3 · Penjelasan Molekuler" />
        <div className="grid gap-4 md:grid-cols-[1fr_240px]">
          <p className="text-[11px] leading-relaxed text-slate-300">{exp.postlab.molecular}</p>
          <MolecularView progress={0.92} labels={false} className="h-40" />
        </div>
      </Panel>

      {/* ---------- 4. analisis (pertanyaan terbuka) ---------- */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={Lightbulb} label="4 · Analisis" />
        <p className="text-[11px] leading-relaxed text-slate-400">{exp.postlab.analysis}</p>

        <div className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-400/5 p-4">
          <div className="flex items-start gap-2">
            <PenLine size={14} className="mt-0.5 shrink-0 text-cyan-300" />
            <p className="text-xs font-semibold text-slate-100">{aq.prompt}</p>
          </div>
          <textarea
            value={analysis}
            onChange={(e) => { setAnalysis(e.target.value); setAnalysisChecked(false); }}
            rows={4}
            placeholder="Tulis penjelasanmu… sebutkan ion yang terlibat, produk yang terbentuk, dan alasan perubahan warna."
            className="mt-3 w-full rounded-lg border border-slate-600/40 bg-[#04101e] px-3 py-2.5 text-xs leading-relaxed text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[9px] tracking-wider text-slate-500 uppercase">{analysis.trim().split(/\s+/).filter(Boolean).length} kata</span>
            <Btn variant="solid" size="sm" disabled={analysis.trim().length < 20} onClick={() => { setAnalysisChecked(true); sfx(aCov.pct >= 60 ? "ok" : "step"); }}>
              Periksa Jawaban Saya
            </Btn>
          </div>

          {analysisChecked && (
            <div className="mt-3 animate-fadeUp">
              <div className={`rounded-xl border p-3.5 ${aCov.pct >= 70 ? "border-emerald-300/40 bg-emerald-400/8" : aCov.pct >= 40 ? "border-amber-300/40 bg-amber-400/8" : "border-rose-300/40 bg-rose-400/8"}`}>
                <div className={`font-mono text-[10px] font-bold tracking-[0.2em] uppercase ${aCov.pct >= 70 ? "text-emerald-300" : aCov.pct >= 40 ? "text-amber-300" : "text-rose-300"}`}>
                  {aCov.pct >= 70 ? "Analisis kuat" : aCov.pct >= 40 ? "Analisis cukup — masih bisa dilengkapi" : "Analisis perlu diperkuat"} · {aCov.pct}%
                </div>
                <Bar value={aCov.pct} max={100} color={aCov.pct >= 70 ? "#34d399" : aCov.pct >= 40 ? "#facc15" : "#fb7185"} className="mt-2" />
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <div className="font-mono text-[9px] tracking-wider text-emerald-300 uppercase">Konsep yang sudah kamu sebut</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {aCov.hit.length > 0 ? aq.keywords.filter((k) => aCov.hit.includes(k.word)).map((k) => (
                        <span key={k.word} className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] text-emerald-200">{k.concept}</span>
                      )) : <span className="text-[10px] text-slate-500">— belum ada</span>}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] tracking-wider text-amber-300 uppercase">Yang masih bisa ditambahkan</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {aCov.miss.length > 0 ? aq.keywords.filter((k) => aCov.miss.includes(k.word)).map((k) => (
                        <span key={k.word} className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-[9px] text-amber-200">{k.concept}</span>
                      )) : <span className="text-[10px] text-emerald-300">lengkap!</span>}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2.5 rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-3.5 py-3 text-[11px] leading-relaxed text-slate-200">
                <b className="text-cyan-300">Jawaban model: </b>{aq.modelAnswer}
              </p>
            </div>
          )}
        </div>
      </Panel>

      {/* ---------- 5. HOTS ---------- */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={GraduationCap} label={`5 · Pertanyaan HOTS — ${hotsAnswered}/${exp.postlab.hots.length} dijawab`} />
        <div className="space-y-4">
          {exp.postlab.hots.map((h, i) => {
            const st = hots[h.id] ?? { text: "", checked: false };
            const cov = st.checked ? coverage(st.text, h.keywords) : null;
            const meta = HOTS_TYPE_LABEL[h.type];
            return (
              <div key={h.id} className="rounded-xl border border-slate-600/25 bg-white/[0.02] p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-cyan-300">Q{i + 1}</span>
                  <Tag color={meta.color}>{meta.label}</Tag>
                </div>
                <p className="text-xs leading-relaxed font-semibold text-slate-100">{h.question}</p>
                <textarea
                  value={st.text}
                  onChange={(e) => setHots((m) => ({ ...m, [h.id]: { text: e.target.value, checked: false } }))}
                  rows={3}
                  placeholder="Tulis penalaranmu…"
                  className="mt-2.5 w-full rounded-lg border border-slate-600/40 bg-[#04101e] px-3 py-2 text-xs leading-relaxed text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
                />
                {st.checked && cov ? (
                  <div className="mt-2.5 animate-fadeUp">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 font-mono text-[9px] font-bold tracking-wider uppercase ${cov.pct >= 70 ? "border-emerald-300/40 text-emerald-300" : cov.pct >= 40 ? "border-amber-300/40 text-amber-300" : "border-rose-300/40 text-rose-300"}`}>
                        Cakupan penalaran {cov.pct}%
                      </span>
                      <span className="font-mono text-[9px] text-slate-500">{cov.hit.length}/{h.keywords.length} konsep kunci</span>
                    </div>
                    <p className="mt-2 rounded-lg border border-slate-600/25 bg-black/25 px-3 py-2 text-[10px] leading-relaxed text-slate-400">
                      <b className="text-slate-300">Rubrik: </b>{h.rubric}
                    </p>
                    <p className="mt-1.5 rounded-lg border border-cyan-300/20 bg-cyan-400/5 px-3 py-2.5 text-[11px] leading-relaxed text-slate-200">
                      <b className="text-cyan-300">Jawaban model: </b>{h.modelAnswer}
                    </p>
                  </div>
                ) : (
                  <Btn variant="solid" size="sm" className="mt-2" disabled={st.text.trim().length < 15}
                    onClick={() => { setHots((m) => ({ ...m, [h.id]: { text: st.text, checked: true } })); sfx("ok"); }}>
                    Periksa & Bandingkan
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ---------- 6. refleksi ---------- */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={ClipboardList} label="6 · Refleksi" />
        <div className="flex flex-wrap gap-2">
          {exp.postlab.reflectionPrompts.map((r) => (
            <button key={r} onClick={() => { setReflection(r); sfx("tick"); }}
              className={`rounded-full border px-3.5 py-2 text-[11px] transition ${reflection === r ? "border-cyan-300 bg-cyan-400/15 text-cyan-100" : "border-slate-600/35 text-slate-300 hover:border-cyan-300/40"}`}>
              {r}
            </button>
          ))}
        </div>
        {reflection && <p className="mt-2.5 text-[11px] text-cyan-200/90 animate-fadeIn">Tercatat — refleksi adalah bagian penting dari belajar ilmiah.</p>}
      </Panel>

      {/* ---------- CTA rapor ---------- */}
      <div className="glass-bright mt-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <Award size={22} className="text-amber-300" />
          <div>
            <div className="font-display text-base font-bold text-white">Lihat Hasil Praktikum Lengkap</div>
            <p className="text-[11px] text-slate-400">6 dimensi penilaian + rekomendasi pembelajaran khusus untukmu.</p>
          </div>
        </div>
        <Btn variant="primary" size="lg" onClick={openReport} className="demo-glow">
          <BarChart3 size={16} /> BUKA HASIL PRAKTIKUM
        </Btn>
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-3">
        <Btn variant="ghost" size="md" onClick={onAgain}><Play size={13} /> Ulangi Praktikum</Btn>
        <div className="flex flex-wrap gap-2.5">
          <Btn variant="solid" size="md" onClick={() => { save(); nav({ page: "quiz", category: "hots" }); }}>
            <GraduationCap size={14} /> Kuis HOTS
          </Btn>
          <Btn variant="ghost" size="md" onClick={() => { save(); nav({ page: "progress" }); }}>
            <BarChart3 size={14} /> Dashboard Belajar
          </Btn>
        </div>
      </div>

      {/* ================= RAPOR HASIL PRAKTIKUM ================= */}
      {reportOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setReportOpen(false)}>
          <div className="absolute inset-0 bg-[#020610]/88 backdrop-blur-sm" />
          <div className="glass relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 animate-fadeUp sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase">Molecular Vision AR · Rapor</div>
              <h3 className="mt-1 font-display text-2xl font-bold text-white">HASIL PRAKTIKUM</h3>
              <p className="mt-1 text-xs text-slate-400">{exp.code} — {exp.title}</p>

              <div className="mt-4 inline-flex items-baseline gap-2">
                <span className={`font-display text-5xl font-bold ${overall >= 80 ? "text-emerald-300" : overall >= 55 ? "text-cyan-300" : "text-amber-300"}`}>{overall}</span>
                <span className="font-mono text-sm text-slate-500">/ 100</span>
              </div>
              <div className={`mt-1 font-mono text-[11px] font-bold tracking-[0.2em] uppercase ${overall >= 80 ? "text-emerald-300" : overall >= 55 ? "text-cyan-300" : "text-amber-300"}`}>
                {overall >= 80 ? "Penguasaan Baik Sekali" : overall >= 55 ? "Penguasaan Cukup" : "Perlu Pendalaman"}
              </div>
            </div>

            {/* 6 dimensi */}
            <div className="mt-6 space-y-2.5">
              {dims.map((d) => (
                <div key={d.key} className="rounded-xl border border-slate-600/25 bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-100">{d.key}</span>
                    <span className="font-mono text-sm font-bold" style={{ color: d.color }}>{d.value}</span>
                  </div>
                  <Bar value={d.value} max={100} color={d.color} className="mt-2" />
                </div>
              ))}
            </div>

            {(!analysisChecked || hotsAnswered === 0) && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300/30 bg-amber-400/8 px-4 py-3">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-300" />
                <p className="text-[11px] leading-relaxed text-amber-100/90">
                  Beberapa dimensi masih bernilai rendah karena belum kamu kerjakan
                  {!analysisChecked && <b> — pertanyaan Analisis belum diperiksa</b>}
                  {!analysisChecked && hotsAnswered === 0 && " dan"}
                  {hotsAnswered === 0 && <b> — soal HOTS belum dijawab</b>}. Lengkapi untuk mendapat penilaian utuh.
                </p>
              </div>
            )}

            {/* rekomendasi */}
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-cyan-300" />
                <h4 className="font-display text-base font-bold text-white">Rekomendasi Pembelajaran</h4>
              </div>
              <div className="mt-3 space-y-2">
                {dims.filter((d) => d.value < 80).slice(0, 3).map((d) => (
                  <div key={d.key} className="flex items-start gap-2.5 rounded-xl border p-3.5" style={{ borderColor: `${d.color}35`, background: `${d.color}0a` }}>
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: d.color }} />
                    <div>
                      <div className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: d.color }}>{d.key} · {d.value}</div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-200">{recFor(d.key, d.value)}</p>
                    </div>
                  </div>
                ))}
                {dims.filter((d) => d.value >= 80).slice(0, 2).map((d) => (
                  <div key={d.key} className="flex items-start gap-2.5 rounded-xl border border-emerald-300/25 bg-emerald-400/6 p-3.5">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                    <div>
                      <div className="font-mono text-[9px] font-bold tracking-[0.2em] text-emerald-300 uppercase">{d.key} · {d.value}</div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-200">{recFor(d.key, d.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* langkah lanjut */}
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Btn variant="ghost" size="md" onClick={() => { setReportOpen(false); nav({ page: "materi" }); }}>Ulang Materi</Btn>
              <Btn variant="solid" size="md" onClick={() => { setReportOpen(false); nav({ page: "quiz", category: "hots" }); }}>Kuis HOTS</Btn>
              <Btn variant="primary" size="md" onClick={() => { setReportOpen(false); nav({ page: "progress" }); }}>Dashboard</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
