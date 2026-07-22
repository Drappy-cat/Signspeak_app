import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Easing, StatusBar, SafeAreaView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  const router = useRouter();
  const { isReady, hasOnboarded, user, needsProfileCompletion } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(15)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Radiating Light Aura Wave
  const glowWave = useRef(new Animated.Value(0.85)).current;
  const glowWaveOpacity = useRef(new Animated.Value(0.6)).current;

  // Fluid Aurora Moving Background Animation Values
  const blob1Pos = useRef(new Animated.ValueXY({ x: -40, y: -40 })).current;
  const blob1Scale = useRef(new Animated.Value(1)).current;

  const blob2Pos = useRef(new Animated.ValueXY({ x: 40, y: 60 })).current;
  const blob2Scale = useRef(new Animated.Value(1.1)).current;

  const blob3Pos = useRef(new Animated.ValueXY({ x: -20, y: 100 })).current;
  const blob3Scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // 1. Entrance Animations
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtle Continuous Pulse Effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Radiating Light Expansion Outward
    Animated.loop(
      Animated.parallel([
        Animated.timing(glowWave, {
          toValue: 1.5,
          duration: 2400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowWaveOpacity, {
          toValue: 0,
          duration: 2400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fluid Aurora Motion 1 (Diagonal Loop)
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(blob1Pos, {
            toValue: { x: 60, y: 50 },
            duration: 4800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(blob1Scale, {
            toValue: 1.3,
            duration: 4800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(blob1Pos, {
            toValue: { x: -40, y: -40 },
            duration: 4800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(blob1Scale, {
            toValue: 1,
            duration: 4800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Fluid Aurora Motion 2 (Opposing Arc)
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(blob2Pos, {
            toValue: { x: -60, y: -50 },
            duration: 5500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(blob2Scale, {
            toValue: 0.85,
            duration: 5500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(blob2Pos, {
            toValue: { x: 40, y: 60 },
            duration: 5500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(blob2Scale, {
            toValue: 1.1,
            duration: 5500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Fluid Aurora Motion 3 (Vertical Wave)
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(blob3Pos, {
            toValue: { x: 40, y: -70 },
            duration: 6200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(blob3Scale, {
            toValue: 1.35,
            duration: 6200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(blob3Pos, {
            toValue: { x: -20, y: 100 },
            duration: 6200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(blob3Scale, {
            toValue: 0.95,
            duration: 6200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 2. Minimum display time flag
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // 3. Perform redirection once both minimum splash animation time has passed and AuthContext is ready
  useEffect(() => {
    if (!minTimePassed || !isReady) return;

    if (!hasOnboarded) {
      router.replace('/onboarding');
    } else if (!user) {
      router.replace('/(auth)/role-select');
    } else if (needsProfileCompletion) {
      router.replace('/(auth)/complete-profile' as any);
    } else {
      if (user.role === 'student') {
        router.replace('/(tabs)/live');
      } else {
        router.replace('/(tabs)/home');
      }
    }
  }, [minTimePassed, isReady, hasOnboarded, user, needsProfileCompletion]);

  return (
    <View style={{ flex: 1, backgroundColor: '#030712', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* 1. Deep Midnight Base Gradient */}
      <LinearGradient
        colors={['#030712', '#081026', '#0d1b3e', '#071329']}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Animated Fluid Moving Aurora Light Blobs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Blob 1: Top-Left Deep Electric Blue */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -60,
            left: -60,
            width: 360,
            height: 360,
            borderRadius: 180,
            backgroundColor: 'rgba(29, 78, 216, 0.55)',
            transform: [
              { translateX: blob1Pos.x },
              { translateY: blob1Pos.y },
              { scale: blob1Scale },
            ],
            ...(Platform.OS === 'web'
              ? {
                  filter: 'blur(80px)',
                  background: 'radial-gradient(circle, rgba(29,78,216,0.75) 0%, rgba(30,58,138,0.35) 60%, rgba(3,7,18,0) 100%)',
                }
              : {}),
          } as any}
        />

        {/* Blob 2: Middle-Right Vibrant Cyan Blue */}
        <Animated.View
          style={{
            position: 'absolute',
            top: '30%',
            right: -80,
            width: 380,
            height: 380,
            borderRadius: 190,
            backgroundColor: 'rgba(2, 132, 199, 0.5)',
            transform: [
              { translateX: blob2Pos.x },
              { translateY: blob2Pos.y },
              { scale: blob2Scale },
            ],
            ...(Platform.OS === 'web'
              ? {
                  filter: 'blur(90px)',
                  background: 'radial-gradient(circle, rgba(2,132,199,0.7) 0%, rgba(37,99,235,0.35) 60%, rgba(3,7,18,0) 100%)',
                }
              : {}),
          } as any}
        />

        {/* Blob 3: Bottom-Left Glowing Cobalt Blue */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: -80,
            left: -40,
            width: 420,
            height: 420,
            borderRadius: 210,
            backgroundColor: 'rgba(37, 99, 235, 0.55)',
            transform: [
              { translateX: blob3Pos.x },
              { translateY: blob3Pos.y },
              { scale: blob3Scale },
            ],
            ...(Platform.OS === 'web'
              ? {
                  filter: 'blur(100px)',
                  background: 'radial-gradient(circle, rgba(37,99,235,0.75) 0%, rgba(30,58,138,0.4) 60%, rgba(3,7,18,0) 100%)',
                }
              : {}),
          } as any}
        />
      </View>

      <SafeAreaView style={{ alignItems: 'center', justifyContent: 'space-between', height: '85%', width: '100%', paddingHorizontal: 24 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          
          {/* Logo Container with Layered Radiating Glow */}
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            
            {/* Soft Feathered Expanding Light Pulse */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 260,
                height: 260,
                borderRadius: 130,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                transform: [{ scale: glowWave }],
                opacity: glowWaveOpacity,
                ...(Platform.OS === 'web'
                  ? {
                      filter: 'blur(35px)',
                      background: 'radial-gradient(circle, rgba(59,130,246,0.28) 0%, rgba(37,99,235,0.1) 60%, rgba(3,7,18,0) 100%)',
                    }
                  : {}),
              } as any}
            />

            {/* Inner Smooth Diffuse Aura Core */}
            <View
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: 'rgba(96, 165, 250, 0.12)',
                ...(Platform.OS === 'web'
                  ? {
                      filter: 'blur(25px)',
                      background: 'radial-gradient(circle, rgba(96,165,250,0.3) 0%, rgba(37,99,235,0.1) 50%, rgba(3,7,18,0) 90%)',
                    }
                  : {}),
              } as any}
            />

            {/* Pure Logo Image (No Drop Shadow) */}
            <Animated.View
              style={{
                transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
                opacity: logoOpacity,
              }}
            >
              <Image
                source={require('../../assets/images/app-icon.png')}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* App Title & Tagline */}
          <Animated.View
            style={{
              alignItems: 'center',
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            }}
          >
            <Text
              style={{
                fontSize: 40,
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: 1.5,
                textAlign: 'center',
              }}
            >
              Lentera
            </Text>

            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#93c5fd',
                marginTop: 8,
                textAlign: 'center',
                letterSpacing: 0.5,
                maxWidth: 290,
                lineHeight: 20,
              }}
            >
              Learning Text and Real-time Accessibility
            </Text>
          </Animated.View>
        </View>

        {/* Footer info */}
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500', letterSpacing: 0.5, textAlign: 'center' }}>
            Versi 1.0.0 • Team Peneliti PUI Disabilitas Universitas Negeri Surabaya
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
