import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar as RNStatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, ArrowLeft, Mail } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { BubbleBackground } from '../../components/BubbleBackground';
import { getCardShadow } from '../../utils/formatters';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const router = useRouter();
  const { resetPassword, role } = useAuth();
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

  const handleReset = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(appLang === 'en' ? 'Valid email is required' : 'Email valid wajib diisi');
      return;
    }
    
    if (countdown > 0) return;

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setLoading(false);
      setCountdown(60);
      setSuccessMsg(appLang === 'en' 
        ? 'Password reset email sent! Please check your inbox.' 
        : 'Email pemulihan sandi telah dikirim! Silakan periksa kotak masuk Anda.');
    } catch (e: any) {
      setLoading(false);
      let errorText = e.message || '';
      if (typeof errorText === 'object') errorText = JSON.stringify(errorText);
      if (errorText === '{}' || !errorText) {
        errorText = appLang === 'en' ? 'SMTP Configuration Error' : 'Kesalahan Konfigurasi SMTP (Gagal Mengirim)';
      }
      
      const errMsg = errorText.toLowerCase();
      if (errMsg.includes('rate limit')) {
        setCountdown(60);
        setErrorMsg(appLang === 'en' 
          ? 'Email rate limit exceeded. If you just requested a reset, please check your inbox or wait a moment.' 
          : 'Batas pengiriman email tercapai. Jika Anda baru saja meminta pemulihan, mohon periksa kotak masuk Anda atau tunggu beberapa saat.');
      } else {
        setErrorMsg(errorText);
      }
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
              onPress={() => router.back()}
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
                {appLang === 'en' ? 'Reset Password' : 'Lupa Kata Sandi'}
              </Text>
            </View>
          </View>

          {/* Form card */}
          <View style={[{ padding: 20, gap: 16 }, cardStyle]}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: hc ? '#334155' : '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Mail size={24} color="#3b82f6" />
              </View>
              <Text style={{ color: mutedColor, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                {appLang === 'en' 
                  ? 'Enter the email associated with your account and we will send an email with instructions to reset your password.'
                  : 'Masukkan email yang terkait dengan akun Anda dan kami akan mengirimkan email berisi instruksi pemulihan.'}
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
                {appLang === 'en' ? 'Email Address' : 'Alamat Email'}
              </Text>
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

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleReset}
              disabled={loading || countdown > 0}
              style={{
                backgroundColor: (loading || countdown > 0) ? '#93c5fd' : '#3b82f6',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                {countdown > 0 
                  ? (appLang === 'en' ? `Wait ${countdown}s` : `Tunggu ${countdown}d`)
                  : loading 
                    ? (appLang === 'en' ? 'Sending...' : 'Mengirim...') 
                    : (appLang === 'en' ? 'Send Reset Link' : 'Kirim Tautan Pemulihan')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
