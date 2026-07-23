import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, TouchableOpacity, Platform, Modal, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../../global.css';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import { SessionProvider } from '../contexts/SessionContext';
import { DICT } from '../constants/i18n';

// ── Developer Mode Switch ───────────────────────────────────────────────────
// Set to FALSE to completely remove the Dev Tool button and modal from the build.
const SHOW_DEV_MENU = false;

SplashScreen.preventAutoHideAsync();

function FloatingDevMenu() {
  const [open, setOpen] = useState(false);
  const { role, setRole, login } = useAuth();
  const { settings, updateSettings } = useSettings();
  const router = useRouter();

  if (!SHOW_DEV_MENU) return null;
  
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const handleSwitch = async (targetRole: 'student' | 'teacher') => {
    await setRole(targetRole);
    setOpen(false);
    if (targetRole === 'student') {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleReset = async () => {
    try {
      await AsyncStorage.clear();
      setOpen(false);
      // Force reload or redirect to onboarding
      router.replace('/onboarding');
      // Set default settings
      updateSettings({ appLang: 'id', highContrast: false, fontSize: 'normal', language: 'id', vibrate: true });
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  };

  return (
    <>
      {/* Floating Gear Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        style={{
          position: 'absolute', bottom: 85, right: 16, zIndex: 9999,
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
          borderWidth: 1.5, borderColor: '#ffffff',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#ffffff' }}>🛠</Text>
      </TouchableOpacity>

      {/* Dev Tools Modal Overlay */}
      <Modal visible={open} transparent={true} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'flex-end' }}>
          <SafeAreaView style={{
            backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, borderTopWidth: 1, borderTopColor: '#334155',
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#ffffff', letterSpacing: 0.5 }}>LENTERA DEV TOOLS</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Mode: {role ? role.toUpperCase() : 'NONE'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#cbd5e1' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Actions list */}
            <View style={{ gap: 12 }}>
              {/* Role student */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSwitch('student')}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: role === 'student' ? '#1e3a8a' : '#334155',
                  paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
                  borderWidth: role === 'student' ? 1 : 0, borderColor: '#3b82f6',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>👨‍🎓 {d.studentView}</Text>
                {role === 'student' && <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '800' }}>ACTIVE</Text>}
              </TouchableOpacity>

              {/* Role teacher */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSwitch('teacher')}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: role === 'teacher' ? '#1e3a8a' : '#334155',
                  paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
                  borderWidth: role === 'teacher' ? 1 : 0, borderColor: '#3b82f6',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>👩‍🏫 {d.teacherView}</Text>
                {role === 'teacher' && <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '800' }}>ACTIVE</Text>}
              </TouchableOpacity>

              {/* Reset onboarding */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleReset}
                style={{
                  backgroundColor: '#7f1d1d',
                  paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
                  alignItems: 'center', marginTop: 8,
                }}
              >
                <Text style={{ color: '#fca5a5', fontWeight: '800', fontSize: 14 }}>↩ Reset Onboarding & Clear Data</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 10, marginTop: 24, fontStyle: 'italic' }}>
              Untuk menonaktifkan tombol ini, ubah SHOW_DEV_MENU ke false di _layout.tsx
            </Text>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

function AppWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const { role, setRole, login } = useAuth();
  const router = useRouter();
  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const appTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: hc ? '#0f172a' : '#F0F7FF',
    },
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1 }}>
        <ThemeProvider value={appTheme}>
          {children}
        </ThemeProvider>
        <FloatingDevMenu />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', backgroundColor: '#0f172a' } as any}>
      {/* Dark gradient background matching prototype */}
      <View style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)' } as any} />
      {/* Ambient background blur for wide screens */}
      <View className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.15)', filter: 'blur(120px)', pointerEvents: 'none' } as any} />
      <View className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.08)', filter: 'blur(100px)', pointerEvents: 'none' } as any} />
      
      {/* Demo Switcher (Web Only) */}
      <View style={{ position: 'absolute', top: 24, left: 24, zIndex: 100, gap: 10 } as any}>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {d.demoMode}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            await setRole('student');
            router.replace('/(auth)/login');
          }}
          style={{
            backgroundColor: role === 'student' ? '#ffffff' : 'rgba(255,255,255,0.12)',
            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2, shadowRadius: 4,
          }}
        >
          <Text style={{ color: role === 'student' ? '#0f172a' : '#ffffff', fontSize: 12, fontWeight: '800' }}>
            👨‍🎓 {d.studentView}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            await setRole('teacher');
            router.replace('/(auth)/login');
          }}
          style={{
            backgroundColor: role === 'teacher' ? '#ffffff' : 'rgba(255,255,255,0.12)',
            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2, shadowRadius: 4,
          }}
        >
          <Text style={{ color: role === 'teacher' ? '#0f172a' : '#ffffff', fontSize: 12, fontWeight: '800' }}>
            👩‍🏫 {d.teacherView}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            router.replace('/onboarding');
          }}
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '800' }}>
            ↩ Onboarding
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            router.replace('/admin' as any);
          }}
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '800' }}>
            👑 Admin
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            router.replace('/splash' as any);
          }}
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '800' }}>
            ✨ Splashscreen
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legend (Web Only) */}
      <View style={{ position: 'absolute', top: 24, right: 24, zIndex: 100, alignItems: 'flex-end', gap: 6 } as any}>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {appLang === 'en' ? 'Legend' : 'Legenda'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'right', maxWidth: 160, lineHeight: 15 }}>
          {appLang === 'en' ? 'Keywords are automatically ' : 'Kata kunci otomatis ' }
          <Text style={{ backgroundColor: 'rgba(245,158,11,0.25)', color: '#fbbf24', fontWeight: '800', borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1 }}>
            {appLang === 'en' ? 'highlighted' : 'disorot'}
          </Text>
          {appLang === 'en' ? ' in transcription screen' : ' di layar transkripsi'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'right' }}>
          {appLang === 'en' ? 'Speaking bar indicator = speaking' : 'Indikator gerak = sedang berbicara'}
        </Text>
      </View>

      {/* Phone container — matches prototype: rounded-[50px] with dramatic shadow */}
      <View
        className="relative w-full max-w-[400px] h-full max-h-[850px] overflow-hidden md:rounded-[42px]"
        style={{
          backgroundColor: hc ? '#0f172a' : '#F0F7FF',
          // Outer bezel effect like prototype
          borderWidth: 8,
          borderColor: '#18181b',
          borderRadius: 42,
          // Dramatic drop shadow matching prototype's shadow-[0_30px_80px_rgba(0,0,0,0.8)]
          boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
        } as any}
      >
        <ThemeProvider value={appTheme}>
          {children}
        </ThemeProvider>
        <FloatingDevMenu />
      </View>

      {/* Caption */}
      <Text style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: '700' }}>
        LENTERA (Learning Text and Real-time Accessibility) — Prototype UI/UX · Aksesibilitas untuk Siswa Tunarungu di Ruang Kelas Indonesia
      </Text>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
        <SessionProvider>
          <StatusBar style="auto" />
          <AppWrapper>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="admin" />
              <Stack.Screen name="splash" />
              <Stack.Screen name="about" />
              <Stack.Screen name="notifications" />
            </Stack>
          </AppWrapper>
        </SessionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
