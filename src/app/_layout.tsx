import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Platform } from 'react-native';
import '../../global.css';

import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import { SessionProvider } from '../contexts/SessionContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

function AppWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const hc = settings.highContrast;

  if (Platform.OS !== 'web') {
    return <View className="flex-1">{children}</View>;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', backgroundColor: '#0f172a' } as any}>
      {/* Dark gradient background matching prototype */}
      <View style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)' } as any} />
      {/* Ambient background blur for wide screens */}
      <View className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.15)', filter: 'blur(120px)', pointerEvents: 'none' } as any} />
      <View className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.08)', filter: 'blur(100px)', pointerEvents: 'none' } as any} />
      
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
        {children}
      </View>
    </View>
  );
}

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
            </Stack>
          </AppWrapper>
        </SessionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
