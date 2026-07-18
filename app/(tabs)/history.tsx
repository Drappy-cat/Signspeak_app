import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Clock, Share as ShareIcon, Trash2, ArrowLeft } from 'lucide-react-native';
import { getHistory, deleteSession, SessionRecord } from '../../src/services/db';
import { formatDuration } from '../../src/utils/formatters';

export default function HistoryScreen() {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getHistory();
    setHistory(data);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    await deleteSession(id);
    await loadHistory();
  };

  const handleShare = async (item: SessionRecord) => {
    try {
      await Share.share({
        message: `Transkrip ${item.subject} - ${item.className}\nTanggal: ${item.date}\n\n${item.transcriptFull || item.excerpt}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text>Memuat riwayat...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-6 pt-12 pb-4 bg-white border-b border-slate-100">
        <Text className="text-slate-900 text-2xl font-black">Riwayat</Text>
        <Text className="text-slate-500 text-sm mt-1">Transkrip sesi yang telah selesai</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {history.length === 0 ? (
          <View className="items-center justify-center py-12">
            <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4">
              <FileText size={32} color="#94a3b8" />
            </View>
            <Text className="text-slate-900 font-bold text-lg mb-2">Belum ada riwayat</Text>
            <Text className="text-slate-500 text-center px-8">
              Sesi yang telah diselesaikan akan muncul di sini.
            </Text>
          </View>
        ) : (
          <View className="space-y-4 pb-10">
            {history.map((item) => (
              <View key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-slate-900 font-black text-lg">{item.subject}</Text>
                    <Text className="text-slate-500 text-sm">{item.className} • {item.teacherName}</Text>
                  </View>
                  <View className="bg-blue-50 px-2 py-1 rounded-lg flex-row items-center">
                    <Clock size={12} color="#3b82f6" />
                    <Text className="text-blue-600 text-xs font-bold ml-1">{formatDuration(item.duration)}</Text>
                  </View>
                </View>
                
                <Text className="text-slate-700 leading-relaxed mb-4" numberOfLines={3}>
                  {item.excerpt}
                </Text>
                
                <View className="flex-row justify-between items-center pt-4 border-t border-slate-100">
                  <Text className="text-slate-400 text-xs font-bold">{item.date}</Text>
                  <View className="flex-row space-x-4">
                    <TouchableOpacity onPress={() => handleShare(item)} className="p-1">
                      <ShareIcon size={20} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-1">
                      <Trash2 size={20} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
