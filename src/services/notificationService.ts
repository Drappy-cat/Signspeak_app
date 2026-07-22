import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number; // epoch ms
  type: 'live_session' | 'no_students' | 'history_ready';
  actionData?: any; // e.g. roomCode, historyId, etc.
  read: boolean;
}

const STORAGE_KEY = '@lentera/notifications';

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    let list: AppNotification[] = raw ? JSON.parse(raw) : [];
    
    // Auto-clean: Remove notifications older than 7 days (1 week)
    const oneWeekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
    const initialLength = list.length;
    list = list.filter(n => n.timestamp >= oneWeekAgo);
    
    // Save back if cleaned or first time
    if (list.length !== initialLength || !raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    
    return list;
  } catch (error) {
    console.error('getNotifications error:', error);
    return [];
  }
}

export async function addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
  try {
    const current = await getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      read: false,
    };
    const updated = [newNotif, ...current];
    await saveNotifications(updated);
  } catch (error) {
    console.error('addNotification error:', error);
  }
}

export async function saveNotifications(notifications: AppNotification[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('saveNotifications error:', error);
  }
}

export async function clearAllNotifications(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('clearAllNotifications error:', error);
  }
}
