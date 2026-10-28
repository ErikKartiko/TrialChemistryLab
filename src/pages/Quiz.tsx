import { useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, Eye, Scale, ListChecks, GraduationCap } from "lucide-react";
import { QUIZ, CATEGORY_META, type QuizQuestion, type QuizCategory } from "../data/quiz";
import { moleculeByFormula } from "../data/molecules";
import { Heading, Btn, Formula, Tag, Bar } from "../components/ui";
import { Stage3D } from "../components/three/core";
import { MoleculeGroup } from "../components/three/MoleculeGroup";
import { progress, useProgress } from "../services/progress";
import { sfx } from "../services/sound";
import type { Nav } from "../routes";

const KIND_META: Record<QuizQuestion["kind"], { label: string; color: string; icon: typeof Eye }> = {
  mc: { label: "Pilihan Ganda", color: "#38e1ff", icon: ListChecks },
  identify: { label: "Identifikasi Reaksi", color: "#c084fc", icon: Eye },
  balance: { label: "Penyetaraan", color: "#fb923c", icon: Scale },
  visual: { label: "Visual 3D", color: "#34d399", icon: Eye },
};

export function Quiz({ nav, initialCategory }: { nav: Nav; initialCategory?: string }) {
  const p = useProgress();
  const [cat, setCat] = useState<string>(initialCategory ?? "semua");
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [coef, setCoef] = useState<number[]>([1, 1, 1]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = useMemo(() => (cat === "semua" ? QUIZ : QUIZ.filter((q) => q.category === cat)), [cat]);
  const q = questions[idx] ?? questions[0];
  const meta = KIND_META[q.kind];
  const catMeta = CATEGORY_META[q.category];

  const correctNow = useMemo(() => {
    if (q.kind === "balance") return q.balanceAnswer!.every((v, i) => coef[i] === v);
    return picked === q.answerIndex;
  }, [q, picked, coef]);

  const resetQuestion = () => { setPicked(null); setCoef([1, 1, 1]); setChecked(false); };

  const check = () => {
    setChecked(true);
    if (correctNow) setScore((s) => s + 1);
    progress.recordQuizCat(q.category, correctNow);
    sfx(correctNow ? "ok" : "err");
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      progress.recordQuiz(Math.round((score / questions.length) * 100));
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
      resetQuestion();
    }
  };

  const restartWith = (c: string) => {
    setCat(c); setStarted(true); setFinished(false); setIdx(0); setScore(0); resetQuestion(); sfx("step");
  };

  // ---------- intro / hasil ----------
  if (!started || finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28 pb-16 sm:px-8">
        <Heading kicker="Evaluasi Pemahaman" title="Kuis Kimia" desc="Pilih kategori materi atau kerjakan semuanya. Setiap jawaban — benar maupun salah — selalu disertai pembahasan." />

        <div className="mt-6 flex flex-wrap gap-1.5">
          {[["semua", "Semua", "#38e1ff"], ...Object.entries(CATEGORY_META).map(([k, v]): [string, string, string] => [k, v.label, v.color])].map(([key, label, color]) => {
            const n = key === "semua" ? QUIZ.length : QUIZ.filter((x) => x.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setCat(key)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider uppercase transition ${cat === key ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                style={{ borderColor: cat === key ? color : `${color}35`, background: cat === key ? `${color}22` : "transparent" }}
              >
                {label} · {n}
              </button>
            );
          })}
        </div>

        <div className="glass mt-5 rounded-3xl p-8 text-center animate-fadeUp">
          {finished ? (
            <>
              <Trophy size={44} className={`mx-auto ${pct >= 80 ? "text-amber-300" : "text-slate-400"}`} />
              <div className="mt-4 font-display text-4xl font-bold text-white">{score} / {questions.length}</div>
              <div className={`mt-1 font-mono text-sm font-bold tracking-widest ${pct >= 80 ? "text-emerald-300" : pct >= 50 ? "text-cyan-300" : "text-orange-300"}`}>
                {pct}% — {pct >= 80 ? "PEMAHAMAN KUAT" : pct >= 50 ? "TERUS BERLATIH" : "PELAJARI KEMBALI MATERINYA"}
              </div>
              <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-slate-400">
                {pct >= 80
                  ? "Luar biasa. Skor terbaikmu tersimpan — coba kategori HOTS untuk tantangan penalaran."
                  : "Baca kembali pembahasan tiap soal, ulangi materi terkait, lalu coba lagi. Kesalahan adalah bagian dari belajar."}
              </p>
            </>
          ) : (
            <>
              <BrainCircuit size={44} className="mx-auto text-cyan-300" />
              <h3 className="mt-4 font-display text-2xl font-bold text-white">
                {questions.length} soal siap dikerjakan
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">
                Kategori: <b className="text-cyan-300">{cat === "semua" ? "Semua Materi" : CATEGORY_META[cat as QuizCategory].label}</b> ·
                pembahasan di setiap jawaban · skor terbaik tersimpan.
                {p.quizBest > 0 && <> Skor terbaik: <b className="text-cyan-300">{p.quizBest}%</b>.</>}
              </p>
            </>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Btn variant="primary" size="lg" onClick={() => restartWith(cat)}>
              <BrainCircuit size={16} /> {finished ? "Ulangi Kuis" : "Mulai Kuis"}
            </Btn>
            {finished && (
              <>
                <Btn variant="ghost" size="lg" onClick={() => restartWith("hots")}><GraduationCap size={15} /> Khusus HOTS</Btn>
                <Btn variant="ghost" size="lg" onClick={() => nav({ page: "materi" })}>Kembali ke Materi</Btn>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- pertanyaan ----------
  return (
    <div className="mx-auto max-w-3xl px-5 pt-28 pb-16 sm:px-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Tag color={catMeta.color}>{catMeta.label}</Tag>
          <Tag color={meta.color}><meta.icon size={10} /> {meta.label}</Tag>
        </div>
        <span className="font-mono text-xs text-slate-400">Soal {idx + 1} / {questions.length}</span>
      </div>
      <Bar value={idx} max={questions.length} className="mt-3" />

      <div className="glass mt-5 rounded-3xl p-6 sm:p-8 animate-fadeUp" key={q.id}>
        <h3 className="font-display text-lg leading-snug font-bold text-white sm:text-xl">{q.prompt}</h3>

        {q.equation && (
          <div className="mt-4 rounded-xl border border-cyan-300/20 bg-[#04101e]/70 px-4 py-3 text-center">
            <Formula text={q.equation} className="text-lg font-bold text-white" />
          </div>
        )}

        {q.visualMolecule && (
          <div className="mt-4 overflow-hidden rounded-xl border border-cyan-300/15 bg-[#050c1a]">
            <Stage3D className="h-[240px]" cameraPos={[0, 0.4, 5.4]} fov={42} controls={false}>
              <MoleculeGroup spec={moleculeByFormula(q.visualMolecule)!} scale={1.3} />
            </Stage3D>
            <div className="pb-2 text-center font-mono text-[9px] tracking-[0.25em] text-slate-500 uppercase">model 3D interaktif — seret untuk memutar</div>
          </div>
        )}

        {q.kind === "balance" ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {q.balanceSlots!.map((f, i) => (
              <span key={f} className="flex items-center gap-2">
                <input
                  type="number" min={1} max={9} value={coef[i]} disabled={checked}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(9, Number(e.target.value) || 1));
                    setCoef((c) => { const n = [...c]; n[i] = v; return n; });
                  }}
                  className="coef-input w-12 rounded-lg border border-cyan-300/30 bg-[#04101e] py-2 text-center font-mono text-base font-bold text-cyan-200 outline-none focus:border-cyan-300 disabled:opacity-60"
                />
                <Formula text={f} className="font-bold text-white" />
                {i === 0 && <span className="text-slate-500">+</span>}
                {i === 1 && <span className="text-slate-500">→</span>}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {q.options!.map((opt, i) => {
              const isPicked = picked === i;
              const isAnswer = checked && i === q.answerIndex;
              const isWrong = checked && isPicked && i !== q.answerIndex;
              return (
                <button
                  key={i}
                  disabled={checked}
                  onClick={() => setPicked(i)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                    isAnswer ? "border-emerald-300/50 bg-emerald-400/10 text-emerald-200"
                    : isWrong ? "border-rose-400/50 bg-rose-400/10 text-rose-200"
                    : isPicked ? "border-cyan-300/50 bg-cyan-400/10 text-white"
                    : "border-slate-600/30 bg-white/[0.02] text-slate-300 hover:border-cyan-300/30"
                  }`}
                >
                  <span className="font-mono text-[10px] font-bold text-slate-500">{String.fromCharCode(65 + i)}</span>
                  {opt}
                  {isAnswer && <CheckCircle2 size={15} className="ml-auto shrink-0" />}
                  {isWrong && <XCircle size={15} className="ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {checked && (
          <div className={`mt-5 flex items-start gap-2.5 rounded-xl border p-3.5 animate-fadeUp ${correctNow ? "border-emerald-300/35 bg-emerald-400/10" : "border-rose-400/35 bg-rose-400/10"}`}>
            {correctNow ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" /> : <XCircle size={17} className="mt-0.5 shrink-0 text-rose-300" />}
            <div>
              <div className={`font-mono text-[10px] font-bold tracking-[0.2em] uppercase ${correctNow ? "text-emerald-300" : "text-rose-300"}`}>
                {correctNow ? "Benar — begini alasannya" : "Belum tepat — pelajari konsepnya"}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-200">{q.explain}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <span className="font-mono text-xs text-slate-500">Skor {score}/{idx + (checked ? 1 : 0)}</span>
          {!checked ? (
            <Btn variant="primary" size="md" disabled={q.kind === "balance" ? false : picked === null} onClick={check}>Periksa Jawaban</Btn>
          ) : (
            <Btn variant="primary" size="md" onClick={next}>
              {idx + 1 >= questions.length ? "Lihat Hasil" : "Lanjut"} <ArrowRight size={14} />
            </Btn>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <button onClick={() => { setStarted(false); setFinished(false); setIdx(0); setScore(0); resetQuestion(); }} className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase transition hover:text-slate-200">
          <RotateCcw size={11} /> Keluar kuis
        </button>
      </div>
    </div>
  );
}
