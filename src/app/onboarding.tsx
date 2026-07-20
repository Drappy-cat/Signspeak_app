import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { DICT } from '../constants/i18n';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

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

  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  const slides = [
    {
      colors: ['#13388e', '#13388e'] as const,
      image: require('../assets/images/ob1.jpg'),
      title: d.obTitle1,
      sub: d.obSub1,
    },
    {
      colors: ['#13388e', '#13388e'] as const,
      image: require('../assets/images/ob2.jpg'),
      title: d.obTitle2,
      sub: d.obSub2,
    },
    {
      colors: ['#13388e', '#13388e'] as const,
      image: require('../assets/images/ob3.jpg'),
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
    <View style={{ flex: 1, backgroundColor: s.colors[0] }}>
      <LangToggle />

      <Animated.Image
        key={slide}
        source={s.image}
        entering={FadeInDown.duration(320).springify()}
        exiting={FadeOutUp.duration(320)}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        resizeMode="stretch"
      />

      <View style={{ position: 'absolute', bottom: 16, width: '100%', paddingHorizontal: 32, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
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
            width: '100%', backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 99,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
          }}
          activeOpacity={0.95}
        >
          <Text style={{ color: '#13388e', fontWeight: '900', fontSize: 16 }}>
            {isLast ? d.obStart : d.obNext}
          </Text>
          {!isLast && <ArrowRight size={18} color="#13388e" />}
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleDone} style={{ paddingVertical: 8 }} activeOpacity={0.6}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', fontWeight: '600' }}>
              {d.obSkip}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, textAlign: 'center', marginTop: 6 }}>
          © Team Peneliti PUI Disabilitas Universitas Negeri Surabaya
        </Text>
      </View>
    </View>
  );
}
