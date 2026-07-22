import { Tabs } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Home, BookOpen, Settings, Mic, Radio } from 'lucide-react-native';
import { Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DICT } from '../../constants/i18n';

export default function TabLayout() {
  const { role } = useAuth();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const isTeacher = role === 'teacher';
  
  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const navBg = hc ? '#1e293b' : '#ffffff'; // bg-slate-800 : bg-white
  const border = hc ? '#334155' : '#e2e8f0'; // border-slate-700 : border-slate-200
  const activeColor = hc ? '#60a5fa' : '#1e3a8a'; // text-blue-400 : text-blue-900
  const inactiveColor = hc ? '#64748b' : '#94a3b8'; // text-slate-500 : text-slate-400

  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 12) : (insets.bottom || 8);
  const navHeight = 58 + bottomPadding;

  return (
    <Tabs
      // @ts-ignore
      sceneContainerStyle={{ backgroundColor: hc ? '#0f172a' : '#F0F7FF' }}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarStyle: role === 'student' ? { display: 'none' } : {
          backgroundColor: navBg,
          borderTopColor: border,
          borderTopWidth: 1,
          height: navHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontFamily: 'Nunito-ExtraBold',
          fontWeight: '900',
          fontSize: 10,
        },
        tabBarButton: (props: any) => (
          <Pressable 
            {...props} 
            style={[props.style, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]} 
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: d.home,
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          href: isTeacher ? '/(tabs)/home' : null,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: isTeacher ? d.session : d.live,
          tabBarIcon: ({ color }) => isTeacher ? <Mic size={22} color={color} /> : <Radio size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: d.history,
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
          href: '/(tabs)/history',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: isTeacher ? d.settingsTitle : d.settings,
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
          href: isTeacher ? '/(tabs)/settings' : null,
        }}
      />
    </Tabs>
  );
}
