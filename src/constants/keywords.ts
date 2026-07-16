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
