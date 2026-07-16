import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveSession } from '../services/db';
import { useAuth } from './AuthContext';
import { getTime } from '../utils/formatters';

export interface ActiveSession {
  isActive: boolean;
  classCode: string | null;
  subject: string | null;
  language: string;
  transcript: string;
  startTime: number | null;
}

interface SessionContextType {
  session: ActiveSession;
  startSession: (classCode: string, subject: string, language: string) => void;
  endSession: () => Promise<void>;
  appendTranscript: (text: string) => void;
  updateLanguage: (language: string) => void;
}

const defaultSession: ActiveSession = {
  isActive: false,
  classCode: null,
  subject: null,
  language: 'id',
  transcript: '',
  startTime: null,
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ActiveSession>(defaultSession);
  const { user, role } = useAuth();

  const startSession = (classCode: string, subject: string, language: string) => {
    setSession({
      isActive: true,
      classCode,
      subject,
      language,
      transcript: '',
      startTime: Date.now(),
    });
  };

  const endSession = async () => {
    if (session.isActive && session.transcript.length > 0 && role === 'teacher') {
      // Save to database
      const duration = Math.floor((Date.now() - (session.startTime || Date.now())) / 1000);
      const wordCount = session.transcript.split(/\s+/).filter(w => w.length > 0).length;
      
      await saveSession({
        subject: session.subject || 'Sesi Tanpa Judul',
        className: session.classCode || 'Kelas Umum',
        teacherName: user?.name || 'Guru',
        date: \`Hari ini, \${getTime()}\`,
        duration,
        wordCount,
        language: session.language,
        excerpt: session.transcript.substring(0, 100) + (session.transcript.length > 100 ? '...' : ''),
        transcriptFull: session.transcript,
      });
    }
    
    setSession(defaultSession);
  };

  const appendTranscript = (text: string) => {
    setSession(prev => ({
      ...prev,
      transcript: prev.transcript + (prev.transcript ? ' ' : '') + text,
    }));
  };

  const updateLanguage = (language: string) => {
    setSession(prev => ({ ...prev, language }));
  };

  return (
    <SessionContext.Provider value={{ session, startSession, endSession, appendTranscript, updateLanguage }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
