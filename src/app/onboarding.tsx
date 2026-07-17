import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, Mic, Users, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

const SLIDES = [
  {
    colors: ['#0c2461', '#1a3a8a'] as const,
    iconBg: 'bg-white/15',
    icon: <Headphones size={52} color="#ffffff" />,
    badge: null,
    title: 'SignSpeak',
    sub: 'Jembatan komunikasi antara suara dan teks untuk siswa berkebutuhan khusus di ruang kelas Indonesia.',
  },
  {
    colors: ['#1a3a8a', '#1e40af'] as const,
    iconBg: 'bg-emerald-500/25',
    icon: <Mic size={46} color="#6EE7B7" />,
    badge: 'Fitur Utama',
    title: 'Transkripsi Real-time',
    sub: 'Suara guru langsung berubah menjadi teks besar yang mudah dibaca — tanpa jeda, tanpa hambatan.',
  },
  {
    colors: ['#1e40af', '#1e3a8a'] as const,
    iconBg: 'bg-amber-400/25',
    icon: <Users size={46} color="#FCD34D" />,
    badge: 'Aksesibilitas',
    title: 'Dirancang untuk Semua',
    sub: 'Mode kontras tinggi, ukuran teks yang bisa disesuaikan, dan dukungan Bahasa Indonesia, Jawa, & Madura.',
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
    <LinearGradient colors={s.colors} className="flex-1">
      <View className="flex-1 items-center justify-center px-8 pt-6 gap-7">
        <Animated.View
          key={slide}
          entering={FadeInDown.duration(320).springify()}
          exiting={FadeOutUp.duration(320)}
          className="items-center gap-6"
        >
          <View className={`w-28 h-28 rounded-3xl ${s.iconBg} items-center justify-center border border-white/10`}>
            {s.icon}
          </View>
          
          {s.badge && (
            <View className="px-3 py-1 rounded-full bg-white/15">
              <Text className="text-white text-xs font-bold uppercase tracking-widest">
                {s.badge}
              </Text>
            </View>
          )}
          
          <Text className="text-white text-3xl font-black tracking-tight text-center">
            {s.title}
          </Text>
          
          <Text className="text-white/75 text-base text-center leading-relaxed max-w-[270px]">
            {s.sub}
          </Text>
        </Animated.View>
      </View>

      <View className="px-8 pb-10 flex-col gap-5">
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              className={`h-2 rounded-full bg-white ${i === slide ? 'w-[26px]' : 'w-2 opacity-30'}`}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => (isLast ? handleDone() : setSlide(slide + 1))}
          className="w-full bg-white py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg"
          activeOpacity={0.97}
        >
          <Text className="text-blue-900 font-extrabold text-base">
            {isLast ? 'Mulai Sekarang' : 'Lanjut'}
          </Text>
          <ArrowRight size={18} color="#1e3a8a" />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleDone} className="py-2" activeOpacity={0.6}>
            <Text className="text-white/40 text-sm text-center font-semibold">
              Lewati
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}
