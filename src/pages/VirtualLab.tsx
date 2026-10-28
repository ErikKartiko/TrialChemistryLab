import { useMemo, useState } from "react";
import {
  Shield, ShieldCheck, ClipboardList,
  ChevronRight, ChevronLeft, ArrowUp, ArrowDown, CheckCircle2, XCircle, Star, Clock,
  AlertTriangle, Play, GraduationCap, Beaker, Glasses, Hand, Shirt, Boxes,
  FlaskRound, ScanEye, ListOrdered, HelpCircle,
} from "lucide-react";
import { EXPERIMENTS, experimentById, type Experiment } from "../data/experiments";
import { Heading, Btn, Tag, Panel } from "../components/ui";
import { Stage3D } from "../components/three/core";
import { EquipmentModel } from "../components/lab/Equipment3D";
import { Bench, type RunStats } from "../components/lab/Bench";
import { PostLab } from "../components/lab/PostLab";
import { progress, useProgress } from "../services/progress";
import { sfx } from "../services/sound";
import { makeRng } from "../components/three/core";
import type { Nav } from "../routes";

type Phase = "hub" | "prelab" | "safety" | "bench" | "postlab";

export function VirtualLab({ nav, initialExperiment, initialPhase }: { nav: Nav; initialExperiment?: string; initialPhase?: string }) {
  const [phase, setPhase] = useState<Phase>((initialPhase as Phase) ?? "hub");
  const [expId, setExpId] = useState<string>(initialExperiment ?? EXPERIMENTS[0].id);
  const [run, setRun] = useState<RunStats | null>(null);
  const exp = experimentById(expId)!;

  const startPrelab = (id: string) => { setExpId(id); setPhase("prelab"); sfx("step"); };

  return (
    <div className="mx-auto max-w-[1300px] px-4 pt-24 pb-16 sm:px-6">
      {phase === "hub" && <Hub nav={nav} onStart={startPrelab} />}
      {phase === "prelab" && <PreLab exp={exp} onBack={() => setPhase("hub")} onNext={() => { progress.completePrelab(exp.id); setPhase("safety"); }} />}
      {phase === "safety" && <Safety exp={exp} onBack={() => setPhase("prelab")} onEnter={() => { progress.completeSafety(exp.id); setPhase("bench"); }} />}
      {phase === "bench" && (
        <>
          <BenchHeader exp={exp} />
          <Bench experiment={exp} onComplete={(r) => { setRun(r); setPhase("postlab"); }} onExit={() => setPhase("hub")} />
        </>
      )}
      {phase === "postlab" && run && <PostLab exp={exp} run={run} nav={nav} onAgain={() => { setRun(null); setPhase("prelab"); }} />}
    </div>
  );
}

function BenchHeader({ exp }: { exp: Experiment }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="h-px w-8 bg-cyan-400/60" />
          <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-cyan-400 uppercase">{exp.code} · Simulasi berbasis prosedur</span>
        </div>
        <h2 className="mt-1.5 font-display text-2xl font-bold text-white">{exp.title}</h2>
      </div>
      <div className="flex gap-2">
        <Tag color="#34d399"><ShieldCheck size={10} /> APD Terpasang</Tag>
        <Tag color="#c084fc">{exp.topic}</Tag>
      </div>
    </div>
  );
}

// ==================== HUB ====================

function Hub({ nav, onStart }: { nav: Nav; onStart: (id: string) => void }) {
  const p = useProgress();
  return (
    <div>
      <Heading
        kicker="Laboratorium Virtual"
        title="Pilih Eksperimen"
        desc="Setiap eksperimen mengikuti alur Pre-Lab → Keselamatan → Praktikum prosedural → Observasi tiga tingkat → Post-Lab. Prosedur divalidasi langkah demi langkah."
      />

      <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
        {EXPERIMENTS.map((e) => {
          const runData = p.labRuns.find((r) => r.id === e.id);
          return (
            <div key={e.id} className="glass group relative overflow-hidden rounded-3xl p-6 transition hover:border-cyan-300/30 animate-fadeUp">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/20" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase">{e.code}</div>
                  <h3 className="mt-1 font-display text-xl font-bold text-white">{e.title}</h3>
                </div>
                {runData && (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((s) => <Star key={s} size={15} className={s <= runData.stars ? "fill-amber-300 text-amber-300" : "text-slate-600"} />)}
                  </div>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Tag color="#c084fc">{e.topic}</Tag>
                <Tag color="#94a3b8">{e.difficulty}</Tag>
                <Tag color="#94a3b8"><Clock size={9} /> {e.duration}</Tag>
              </div>
              <div className="mt-4 space-y-1.5">
                {e.objectives.slice(0, 2).map((o, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400/70" /> {o}
                  </div>
                ))}
              </div>

              {/* alur lengkap eksperimen unggulan */}
              <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-400/5 p-3">
                <div className="font-mono text-[8px] font-bold tracking-[0.25em] text-cyan-300 uppercase">Alur lengkap</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {["Pre-Lab", "Keselamatan", "Alat", "Bahan", "Prosedur", "Observasi", "Molekul", "Persamaan", "Analisis", "Post-Lab", "HOTS"].map((s, i, arr) => (
                    <span key={s} className="flex items-center gap-1">
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[8px] text-slate-300">{s}</span>
                      {i < arr.length - 1 && <ChevronRight size={8} className="text-slate-600" />}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-pink-300/25 bg-pink-400/8 px-3 py-2">
                <Star size={12} className="shrink-0 fill-pink-300 text-pink-300" />
                <span className="text-[10px] leading-tight text-pink-100">
                  <b>Fitur signature:</b> LIHAT PADA TINGKAT MOLEKUL — makroskopis ↔ mikroskopis ↔ simbolik.
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4 font-mono text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5"><Beaker size={11} /> {e.equipment.length} alat</span>
                <span className="flex items-center gap-1.5"><Boxes size={11} /> {e.materials.length} bahan</span>
                <span className="flex items-center gap-1.5"><ClipboardList size={11} /> {e.steps.length} tahap</span>
                <span className="flex items-center gap-1.5"><GraduationCap size={11} /> {e.postlab.hots.length} HOTS</span>
              </div>
              <Btn variant="primary" size="md" className="mt-5 w-full" onClick={() => onStart(e.id)}>
                <Play size={14} /> {runData ? "ULANGI PRAKTIKUM" : "MULAI — PRE-LAB"} <ChevronRight size={14} />
              </Btn>
            </div>
          );
        })}

        {/* eksperimen bebas */}
        <button onClick={() => nav({ page: "lab" })} className="glass group relative overflow-hidden rounded-3xl border-dashed p-6 text-left transition hover:border-pink-300/40 animate-fadeUp d-1">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-pink-400/10 blur-2xl transition group-hover:bg-pink-400/20" />
          <div className="font-mono text-[10px] tracking-[0.3em] text-pink-300 uppercase">Eksperimen Bebas</div>
          <h3 className="mt-1 font-display text-xl font-bold text-white">Simulasi Reaksi Terbuka</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Di luar prosedur praktikum, kamu boleh bereksperimen bebas: gabungkan atom & molekul, validasikan reaksinya, dan saksikan animasi tumbukan partikel.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Tag color="#f472b6"><FlaskRound size={9} /> Reaction Lab</Tag>
            <Tag color="#94a3b8">7 reaksi</Tag>
          </div>
          <div className="mt-5 flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-pink-300 uppercase">
            Buka Simulasi <ChevronRight size={13} className="transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>

      <Panel className="mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <ScanEye size={20} className="text-cyan-300" />
          <div>
            <div className="font-display text-sm font-bold text-white">AR Molekul &amp; Alat</div>
            <p className="text-[11px] text-slate-400">Lihat molekul dan alat lab di lingkungan nyata dengan kontrol gerakan tangan.</p>
          </div>
        </div>
        <Btn variant="solid" size="sm" onClick={() => nav({ page: "ar" })}>Buka AR Preview <ChevronRight size={13} /></Btn>
      </Panel>
    </div>
  );
}

// ==================== PRE-LAB ====================

function PreLab({ exp, onBack, onNext }: { exp: Experiment; onBack: () => void; onNext: () => void }) {
  const [eqIdx, setEqIdx] = useState(0);
  const equipment = exp.equipment[eqIdx];

  // urutan prosedur
  const shuffled = useMemo(() => {
    const rng = makeRng(exp.id.length * 313);
    const arr = exp.procedure.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    // pastikan tidak kebetulan sudah benar
    if (arr.every((v, i) => v === i)) [arr[0], arr[1]] = [arr[1], arr[0]];
    return arr;
  }, [exp.id]);
  const [order, setOrder] = useState<number[]>(shuffled);
  const [orderState, setOrderState] = useState<"idle" | "ok" | "err">("idle");

  // diagnostik
  const [diag, setDiag] = useState<Record<string, number | null>>(() => Object.fromEntries(exp.prelabQuestions.map((q) => [q.id, null])));
  const diagSolved = exp.prelabQuestions.filter((q) => diag[q.id] === q.answerIndex).length;
  const allDone = orderState === "ok" && diagSolved === exp.prelabQuestions.length;

  const move = (i: number, dir: -1 | 1) => {
    setOrder((o) => { const n = [...o]; const j = i + dir; if (j < 0 || j >= n.length) return o; [n[i], n[j]] = [n[j], n[i]]; return n; });
    setOrderState("idle");
  };

  const checkOrder = () => {
    const ok = order.every((v, i) => v === i);
    setOrderState(ok ? "ok" : "err");
    sfx(ok ? "ok" : "err");
  };

  const answerDiag = (qid: string, i: number, answerIndex: number) => {
    const solved = diag[qid] === answerIndex;
    if (solved) return;
    setDiag((d) => ({ ...d, [qid]: i }));
    sfx(i === answerIndex ? "ok" : "err");
  };

  return (
    <div className="animate-fadeUp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-8 bg-amber-400/60" />
            <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-amber-300 uppercase">Pre-Lab · Wajib sebelum praktikum</span>
          </div>
          <h2 className="mt-1.5 font-display text-2xl font-bold text-white sm:text-3xl">{exp.title}</h2>
        </div>
        <Tag color="#facc15"><GraduationCap size={10} /> Persiapan</Tag>
      </div>

      {/* A. Tujuan */}
      <Panel className="mt-5 p-5">
        <SectionHead icon={ClipboardList} label="A · Tujuan Praktikum" />
        <div className="grid gap-2 sm:grid-cols-2">
          {exp.objectives.map((o, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-600/25 bg-white/[0.02] px-3.5 py-2.5 text-xs text-slate-200">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-300" /> {o}
            </div>
          ))}
        </div>
      </Panel>

      {/* B. Alat 3D */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={Beaker} label="B · Kenali Alat — putar & pelajari fungsinya" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#050c1a]">
            <Stage3D className="h-full min-h-[300px]" cameraPos={[0, 0.8, 3.4]} fov={40}>
              <EquipmentModel type={equipment.type} liquid={equipment.type === "bottle" ? { level: 0.8, color: "#7fd8a8" } : undefined} />
            </Stage3D>
            <div className="absolute top-3 left-3 rounded-xl border border-cyan-300/25 bg-[#04101e]/90 px-3 py-2 backdrop-blur-md">
              <div className="font-display text-sm font-bold text-white">{equipment.name}</div>
              <div className="mt-0.5 max-w-[240px] text-[10px] leading-relaxed text-slate-300">{equipment.func}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-1">
            {exp.equipment.map((eq, i) => (
              <button key={eq.id} onClick={() => { setEqIdx(i); sfx("tick"); }} className={`rounded-xl border px-3 py-2 text-left text-[11px] font-semibold transition ${i === eqIdx ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-200" : "border-slate-600/30 text-slate-400 hover:text-slate-200"}`}>
                {eq.name}
              </button>
            ))}
          </div>
        </div>
        {equipment.parts && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {equipment.parts.map((pt) => <Tag key={pt} color="#94a3b8">{pt}</Tag>)}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Btn variant="ghost" size="sm" onClick={() => setEqIdx((i) => (i - 1 + exp.equipment.length) % exp.equipment.length)}><ChevronLeft size={13} /> Alat sebelumnya</Btn>
          <Btn variant="ghost" size="sm" onClick={() => setEqIdx((i) => (i + 1) % exp.equipment.length)}>Alat berikutnya <ChevronRight size={13} /></Btn>
        </div>
      </Panel>

      {/* C. Bahan */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={Boxes} label="C · Kenali Bahan & Bahayanya" />
        <div className="grid gap-2.5 sm:grid-cols-3">
          {exp.materials.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-600/25 bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">{m.name}</span>
                <Tag color={m.hazard === "korosif" ? "#fb7185" : m.hazard === "iritasi" ? "#facc15" : "#34d399"}>
                  <AlertTriangle size={9} /> {m.hazard}
                </Tag>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{m.handling}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* D. Urutan prosedur */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={ListOrdered} label="D · Susun Urutan Prosedur yang Benar" />
        <div className="grid gap-2">
          {order.map((pi, i) => (
            <div key={pi} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-xs transition ${orderState === "ok" ? "border-emerald-300/40 bg-emerald-400/5" : orderState === "err" ? "border-rose-300/40" : "border-slate-600/25 bg-white/[0.02]"}`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/40 font-mono text-[10px] font-bold text-cyan-300">{i + 1}</span>
              <span className="flex-1 text-slate-200">{exp.procedure[pi]}</span>
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} className="rounded-md border border-slate-600/40 p-1 text-slate-400 hover:text-white" title="Naik"><ArrowUp size={12} /></button>
                <button onClick={() => move(i, 1)} className="rounded-md border border-slate-600/40 p-1 text-slate-400 hover:text-white" title="Turun"><ArrowDown size={12} /></button>
              </div>
            </div>
          ))}
        </div>
        {orderState === "err" && (
          <p className="mt-2 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200 animate-fadeIn">
            Urutan belum tepat. Pikirkan: kapan indikator ditambahkan? Apa yang harus disiapkan lebih dulu?
          </p>
        )}
        {orderState === "ok" && (
          <p className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-[11px] font-semibold text-emerald-200 animate-fadeIn">
            Prosedur benar! Kamu sudah paham alur kerja praktikum ini.
          </p>
        )}
        <Btn variant="solid" size="sm" className="mt-3" onClick={checkOrder} disabled={orderState === "ok"}>
          <ClipboardList size={13} /> Periksa Urutan
        </Btn>
      </Panel>

      {/* E. Diagnostik */}
      <Panel className="mt-4 p-5">
        <SectionHead icon={HelpCircle} label={`E · Pertanyaan Diagnostik — ${diagSolved}/${exp.prelabQuestions.length} terjawab benar`} />
        <div className="space-y-4">
          {exp.prelabQuestions.map((q) => {
            const picked = diag[q.id];
            const solved = picked === q.answerIndex;
            return (
              <div key={q.id} className="rounded-xl border border-slate-600/25 bg-white/[0.02] p-4">
                <p className="text-xs font-semibold text-slate-100">{q.question}</p>
                <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((o, i) => {
                    const isPick = picked === i;
                    const good = isPick && i === q.answerIndex;
                    const bad = isPick && i !== q.answerIndex;
                    return (
                      <button key={i} onClick={() => answerDiag(q.id, i, q.answerIndex)} className={`rounded-lg border px-3 py-2 text-left text-[11px] transition ${good ? "border-emerald-300/50 bg-emerald-400/10 text-emerald-200" : bad ? "border-rose-400/50 bg-rose-400/10 text-rose-200" : "border-slate-600/30 text-slate-300 hover:border-cyan-300/30"}`}>
                        {o} {good && <CheckCircle2 size={12} className="ml-1 inline" />} {bad && <XCircle size={12} className="ml-1 inline" />}
                      </button>
                    );
                  })}
                </div>
                {picked != null && (
                  <p className={`mt-2 rounded-lg px-3 py-2 text-[10px] leading-relaxed animate-fadeIn ${solved ? "border border-emerald-300/25 bg-emerald-400/5 text-emerald-100/90" : "border border-amber-300/25 bg-amber-400/5 text-amber-100/90"}`}>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Btn variant="ghost" size="md" onClick={onBack}><ChevronLeft size={14} /> Kembali</Btn>
        <div className="flex items-center gap-3">
          {!allDone && <span className="font-mono text-[10px] tracking-wider text-slate-500 uppercase">Selesaikan urutan prosedur & semua diagnostik</span>}
          <Btn variant="primary" size="lg" onClick={onNext} disabled={!allDone}>
            <Shield size={15} /> Lanjut — Keselamatan Kerja
          </Btn>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ icon: Icon, label }: { icon: typeof Beaker; label: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-2">
      <Icon size={15} className="text-cyan-300" />
      <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-cyan-200 uppercase">{label}</span>
    </div>
  );
}

// ==================== SAFETY ====================

function Safety({ exp, onBack, onEnter }: { exp: Experiment; onBack: () => void; onEnter: () => void }) {
  const [worn, setWorn] = useState<string[]>([]);
  const [ack, setAck] = useState(false);
  const APD = [
    { id: "Kacamata pelindung", icon: Glasses, type: "goggles" as const, note: "Melindungi mata dari percikan asam & basa." },
    { id: "Sarung tangan", icon: Hand, type: "gloves" as const, note: "Melindungi kulit dari bahan korosif." },
    { id: "Jas laboratorium", icon: Shirt, type: "labcoat" as const, note: "Melindungi pakaian dan tubuh dari tumpahan." },
  ];
  const ready = worn.length === APD.length && ack;

  return (
    <div className="animate-fadeUp mx-auto max-w-4xl">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/40 bg-rose-400/10 px-4 py-1.5">
          <ShieldAlertIcon />
          <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-rose-200 uppercase">Keselamatan Laboratorium — Wajib</span>
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">Kenakan APD Sebelum Masuk Lab</h2>
        <p className="mx-auto mt-1.5 max-w-lg text-xs leading-relaxed text-slate-400">
          Praktikum yang aman bukan hiasan — itu prosedur. Ketuk setiap APD untuk memakainya, pelajari aturannya, lalu tanda tangani komitmen keselamatan.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {APD.map((a) => {
          const on = worn.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => { setWorn((w) => (w.includes(a.id) ? w.filter((x) => x !== a.id) : [...w, a.id])); sfx(on ? "tick" : "ok"); }}
              className={`rounded-2xl border p-4 text-center transition ${on ? "border-emerald-300/50 bg-emerald-400/10" : "border-slate-600/30 bg-white/[0.02] hover:border-cyan-300/30"}`}
            >
              <div className="relative mx-auto h-24 w-24">
                <Stage3D className="h-full w-full" cameraPos={[0, 0.45, 0.95]} fov={50} controls={false} autoRotateInitial={!on}>
                  <EquipmentModel type={a.type} />
                </Stage3D>
              </div>
              <div className={`mt-1 flex items-center justify-center gap-1.5 text-xs font-bold ${on ? "text-emerald-300" : "text-slate-200"}`}>
                {on ? <ShieldCheck size={13} /> : <a.icon size={13} />} {a.id}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{a.note}</p>
              <div className={`mt-2 font-mono text-[9px] font-bold tracking-[0.2em] uppercase ${on ? "text-emerald-300" : "text-slate-600"}`}>{on ? "Terpasang" : "Ketuk untuk memakai"}</div>
            </button>
          );
        })}
      </div>

      <Panel className="mt-4 p-5">
        <SectionHead icon={Shield} label="Aturan Keselamatan Praktikum Ini" />
        <div className="grid gap-2 sm:grid-cols-2">
          {exp.safetyRules.map((r, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-amber-300/15 bg-amber-400/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-50/90">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-300/40 font-mono text-[9px] font-bold text-amber-300">{i + 1}</span>
              {r}
            </div>
          ))}
        </div>
      </Panel>

      <label className="glass mt-4 flex cursor-pointer items-center gap-3 rounded-2xl p-4">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
        <span className="text-xs text-slate-200">Saya memahami aturan keselamatan dan berjanji mengikuti prosedur dengan benar — dalam simulasi maupun praktikum nyata.</span>
      </label>

      <div className="mt-4 flex items-center justify-between">
        <Btn variant="ghost" size="md" onClick={onBack}><ChevronLeft size={14} /> Pre-Lab</Btn>
        <Btn variant="primary" size="lg" onClick={onEnter} disabled={!ready} className={ready ? "demo-glow" : ""}>
          <ShieldCheck size={16} /> Masuk Meja Praktikum
        </Btn>
      </div>
    </div>
  );
}

function ShieldAlertIcon() {
  return <Shield size={13} className="text-rose-300" />;
}

