import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones, Mic, Users, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { DICT } from '../constants/i18n';

function LangToggle() {
  const { settings, updateSettings } = useSettings();
  const appLang = settings.appLang || 'id';

  return (
    <View style={{
      position: 'absolute', top: 50, right: 20, zIndex: 50,
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
      borderRadius: 99, padding: 4,
    }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => updateSettings({ appLang: 'id' })}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
          backgroundColor: appLang === 'id' ? '#ffffff' : 'transparent',
        }}
      >
        <Text style={{ fontSize: 13 }}>🇮🇩</Text>
        <Text style={{
          fontSize: 11, fontWeight: '800',
          color: appLang === 'id' ? '#0c2461' : 'rgba(255,255,255,0.7)',
        }}>ID</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => updateSettings({ appLang: 'en' })}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
          backgroundColor: appLang === 'en' ? '#ffffff' : 'transparent',
        }}
      >
        <Text style={{ fontSize: 13 }}>🇬🇧</Text>
        <Text style={{
          fontSize: 11, fontWeight: '800',
          color: appLang === 'en' ? '#0c2461' : 'rgba(255,255,255,0.7)',
        }}>EN</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OnboardingScreen() {
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const { settings } = useSettings();

  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const slides = [
    {
      colors: ['#0c2461', '#1a3a8a'] as const,
      iconBg: 'rgba(255, 255, 255, 0.15)',
      icon: <Headphones size={52} color="#ffffff" />,
      badge: null,
      title: d.obTitle1,
      sub: d.obSub1,
    },
    {
      colors: ['#1a3a8a', '#1e40af'] as const,
      iconBg: 'rgba(16, 185, 129, 0.25)',
      icon: <Mic size={46} color="#6EE7B7" />,
      badge: d.obBadge2,
      title: d.obTitle2,
      sub: d.obSub2,
    },
    {
      colors: ['#1e40af', '#1e3a8a'] as const,
      iconBg: 'rgba(245, 158, 11, 0.25)',
      icon: <Users size={46} color="#FCD34D" />,
      badge: d.obBadge3,
      title: d.obTitle3,
      sub: d.obSub3,
    },
  ];

  const s = slides[slide];
  const isLast = slide === slides.length - 1;

  const handleDone = async () => {
    await completeOnboarding();
    router.replace('/(auth)/role-select');
  };

  return (
    <LinearGradient colors={s.colors} style={{ flex: 1 }}>
      <LangToggle />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80, gap: 28 }}>
        <Animated.View
          key={slide}
          entering={FadeInDown.duration(320).springify()}
          exiting={FadeOutUp.duration(320)}
          style={{ alignItems: 'center', gap: 24 }}
        >
          <View style={{
            width: 112, height: 112, borderRadius: 28,
            backgroundColor: s.iconBg, alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
          }}>
            {s.icon}
          </View>
          
          {s.badge && (
            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {s.badge}
              </Text>
            </View>
          )}
          
          <Text style={{ color: '#ffffff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' }}>
            {s.title}
          </Text>
          
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 270 }}>
            {s.sub}
          </Text>
        </Animated.View>
      </View>

      <View style={{ paddingHorizontal: 32, paddingBottom: 40, gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {slides.map((_, i) => (
            <Animated.View
              key={i}
              style={{
                height: 8, borderRadius: 4, backgroundColor: '#ffffff',
                width: i === slide ? 26 : 8,
                opacity: i === slide ? 1 : 0.3,
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => (isLast ? handleDone() : setSlide(slide + 1))}
          style={{
            width: '100%', backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 16,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
          }}
          activeOpacity={0.95}
        >
          <Text style={{ color: '#1e3a8a', fontWeight: '800', fontSize: 16 }}>
            {isLast ? d.obStart : d.obNext}
          </Text>
          <ArrowRight size={18} color="#1e3a8a" />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleDone} style={{ paddingVertical: 8 }} activeOpacity={0.6}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', fontWeight: '600' }}>
              {d.obSkip}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}
