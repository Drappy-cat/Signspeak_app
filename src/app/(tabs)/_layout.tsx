import { Tabs } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Home, BookOpen, Settings, Mic, Radio } from 'lucide-react-native';

export default function TabLayout() {
  const { role } = useAuth();
  const { settings } = useSettings();
  const isTeacher = role === 'teacher';
  
  const hc = settings.highContrast;
  const navBg = hc ? '#1e293b' : '#ffffff'; // bg-slate-800 : bg-white
  const border = hc ? '#334155' : '#e2e8f0'; // border-slate-700 : border-slate-200
  const activeColor = hc ? '#60a5fa' : '#1e3a8a'; // text-blue-400 : text-blue-900
  const inactiveColor = hc ? '#64748b' : '#94a3b8'; // text-slate-500 : text-slate-400

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: navBg,
          borderTopColor: border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontFamily: 'Nunito-ExtraBold',
          fontWeight: '900',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: isTeacher ? 'Sesi' : 'Live',
          tabBarIcon: ({ color }) => isTeacher ? <Mic size={22} color={color} /> : <Radio size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
          href: isTeacher ? null : '/(tabs)/history',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: isTeacher ? 'Pengaturan' : 'Atur',
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
