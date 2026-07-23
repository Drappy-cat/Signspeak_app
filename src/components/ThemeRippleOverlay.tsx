import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const RIPPLE_SIZE = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2.2;

export function ThemeRippleOverlay({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const hc = settings.highContrast;

  const [prevHc, setPrevHc] = useState(hc);
  const colorAnim = useRef(new Animated.Value(hc ? 1 : 0)).current;
  const veilOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prevHc !== hc) {
      setPrevHc(hc);

      // Reset values for smooth shock-absorbing transition
      rippleScale.setValue(0.1);
      rippleOpacity.setValue(0.4);

      // Smooth 2-phase crossfade sequence:
      // Phase 1: Soft veil gently cushions the eyes (120ms)
      // Phase 2: Screen background and glow smoothly dissolve into the new theme (550ms)
      Animated.parallel([
        Animated.timing(colorAnim, {
          toValue: hc ? 1 : 0,
          duration: 650,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(veilOpacity, {
            toValue: 0.18,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(veilOpacity, {
            toValue: 0,
            duration: 530,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rippleScale, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hc, prevHc, colorAnim, veilOpacity, rippleScale, rippleOpacity]);

  const animatedBgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0F7FF', '#0f172a'],
  });

  const veilColor = hc ? '#0f172a' : '#ffffff';
  const rippleColor = hc ? 'rgba(59, 130, 246, 0.3)' : 'rgba(219, 234, 254, 0.5)';

  return (
    <Animated.View style={{ flex: 1, backgroundColor: animatedBgColor, position: 'relative' }}>
      {/* Background Ambient Soft Ripple (BEHIND children so text is NEVER covered) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: RIPPLE_SIZE,
            height: RIPPLE_SIZE,
            marginTop: -RIPPLE_SIZE / 2,
            marginLeft: -RIPPLE_SIZE / 2,
            borderRadius: RIPPLE_SIZE / 2,
            backgroundColor: rippleColor,
            transform: [{ scale: rippleScale }],
            opacity: rippleOpacity,
          }}
        />
      </View>

      {/* Children Content */}
      <View style={{ flex: 1, zIndex: 1 }}>
        {children}
      </View>

      {/* Soft Ambient Eye-Cushioning Veil (Low opacity crossfade to prevent eye shock) */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: veilColor,
            opacity: veilOpacity,
            zIndex: 10,
          },
        ]}
      />
    </Animated.View>
  );
}
