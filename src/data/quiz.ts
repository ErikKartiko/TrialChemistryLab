// ------------------------------------------------------------------
// Quiz bank — berkategori (§16): konsep, molekul, prosedur,
// keselamatan, persamaan, analisis, HOTS
// ------------------------------------------------------------------

export type QuizKind = "mc" | "identify" | "balance" | "visual";
export type QuizCategory = "konsep" | "molekul" | "prosedur" | "keselamatan" | "persamaan" | "analisis" | "hots";

export const CATEGORY_META: Record<QuizCategory, { label: string; color: string }> = {
  konsep: { label: "Konsep", color: "#38e1ff" },
  molekul: { label: "Molekul", color: "#34d399" },
  prosedur: { label: "Prosedur", color: "#facc15" },
  keselamatan: { label: "Keselamatan", color: "#fb7185" },
  persamaan: { label: "Persamaan", color: "#c084fc" },
  analisis: { label: "Analisis Data", color: "#fb923c" },
  hots: { label: "HOTS", color: "#f472b6" },
};

export interface QuizQuestion {
  id: string;
  kind: QuizKind;
  category: QuizCategory;
  prompt: string;
  equation?: string;
  visualMolecule?: string;
  options?: string[];
  answerIndex?: number;
  balanceAnswer?: number[];
  balanceSlots?: string[];
  explain: string;            // selalu ditampilkan — benar ataupun salah
}

export const QUIZ: QuizQuestion[] = [
  // ---------- KONSEP ----------
  {
    id: "q1", kind: "mc", category: "konsep",
    prompt: "Zat manakah yang membentuk H₂O?",
    options: [ "Hidrogen + Karbon", "Hidrogen + Oksigen", "Oksigen + Karbon", "Nitrogen + Hidrogen" ],
    answerIndex: 1,
    explain: "Air adalah senyawa dari 2 atom hidrogen dan 1 atom oksigen — unsur C dan N tidak terlibat.",
  },
  {
    id: "q2", kind: "mc", category: "konsep",
    prompt: "Larutan dengan pH 3 bersifat…",
    options: [ "Basa lemah", "Netral", "Asam", "Garam" ],
    answerIndex: 2,
    explain: "pH di bawah 7 berarti asam. Semakin kecil angkanya, semakin kuat asamnya.",
  },
  {
    id: "q3", kind: "mc", category: "konsep",
    prompt: "Dalam 2H₂O, angka besar 2 di depan disebut koefisien dan berarti…",
    equation: "2H2O",
    options: [ "Dua atom oksigen", "Dua molekul air", "Dua ikatan", "Massa dua kali atom" ],
    answerIndex: 1,
    explain: "Koefisien menghitung molekul utuh; subskrip ₂ menghitung atom di dalam satu molekul.",
  },
  {
    id: "q4", kind: "mc", category: "konsep",
    prompt: "Nomor atom Oksigen adalah…",
    options: [ "6", "7", "8", "16" ],
    answerIndex: 2,
    explain: "Oksigen memiliki 8 proton sehingga nomor atomnya 8 (16 adalah nomor massanya).",
  },
  // ---------- MOLEKUL ----------
  {
    id: "q5", kind: "visual", category: "molekul",
    prompt: "Amati model 3D. Berapa atom oksigen pada molekul ini?",
    visualMolecule: "CO2",
    options: [ "1", "2", "3", "4" ],
    answerIndex: 1,
    explain: "CO₂ berbentuk linear: satu karbon di tengah, satu oksigen di setiap sisi.",
  },
  {
    id: "q6", kind: "visual", category: "molekul",
    prompt: "Putar model 3D. Berapa atom hidrogen yang terikat pada nitrogen?",
    visualMolecule: "NH3",
    options: [ "1", "2", "3", "4" ],
    answerIndex: 2,
    explain: "Amonia berbentuk piramida trigonal: 1 nitrogen + 3 hidrogen.",
  },
  // ---------- PROSEDUR ----------
  {
    id: "q7", kind: "mc", category: "prosedur",
    prompt: "Alat yang TEPAT untuk meneteskan titran setetes demi setetes adalah…",
    options: [ "Erlenmeyer", "Gelas kimia", "Pipet tetes", "Botol reagen" ],
    answerIndex: 2,
    explain: "Pipet memberi kendali volume per tetes — alat lain menuang terlalu banyak sekaligus dan melewati titik akhir.",
  },
  {
    id: "q8", kind: "mc", category: "prosedur",
    prompt: "Urutan titrasi netralisasi yang benar adalah…",
    options: [
      "NaOH → indikator → titran ditetes perlahan sambil digojog",
      "Titran → NaOH → indikator di akhir",
      "Indikator → titran semua sekaligus → NaOH",
      "Gojog dulu semua bahan → lihat hasil",
    ],
    answerIndex: 0,
    explain: "Larutan basa + indikator dulu di Erlenmeyer, BARU titran diteteskan perlahan sambil digojog agar titik akhir teramati.",
  },
  {
    id: "q9", kind: "mc", category: "prosedur",
    prompt: "Mengapa Erlenmeyer digojog SELAMA titrasi, bukan hanya di akhir?",
    options: [ "Supaya terlihat keren", "Agar pencampuran merata dan perubahan warna tidak menipu secara lokal", "Agar larutan lebih cepat habis", "Tidak ada alasannya" ],
    answerIndex: 1,
    explain: "Tanpa gojog, HCl menumpuk lokal dan warna memudar sesaat — kamu bisa salah membaca titik akhir.",
  },
  // ---------- KESELAMATAN ----------
  {
    id: "q10", kind: "mc", category: "keselamatan",
    prompt: "STUDI KASUS: Larutan HCl sedikit mengenai kulit tanganmu. Tindakan PERTAMA yang benar…",
    options: [ "Dilap dengan kain kering", "Dinetralkan dengan NaOH di tangan", "Bilas dengan air mengalir segera dan laporkan", "Dibiarkan karena encer" ],
    answerIndex: 2,
    explain: "Air mengalir mengencerkan dan mengangkat bahan. Jangan menetralkan bahan kimia DI KULIT — reaksi netralisasi menghasilkan panas.",
  },
  {
    id: "q11", kind: "mc", category: "keselamatan",
    prompt: "Sebelum menyentuh HCl dan NaOH, APD minimum yang wajib adalah…",
    options: [ "Kacamata pelindung + sarung tangan", "Topi + sandal", "Masker saja", "Tidak perlu APD" ],
    answerIndex: 0,
    explain: "Mata dan kulit adalah titik paling rentan terhadap bahan korosif — keduanya wajib terlindungi.",
  },
  // ---------- PERSAMAAN ----------
  {
    id: "q12", kind: "balance", category: "persamaan",
    prompt: "Setarakan persamaan agar tidak ada atom yang hilang:",
    balanceSlots: [ "H2", "O2", "H2O" ],
    balanceAnswer: [ 2, 1, 2 ],
    explain: "2H₂ + O₂ → 2H₂O menjaga 4 H dan 2 O di kedua ruas.",
  },
  {
    id: "q13", kind: "identify", category: "persamaan",
    prompt: "Apa produk dari reaksi berikut?",
    equation: "2Na + Cl2 → 2NaCl",
    options: [ "Gas klorin", "Natrium hidroksida", "Natrium klorida", "Natrium oksida" ],
    answerIndex: 2,
    explain: "Natrium + klorin menghasilkan natrium klorida — garam dapur.",
  },
  // ---------- ANALISIS ----------
  {
    id: "q14", kind: "mc", category: "analisis",
    prompt: "DATA: Fenolftalein merah muda → hilang tepat setelah 20 tetes HCl 0,1 M. Artinya…",
    options: [ "NaOH masih berlebih", "Jumlah H⁺ yang ditambahkan setara OH⁻ awal — titik ekuivalen tercapai", "Indikatornya rusak", "Reaksi gagal" ],
    answerIndex: 1,
    explain: "Hilangnya merah muda menandakan OH⁻ habis dinetralkan — titik ekuivalen; inilah dasar perhitungan titrasi.",
  },
  // ---------- HOTS ----------
  {
    id: "q15", kind: "mc", category: "hots",
    prompt: "HOTS: Jika HCl terus diteteskan SETELAH titik netral, apa yang terjadi pada tingkat partikel?",
    options: [ "Na⁺ mulai bereaksi", "Ion H⁺ kelebihan menumpuk — larutan menjadi asam", "Air terurai kembali menjadi H⁺ dan OH⁻", "Cl⁻ menghilang dari larutan" ],
    answerIndex: 1,
    explain: "OH⁻ sudah habis membentuk air, sehingga H⁺ tambahan tidak punya pasangan dan menumpuk — pH turun di bawah 7.",
  },
  {
    id: "q16", kind: "mc", category: "hots",
    prompt: "HOTS: Pada netralisasi HCl + NaOH, ion yang disebut SPEKTATOR adalah…",
    equation: "HCl + NaOH → NaCl + H2O",
    options: [ "H⁺ dan OH⁻", "Na⁺ dan Cl⁻", "H⁺ dan Na⁺", "OH⁻ dan Cl⁻" ],
    answerIndex: 1,
    explain: "Na⁺ dan Cl⁻ tidak berubah sebelum/sesudah reaksi. Hanya H⁺ + OH⁻ yang bergabung menjadi air.",
  },
];
