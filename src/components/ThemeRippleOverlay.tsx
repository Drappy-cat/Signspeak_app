import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

export function ThemeRippleOverlay({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const hc = settings.highContrast;

  const [prevHc, setPrevHc] = useState(hc);
  const colorAnim = useRef(new Animated.Value(hc ? 1 : 0)).current;
  const veilOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prevHc !== hc) {
      setPrevHc(hc);

      // Instantly set veil to full opacity to hide the UI snap
      veilOpacity.setValue(1);

      Animated.parallel([
        // Smoothly transition the background color
        Animated.timing(colorAnim, {
          toValue: hc ? 1 : 0,
          duration: 600,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: false,
        }),
        // Fade out the veil to smoothly reveal the new theme
        Animated.timing(veilOpacity, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hc, prevHc, colorAnim, veilOpacity]);

  const animatedBgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0F7FF', '#0f172a'],
  });

  // The veil uses the target background color to cushion the transition
  const veilColor = hc ? '#0f172a' : '#F0F7FF';

  return (
    <Animated.View style={{ flex: 1, backgroundColor: animatedBgColor, position: 'relative' }}>
      {/* Children Content */}
      <View style={{ flex: 1, zIndex: 1 }}>
        {children}
      </View>

      {/* Full-screen Fade Veil to create a smooth fade-in effect */}
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
