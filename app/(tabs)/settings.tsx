import React from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useSettings } from '../../src/contexts/SettingsContext';
import { FontSizeLabels, FontSizeKey } from '../../src/constants/theme';
import { LANGUAGE_LABELS } from '../../src/constants/keywords';
import { Type, Moon, Globe, LogOut, Check } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const { logout, role } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  const OptionSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <View className="mb-6">
      <View className="flex-row items-center mb-4 px-2">
        {icon}
        <Text className="text-slate-900 font-extrabold text-base ml-2">{title}</Text>
      </View>
      <View className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        {children}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-6 pt-12 pb-4 bg-white border-b border-slate-100 mb-4">
        <Text className="text-slate-900 text-2xl font-black">Pengaturan</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <OptionSection title="Tampilan" icon={<Type size={20} color="#3b82f6" />}>
          <View className="p-4 border-b border-slate-100 flex-row justify-between items-center">
            <View>
              <Text className="text-slate-900 font-bold text-base mb-1">Ukuran Teks</Text>
              <Text className="text-slate-500 text-sm">Sesuaikan ukuran teks transkripsi</Text>
            </View>
            <View className="flex-row items-center bg-slate-100 rounded-lg p-1">
              {(Object.keys(FontSizeLabels) as FontSizeKey[]).map(key => (
                <TouchableOpacity
                  key={key}
                  onPress={() => updateSettings({ fontSize: key })}
                  className={`px-3 py-1.5 rounded-md ${settings.fontSize === key ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`font-bold ${settings.fontSize === key ? 'text-blue-600' : 'text-slate-500'}`}>
                    {FontSizeLabels[key]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View className="p-4 flex-row justify-between items-center">
            <View>
              <Text className="text-slate-900 font-bold text-base mb-1">Mode Kontras Tinggi</Text>
              <Text className="text-slate-500 text-sm">Warna lebih jelas untuk dibaca</Text>
            </View>
            <Switch
              value={settings.highContrast}
              onValueChange={(val) => updateSettings({ highContrast: val })}
              trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </OptionSection>

        <OptionSection title="Bahasa Daerah" icon={<Globe size={20} color="#10b981" />}>
          {Object.keys(LANGUAGE_LABELS).map((key, index) => (
            <TouchableOpacity
              key={key}
              onPress={() => updateSettings({ language: key })}
              className={`p-4 flex-row justify-between items-center ${
                index !== Object.keys(LANGUAGE_LABELS).length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <Text className="text-slate-900 font-bold text-base">{LANGUAGE_LABELS[key]}</Text>
              {settings.language === key && <Check size={20} color="#3b82f6" />}
            </TouchableOpacity>
          ))}
        </OptionSection>

        <TouchableOpacity 
          onPress={handleLogout}
          className="mt-4 mb-10 bg-red-50 py-4 rounded-xl flex-row items-center justify-center border border-red-100"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 font-extrabold text-base ml-2">Keluar Akun ({role === 'teacher' ? 'Guru' : 'Siswa'})</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
