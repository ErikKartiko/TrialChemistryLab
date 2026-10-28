import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Atom, FlaskConical, Hexagon, BrainCircuit, BarChart3, ScanEye, Menu, X,
  CheckCircle2, BookOpen, Home as HomeIcon, Settings, HelpCircle, Play,
  Pause, ChevronRight, Volume2, VolumeX, Trash2, Target, GraduationCap,
} from "lucide-react";
import type { Route, Page } from "./routes";
import { Home } from "./pages/Home";
import { Materi } from "./pages/Materi";
import { MoleculeExplorer } from "./pages/MoleculeExplorer";
import { VirtualLab } from "./pages/VirtualLab";
import { Quiz } from "./pages/Quiz";
import { Dashboard } from "./pages/Dashboard";
import { Explore } from "./pages/Explore";
import { Missions } from "./pages/Missions";
import { ReactionLab } from "./pages/ReactionLab";
import { ARLab } from "./pages/ARLab";
import { Modal, Btn } from "./components/ui";
import { progress, useProgress } from "./services/progress";
import { sfx } from "./services/sound";

const NAV_MAIN: { page: Page; label: string; icon: typeof Atom }[] = [
  { page: "materi", label: "Materi", icon: BookOpen },
  { page: "molecules", label: "Molekul 3D", icon: Hexagon },
  { page: "vlab", label: "Virtual Lab", icon: FlaskConical },
  { page: "quiz", label: "Kuis", icon: BrainCircuit },
  { page: "progress", label: "Progres", icon: BarChart3 },
];

const NAV_SECONDARY: { page: Page; label: string; icon: typeof Atom }[] = [
  { page: "elements", label: "Eksplorasi Unsur", icon: Atom },
  { page: "missions", label: "Misi & Lencana", icon: Target },
  { page: "lab", label: "Simulasi Reaksi", icon: FlaskConical },
  { page: "ar", label: "AR Molekul", icon: ScanEye },
];

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 677) % 100}%`,
  top: `${(i * 389) % 100}%`,
  size: 3 + (i % 4) * 2,
  delay: -(i * 1.3),
  duration: 7 + (i % 5),
}));

// ---------------- MODE DEMO LIDM ----------------
interface TourStop { route: Route; caption: string; seconds: number }
const TOUR: TourStop[] = [
  { route: { page: "home" }, caption: "Selamat datang di MOLECULAR VISION AR — ekosistem belajar kimia SMA/MA berbasis Augmented Reality.", seconds: 6 },
  { route: { page: "materi" }, caption: "MATERI — konsep Asam & Basa disampaikan dengan bahasa sederhana, visual, dan contoh nyata.", seconds: 7 },
  { route: { page: "molecules", molecule: "H2O" }, caption: "MOLEKUL 3D — siswa melihat apa yang tidak bisa dilihat mata: bentuk, ikatan, dan atom penyusun.", seconds: 6 },
  { route: { page: "vlab", experiment: "exp-neutralization", vphase: "prelab" }, caption: "PRE-LAB — tujuan, alat 3D, bahan, urutan prosedur, dan pertanyaan diagnostik wajib diselesaikan dulu.", seconds: 7 },
  { route: { page: "vlab", experiment: "exp-neutralization", vphase: "safety" }, caption: "KESELAMATAN — APD dipasang dan aturan dibaca sebelum boleh masuk meja praktikum.", seconds: 6 },
  { route: { page: "vlab", experiment: "exp-neutralization", vphase: "bench" }, caption: "PRAKTIKUM PROSEDURAL — 13 langkah tervalidasi: seret alat & bahan, teteskan indikator, gojog, lalu titrasi mengikuti kurva pH yang nyata.", seconds: 10 },
  { route: { page: "vlab", experiment: "exp-neutralization", vphase: "bench" }, caption: "FITUR SIGNATURE — di Langkah 10 tekan “LIHAT PADA TINGKAT MOLEKUL”: ion H⁺ dan OH⁻ benar-benar bergabung menjadi H₂O, terhubung dengan tab MAKROSKOPIS & SIMBOLIK.", seconds: 9 },
  { route: { page: "quiz", category: "hots" }, caption: "KUIS & HOTS — evaluasi penalaran dengan pembahasan di setiap jawaban, ditutup rapor 6 dimensi + rekomendasi belajar.", seconds: 7 },
  { route: { page: "progress" }, caption: "HASIL BELAJAR — materi, molekul, prosedur, keselamatan, kuis, dan HOTS terpantau dalam satu dasbor.", seconds: 6 },
];

export default function App() {
  const [route, setRoute] = useState<Route>({ page: "home" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; title: string; desc?: string }[]>([]);
  const [tourIdx, setTourIdx] = useState<number | null>(null);
  const [tourPaused, setTourPaused] = useState(false);
  const tourTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const p = useProgress();

  const nav = useCallback((r: Route) => {
    setRoute({ ...r, ts: Date.now() });
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  // toaster
  useEffect(() => {
    let id = 1;
    const handler = (e: Event) => {
      const { title, desc } = (e as CustomEvent).detail;
      const tid = id++;
      setToasts((t) => [...t, { id: tid, title, desc }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== tid)), 5200);
    };
    window.addEventListener("arcl-toast", handler);
    return () => window.removeEventListener("arcl-toast", handler);
  }, []);

  // demo tour
  useEffect(() => {
    const start = () => { setTourIdx(0); setTourPaused(false); sfx("ok"); };
    window.addEventListener("mvar-tour", start);
    return () => window.removeEventListener("mvar-tour", start);
  }, []);

  useEffect(() => {
    if (tourIdx === null) return;
    const stop = TOUR[tourIdx];
    nav(stop.route);
    if (!tourPaused) {
      tourTimer.current = setTimeout(() => {
        setTourIdx((i) => (i != null && i + 1 < TOUR.length ? i + 1 : null));
      }, stop.seconds * 1000);
    }
    return () => { if (tourTimer.current) clearTimeout(tourTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourIdx, tourPaused]);

  const page = useMemo(() => {
    switch (route.page) {
      case "home": return <Home nav={nav} />;
      case "materi": return <Materi nav={nav} />;
      case "molecules": return <MoleculeExplorer nav={nav} initialFormula={route.molecule} />;
      case "vlab": return <VirtualLab key={`${route.experiment ?? "hub"}-${route.vphase ?? ""}-${route.ts ?? 0}`} nav={nav} initialExperiment={route.experiment} initialPhase={route.vphase} />;
      case "quiz": return <Quiz nav={nav} initialCategory={route.category} />;
      case "progress": return <Dashboard nav={nav} />;
      case "elements": return <Explore nav={nav} initialSymbol={route.element} />;
      case "missions": return <Missions nav={nav} />;
      case "lab": return <ReactionLab nav={nav} demo={route.demo} missionId={route.mission} seed={route.seed} tick={route.ts} />;
      case "ar": return <ARLab nav={nav} initialElement={route.element} />;
      case "learn": return <Materi nav={nav} />;
    }
  }, [route, nav]);

  return (
    <div className="bg-lab relative min-h-screen">
      <div className="bg-grid pointer-events-none fixed inset-0 z-0" />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {PARTICLES.map((pt, i) => (
          <span key={i} className="particle" style={{ left: pt.left, top: pt.top, width: pt.size, height: pt.size, animationDelay: `${pt.delay}s`, animationDuration: `${pt.duration}s` }} />
        ))}
      </div>

      {/* ================= NAV ================= */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-cyan-300/10 bg-[#030712]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
          <button onClick={() => nav({ page: "home" })} className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-400/10 text-cyan-300 transition group-hover:shadow-[0_0_18px_rgba(34,211,238,0.4)]">
              <Atom size={18} className="animate-spin" style={{ animationDuration: "9s" }} />
            </span>
            <span className="text-left leading-tight">
              <span className="block font-display text-[13px] font-bold tracking-[0.14em] text-white">MOLECULAR VISION AR</span>
              <span className="block font-mono text-[8px] tracking-[0.28em] text-cyan-400/80 uppercase">Visualisasikan · Simulasikan · Pahami</span>
            </span>
          </button>

          <nav className="hidden items-center gap-0.5 xl:flex">
            <NavBtn page="home" label="Beranda" icon={HomeIcon} active={route.page} onNav={nav} />
            {NAV_MAIN.map((item) => <NavBtn key={item.page} {...item} active={route.page} onNav={nav} />)}
          </nav>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setTutorialOpen(true)} title="Tutorial" className="rounded-lg border border-slate-600/40 p-2 text-slate-400 transition hover:border-cyan-300/40 hover:text-cyan-200">
              <HelpCircle size={15} />
            </button>
            <button onClick={() => setSettingsOpen(true)} title="Pengaturan" className="rounded-lg border border-slate-600/40 p-2 text-slate-400 transition hover:border-cyan-300/40 hover:text-cyan-200">
              <Settings size={15} />
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("mvar-tour"))}
              className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2 text-[11px] font-bold tracking-wide text-[#032430] shadow-[0_0_20px_rgba(34,211,238,0.3)] transition hover:brightness-110 sm:flex"
            >
              <Play size={13} /> DEMO MVAR
            </button>
            <button onClick={() => setMenuOpen((o) => !o)} className="rounded-lg border border-slate-600/40 p-2 text-slate-300 xl:hidden" title="Menu">
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-cyan-300/10 bg-[#030712]/95 px-4 py-3 backdrop-blur-xl xl:hidden animate-fadeIn">
            <div className="grid grid-cols-2 gap-1.5">
              {[{ page: "home" as Page, label: "Beranda", icon: HomeIcon }, ...NAV_MAIN, ...NAV_SECONDARY].map((item) => (
                <button
                  key={item.page}
                  onClick={() => nav({ page: item.page })}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${route.page === item.page ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:bg-white/5"}`}
                >
                  <item.icon size={14} /> {item.label}
                </button>
              ))}
            </div>
            <button onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent("mvar-tour")); }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-500 px-3 py-2.5 text-xs font-bold text-[#032430]">
              <Play size={13} /> MULAI DEMO MVAR
            </button>
          </nav>
        )}
      </header>

      {/* ================= PAGE ================= */}
      <main className="relative z-10">{page}</main>

      {route.page !== "ar" && (
        <footer className="relative z-10 border-t border-cyan-300/10 py-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 sm:px-8">
            <span className="font-mono text-[10px] tracking-[0.25em] text-slate-600 uppercase">Molecular Vision AR — Media Pendukung Pembelajaran &amp; Praktikum</span>
            <span className="font-mono text-[10px] tracking-wider text-slate-600">Pre-Lab · Praktikum · Post-Lab — SMA/MA</span>
          </div>
        </footer>
      )}

      {/* ================= DEMO TOUR OVERLAY ================= */}
      {tourIdx !== null && (
        <div className="fixed inset-x-4 bottom-5 z-[75] mx-auto max-w-2xl animate-fadeUp">
          <div className="glass-bright rounded-2xl px-5 py-4 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
                </span>
                <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-cyan-300 uppercase">Demo MVAR · {tourIdx + 1}/{TOUR.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setTourPaused((x) => !x)} className="rounded-lg border border-slate-600/40 p-1.5 text-slate-300 hover:text-white" title={tourPaused ? "Lanjutkan" : "Jeda"}>
                  {tourPaused ? <Play size={12} /> : <Pause size={12} />}
                </button>
                <button onClick={() => setTourIdx((i) => (i != null && i + 1 < TOUR.length ? i + 1 : null))} className="rounded-lg border border-slate-600/40 p-1.5 text-slate-300 hover:text-white" title="Berikutnya">
                  <ChevronRight size={13} />
                </button>
                <button onClick={() => setTourIdx(null)} className="rounded-lg border border-slate-600/40 p-1.5 text-slate-300 hover:text-rose-300" title="Akhiri demo">
                  <X size={13} />
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-200">{TOUR[tourIdx].caption}</p>
            <div className="mt-2.5 flex gap-1">
              {TOUR.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i < tourIdx ? "bg-emerald-400" : i === tourIdx ? "bg-cyan-400" : "bg-slate-700/60"}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TOASTS ================= */}
      <div className="fixed right-4 bottom-4 z-[80] flex w-[min(360px,90vw)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="glass-bright flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-[0_0_30px_rgba(34,211,238,0.25)] animate-fadeUp">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />
            <div>
              <div className="text-xs font-bold text-white">{t.title}</div>
              {t.desc && <div className="mt-0.5 font-mono text-[10px] text-slate-300">{t.desc}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ================= PENGATURAN ================= */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title={
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase">Pengaturan</div>
          <h3 className="mt-1 font-display text-xl font-bold text-white">Preferensi Belajar</h3>
        </div>
      }>
        <div className="space-y-3">
          <button
            onClick={() => progress.setSound(!p.soundOn)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-600/30 bg-white/[0.02] px-4 py-3.5 text-left transition hover:border-cyan-300/30"
          >
            <span className="flex items-center gap-3">
              {p.soundOn ? <Volume2 size={17} className="text-cyan-300" /> : <VolumeX size={17} className="text-slate-500" />}
              <span>
                <span className="block text-sm font-semibold text-white">Umpan balik suara</span>
                <span className="block text-[10px] text-slate-500">Nada sukses, koreksi, dan penyelesaian praktikum</span>
              </span>
            </span>
            <span className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold ${p.soundOn ? "bg-emerald-400/15 text-emerald-300" : "bg-slate-700/40 text-slate-400"}`}>{p.soundOn ? "AKTIF" : "MATI"}</span>
          </button>

          <button
            onClick={() => { if (confirm("Hapus seluruh progres belajar?")) { progress.reset(); setSettingsOpen(false); } }}
            className="flex w-full items-center justify-between rounded-xl border border-rose-400/25 bg-rose-400/5 px-4 py-3.5 text-left transition hover:border-rose-400/50"
          >
            <span className="flex items-center gap-3">
              <Trash2 size={17} className="text-rose-300" />
              <span>
                <span className="block text-sm font-semibold text-white">Reset progres belajar</span>
                <span className="block text-[10px] text-slate-500">Materi, praktikum, kuis, dan lencana kembali ke awal</span>
              </span>
            </span>
          </button>

          <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/5 px-4 py-3.5">
            <div className="font-mono text-[9px] tracking-[0.25em] text-cyan-300 uppercase">Tentang</div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
              Molecular Vision AR (MVAR) adalah media pendukung pembelajaran kimia untuk siswa SMA/MA —
              digunakan sebelum praktikum nyata (pre-lab), ketika praktikum belum bisa dilakukan, dan sesudahnya (post-lab).
              MVAR tidak menggantikan laboratorium nyata.
            </p>
          </div>
        </div>
      </Modal>

      {/* ================= TUTORIAL ================= */}
      <Modal open={tutorialOpen} onClose={() => setTutorialOpen(false)} wide title={
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase">Tutorial</div>
          <h3 className="mt-1 font-display text-xl font-bold text-white">Cara Menggunakan MVAR</h3>
        </div>
      }>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: BookOpen, t: "1 · Pelajari MATERI", d: "Buka menu Materi. Baca tiap bagian berurutan — kemajuan bacaanmu tercatat otomatis. Akhiri dengan tombol Lanjut ke Pre-Lab." },
            { icon: Hexagon, t: "2 · Visualisasikan MOLEKUL 3D", d: "Putar, zoom, dan bedah molekul dengan tombol DECOMPOSE. Pahami atom penyusun, ikatan, dan geometrinya." },
            { icon: GraduationCap, t: "3 · Selesaikan PRE-LAB & KESELAMATAN", d: "Kenali alat dalam 3D, susun urutan prosedur, jawab diagnostik, lalu kenakan APD sebelum masuk lab." },
            { icon: FlaskConical, t: "4 · Praktikkan di VIRTUAL LAB", d: "Ikuti 10 tahap berurutan: seret alat/bahan ke target benar, tuang, teteskan indikator, gojog, dan titrasi sampai pH 7. Sistem memvalidasi tiap langkah." },
            { icon: ScanEye, t: "5 · Coba AR MOLEKUL", d: "Di perangkat berkamera, tempatkan molekul di ruang nyata dan gerakkan dengan cubitan tangan (hand tracking)." },
            { icon: BrainCircuit, t: "6 · Evaluasi dengan KUIS & HOTS", d: "Kerjakan kuis per kategori. Setiap jawaban dibahas — benar maupun salah. Lihat hasilmu di menu Progres." },
          ].map((s) => (
            <div key={s.t} className="rounded-xl border border-slate-600/25 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-white"><s.icon size={15} className="text-cyan-300" /> {s.t}</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
        <Btn variant="primary" size="lg" className="mt-4 w-full" onClick={() => { setTutorialOpen(false); window.dispatchEvent(new CustomEvent("mvar-tour")); }}>
          <Play size={15} /> Atau Tonton Demo MVAR (±1 menit)
        </Btn>
      </Modal>
    </div>
  );
}

function NavBtn({ page, label, icon: Icon, active, onNav }: { page: Page; label: string; icon: typeof Atom; active: Page; onNav: (r: Route) => void }) {
  return (
    <button
      onClick={() => onNav({ page })}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold tracking-wide transition ${active === page ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
    >
      <Icon size={13} /> {label}
    </button>
  );
}
