export type Page =
  | "home" | "materi" | "molecules" | "vlab" | "quiz" | "progress"
  | "elements" | "missions" | "lab" | "ar" | "learn";

export interface Route {
  page: Page;
  element?: string;                 // fokus unsur
  molecule?: string;                // fokus molekul
  demo?: boolean;                   // demo otomatis reaction lab
  mission?: string;                 // konteks misi
  seed?: Record<string, number>;    // pre-load campuran ke reaction lab
  experiment?: string;              // id eksperimen untuk virtual lab
  vphase?: "prelab" | "safety" | "bench";  // fase awal virtual lab
  category?: string;                // filter kategori kuis
  ts?: number;                      // timestamp navigasi
}

export type Nav = (r: Route) => void;
