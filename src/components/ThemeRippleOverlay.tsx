import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const RIPPLE_SIZE = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2.5;

export function ThemeRippleOverlay({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const hc = settings.highContrast;

  const [prevHc, setPrevHc] = useState(hc);
  const [animating, setAnimating] = useState(false);
  const [targetColor, setTargetColor] = useState(hc ? '#0f172a' : '#F0F7FF');

  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (prevHc !== hc) {
      const newColor = hc ? '#0f172a' : '#F0F7FF';
      setTargetColor(newColor);
      setPrevHc(hc);
      setAnimating(true);

      rippleScale.setValue(0.05);
      rippleOpacity.setValue(0.95);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0.85,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimating(false);
      });
    }
  }, [hc, prevHc, rippleScale, rippleOpacity]);

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {children}

      {animating && (
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
              backgroundColor: targetColor,
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
            }}
          />
        </View>
      )}
    </View>
  );
}
