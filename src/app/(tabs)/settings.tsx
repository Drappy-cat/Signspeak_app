import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSettings } from '../../contexts/SettingsContext';
import { FontSizeLabels, FontSizeKey, FontSizes } from '../../constants/theme';
import { LANGUAGE_LABELS } from '../../constants/keywords';
import { Type, Moon, Globe, Zap, User } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Animated, Easing, Platform } from 'react-native';

function CustomToggle({ val, onChange, hc }: { val: boolean; onChange: () => void; hc: boolean }) {
  const anim = React.useRef(new Animated.Value(val ? 22 : 2)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: val ? 22 : 2,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [val]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onChange}
      className={`w-12 h-7 rounded-full justify-center ${val ? "bg-blue-700" : hc ? "bg-slate-600" : "bg-slate-300"}`}
    >
      <Animated.View style={{ transform: [{ translateX: anim }] }} className="w-6 h-6 rounded-full bg-white shadow-sm" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const { user, logout, role } = useAuth();
  const router = useRouter();

  const hc = settings.highContrast;
  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textMain = hc ? "text-white" : "text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100 shadow-sm shadow-slate-200/50";
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const activeBtn = hc ? "bg-blue-700" : "bg-blue-900";
  const activeBtnText = "text-white";
  const inactiveBtn = hc ? "bg-slate-700" : "bg-slate-100";
  const inactiveBtnText = hc ? "text-slate-300" : "text-slate-600";
  const iconColor = hc ? "#60a5fa" : "#1e40af"; // text-blue-400 : text-blue-800
  const divider = hc ? "border-slate-700" : "border-slate-100";

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <View className="px-5 pt-3 pb-2">
        <Text className={`text-xl font-black ${textMain}`}>Aksesibilitas</Text>
        <Text className={`text-xs ${muted} mt-0.5`}>Sesuaikan tampilan sesuai kebutuhan Anda</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-2 pb-10" contentContainerStyle={{ gap: 12, flexGrow: 1 }}>
        {/* Font size */}
        <View className={`rounded-xl border p-4 ${card}`}>
          <View className="flex-row items-center gap-2 mb-3">
            <Type size={15} color={iconColor} />
            <Text className={`font-extrabold text-sm ${textMain}`}>Ukuran Teks Transkripsi</Text>
          </View>
          <View className="flex-row gap-2">
            {(Object.keys(FontSizeLabels) as FontSizeKey[]).map(s => (
              <TouchableOpacity
                key={s}
                activeOpacity={0.7}
                onPress={() => updateSettings({ fontSize: s })}
                className={`flex-1 py-2.5 rounded-xl items-center ${settings.fontSize === s ? activeBtn : inactiveBtn}`}
              >
                <Text className={`text-xs font-extrabold ${settings.fontSize === s ? activeBtnText : inactiveBtnText}`}>
                  {FontSizeLabels[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className={`mt-3 pt-3 border-t ${divider}`}>
            <Text className={`text-xs ${muted} mb-1`}>Pratinjau:</Text>
            <Text style={{ fontSize: FontSizes[settings.fontSize].transcript }} className={`font-extrabold ${textMain}`}>
              Teks Abc 123
            </Text>
          </View>
        </View>

        {/* High contrast */}
        <View className={`rounded-xl border p-4 flex-row items-center justify-between ${card}`}>
          <View className="flex-row items-center gap-3">
            <Moon size={15} color={iconColor} />
            <View>
              <Text className={`font-extrabold text-sm ${textMain}`}>Mode Kontras Tinggi</Text>
              <Text className={`text-xs ${muted} mt-0.5`}>Latar gelap untuk kenyamanan visual</Text>
            </View>
          </View>
          <CustomToggle val={hc} onChange={() => updateSettings({ highContrast: !hc })} hc={hc} />
        </View>

        {/* Language */}
        <View className={`rounded-xl border p-4 ${card}`}>
          <View className="flex-row items-center gap-2 mb-3">
            <Globe size={15} color={iconColor} />
            <Text className={`font-extrabold text-sm ${textMain}`}>Bahasa Transkripsi</Text>
          </View>
          <View className="flex-row gap-2">
            {Object.keys(LANGUAGE_LABELS).map(l => (
              <TouchableOpacity
                key={l}
                activeOpacity={0.7}
                onPress={() => updateSettings({ language: l })}
                className={`flex-1 py-2.5 rounded-xl items-center ${settings.language === l ? activeBtn : inactiveBtn}`}
              >
                <Text className={`text-xs font-extrabold ${settings.language === l ? activeBtnText : inactiveBtnText}`}>
                  {LANGUAGE_LABELS[l]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vibrate */}
        <View className={`rounded-xl border p-4 flex-row items-center justify-between ${card}`}>
          <View className="flex-row items-center gap-3">
            <Zap size={15} color={iconColor} />
            <View>
              <Text className={`font-extrabold text-sm ${textMain}`}>Indikator Getar</Text>
              <Text className={`text-xs ${muted} mt-0.5`}>Getar saat guru mulai berbicara</Text>
            </View>
          </View>
          <CustomToggle val={settings.vibrate} onChange={() => updateSettings({ vibrate: !settings.vibrate })} hc={hc} />
        </View>

        {/* Profile */}
        <View className={`rounded-xl border p-4 ${card}`}>
          <View className="flex-row items-center gap-3 mb-3">
            <View className={`w-12 h-12 rounded-full items-center justify-center ${hc ? "bg-blue-900" : "bg-blue-100"}`}>
              <User size={22} color={iconColor} />
            </View>
            <View>
              <Text className={`font-extrabold ${textMain}`}>{user?.name || "Budi Santoso"}</Text>
              <Text className={`text-xs ${muted}`}>
                {role === 'student' ? 'Siswa · XII IPA 3' : 'Guru'} · SMAN 1 Surabaya
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleLogout}
            className={`w-full py-2.5 rounded-xl items-center`}
            style={{ backgroundColor: hc ? 'rgba(127, 29, 29, 0.4)' : '#fef2f2' }}
          >
            <Text className={`text-sm font-extrabold ${hc ? "text-red-400" : "text-red-600"}`}>
              Keluar dari Akun
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
