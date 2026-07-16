import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic, BookOpen, Settings, Home, ChevronLeft,
  ArrowRight, Bell, Type, Globe, GraduationCap,
  User, Clock, Battery, ChevronRight, Moon,
  CheckCircle, Headphones, Zap, Square, Play,
  Search, Users, Radio, Wifi, X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = "onboarding" | "roleSelect" | "login" | "main";
type Role = "student" | "teacher";
type Tab = "home" | "live" | "history" | "settings";
type FontSize = "normal" | "large" | "xlarge";

// ─── Constants ───────────────────────────────────────────────────────────────

const KEYWORDS: Record<string, string[]> = {
  id: [
    "fotosintesis", "kloroplas", "klorofil", "cahaya matahari",
    "karbon dioksida", "glukosa", "oksigen", "sel tumbuhan",
  ],
  jv: [
    "fotosintesis", "kloroplas", "klorofil", "srengenge",
    "karbon dioksida", "glukosa", "oksigen", "sel tanduran",
  ],
  mad: [
    "fotosintesis", "kloroplas", "klorofil", "mataare",
    "karbon dioksida", "glukosa", "oksigen", "sel tatembuwan",
  ],
};

const DEMO_SENTENCES: Record<string, string[]> = {
  id: [
    "Baik anak-anak, hari ini kita akan membahas tentang fotosintesis.",
    "Proses ini sangat penting untuk semua kehidupan di bumi.",
    "Fotosintesis terjadi di dalam kloroplas pada sel tumbuhan.",
    "Klorofil adalah pigmen yang menyerap cahaya matahari untuk menghasilkan energi.",
    "Reaksi fotosintesis mengubah karbon dioksida dan air menjadi glukosa.",
    "Oksigen yang kita hirup adalah hasil sampingan dari proses fotosintesis ini.",
    "Ada pertanyaan sejauh ini? Silakan angkat tangan.",
  ],
  jv: [
    "Nggih bocah-bocah, dina iki awake dhewe arep sinau babagan fotosintesis.",
    "Proses iki wigati banget kanggo kabeh kauripan ing donya.",
    "Fotosintesis kedadeyan ing jero kloroplas ing sel tanduran.",
    "Klorofil iku pigmen sing nyerep srengenge kanggo ngasilake energi.",
    "Reaksi fotosintesis ngowahi karbon dioksida lan banyu dadi glukosa.",
    "Oksigen sing awake dhewe ambegan yaiku asil saka proses fotosintesis iki.",
    "Ana pitakonan? Mangga ngacung.",
  ],
  mad: [
    "Iya na'-kana', are mangken sengko' ban ba'na bakal ajara bab fotosintesis.",
    "Proses reya parlo onggu kaangguy kabadha'an odhi' e bume.",
    "Fotosintesis badha e dhalem kloroplas e sel tatembuwan.",
    "Klorofil areya pigmen se nyerrep mataare kaangguy ngasellagi energi.",
    "Reaksi fotosintesis aoba karbon dioksida ban aeng daddi glukosa.",
    "Oksigen se eedhing yaiku asel dhari proses fotosintesis reya.",
    "Badha se terro atanya'a? Tore ngacong.",
  ],
};

const HISTORY_DATA = [
  { id: 1, subject: "Biologi", kelas: "XII IPA 3", teacher: "Bu Sari Dewi", date: "Hari ini, 08:00", duration: "45 mnt", words: 1240, excerpt: "...fotosintesis terjadi di dalam kloroplas pada sel tumbuhan..." },
  { id: 2, subject: "Matematika", kelas: "XII IPA 3", teacher: "Pak Budi Santoso", date: "Kemarin, 10:00", duration: "50 mnt", words: 980, excerpt: "...turunan fungsi trigonometri dan aplikasi integral..." },
  { id: 3, subject: "Fisika", kelas: "XII IPA 3", teacher: "Pak Ahmad Rizki", date: "Senin, 11:00", duration: "45 mnt", words: 1100, excerpt: "...hukum Newton tentang gerak, gaya, dan percepatan..." },
  { id: 4, subject: "Kimia", kelas: "XII IPA 3", teacher: "Bu Ratna Sari", date: "Jumat, 08:00", duration: "45 mnt", words: 890, excerpt: "...ikatan kovalen polar dan struktur Lewis molekul..." },
];

const FONT_SIZES: Record<FontSize, string> = {
  normal: "text-xl leading-relaxed",
  large: "text-2xl leading-relaxed",
  xlarge: "text-3xl leading-snug",
};

const FONT_LABEL: Record<FontSize, string> = {
  normal: "Normal",
  large: "Besar",
  xlarge: "X. Besar",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseHighlights(text: string, lang: string): Array<{ text: string; isKeyword: boolean }> {
  const lower = text.toLowerCase();
  const ranges: Array<{ start: number; end: number }> = [];
  const kwList = KEYWORDS[lang] || KEYWORDS.id;

  for (const kw of kwList) {
    let idx = 0;
    while (idx < lower.length) {
      const pos = lower.indexOf(kw, idx);
      if (pos === -1) break;
      ranges.push({ start: pos, end: pos + kw.length });
      idx = pos + kw.length;
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  const result: Array<{ text: string; isKeyword: boolean }> = [];
  let pos = 0;
  for (const range of ranges) {
    if (range.start < pos) continue;
    if (range.start > pos) result.push({ text: text.slice(pos, range.start), isKeyword: false });
    result.push({ text: text.slice(range.start, range.end), isKeyword: true });
    pos = range.end;
  }
  if (pos < text.length) result.push({ text: text.slice(pos), isKeyword: false });
  return result;
}

function getTime(): string {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBar({ hc }: { hc: boolean }) {
  const [time, setTime] = useState(getTime);
  useEffect(() => {
    const t = setInterval(() => setTime(getTime()), 15000);
    return () => clearInterval(t);
  }, []);
  const fg = hc ? "text-white" : "text-slate-800";
  return (
    <div className={`flex items-center justify-between px-6 py-2 text-xs font-bold ${fg} shrink-0`}>
      <span className="text-sm">{time}</span>
      <div className="flex items-center gap-1.5 opacity-80">
        <Wifi size={12} />
        <Battery size={13} />
      </div>
    </div>
  );
}

function SpeakingBars({ active, hc }: { active: boolean; hc: boolean }) {
  const ratios = [0.45, 0.75, 1.0, 0.85, 0.55, 0.9, 0.65, 0.8, 0.45];
  const color = hc ? "#34d399" : "#10b981";
  return (
    <div className="flex items-end gap-[3px] h-9">
      {ratios.map((r, i) => (
        <motion.div
          key={i}
          style={{ backgroundColor: color, width: 3, borderRadius: 99 }}
          animate={
            active
              ? { height: [`${r * 6}px`, `${r * 36}px`, `${r * 10}px`, `${r * 30}px`, `${r * 6}px`] }
              : { height: "3px" }
          }
          transition={
            active
              ? { duration: 1.1 + i * 0.04, repeat: Infinity, delay: i * 0.11, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

function HighlightedText({ text, hc, lang, className }: { text: string; hc: boolean; lang: string; className?: string }) {
  const segs = parseHighlights(text, lang);
  return (
    <span className={className}>
      {segs.map((s, i) =>
        s.isKeyword ? (
          <mark
            key={i}
            className={`rounded px-0.5 font-extrabold not-italic ${
              hc ? "bg-amber-400 text-slate-900" : "bg-amber-100 text-amber-900"
            }`}
          >
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </span>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

const SLIDES = [
  {
    gradient: "from-[#0c2461] to-[#1a3a8a]",
    iconBg: "bg-white/15",
    icon: <Headphones size={52} className="text-white" />,
    badge: null,
    title: "SignSpeak",
    sub: "Jembatan komunikasi antara suara dan teks untuk siswa berkebutuhan khusus di ruang kelas Indonesia.",
  },
  {
    gradient: "from-[#1a3a8a] to-[#1e40af]",
    iconBg: "bg-emerald-500/25",
    icon: <Mic size={46} className="text-emerald-300" />,
    badge: "Fitur Utama",
    title: "Transkripsi Real-time",
    sub: "Suara guru langsung berubah menjadi teks besar yang mudah dibaca — tanpa jeda, tanpa hambatan.",
  },
  {
    gradient: "from-[#1e40af] to-[#1e3a8a]",
    iconBg: "bg-amber-400/25",
    icon: <Users size={46} className="text-amber-300" />,
    badge: "Aksesibilitas",
    title: "Dirancang untuk Semua",
    sub: "Mode kontras tinggi, ukuran teks yang bisa disesuaikan, dan dukungan Bahasa Indonesia, Jawa, & Madura.",
  },
];

function OnboardingScreen({ slide, setSlide, onDone }: { slide: number; setSlide: (n: number) => void; onDone: () => void }) {
  const s = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b ${s.gradient} text-white`}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-7 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.32 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <div className={`w-28 h-28 rounded-3xl ${s.iconBg} flex items-center justify-center border border-white/10 backdrop-blur-sm`}>
              {s.icon}
            </div>
            {s.badge && (
              <div className="px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-widest">
                {s.badge}
              </div>
            )}
            <h1 className="text-3xl font-black tracking-tight">{s.title}</h1>
            <p className="text-base text-white/75 leading-relaxed max-w-[270px]">{s.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-10 flex flex-col gap-5 shrink-0">
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              className="h-2 rounded-full bg-white"
              animate={{ width: i === slide ? 26 : 8, opacity: i === slide ? 1 : 0.3 }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => (isLast ? onDone() : setSlide(slide + 1))}
          className="w-full bg-white text-blue-900 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg"
        >
          {isLast ? "Mulai Sekarang" : "Lanjut"}
          <ArrowRight size={18} />
        </motion.button>
        {!isLast && (
          <button onClick={onDone} className="text-white/40 text-sm text-center font-semibold">
            Lewati
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Role Select ─────────────────────────────────────────────────────────────

function RoleSelectScreen({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0c2461] to-[#1a3a8a] text-white px-6">
      <div className="flex-1 flex flex-col justify-center gap-8">
        <div className="text-center">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Selamat Datang</p>
          <h1 className="text-3xl font-black">Saya adalah...</h1>
        </div>
        <div className="flex flex-col gap-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect("student")}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white/10 border border-white/15 text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-400/25 flex items-center justify-center shrink-0">
              <GraduationCap size={30} className="text-blue-200" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-lg">Siswa</div>
              <div className="text-sm text-white/55 mt-0.5">Terima transkripsi live di kelas</div>
            </div>
            <ChevronRight size={18} className="text-white/35 shrink-0" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect("teacher")}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white/10 border border-white/15 text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-400/25 flex items-center justify-center shrink-0">
              <Mic size={28} className="text-amber-200" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-lg">Guru / Pengajar</div>
              <div className="text-sm text-white/55 mt-0.5">Mulai sesi dan transkripsi suara Anda</div>
            </div>
            <ChevronRight size={18} className="text-white/35 shrink-0" />
          </motion.button>
        </div>
        <p className="text-center text-white/30 text-xs">Peran dapat diubah kapan saja di Pengaturan</p>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ role, onLogin, hc }: { role: Role; onLogin: () => void; hc: boolean }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const bg = hc ? "bg-slate-900 text-white" : "bg-[#F0F7FF] text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-150";
  const inp = hc
    ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400";
  const muted = hc ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`flex flex-col h-full ${bg} px-6`}>
      <div className="flex flex-col items-center pt-8 pb-6 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-blue-900 flex items-center justify-center shadow-lg">
          <Headphones size={32} className="text-white" />
        </div>
        <div className="text-center">
          <div className="text-xl font-black text-blue-900">SignSpeak</div>
          <div className={`text-xs ${muted} mt-0.5`}>
            Masuk sebagai <span className="font-bold">{role === "student" ? "Siswa" : "Guru"}</span>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border p-5 flex flex-col gap-4 ${card} shadow-sm`}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nama@sekolah.sch.id"
            className={`rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-700 transition-shadow ${inp}`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold">Kata Sandi</label>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="••••••••"
            className={`rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-700 transition-shadow ${inp}`}
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="w-full bg-blue-900 text-white py-3.5 rounded-xl font-extrabold text-base mt-1"
        >
          Masuk
        </motion.button>
      </div>

      <div className={`text-center text-sm ${muted} mt-4`}>
        Belum punya akun?{" "}
        <button onClick={onLogin} className="text-blue-800 font-extrabold">Daftar Gratis</button>
      </div>

      <div className={`mt-4 rounded-xl border p-3 flex items-center gap-2 ${hc ? "bg-slate-800 border-slate-700" : "bg-blue-50 border-blue-100"}`}>
        <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-black">#</span>
        </div>
        <div>
          <div className={`text-xs font-bold ${hc ? "text-slate-200" : "text-blue-900"}`}>Bergabung via Kode Kelas</div>
          <div className={`text-xs ${muted}`}>Masukkan kode dari guru tanpa perlu daftar</div>
        </div>
      </div>

      <div className="mt-auto pb-4" />
    </div>
  );
}

// ─── Student Home ─────────────────────────────────────────────────────────────

function StudentHome({ hc, setTab }: { hc: boolean; setTab: (t: Tab) => void }) {
  const bg = hc ? "bg-slate-900 text-white" : "bg-[#F0F7FF] text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const iconBg = hc ? "bg-blue-800" : "bg-blue-50";
  const iconColor = hc ? "text-blue-300" : "text-blue-700";

  return (
    <div className={`h-full overflow-y-auto ${bg} pb-4`}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <div>
          <p className={`text-xs font-bold ${muted}`}>Selamat Pagi 👋</p>
          <h1 className="text-xl font-black mt-0.5">Budi Santoso</h1>
        </div>
        <button className={`w-10 h-10 rounded-full ${hc ? "bg-slate-700" : "bg-white"} flex items-center justify-center shadow-sm`}>
          <Bell size={17} className={muted} />
        </button>
      </div>

      {/* Active session */}
      <div className="px-5 pt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setTab("live")}
          className="w-full rounded-2xl bg-gradient-to-br from-blue-900 to-blue-800 p-5 text-left relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-36 h-36 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-300 text-xs font-black uppercase tracking-wider">Sesi Aktif</span>
            </div>
            <div className="text-white font-black text-lg leading-tight">Biologi — XII IPA 3</div>
            <div className="text-blue-300 text-sm mt-1">Bu Sari Dewi • Sedang berlangsung</div>
            <div className="mt-4 inline-flex items-center gap-1.5 bg-white text-blue-900 px-4 py-2 rounded-xl text-sm font-extrabold">
              Gabung Sekarang <ArrowRight size={14} />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Stats row */}
      <div className="px-5 pt-4 grid grid-cols-2 gap-3">
        {[
          { label: "Total Sesi", value: "24", sub: "bulan ini" },
          { label: "Kata Ditranskripsi", value: "18.4K", sub: "total keseluruhan" },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl border p-3.5 ${card}`}>
            <div className={`text-xs font-bold ${muted}`}>{stat.label}</div>
            <div className="text-2xl font-black mt-1">{stat.value}</div>
            <div className={`text-xs ${muted} mt-0.5`}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent history */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-base">Riwayat Terbaru</h2>
          <button onClick={() => setTab("history")} className={`text-sm font-bold ${hc ? "text-blue-400" : "text-blue-800"}`}>
            Lihat Semua
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {HISTORY_DATA.slice(0, 3).map(item => (
            <div key={item.id} className={`rounded-xl border p-3.5 flex gap-3 ${card}`}>
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <BookOpen size={17} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{item.subject}</div>
                <div className={`text-xs ${muted} mt-0.5`}>{item.date} · {item.duration}</div>
                <div className={`text-xs ${muted} mt-1 truncate italic`}>{item.excerpt}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Live Transcription ───────────────────────────────────────────────────────

function LiveScreen({ hc, fontSize, lang }: { hc: boolean; fontSize: FontSize; lang: string }) {
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState("");
  const [sentIdx, setSentIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [speaking, setSpeaking] = useState(true);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bg = hc ? "bg-slate-900 text-white" : "bg-[#F0F7FF] text-slate-900";
  const headerBg = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-150";
  const ctrlBg = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const divider = hc ? "border-slate-700" : "border-slate-100";
  const cursorColor = hc ? "bg-white" : "bg-slate-800";
  const prevColor = hc ? "text-slate-500" : "text-slate-400";

  const currentSentences = DEMO_SENTENCES[lang] || DEMO_SENTENCES.id;

  useEffect(() => {
    if (paused || sentIdx >= currentSentences.length) {
      setSpeaking(false);
      return;
    }
    const words = currentSentences[sentIdx].split(" ");
    if (wordIdx < words.length) {
      setSpeaking(true);
      const t = setTimeout(() => {
        setActive(p => (p ? p + " " + words[wordIdx] : words[wordIdx]));
        setWordIdx(w => w + 1);
      }, 260 + Math.random() * 180);
      return () => clearTimeout(t);
    } else {
      setSpeaking(false);
      const t = setTimeout(() => {
        setDone(p => [...p, currentSentences[sentIdx]]);
        setActive("");
        setWordIdx(0);
        setSentIdx(s => s + 1);
      }, 850);
      return () => clearTimeout(t);
    }
  }, [wordIdx, sentIdx, paused, currentSentences]);

  // Reset if language changes
  useEffect(() => {
    setDone([]);
    setActive("");
    setSentIdx(0);
    setWordIdx(0);
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [done, active]);

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${headerBg}`}>
        <div>
          <div className="font-extrabold text-sm">Bu Sari Dewi</div>
          <div className={`text-xs ${muted}`}>Biologi — XII IPA 3</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-500 text-xs font-black tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Speaking indicator */}
      <div className={`px-5 py-3 flex items-center gap-4 border-b shrink-0 ${divider} ${hc ? "bg-slate-900" : "bg-white/60"}`}>
        <SpeakingBars active={speaking && !paused} hc={hc} />
        <div className="flex flex-col">
          <span className={`text-xs font-bold ${speaking && !paused ? (hc ? "text-emerald-400" : "text-emerald-600") : muted}`}>
            {speaking && !paused ? "Sedang berbicara..." : paused ? "Dijeda" : "Menunggu..."}
          </span>
          <span className={`text-[10px] ${muted}`}>Bu Sari Dewi • Guru</span>
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {done.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`leading-relaxed ${prevColor} ${
              i >= done.length - 2 ? "text-base" : "text-sm"
            }`}
          >
            <HighlightedText text={line} hc={hc} lang={lang} />
          </motion.p>
        ))}

        {active && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`font-extrabold ${FONT_SIZES[fontSize]} ${hc ? "text-white" : "text-slate-900"}`}
          >
            <HighlightedText text={active} hc={hc} lang={lang} />
            <span
              className={`inline-block w-[3px] h-[0.9em] ml-1 align-middle rounded-sm animate-pulse ${cursorColor}`}
            />
          </motion.p>
        )}

        {sentIdx >= currentSentences.length && !active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 py-6"
          >
            <CheckCircle size={28} className="text-emerald-500" />
            <p className={`text-sm font-bold ${muted}`}>Sesi selesai — 7 kalimat ditranskripsi</p>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className={`px-4 py-3 border-t flex items-center justify-between shrink-0 ${ctrlBg}`}>
        <div className={`text-xs font-bold ${muted}`}>
          Ukuran: <span className={hc ? "text-white" : "text-slate-800"}>{FONT_LABEL[fontSize]}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-extrabold transition-colors ${
              paused
                ? "bg-blue-900 text-white"
                : hc ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700"
            }`}
          >
            {paused ? <Play size={13} /> : <Square size={13} />}
            {paused ? "Lanjut" : "Jeda"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History ─────────────────────────────────────────────────────────────────

function HistoryScreen({ hc }: { hc: boolean }) {
  const bg = hc ? "bg-slate-900 text-white" : "bg-[#F0F7FF] text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const searchBg = hc
    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";
  const iconBg = hc ? "bg-blue-900" : "bg-blue-50";
  const iconColor = hc ? "text-blue-300" : "text-blue-700";
  const divider = hc ? "border-slate-700" : "border-slate-100";
  const linkColor = hc ? "text-blue-400" : "text-blue-800";

  return (
    <div className={`h-full flex flex-col ${bg}`}>
      <div className="px-5 pt-3 pb-3 shrink-0">
        <h1 className="text-xl font-black mb-3">Riwayat Transkrip</h1>
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${searchBg}`}>
          <Search size={15} className={muted} />
          <input type="text" placeholder="Cari mata pelajaran atau kata kunci..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-3">
        <p className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>Minggu Ini</p>
        {HISTORY_DATA.map(item => (
          <div key={item.id} className={`rounded-xl border ${card}`}>
            <div className="p-4 flex gap-3">
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                <BookOpen size={17} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm">{item.subject}</div>
                <div className={`text-xs ${muted}`}>{item.teacher} · {item.kelas}</div>
                <div className={`flex items-center gap-1 text-xs ${muted} mt-1`}>
                  <Clock size={10} />
                  <span>{item.date} · {item.duration}</span>
                </div>
                <p className={`text-xs mt-1.5 italic leading-relaxed ${hc ? "text-slate-400" : "text-slate-500"}`}>{item.excerpt}</p>
              </div>
            </div>
            <div className={`mx-4 pt-2.5 pb-3 border-t ${divider} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${muted}`}>{item.words.toLocaleString("id-ID")} kata</span>
                <span className={`w-1 h-1 rounded-full ${hc ? "bg-slate-600" : "bg-slate-300"}`} />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${hc ? "bg-slate-700 text-slate-300" : "bg-emerald-50 text-emerald-700"}`}>
                  Selesai
                </span>
              </div>
              <button className={`text-xs font-extrabold ${linkColor}`}>Buka →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Accessibility Settings ───────────────────────────────────────────────────

function SettingsScreen({
  hc, setHc, fontSize, setFontSize, lang, setLang,
}: {
  hc: boolean; setHc: (v: boolean) => void;
  fontSize: FontSize; setFontSize: (v: FontSize) => void;
  lang: string; setLang: (v: string) => void;
}) {
  const [vibrate, setVibrate] = useState(true);
  const bg = hc ? "bg-slate-900 text-white" : "bg-[#F0F7FF] text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const activeBtn = hc ? "bg-blue-700 text-white" : "bg-blue-900 text-white";
  const inactiveBtn = hc ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600";
  const iconColor = hc ? "text-blue-400" : "text-blue-800";
  const divider = hc ? "border-slate-700" : "border-slate-100";

  function Toggle({ val, onChange }: { val: boolean; onChange: () => void }) {
    return (
      <button
        onClick={onChange}
        className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${val ? "bg-blue-700" : hc ? "bg-slate-600" : "bg-slate-300"}`}
      >
        <motion.div
          animate={{ x: val ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
        />
      </button>
    );
  }

  return (
    <div className={`h-full overflow-y-auto ${bg} pb-4`}>
      <div className="px-5 pt-3 pb-2 shrink-0">
        <h1 className="text-xl font-black">Aksesibilitas</h1>
        <p className={`text-xs ${muted} mt-0.5`}>Sesuaikan tampilan sesuai kebutuhan Anda</p>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {/* Font size */}
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className="flex items-center gap-2 mb-3">
            <Type size={15} className={iconColor} />
            <span className="font-extrabold text-sm">Ukuran Teks Transkripsi</span>
          </div>
          <div className="flex gap-2">
            {(["normal", "large", "xlarge"] as FontSize[]).map(s => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-colors ${fontSize === s ? activeBtn : inactiveBtn}`}
              >
                {FONT_LABEL[s]}
              </button>
            ))}
          </div>
          <div className={`mt-3 pt-3 border-t ${divider}`}>
            <p className={`text-xs ${muted} mb-1`}>Pratinjau:</p>
            <p className={`font-extrabold ${FONT_SIZES[fontSize]} ${hc ? "text-white" : "text-slate-800"}`}>
              Teks Abc 123
            </p>
          </div>
        </div>

        {/* High contrast */}
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon size={15} className={iconColor} />
              <div>
                <div className="font-extrabold text-sm">Mode Kontras Tinggi</div>
                <div className={`text-xs ${muted} mt-0.5`}>Latar gelap untuk kenyamanan visual</div>
              </div>
            </div>
            <Toggle val={hc} onChange={() => setHc(!hc)} />
          </div>
        </div>

        {/* Language */}
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={15} className={iconColor} />
            <span className="font-extrabold text-sm">Bahasa Transkripsi</span>
          </div>
          <div className="flex gap-2">
            {[
              { code: "id", label: "Indonesia" },
              { code: "jv", label: "Jawa" },
              { code: "mad", label: "Madura" },
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-colors ${lang === l.code ? activeBtn : inactiveBtn}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vibrate */}
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={15} className={iconColor} />
              <div>
                <div className="font-extrabold text-sm">Indikator Getar</div>
                <div className={`text-xs ${muted} mt-0.5`}>Getar saat guru mulai berbicara</div>
              </div>
            </div>
            <Toggle val={vibrate} onChange={() => setVibrate(v => !v)} />
          </div>
        </div>

        {/* Profile */}
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full ${hc ? "bg-blue-900" : "bg-blue-100"} flex items-center justify-center shrink-0`}>
              <User size={22} className={iconColor} />
            </div>
            <div>
              <div className="font-extrabold">Budi Santoso</div>
              <div className={`text-xs ${muted}`}>Siswa · XII IPA 3 · SMAN 1 Surabaya</div>
            </div>
          </div>
          <button className={`w-full py-2.5 rounded-xl text-sm font-extrabold ${hc ? "bg-red-900/40 text-red-400" : "bg-red-50 text-red-600"}`}>
            Keluar dari Akun
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Teacher Home ─────────────────────────────────────────────────────────────

function TeacherHome({ hc, setTab }: { hc: boolean; setTab: (t: Tab) => void }) {
  const bg = hc ? "bg-slate-900 text-white" : "bg-[#F0F7FF] text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";
  const muted = hc ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`h-full overflow-y-auto ${bg} pb-4`}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <div>
          <p className={`text-xs font-bold ${muted}`}>Pengajar</p>
          <h1 className="text-xl font-black mt-0.5">Bu Sari Dewi</h1>
        </div>
        <button className={`w-10 h-10 rounded-full ${hc ? "bg-slate-700" : "bg-white"} flex items-center justify-center shadow-sm`}>
          <Bell size={17} className={muted} />
        </button>
      </div>

      {/* CTA */}
      <div className="px-5 pt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setTab("live")}
          className="w-full rounded-2xl bg-gradient-to-br from-blue-900 to-blue-800 p-5 flex items-center gap-4 relative overflow-hidden text-left"
        >
          <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Mic size={28} className="text-white" />
          </div>
          <div className="relative">
            <div className="text-white font-black text-lg">Mulai Sesi Baru</div>
            <div className="text-blue-300 text-sm mt-0.5">Transkripsi real-time untuk siswa</div>
          </div>
        </motion.button>
      </div>

      {/* Classes */}
      <div className="px-5 pt-4">
        <h2 className="font-extrabold text-base mb-3">Kelas Saya</h2>
        <div className="flex flex-col gap-2.5">
          {[
            { name: "XII IPA 3", subject: "Biologi", students: 28, active: true },
            { name: "XI IPA 1", subject: "Biologi", students: 30, active: false },
            { name: "X IPS 2", subject: "Biologi Dasar", students: 32, active: false },
          ].map((cls, i) => (
            <div key={i} className={`rounded-xl border p-3.5 flex items-center gap-3 ${card}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hc ? "bg-blue-900" : "bg-blue-50"}`}>
                <GraduationCap size={17} className={hc ? "text-blue-300" : "text-blue-700"} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{cls.name} — {cls.subject}</div>
                <div className={`text-xs ${muted} mt-0.5`}>{cls.students} siswa terdaftar</div>
              </div>
              {cls.active && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-red-400 text-[10px] font-black">LIVE</span>
                </div>
              )}
              <ChevronRight size={14} className={muted} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div className="px-5 pt-4">
        <h2 className="font-extrabold text-base mb-3">Sesi Terbaru</h2>
        <div className="flex flex-col gap-2">
          {HISTORY_DATA.slice(0, 3).map(item => (
            <div key={item.id} className={`rounded-xl border p-3 flex items-center gap-3 ${card}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${hc ? "bg-slate-700" : "bg-slate-50"}`}>
                <span className={`text-xs font-black ${muted}`}>#{item.id}</span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{item.subject}</div>
                <div className={`text-xs ${muted}`}>{item.date}</div>
              </div>
              <span className={`text-xs font-bold ${hc ? "text-blue-400" : "text-blue-800"}`}>{item.words.toLocaleString()} kata</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Teacher Session ──────────────────────────────────────────────────────────

function TeacherSessionScreen({ hc }: { hc: boolean }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const bg = hc ? "bg-slate-900 text-white" : "bg-[#F0F7FF] text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";
  const muted = hc ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`h-full overflow-y-auto ${bg} pb-4`}>
      <div className="px-5 pt-3 pb-2">
        <h1 className="text-xl font-black">Kelola Sesi</h1>
        <p className={`text-sm ${muted} mt-0.5`}>Biologi — XII IPA 3</p>
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center py-6 gap-4">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => { setRecording(r => !r); if (!recording) setElapsed(0); }}
          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-colors ${
            recording ? "bg-red-500 shadow-red-500/40" : hc ? "bg-blue-800" : "bg-blue-900"
          }`}
        >
          <motion.div animate={recording ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}>
            {recording ? <Square size={30} className="text-white" /> : <Mic size={30} className="text-white" />}
          </motion.div>
          <span className="text-white text-xs font-black">{recording ? "STOP" : "MULAI"}</span>
        </motion.button>

        {recording ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className={`font-mono font-black text-xl ${hc ? "text-white" : "text-slate-800"}`}>{fmt(elapsed)}</span>
            </div>
            <p className={`text-xs ${muted}`}>Sesi sedang berjalan · 8 siswa terhubung</p>
          </div>
        ) : (
          <p className={`text-sm ${muted} text-center max-w-[200px]`}>Tekan untuk mulai merekam dan mentranskripsi suara</p>
        )}
      </div>

      <div className="px-5 flex flex-col gap-3">
        {/* Participants */}
        <div className={`rounded-xl border p-4 flex items-center justify-between ${card}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${hc ? "bg-blue-900" : "bg-blue-50"} flex items-center justify-center`}>
              <Users size={17} className={hc ? "text-blue-300" : "text-blue-700"} />
            </div>
            <div>
              <div className="font-extrabold text-sm">Peserta Bergabung</div>
              <div className={`text-xs ${muted}`}>dari 28 siswa terdaftar</div>
            </div>
          </div>
          <div className={`text-3xl font-black ${hc ? "text-blue-400" : "text-blue-900"}`}>8</div>
        </div>

        {/* Join code */}
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className="font-extrabold text-sm mb-3">Kode Bergabung</div>
          <div className="flex items-center gap-4">
            {/* Mini QR */}
            <div className={`w-16 h-16 rounded-xl ${hc ? "bg-slate-700" : "bg-slate-100"} flex items-center justify-center shrink-0`}>
              <div className="grid grid-cols-4 gap-0.5">
                {[1,1,0,1, 0,1,1,0, 1,0,1,1, 0,1,0,1].map((b, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${b ? (hc ? "bg-white" : "bg-slate-800") : (hc ? "bg-slate-600" : "bg-slate-200")}`} />
                ))}
              </div>
            </div>
            <div>
              <div className={`font-mono font-black text-2xl tracking-widest ${hc ? "text-white" : "text-slate-800"}`}>
                BIO-4821
              </div>
              <div className={`text-xs ${muted} mt-1`}>Bagikan ke siswa untuk bergabung</div>
            </div>
          </div>
        </div>

        {/* Participant list */}
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className="font-extrabold text-sm mb-2">Siswa Online</div>
          <div className="flex flex-wrap gap-2">
            {["Andi", "Siti", "Budi", "Rina", "Doni", "Maya", "Heri", "Lina"].map((name, i) => (
              <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${hc ? "bg-slate-700 text-slate-200" : "bg-blue-50 text-blue-800"}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

interface NavItem { id: Tab; icon: (active: boolean) => React.ReactNode; label: string; }

const STUDENT_NAV: NavItem[] = [
  { id: "home", label: "Beranda", icon: () => <Home size={20} /> },
  { id: "live", label: "Live", icon: () => <Radio size={20} /> },
  { id: "history", label: "Riwayat", icon: () => <BookOpen size={20} /> },
  { id: "settings", label: "Atur", icon: () => <Settings size={20} /> },
];

const TEACHER_NAV: NavItem[] = [
  { id: "home", label: "Beranda", icon: () => <Home size={20} /> },
  { id: "live", label: "Sesi", icon: () => <Mic size={20} /> },
  { id: "settings", label: "Pengaturan", icon: () => <Settings size={20} /> },
];

function BottomNav({ tab, setTab, role, hc }: { tab: Tab; setTab: (t: Tab) => void; role: Role; hc: boolean }) {
  const items = role === "student" ? STUDENT_NAV : TEACHER_NAV;
  const navBg = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const active = hc ? "text-blue-400" : "text-blue-900";
  const inactive = hc ? "text-slate-500" : "text-slate-400";

  return (
    <div className={`shrink-0 border-t ${navBg} px-2 pt-2 pb-4`}>
      <div className="flex items-center justify-around">
        {items.map(item => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors relative ${isActive ? active : inactive}`}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className={`absolute inset-0 rounded-xl ${hc ? "bg-blue-900/50" : "bg-blue-50"}`}
                />
              )}
              <span className="relative">{item.icon(isActive)}</span>
              <span className={`text-[10px] font-extrabold relative ${isActive ? active : inactive}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [slide, setSlide] = useState(0);
  const [role, setRole] = useState<Role>("student");
  const [tab, setTab] = useState<Tab>("home");
  const [hc, setHc] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("normal");
  const [lang, setLang] = useState("id");

  function handleRole(r: Role) { setRole(r); setScreen("login"); }
  function handleLogin() { setTab("home"); setScreen("main"); }

  function renderTab() {
    if (role === "student") {
      switch (tab) {
        case "home": return <StudentHome hc={hc} setTab={setTab} />;
        case "live": return <LiveScreen hc={hc} fontSize={fontSize} lang={lang} />;
        case "history": return <HistoryScreen hc={hc} />;
        case "settings": return <SettingsScreen hc={hc} setHc={setHc} fontSize={fontSize} setFontSize={setFontSize} lang={lang} setLang={setLang} />;
      }
    } else {
      switch (tab) {
        case "home": return <TeacherHome hc={hc} setTab={setTab} />;
        case "live": return <TeacherSessionScreen hc={hc} />;
        case "settings": return <SettingsScreen hc={hc} setHc={setHc} fontSize={fontSize} setFontSize={setFontSize} lang={lang} setLang={setLang} />;
      }
    }
    return null;
  }

  function renderScreen() {
    switch (screen) {
      case "onboarding":
        return <OnboardingScreen slide={slide} setSlide={setSlide} onDone={() => setScreen("roleSelect")} />;
      case "roleSelect":
        return <RoleSelectScreen onSelect={handleRole} />;
      case "login":
        return <LoginScreen role={role} onLogin={handleLogin} hc={hc} />;
      case "main":
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-0"
                >
                  {renderTab()}
                </motion.div>
              </AnimatePresence>
            </div>
            <BottomNav tab={tab} setTab={setTab} role={role} hc={hc} />
          </div>
        );
    }
  }

  const phoneBg = hc ? "#0F172A" : "#F0F7FF";
  const phoneText = hc ? "#F8FAFC" : "#0F172A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Demo switcher */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-50">
        <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Demo Mode</div>
        <button
          onClick={() => { setRole("student"); setScreen("main"); setTab("home"); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${role === "student" && screen === "main" ? "bg-white text-slate-900" : "bg-white/15 text-white"}`}
        >
          👨‍🎓 Tampilan Siswa
        </button>
        <button
          onClick={() => { setRole("teacher"); setScreen("main"); setTab("home"); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${role === "teacher" && screen === "main" ? "bg-white text-slate-900" : "bg-white/15 text-white"}`}
        >
          👩‍🏫 Tampilan Guru
        </button>
        <button
          onClick={() => { setSlide(0); setScreen("onboarding"); }}
          className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-white/10 text-white/60"
        >
          ↩ Onboarding
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-50 text-right">
        <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Legenda</div>
        <div className="text-white/50 text-[10px] leading-relaxed max-w-[160px]">
          Kata kunci otomatis <span className="bg-amber-400/30 text-amber-300 px-1 rounded">disorot</span> di layar transkripsi
        </div>
        <div className="text-white/50 text-[10px] leading-relaxed">
          Indikator gerak = sedang berbicara
        </div>
      </div>

      {/* Phone frame */}
      <div className="relative select-none" style={{ width: 390, height: 844 }}>
        {/* Bezel */}
        <div className="absolute inset-0 rounded-[50px] bg-zinc-900 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-[1px] rounded-[49px] bg-zinc-800" />
          {/* Buttons */}
          <div className="absolute -right-[5px] top-32 w-[5px] h-16 bg-zinc-700 rounded-r-sm" />
          <div className="absolute -left-[5px] top-28 w-[5px] h-10 bg-zinc-700 rounded-l-sm" />
          <div className="absolute -left-[5px] top-44 w-[5px] h-14 bg-zinc-700 rounded-l-sm" />
          <div className="absolute -left-[5px] top-64 w-[5px] h-14 bg-zinc-700 rounded-l-sm" />
        </div>

        {/* Screen */}
        <div
          className="absolute rounded-[42px] overflow-hidden flex flex-col"
          style={{
            inset: 10,
            backgroundColor: phoneBg,
            color: phoneText,
          }}
        >
          {/* Punch-hole */}
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[11px] h-[11px] rounded-full bg-zinc-900 z-30" />

          {/* Status bar */}
          <StatusBar hc={hc} />

          {/* Screen content */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen + (screen === "main" ? "" : "")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="absolute inset-0 flex flex-col"
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="absolute bottom-3 left-0 right-0 text-center text-white/25 text-[11px] font-bold">
        SignSpeak — Prototype UI/UX · Aksesibilitas untuk Siswa Tunarungu di Ruang Kelas Indonesia
      </p>
    </div>
  );
}
