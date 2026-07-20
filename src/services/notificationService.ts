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

// Default mock notifications to display initially so the screen is not empty
const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Sesi Kelas Live Sedang Berlangsung',
    body: 'Kelas Biologi Bu Sari Dewi sedang berlangsung untuk Room ID: BIO-4821. Bergabung sekarang!',
    timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
    type: 'live_session',
    actionData: { roomCode: 'BIO-4821' },
    read: false
  },
  {
    id: 'notif-2',
    title: 'Riwayat Sesi Baru Tersedia',
    body: 'Transkripsi sesi Biologi tanggal 19 Juli 2026 telah diarsipkan. Ketuk untuk meninjau.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    type: 'history_ready',
    actionData: { historyId: 2 },
    read: false
  },
  {
    id: 'notif-3',
    title: 'Kehadiran Siswa',
    body: 'Sesi Biologi Anda telah dimulai selama 5 menit tetapi belum ada siswa yang hadir.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    type: 'no_students',
    read: true
  },
  {
    id: 'notif-4',
    title: 'Pemberitahuan Lama',
    body: 'Ini adalah contoh notifikasi lama yang sudah lewat dari 7 hari (otomatis dibersihkan).',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 9, // 9 days ago (should be auto-cleaned on fetch)
    type: 'history_ready',
    read: true
  }
];

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    let list: AppNotification[] = raw ? JSON.parse(raw) : DEFAULT_NOTIFICATIONS;
    
    // Auto-clean: Remove notifications older than 7 days (1 week)
    const oneWeekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
    const initialLength = list.length;
    list = list.filter(n => n.timestamp >= oneWeekAgo);
    
    // Save back if changed or first load
    if (list.length !== initialLength || !raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    
    return list;
  } catch (error) {
    console.error('getNotifications error:', error);
    return [];
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
