// ------------------------------------------------------------------
// Experiment model — data-driven procedural practikum (§21)
// Tambah eksperimen baru = tambah 1 objek EXPERIMENTS.
// ------------------------------------------------------------------

export interface EquipmentSpec {
  id: string;
  name: string;
  type: "erlenmeyer" | "beaker" | "pipette" | "dropper" | "testtube" | "bottle" | "goggles" | "gloves" | "labcoat";
  func: string;            // fungsi alat (untuk Pre-Lab)
  parts?: string[];        // bagian-bagian alat
}

export interface MaterialSpec {
  id: string;
  name: string;
  formula?: string;
  hazard: "aman" | "iritasi" | "korosif";
  handling: string;
  role: string;            // peran dalam eksperimen (analit / titran / indikator)
}

export interface PrelabQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export type StepAction =
  | { kind: "drag"; tool: string; target: string }
  | { kind: "swirl" }
  | { kind: "titrate" }
  | { kind: "observe" }
  | { kind: "molecular" }
  | { kind: "record"; options: string[]; answerIndex: number }
  | { kind: "analyze"; options: string[]; answerIndex: number };

export interface ExperimentStep {
  id: string;
  no: string;              // "LANGKAH 01"
  title: string;
  instruction: string;
  hint: string;
  action: StepAction;
  wrongTool: string;
  wrongTarget: string;
  safety?: string;
  concept?: string;        // konsep kimia yang muncul pada tahap ini
}

export type HotsType = "sebab-akibat" | "prediksi" | "analisis-kesalahan" | "perubahan-kondisi" | "penalaran-partikel";

export interface HotsQuestion {
  id: string;
  type: HotsType;
  question: string;
  modelAnswer: string;
  keywords: string[];
  rubric: string;
}

export interface Experiment {
  id: string;
  code: string;
  title: string;
  topic: string;
  difficulty: "Dasar" | "Menengah" | "Lanjut";
  duration: string;
  objectives: string[];
  equipment: EquipmentSpec[];
  materials: MaterialSpec[];
  safetyRules: string[];
  safetyChecklist: string[];
  procedure: string[];
  prelabQuestions: PrelabQuestion[];
  steps: ExperimentStep[];
  observation: {
    macro: { title: string; points: string[] };
    micro: { title: string; points: string[] };
    symbolic: { title: string; equation: string; ionic: string; points: string[] };
  };
  analysisQuestion: {
    prompt: string;
    keywords: { word: string; concept: string }[];
    modelAnswer: string;
  };
  postlab: {
    summary: string;
    equation: string;
    molecular: string;
    analysis: string;
    hots: HotsQuestion[];
    reflectionPrompts: string[];
  };
  recommendations: { dim: string; low: string; mid: string; high: string }[];
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: "exp-neutralization",
    code: "PRAKTIKUM 01",
    title: "Netralisasi Asam dan Basa",
    topic: "Asam dan Basa",
    difficulty: "Dasar",
    duration: "± 25 menit",
    objectives: [
      "Melakukan prosedur netralisasi (titrasi sederhana) secara sistematis dan aman",
      "Mengamati perubahan warna indikator fenolftalein pada titik akhir titrasi",
      "Menghubungkan pengamatan makroskopis dengan perubahan pada tingkat partikel",
      "Menuliskan persamaan reaksi molekuler dan persamaan ion bersih netralisasi",
      "Menganalisis pengaruh perubahan jumlah pereaksi terhadap sifat larutan hasil",
    ],
    equipment: [
      { id: "eq-erlenmeyer", name: "Erlenmeyer 250 mL", type: "erlenmeyer", func: "Wadah reaksi tempat larutan dicampur. Leher sempitnya membuat larutan aman saat digojog.", parts: ["Leher sempit", "Badan kerucut", "Dasar lebar", "Skala volum"] },
      { id: "eq-pipette", name: "Pipet Tetes / Pipet Ukur", type: "pipette", func: "Memindahkan larutan dalam jumlah kecil dan terukur — alat utama untuk menambahkan larutan setetes demi setetes.", parts: ["Tabung kaca", "Ujung tetes", "Karet penghisap", "Tanda ukur"] },
      { id: "eq-beaker", name: "Gelas Kimia (Beaker)", type: "beaker", func: "Wadah sementara larutan dan tempat pembilasan alat sebelum digunakan.", parts: ["Badan silinder", "Corong tuang (spout)", "Skala kasar"] },
      { id: "mat-hcl-eq", name: "Botol Larutan HCl", type: "bottle", func: "Berisi larutan asam klorida 0,1 M — larutan asam yang akan dinetralkan pada praktikum ini.", parts: ["Tutup kedap", "Etiket bahan", "Simbol bahaya"] },
      { id: "mat-naoh-eq", name: "Botol Larutan NaOH", type: "bottle", func: "Berisi larutan natrium hidroksida 0,1 M — larutan basa yang diteteskan untuk menetralkan asam.", parts: ["Tutup kedap", "Etiket bahan", "Simbol bahaya"] },
      { id: "mat-indicator-eq", name: "Indikator Fenolftalein", type: "dropper", func: "Penanda pH: tak berwarna dalam suasana asam & netral, merah muda dalam suasana basa.", parts: ["Botol tetes", "Pipet karet", "Larutan indikator"] },
    ],
    materials: [
      { id: "mat-hcl", name: "Larutan HCl 0,1 M", formula: "HCl", hazard: "korosif", role: "Analit — larutan asam yang dinetralkan", handling: "Asam kuat. Jangan dicium langsung, jangan sampai terpercik. Wajib kacamata pelindung & sarung tangan." },
      { id: "mat-naoh", name: "Larutan NaOH 0,1 M", formula: "NaOH", hazard: "korosif", role: "Titran — larutan basa yang diteteskan", handling: "Basa kuat, terasa licin dan merusak jaringan kulit. Bilas segera dengan air mengalir bila terkena." },
      { id: "mat-indicator", name: "Indikator Fenolftalein", formula: "pp", hazard: "iritasi", role: "Indikator — penanda titik akhir titrasi", handling: "Cukup 2–3 tetes. Jangan tertelan, tutup kembali botol setelah dipakai." },
    ],
    safetyRules: [
      "Selalu kenakan kacamata pelindung sebelum menyentuh bahan kimia apa pun.",
      "Kenakan sarung tangan saat memindahkan larutan asam dan basa.",
      "Pipet digunakan untuk memindahkan larutan — dilarang menghisap dengan mulut, gunakan bola hisap.",
      "Tambahkan titran perlahan setetes demi setetes sambil digojog, jangan menuang sekaligus.",
      "Jika larutan mengenai kulit atau mata, segera bilas dengan air mengalir dan laporkan kepada guru.",
      "Buang sisa larutan hasil netralisasi ke wadah limbah yang disediakan, bukan ke wastafel sembarangan.",
    ],
    safetyChecklist: ["Kacamata pelindung", "Sarung tangan", "Jas laboratorium"],
    procedure: [
      "Siapkan Erlenmeyer bersih di atas meja kerja.",
      "Ambil larutan HCl menggunakan pipet.",
      "Masukkan larutan HCl ke dalam Erlenmeyer.",
      "Tambahkan 2 tetes indikator fenolftalein.",
      "Ambil larutan NaOH menggunakan pipet bersih.",
      "Teteskan NaOH sedikit demi sedikit sambil digojog hingga muncul warna merah muda yang tetap.",
    ],
    prelabQuestions: [
      { id: "pq1", question: "Alat apa yang digunakan untuk memindahkan larutan setetes demi setetes?", options: ["Gelas kimia", "Pipet tetes", "Erlenmeyer", "Botol reagen"], answerIndex: 1, explanation: "Penambahan terkontrol per tetes hanya bisa dilakukan dengan pipet. Gelas kimia dan botol menuang terlalu banyak sekaligus sehingga titik akhir terlewati." },
      { id: "pq2", question: "Pada praktikum ini fenolftalein ditambahkan ke larutan HCl. Warna apa yang terlihat sebelum NaOH diteteskan?", options: ["Merah muda pekat", "Biru", "Tak berwarna", "Kuning"], answerIndex: 2, explanation: "Fenolftalein TAK BERWARNA dalam suasana asam. Warna merah muda baru muncul ketika larutan berubah menjadi basa — itulah penanda titik akhir." },
      { id: "pq3", question: "APD apa yang WAJIB dipakai sebelum menangani HCl dan NaOH?", options: ["Kacamata pelindung dan sarung tangan", "Topi dan masker kain", "Sepatu olahraga", "Tidak perlu karena larutan encer"], answerIndex: 0, explanation: "Meskipun encer, HCl dan NaOH tetap korosif. Mata dan kulit adalah bagian paling rentan sehingga wajib terlindungi." },
      { id: "pq4", question: "Mengapa Erlenmeyer digojog selama penambahan titran?", options: ["Agar larutan cepat dingin", "Agar pencampuran merata sehingga perubahan warna tidak menipu", "Agar reaksi berhenti", "Agar indikator tidak rusak"], answerIndex: 1, explanation: "Tanpa digojog, titran menumpuk secara lokal. Warna dapat muncul sesaat di satu titik lalu hilang — pengamatan titik akhir menjadi salah." },
    ],
    steps: [
      {
        id: "s1", no: "LANGKAH 01", title: "Siapkan Erlenmeyer",
        instruction: "Seret ERLENMEYER dari rak alat ke lingkaran area kerja di atas meja.",
        hint: "Semua pencampuran pada praktikum ini terjadi di dalam Erlenmeyer.",
        action: { kind: "drag", tool: "eq-erlenmeyer", target: "zone-bench" },
        wrongTool: "Tahap ini menyiapkan WADAH REAKSI — pilih Erlenmeyer dari rak alat.",
        wrongTarget: "Letakkan Erlenmeyer tepat pada LINGKARAN area kerja.",
        concept: "Wadah reaksi dipilih berdasarkan keamanan saat digojog.",
      },
      {
        id: "s2", no: "LANGKAH 02", title: "Ambil Larutan HCl",
        instruction: "Seret PIPET ke BOTOL HCl untuk mengambil larutan asam.",
        hint: "Larutan dipindahkan dengan pipet, bukan dituang langsung dari botol.",
        action: { kind: "drag", tool: "eq-pipette", target: "mat-hcl" },
        wrongTool: "Untuk mengambil larutan, gunakan PIPET.",
        wrongTarget: "Pada tahap ini yang diambil adalah larutan ASAM — isi pipet dari botol HCl.",
        safety: "Prosedur nyata: dilarang menghisap pipet dengan mulut. Gunakan bola hisap karet.",
        concept: "HCl adalah asam kuat yang terionisasi sempurna menjadi H⁺ dan Cl⁻.",
      },
      {
        id: "s3", no: "LANGKAH 03", title: "Masukkan HCl ke Erlenmeyer",
        instruction: "Seret PIPET BERISI HCl ke Erlenmeyer untuk memindahkan 20 mL larutan asam.",
        hint: "Inilah analit — larutan yang akan dinetralkan.",
        action: { kind: "drag", tool: "pipette-hcl", target: "eq-erlenmeyer" },
        wrongTool: "Gunakan PIPET yang SUDAH BERISI HCl dari langkah sebelumnya.",
        wrongTarget: "Pindahkan larutan ke dalam ERLENMEYER yang sudah disiapkan.",
        safety: "Arahkan ujung pipet ke dinding dalam Erlenmeyer agar tidak memercik.",
        concept: "Larutan dalam Erlenmeyer kini bersifat asam (pH ≈ 2).",
      },
      {
        id: "s4", no: "LANGKAH 04", title: "Tambahkan Indikator",
        instruction: "Seret INDIKATOR FENOLFTALEIN ke Erlenmeyer (2 tetes), lalu perhatikan warnanya.",
        hint: "Perhatikan baik-baik: dalam larutan asam, fenolftalein TIDAK berwarna.",
        action: { kind: "drag", tool: "mat-indicator", target: "eq-erlenmeyer" },
        wrongTool: "Penanda titik akhir pada praktikum ini adalah INDIKATOR FENOLFTALEIN.",
        wrongTarget: "Indikator diteteskan ke larutan di dalam ERLENMEYER.",
        safety: "Cukup 2 tetes — indikator berlebih tidak membuat hasil lebih akurat.",
        concept: "Indikator tak berwarna membuktikan larutan masih bersifat asam.",
      },
      {
        id: "s5", no: "LANGKAH 05", title: "Ambil Larutan NaOH",
        instruction: "Seret PIPET ke BOTOL NaOH untuk mengambil larutan basa sebagai titran.",
        hint: "NaOH adalah TITRAN — larutan yang akan diteteskan untuk menetralkan asam.",
        action: { kind: "drag", tool: "eq-pipette", target: "mat-naoh" },
        wrongTool: "Ambil larutan basa menggunakan PIPET.",
        wrongTarget: "Kali ini yang diambil adalah larutan BASA — isi pipet dari botol NaOH.",
        safety: "Gunakan pipet bersih agar tidak terjadi kontaminasi asam-basa di dalam pipet.",
        concept: "NaOH terionisasi menjadi Na⁺ dan OH⁻ — sumber ion hidroksida.",
      },
      {
        id: "s6", no: "LANGKAH 06", title: "Masukkan NaOH",
        instruction: "Seret PIPET BERISI NaOH ke Erlenmeyer untuk meneteskan titran pertama.",
        hint: "Netralisasi dimulai: ion OH⁻ mulai menemui ion H⁺.",
        action: { kind: "drag", tool: "pipette-naoh", target: "eq-erlenmeyer" },
        wrongTool: "Gunakan PIPET yang SUDAH BERISI NaOH.",
        wrongTarget: "Titran diteteskan ke larutan asam di dalam ERLENMEYER.",
        concept: "Reaksi dimulai: H⁺ + OH⁻ → H₂O.",
      },
      {
        id: "s7", no: "LANGKAH 07", title: "Gojog Larutan",
        instruction: "Tekan tombol GOJOG untuk mencampur larutan agar homogen.",
        hint: "Pencampuran merata membuat perubahan warna terbaca dengan benar.",
        action: { kind: "swirl" },
        wrongTool: "", wrongTarget: "",
        safety: "Gojog dengan gerakan melingkar lembut — leher Erlenmeyer mencegah tumpahan.",
        concept: "Homogenisasi memastikan pengukuran titik akhir yang valid.",
      },
      {
        id: "s8", no: "LANGKAH 08", title: "Titrasi hingga Titik Akhir",
        instruction: "Tekan +1 TETES NaOH perlahan. HENTIKAN tepat saat MERAH MUDA MUNCUL dan bertahan.",
        hint: "Mendekati pH 7 warna masih hilang; merah muda muncul tepat setelah semua asam dinetralkan.",
        action: { kind: "titrate" },
        wrongTool: "", wrongTarget: "",
        safety: "Kesalahan paling umum: meneteskan terlalu cepat sehingga titik akhir terlewati jauh.",
        concept: "Titik akhir titrasi ≈ titik ekuivalen: mol H⁺ = mol OH⁻.",
      },
      {
        id: "s9", no: "LANGKAH 09", title: "Amati Perubahan",
        instruction: "Buka panel pengamatan dan catat apa yang benar-benar terlihat oleh matamu.",
        hint: "Fokus pada fenomena yang teramati — warna, kejernihan, suhu.",
        action: { kind: "observe" },
        wrongTool: "", wrongTarget: "",
        concept: "Ilmuwan memisahkan OBSERVASI (fakta) dari INTERPRETASI (penjelasan).",
      },
      {
        id: "s10", no: "LANGKAH 10", title: "Lihat pada Tingkat Molekul",
        instruction: "Tekan LIHAT PADA TINGKAT MOLEKUL — saksikan apa yang tidak bisa dilihat mata.",
        hint: "Hubungkan tiga representasi: makroskopis, mikroskopis, dan simbolik.",
        action: { kind: "molecular" },
        wrongTool: "", wrongTarget: "",
        concept: "Segitiga kimia Johnstone: makroskopis ↔ mikroskopis ↔ simbolik.",
      },
      {
        id: "s11", no: "LANGKAH 11", title: "Catat Hasil",
        instruction: "Pilih catatan hasil pengamatan yang paling tepat untuk lembar kerjamu.",
        hint: "Apa warna akhir larutan, dan zat apa yang terbentuk?",
        action: {
          kind: "record",
          options: [
            "Larutan tetap tak berwarna; tidak terjadi reaksi apa pun",
            "Larutan berubah menjadi merah muda; terbentuk natrium klorida dan air",
            "Larutan menjadi biru dan muncul gelembung gas hidrogen",
            "Terbentuk endapan putih di dasar Erlenmeyer",
          ],
          answerIndex: 1,
        },
        wrongTool: "", wrongTarget: "",
        concept: "Pencatatan hasil harus deskriptif dan sesuai fakta pengamatan.",
      },
      {
        id: "s12", no: "LANGKAH 12", title: "Analisis Partikel",
        instruction: "Partikel apa yang sebenarnya bergabung membentuk air saat netralisasi?",
        hint: "Ingat tampilan mikroskopis — ion mana yang jumlahnya berkurang habis?",
        action: {
          kind: "analyze",
          options: ["Na⁺ dan Cl⁻", "H⁺ dan OH⁻", "HCl dan NaOH sebagai molekul utuh", "Na⁺ dan OH⁻"],
          answerIndex: 1,
        },
        wrongTool: "", wrongTarget: "",
        concept: "Persamaan ion bersih: H⁺ + OH⁻ → H₂O.",
      },
      {
        id: "s13", no: "LANGKAH 13", title: "Selesaikan Praktikum",
        instruction: "Rapikan alat dan akhiri praktikum untuk masuk ke tahap Post-Lab.",
        hint: "Sisa larutan hasil netralisasi dibuang ke wadah limbah yang disediakan.",
        action: { kind: "drag", tool: "eq-erlenmeyer", target: "zone-waste" },
        wrongTool: "Bawa ERLENMEYER berisi sisa larutan ke area pembuangan limbah.",
        wrongTarget: "Sisa larutan dibuang ke WADAH LIMBAH, bukan ke tempat lain.",
        safety: "Pembuangan limbah kimia yang benar adalah bagian dari prosedur keselamatan.",
        concept: "Pengelolaan limbah adalah tanggung jawab setiap praktikan.",
      },
    ],
    observation: {
      macro: {
        title: "Tingkat MAKROSKOPIS — apa yang mata amati",
        points: [
          "Sebelum titrasi: larutan HCl + fenolftalein TAK BERWARNA dan jernih.",
          "Selama titrasi: setiap tetes NaOH menimbulkan semburat merah muda yang langsung hilang saat digojog.",
          "Pada titik akhir: MERAH MUDA MUDA muncul dan bertahan — tanda asam telah habis dinetralkan.",
          "Tidak ada gelembung maupun endapan; suhu larutan sedikit meningkat (reaksi eksoterm).",
        ],
      },
      micro: {
        title: "Tingkat MIKROSKOPIS — apa yang terjadi pada partikel",
        points: [
          "HCl dalam air terurai sempurna menjadi ion H⁺ dan Cl⁻.",
          "NaOH yang diteteskan terurai menjadi ion Na⁺ dan OH⁻.",
          "Setiap ion OH⁻ yang masuk langsung bergabung dengan satu ion H⁺ membentuk molekul air (H₂O).",
          "Ion Na⁺ dan Cl⁻ tidak berubah — keduanya disebut ion spektator (penonton).",
          "Ketika ion H⁺ habis, tetesan OH⁻ berikutnya tinggal bebas → larutan menjadi basa → indikator merah muda.",
        ],
      },
      symbolic: {
        title: "Tingkat SIMBOLIK — bagaimana kimia menuliskannya",
        equation: "HCl + NaOH → NaCl + H2O",
        ionic: "H⁺ + OH⁻ → H2O",
        points: [
          "Persamaan molekuler: HCl + NaOH → NaCl + H₂O.",
          "Persamaan ion lengkap: H⁺ + Cl⁻ + Na⁺ + OH⁻ → Na⁺ + Cl⁻ + H₂O.",
          "Persamaan ion bersih: H⁺ + OH⁻ → H₂O — inti dari SEMUA reaksi netralisasi asam kuat & basa kuat.",
          "Jumlah atom di ruas kiri sama dengan ruas kanan: tidak ada atom yang hilang atau tercipta.",
          "Pola umum: ASAM + BASA → GARAM + AIR.",
        ],
      },
    },
    analysisQuestion: {
      prompt: "Jelaskan mengapa terjadi perubahan pada larutan setelah asam dan basa dicampurkan. Kaitkan jawabanmu dengan ion yang terlibat dan perubahan warna indikator.",
      keywords: [
        { word: "h+", concept: "menyebut ion H⁺ dari asam" },
        { word: "oh", concept: "menyebut ion OH⁻ dari basa" },
        { word: "air", concept: "menyebutkan air (H₂O) sebagai produk" },
        { word: "netral", concept: "menyebut kondisi netral / netralisasi" },
        { word: "indikator", concept: "mengaitkan dengan perubahan indikator" },
        { word: "warna", concept: "menjelaskan perubahan warna teramati" },
        { word: "garam", concept: "menyebut garam (NaCl) sebagai hasil" },
      ],
      modelAnswer: "Ketika HCl dan NaOH dicampur, ion H⁺ dari asam bergabung dengan ion OH⁻ dari basa membentuk molekul air (H⁺ + OH⁻ → H₂O). Karena ion H⁺ berkurang terus, sifat asam larutan melemah hingga akhirnya habis (netral). Ion Na⁺ dan Cl⁻ tetap sebagai ion spektator dan membentuk garam NaCl. Ketika seluruh H⁺ telah bereaksi, tetesan OH⁻ berikutnya membuat larutan sedikit basa, sehingga indikator fenolftalein berubah dari tak berwarna menjadi merah muda. Jadi perubahan warna adalah tanda MAKROSKOPIS dari peristiwa MIKROSKOPIS berupa penggabungan H⁺ dan OH⁻.",
    },
    postlab: {
      summary: "Larutan asam klorida (HCl) berhasil dinetralkan oleh larutan natrium hidroksida (NaOH). Indikator fenolftalein yang semula tak berwarna berubah menjadi merah muda tepat setelah seluruh ion H⁺ habis bereaksi — menandakan titik akhir titrasi tercapai.",
      equation: "HCl + NaOH → NaCl + H2O",
      molecular: "Pada tingkat partikel, HCl terurai menjadi H⁺ dan Cl⁻, sedangkan NaOH terurai menjadi Na⁺ dan OH⁻. Setiap ion H⁺ berpasangan dengan satu ion OH⁻ membentuk molekul H₂O yang stabil dan netral. Ion Na⁺ dan Cl⁻ tidak ikut bereaksi (ion spektator) dan tetap terlarut sebagai garam NaCl. Ketika seluruh H⁺ telah habis, penambahan OH⁻ berikutnya membuat larutan bersifat basa sehingga fenolftalein berubah warna.",
      analysis: "Titik akhir titrasi dicapai ketika mol H⁺ dari asam setara dengan mol OH⁻ dari basa. Dari volume dan konsentrasi titran, konsentrasi analit dapat dihitung dengan hubungan M₁V₁ = M₂V₂ (untuk asam kuat–basa kuat berbanding 1:1). Ketepatan penetesan menentukan akurasi hasil: satu tetes berlebih sudah mengubah pH secara tajam di sekitar titik ekuivalen.",
      hots: [
        {
          id: "h1", type: "prediksi",
          question: "Jika jumlah NaOH yang ditambahkan LEBIH BANYAK daripada HCl, bagaimana kondisi larutan setelah reaksi? Jelaskan alasanmu pada tingkat partikel.",
          modelAnswer: "Larutan menjadi BASA (pH > 7). Semua ion H⁺ sudah habis bereaksi membentuk air, sehingga kelebihan ion OH⁻ tidak memiliki pasangan dan tetap bebas di larutan. Akibatnya warna merah muda fenolftalein menjadi semakin pekat, bukan sekadar merah muda samar.",
          keywords: ["basa", "oh", "berlebih", "merah muda", "h+"],
          rubric: "Jawaban ideal menyebut: larutan bersifat basa, ion OH⁻ berlebih, H⁺ sudah habis, dan warna merah muda makin pekat.",
        },
        {
          id: "h2", type: "sebab-akibat",
          question: "Mengapa perubahan warna indikator dapat dijadikan tanda bahwa reaksi netralisasi telah mencapai titik akhir? Kaitkan sebab dan akibatnya.",
          modelAnswer: "Sebab: fenolftalein hanya berubah warna ketika larutan bersifat basa (pH ≈ 8,2 ke atas). Akibat: selama masih ada H⁺ bebas, setiap OH⁻ yang masuk langsung habis membentuk air sehingga larutan belum basa dan indikator tetap tak berwarna. Begitu H⁺ habis, OH⁻ pertama yang tersisa membuat larutan basa dan warna muncul. Jadi munculnya warna adalah AKIBAT dari habisnya ion H⁺ — itulah sebabnya warna dipakai sebagai penanda titik akhir.",
          keywords: ["h+", "habis", "oh", "basa", "warna"],
          rubric: "Jawaban ideal menghubungkan habisnya H⁺ (sebab) dengan munculnya warna merah muda (akibat).",
        },
        {
          id: "h3", type: "analisis-kesalahan",
          question: "Seorang siswa menuang NaOH sekaligus dari botol tanpa pipet dan tanpa menggojog. Analisislah kesalahan tersebut dan dampaknya terhadap hasil praktikum.",
          modelAnswer: "Kesalahan: (1) tidak menggunakan pipet sehingga volume tidak terukur dan tidak dapat dihentikan per tetes; (2) tidak menggojog sehingga pencampuran tidak homogen. Dampak: titik akhir hampir pasti terlewati jauh — larutan langsung menjadi sangat basa dan berwarna merah muda pekat. Volume titran yang tercatat menjadi lebih besar dari seharusnya, sehingga perhitungan konsentrasi asam menjadi salah (hasil terlalu tinggi). Selain itu risiko percikan bahan korosif meningkat.",
          keywords: ["pipet", "terlewati", "gojog", "volume", "tidak akurat", "akurat"],
          rubric: "Jawaban ideal mengidentifikasi dua kesalahan prosedur dan minimal dua dampak: titik akhir terlewati serta hasil perhitungan tidak akurat.",
        },
        {
          id: "h4", type: "perubahan-kondisi",
          question: "Jika konsentrasi NaOH diganti menjadi 0,05 M (setengahnya) sementara HCl tetap 0,1 M, apa yang berubah dari praktikum ini? Jelaskan.",
          modelAnswer: "Volume NaOH yang dibutuhkan untuk mencapai titik akhir menjadi DUA KALI LIPAT, karena jumlah mol OH⁻ per mililiter menjadi setengahnya sedangkan mol H⁺ yang harus dinetralkan tidak berubah. Reaksi dan produknya tetap sama (NaCl + H₂O) dan warna akhir tetap merah muda; yang berubah hanyalah jumlah tetesan/volume titran. Ini menunjukkan bahwa yang menentukan titik ekuivalen adalah jumlah MOL, bukan volume semata.",
          keywords: ["dua kali", "volume", "mol", "sama", "lebih banyak"],
          rubric: "Jawaban ideal menyatakan volume titran menjadi dua kali lipat dan menjelaskan lewat konsep mol.",
        },
        {
          id: "h5", type: "penalaran-partikel",
          question: "Setelah reaksi selesai, larutan tetap terlihat bening walaupun mengandung NaCl. Berdasarkan penalaran tingkat partikel, jelaskan mengapa garam tersebut tidak terlihat.",
          modelAnswer: "Karena NaCl terlarut sempurna dalam air dalam bentuk ion-ion terpisah, yaitu Na⁺ dan Cl⁻, yang terhidrasi oleh molekul air. Ion-ion ini berukuran sangat kecil (skala nanometer) sehingga tidak menghamburkan cahaya tampak dan larutan tetap bening. Garam baru akan terlihat sebagai kristal jika airnya diuapkan, sehingga ion Na⁺ dan Cl⁻ tersusun kembali membentuk kisi kristal NaCl.",
          keywords: ["ion", "terlarut", "na", "cl", "kristal", "diuapkan", "air"],
          rubric: "Jawaban ideal menyebut NaCl berada sebagai ion terlarut (Na⁺ dan Cl⁻) dan akan tampak kembali bila air diuapkan.",
        },
        {
          id: "h6", type: "sebab-akibat",
          question: "Suhu larutan sedikit naik selama netralisasi. Apa penyebabnya, dan apa yang dapat kamu simpulkan tentang energi reaksi ini?",
          modelAnswer: "Penyebabnya adalah pembentukan ikatan pada molekul air ketika H⁺ bergabung dengan OH⁻ melepaskan energi lebih besar daripada energi yang diperlukan untuk memisahkan ion-ion tersebut. Energi berlebih dilepaskan ke lingkungan sebagai kalor, sehingga suhu larutan naik. Kesimpulannya, reaksi netralisasi bersifat EKSOTERM.",
          keywords: ["eksoterm", "kalor", "energi", "dilepas", "ikatan"],
          rubric: "Jawaban ideal menyebut pelepasan energi dan menyimpulkan reaksi bersifat eksoterm.",
        },
      ],
      reflectionPrompts: [
        "Bagian mana yang paling membantumu memahami netralisasi?",
        "Kesalahan apa yang kamu lakukan dan bagaimana memperbaikinya?",
        "Apa hubungan antara warna yang kamu lihat dengan partikel yang tidak terlihat?",
        "Konsep apa yang masih ingin kamu pelajari lebih dalam?",
      ],
    },
    recommendations: [
      { dim: "Ketepatan Prosedur", low: "Ulangi praktikum sambil membaca petunjuk tiap langkah dengan teliti — perhatikan alat mana yang diminta dan ke mana tujuannya.", mid: "Prosedurmu sudah cukup baik. Perhatikan langkah yang sempat keliru agar urutan kerja benar-benar melekat.", high: "Prosedurmu sangat rapi dan hampir tanpa kesalahan — kamu siap melakukan titrasi di laboratorium nyata." },
      { dim: "Keselamatan", low: "Baca ulang modul keselamatan: APD dan cara menangani bahan korosif adalah syarat mutlak sebelum praktikum.", mid: "Kesadaran keselamatanmu baik. Biasakan mengecek APD sebelum menyentuh bahan apa pun.", high: "Kamu menerapkan prosedur keselamatan dengan sangat baik — teruskan kebiasaan ini." },
      { dim: "Pemahaman Konsep", low: "Kembali ke menu MATERI, khususnya bagian indikator dan reaksi netralisasi, lalu kerjakan kuis kategori Konsep.", mid: "Konsep dasarmu sudah terbentuk. Perkuat dengan kuis kategori Persamaan dan Analisis Data.", high: "Pemahaman konsepmu kuat dan konsisten dengan hasil pengamatanmu." },
      { dim: "Pemahaman Molekul", low: "Buka menu MOLEKUL 3D dan fitur LIHAT PADA TINGKAT MOLEKUL — kamu masih perlu memperkuat hubungan antara fenomena makroskopis dan proses pada tingkat molekuler.", mid: "Kamu mulai menghubungkan fenomena dengan partikel. Ulangi mode mikroskopis agar hubungan itu makin kokoh.", high: "Kamu mampu menjelaskan fenomena makroskopis melalui perilaku partikel — inilah cara berpikir seorang kimiawan." },
      { dim: "Kemampuan Analisis", low: "Latih menulis penjelasan lengkap: sebutkan ion yang terlibat, produk yang terbentuk, dan alasan perubahan warna.", mid: "Analisismu sudah mengarah tepat. Tambahkan detail ion spektator dan kaitan dengan pH.", high: "Analisismu tajam dan menggunakan istilah kimia dengan tepat." },
      { dim: "HOTS", low: "Kerjakan kembali soal HOTS dan bandingkan dengan jawaban model — fokus pada penalaran 'mengapa', bukan sekadar 'apa'.", mid: "Penalaranmu berkembang baik. Coba jawab dengan struktur sebab → proses → akibat.", high: "Kamu mampu memprediksi, menganalisis kesalahan, dan bernalar di tingkat partikel — level berpikir tingkat tinggi." },
    ],
  },
];

export const experimentById = (id: string) => EXPERIMENTS.find((e) => e.id === id);

export const HOTS_TYPE_LABEL: Record<HotsType, { label: string; color: string }> = {
  "sebab-akibat": { label: "Sebab–Akibat", color: "#38e1ff" },
  "prediksi": { label: "Prediksi", color: "#34d399" },
  "analisis-kesalahan": { label: "Analisis Kesalahan", color: "#fb7185" },
  "perubahan-kondisi": { label: "Perubahan Kondisi", color: "#facc15" },
  "penalaran-partikel": { label: "Penalaran Partikel", color: "#c084fc" },
};
