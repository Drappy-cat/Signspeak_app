import React from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

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

export function BubbleBackground({ hc }: { hc: boolean }) {
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
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {bubbles.map(b => (
        <FloatingBubble key={b.id} color={bubbleColor} {...b} />
      ))}
    </View>
  );
}
