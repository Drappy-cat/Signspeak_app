import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { DEMO_HISTORY } from '../constants/keywords';

export interface SessionRecord {
  id: number;
  subject: string;
  className: string;
  teacherName: string;
  date: string;
  duration: number;
  wordCount: number;
  language: string;
  excerpt: string;
  transcriptFull?: string;
}

// In-memory mock for Web since expo-sqlite requires native modules
let webMockDb: SessionRecord[] = [];
let isWebMockInitialized = false;

let db: SQLite.SQLiteDatabase | null = null;

export const initDb = async () => {
  if (Platform.OS === 'web') {
    if (!isWebMockInitialized) {
      console.log('Initializing Web Mock DB with demo data...');
      webMockDb = DEMO_HISTORY.map((demo, index) => ({
        ...demo,
        id: index + 1,
        transcriptFull: demo.excerpt
      }));
      isWebMockInitialized = true;
    }
    return null; // Return null for web, handled in functions below
  }

  if (!db) {
    db = await SQLite.openDatabaseAsync('signspeak.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        className TEXT,
        teacherName TEXT,
        date TEXT,
        duration INTEGER,
        wordCount INTEGER,
        language TEXT,
        excerpt TEXT,
        transcriptFull TEXT
      );
    `);
    
    const countResult = await db.getAllAsync<{ 'COUNT(*)': number }>('SELECT COUNT(*) FROM sessions');
    const count = countResult[0]['COUNT(*)'];
    
    if (count === 0) {
      console.log('Seeding demo history data...');
      const statement = await db.prepareAsync(
        'INSERT INTO sessions (subject, className, teacherName, date, duration, wordCount, language, excerpt, transcriptFull) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)'
      );
      
      try {
        for (const demo of DEMO_HISTORY) {
          await statement.executeAsync([
            demo.subject,
            demo.className,
            demo.teacherName,
            demo.date,
            demo.duration,
            demo.wordCount,
            demo.language,
            demo.excerpt,
            demo.excerpt
          ]);
        }
      } finally {
        await statement.finalizeAsync();
      }
    }
  }
  return db;
};

export const getHistory = async (): Promise<SessionRecord[]> => {
  await initDb();
  if (Platform.OS === 'web') {
    return [...webMockDb].sort((a, b) => b.id - a.id);
  }
  return await db!.getAllAsync<SessionRecord>('SELECT * FROM sessions ORDER BY id DESC');
};

export const getSessionById = async (id: number): Promise<SessionRecord | null> => {
  await initDb();
  if (Platform.OS === 'web') {
    return webMockDb.find(s => s.id === id) || null;
  }
  return await db!.getFirstAsync<SessionRecord>('SELECT * FROM sessions WHERE id = ?', [id]);
};

export const saveSession = async (session: Omit<SessionRecord, 'id'>): Promise<number> => {
  await initDb();
  if (Platform.OS === 'web') {
    const newId = webMockDb.length > 0 ? Math.max(...webMockDb.map(s => s.id)) + 1 : 1;
    webMockDb.push({ ...session, id: newId });
    return newId;
  }
  const result = await db!.runAsync(
    'INSERT INTO sessions (subject, className, teacherName, date, duration, wordCount, language, excerpt, transcriptFull) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [session.subject, session.className, session.teacherName, session.date, session.duration, session.wordCount, session.language, session.excerpt, session.transcriptFull || session.excerpt]
  );
  return result.lastInsertRowId;
};

export const deleteSession = async (id: number): Promise<void> => {
  await initDb();
  if (Platform.OS === 'web') {
    webMockDb = webMockDb.filter(s => s.id !== id);
    return;
  }
  await db!.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
};

export const clearHistory = async (): Promise<void> => {
  await initDb();
  if (Platform.OS === 'web') {
    webMockDb = [];
    return;
  }
  await db!.runAsync('DELETE FROM sessions');
};
