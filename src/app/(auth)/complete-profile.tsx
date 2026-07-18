import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar as RNStatusBar, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, User as UserIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, type Role } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DICT } from '../../constants/i18n';
import { getCardShadow } from '../../utils/formatters';
import { saveProfilePhotoLocally, uploadProfilePhoto } from '../../services/storageService';

export default function CompleteProfileScreen() {
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherNip, setTeacherNip] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();
  const { role, completeProfile } = useAuth();
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

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg(appLang === 'en' ? 'Full Name is required' : 'Nama Lengkap wajib diisi');
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
      let finalPhotoUri: string | undefined;

      // Save photo locally (and prepare for cloud upload later)
      if (photoUri) {
        const localPath = await saveProfilePhotoLocally(photoUri, `profile-${Date.now()}`);
        finalPhotoUri = await uploadProfilePhoto(localPath, `profile-${Date.now()}`);
      }

      await completeProfile({
        name: name.trim(),
        role: role as Role,
        photoUri: finalPhotoUri,
        school: school.trim(),
        className: role === 'student' ? className.trim() : undefined,
        subject: role === 'teacher' ? subject.trim() || undefined : undefined,
        teacherId: role === 'teacher' ? teacherNip.trim() || undefined : undefined,
        isVerified: false,
      });

      setLoading(false);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setLoading(false);
      setErrorMsg(e.message || (appLang === 'en' ? 'Failed to save profile' : 'Gagal menyimpan profil'));
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
          {/* Header */}
          <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 20, gap: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1e3a8a', letterSpacing: 0.5 }}>
              {d.completeProfileTitle}
            </Text>
            <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center' }}>
              {d.completeProfileSub}
            </Text>
          </View>

          {/* Form card */}
          <View style={[{ padding: 20, gap: 16 }, cardStyle]}>
            {errorMsg ? (
              <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                {errorMsg}
              </Text>
            ) : null}

            {/* Profile Photo */}
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{d.profilePhoto}</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={pickPhoto}
                style={{
                  width: 96, height: 96, borderRadius: 48,
                  backgroundColor: hc ? '#334155' : '#f1f5f9',
                  borderWidth: 2, borderColor: hc ? '#475569' : '#e2e8f0',
                  borderStyle: 'dashed',
                  alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
                ) : (
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Camera size={24} color={mutedColor} />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: mutedColor }}>
                      {d.profilePhotoAdd}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {photoUri ? (
                <TouchableOpacity activeOpacity={0.7} onPress={pickPhoto}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e40af' }}>
                    {d.profilePhotoChange}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

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

            {/* Mata Pelajaran & NIP — Khusus Guru */}
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

            {/* Save & Continue button */}
            <TouchableOpacity
              onPress={handleComplete}
              disabled={loading}
              activeOpacity={0.9}
              style={{
                width: '100%', paddingVertical: 14, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center', marginTop: 8,
                backgroundColor: loading ? 'rgba(30,58,138,0.5)' : '#1e3a8a',
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>{d.completeProfileBtn}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
