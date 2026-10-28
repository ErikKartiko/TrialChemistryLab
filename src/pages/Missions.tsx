import { useMemo, useState } from "react";
import { Target, Play, CheckCircle2, Scale, ChevronRight } from "lucide-react";
import { MISSIONS, type Mission } from "../data/missions";
import { reactionById } from "../data/reactions";
import { Heading, Btn, Formula, Tag } from "../components/ui";
import { useProgress, progress } from "../services/progress";
import type { Nav } from "../routes";

const toast = (title: string, desc?: string) =>
  window.dispatchEvent(new CustomEvent("arcl-toast", { detail: { title, desc } }));

export function Missions({ nav }: { nav: Nav }) {
  const p = useProgress();
  const done = new Set(p.missions);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-28 pb-16 sm:px-8">
      <Heading
        kicker="Module 04 — Challenge"
        title="Chemistry Missions"
        desc="Guided build objectives. Launch a mission to load its target into the Reaction Lab — complete the reaction to earn the clear."
      />

      <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
        {MISSIONS.map((m, i) => (
          <MissionCard key={m.id} mission={m} completed={done.has(m.id)} nav={nav} index={i} />
        ))}
      </div>
    </div>
  );
}

function MissionCard({ mission, completed, nav, index }: { mission: Mission; completed: boolean; nav: Nav; index: number }) {
  const reaction = mission.targetReactionId ? reactionById(mission.targetReactionId) : undefined;

  return (
    <div
      className={`glass group relative overflow-hidden rounded-2xl p-5 transition hover:border-cyan-300/30 animate-fadeUp ${completed ? "border-emerald-300/25" : ""}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className={`absolute -top-8 -right-8 h-28 w-28 rounded-full blur-2xl ${completed ? "bg-emerald-400/20" : "bg-cyan-400/12"}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`font-display text-3xl font-bold ${completed ? "text-emerald-300/70" : "text-cyan-300/60"}`}>{mission.index}</span>
          <div>
            <h3 className="font-display text-lg font-bold text-white">{mission.title}</h3>
            <div className="flex items-center gap-2">
              <Tag color="#94a3b8">{mission.kind === "build" ? "Build Mission" : "Balancing"}</Tag>
              {reaction && <Tag color="#c084fc">{reaction.reactionType.split(" ")[0]}</Tag>}
            </div>
          </div>
        </div>
        {completed ? <CheckCircle2 size={22} className="shrink-0 text-emerald-300" /> : <Target size={20} className="shrink-0 text-slate-600" />}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">{mission.briefing}</p>

      <div className="mt-3 rounded-xl border border-cyan-300/15 bg-[#04101e]/60 px-3.5 py-2.5 text-center">
        <div className="font-mono text-[8px] tracking-[0.25em] text-slate-500 uppercase">Target</div>
        <Formula text={mission.targetHint} className="text-base font-bold text-white" />
      </div>

      {mission.kind === "build" ? (
        <div className="mt-4">
          <Btn
            variant={completed ? "ghost" : "primary"} size="sm" className="w-full"
            onClick={() => nav({ page: "lab", mission: mission.id })}
          >
            <Play size={13} /> {completed ? "Replay Mission" : "Start Mission"} <ChevronRight size={13} />
          </Btn>
        </div>
      ) : (
        <BalanceGame mission={mission} completed={completed} />
      )}
    </div>
  );
}

// ------- Mission 05: interactive balancing -------
function BalanceGame({ mission, completed }: { mission: Mission; completed: boolean }) {
  const [coef, setCoef] = useState<[number, number, number]>([1, 1, 1]);
  const [state, setState] = useState<"idle" | "wrong" | "right">(completed ? "right" : "idle");

  const atoms = useMemo(() => {
    const leftH = coef[0] * 2, leftO = coef[1] * 2;
    const rightH = coef[2] * 2, rightO = coef[2];
    return { leftH, leftO, rightH, rightO };
  }, [coef]);

  const check = () => {
    const ok = coef[0] === 2 && coef[1] === 1 && coef[2] === 2;
    setState(ok ? "right" : "wrong");
    if (ok) {
      progress.completeMission(mission.id);
      toast("Mission 05 complete — Balance the Reaction", "2H₂ + O₂ → 2H₂O balances perfectly.");
    }
  };

  const atomRow = (label: string, h: number, o: number, align: string) => (
    <div className={`flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-1.5 ${align}`}>
      <span className="font-mono text-[9px] tracking-wider text-slate-500 uppercase">{label}</span>
      <span className="flex items-center gap-2 text-[10px]">
        <span className={`flex items-center gap-1 ${h === (align === "left" ? atoms.rightH : atoms.leftH) ? "text-emerald-300" : "text-slate-300"}`}>
          <span className="h-2 w-2 rounded-full bg-slate-100" /> H:{h}
        </span>
        <span className={`flex items-center gap-1 ${o === (align === "left" ? atoms.rightO : atoms.leftO) ? "text-emerald-300" : "text-slate-300"}`}>
          <span className="h-2 w-2 rounded-full bg-rose-400" /> O:{o}
        </span>
      </span>
    </div>
  );

  return (
    <div className="mt-4 space-y-2.5">
      <div className="flex items-center justify-center gap-2">
        {["H2", "O2", "H2O"].map((f, i) => (
          <span key={f} className="flex items-center gap-2">
            <input
              type="number" min={1} max={9} value={coef[i]}
              onChange={(e) => {
                const v = Math.max(1, Math.min(9, Number(e.target.value) || 1));
                setCoef((c) => { const n = [...c] as [number, number, number]; n[i] = v; return n; });
                setState("idle");
              }}
              className="coef-input w-11 rounded-lg border border-cyan-300/30 bg-[#04101e] py-1.5 text-center font-mono text-sm font-bold text-cyan-200 outline-none focus:border-cyan-300"
            />
            <Formula text={f} className="font-bold text-white" />
            {i === 0 && <span className="text-slate-500">+</span>}
            {i === 1 && <span className="text-slate-500">→</span>}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {atomRow("Left", atoms.leftH, atoms.leftO, "left")}
        {atomRow("Right", atoms.rightH, atoms.rightO, "right")}
      </div>

      {state === "wrong" && (
        <p className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-[10px] text-amber-200 animate-fadeIn">
          Not balanced yet — count the green markers. The same number of H and O atoms must exist on both sides.
        </p>
      )}
      {state === "right" && (
        <p className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-[10px] font-semibold text-emerald-200 animate-fadeIn">
          Perfectly balanced: 2H₂ + O₂ → 2H₂O. Atoms conserved — 4 H and 2 O on each side.
        </p>
      )}

      <Btn variant={state === "right" ? "ghost" : "solid"} size="sm" className="w-full" onClick={check}>
        <Scale size={13} /> {state === "right" ? "Solved — Check Again" : "Check Balance"}
      </Btn>
    </div>
  );
}
