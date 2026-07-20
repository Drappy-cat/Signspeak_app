import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '../contexts/SettingsContext';
import { DICT } from '../constants/i18n';
import { getCardShadow } from '../utils/formatters';
import { ArrowLeft, Info, Users } from 'lucide-react-native';

export default function AboutScreen() {
  const router = useRouter();
  const { settings } = useSettings();

  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const bgColor = hc ? '#0f172a' : '#F0F7FF';
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';
  const iconColor = hc ? '#60a5fa' : '#1e40af';
  const borderColor = hc ? '#334155' : '#cbd5e1';

  const cardStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    ...getCardShadow(hc, 'lg'),
  };

  const placeholderCardStyle = {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: borderColor,
    padding: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 180,
    marginTop: 8,
  };

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
      {/* Header Back Button & Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: hc ? '#1e293b' : '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            ...getCardShadow(hc, 'sm'),
          }}
        >
          <ArrowLeft size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '900', color: textColor }}>
          {appLang === 'en' ? 'About App' : 'Tentang Aplikasi'}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Acknowledgment & Funding */}
        <View style={cardStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Info size={18} color={iconColor} />
            <Text style={{ fontWeight: '800', fontSize: 15, color: textColor }}>
              {appLang === 'en' ? 'Acknowledgment' : 'Pendanaan & Pengakuan'}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: textColor, lineHeight: 20 }}>
            {appLang === 'en'
              ? 'This application development is funded by Non-APBN Research Grant LPPM Universitas Negeri Surabaya.'
              : 'Pengembangan Aplikasi ini didanai oleh dana Penelitian Non-APBN LPPM Universitas Negeri Surabaya.'}
          </Text>
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: hc ? '#334155' : '#f1f5f9', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: mutedColor }}>LENTERA App</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: mutedColor }}>v1.0.0</Text>
          </View>
        </View>

        {/* Research Team Placeholder Section */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
            <Users size={16} color={iconColor} />
            <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>
              {appLang === 'en' ? 'Research Team' : 'Tim Peneliti'}
            </Text>
          </View>
          
          <View style={placeholderCardStyle}>
            <Text style={{ color: mutedColor, fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
              {appLang === 'en' ? 'No Team Data' : 'Belum Ada Data Tim'}
            </Text>
            <Text style={{ color: mutedColor, fontSize: 11, textAlign: 'center', maxWidth: 220, lineHeight: 16 }}>
              {appLang === 'en' 
                ? 'Information about the research team members will be updated soon.' 
                : 'Informasi mengenai anggota tim peneliti akan diperbarui segera.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
