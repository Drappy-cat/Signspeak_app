import React from 'react';
import { View, Text } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#64748b', fontSize: 16, fontWeight: '600' }}>Splash Screen Placeholder</Text>
    </View>
  );
}
