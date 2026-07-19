import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar as RNStatusBar, Animated, Dimensions, StyleSheet, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { BubbleBackground } from '../../components/BubbleBackground';
import { supabase } from '../../services/supabase';
import { DICT } from '../../constants/i18n';
import { getCardShadow } from '../../utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');



export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [classCode, setClassCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentStep, setStudentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  
  // Modal Animation
  const [modalScale] = useState(() => new Animated.Value(0.8));
  const [modalOpacity] = useState(() => new Animated.Value(0));

  React.useEffect(() => {
    if (showModal) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Reset when hidden
      modalScale.setValue(0.8);
      modalOpacity.setValue(0);
    }
  }, [showModal, modalScale, modalOpacity]);

  const router = useRouter();
  const { login, loginWithGoogle, role } = useAuth();
  const { settings } = useSettings();
  
  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

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

  const joinCardStyle = {
    backgroundColor: hc ? '#1e293b' : '#eff6ff',
    borderRadius: 12,
    ...getCardShadow(hc, 'sm'),
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (role === 'student') {
      if (studentStep === 1) {
        if (!classCode.trim() || classCode.trim().length < 6) {
          setModalTitle(appLang === 'en' ? 'Warning' : 'Peringatan');
          setModalMsg(appLang === 'en' ? 'Valid class code (min 6 chars) is required' : 'Kode kelas valid (min 6 karakter) wajib diisi');
          setShowModal(true);
          return;
        }
        
        setLoading(true);
        const { data, error } = await supabase
          .from('active_sessions')
          .select('class_code')
          .eq('class_code', classCode.trim().toUpperCase())
          .eq('is_active', true)
          .maybeSingle();
        setLoading(false);
        
        if (error || !data) {
          setModalTitle(appLang === 'en' ? 'Warning' : 'Peringatan');
          setModalMsg(appLang === 'en' ? 'Room Code not found or session ended' : 'Kode Ruangan tidak ditemukan atau sesi telah berakhir');
          setShowModal(true);
          return;
        }
        
        setStudentStep(2);
        return;
      } else {
        if (!studentName.trim() || !studentClass.trim()) {
          setModalTitle(appLang === 'en' ? 'Warning' : 'Peringatan');
          setModalMsg(appLang === 'en' ? 'Name and Class are required' : 'Nama dan Kelas wajib diisi');
          setShowModal(true);
          return;
        }
      }
    } else {
      if (!email.trim() || !email.includes('@')) {
        setModalTitle(appLang === 'en' ? 'Warning' : 'Peringatan');
        setModalMsg(appLang === 'en' ? 'Valid email is required' : 'Email valid wajib diisi');
        setShowModal(true);
        return;
      }
      if (!pass) {
        setModalTitle(appLang === 'en' ? 'Warning' : 'Peringatan');
        setModalMsg(appLang === 'en' ? 'Password is required' : 'Kata Sandi harus diisi');
        setShowModal(true);
        return;
      }
      if (pass.length < 6) {
        setModalTitle(appLang === 'en' ? 'Warning' : 'Peringatan');
        setModalMsg(appLang === 'en' ? 'Password must be at least 6 characters' : 'Kata Sandi minimal harus 6 karakter');
        setShowModal(true);
        return;
      }
    }
    setLoading(true);
    try {
      if (role === 'student') {
        await login('', undefined, classCode.trim(), 'student', studentName.trim(), studentClass.trim());
      } else {
        await login(email.trim(), pass, undefined, 'teacher');
      }
      setLoading(false);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setLoading(false);
      const errMsg = e.message?.toLowerCase() || '';
      if (errMsg.includes('invalid login credentials')) {
        setModalTitle(appLang === 'en' ? 'Warning' : 'Peringatan');
        setModalMsg(appLang === 'en' 
          ? 'Account unrecognized or incorrect password. Please register as a teacher first.' 
          : 'Akun tidak dikenali atau sandi salah. Silakan mendaftar sebagai guru terlebih dahulu.');
        setShowModal(true);
      } else {
        setErrorMsg(e.message || (appLang === 'en' ? 'Login failed' : 'Masuk gagal'));
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
        
        {/* Validation Modal Popup Card */}
        <Modal transparent visible={showModal} animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Animated.View style={{ 
              backgroundColor: hc ? '#1e293b' : '#ffffff', 
              borderRadius: 16, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center', 
              opacity: modalOpacity,
              transform: [{ scale: modalScale }],
              ...getCardShadow(hc, 'lg') 
            }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 24 }}>⚠️</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, marginBottom: 8 }}>{modalTitle}</Text>
              <Text style={{ fontSize: 14, color: mutedColor, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>{modalMsg}</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowModal(false)}
                style={{ backgroundColor: '#1e3a8a', paddingVertical: 12, width: '100%', borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>OK</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          {/* Logo area */}
          <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 20, gap: 12 }}>
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
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#1e3a8a', letterSpacing: 1 }}>LENTERA</Text>
              <Text style={{ fontSize: 9, fontWeight: '800', color: mutedColor, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginTop: 2 }}>
                Learning Text &{'\n'}Real-time Accessibility
              </Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 12 }}>
                {d.loginTitle} <Text style={{ fontWeight: '700' }}>{role === 'student' ? d.student : d.teacher}</Text>
              </Text>
            </View>
          </View>

          {/* Form card */}
          <View style={[{ padding: 20, gap: 16 }, cardStyle]}>
            {errorMsg ? (
              <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                {errorMsg}
              </Text>
            ) : null}
            {/* Conditional Form Fields */}
            {role === 'student' ? (
              studentStep === 1 ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{(d as any).loginClassCode || 'Kode Kelas'}</Text>
                  <TextInput
                    value={classCode}
                    onChangeText={setClassCode}
                    placeholder={(d as any).loginClassCodePlaceholder || 'Masukkan kode kelas'}
                    placeholderTextColor={mutedColor}
                    autoCapitalize="characters"
                    style={[{
                      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                      fontSize: 14, fontWeight: '700', letterSpacing: 2, textAlign: 'center',
                    }, inputStyle]}
                  />
                </View>
              ) : (
                <>
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{d.registerName}</Text>
                    <TextInput
                      value={studentName}
                      onChangeText={setStudentName}
                      placeholder={appLang === 'en' ? "E.g. Budi Santoso" : "Misal: Budi Santoso"}
                      placeholderTextColor={mutedColor}
                      style={[{
                        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                        fontSize: 14, fontWeight: '500',
                      }, inputStyle]}
                    />
                  </View>
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{d.registerClass}</Text>
                    <TextInput
                      value={studentClass}
                      onChangeText={setStudentClass}
                      placeholder={appLang === 'en' ? "E.g. XII IPA 3" : "Misal: XII IPA 3"}
                      placeholderTextColor={mutedColor}
                      style={[{
                        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                        fontSize: 14, fontWeight: '500',
                      }, inputStyle]}
                    />
                  </View>
                </>
              )
            ) : (
              <>
                {/* Email */}
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{d.loginEmail}</Text>
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
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{d.loginPass}</Text>
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
                  <View style={{ alignItems: 'flex-end', marginTop: 2 }}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/forgot-password')}>
                      <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '700' }}>
                        {appLang === 'en' ? 'Forgot Password?' : 'Lupa Kata Sandi?'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
              style={{
                width: '100%', paddingVertical: 14, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center', marginTop: 4,
                backgroundColor: loading ? 'rgba(30,58,138,0.5)' : '#1e3a8a',
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16 }}>
                  {role === 'student' && studentStep === 1 ? (appLang === 'en' ? 'Next' : 'Lanjut') : d.loginBtn}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider — atau / or */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: hc ? '#334155' : '#e2e8f0' }} />
              <Text style={{ marginHorizontal: 12, fontSize: 12, fontWeight: '600', color: mutedColor }}>{d.orDivider}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: hc ? '#334155' : '#e2e8f0' }} />
            </View>

            {/* Google Sign-In button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.9}
              style={{
                width: '100%', paddingVertical: 14, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: hc ? '#334155' : '#ffffff',
                borderWidth: 1, borderColor: hc ? '#475569' : '#e2e8f0',
                flexDirection: 'row', gap: 10,
              }}
            >
              <Text style={{ fontSize: 18 }}>G</Text>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>{d.loginWithGoogle}</Text>
            </TouchableOpacity>
          </View>

          {/* Register link - Teacher Only */}
          {role !== 'student' && (
            <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: mutedColor }}>{d.loginNoAccount} </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/register')}>
                <Text style={{ color: '#1e40af', fontWeight: '800', fontSize: 14 }}>{d.loginRegister}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

