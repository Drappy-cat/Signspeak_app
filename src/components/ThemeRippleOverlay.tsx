<<<<<<< HEAD
import React, { useEffect, useRef } from 'react';
=======
import React, { useEffect, useRef, useState } from 'react';
>>>>>>> e2c34fcc91365a5e3df58344c5915bb47b7932a5
import { View, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
<<<<<<< HEAD
const RIPPLE_SIZE = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2.2;
=======
const RIPPLE_SIZE = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2.5;
>>>>>>> e2c34fcc91365a5e3df58344c5915bb47b7932a5

export function ThemeRippleOverlay({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const hc = settings.highContrast;

<<<<<<< HEAD
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
=======
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
>>>>>>> e2c34fcc91365a5e3df58344c5915bb47b7932a5
  );
}
