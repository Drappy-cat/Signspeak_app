// Keywords for each supported language
// These are highlighted in the live transcription view

export const KEYWORDS: Record<string, string[]> = {
  id: [
    'fotosintesis', 'kloroplas', 'klorofil', 'cahaya matahari',
    'karbon dioksida', 'glukosa', 'oksigen', 'sel tumbuhan',
  ],
  jv: [
    'fotosintesis', 'kloroplas', 'klorofil', 'srengenge',
    'karbon dioksida', 'glukosa', 'oksigen', 'sel tanduran',
  ],
  mad: [
    'fotosintesis', 'kloroplas', 'klorofil', 'mataare',
    'karbon dioksida', 'glukosa', 'oksigen', 'sel tatembuwan',
  ],
};

// Demo sentences for each language (used in offline demo mode)
export const DEMO_SENTENCES: Record<string, string[]> = {
  id: [
    'Baik anak-anak, hari ini kita akan membahas tentang fotosintesis.',
    'Proses ini sangat penting untuk semua kehidupan di bumi.',
    'Fotosintesis terjadi di dalam kloroplas pada sel tumbuhan.',
    'Klorofil adalah pigmen yang menyerap cahaya matahari untuk menghasilkan energi.',
    'Reaksi fotosintesis mengubah karbon dioksida dan air menjadi glukosa.',
    'Oksigen yang kita hirup adalah hasil sampingan dari proses fotosintesis ini.',
    'Ada pertanyaan sejauh ini? Silakan angkat tangan.',
  ],
  jv: [
    'Nggih bocah-bocah, dina iki awake dhewe arep sinau babagan fotosintesis.',
    'Proses iki wigati banget kanggo kabeh kauripan ing donya.',
    'Fotosintesis kedadeyan ing jero kloroplas ing sel tanduran.',
    'Klorofil iku pigmen sing nyerep srengenge kanggo ngasilake energi.',
    'Reaksi fotosintesis ngowahi karbon dioksida lan banyu dadi glukosa.',
    'Oksigen sing awake dhewe ambegan yaiku asil saka proses fotosintesis iki.',
    'Ana pitakonan? Mangga ngacung.',
  ],
  mad: [
    "Iya na'-kana', are mangken sengko' ban ba'na bakal ajara bab fotosintesis.",
    "Proses reya parlo onggu kaangguy kabadha'an odhi' e bume.",
    'Fotosintesis badha e dhalem kloroplas e sel tatembuwan.',
    'Klorofil areya pigmen se nyerrep mataare kaangguy ngasellagi energi.',
    'Reaksi fotosintesis aoba karbon dioksida ban aeng daddi glukosa.',
    'Oksigen se eedhing yaiku asel dhari proses fotosintesis reya.',
    "Badha se terro atanya'a? Tore ngacong.",
  ],
};

// Language labels for UI
export const LANGUAGE_LABELS: Record<string, string> = {
  id: 'Indonesia',
  jv: 'Jawa',
  mad: 'Madura',
};

// Demo history data for offline mode
export const DEMO_HISTORY = [
  {
    id: 1,
    subject: 'Biologi',
    className: 'XII IPA 3',
    teacherName: 'Bu Sari Dewi',
    date: 'Hari ini, 08:00',
    duration: 2700, // 45 minutes in seconds
    wordCount: 1240,
    language: 'id',
    excerpt: '...fotosintesis terjadi di dalam kloroplas pada sel tumbuhan...',
  },
  {
    id: 2,
    subject: 'Matematika',
    className: 'XII IPA 3',
    teacherName: 'Pak Budi Santoso',
    date: 'Kemarin, 10:00',
    duration: 3000,
    wordCount: 980,
    language: 'id',
    excerpt: '...turunan fungsi trigonometri dan aplikasi integral...',
  },
  {
    id: 3,
    subject: 'Fisika',
    className: 'XII IPA 3',
    teacherName: 'Pak Ahmad Rizki',
    date: 'Senin, 11:00',
    duration: 2700,
    wordCount: 1100,
    language: 'id',
    excerpt: '...hukum Newton tentang gerak, gaya, dan percepatan...',
  },
  {
    id: 4,
    subject: 'Kimia',
    className: 'XII IPA 3',
    teacherName: 'Bu Ratna Sari',
    date: 'Jumat, 08:00',
    duration: 2700,
    wordCount: 890,
    language: 'id',
    excerpt: '...ikatan kovalen polar dan struktur Lewis molekul...',
  },
];

// Demo class data for teacher view
export const DEMO_CLASSES = [
  { name: 'XII IPA 3', subject: 'Biologi', students: 28, active: true },
  { name: 'XI IPA 1', subject: 'Biologi', students: 30, active: false },
  { name: 'X IPS 2', subject: 'Biologi Dasar', students: 32, active: false },
];

// Demo online students
export const DEMO_STUDENTS = ['Andi', 'Siti', 'Budi', 'Rina', 'Doni', 'Maya', 'Heri', 'Lina'];

// Glossary definitions for scientific and regional terms
export const GLOSSARY: Record<string, Record<string, string>> = {
  fotosintesis: {
    id: "Proses pembuatan makanan oleh tumbuhan hijau menggunakan bantuan cahaya matahari, karbon dioksida, dan air.",
    en: "The process by which green plants make their own food using sunlight, carbon dioxide, and water."
  },
  kloroplas: {
    id: "Organel kecil di dalam sel tumbuhan yang mengandung klorofil dan menjadi tempat berlangsungnya fotosintesis.",
    en: "A small organelle inside plant cells that contains chlorophyll and is the site where photosynthesis occurs."
  },
  klorofil: {
    id: "Zat hijau daun pada tumbuhan yang berfungsi menyerap energi cahaya matahari untuk fotosintesis.",
    en: "The green pigment in plants that absorbs sunlight energy for the process of photosynthesis."
  },
  mataare: {
    id: "Matahari (Bahasa Madura). Sumber cahaya dan energi utama bagi kehidupan di bumi, termasuk untuk proses fotosintesis.",
    en: "Sun (Madurese). The primary source of light and energy for life on earth, including photosynthesis."
  },
  srengenge: {
    id: "Matahari (Bahasa Jawa). Sumber cahaya dan energi utama bagi kehidupan di bumi, termasuk untuk proses fotosintesis.",
    en: "Sun (Javanese). The primary source of light and energy for life on earth, including photosynthesis."
  },
  'cahaya matahari': {
    id: "Energi radiasi berupa cahaya yang dipancarkan matahari, sangat dibutuhkan tumbuhan untuk fotosintesis.",
    en: "Radiant energy in the form of light emitted by the sun, essential for plant photosynthesis."
  },
  'karbon dioksida': {
    id: "Gas di udara yang diserap oleh tumbuhan untuk bahan baku pembuatan makanan (glukosa) saat fotosintesis.",
    en: "A gas in the air absorbed by plants to make food (glucose) during photosynthesis."
  },
  glukosa: {
    id: "Senyawa gula sederhana hasil fotosintesis yang digunakan tumbuhan sebagai sumber energi dan bahan pertumbuhan.",
    en: "A simple sugar compound produced by photosynthesis used by plants as an energy source."
  },
  oksigen: {
    id: "Gas hasil fotosintesis yang dilepaskan ke udara, sangat penting untuk pernapasan makhluk hidup.",
    en: "A gas produced by photosynthesis and released into the air, essential for respiration of living things."
  },
  'sel tumbuhan': {
    id: "Unit struktural terkecil dari tumbuhan yang memiliki dinding sel dan organel khusus seperti kloroplas.",
    en: "The smallest structural unit of a plant, containing cell walls and specialized organelles like chloroplasts."
  },
  'sel tanduran': {
    id: "Sel tumbuhan (Bahasa Jawa). Unit struktural terkecil tumbuhan yang memiliki kloroplas.",
    en: "Plant cell (Javanese). The smallest structural unit of a plant containing chloroplasts."
  },
  'sel tatembuwan': {
    id: "Sel tumbuhan (Bahasa Madura). Unit struktural terkecil tumbuhan yang memiliki kloroplas.",
    en: "Plant cell (Madurese). The smallest structural unit of a plant containing chloroplasts."
  }
};
