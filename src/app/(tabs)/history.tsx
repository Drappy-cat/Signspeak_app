import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { Search, BookOpen, Clock } from 'lucide-react-native';
import { useSettings } from '../../contexts/SettingsContext';

// Using mock data to match prototype
const HISTORY_DATA = [
  { id: 1, subject: "Biologi", kelas: "XII IPA 3", teacher: "Bu Sari Dewi", date: "Hari ini, 08:00", duration: "45 mnt", words: 1240, excerpt: "...fotosintesis terjadi di dalam kloroplas pada sel tumbuhan..." },
  { id: 2, subject: "Matematika", kelas: "XII IPA 3", teacher: "Pak Budi Santoso", date: "Kemarin, 10:00", duration: "50 mnt", words: 980, excerpt: "...turunan fungsi trigonometri dan aplikasi integral..." },
  { id: 3, subject: "Fisika", kelas: "XII IPA 3", teacher: "Pak Ahmad Rizki", date: "Senin, 11:00", duration: "45 mnt", words: 1100, excerpt: "...hukum Newton tentang gerak, gaya, dan percepatan..." },
  { id: 4, subject: "Kimia", kelas: "XII IPA 3", teacher: "Bu Ratna Sari", date: "Jumat, 08:00", duration: "45 mnt", words: 890, excerpt: "...ikatan kovalen polar dan struktur Lewis molekul..." },
];

export default function HistoryScreen() {
  const { settings } = useSettings();
  const hc = settings.highContrast;

  const bg = hc ? "bg-slate-900" : "bg-[#F0F7FF]";
  const textMain = hc ? "text-white" : "text-slate-900";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const searchBg = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const iconBg = hc ? "bg-blue-900" : "bg-blue-50";
  const iconColor = hc ? "#93c5fd" : "#1d4ed8"; // text-blue-300 / text-blue-700
  const divider = hc ? "border-slate-700" : "border-slate-100";
  const linkColor = hc ? "text-blue-400" : "text-blue-800";

  return (
    <SafeAreaView className={`flex-1 ${bg}`}>
      <View className="px-5 pt-3 pb-3">
        <Text className={`text-xl font-black mb-3 ${textMain}`}>Riwayat Transkrip</Text>
        <View className={`flex-row items-center gap-2 rounded-xl border px-3 py-2.5 ${searchBg}`}>
          <Search size={15} color={hc ? "#94a3b8" : "#64748b"} />
          <TextInput 
            placeholder="Cari mata pelajaran atau kata kunci..." 
            placeholderTextColor={hc ? "#64748b" : "#94a3b8"}
            className={`flex-1 text-sm font-medium ${hc ? "text-white" : "text-slate-900"}`}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-1 pb-10" contentContainerStyle={{ gap: 12 }}>
        <Text className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>Minggu Ini</Text>
        
        {HISTORY_DATA.map(item => (
          <View key={item.id} className={`rounded-xl border ${card}`}>
            <View className="p-4 flex-row gap-3">
              <View className={`w-10 h-10 rounded-xl items-center justify-center mt-0.5 ${iconBg}`}>
                <BookOpen size={17} color={iconColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-extrabold text-sm ${textMain}`}>{item.subject}</Text>
                <Text className={`text-xs ${muted}`}>{item.teacher} · {item.kelas}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <Clock size={10} color={hc ? "#94a3b8" : "#64748b"} />
                  <Text className={`text-xs ${muted}`}>{item.date} · {item.duration}</Text>
                </View>
                <Text className={`text-xs mt-1.5 italic leading-relaxed ${hc ? "text-slate-400" : "text-slate-500"}`} numberOfLines={2}>
                  {item.excerpt}
                </Text>
              </View>
            </View>
            <View className={`mx-4 pt-2.5 pb-3 border-t flex-row items-center justify-between ${divider}`}>
              <View className="flex-row items-center gap-3">
                <Text className={`text-xs font-bold ${muted}`}>{item.words.toLocaleString("id-ID")} kata</Text>
                <View className={`w-1 h-1 rounded-full ${hc ? "bg-slate-600" : "bg-slate-300"}`} />
                <View className={`px-2 py-0.5 rounded-md ${hc ? "bg-slate-700" : "bg-emerald-50"}`}>
                  <Text className={`text-xs font-bold ${hc ? "text-slate-300" : "text-emerald-700"}`}>Selesai</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className={`text-xs font-extrabold ${linkColor}`}>Buka →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
