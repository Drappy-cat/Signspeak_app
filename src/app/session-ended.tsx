import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { UserCircle2, LogOut, Hash, ArrowRight, Info } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { loadStudentCache, StudentCacheData } from '../utils/studentCache';
import { LinearGradient } from 'expo-linear-gradient';
import { BubbleBackground } from '../components/BubbleBackground';

export default function SessionEndedScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { settings } = useSettings();
  const appLang = settings.language;
  const hc = settings.highContrast;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [cachedData, setCachedData] = useState<StudentCacheData | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      const data = await loadStudentCache();
      if (!data) {
        // Cache expired or doesn't exist, force re-login
        router.replace('/(auth)/login');
        return;
      }
      setCachedData(data);
      setLoading(false);
    };
    init();
  }, []);

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      setErrorMsg(appLang === 'en' ? 'Please enter a room code' : 'Harap masukkan kode kelas');
      return;
    }
    if (!cachedData) return;

    setErrorMsg('');
    setJoining(true);
    try {
      // Re-login using cached identity
      await login(
        '', 
        undefined, 
        roomCode.trim().toUpperCase(), 
        'student', 
        cachedData.name, 
        cachedData.className || 'Kelas Umum', 
        cachedData.absen
      );
      router.replace('/(tabs)/live');
    } catch (err: any) {
      setErrorMsg(err.message || (appLang === 'en' ? 'Failed to join session' : 'Gagal bergabung ke kelas'));
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: hc ? '#0f172a' : '#F0F7FF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';
  const cardColor = hc ? '#1e293b' : '#ffffff';

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: hc ? '#0f172a' : '#F0F7FF' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BubbleBackground />
      
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{
          backgroundColor: cardColor,
          padding: 28,
          borderRadius: 24,
          shadowColor: '#3b82f6',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: hc ? 0 : 0.08,
          shadowRadius: 32,
          elevation: 10,
          borderWidth: 1,
          borderColor: hc ? '#334155' : '#e2e8f0',
        }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ backgroundColor: hc ? '#334155' : '#eff6ff', padding: 16, borderRadius: 100, marginBottom: 16 }}>
              <Info size={32} color={hc ? '#93c5fd' : '#2563eb'} />
            </View>
            <Text style={{ fontSize: 26, fontWeight: '900', color: textColor, textAlign: 'center', marginBottom: 8 }}>
              {appLang === 'en' ? 'Session Ended' : 'Sesi Berakhir'}
            </Text>
            <Text style={{ fontSize: 15, color: mutedColor, textAlign: 'center', lineHeight: 22 }}>
              {appLang === 'en' 
                ? 'The teacher has closed the session. Please enter a new room code to join the next class.' 
                : 'Guru telah menutup sesi kelas. Silakan masukkan kode ruangan baru untuk melanjutkan.'}
            </Text>
          </View>

          {cachedData && (
            <View style={{ 
              backgroundColor: hc ? '#0f172a' : '#f8fafc', 
              padding: 16, 
              borderRadius: 16, 
              marginBottom: 24,
              borderWidth: 1,
              borderColor: hc ? '#334155' : '#e2e8f0',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <View style={{ backgroundColor: hc ? '#1e293b' : '#e0e7ff', padding: 12, borderRadius: 12, marginRight: 16 }}>
                <UserCircle2 size={24} color={hc ? '#818cf8' : '#4f46e5'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: mutedColor, marginBottom: 2, fontWeight: '800', letterSpacing: 0.5 }}>IDENTITAS SISWA</Text>
                <Text style={{ fontSize: 17, color: textColor, fontWeight: '800', marginBottom: 2 }}>{cachedData.name}</Text>
                <Text style={{ fontSize: 14, color: mutedColor, fontWeight: '600' }}>Absen: {cachedData.absen}</Text>
              </View>
            </View>
          )}

          {errorMsg ? (
            <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' }}>
              <Text style={{ color: '#ef4444', textAlign: 'center', fontWeight: '600', fontSize: 13 }}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={{ marginBottom: 28 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 8, marginLeft: 4 }}>
              {appLang === 'en' ? 'New Room Code' : 'Kode Ruangan Baru'}
            </Text>
            <View style={{ position: 'relative' }}>
              <View style={{ position: 'absolute', left: 16, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 }}>
                <Hash size={20} color={hc ? '#64748b' : '#94a3b8'} />
              </View>
              <TextInput
                value={roomCode}
                onChangeText={(t) => {
                  setRoomCode(t);
                  setErrorMsg('');
                }}
                placeholder={appLang === 'en' ? 'e.g. ABCD' : 'Contoh: ABCD'}
                placeholderTextColor={hc ? '#475569' : '#94a3b8'}
                autoCapitalize="characters"
                maxLength={6}
                editable={!joining}
                style={{
                  backgroundColor: hc ? '#0f172a' : '#f8fafc',
                  color: textColor,
                  padding: 16,
                  paddingLeft: 48,
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: '800',
                  borderWidth: 1,
                  borderColor: hc ? '#334155' : '#cbd5e1',
                  letterSpacing: 3,
                }}
              />
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={handleJoin} disabled={joining}>
            <LinearGradient
              colors={joining ? ['#94a3b8', '#64748b'] : ['#2563eb', '#1d4ed8']}
              style={{
                padding: 16,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#2563eb',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }}
            >
              {joining ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', marginRight: 8 }}>
                    {appLang === 'en' ? 'Join New Session' : 'Gabung Sesi Baru'}
                  </Text>
                  <ArrowRight size={20} color="#ffffff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => router.replace('/(auth)/login')} 
            disabled={joining}
            style={{ 
              marginTop: 20, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: 12,
              borderRadius: 12,
              backgroundColor: hc ? '#334155' : '#f1f5f9'
            }}
          >
            <LogOut size={16} color={hc ? '#fca5a5' : '#ef4444'} style={{ marginRight: 6 }} />
            <Text style={{ color: hc ? '#fca5a5' : '#ef4444', fontWeight: '700', fontSize: 14 }}>
              {appLang === 'en' ? 'Switch Account / Logout' : 'Ganti Akun / Keluar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
