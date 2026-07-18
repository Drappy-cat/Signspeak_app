import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar as RNStatusBar, Animated, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Headphones } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DICT } from '../../constants/i18n';
import { getCardShadow } from '../../utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingBubbleProps {
  size: number;
  left: string;
  duration: number;
  delay: number;
  color: string;
}

function FloatingBubble({ size, left, duration, delay, color }: FloatingBubbleProps) {
  const anim = React.useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    let animation: Animated.CompositeAnimation;
    const startAnimation = () => {
      anim.setValue(0);
      animation = Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      ]);
      animation.start((result) => {
        if (result.finished) {
          startAnimation();
        }
      });
    };
    startAnimation();
    return () => {
      if (animation) animation.stop();
    };
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT + 100, -100],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 15, -15, 10, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: left as any,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: opacity,
        transform: [{ translateY }, { translateX }],
      }}
      pointerEvents="none"
    />
  );
}

function BubbleBackground({ hc }: { hc: boolean }) {
  const bubbleColor = hc ? 'rgba(96, 165, 250, 0.04)' : 'rgba(30, 58, 138, 0.07)';
  const bubbles = [
    { id: 1, size: 45, left: '8%', duration: 11000, delay: 0 },
    { id: 2, size: 75, left: '22%', duration: 15000, delay: 2000 },
    { id: 3, size: 35, left: '42%', duration: 10000, delay: 500 },
    { id: 4, size: 60, left: '58%', duration: 13000, delay: 3500 },
    { id: 5, size: 28, left: '74%', duration: 9000, delay: 1500 },
    { id: 6, size: 85, left: '88%', duration: 17000, delay: 5000 },
    { id: 7, size: 50, left: '32%', duration: 12000, delay: 2500 },
    { id: 8, size: 40, left: '68%', duration: 11000, delay: 6000 },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bubbles.map(b => (
        <FloatingBubble key={b.id} color={bubbleColor} {...b} />
      ))}
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle, role } = useAuth();
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

  const joinCardStyle = {
    backgroundColor: hc ? '#1e293b' : '#eff6ff',
    borderRadius: 12,
    ...getCardShadow(hc, 'sm'),
  };

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    
    try {
      await login(email, pass || undefined);
      setLoading(false);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      setLoading(false);
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Google login failed:', error);
    }
  };

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
        <BubbleBackground hc={hc} />
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          {/* Logo area */}
          <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 20, gap: 12 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 16,
              backgroundColor: '#1e3a8a',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
            }}>
              <Headphones size={32} color="#ffffff" />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#1e3a8a', letterSpacing: 1 }}>LENTERA</Text>
              <Text style={{ fontSize: 9, fontWeight: '800', color: mutedColor, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginTop: 2 }}>
                Learning Text &{'\n'}Real-time Accessibility
              </Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 12 }}>
                {d.loginTitle} <Text style={{ fontWeight: '700' }}>{role === 'student' ? d.student : d.teacher}</Text>
              </Text>
            </View>
          </View>

          {/* Form card */}
          <View style={[{ padding: 20, gap: 16 }, cardStyle]}>
            {/* Email */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{d.loginEmail}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="nama@sekolah.sch.id"
                placeholderTextColor={mutedColor}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[{
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                  fontSize: 14, fontWeight: '500',
                }, inputStyle]}
              />
            </View>
            {/* Password */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{d.loginPass}</Text>
              <TextInput
                value={pass}
                onChangeText={setPass}
                placeholder="••••••••"
                placeholderTextColor={mutedColor}
                secureTextEntry
                style={[{
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                  fontSize: 14, fontWeight: '500',
                }, inputStyle]}
              />
            </View>
            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={!email || loading}
              activeOpacity={0.9}
              style={{
                width: '100%', paddingVertical: 14, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center', marginTop: 4,
                backgroundColor: !email || loading ? 'rgba(30,58,138,0.5)' : '#1e3a8a',
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16 }}>{d.loginBtn}</Text>
              )}
            </TouchableOpacity>

            {/* Divider — atau / or */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: hc ? '#334155' : '#e2e8f0' }} />
              <Text style={{ marginHorizontal: 12, fontSize: 12, fontWeight: '600', color: mutedColor }}>{d.orDivider}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: hc ? '#334155' : '#e2e8f0' }} />
            </View>

            {/* Google Sign-In button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.9}
              style={{
                width: '100%', paddingVertical: 14, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: hc ? '#334155' : '#ffffff',
                borderWidth: 1, borderColor: hc ? '#475569' : '#e2e8f0',
                flexDirection: 'row', gap: 10,
              }}
            >
              <Text style={{ fontSize: 18 }}>G</Text>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>{d.loginWithGoogle}</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: mutedColor }}>{d.loginNoAccount} </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={{ color: '#1e40af', fontWeight: '800', fontSize: 14 }}>{d.loginRegister}</Text>
            </TouchableOpacity>
          </View>

          {/* Join by code card */}
          <View style={[{ marginTop: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, joinCardStyle]}>
            <View style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: '#1e3a8a',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>#</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: hc ? '#e2e8f0' : '#1e3a8a' }}>{d.loginJoinCode}</Text>
              <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }} numberOfLines={1}>{d.loginJoinCodeSub}</Text>
            </View>
          </View>

          <View style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

