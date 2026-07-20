import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '../contexts/SettingsContext';
import { DICT } from '../constants/i18n';
import { getCardShadow } from '../utils/formatters';
import { ArrowLeft, Info, Users, Mail, GraduationCap, Globe, User } from 'lucide-react-native';

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

  const cardStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    ...getCardShadow(hc, 'lg'),
  };

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
      {/* Header Back Button & Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/settings');
            }
          }}
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

        {/* Research Team Section */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
            <Users size={16} color={iconColor} />
            <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>
              {appLang === 'en' ? 'Research Team' : 'Tim Peneliti'}
            </Text>
          </View>
          
          <View style={cardStyle}>
            {/* Profile Info with Image */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <Image
                source={require('../assets/images/researcher_adhitya.jpg')}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: hc ? '#1e3a8a' : '#dbeafe',
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 16, color: textColor }}>
                  Adhitya Amarulloh
                </Text>
                <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>
                  Universitas Negeri Surabaya
                </Text>
              </View>
            </View>

            {/* Email Contact Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('mailto:adhityaamarulloh@unesa.ac.id')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: hc ? '#1e3a8a' : '#f1f5f9',
              }}
            >
              <Mail size={15} color={iconColor} />
              <Text style={{ fontSize: 13, color: textColor, fontWeight: '700' }}>
                adhityaamarulloh@unesa.ac.id
              </Text>
            </TouchableOpacity>

            {/* Profile Links Button Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {/* Google Scholar */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://scholar.google.com/citations?hl=en&user=AUhf9PUAAAAJ')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: hc ? 'transparent' : '#ffffff',
                  ...getCardShadow(hc, 'sm'),
                }}
              >
                <GraduationCap size={14} color="#3b82f6" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: textColor }}>
                  Google Scholar
                </Text>
              </TouchableOpacity>

              {/* LinkedIn */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://www.linkedin.com/in/adhitya-a-67a6818a/')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: hc ? 'transparent' : '#ffffff',
                  ...getCardShadow(hc, 'sm'),
                }}
              >
                <User size={14} color="#0077b5" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: textColor }}>
                  LinkedIn
                </Text>
              </TouchableOpacity>

              {/* Scopus */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://www.scopus.com/authid/detail.uri?authorId=59235408300')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: hc ? 'transparent' : '#ffffff',
                  ...getCardShadow(hc, 'sm'),
                }}
              >
                <Globe size={14} color="#eab308" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: textColor }}>
                  Scopus
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
