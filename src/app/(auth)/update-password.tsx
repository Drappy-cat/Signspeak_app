import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar as RNStatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, ArrowLeft, KeyRound } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { BubbleBackground } from '../../components/BubbleBackground';
import { getCardShadow } from '../../utils/formatters';
import { supabase } from '../../services/supabase';

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();
  const { settings } = useSettings();

  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';

  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';

  const cardStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 16,
    ...getCardShadow(hc, 'lg'),
  };

  const inputStyle = hc
    ? { backgroundColor: '#334155', borderColor: '#475569', borderWidth: 1, color: '#f8fafc' }
    : { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, color: '#0f172a' };

  const handleUpdate = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!password || password.length < 6) {
      setErrorMsg(appLang === 'en' ? 'Password must be at least 6 characters' : 'Kata Sandi minimal 6 karakter');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMsg(appLang === 'en' ? 'Passwords do not match' : 'Kata Sandi tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setLoading(false);
      setSuccessMsg(appLang === 'en' 
        ? 'Password updated successfully! You can now log in.' 
        : 'Sandi berhasil diperbarui! Anda kini dapat masuk dengan sandi baru.');
        
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 3000);
    } catch (e: any) {
      setLoading(false);
      setErrorMsg(e.message || (appLang === 'en' ? 'Failed to update password' : 'Gagal memperbarui sandi'));
    }
  };

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
        <BubbleBackground hc={hc} />
        
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          {/* Header Back Button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => router.replace('/(auth)/login')}
              style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: hc ? '#1e293b' : '#ffffff',
                alignItems: 'center', justifyContent: 'center',
                ...getCardShadow(hc, 'sm'),
              }}
            >
              <ArrowLeft size={20} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Logo area */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 16, gap: 8 }}>
            <View style={{
              width: 52, height: 52, borderRadius: 14,
              backgroundColor: '#1e3a8a',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
            }}>
              <Headphones size={26} color="#ffffff" />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#1e3a8a', letterSpacing: 0.5 }}>LENTERA</Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 4, fontWeight: '600' }}>
                {appLang === 'en' ? 'Update Password' : 'Perbarui Sandi'}
              </Text>
            </View>
          </View>

          {/* Form card */}
          <View style={[{ padding: 20, gap: 16 }, cardStyle]}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: hc ? '#334155' : '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <KeyRound size={24} color="#3b82f6" />
              </View>
              <Text style={{ color: mutedColor, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                {appLang === 'en' 
                  ? 'Enter your new password below to recover your account.'
                  : 'Masukkan kata sandi baru Anda di bawah ini untuk memulihkan akun.'}
              </Text>
            </View>

            {errorMsg ? (
              <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' }}>
                <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' }}>
                <Text style={{ color: '#16a34a', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                  {successMsg}
                </Text>
              </View>
            ) : null}

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                {appLang === 'en' ? 'New Password' : 'Sandi Baru'}
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={mutedColor}
                secureTextEntry
                style={[{
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                  fontSize: 14, fontWeight: '500',
                }, inputStyle]}
              />
            </View>
            
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                {appLang === 'en' ? 'Confirm Password' : 'Konfirmasi Sandi'}
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={mutedColor}
                secureTextEntry
                style={[{
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                  fontSize: 14, fontWeight: '500',
                }, inputStyle]}
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleUpdate}
              disabled={loading || !!successMsg}
              style={{
                backgroundColor: (loading || !!successMsg) ? '#93c5fd' : '#3b82f6',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                {loading 
                  ? (appLang === 'en' ? 'Updating...' : 'Memperbarui...') 
                  : (appLang === 'en' ? 'Update Password' : 'Ubah Kata Sandi')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
