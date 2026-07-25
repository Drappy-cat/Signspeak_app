import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { db } from './supabase';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number; // epoch ms
  type: 'live_session' | 'no_students' | 'history_ready' | 'student_left';
  actionData?: any; // e.g. roomCode, historyId, etc.
  read: boolean;
}

const STORAGE_KEY = '@lentera/notifications_read_ids';
const CLEARED_KEY = '@lentera/notifications_cleared_ids';
const CUSTOM_NOTIFS_KEY = '@lentera/notifications_custom';

// Configure how notifications appear when app is in foreground
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.warn('[Notifications] Handler set failed:', e);
  }
}

/**
 * Mendaftarkan ijin push notification pada HP (Android/iOS) dan membuat Channel Notifikasi Android
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted for push notifications.');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifikasi LENTERA',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1e3a8a',
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined).catch(() => null);
    return tokenData ? tokenData.data : null;
  } catch (error) {
    console.warn('[Notifications] Error requesting push permissions:', error);
    return null;
  }
}

/**
 * Memicu Notifikasi Lokal di Perangkat HP (Banner & Swiping Notif HP)
 */
export async function triggerDevicePushNotification(title: string, body: string, data?: any): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // trigger immediately
    });
  } catch (e) {
    console.warn('[Notifications] Failed to trigger device push notification:', e);
  }
}

export async function getNotifications(teacherId?: string): Promise<AppNotification[]> {
  try {
    const rawReadIds = await AsyncStorage.getItem(STORAGE_KEY);
    const readIds: string[] = rawReadIds ? JSON.parse(rawReadIds) : [];
    
    const rawClearedIds = await AsyncStorage.getItem(CLEARED_KEY);
    const clearedIds: string[] = rawClearedIds ? JSON.parse(rawClearedIds) : [];

    const notifications: AppNotification[] = [];

    // 0. Load local custom notifications (e.g. student_left, live_session alerts)
    try {
      const rawCustom = await AsyncStorage.getItem(CUSTOM_NOTIFS_KEY);
      if (rawCustom) {
        const customNotifs: AppNotification[] = JSON.parse(rawCustom);
        for (const cn of customNotifs) {
          if (!clearedIds.includes(cn.id)) {
            notifications.push({
              ...cn,
              read: readIds.includes(cn.id),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load custom notifications:', e);
    }

    // 1. Fetch active live sessions from Supabase
    try {
      let liveQuery = db
        .from('live_sessions')
        .select('*, teacher:teachers(full_name)')
        .eq('is_active', true);

      if (teacherId) {
        liveQuery = liveQuery.eq('teacher_id', teacherId);
      }

      const { data: liveData, error: liveError } = await liveQuery;
      
      if (!liveError && liveData && liveData.length > 0) {
        for (const session of liveData) {
          const notifId = `live-${session.id}`;
          if (!clearedIds.includes(notifId)) {
            notifications.push({
              id: notifId,
              title: 'Sesi Kelas Live Sedang Berlangsung',
              body: `Sesi ${session.room_code} sedang aktif. Ketuk untuk masuk ke ruang kelas live.`,
              timestamp: new Date(session.created_at || Date.now()).getTime(),
              type: 'live_session',
              actionData: { roomCode: session.room_code },
              read: readIds.includes(notifId),
            });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live_sessions for notifications:', err);
    }

    // 2. Fetch completed session history from Supabase
    try {
      let histQuery = db
        .from('session_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (teacherId) {
        histQuery = histQuery.eq('teacher_id', teacherId);
      }

      const { data: histData, error: histError } = await histQuery;

      if (!histError && histData && histData.length > 0) {
        for (const hist of histData) {
          const notifId = `hist-${hist.id}`;
          if (!clearedIds.includes(notifId)) {
            notifications.push({
              id: notifId,
              title: 'Riwayat Sesi Baru Tersedia',
              body: `Transkripsi sesi ${hist.subject_display || 'Kelas'} (${hist.class_display || '-'}) telah diarsipkan.`,
              timestamp: new Date(hist.created_at || hist.session_date).getTime(),
              type: 'history_ready',
              actionData: { historyId: hist.id },
              read: readIds.includes(notifId),
            });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch session_history for notifications:', err);
    }

    // Sort by timestamp descending
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    return notifications;
  } catch (error) {
    console.error('getNotifications error:', error);
    return [];
  }
}

export async function addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
  try {
    const rawCustom = await AsyncStorage.getItem(CUSTOM_NOTIFS_KEY);
    const existingCustom: AppNotification[] = rawCustom ? JSON.parse(rawCustom) : [];

    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      read: false,
    };

    // Trigger Native Push Notification on phone
    await triggerDevicePushNotification(newNotif.title, newNotif.body, newNotif.actionData);

    // Keep max 30 custom notifications
    const updatedCustom = [newNotif, ...existingCustom].slice(0, 30);
    await AsyncStorage.setItem(CUSTOM_NOTIFS_KEY, JSON.stringify(updatedCustom));
  } catch (error) {
    console.error('addNotification error:', error);
  }
}

export async function saveNotifications(notifications: AppNotification[]): Promise<void> {
  try {
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
  } catch (error) {
    console.error('saveNotifications error:', error);
  }
}

export async function clearAllNotifications(notifIds?: string[]): Promise<void> {
  try {
    if (notifIds && notifIds.length > 0) {
      const rawClearedIds = await AsyncStorage.getItem(CLEARED_KEY);
      const clearedIds: string[] = rawClearedIds ? JSON.parse(rawClearedIds) : [];
      const updated = Array.from(new Set([...clearedIds, ...notifIds]));
      await AsyncStorage.setItem(CLEARED_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('clearAllNotifications error:', error);
  }
}

