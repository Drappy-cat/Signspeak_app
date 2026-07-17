import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Search, BookOpen, Clock } from 'lucide-react-native';
import { useSettings } from '../../contexts/SettingsContext';
import { DICT } from '../../constants/i18n';
import { getCardShadow } from '../../utils/formatters';

// Using mock data to match prototype
const HISTORY_DATA = [
  { id: 1, subject: "Biologi", kelas: "XII IPA 3", teacher: "Bu Sari Dewi", date: "Hari ini, 08:00", duration: "45 mnt", words: 1240, excerpt: "...fotosintesis terjadi di dalam kloroplas pada sel tumbuhan..." },
  { id: 2, subject: "Matematika", kelas: "XII IPA 3", teacher: "Pak Budi Santoso", date: "Kemarin, 10:00", duration: "50 mnt", words: 980, excerpt: "...turunan fungsi trigonometri dan aplikasi integral..." },
  { id: 3, subject: "Fisika", kelas: "XII IPA 3", teacher: "Pak Ahmad Rizki", date: "Senin, 11:00", duration: "45 mnt", words: 1100, excerpt: "...hukum Newton tentang gerak, gaya, dan percepatan..." },
  { id: 4, subject: "Kimia", kelas: "XII IPA 3", teacher: "Bu Ratna Sari", date: "Jumat, 08:00", duration: "45 mnt", words: 890, excerpt: "...ikatan kovalen polar dan struktur Lewis molekul..." },
];

export default function HistoryScreen() {
  const { settings } = useSettings();
  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';

  const cardStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    ...getCardShadow(hc, 'md'),
  };

  const searchStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    ...getCardShadow(hc, 'sm'),
  };

  const iconBgColor = hc ? '#1e3a8a' : '#eff6ff';
  const iconColor = hc ? "#93c5fd" : "#1d4ed8";
  const dividerColor = hc ? '#334155' : '#f1f5f9';
  const linkColor = hc ? '#60a5fa' : '#1e40af';

  const headerTitle = appLang === 'en' ? 'Transcript History' : 'Riwayat Transkrip';
  const searchPlaceholder = appLang === 'en' ? 'Search subjects or keywords...' : 'Cari mata pelajaran atau kata kunci...';
  const sectionHeader = appLang === 'en' ? 'This Week' : 'Minggu Ini';
  const completedLabel = appLang === 'en' ? 'Completed' : 'Selesai';
  const wordsLabel = appLang === 'en' ? 'words' : 'kata';
  const openLabel = appLang === 'en' ? 'Open →' : 'Buka →';

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', marginBottom: 12, color: textColor }}>{headerTitle}</Text>
        {/* Search bar */}
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }, searchStyle]}>
          <Search size={15} color={mutedColor} />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={mutedColor}
            style={{ flex: 1, fontSize: 14, fontWeight: '500', color: textColor, padding: 0 }}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', color: mutedColor, marginBottom: 2 }}>
          {sectionHeader}
        </Text>

        {HISTORY_DATA.map(item => (
          <View key={item.id} style={cardStyle}>
            {/* Card body */}
            <View style={{ padding: 16, flexDirection: 'row', gap: 12 }}>
              <View style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: iconBgColor,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
              }}>
                <BookOpen size={17} color={iconColor} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>{item.subject}</Text>
                <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{item.teacher} · {item.kelas}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Clock size={10} color={mutedColor} />
                  <Text style={{ fontSize: 12, color: mutedColor }}>{item.date} · {item.duration}</Text>
                </View>
                <Text style={{ fontSize: 12, color: mutedColor, marginTop: 6, fontStyle: 'italic', lineHeight: 18 }} numberOfLines={2}>
                  {item.excerpt}
                </Text>
              </View>
            </View>

            {/* Card footer */}
            <View style={{
              marginHorizontal: 16, paddingTop: 10, paddingBottom: 12,
              borderTopWidth: 1, borderTopColor: dividerColor,
              flexDirection: 'row', alignItems: 'center', justify: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: mutedColor }}>{item.words.toLocaleString('id-ID')} {wordsLabel}</Text>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: hc ? '#475569' : '#cbd5e1' }} />
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: hc ? '#1e293b' : '#ecfdf5' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: hc ? '#94a3b8' : '#059669' }}>{completedLabel}</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: linkColor }}>{openLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
