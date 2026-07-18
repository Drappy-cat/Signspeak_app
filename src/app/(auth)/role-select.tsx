import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { GraduationCap, Mic, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, Role } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DICT } from '../../constants/i18n';

function LangToggle() {
  const { settings, updateSettings } = useSettings();
  const appLang = settings.appLang || 'id';

  return (
    <View style={{
      position: 'absolute', top: 50, right: 20, zIndex: 50,
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
      borderRadius: 99, padding: 4,
    }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => updateSettings({ appLang: 'id' })}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
          backgroundColor: appLang === 'id' ? '#ffffff' : 'transparent',
        }}
      >
        <Text style={{ fontSize: 13 }}>🇮🇩</Text>
        <Text style={{
          fontSize: 11, fontWeight: '800',
          color: appLang === 'id' ? '#0c2461' : 'rgba(255,255,255,0.7)',
        }}>ID</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => updateSettings({ appLang: 'en' })}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
          backgroundColor: appLang === 'en' ? '#ffffff' : 'transparent',
        }}
      >
        <Text style={{ fontSize: 13 }}>🇬🇧</Text>
        <Text style={{
          fontSize: 11, fontWeight: '800',
          color: appLang === 'en' ? '#0c2461' : 'rgba(255,255,255,0.7)',
        }}>EN</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole } = useAuth();
  const { settings } = useSettings();

  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const handleSelect = async (selectedRole: Role) => {
    await setRole(selectedRole);
    router.push('/(auth)/login' as any);
  };

  return (
    <LinearGradient colors={['#0c2461', '#1a3a8a']} style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
      <LangToggle />

      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
          {d.rsWelcome}
        </Text>
        <Text style={{ color: '#ffffff', fontSize: 30, fontWeight: '900' }}>
          {d.rsIAm}
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        {/* Student Option */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => handleSelect('student')}
          style={{
            flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(59,130,246,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <GraduationCap size={30} color="#bfdbfe" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 18 }}>{d.student}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 }}>{d.rsStudentSub}</Text>
          </View>
          <ChevronRight size={18} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>

        {/* Teacher Option */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => handleSelect('teacher')}
          style={{
            flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(245,158,11,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Mic size={28} color="#fde68a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 18 }}>{d.teacher}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 }}>{d.rsTeacherSub}</Text>
          </View>
          <ChevronRight size={18} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
      </View>

      <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 32 }}>
        {d.rsFooter}
      </Text>
    </LinearGradient>
  );
}
