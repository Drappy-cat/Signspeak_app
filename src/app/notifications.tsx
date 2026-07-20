import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '../contexts/SettingsContext';
import { DICT } from '../constants/i18n';
import { getCardShadow } from '../utils/formatters';
import { ArrowLeft, Bell, Trash2, Mic, Users, BookOpen, ChevronRight, Check } from 'lucide-react-native';
import { getNotifications, saveNotifications, clearAllNotifications, AppNotification } from '../services/notificationService';

export default function NotificationsScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const bgColor = hc ? '#0f172a' : '#F0F7FF';
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';
  const iconColor = hc ? '#60a5fa' : '#1e40af';
  const cardBg = hc ? '#1e293b' : '#ffffff';

  useEffect(() => {
    loadNotifs();
  }, []);

  const loadNotifs = async () => {
    const list = await getNotifications();
    setNotifications(list);
  };

  const handleClearAll = async () => {
    Alert.alert(
      appLang === 'en' ? 'Clear All' : 'Hapus Semua',
      appLang === 'en' 
        ? 'Are you sure you want to clear all notifications?' 
        : 'Apakah Anda yakin ingin menghapus semua notifikasi?',
      [
        { text: appLang === 'en' ? 'Cancel' : 'Batal', style: 'cancel' },
        {
          text: appLang === 'en' ? 'Delete' : 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await clearAllNotifications();
            setNotifications([]);
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (item: AppNotification) => {
    // Mark as read
    const updated = notifications.map(n => n.id === item.id ? { ...n, read: true } : n);
    setNotifications(updated);
    await saveNotifications(updated);

    // Navigation logic based on notification type
    if (item.type === 'live_session') {
      // Directs to live transcription view
      router.push('/(tabs)/live');
    } else if (item.type === 'history_ready') {
      // Directs to history list view
      router.push('/(tabs)/history');
    }
  };

  const getIcon = (type: string) => {
    const size = 18;
    const color = iconColor;
    if (type === 'live_session') return <Mic size={size} color={color} />;
    if (type === 'no_students') return <Users size={size} color={color} />;
    return <BookOpen size={size} color={color} />;
  };

  const formatTimeLabel = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) {
      return appLang === 'en' ? `${diffMins}m ago` : `${diffMins} mnt lalu`;
    }
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
      return appLang === 'en' ? `${diffHours}h ago` : `${diffHours} jam lalu`;
    }
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return appLang === 'en' ? `${diffDays}d ago` : `${diffDays} hari lalu`;
  };

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/home');
              }
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: cardBg,
              alignItems: 'center',
              justifyContent: 'center',
              ...getCardShadow(hc, 'sm'),
            }}
          >
            <ArrowLeft size={20} color={textColor} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '900', color: textColor }}>
            {appLang === 'en' ? 'Notifications' : 'Notifikasi'}
          </Text>
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClearAll}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: cardBg,
              alignItems: 'center',
              justifyContent: 'center',
              ...getCardShadow(hc, 'sm'),
            }}
          >
            <Trash2 size={18} color={hc ? '#f87171' : '#dc2626'} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: hc ? '#1e293b' : '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              ...getCardShadow(hc, 'md'),
            }}>
              <Bell size={26} color={mutedColor} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: textColor, textAlign: 'center' }}>
              {appLang === 'en' ? 'All caught up!' : 'Tidak Ada Notifikasi'}
            </Text>
            <Text style={{ fontSize: 12, color: mutedColor, textAlign: 'center', marginTop: 6, lineHeight: 18, maxWidth: 220 }}>
              {appLang === 'en'
                ? 'Check back later for class live alerts or archives.'
                : 'Pemberitahuan sesi live atau arsip riwayat kelas Anda akan muncul di sini.'}
            </Text>
          </View>
        ) : (
          notifications.map((item) => {
            const isClickable = item.type === 'live_session' || item.type === 'history_ready';
            
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={isClickable ? 0.8 : 1}
                disabled={!isClickable}
                onPress={() => handleNotificationPress(item)}
                style={[
                  {
                    backgroundColor: cardBg,
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                    borderWidth: hc ? 1 : 0,
                    borderColor: hc ? '#334155' : 'transparent',
                    opacity: item.read ? 0.75 : 1,
                  },
                  getCardShadow(hc, item.read ? 'sm' : 'md'),
                ]}
              >
                {/* Status Indicator */}
                {!item.read && (
                  <View style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#ef4444',
                  }} />
                )}

                {/* Left Icon Container */}
                <View style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: hc ? '#1e3a8a' : '#eff6ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {getIcon(item.type)}
                </View>

                {/* Content */}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: item.read ? '700' : '900', color: textColor }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: item.read ? mutedColor : textColor, lineHeight: 18 }}>
                    {item.body}
                  </Text>
                  <Text style={{ fontSize: 10, color: mutedColor, marginTop: 4 }}>
                    {formatTimeLabel(item.timestamp)}
                  </Text>
                </View>

                {/* Right Arrow if clickable */}
                {isClickable && (
                  <View style={{ alignSelf: 'center' }}>
                    <ChevronRight size={16} color={mutedColor} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
