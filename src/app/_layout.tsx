import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Platform } from 'react-native';
import '../../global.css';

import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { SessionProvider } from '../contexts/SessionContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const Wrapper = Platform.OS === 'web' ? ({children}: any) => (
    <View className="flex-1 bg-slate-200 items-center justify-center">
      <View className="w-full max-w-md h-full bg-white shadow-2xl overflow-hidden relative">
        {children}
      </View>
    </View>
  ) : ({children}: any) => <View className="flex-1">{children}</View>;

  return (
    <AuthProvider>
      <SettingsProvider>
        <SessionProvider>
          <StatusBar style="auto" />
          <Wrapper>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </Wrapper>
        </SessionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
