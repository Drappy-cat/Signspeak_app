import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView, StatusBar as RNStatusBar, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/SessionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Bell, ArrowRight, BookOpen, Mic, GraduationCap, ChevronRight, Globe, X, Check, Plus, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing } from 'react-native';
import { LANGUAGE_LABELS } from '../../constants/keywords';
import { DICT } from '../../constants/i18n';
import { getCardShadow } from '../../utils/formatters';

// Demo data
const HISTORY_DATA = [
  { id: 1, subject: "Biologi", kelas: "XII IPA 3", teacher: "Bu Sari Dewi", date: "Hari ini, 08:00", duration: "45 mnt", words: 1240, excerpt: "...fotosintesis terjadi di dalam kloroplas pada sel tumbuhan..." },
  { id: 2, subject: "Matematika", kelas: "XII IPA 3", teacher: "Pak Budi Santoso", date: "Kemarin, 10:00", duration: "50 mnt", words: 980, excerpt: "...turunan fungsi trigonometri dan aplikasi integral..." },
  { id: 3, subject: "Fisika", kelas: "XII IPA 3", teacher: "Pak Ahmad Rizki", date: "Senin, 11:00", duration: "45 mnt", words: 1100, excerpt: "...hukum Newton tentang gerak, gaya, dan percepatan..." },
];

const getGreeting = (lang: string) => {
  const hour = new Date().getHours();
  if (lang === 'en') {
    if (hour < 12) return 'Good Morning,';
    if (hour < 15) return 'Good Afternoon,';
    if (hour < 18) return 'Good Evening,';
    return 'Good Night,';
  } else {
    if (hour < 11) return 'Selamat Pagi,';
    if (hour < 15) return 'Selamat Siang,';
    if (hour < 18) return 'Selamat Sore,';
    return 'Selamat Malam,';
  }
};

function PulseDot() {
  const anim = React.useMemo(() => new Animated.Value(0.4), []);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);
  return <Animated.View style={{ opacity: anim }} className="w-2.5 h-2.5 rounded-full bg-red-400" />;
}

export default function HomeScreen() {
  const { role, user } = useAuth();
  const { startSession } = useSession();
  const { settings } = useSettings();
  const router = useRouter();
  
  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textMain = hc ? "text-white" : "text-slate-900";
  
  const cardStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    ...getCardShadow(hc, 'md'),
  };
  
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const iconBg = hc ? "bg-blue-800" : "bg-blue-50";
  const iconColor = hc ? "#93c5fd" : "#1d4ed8";
  const linkColor = hc ? "text-blue-400" : "text-blue-800";
  const bellBg = hc ? "#1e293b" : "#ffffff";

  const textColorVal = hc ? '#f8fafc' : '#0f172a';
  const mutedColorVal = hc ? '#94a3b8' : '#64748b';

  const [selectedLang, setSelectedLang] = React.useState(settings.language || 'id');
  const [startModalVisible, setStartModalVisible] = React.useState(false);
  const [selectedSubject, setSelectedSubject] = React.useState('Biologi');
  const [selectedClass, setSelectedClass] = React.useState('XII IPA 3');
  const [customGlossaryList, setCustomGlossaryList] = React.useState<Array<{ word: string; definition: string }>>([]);
  const [newWord, setNewWord] = React.useState('');
  const [newDefinition, setNewDefinition] = React.useState('');

  const SUBJECTS = ['Biologi', 'Fisika', 'Kimia', 'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris'];
  const CLASSES = ['X IPA 1', 'XI IPA 2', 'XII IPA 3', 'X IPS 1', 'XI IPS 2', 'XII IPS 3'];

  const renderStudentHome = () => (
    <View className="pb-10">
      {/* Header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text className={`text-xs font-bold ${muted}`}>{getGreeting(appLang)}</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', marginTop: 2, color: hc ? '#f8fafc' : '#0f172a' }}>
            {user?.name || 'Budi Santoso'}
          </Text>
          {(user?.className || user?.school) && (
            <Text className={`text-xs ${muted} mt-0.5`} numberOfLines={1}>
              {[user.className, user.school].filter(Boolean).join(' • ')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/notifications')}
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
                <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>{d.activeSession}</Text>
              </View>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 18, lineHeight: 24 }}>Biologi — XII IPA 3</Text>
              <Text style={{ color: '#93c5fd', fontSize: 14, marginTop: 4 }}>Bu Sari Dewi • {appLang === 'en' ? 'In progress' : 'Sedang berlangsung'}</Text>
              <View style={{
                marginTop: 16, alignSelf: 'flex-start',
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
              }}>
                <Text style={{ color: '#1e3a8a', fontSize: 14, fontWeight: '800' }}>{d.joinNow}</Text>
                <ArrowRight size={14} color="#1e3a8a" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, flexDirection: 'row', gap: 12 }}>
        <View style={[{ flex: 1, padding: 14 }, cardStyle]}>
          <Text className={`text-xs font-bold ${muted}`}>{appLang === 'en' ? 'Total Sessions' : 'Total Sesi'}</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', marginTop: 4, color: hc ? '#f8fafc' : '#0f172a' }}>24</Text>
          <Text className={`text-xs ${muted} mt-0.5`}>{appLang === 'en' ? 'this month' : 'bulan ini'}</Text>
        </View>
        <View style={[{ flex: 1, padding: 14 }, cardStyle]}>
          <Text className={`text-xs font-bold ${muted}`}>{appLang === 'en' ? 'Words Transcribed' : 'Kata Ditranskripsi'}</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', marginTop: 4, color: hc ? '#f8fafc' : '#0f172a' }}>18.4K</Text>
          <Text className={`text-xs ${muted} mt-0.5`}>{appLang === 'en' ? 'overall total' : 'total keseluruhan'}</Text>
        </View>
      </View>

      {/* Recent history */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontWeight: '800', fontSize: 15, color: hc ? '#f8fafc' : '#0f172a' }}>{d.recentHistory}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')} activeOpacity={0.7}>
            <Text className={`text-sm font-bold ${linkColor}`}>{d.seeAll}</Text>
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

  const renderTeacherHome = () => (
    <View className="pb-10">
      {/* Header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text className={`text-xs font-bold ${muted}`}>{getGreeting(appLang)}</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', marginTop: 2, color: hc ? '#f8fafc' : '#0f172a' }}>
            {user?.name || 'Bu Sari Dewi'}
          </Text>
          {user?.school && (
            <Text className={`text-xs ${muted} mt-0.5`} numberOfLines={1}>
              {user.school}
            </Text>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/notifications')}
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

      {/* Language Selector */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <View style={[{ padding: 14 }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Globe size={13} color={hc ? '#60a5fa' : '#1e40af'} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: hc ? '#f8fafc' : '#0f172a' }}>{d.transcriptionLang}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
              <TouchableOpacity
                key={code}
                activeOpacity={0.7}
                onPress={() => setSelectedLang(code)}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                  backgroundColor: selectedLang === code ? '#1e3a8a' : hc ? '#334155' : '#f1f5f9',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: selectedLang === code ? '#fff' : hc ? '#cbd5e1' : '#475569' }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedLang === 'mad' && (
            <Text style={{ fontSize: 10, color: hc ? '#f59e0b' : '#d97706', marginTop: 6, textAlign: 'center' }}>
              {appLang === 'en' ? '⚠️ Madurese uses Indonesian engine' : '⚠️ Madura menggunakan engine Bahasa Indonesia'}
            </Text>
          )}
        </View>
      </View>

      {/* CTA - Start Session */}
      <View className="px-5 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setCustomGlossaryList([]);
            setStartModalVisible(true);
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
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 18 }}>{d.startSession}</Text>
              <Text style={{ color: '#93c5fd', fontSize: 13, marginTop: 2 }}>
                {appLang === 'en' ? 'Transcribe in ' : 'Transkripsi dalam Bahasa '} {LANGUAGE_LABELS[selectedLang]}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Classes */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ fontWeight: '800', fontSize: 15, marginBottom: 12, color: hc ? '#f8fafc' : '#0f172a' }}>{d.myClasses}</Text>
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
                <Text className={`text-xs ${muted} mt-0.5`}>{cls.students} {appLang === 'en' ? 'students registered' : 'siswa terdaftar'}</Text>
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
        <Text style={{ fontWeight: '800', fontSize: 15, marginBottom: 12, color: hc ? '#f8fafc' : '#0f172a' }}>{d.recentSessions}</Text>
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
              <Text className={`text-xs font-bold ${linkColor}`}>{item.words.toLocaleString()} {appLang === 'en' ? 'words' : 'kata'}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
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
        {role === 'teacher' ? renderTeacherHome() : renderStudentHome()}
      </ScrollView>

      {/* Configure Live Session Modal (Inline View constrained to App Boundaries) */}
      {startModalVisible && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', // Glassmorphic translucent dark background
          justifyContent: 'flex-end',
          zIndex: 1000,
        }}>
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setStartModalVisible(false)} 
            style={{ flex: 1 }} 
          />
          
          <View style={{
            backgroundColor: hc ? '#1e293b' : '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: Platform.OS === 'ios' ? 44 : 32,
            ...getCardShadow(hc, 'lg'),
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Mic size={20} color={hc ? '#60a5fa' : '#1e40af'} />
                <Text style={{ fontSize: 18, fontWeight: '900', color: hc ? '#ffffff' : '#0f172a' }}>
                  {appLang === 'en' ? 'Configure Live Session' : 'Pengaturan Sesi Live'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setStartModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: hc ? '#334155' : '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={hc ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={{ maxHeight: 380, marginBottom: 16 }}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {/* Subject Selection */}
              <Text style={{ fontSize: 13, fontWeight: '800', color: hc ? '#94a3b8' : '#475569', marginBottom: 8 }}>
                {appLang === 'en' ? 'Select Subject' : 'Pilih Mata Pelajaran'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {SUBJECTS.map((subj) => {
                  const isSelected = selectedSubject === subj;
                  return (
                    <TouchableOpacity
                      key={subj}
                      activeOpacity={0.8}
                      onPress={() => setSelectedSubject(subj)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: isSelected ? '#1e40af' : hc ? '#334155' : '#f1f5f9',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {isSelected && <Check size={12} color="#ffffff" />}
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: isSelected ? '#ffffff' : hc ? '#cbd5e1' : '#475569',
                      }}>
                        {subj}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Class Selection */}
              <Text style={{ fontSize: 13, fontWeight: '800', color: hc ? '#94a3b8' : '#475569', marginBottom: 8 }}>
                {appLang === 'en' ? 'Select Class' : 'Pilih Kelas'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {CLASSES.map((cls) => {
                  const isSelected = selectedClass === cls;
                  return (
                    <TouchableOpacity
                      key={cls}
                      activeOpacity={0.8}
                      onPress={() => setSelectedClass(cls)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: isSelected ? '#1e40af' : hc ? '#334155' : '#f1f5f9',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {isSelected && <Check size={12} color="#ffffff" />}
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: isSelected ? '#ffffff' : hc ? '#cbd5e1' : '#475569',
                      }}>
                        {cls}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Glossary Section */}
              <Text style={{ fontSize: 13, fontWeight: '800', color: hc ? '#94a3b8' : '#475569', marginBottom: 8 }}>
                {appLang === 'en' ? 'Custom Glossary (Optional)' : 'Daftar Istilah Kustom (Opsional)'}
              </Text>
              <View style={{ gap: 8, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={newWord}
                    onChangeText={setNewWord}
                    placeholder={appLang === 'en' ? 'Keyword (e.g. Mitosis)' : 'Kata Penting (misal: Mitosis)'}
                    placeholderTextColor={mutedColorVal}
                    style={[{
                      flex: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
                      fontSize: 12, fontWeight: '500',
                    }, hc ? { backgroundColor: '#334155', color: '#f8fafc', borderWidth: 1, borderColor: '#475569' } : { backgroundColor: '#f1f5f9', color: '#0f172a' }]}
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (newWord.trim() && newDefinition.trim()) {
                        setCustomGlossaryList(prev => [...prev, { word: newWord.trim(), definition: newDefinition.trim() }]);
                        setNewWord('');
                        setNewDefinition('');
                      }
                    }}
                    style={{
                      backgroundColor: '#1e40af', paddingHorizontal: 16, borderRadius: 10,
                      alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4,
                    }}
                  >
                    <Plus size={14} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>{appLang === 'en' ? 'Add' : 'Tambah'}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={newDefinition}
                  onChangeText={setNewDefinition}
                  placeholder={appLang === 'en' ? 'Definition / Explanation...' : 'Penjelasan / Arti kata...' }
                  placeholderTextColor={mutedColorVal}
                  multiline={true}
                  numberOfLines={2}
                  style={[{
                    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
                    fontSize: 12, fontWeight: '500', height: 48, textAlignVertical: 'top',
                  }, hc ? { backgroundColor: '#334155', color: '#f8fafc', borderWidth: 1, borderColor: '#475569' } : { backgroundColor: '#f1f5f9', color: '#0f172a' }]}
                />
              </View>

              {/* Custom Glossary List */}
              {customGlossaryList.length > 0 && (
                <View style={{ marginBottom: 8, borderTopWidth: 1, borderTopColor: hc ? '#334155' : '#e2e8f0', paddingTop: 10 }}>
                  <View style={{ gap: 6 }}>
                    {customGlossaryList.map((item, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          padding: 8, borderRadius: 8, backgroundColor: hc ? '#334155' : '#f8fafc',
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: textColorVal }}>{item.word}</Text>
                          <Text style={{ fontSize: 10, color: mutedColorVal, marginTop: 2 }}>{item.definition}</Text>
                        </View>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setCustomGlossaryList(prev => prev.filter((_, i) => i !== index))}
                          style={{ padding: 4 }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action - Confirm Start */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setStartModalVisible(false);
                const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                const sessionSubject = `${selectedSubject} (${selectedClass})`;
                startSession(roomCode, sessionSubject, selectedLang, customGlossaryList);
                router.push('/(tabs)/live');
              }}
            >
              <LinearGradient
                colors={['#1e3a8a', '#1e40af']}
                style={{
                  borderRadius: 14,
                  padding: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...getCardShadow(hc, 'md'),
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 15 }}>
                  {appLang === 'en' ? 'Start Session Now' : 'Mulai Sesi Sekarang'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
