// ------------------------------------------------------------------
// Shared UI primitives — glass panels, buttons, formula typography
// ------------------------------------------------------------------

import { X } from "lucide-react";
import type { ReactNode, MouseEventHandler } from "react";
import { formulaTokens } from "../services/chemistryEngine";
import { cn } from "../utils/cn";

// ---------- chemical formula with proper subscripts ----------
export function Formula({ text, className = "", subClassName = "" }: { text: string; className?: string; subClassName?: string }) {
  return (
    <span className={cn("font-mono", className)}>
      {formulaTokens(text).map((t, i) =>
        t.sub ? (
          <sub key={i} className={cn("text-[0.62em] text-cyan-300", subClassName)}>{t.text}</sub>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </span>
  );
}

// ---------- buttons ----------
interface BtnProps {
  children: ReactNode;
  onClick?: MouseEventHandler;
  variant?: "primary" | "ghost" | "danger" | "solid";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  title?: string;
}

export function Btn({ children, onClick, variant = "ghost", size = "md", className = "", disabled, title }: BtnProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition-all duration-200 select-none disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]";
  const sizes = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-4 py-2.5 text-xs",
    lg: "px-6 py-3.5 text-sm",
  };
  const variants = {
    primary: "bg-gradient-to-r from-cyan-400 to-sky-500 text-[#032430] shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:shadow-[0_0_36px_rgba(34,211,238,0.55)] hover:brightness-110",
    solid: "bg-cyan-400/15 text-cyan-300 border border-cyan-300/30 hover:bg-cyan-400/25",
    ghost: "border border-slate-500/25 text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200 bg-white/[0.02]",
    danger: "border border-rose-400/30 text-rose-300 hover:bg-rose-400/10 bg-white/[0.02]",
  };
  return (
    <button title={title} disabled={disabled} onClick={onClick} className={cn(base, sizes[size], variants[variant], className)}>
      {children}
    </button>
  );
}

// ---------- panel ----------
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("glass rounded-2xl", className)}>{children}</div>;
}

// ---------- section heading ----------
export function Heading({ kicker, title, desc, className = "" }: { kicker?: string; title: string; desc?: string; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {kicker && (
        <div className="flex items-center gap-2.5">
          <span className="h-px w-8 bg-cyan-400/60" />
          <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-cyan-400 uppercase">{kicker}</span>
        </div>
      )}
      <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
      {desc && <p className="max-w-xl text-sm leading-relaxed text-slate-400">{desc}</p>}
    </div>
  );
}

// ---------- small tag ----------
export function Tag({ children, color = "#38e1ff", className = "" }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider", className)}
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      {children}
    </span>
  );
}

// ---------- modal ----------
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#020610]/80 backdrop-blur-sm animate-fadeIn" />
      <div
        className={cn("glass relative w-full rounded-3xl p-6 animate-fadeUp max-h-[86vh] overflow-y-auto", wide ? "max-w-3xl" : "max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full border border-slate-500/30 p-1.5 text-slate-400 transition hover:text-white" title="Close">
          <X size={15} />
        </button>
        {title && <div className="mb-4 pr-8">{title}</div>}
        {children}
      </div>
    </div>
  );
}

// ---------- progress bar ----------
export function Bar({ value, max, color = "#38e1ff", className = "" }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-700/40", className)}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
    </div>
  );
}

// ---------- toggle switch ----------
export function Toggle({ on, onChange, labelOn, labelOff }: { on: boolean; onChange: (v: boolean) => void; labelOn: string; labelOff: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex cursor-pointer items-center gap-2.5 rounded-full border border-slate-500/25 bg-white/[0.03] py-1.5 pr-3 pl-1.5 transition hover:border-cyan-300/40"
      title="Toggle learning mode"
    >
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", on ? "bg-cyan-400/80" : "bg-slate-600/60")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </span>
      <span className={cn("text-[11px] font-semibold tracking-wide", on ? "text-cyan-300" : "text-slate-400")}>
        {on ? labelOn : labelOff}
      </span>
    </button>
  );
}
