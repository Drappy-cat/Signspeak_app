import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/SessionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Bell, ArrowRight, BookOpen, Mic, GraduationCap, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing } from 'react-native';

// Demo data
const HISTORY_DATA = [
  { id: 1, subject: "Biologi", kelas: "XII IPA 3", teacher: "Bu Sari Dewi", date: "Hari ini, 08:00", duration: "45 mnt", words: 1240, excerpt: "...fotosintesis terjadi di dalam kloroplas pada sel tumbuhan..." },
  { id: 2, subject: "Matematika", kelas: "XII IPA 3", teacher: "Pak Budi Santoso", date: "Kemarin, 10:00", duration: "50 mnt", words: 980, excerpt: "...turunan fungsi trigonometri dan aplikasi integral..." },
  { id: 3, subject: "Fisika", kelas: "XII IPA 3", teacher: "Pak Ahmad Rizki", date: "Senin, 11:00", duration: "45 mnt", words: 1100, excerpt: "...hukum Newton tentang gerak, gaya, dan percepatan..." },
];

function PulseDot() {
  const anim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0.4, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
      ])
    ).start();
  }, []);
  return <Animated.View style={{ opacity: anim }} className="w-2.5 h-2.5 rounded-full bg-red-400" />;
}

export default function HomeScreen() {
  const { role } = useAuth();
  const { startSession } = useSession();
  const { settings } = useSettings();
  const router = useRouter();
  
  const hc = settings.highContrast;
  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textMain = hc ? "text-white" : "text-slate-900";
  // Use inline styles for shadow to avoid NativeWind issues on web
  const cardStyle = hc
    ? { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 12 }
    : { backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderWidth: 1, borderRadius: 12, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 };
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const iconBg = hc ? "bg-blue-800" : "bg-blue-50";
  const iconColor = hc ? "#93c5fd" : "#1d4ed8";
  const linkColor = hc ? "text-blue-400" : "text-blue-800";
  const bellBg = hc ? "#1e293b" : "#ffffff";

  const StudentHome = () => (
    <View className="pb-10">
      {/* Header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className={`text-xs font-bold ${muted}`}>Selamat Pagi 👋</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', marginTop: 2, color: hc ? '#f8fafc' : '#0f172a' }}>Budi Santoso</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: bellBg,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
          }}
        >
          <Bell size={17} color={hc ? "#94a3b8" : "#64748b"} />
        </TouchableOpacity>
      </View>

      {/* Active session card */}
      <View className="px-5 pt-2">
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/live')}>
          <LinearGradient
            colors={['#1e3a8a', '#1e40af']}
            style={{ borderRadius: 16, padding: 20, overflow: 'hidden', position: 'relative' }}
          >
            {/* Decorative circle */}
            <View style={{
              position: 'absolute', right: 0, top: 0,
              width: 144, height: 144, borderRadius: 72,
              backgroundColor: 'rgba(255,255,255,0.05)',
              transform: [{ translateY: -48 }, { translateX: 48 }],
            }} />
            <View style={{ position: 'relative' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <PulseDot />
                <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>Sesi Aktif</Text>
              </View>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 18, lineHeight: 24 }}>Biologi — XII IPA 3</Text>
              <Text style={{ color: '#93c5fd', fontSize: 14, marginTop: 4 }}>Bu Sari Dewi • Sedang berlangsung</Text>
              <View style={{
                marginTop: 16, alignSelf: 'flex-start',
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
              }}>
                <Text style={{ color: '#1e3a8a', fontSize: 14, fontWeight: '800' }}>Gabung Sekarang</Text>
                <ArrowRight size={14} color="#1e3a8a" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, flexDirection: 'row', gap: 12 }}>
        <View style={[{ flex: 1, padding: 14 }, cardStyle]}>
          <Text className={`text-xs font-bold ${muted}`}>Total Sesi</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', marginTop: 4, color: hc ? '#f8fafc' : '#0f172a' }}>24</Text>
          <Text className={`text-xs ${muted} mt-0.5`}>bulan ini</Text>
        </View>
        <View style={[{ flex: 1, padding: 14 }, cardStyle]}>
          <Text className={`text-xs font-bold ${muted}`}>Kata Ditranskripsi</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', marginTop: 4, color: hc ? '#f8fafc' : '#0f172a' }}>18.4K</Text>
          <Text className={`text-xs ${muted} mt-0.5`}>total keseluruhan</Text>
        </View>
      </View>

      {/* Recent history */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontWeight: '800', fontSize: 15, color: hc ? '#f8fafc' : '#0f172a' }}>Riwayat Terbaru</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')} activeOpacity={0.7}>
            <Text className={`text-sm font-bold ${linkColor}`}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        <View style={{ gap: 10 }}>
          {HISTORY_DATA.slice(0, 3).map(item => (
            <View key={item.id} style={[{ flexDirection: 'row', gap: 12, padding: 14 }, cardStyle]}>
              <View style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: hc ? '#1e3a8a' : '#eff6ff',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <BookOpen size={17} color={iconColor} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: hc ? '#f8fafc' : '#0f172a' }}>{item.subject}</Text>
                <Text className={`text-xs ${muted} mt-0.5`}>{item.date} · {item.duration}</Text>
                <Text className={`text-xs ${muted} mt-1`} numberOfLines={1} style={{ fontStyle: 'italic' }}>{item.excerpt}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const TeacherHome = () => (
    <View className="pb-10">
      {/* Header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className={`text-xs font-bold ${muted}`}>Pengajar</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', marginTop: 2, color: hc ? '#f8fafc' : '#0f172a' }}>Bu Sari Dewi</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: bellBg,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
          }}
        >
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
          <LinearGradient
            colors={['#1e3a8a', '#1e40af']}
            style={{ borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'hidden', position: 'relative' }}
          >
            <View style={{
              position: 'absolute', right: 0, top: 0,
              width: 128, height: 128, borderRadius: 64,
              backgroundColor: 'rgba(255,255,255,0.05)',
              transform: [{ translateY: -42 }, { translateX: 42 }],
            }} />
            <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mic size={28} color="#ffffff" />
            </View>
            <View style={{ flex: 1, position: 'relative' }}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 18 }}>Mulai Sesi Baru</Text>
              <Text style={{ color: '#93c5fd', fontSize: 14, marginTop: 2 }}>Transkripsi real-time untuk siswa</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Classes */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ fontWeight: '800', fontSize: 15, marginBottom: 12, color: hc ? '#f8fafc' : '#0f172a' }}>Kelas Saya</Text>
        <View style={{ gap: 10 }}>
          {[
            { name: "XII IPA 3", subject: "Biologi", students: 28, active: true },
            { name: "XI IPA 1", subject: "Biologi", students: 30, active: false },
            { name: "X IPS 2", subject: "Biologi Dasar", students: 32, active: false },
          ].map((cls, i) => (
            <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }, cardStyle]}>
              <View style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: hc ? '#1e3a8a' : '#eff6ff',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <GraduationCap size={17} color={hc ? "#93c5fd" : "#1d4ed8"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: hc ? '#f8fafc' : '#0f172a' }}>{cls.name} — {cls.subject}</Text>
                <Text className={`text-xs ${muted} mt-0.5`}>{cls.students} siswa terdaftar</Text>
              </View>
              {cls.active && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 }}>
                  <PulseDot />
                  <Text style={{ color: '#f87171', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>LIVE</Text>
                </View>
              )}
              <ChevronRight size={16} color={hc ? "#64748b" : "#94a3b8"} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ fontWeight: '800', fontSize: 15, marginBottom: 12, color: hc ? '#f8fafc' : '#0f172a' }}>Sesi Terbaru</Text>
        <View style={{ gap: 8 }}>
          {HISTORY_DATA.slice(0, 3).map(item => (
            <View key={item.id} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }, cardStyle]}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: hc ? '#334155' : '#f8fafc',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Text className={`text-xs font-black ${muted}`}>#{item.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: hc ? '#f8fafc' : '#0f172a' }}>{item.subject}</Text>
                <Text className={`text-xs ${muted} mt-0.5`}>{item.date}</Text>
              </View>
              <Text className={`text-xs font-bold ${linkColor}`}>{item.words.toLocaleString()} kata</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Decorative ambient bg */}
      {Platform.OS === 'web' ? (
        <View style={{
          position: 'absolute', top: 0, right: 0,
          width: 256, height: 256, borderRadius: 128,
          backgroundColor: hc ? 'rgba(37,99,235,0.1)' : 'rgba(96,165,250,0.08)',
          transform: [{ translateY: -128 }, { translateX: 85 }],
          pointerEvents: 'none',
        } as any} />
      ) : (
        <View style={{
          position: 'absolute', top: -100, right: -50,
          width: 256, height: 256, borderRadius: 128,
          backgroundColor: hc ? 'rgba(37,99,235,0.1)' : 'rgba(96,165,250,0.1)',
          pointerEvents: 'none',
        } as any} />
      )}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {role === 'teacher' ? <TeacherHome /> : <StudentHome />}
      </ScrollView>
    </SafeAreaView>
  );
}
