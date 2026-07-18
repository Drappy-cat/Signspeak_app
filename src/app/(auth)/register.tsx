import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar as RNStatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DICT } from '../../constants/i18n';
import { getCardShadow } from '../../utils/formatters';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [school, setSchool] = useState('');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherNip, setTeacherNip] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();
  const { register, loginWithGoogle, role } = useAuth();
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

  const handleRegister = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg(appLang === 'en' ? 'Full Name is required' : 'Nama Lengkap wajib diisi');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(appLang === 'en' ? 'Valid Email is required' : 'Email valid wajib diisi');
      return;
    }
    if (pass.length < 6) {
      setErrorMsg(appLang === 'en' ? 'Password must be at least 6 characters' : 'Kata Sandi minimal harus 6 karakter');
      return;
    }
    if (!school.trim()) {
      setErrorMsg(appLang === 'en' ? 'School Name is required' : 'Nama Sekolah wajib diisi');
      return;
    }
    if (role === 'student' && !className.trim()) {
      setErrorMsg(appLang === 'en' ? 'Class Name is required' : 'Nama Kelas wajib diisi');
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), pass, school.trim(), className.trim());
      setLoading(false);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setLoading(false);
      setErrorMsg(e.message || (appLang === 'en' ? 'Registration failed' : 'Pendaftaran gagal'));
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Google register failed:', error);
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
                {d.registerTitle} <Text style={{ fontWeight: '800' }}>{role === 'student' ? d.student : d.teacher}</Text>
              </Text>
            </View>
          </View>

          {/* Form card */}
          <View style={[{ padding: 20, gap: 12 }, cardStyle]}>
            {errorMsg ? (
              <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                {errorMsg}
              </Text>
            ) : null}

            {/* Nama Lengkap */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{d.registerName}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Budi Santoso"
                placeholderTextColor={mutedColor}
                style={[{
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                  fontSize: 14, fontWeight: '500',
                }, inputStyle]}
              />
            </View>

            {/* Email */}
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

            {/* Password */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{d.loginPass}</Text>
              <TextInput
                value={pass}
                onChangeText={setPass}
                placeholder="••••••••"
                placeholderTextColor={mutedColor}
                secureTextEntry
                style={[{
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                  fontSize: 14, fontWeight: '500',
                }, inputStyle]}
              />
            </View>

            {/* Nama Sekolah */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{d.registerSchool}</Text>
              <TextInput
                value={school}
                onChangeText={setSchool}
                placeholder="SMAN 1 Surabaya"
                placeholderTextColor={mutedColor}
                style={[{
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                  fontSize: 14, fontWeight: '500',
                }, inputStyle]}
              />
            </View>

            {/* Nama Kelas — Khusus Siswa */}
            {role === 'student' ? (
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{d.registerClass}</Text>
                <TextInput
                  value={className}
                  onChangeText={setClassName}
                  placeholder="XII IPA 3"
                  placeholderTextColor={mutedColor}
                  style={[{
                    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                    fontSize: 14, fontWeight: '500',
                  }, inputStyle]}
                />
              </View>
            ) : null}

            {/* Mata Pelajaran — Khusus Guru (opsional) */}
            {role === 'teacher' ? (
              <>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{d.teacherSubject}</Text>
                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Matematika"
                    placeholderTextColor={mutedColor}
                    style={[{
                      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                      fontSize: 14, fontWeight: '500',
                    }, inputStyle]}
                  />
                </View>
                {/* NIP / ID Guru — opsional */}
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{d.teacherNip}</Text>
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
              </>
            ) : null}

            {/* Register button */}
            <TouchableOpacity
              onPress={handleRegister}
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
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>{d.registerBtn}</Text>
              )}
            </TouchableOpacity>

            {/* Divider — atau / or */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: hc ? '#334155' : '#e2e8f0' }} />
              <Text style={{ marginHorizontal: 12, fontSize: 12, fontWeight: '600', color: mutedColor }}>{d.orDivider}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: hc ? '#334155' : '#e2e8f0' }} />
            </View>

            {/* Google Sign-Up button */}
            <TouchableOpacity
              onPress={handleGoogleRegister}
              disabled={loading}
              activeOpacity={0.9}
              style={{
                width: '100%', paddingVertical: 12, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: hc ? '#334155' : '#ffffff',
                borderWidth: 1, borderColor: hc ? '#475569' : '#e2e8f0',
                flexDirection: 'row', gap: 10,
              }}
            >
              <Text style={{ fontSize: 18 }}>G</Text>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>{d.registerWithGoogle}</Text>
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: mutedColor }}>{d.registerHasAccount} </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
              <Text style={{ color: '#1e40af', fontWeight: '800', fontSize: 14 }}>{d.registerLogin}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
