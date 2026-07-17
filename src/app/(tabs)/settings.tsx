import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSettings } from '../../contexts/SettingsContext';
import { FontSizeLabels, FontSizeKey, FontSizes } from '../../constants/theme';
import { LANGUAGE_LABELS } from '../../constants/keywords';
import { DICT } from '../../constants/i18n';
import { getCardShadow } from '../../utils/formatters';
import { Type, Moon, Globe, Zap, User } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Animated, Easing } from 'react-native';

function CustomToggle({ val, onChange, hc }: { val: boolean; onChange: () => void; hc: boolean }) {
  const anim = React.useRef(new Animated.Value(val ? 22 : 2)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: val ? 22 : 2,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [val]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onChange}
      style={{
        width: 48, height: 28, borderRadius: 14, justifyContent: 'center',
        backgroundColor: val ? '#1d4ed8' : hc ? '#475569' : '#cbd5e1',
      }}
    >
      <Animated.View
        style={[
          {
            transform: [{ translateX: anim }],
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: '#ffffff',
          },
          Platform.OS === 'web'
            ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)' } as any
            : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 }
        ]}
      />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const { user, logout, role } = useAuth();
  const router = useRouter();

  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';
  const iconColor = hc ? "#60a5fa" : "#1e40af";
  const dividerColor = hc ? '#334155' : '#f1f5f9';

  const cardStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    ...getCardShadow(hc, 'md'),
  };

  const activeBtnStyle = hc
    ? { backgroundColor: '#1d4ed8' }
    : { backgroundColor: '#1e3a8a' };

  const inactiveBtnStyle = hc
    ? { backgroundColor: '#334155' }
    : { backgroundColor: '#f1f5f9' };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: textColor }}>{d.accessibility}</Text>
        <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{d.accSub}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* App Language Selection */}
        <View style={[{ padding: 16 }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Globe size={15} color={iconColor} />
            <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>{d.appLanguage}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => updateSettings({ appLang: 'id' })}
              style={[
                { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
                appLang === 'id' ? activeBtnStyle : inactiveBtnStyle,
              ]}
            >
              <Text style={{
                fontSize: 12, fontWeight: '800',
                color: appLang === 'id' ? '#ffffff' : hc ? '#cbd5e1' : '#475569',
              }}>
                Bahasa Indonesia
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => updateSettings({ appLang: 'en' })}
              style={[
                { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
                appLang === 'en' ? activeBtnStyle : inactiveBtnStyle,
              ]}
            >
              <Text style={{
                fontSize: 12, fontWeight: '800',
                color: appLang === 'en' ? '#ffffff' : hc ? '#cbd5e1' : '#475569',
              }}>
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Font size card */}
        <View style={[{ padding: 16 }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Type size={15} color={iconColor} />
            <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>{d.textSize}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(Object.keys(FontSizeLabels) as FontSizeKey[]).map(s => (
              <TouchableOpacity
                key={s}
                activeOpacity={0.7}
                onPress={() => updateSettings({ fontSize: s })}
                style={[
                  { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
                  settings.fontSize === s ? activeBtnStyle : inactiveBtnStyle,
                ]}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '800',
                  color: settings.fontSize === s ? '#ffffff' : hc ? '#cbd5e1' : '#475569',
                }}>
                  {FontSizeLabels[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: dividerColor }}>
            <Text style={{ fontSize: 12, color: mutedColor, marginBottom: 4 }}>{d.preview}</Text>
            <Text style={{ fontSize: FontSizes[settings.fontSize].transcript, fontWeight: '800', color: textColor }}>
              Teks Abc 123
            </Text>
          </View>
        </View>

        {/* High contrast toggle */}
        <View style={[{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <Moon size={15} color={iconColor} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>{d.highContrast}</Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{d.highContrastSub}</Text>
            </View>
          </View>
          <CustomToggle val={hc} onChange={() => updateSettings({ highContrast: !hc })} hc={hc} />
        </View>

        {/* Transcription Language */}
        <View style={[{ padding: 16 }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Globe size={15} color={iconColor} />
            <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>{d.transcriptionLang}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Object.keys(LANGUAGE_LABELS).map(l => (
              <TouchableOpacity
                key={l}
                activeOpacity={0.7}
                onPress={() => updateSettings({ language: l })}
                style={[
                  { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
                  settings.language === l ? activeBtnStyle : inactiveBtnStyle,
                ]}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '800',
                  color: settings.language === l ? '#ffffff' : hc ? '#cbd5e1' : '#475569',
                }}>
                  {LANGUAGE_LABELS[l]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vibrate toggle */}
        <View style={[{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <Zap size={15} color={iconColor} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>{d.vibrate}</Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{d.vibrateSub}</Text>
            </View>
          </View>
          <CustomToggle val={settings.vibrate} onChange={() => updateSettings({ vibrate: !settings.vibrate })} hc={hc} />
        </View>

        {/* Profile */}
        <View style={[{ padding: 16 }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: hc ? '#1e3a8a' : '#dbeafe',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <User size={22} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 15, color: textColor }}>{user?.name || 'Budi Santoso'}</Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                {role === 'student' ? (appLang === 'en' ? 'Student · XII IPA 3' : 'Siswa · XII IPA 3') : (appLang === 'en' ? 'Teacher' : 'Guru')} · SMAN 1 Surabaya
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            style={{
              width: '100%', paddingVertical: 10, borderRadius: 12, alignItems: 'center',
              backgroundColor: hc ? 'rgba(127,29,29,0.4)' : '#fef2f2',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: hc ? '#f87171' : '#dc2626' }}>
              {d.logout}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
