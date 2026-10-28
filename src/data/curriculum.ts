// ------------------------------------------------------------------
// Curriculum — modul MATERI pembelajaran untuk siswa SMA/MA
// Bahasa sederhana, kontekstual, tersambung ke fitur lain
// ------------------------------------------------------------------

export interface MateriSection {
  id: string;
  title: string;
  icon: string;             // nama konsep untuk pemetaan ikon di UI
  body: string[];           // paragraf penjelasan sederhana
  visual?: { kind: "molecules" | "ph" | "indicators" | "compare"; focus?: string };
  example?: { title: string; text: string };
  keyPoints: string[];      // poin yang wajib diingat
}

export interface MateriModule {
  id: string;
  title: string;
  grade: string;
  duration: string;
  intro: string;
  objectives: string[];
  sections: MateriSection[];
  acidTraits: { title: string; icon: string; text: string }[];
  baseTraits: { title: string; icon: string; text: string }[];
  indicators: { name: string; inAcid: string; inBase: string; color: string }[];
  phExamples: { label: string; ph: number }[];
  toolMaterialLinks: { tools: string[]; materials: string[] };
  safety: string[];
  experimentId: string;
}

export const MATERI: MateriModule[] = [
  {
    id: "asam-basa",
    title: "Asam dan Basa",
    grade: "Kelas XI SMA/MA",
    duration: "± 30 menit",
    intro: "Kenapa jeruk terasa asam? Kenapa sabun terasa licin? Jawabannya ada pada dua kelompok senyawa yang paling sering kamu temui: asam dan basa. Modul ini menyiapkanmu untuk praktikum netralisasi.",
    objectives: [
      "Menjelaskan pengertian asam dan basa dengan bahasa sendiri",
      "Membedakan sifat-sifat asam dan basa dalam kehidupan sehari-hari",
      "Menggunakan indikator dan skala pH untuk mengenali larutan",
      "Menuliskan reaksi netralisasi antara asam dan basa",
      "Melakukan praktikum netralisasi secara virtual dengan prosedur yang benar",
    ],
    sections: [
      {
        id: "pengertian",
        title: "Apa itu Asam dan Basa?",
        icon: "concept",
        body: [
          "ASAM adalah zat yang melepaskan ion H⁺ ketika larut dalam air. Itulah sebabnya larutan asam terasa masam — seperti jeruk, cuka, dan asam lambung di perutmu.",
          "BASA adalah zat yang melepaskan ion OH⁻ dalam air. Basa terasa pahit dan licin di kulit — seperti sabun dan pembersih lantai.",
          "Dalam bentuk molekulnya, asam seperti HCl menyumbangkan H⁺, sedangkan basa seperti NaOH menyumbangkan OH⁻. Dua ion inilah yang nanti jadi 'tokoh utama' reaksi netralisasi.",
        ],
        visual: { kind: "molecules", focus: "HCl" },
        example: { title: "Di sekitarmu", text: "Cuka dapur mengandung asam asetat, minuman bersoda mengandung asam karbonat, sedangkan soda kue (baking soda) dan sabun adalah contoh basa." },
        keyPoints: ["Asam → ion H⁺ dalam air", "Basa → ion OH⁻ dalam air", "H⁺ dan OH⁻ menentukan sifat larutan"],
      },
      {
        id: "sifat",
        title: "Sifat Asam dan Basa",
        icon: "compare",
        body: [
          "Kamu bisa mengenali asam dan basa dari sifatnya — TETAPI jangan pernah mencicipi atau menyentuh bahan kimia di laboratorium untuk mengujinya. Gunakan indikator!",
        ],
        visual: { kind: "compare" },
        example: { title: "Aturan aman", text: "Rasa masam dan licin hanyalah contoh dari kehidupan sehari-hari. Di laboratorium, identifikasi selalu dilakukan dengan indikator, bukan indra." },
        keyPoints: ["Asam: masam, korosif, mengubah lakmus biru → merah", "Basa: pahit, licin, mengubah lakmus merah → biru", "Di lab: uji dengan indikator, bukan dengan indera"],
      },
      {
        id: "indikator",
        title: "Indikator Asam-Basa",
        icon: "indicator",
        body: [
          "Indikator adalah zat yang WARNA-NYA BERUBAH tergantung suasana asam atau basa. Dengan indikator kita bisa 'melihat' pH tanpa alat digital.",
          "Pada praktikum nanti kamu akan memakai FENOLFTALEIN: tak berwarna dalam asam dan netral, MERAH MUDA dalam basa. Perubahan inilah penanda titik akhir titrasi.",
        ],
        visual: { kind: "indicators" },
        example: { title: "Indikator alami", text: "Ekstrak kubis ungu, bunga sepatu, dan kunyit juga berubah warna dalam asam/basa — coba di rumah dengan cara yang aman!" },
        keyPoints: ["Indikator = 'lampu sinyal' pH", "Fenolftalein: tak berwarna ↔ merah muda", "Lakmus: merah (asam) ↔ biru (basa)"],
      },
      {
        id: "ph",
        title: "Skala pH",
        icon: "ph",
        body: [
          "pH adalah angka 0–14 yang mengukur seberapa asam atau basa suatu larutan. pH di bawah 7 = asam, pH 7 = netral (seperti air murni), pH di atas 7 = basa.",
          "Semakin kecil pH semakin kuat asamnya; semakin besar pH semakin kuat basanya. Setiap selisih 1 angka pH berarti 10× perbedaan kekuatan!",
        ],
        visual: { kind: "ph" },
        example: { title: "Skala kekuatan logaritmik", text: "Larutan pH 3 sepuluh kali lebih asam dari pH 4, dan seratus kali lebih asam dari pH 5." },
        keyPoints: ["< 7 asam · 7 netral · > 7 basa", "Skala pH bersifat logaritmik (10× per angka)", "Tujuan netralisasi: mendekati pH 7"],
      },
      {
        id: "netralisasi",
        title: "Reaksi Netralisasi",
        icon: "reaction",
        body: [
          "Saat asam dicampur basa dengan perbandingan yang tepat, keduanya SALING MENGHILANGKAN sifatnya. Inilah netralisasi: asam + basa → garam + air.",
          "Di balik layar, ion H⁺ dari asam bergabung dengan ion OH⁻ dari basa membentuk air. Ion-ion lain menjadi 'penonton' dan bergabung sebagai garam.",
          "Contoh yang akan kamu praktikkan: HCl + NaOH → NaCl + H₂O — asam lambung dan basa kuat berubah menjadi air dan garam dapur!",
        ],
        visual: { kind: "molecules", focus: "H2O" },
        example: { title: "Obat maag", text: "Tablet antasida mengandung basa lemah yang menetralkan kelebihan asam lambung — prinsip yang sama persis dengan praktikummu." },
        keyPoints: ["Asam + basa → garam + air", "Inti reaksi: H⁺ + OH⁻ → H₂O", "Dipraktikkan pada Praktikum 01"],
      },
    ],
    acidTraits: [
      { title: "Rasa masam", icon: "atom", text: "Jeruk, cuka, asam jawa — jangan dicicipi di lab!" },
      { title: "Korosif", icon: "alert", text: "Dapat merusak logam dan mengiritasi kulit." },
      { title: "Lakmus biru → merah", icon: "indicator", text: "Uji klasik dengan kertas lakmus." },
      { title: "pH < 7", icon: "ph", text: "Semakin kecil, semakin asam." },
    ],
    baseTraits: [
      { title: "Rasa pahit, licin", icon: "atom", text: "Seperti sabun — jangan disentuh di lab!" },
      { title: "Kaustik", icon: "alert", text: "Basa kuat juga merusak jaringan kulit." },
      { title: "Lakmus merah → biru", icon: "indicator", text: "Kebalikan dari asam." },
      { title: "pH > 7", icon: "ph", text: "Semakin besar, semakin basa." },
    ],
    indicators: [
      { name: "Lakmus", inAcid: "Merah", inBase: "Biru", color: "#8b5cf6" },
      { name: "Fenolftalein (pp)", inAcid: "Tak berwarna", inBase: "Merah muda", color: "#ff6ec7" },
      { name: "Metil jingga", inAcid: "Merah", inBase: "Kuning", color: "#fb923c" },
      { name: "Kubis ungu", inAcid: "Merah muda", inBase: "Hijau kebiruan", color: "#a78bfa" },
    ],
    phExamples: [
      { label: "Cuka", ph: 2.5 }, { label: "Jeruk", ph: 3.5 }, { label: "Soda", ph: 4 },
      { label: "Kopi", ph: 5 }, { label: "Susu", ph: 6.5 }, { label: "Air murni", ph: 7 },
      { label: "Darah", ph: 7.4 }, { label: "Sabun", ph: 10 }, { label: "Pemutih", ph: 12.5 },
    ],
    toolMaterialLinks: {
      tools: ["Erlenmeyer", "Pipet tetes", "Gelas kimia"],
      materials: ["Larutan HCl 0,1 M", "Larutan NaOH 0,1 M", "Indikator fenolftalein"],
    },
    safety: [
      "Kenakan kacamata pelindung dan sarung tangan sebelum menyentuh bahan.",
      "Pipet dipakai untuk memindahkan larutan — dilarang menghisap dengan mulut.",
      "Teteskan asam perlahan sambil digojog, jangan menuang sekaligus.",
      "Bilas dengan air mengalir jika terkena kulit; laporkan setiap tumpahan.",
    ],
    experimentId: "exp-neutralization",
  },
];

export const materiById = (id: string) => MATERI.find((m) => m.id === id);
