// ------------------------------------------------------------------
// Audio feedback — WebAudio synth kecil, tanpa aset, bisa dimatikan
// ------------------------------------------------------------------

import { progress } from "./progress";

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  const a = ac();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = a.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export type SfxKind = "ok" | "err" | "step" | "complete" | "drop" | "tick";

export function sfx(kind: SfxKind) {
  try {
    if (!progress.get().soundOn) return;
    switch (kind) {
      case "ok": tone(660, 0, 0.16); tone(990, 0.09, 0.22); break;
      case "err": tone(196, 0, 0.24, "sawtooth", 0.05); tone(147, 0.1, 0.26, "sawtooth", 0.045); break;
      case "step": tone(520, 0, 0.09, "triangle", 0.06); break;
      case "drop": tone(880, 0, 0.07, "sine", 0.05); tone(1240, 0.05, 0.06, "sine", 0.035); break;
      case "tick": tone(1400, 0, 0.03, "square", 0.02); break;
      case "complete":
        tone(523, 0, 0.16); tone(659, 0.12, 0.16); tone(784, 0.24, 0.2); tone(1047, 0.36, 0.34); break;
    }
  } catch { /* audio tidak tersedia */ }
}
