import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/SessionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Bell, ArrowRight, BookOpen, Mic, GraduationCap, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

// Demo data
const HISTORY_DATA = [
  { id: 1, subject: "Biologi", kelas: "XII IPA 3", teacher: "Bu Sari Dewi", date: "Hari ini, 08:00", duration: "45 mnt", words: 1240, excerpt: "...fotosintesis terjadi di dalam kloroplas pada sel tumbuhan..." },
  { id: 2, subject: "Matematika", kelas: "XII IPA 3", teacher: "Pak Budi Santoso", date: "Kemarin, 10:00", duration: "50 mnt", words: 980, excerpt: "...turunan fungsi trigonometri dan aplikasi integral..." },
  { id: 3, subject: "Fisika", kelas: "XII IPA 3", teacher: "Pak Ahmad Rizki", date: "Senin, 11:00", duration: "45 mnt", words: 1100, excerpt: "...hukum Newton tentang gerak, gaya, dan percepatan..." },
];

function PulseDot() {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true
    ),
  }));
  return <Animated.View style={animatedStyle} className="w-2.5 h-2.5 rounded-full bg-red-400" />;
}

export default function HomeScreen() {
  const { role } = useAuth();
  const { startSession } = useSession();
  const { settings } = useSettings();
  const router = useRouter();
  
  const hc = settings.highContrast;
  const bg = hc ? "bg-slate-900" : "bg-[#F0F7FF]";
  const textMain = hc ? "text-white" : "text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const iconBg = hc ? "bg-blue-800" : "bg-blue-50";
  const iconColor = hc ? "#93c5fd" : "#1d4ed8"; // text-blue-300 : text-blue-700
  const linkColor = hc ? "text-blue-400" : "text-blue-800";

  const StudentHome = () => (
    <ScrollView className={`flex-1 ${bg} pt-4 pb-10`}>
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className={`text-xs font-bold ${muted}`}>Selamat Pagi 👋</Text>
          <Text className={`text-xl font-black mt-0.5 ${textMain}`}>Budi Santoso</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} className={`w-10 h-10 rounded-full ${hc ? "bg-slate-700" : "bg-white"} items-center justify-center shadow-sm shadow-black/5`}>
          <Bell size={17} color={hc ? "#94a3b8" : "#64748b"} />
        </TouchableOpacity>
      </View>

      {/* Active session */}
      <View className="px-5 pt-2">
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/live')}>
          <LinearGradient colors={['#1e3a8a', '#1e40af']} className="rounded-2xl p-5 overflow-hidden">
            <View className="absolute right-0 top-0 w-36 h-36 rounded-full bg-white/5 -translate-y-12 translate-x-12" />
            <View className="flex-row items-center gap-2 mb-2">
              <PulseDot />
              <Text className="text-red-300 text-xs font-black uppercase tracking-widest">Sesi Aktif</Text>
            </View>
            <Text className="text-white font-black text-lg">Biologi — XII IPA 3</Text>
            <Text className="text-blue-300 text-sm mt-1">Bu Sari Dewi • Sedang berlangsung</Text>
            <View className="mt-4 self-start flex-row items-center gap-1.5 bg-white px-4 py-2 rounded-xl">
              <Text className="text-blue-900 text-sm font-extrabold">Gabung Sekarang</Text>
              <ArrowRight size={14} color="#1e3a8a" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View className="px-5 pt-4 flex-row justify-between gap-3">
        <View className={`flex-1 rounded-xl border p-3.5 ${card}`}>
          <Text className={`text-xs font-bold ${muted}`}>Total Sesi</Text>
          <Text className={`text-2xl font-black mt-1 ${textMain}`}>24</Text>
          <Text className={`text-xs ${muted} mt-0.5`}>bulan ini</Text>
        </View>
        <View className={`flex-1 rounded-xl border p-3.5 ${card}`}>
          <Text className={`text-xs font-bold ${muted}`}>Kata Ditranskripsi</Text>
          <Text className={`text-2xl font-black mt-1 ${textMain}`}>18.4K</Text>
          <Text className={`text-xs ${muted} mt-0.5`}>total keseluruhan</Text>
        </View>
      </View>

      {/* Recent history */}
      <View className="px-5 pt-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className={`font-extrabold text-base ${textMain}`}>Riwayat Terbaru</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')} activeOpacity={0.7}>
            <Text className={`text-sm font-bold ${linkColor}`}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        <View className="gap-2.5">
          {HISTORY_DATA.slice(0, 3).map(item => (
            <View key={item.id} className={`rounded-xl border p-3.5 flex-row gap-3 ${card}`}>
              <View className={`w-10 h-10 rounded-xl ${iconBg} items-center justify-center`}>
                <BookOpen size={17} color={iconColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-bold text-sm ${textMain}`}>{item.subject}</Text>
                <Text className={`text-xs ${muted} mt-0.5`}>{item.date} · {item.duration}</Text>
                <Text className={`text-xs ${muted} mt-1 italic`} numberOfLines={1}>{item.excerpt}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const TeacherHome = () => (
    <ScrollView className={`flex-1 ${bg} pt-4 pb-10`}>
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className={`text-xs font-bold ${muted}`}>Pengajar</Text>
          <Text className={`text-xl font-black mt-0.5 ${textMain}`}>Bu Sari Dewi</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} className={`w-10 h-10 rounded-full ${hc ? "bg-slate-700" : "bg-white"} items-center justify-center shadow-sm shadow-black/5`}>
          <Bell size={17} color={hc ? "#94a3b8" : "#64748b"} />
        </TouchableOpacity>
      </View>

      {/* CTA */}
      <View className="px-5 pt-2">
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => {
            startSession('Biologi', 'XII IPA 3', settings.language);
            router.push('/(tabs)/live');
          }}
        >
          <LinearGradient colors={['#1e3a8a', '#1e40af']} className="rounded-2xl p-5 flex-row items-center gap-4 overflow-hidden">
            <View className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
            <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center">
              <Mic size={28} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">Mulai Sesi Baru</Text>
              <Text className="text-blue-300 text-sm mt-0.5">Transkripsi real-time untuk siswa</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Classes */}
      <View className="px-5 pt-4">
        <Text className={`font-extrabold text-base mb-3 ${textMain}`}>Kelas Saya</Text>
        <View className="gap-2.5">
          {[
            { name: "XII IPA 3", subject: "Biologi", students: 28, active: true },
            { name: "XI IPA 1", subject: "Biologi", students: 30, active: false },
            { name: "X IPS 2", subject: "Biologi Dasar", students: 32, active: false },
          ].map((cls, i) => (
            <View key={i} className={`rounded-xl border p-3.5 flex-row items-center gap-3 ${card}`}>
              <View className={`w-10 h-10 rounded-xl items-center justify-center ${hc ? "bg-blue-900" : "bg-blue-50"}`}>
                <GraduationCap size={17} color={hc ? "#93c5fd" : "#1d4ed8"} />
              </View>
              <View className="flex-1">
                <Text className={`font-bold text-sm ${textMain}`}>{cls.name} — {cls.subject}</Text>
                <Text className={`text-xs ${muted} mt-0.5`}>{cls.students} siswa terdaftar</Text>
              </View>
              {cls.active && (
                <View className="flex-row items-center gap-1 mr-2">
                  <PulseDot />
                  <Text className="text-red-400 text-[10px] font-black tracking-wider">LIVE</Text>
                </View>
              )}
              <ChevronRight size={16} color={hc ? "#64748b" : "#94a3b8"} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent */}
      <View className="px-5 pt-4">
        <Text className={`font-extrabold text-base mb-3 ${textMain}`}>Sesi Terbaru</Text>
        <View className="gap-2">
          {HISTORY_DATA.slice(0, 3).map(item => (
            <View key={item.id} className={`rounded-xl border p-3 flex-row items-center gap-3 ${card}`}>
              <View className={`w-9 h-9 rounded-xl items-center justify-center ${hc ? "bg-slate-700" : "bg-slate-50"}`}>
                <Text className={`text-xs font-black ${muted}`}>#{item.id}</Text>
              </View>
              <View className="flex-1">
                <Text className={`font-bold text-sm ${textMain}`}>{item.subject}</Text>
                <Text className={`text-xs ${muted} mt-0.5`}>{item.date}</Text>
              </View>
              <Text className={`text-xs font-bold ${linkColor}`}>{item.words.toLocaleString()} kata</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className={`flex-1 ${bg}`}>
      {role === 'teacher' ? <TeacherHome /> : <StudentHome />}
    </SafeAreaView>
  );
}
