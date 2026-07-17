import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, role } = useAuth();
  const { settings } = useSettings();
  
  const hc = settings.highContrast;
  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';

  const cardStyle = hc
    ? { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 16 }
    : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 };

  const inputStyle = hc
    ? { backgroundColor: '#334155', borderColor: '#475569', borderWidth: 1, color: '#f8fafc' }
    : { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, color: '#0f172a' };

  const joinCardStyle = hc
    ? { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 12 }
    : { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 };

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    
    setTimeout(async () => {
      await login(email);
      setLoading(false);
      router.replace('/(tabs)/home');
    }, 800);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          {/* Logo area */}
          <View style={{ alignItems: 'center', paddingTop: 64, paddingBottom: 24, gap: 12 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 16,
              backgroundColor: '#1e3a8a',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
            }}>
              <Headphones size={32} color="#ffffff" />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#1e3a8a' }}>SignSpeak</Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                Masuk sebagai <Text style={{ fontWeight: '700' }}>{role === 'student' ? 'Siswa' : 'Guru'}</Text>
              </Text>
            </View>
          </View>

          {/* Form card */}
          <View style={[{ padding: 20, gap: 16 }, cardStyle]}>
            {/* Email */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="nama@sekolah.sch.id"
                placeholderTextColor={mutedColor}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[{
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                  fontSize: 14, fontWeight: '500',
                }, inputStyle]}
              />
            </View>
            {/* Password */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Kata Sandi</Text>
              <TextInput
                value={pass}
                onChangeText={setPass}
                placeholder="••••••••"
                placeholderTextColor={mutedColor}
                secureTextEntry
                style={[{
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                  fontSize: 14, fontWeight: '500',
                }, inputStyle]}
              />
            </View>
            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={!email || loading}
              activeOpacity={0.9}
              style={{
                width: '100%', paddingVertical: 14, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center', marginTop: 4,
                backgroundColor: !email || loading ? 'rgba(30,58,138,0.5)' : '#1e3a8a',
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16 }}>Masuk</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: mutedColor }}>Belum punya akun? </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleLogin}>
              <Text style={{ color: '#1e40af', fontWeight: '800', fontSize: 14 }}>Daftar Gratis</Text>
            </TouchableOpacity>
          </View>

          {/* Join by code card */}
          <View style={[{ marginTop: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, joinCardStyle]}>
            <View style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: '#1e3a8a',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>#</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: hc ? '#e2e8f0' : '#1e3a8a' }}>Bergabung via Kode Kelas</Text>
              <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>Masukkan kode dari guru tanpa perlu daftar</Text>
            </View>
          </View>

          <View style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
