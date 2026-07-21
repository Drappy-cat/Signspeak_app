import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isReady, hasOnboarded, user, needsProfileCompletion } = useAuth();

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/role-select" />;
  }

  if (needsProfileCompletion) {
    return <Redirect href={"/(auth)/complete-profile" as any} />;
  }

  return <Redirect href="/(tabs)/home" />;
}
