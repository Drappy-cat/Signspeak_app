import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './supabase';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number; // epoch ms
  type: 'live_session' | 'no_students' | 'history_ready';
  actionData?: any; // e.g. roomCode, historyId, etc.
  read: boolean;
}

const STORAGE_KEY = '@lentera/notifications_read_ids';
const CLEARED_KEY = '@lentera/notifications_cleared_ids';

export async function getNotifications(teacherId?: string): Promise<AppNotification[]> {
  try {
    const rawReadIds = await AsyncStorage.getItem(STORAGE_KEY);
    const readIds: string[] = rawReadIds ? JSON.parse(rawReadIds) : [];
    
    const rawClearedIds = await AsyncStorage.getItem(CLEARED_KEY);
    const clearedIds: string[] = rawClearedIds ? JSON.parse(rawClearedIds) : [];

    const notifications: AppNotification[] = [];

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
