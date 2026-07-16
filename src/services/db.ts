import * as SQLite from 'expo-sqlite';
import { DEMO_HISTORY } from '../constants/keywords';

// We use SQLite.openDatabaseSync as recommended in SDK 50+ / expo-sqlite 13+
let db: SQLite.SQLiteDatabase | null = null;

export const initDb = async () => {
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
    
    // Check if empty, then seed with demo data
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
            demo.excerpt // Just use excerpt as full transcript for demo
          ]);
        }
      } finally {
        await statement.finalizeAsync();
      }
    }
  }
  return db;
};

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

export const getHistory = async (): Promise<SessionRecord[]> => {
  const database = await initDb();
  return await database.getAllAsync<SessionRecord>('SELECT * FROM sessions ORDER BY id DESC');
};

export const getSessionById = async (id: number): Promise<SessionRecord | null> => {
  const database = await initDb();
  return await database.getFirstAsync<SessionRecord>('SELECT * FROM sessions WHERE id = ?', [id]);
};

export const saveSession = async (session: Omit<SessionRecord, 'id'>): Promise<number> => {
  const database = await initDb();
  const result = await database.runAsync(
    'INSERT INTO sessions (subject, className, teacherName, date, duration, wordCount, language, excerpt, transcriptFull) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [session.subject, session.className, session.teacherName, session.date, session.duration, session.wordCount, session.language, session.excerpt, session.transcriptFull || session.excerpt]
  );
  return result.lastInsertRowId;
};

export const deleteSession = async (id: number): Promise<void> => {
  const database = await initDb();
  await database.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
};

export const clearHistory = async (): Promise<void> => {
  const database = await initDb();
  await database.runAsync('DELETE FROM sessions');
};
