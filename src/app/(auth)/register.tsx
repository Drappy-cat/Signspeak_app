import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar as RNStatusBar, ScrollView, Image, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DICT } from '../../constants/i18n';

import { getCardShadow } from '../../utils/formatters';
import PinModal from '../../components/PinModal';

import { SchoolPicker, GradePicker, ClassPicker, SubjectPicker } from '../../components/Pickers';
import { createTeacherProfile, assignTeacherToClasses, assignTeacherToSubjects, createCustomSubject } from '../../services/teacherService';
import type { School, Grade, Class, Subject, SchoolType } from '../../types/database';

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const totalSteps = 4; // 1: Akun, 2: Sekolah, 3: Kelas, 4: Mapel

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [teacherNip, setTeacherNip] = useState('');

  // Relational State
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Class[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const router = useRouter();
  const { register, role, login, refreshUser } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    const handleBackPress = () => {
      if (step > 1) {
        setStep(prev => prev - 1);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(auth)/login' as any);
      }
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [step, router]);

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

  // ── Langkah 1: Validasi Akun ───────────────────────────────────────────────
  const handleNextStep1 = () => {
    setErrorMsg('');
    if (!name.trim()) return setErrorMsg('Nama Lengkap wajib diisi');
    if (!email.trim() || !email.includes('@')) return setErrorMsg('Email valid wajib diisi');
    if (pass.length < 6) return setErrorMsg('Kata Sandi minimal 6 karakter');
    
    if (role === 'teacher') {
      setShowPinModal(true);
      return;
    }
    
    // Siswa langsung daftar (hanya 1 step)
    if (role === 'student') {
      handleStudentRegister();
      return;
    }
    setStep(2);
  };

  // ── Pendaftaran Siswa ──────────────────────────────────────────────────────
  const handleStudentRegister = async () => {
    setLoading(true);
    try {
      // Siswa hanya menyimpan data login ke async storage (mengikuti flow lama yang simpel)
      await login(email, undefined, undefined, 'student', name, undefined, undefined);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setErrorMsg(e.message || 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };

  // ── Langkah 2: Validasi Sekolah ────────────────────────────────────────────
  const handleNextStep2 = () => {
    setErrorMsg('');
    if (!selectedSchool) return setErrorMsg('Silakan pilih atau daftarkan sekolah');
    setStep(3);
  };

  // ── Langkah 3: Validasi Kelas ──────────────────────────────────────────────
  const handleNextStep3 = () => {
    setErrorMsg('');
    if (selectedClasses.length === 0) return setErrorMsg('Silakan pilih minimal 1 kelas');
    setStep(4);
  };

  // ── Langkah 4: Submit Final ────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    setErrorMsg('');
    if (selectedSubjects.length === 0) return setErrorMsg('Silakan pilih minimal 1 mata pelajaran');

    setLoading(true);
    try {
      // 1. Buat user di Supabase Auth
      const { id: authUserId, email: registeredEmail } = await register(name.trim(), email.trim(), pass);
      
      // 2. Buat profil teacher (Relasi utama)
      const teacher = await createTeacherProfile({
        auth_user_id: authUserId,
        school_id: selectedSchool!.id,
        full_name: name.trim(),
        email: registeredEmail,
        nip: teacherNip.trim() || null,
      });

      // 3. Assign kelas (Mendukung guru multi-kelas)
      await assignTeacherToClasses(teacher.id, selectedClasses.map(c => c.id));

      // 3.5. Simpan mapel kustom sementara ke database
      const finalSubjectIds: string[] = [];
      for (const s of selectedSubjects) {
        if (s.id.startsWith('temp-')) {
          const newSubj = await createCustomSubject(s.subject_name, authUserId);
          finalSubjectIds.push(newSubj.id);
        } else {
          finalSubjectIds.push(s.id);
        }
      }

      // 4. Assign mapel (Mendukung guru multi-mapel)
      await assignTeacherToSubjects(teacher.id, finalSubjectIds);

      // 5. Update AuthContext agar merefleksikan perubahan di UI (Akan mengarahkan otomatis kalau isReady)
      await login(email.trim(), pass, undefined, 'teacher');
      
      router.replace('/(tabs)/home');
    } catch (e: any) {
      console.error('Final Submit Error:', e);
      setErrorMsg(e.message || 'Pendaftaran gagal');
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Header Back Button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingBottom: 8, justifyContent: 'space-between' }}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => {
                if (step > 1 && role === 'teacher') setStep(step - 1);
                else if (router.canGoBack()) router.back();
                else router.replace('/(auth)/login');
              }}
              style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: hc ? '#1e293b' : '#ffffff',
                alignItems: 'center', justifyContent: 'center',
                ...getCardShadow(hc, 'sm'),
              }}
            >
              <ArrowLeft size={20} color={textColor} />
            </TouchableOpacity>

            {role === 'teacher' && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3, 4].map(s => (
                  <View
                    key={s}
                    style={{
                      width: s === step ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: s <= step ? '#1e3a8a' : (hc ? '#334155' : '#cbd5e1'),
                    }}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Logo area */}
          {step === 1 && (
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 16, gap: 8 }}>
              <Image 
                source={require('../../../assets/images/app-icon.png')} 
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#1e3a8a', letterSpacing: 0.5 }}>LENTERA</Text>
                <Text style={{ fontSize: 12, color: mutedColor, marginTop: 4, fontWeight: '600' }}>
                  {d.registerTitle} <Text style={{ fontWeight: '800' }}>{role === 'student' ? d.student : d.teacher}</Text>
                </Text>
              </View>
            </View>
          )}
          
          {step > 1 && (
            <View style={{ paddingVertical: 12, paddingBottom: 20 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: textColor }}>
                {step === 2 && 'Pilih Sekolah'}
                {step === 3 && 'Pilih Kelas'}
                {step === 4 && 'Pilih Mapel'}
              </Text>
              <Text style={{ fontSize: 13, color: mutedColor, marginTop: 4 }}>
                {step === 2 && 'Dimana Anda mengajar? Anda bisa membuat sekolah baru.'}
                {step === 3 && 'Tentukan kelas yang Anda ampu.'}
                {step === 4 && 'Mata pelajaran apa saja yang Anda ajarkan?'}
              </Text>
            </View>
          )}

          {/* Form card */}
          <View style={[{ padding: 20, gap: 16 }, cardStyle]}>
            {errorMsg ? (
              <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                {errorMsg}
              </Text>
            ) : null}

            {/* STEP 1: Akun */}
            {step === 1 && (
              <>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                    {role === 'teacher' ? 'Nama Lengkap beserta Gelar' : d.registerName}
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={role === 'teacher' ? "Budi Santoso, S.Pd." : "Budi Santoso"}
                    placeholderTextColor={mutedColor}
                    style={[{
                      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                      fontSize: 14, fontWeight: '500',
                    }, inputStyle]}
                  />
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{d.loginEmail}</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nama@sekolah.sch.id"
                    placeholderTextColor={mutedColor}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[{
                      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                      fontSize: 14, fontWeight: '500',
                    }, inputStyle]}
                  />
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{d.loginPass}</Text>
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
                        flex: 1, paddingHorizontal: 16, paddingVertical: 10,
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

                {role === 'teacher' && (
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>NIP / ID Guru (Opsional)</Text>
                    <TextInput
                      value={teacherNip}
                      onChangeText={setTeacherNip}
                      placeholder="19850501201903001"
                      placeholderTextColor={mutedColor}
                      style={[{
                        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                        fontSize: 14, fontWeight: '500',
                      }, inputStyle]}
                    />
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleNextStep1}
                  disabled={loading}
                  activeOpacity={0.9}
                  style={{
                    width: '100%', paddingVertical: 12, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center', marginTop: 8,
                    backgroundColor: loading ? 'rgba(30,58,138,0.5)' : '#1e3a8a',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>
                      {role === 'student' ? d.registerBtn : 'Lanjut'}
                    </Text>
                  )}
                </TouchableOpacity>


              </>
            )}

            {/* STEP 2: Sekolah */}
            {step === 2 && (
              <>
                <SchoolPicker 
                  selectedSchool={selectedSchool}
                  onSelectSchool={setSelectedSchool}
                  hc={hc}
                  appLang={appLang}
                />
                <TouchableOpacity
                  onPress={handleNextStep2}
                  disabled={!selectedSchool}
                  activeOpacity={0.9}
                  style={{
                    width: '100%', paddingVertical: 12, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center', marginTop: 16,
                    backgroundColor: !selectedSchool ? '#94a3b8' : '#1e3a8a',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Lanjut</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3: Tingkat & Kelas */}
            {step === 3 && (
              <>
                <GradePicker 
                  schoolType={selectedSchool?.school_type || null}
                  selectedGrade={selectedGrade}
                  onSelectGrade={setSelectedGrade}
                  hc={hc}
                  appLang={appLang}
                />

                {selectedGrade && (
                  <View style={{ marginTop: 8 }}>
                    <ClassPicker 
                      schoolId={selectedSchool?.id || null}
                      gradeId={selectedGrade.id}
                      selectedClassIds={selectedClasses.map(c => c.id)}
                      onSelectClasses={setSelectedClasses}
                      hc={hc}
                      appLang={appLang}
                    />
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleNextStep3}
                  disabled={selectedClasses.length === 0}
                  activeOpacity={0.9}
                  style={{
                    width: '100%', paddingVertical: 12, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center', marginTop: 16,
                    backgroundColor: selectedClasses.length === 0 ? '#94a3b8' : '#1e3a8a',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Lanjut</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 4: Mata Pelajaran */}
            {step === 4 && (
              <>
                <SubjectPicker 
                  selectedSubjectIds={selectedSubjects.map(s => s.id)}
                  onSelectSubjects={setSelectedSubjects}
                  hc={hc}
                  appLang={appLang}
                />

                <TouchableOpacity
                  onPress={handleFinalSubmit}
                  disabled={selectedSubjects.length === 0 || loading}
                  activeOpacity={0.9}
                  style={{
                    width: '100%', paddingVertical: 12, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center', marginTop: 16,
                    backgroundColor: (selectedSubjects.length === 0 || loading) ? '#94a3b8' : '#1e3a8a',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Selesaikan Pendaftaran</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

          </View>

          {/* Login link */}
          {step === 1 && (
            <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: mutedColor }}>{d.registerHasAccount} </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace('/(auth)/login')}>
                <Text style={{ color: '#1e40af', fontWeight: '800', fontSize: 14 }}>{d.registerLogin}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <PinModal 
        visible={showPinModal} 
        onClose={() => setShowPinModal(false)} 
        onSuccess={() => {
          setShowPinModal(false);
          setStep(2);
        }} 
      />
    </KeyboardAvoidingView>
  );
}
