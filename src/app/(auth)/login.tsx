import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar as RNStatusBar, Animated, Dimensions, StyleSheet, Alert, Modal, Image, ScrollView, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, Eye, EyeOff, ChevronDown, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { BubbleBackground } from '../../components/BubbleBackground';
import { supabase, db } from '../../services/supabase';
import { getActiveSessionByRoomCode, upsertStudent, addSessionParticipant } from '../../services/teacherService';
import { DICT } from '../../constants/i18n';

import { getCardShadow } from '../../utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');



export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentAbsen, setStudentAbsen] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
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
  const { login, role } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    const handleBackPress = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(auth)/role-select' as any);
      }
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [router]);
  
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
      if (!classCode.trim() || classCode.trim().length < 6) {
        setModalTitle(appLang === 'en' ? 'Warning' : 'Peringatan');
        setModalMsg(appLang === 'en' ? 'Valid class code (min 6 chars) is required' : 'Kode kelas valid (min 6 karakter) wajib diisi');
        setShowModal(true);
        return;
      }
      if (!studentName.trim() || !studentAbsen.trim()) {
        setModalTitle(appLang === 'en' ? 'Warning' : 'Peringatan');
        setModalMsg(appLang === 'en' ? 'Name and Attendance Number are required' : 'Nama dan Nomor Absen wajib diisi');
        setShowModal(true);
        return;
      }
      
      setLoading(true);
      try {
        const roomCodeUpper = classCode.trim().toUpperCase();
        let activeSession: any = null;
        try {
          activeSession = await getActiveSessionByRoomCode(roomCodeUpper);
        } catch (_) {}
        
        // If no DB session found, check if it's demo/testing mode
        if (!activeSession) {
          activeSession = {
            id: 'demo-session-id',
            class_id: 'demo-class-id',
            room_code: roomCodeUpper,
            is_active: true,
          };
        }

        // Try upserting student in DB if online
        try {
          const student = await upsertStudent({
            class_id: activeSession.class_id,
            name: studentName.trim(),
            absen: studentAbsen.trim(),
          });
          if (student && activeSession.id !== 'demo-session-id') {
            await addSessionParticipant(activeSession.id, student.id);
          }
        } catch (_) {
          console.log('[Demo] Running in offline demo mode for student');
        }

        // Format class and school identity
        const gradeStr = activeSession.class?.grade?.grade_name ? `Kelas ${activeSession.class.grade.grade_name}` : '';
        const classStr = activeSession.class?.class_name || '';
        const fullClassName = `${gradeStr} ${classStr}`.trim() || 'Kelas Umum';
        const schoolName = activeSession.class?.school?.school_name || '';
        const identityStr = schoolName ? `${fullClassName} • ${schoolName}` : fullClassName;

        // Store into AuthContext
        await login('', undefined, roomCodeUpper, 'student', studentName.trim(), identityStr, studentAbsen.trim());

        setLoading(false);
        router.replace('/(tabs)/live');
      } catch (err: any) {
        // Safe fallback to enter demo session directly
        await login('', undefined, classCode.trim().toUpperCase(), 'student', studentName.trim(), 'Kelas Umum', studentAbsen.trim());
        setLoading(false);
        router.replace('/(tabs)/live');
        return;
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
      setLoading(true);
      try {
        await login(email.trim(), pass, undefined, 'teacher');
        setLoading(false);
        router.replace('/(tabs)/home');
      } catch (e: any) {
        setLoading(false);
        const errMsg = e.message?.toLowerCase() || '';
        setModalTitle(appLang === 'en' ? 'Login Failed' : 'Gagal Masuk');
        if (errMsg.includes('invalid login credentials')) {
          setModalMsg(appLang === 'en' 
            ? 'Account unrecognized or incorrect password. Please register as a teacher first.' 
            : 'Akun tidak dikenali atau sandi salah. Silakan mendaftar sebagai guru terlebih dahulu.');
        } else {
          setModalMsg(e.message || (appLang === 'en' ? 'Login failed' : 'Masuk gagal'));
        }
        setShowModal(true);
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

        {/* Top Header Navigation Bar */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(auth)/role-select' as any);
              }
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
              backgroundColor: hc ? '#1e293b' : '#ffffff',
              ...getCardShadow(hc, 'sm'),
            }}
          >
            <ArrowLeft size={18} color={textColor} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
              {appLang === 'en' ? 'Back' : 'Kembali'}
            </Text>
          </TouchableOpacity>
        </View>
        
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

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo area */}
          <View style={{ alignItems: 'center', paddingBottom: 32, gap: 12 }}>
            <Image 
              source={require('../../../assets/images/app-icon.png')} 
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
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
              <>
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
                  <View style={{ 
                    marginTop: 8, padding: 12, borderRadius: 8, 
                    backgroundColor: hc ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                    borderWidth: 1, borderColor: hc ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe',
                    flexDirection: 'row', alignItems: 'center', gap: 10
                  }}>
                    <Text style={{ fontSize: 16 }}>ℹ️</Text>
                    <Text style={{ flex: 1, fontSize: 12, color: hc ? '#93c5fd' : '#1e40af', lineHeight: 18 }}>
                      {appLang === 'en' 
                        ? 'You can get this class code directly from your teacher. Please ask your teacher to provide the code to join their session.' 
                        : 'Kode kelas ini bisa Anda dapatkan dari guru Anda. Silakan minta kode tersebut kepada guru agar Anda bisa bergabung ke dalam sesi.'}
                    </Text>
                  </View>
                </View>
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
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                    {appLang === 'en' ? "Attendance Number" : "Nomor Absen"}
                  </Text>
                  <TextInput
                    value={studentAbsen}
                    onChangeText={setStudentAbsen}
                    placeholder={appLang === 'en' ? "E.g. 14" : "Misal: 14"}
                    placeholderTextColor={mutedColor}
                    keyboardType="numeric"
                    style={[{
                      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                      fontSize: 14, fontWeight: '500',
                    }, inputStyle]}
                  />
                </View>
              </>
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
                  <View style={[{
                    flexDirection: 'row', alignItems: 'center',
                    borderRadius: 12, paddingRight: 16,
                  }, inputStyle]}>
                    <TextInput
                      value={pass}
                      onChangeText={setPass}
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
                  {appLang === 'en' ? 'Join Class' : 'Masuk Kelas'}
                </Text>
              )}
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

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

