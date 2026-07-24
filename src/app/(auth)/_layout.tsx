import { Stack } from 'expo-router';
import { useSettings } from '../../contexts/SettingsContext';

export default function AuthLayout() {
  const { settings } = useSettings();
  const hc = settings.highContrast;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: hc ? '#0f172a' : '#F0F7FF' },
      }}
    >
      <Stack.Screen name="role-select" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="update-password" />
    </Stack>
  );
}
