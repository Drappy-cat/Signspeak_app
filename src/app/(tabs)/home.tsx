import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/SessionContext';
import { Mic, BookOpen, Clock, Users, Play, LogOut, ChevronRight } from 'lucide-react-native';
import { DEMO_CLASSES, DEMO_HISTORY } from '../../constants/keywords';

export default function HomeScreen() {
  const { user, role, logout } = useAuth();
  const { session, startSession } = useSession();
  const router = useRouter();

  // For Student
  const [classCode, setClassCode] = useState('');

  const handleJoinClass = () => {
    // Mock join
    router.push('/(tabs)/live');
  };

  const handleStartSession = (className: string, subject: string) => {
    startSession(className, subject, 'id');
    router.push('/(tabs)/live');
  };

  const StudentHome = () => (
    <ScrollView className="flex-1 px-6 pt-12 pb-6">
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-slate-500 text-sm font-bold mb-1">Selamat Datang,</Text>
          <Text className="text-slate-900 text-2xl font-black">{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout} className="p-2 bg-slate-100 rounded-full">
          <LogOut size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View className="bg-blue-600 rounded-3xl p-6 shadow-sm mb-8">
        <Text className="text-white/80 text-sm font-bold mb-2">Sesi Live Saat Ini</Text>
        <Text className="text-white text-xl font-black mb-6">Gabung ke Kelas</Text>
        
        <View className="flex-row items-center bg-white/20 rounded-2xl p-2 mb-4">
          <TextInput
            value={classCode}
            onChangeText={setClassCode}
            placeholder="Kode Kelas (Mis. BIO-123)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCapitalize="characters"
            className="flex-1 text-white px-4 font-bold"
          />
        </View>
        
        <TouchableOpacity 
          onPress={handleJoinClass}
          className="bg-white py-4 rounded-xl items-center"
        >
          <Text className="text-blue-600 font-extrabold text-base">Gabung Sekarang</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-end mb-4">
        <Text className="text-slate-900 text-lg font-extrabold">Baru Saja Diikuti</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
          <Text className="text-blue-600 text-sm font-bold">Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        {DEMO_HISTORY.slice(0, 2).map((item, index) => (
          <TouchableOpacity 
            key={index}
            className="flex-row items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100"
          >
            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-4">
              <BookOpen size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-base">{item.subject}</Text>
              <Text className="text-slate-500 text-xs mt-1">{item.teacherName} • {item.date}</Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const TeacherHome = () => (
    <ScrollView className="flex-1 px-6 pt-12 pb-6">
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-slate-500 text-sm font-bold mb-1">Dashboard Guru,</Text>
          <Text className="text-slate-900 text-2xl font-black">{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout} className="p-2 bg-slate-100 rounded-full">
          <LogOut size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View className="bg-slate-900 rounded-3xl p-6 shadow-sm mb-8">
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center mr-4">
            <Mic size={24} color="#60A5FA" />
          </View>
          <View>
            <Text className="text-white text-lg font-black">Transkripsi Instan</Text>
            <Text className="text-white/60 text-sm">Mulai tanpa jadwal kelas</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={() => handleStartSession('Umum', 'Sesi Umum')}
          className="bg-blue-600 py-4 rounded-xl items-center flex-row justify-center space-x-2"
        >
          <Play size={18} color="white" fill="white" />
          <Text className="text-white font-extrabold text-base ml-2">Mulai Bicara</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-slate-900 text-lg font-extrabold mb-4">Kelas Anda</Text>

      <View className="space-y-4">
        {DEMO_CLASSES.map((cls, index) => (
          <View 
            key={index}
            className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 flex-row items-center"
          >
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-slate-900 font-black text-lg mr-2">{cls.name}</Text>
                {cls.active && (
                  <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Text className="text-emerald-700 text-[10px] font-bold">Sedang Mulai</Text>
                  </View>
                )}
              </View>
              <Text className="text-slate-500 text-sm mb-3">{cls.subject}</Text>
              
              <View className="flex-row items-center">
                <Users size={14} color="#94a3b8" />
                <Text className="text-slate-500 text-xs ml-1 font-bold">{cls.students} Siswa</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={() => handleStartSession(cls.name, cls.subject)}
              className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center"
            >
              <Play size={20} color="#3b82f6" fill="#3b82f6" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      {role === 'teacher' ? <TeacherHome /> : <StudentHome />}
    </KeyboardAvoidingView>
  );
}
