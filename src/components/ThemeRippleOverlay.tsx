import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const RIPPLE_SIZE = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2.2;

export function ThemeRippleOverlay({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const hc = settings.highContrast;

  const colorAnim = useRef(new Animated.Value(hc ? 1 : 0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth 650ms background color transition + soft ambient background ripple
    rippleScale.setValue(0.1);
    rippleOpacity.setValue(0.35);

    Animated.parallel([
      Animated.timing(colorAnim, {
        toValue: hc ? 1 : 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
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
  }, [hc, colorAnim, rippleScale, rippleOpacity]);

  const animatedBgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0F7FF', '#0f172a'],
  });

  const rippleColor = hc ? 'rgba(59, 130, 246, 0.35)' : 'rgba(219, 234, 254, 0.6)';

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

      {/* Children content ALWAYS on top, 100% crisp, visible & non-blocked */}
      <View style={{ flex: 1, zIndex: 1 }}>
        {children}
      </View>
    </Animated.View>
  );
}
