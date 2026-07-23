import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar as RNStatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff } from 'lucide-react-native';
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
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const router = useRouter();
  const { resetPassword, verifyRecoveryOtp, updatePassword, role } = useAuth();
  const { settings } = useSettings();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

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

  const handleSendEmail = async () => {
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
      setStep(2);
      setSuccessMsg(appLang === 'en' 
        ? 'Verification code sent! Please check your inbox.' 
        : 'Kode verifikasi telah dikirim! Silakan periksa kotak masuk Anda.');
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
          ? 'Email rate limit exceeded. Please wait a moment.' 
          : 'Batas pengiriman email tercapai. Mohon tunggu beberapa saat.');
      } else {
        setErrorMsg(errorText);
      }
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!otp.trim()) {
      setErrorMsg(appLang === 'en' ? 'Verification code is required' : 'Kode verifikasi wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await verifyRecoveryOtp(email.trim(), otp.trim());
      setStep(3);
      setSuccessMsg(appLang === 'en' 
        ? 'Code verified! Please enter your new password.' 
        : 'Kode berhasil diverifikasi! Silakan masukkan kata sandi baru Anda.');
    } catch (e: any) {
      setErrorMsg(e.message || (appLang === 'en' ? 'Invalid or expired code.' : 'Kode tidak valid atau sudah kedaluwarsa.'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (newPassword.length < 6) {
      setErrorMsg(appLang === 'en' ? 'Password must be at least 6 characters' : 'Kata sandi minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccessMsg(appLang === 'en' ? 'Password changed successfully! Redirecting...' : 'Kata sandi berhasil diubah! Mengarahkan ke login...');
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch (e: any) {
      setErrorMsg(appLang === 'en' ? 'Failed to update password.' : 'Gagal mengubah kata sandi.');
    } finally {
      setLoading(false);
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
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')}
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
            <Image 
              source={require('../../../assets/images/app-icon.png')} 
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
            />
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
                {step === 1 && <Mail size={24} color="#3b82f6" />}
                {step === 2 && <KeyRound size={24} color="#3b82f6" />}
                {step === 3 && <Lock size={24} color="#3b82f6" />}
              </View>
              <Text style={{ color: mutedColor, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                {step === 1 && (appLang === 'en' 
                  ? 'Enter the email associated with your account and we will send a verification code to reset your password.'
                  : 'Masukkan email yang terkait dengan akun Anda dan kami akan mengirimkan kode verifikasi pemulihan sandi.')}
                {step === 2 && (appLang === 'en'
                  ? `Enter the 6-digit verification code sent to ${email}`
                  : `Masukkan 6 digit kode verifikasi yang telah dikirim ke ${email}`)}
                {step === 3 && (appLang === 'en'
                  ? 'Create a new, strong password for your account.'
                  : 'Buat kata sandi baru yang kuat untuk akun Anda.')}
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

            {step === 1 && (
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
            )}

            {step === 2 && (
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, textAlign: 'center', marginBottom: 8 }}>
                  {appLang === 'en' ? 'Verification Code' : 'Kode Verifikasi'}
                </Text>
                
                <View style={{ position: 'relative', width: '100%', height: 55, justifyContent: 'center' }}>
                  {/* The visible boxes */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }} pointerEvents="none">
                    {[0, 1, 2, 3, 4, 5].map(index => {
                      const isActive = otp.length === index;
                      const hasValue = otp.length > index;
                      return (
                        <View 
                          key={index} 
                          style={{
                            width: 42, height: 55, borderRadius: 12,
                            justifyContent: 'center', alignItems: 'center',
                            borderWidth: isActive ? 2 : 1,
                            borderColor: isActive ? '#3b82f6' : (hasValue ? (hc ? '#64748b' : '#94a3b8') : (hc ? '#475569' : '#e2e8f0')),
                            backgroundColor: hc ? '#334155' : '#f8fafc',
                            shadowColor: isActive ? '#3b82f6' : 'transparent',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: isActive ? 0.2 : 0,
                            shadowRadius: 4,
                          }}
                        >
                          <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>
                            {otp[index] || ''}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* The invisible input taking up the whole area to capture typing */}
                  <TextInput
                    value={otp}
                    onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      opacity: 0, // completely invisible
                      zIndex: 10, // make sure it captures touches
                    }}
                  />
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                  {appLang === 'en' ? 'New Password' : 'Kata Sandi Baru'}
                </Text>
                <View style={[{
                  flexDirection: 'row', alignItems: 'center',
                  borderRadius: 12, paddingRight: 16,
                }, inputStyle]}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="••••••••"
                    placeholderTextColor={mutedColor}
                    secureTextEntry={!showPass}
                    style={{
                      flex: 1, paddingHorizontal: 16, paddingVertical: 12,
                      fontSize: 14, fontWeight: '500', color: textColor,
                    }}
                  />
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPass(!showPass)}>
                    {showPass ? (
                      <EyeOff size={20} color={mutedColor} />
                    ) : (
                      <Eye size={20} color={mutedColor} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                if (step === 1) handleSendEmail();
                else if (step === 2) handleVerifyOtp();
                else if (step === 3) handleUpdatePassword();
              }}
              disabled={loading || (step === 1 && countdown > 0)}
              style={{
                backgroundColor: (loading || (step === 1 && countdown > 0)) ? '#93c5fd' : '#3b82f6',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                {step === 1 && (
                  countdown > 0 
                    ? (appLang === 'en' ? `Wait ${countdown}s` : `Tunggu ${countdown}d`)
                    : loading 
                      ? (appLang === 'en' ? 'Sending...' : 'Mengirim...') 
                      : (appLang === 'en' ? 'Send Code' : 'Kirim Kode')
                )}
                {step === 2 && (
                  loading ? (appLang === 'en' ? 'Verifying...' : 'Memeriksa...') : (appLang === 'en' ? 'Verify Code' : 'Verifikasi Kode')
                )}
                {step === 3 && (
                  loading ? (appLang === 'en' ? 'Saving...' : 'Menyimpan...') : (appLang === 'en' ? 'Update Password' : 'Ubah Kata Sandi')
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
