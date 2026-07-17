import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
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
  const textMain = hc ? "text-white" : "text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 shadow-sm shadow-slate-200/50";
  const inpBg = hc ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200";
  const inpText = hc ? "text-white" : "text-slate-900";
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const joinCard = hc ? "bg-slate-800 border-slate-700" : "bg-blue-50 border-blue-100 shadow-sm shadow-slate-200/50";
  const joinTitle = hc ? "text-slate-200" : "text-blue-900";

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
      <View className="flex-1 px-6">
        <View className="items-center pt-16 pb-6 gap-3">
          <View className="w-16 h-16 rounded-2xl bg-blue-900 items-center justify-center shadow-lg shadow-blue-900/20">
            <Headphones size={32} color="#ffffff" />
          </View>
          <View className="items-center">
            <Text className="text-xl font-black text-blue-900">SignSpeak</Text>
            <Text className={`text-xs ${muted} mt-0.5`}>
              Masuk sebagai <Text className="font-bold">{role === 'student' ? 'Siswa' : 'Guru'}</Text>
            </Text>
          </View>
        </View>

        <View className={`rounded-2xl border p-5 flex-col gap-4 shadow-sm shadow-black/5 ${card}`}>
          <View className="flex-col gap-1.5">
            <Text className={`text-sm font-bold ${textMain}`}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="nama@sekolah.sch.id"
              placeholderTextColor={hc ? "#64748b" : "#94a3b8"}
              keyboardType="email-address"
              autoCapitalize="none"
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${inpBg} ${inpText}`}
            />
          </View>
          <View className="flex-col gap-1.5">
            <Text className={`text-sm font-bold ${textMain}`}>Kata Sandi</Text>
            <TextInput
              value={pass}
              onChangeText={setPass}
              placeholder="••••••••"
              placeholderTextColor={hc ? "#64748b" : "#94a3b8"}
              secureTextEntry
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${inpBg} ${inpText}`}
            />
          </View>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={!email || loading}
            activeOpacity={0.9}
            className={`w-full py-3.5 rounded-xl mt-1 items-center justify-center ${!email || loading ? 'bg-blue-900/50' : 'bg-blue-900'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-extrabold text-base">Masuk</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-4 flex-row justify-center items-center">
          <Text className={`text-sm ${muted}`}>Belum punya akun? </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleLogin}>
            <Text className="text-blue-800 font-extrabold text-sm">Daftar Gratis</Text>
          </TouchableOpacity>
        </View>

        <View className={`mt-4 rounded-xl border p-3 flex-row items-center gap-3 ${joinCard}`}>
          <View className="w-8 h-8 rounded-lg bg-blue-900 items-center justify-center">
            <Text className="text-white text-xs font-black">#</Text>
          </View>
          <View>
            <Text className={`text-xs font-bold ${joinTitle}`}>Bergabung via Kode Kelas</Text>
            <Text className={`text-[11px] ${muted} mt-0.5`}>Masukkan kode dari guru tanpa perlu daftar</Text>
          </View>
        </View>

        <View className="flex-1" />
      </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
