import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { GraduationCap, Mic, ChevronRight } from 'lucide-react-native';
import { useAuth, Role } from '../../src/contexts/AuthContext';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole } = useAuth();

  const handleSelect = async (selectedRole: Role) => {
    await setRole(selectedRole);
    router.push('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-slate-900 px-6 justify-center">
      <View className="items-center mb-10">
        <Text className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">
          Selamat Datang
        </Text>
        <Text className="text-white text-3xl font-black">
          Saya adalah...
        </Text>
      </View>

      <View className="space-y-4">
        {/* Student Option */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSelect('student')}
          className="flex-row items-center p-5 rounded-2xl bg-white/10 border border-white/10"
        >
          <View className="w-14 h-14 rounded-2xl bg-blue-500/20 items-center justify-center mr-4">
            <GraduationCap size={30} color="#93C5FD" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-extrabold text-lg">Siswa</Text>
            <Text className="text-white/60 text-sm mt-1">Terima transkripsi live di kelas</Text>
          </View>
          <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        {/* Teacher Option */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSelect('teacher')}
          className="flex-row items-center p-5 rounded-2xl bg-white/10 border border-white/10"
        >
          <View className="w-14 h-14 rounded-2xl bg-amber-500/20 items-center justify-center mr-4">
            <Mic size={30} color="#FCD34D" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-extrabold text-lg">Guru / Pengajar</Text>
            <Text className="text-white/60 text-sm mt-1">Mulai sesi & transkripsi suara</Text>
          </View>
          <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
      </View>

      <Text className="text-center text-white/30 text-xs mt-10">
        Peran dapat diubah kapan saja di Pengaturan
      </Text>
    </View>
  );
}
