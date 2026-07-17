import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, Mic, Users, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useAuth } from '../src/contexts/AuthContext';

const SLIDES = [
  {
    gradient: 'bg-slate-900',
    iconBg: 'bg-white/10',
    icon: <Headphones size={52} color="#ffffff" />,
    badge: null,
    title: 'SignSpeak',
    sub: 'Jembatan komunikasi antara suara dan teks untuk siswa berkebutuhan khusus di ruang kelas Indonesia.',
  },
  {
    gradient: 'bg-blue-900',
    iconBg: 'bg-emerald-500/25',
    icon: <Mic size={46} color="#6EE7B7" />,
    badge: 'Fitur Utama',
    title: 'Transkripsi Real-time',
    sub: 'Suara guru langsung berubah menjadi teks besar yang mudah dibaca — tanpa jeda, tanpa hambatan.',
  },
  {
    gradient: 'bg-indigo-900',
    iconBg: 'bg-amber-400/25',
    icon: <Users size={46} color="#FCD34D" />,
    badge: 'Aksesibilitas',
    title: 'Dirancang untuk Semua',
    sub: 'Mode kontras tinggi, ukuran teks yang bisa disesuaikan, dan dukungan multi-bahasa daerah.',
  },
];

export default function OnboardingScreen() {
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  const { completeOnboarding } = useAuth();

  const s = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const handleDone = async () => {
    await completeOnboarding();
    router.replace('/(auth)/role-select');
  };

  return (
    <View className={`flex-1 ${s.gradient}`}>
      <View className="flex-1 items-center justify-center px-8 pt-6">
        <Animated.View
          key={slide}
          entering={FadeInDown.duration(400)}
          exiting={FadeOutUp.duration(300)}
          className="items-center"
        >
          <View className={`w-28 h-28 rounded-3xl ${s.iconBg} items-center justify-center border border-white/10 mb-6`}>
            {s.icon}
          </View>
          
          {s.badge && (
            <View className="px-3 py-1 rounded-full bg-white/15 mb-4">
              <Text className="text-white text-xs font-bold uppercase tracking-widest">
                {s.badge}
              </Text>
            </View>
          )}
          
          <Text className="text-white text-3xl font-black mb-4 text-center">
            {s.title}
          </Text>
          
          <Text className="text-white/75 text-base text-center leading-relaxed">
            {s.sub}
          </Text>
        </Animated.View>
      </View>

      <View className="px-8 pb-12 w-full">
        <View className="flex-row justify-center space-x-2 mb-8">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => (isLast ? handleDone() : setSlide(slide + 1))}
          className="w-full bg-white py-4 rounded-2xl flex-row items-center justify-center space-x-2 mb-4"
          activeOpacity={0.8}
        >
          <Text className="text-blue-900 font-extrabold text-base">
            {isLast ? 'Mulai Sekarang' : 'Lanjut'}
          </Text>
          <ArrowRight size={20} color="#1e3a8a" />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleDone} className="py-2" activeOpacity={0.6}>
            <Text className="text-white/50 text-sm text-center font-bold">
              Lewati
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
