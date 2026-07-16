import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, LogIn } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, role } = useAuth();

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    
    // Simulate network delay
    setTimeout(async () => {
      await login(email);
      setLoading(false);
      router.replace('/(tabs)/home');
    }, 800);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-900"
    >
      <View className="px-6 pt-12 pb-6">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mb-8"
        >
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>

        <Text className="text-white text-3xl font-black mb-2">
          Masuk
        </Text>
        <Text className="text-white/60 text-base mb-8">
          Silakan masuk ke akun {role === 'teacher' ? 'Guru' : 'Siswa'} Anda
        </Text>

        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-white/70 text-sm font-bold mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="nama@sekolah.id"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white font-semibold text-base"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={!email || loading}
          className={`py-4 rounded-xl flex-row items-center justify-center space-x-2 ${!email || loading ? 'bg-blue-600/50' : 'bg-blue-600'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <LogIn size={20} color="#ffffff" />
              <Text className="text-white font-extrabold text-base ml-2">Masuk</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Text className="text-amber-400 text-xs text-center">
            Mode Offline Aktif: Anda dapat masuk dengan email apa saja untuk demonstrasi. Data hanya disimpan di perangkat ini.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
