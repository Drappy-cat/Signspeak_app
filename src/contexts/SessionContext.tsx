import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveSession } from '../services/db';
import { useAuth } from './AuthContext';
import { getTime } from '../utils/formatters';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DEMO_SENTENCES } from '../constants/keywords';

export interface ActiveSession {
  isActive: boolean;
  classCode: string | null;
  subject: string | null;
  language: string;
  transcript: string;
  interimTranscript: string;
  errorMessage: string | null;
  startTime: number | null;
}

interface SessionContextType {
  session: ActiveSession;
  startSession: (classCode: string, subject: string, language: string) => Promise<void>;
  endSession: () => Promise<void>;
  updateLanguage: (language: string) => void;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  isRecording: boolean;
  toggleRecording: () => Promise<void>;
}

const defaultSession: ActiveSession = {
  isActive: false,
  classCode: null,
  subject: null,
  language: 'id',
  transcript: '',
  interimTranscript: '',
  errorMessage: null,
  startTime: null,
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ActiveSession>(defaultSession);
  const [isRecording, setIsRecording] = useState(false);
  const { user, role } = useAuth();

  const autoPauseTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Pondasi untuk Real-time Sync (Misal: Firebase / Supabase)
  const syncToBackend = (transcript: string, interim: string, isFinal: boolean) => {
    // TODO: Implement backend real-time sync here
    // Contoh: database.ref(`sessions/${session.classCode}`).update({ transcript, interim, isFinal });
    // console.log('[SYNC] Mengirim ke backend:', { transcript, interim, isFinal });
  };

  // Hook for speech recognition events
  useSpeechRecognitionEvent('result', (event) => {
    resetAutoPauseTimer();
    
    let finalStr = '';
    let interimStr = '';
    
    for (const result of event.results) {
      if (result.isFinal) {
        finalStr += result.transcript + ' ';
      } else {
        interimStr += result.transcript + ' ';
      }
    }
    
    setSession(prev => {
      // Jika finalStr kosong, tetap pakai transcript sebelumnya (agar teks lama tidak hilang)
      // Jika event memberikan teks komplit, kita update transcript
      const newTranscript = finalStr.trim() ? finalStr.trim() : prev.transcript;
      const newInterim = interimStr.trim();
      
      syncToBackend(newTranscript, newInterim, Boolean(finalStr.trim()));
      
      return {
        ...prev,
        transcript: newTranscript,
        interimTranscript: newInterim,
        errorMessage: null, // Bersihkan error jika berhasil menangkap suara
      };
    });
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error, event.message);
    if (event.error === 'no-speech' || event.error === 'network') {
      // Ignore silence or network if we are offline-first
      return;
    }
    setSession(prev => ({
      ...prev,
      errorMessage: `Peringatan STT: ${event.message || event.error}`
    }));
  });

  const resetAutoPauseTimer = () => {
    if (autoPauseTimerRef.current) {
      clearTimeout(autoPauseTimerRef.current);
    }
    // 5 minutes auto-pause if no speech
    autoPauseTimerRef.current = setTimeout(async () => {
      console.log('Auto-pausing session due to 5 minutes of silence.');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      pauseRecording();
    }, 5 * 60 * 1000);
  };

  const webMockTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startRecording = async (lang: string) => {
    try {
      if (Platform.OS === 'web') {
        // --- WEB MOCK: Karena web tidak mendeteksi native module dengan mudah, kita gunakan mock data
        console.log('Starting Web Mock STT...');
        const sentences = DEMO_SENTENCES[lang] || DEMO_SENTENCES['id'];
        let sentenceIndex = 0;
        let currentText = session.transcript;

        webMockTimerRef.current = setInterval(() => {
          if (sentenceIndex < sentences.length) {
            const nextSentence = sentences[sentenceIndex];
            currentText = currentText + (currentText ? ' ' : '') + nextSentence;
            
            setSession(prev => ({
              ...prev,
              transcript: currentText
            }));
            
            sentenceIndex++;
            resetAutoPauseTimer();
          }
        }, 4000); // 4 detik tiap kalimat
        
        setIsRecording(true);
        resetAutoPauseTimer();
        return;
      }

      // --- NATIVE STT (Android/iOS)
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        setSession(prev => ({ ...prev, errorMessage: 'Izin mikrofon ditolak' }));
        console.error('Microphone permission denied');
        return;
      }
      
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Start the recognition engine (Option 1 - Native OS STT)
      // The architecture here allows us to inject Vosk (Option 2) in the future if needed
      await ExpoSpeechRecognitionModule.start({
        lang: lang === 'id' ? 'id-ID' : lang === 'jv' ? 'jv-ID' : 'id-ID', // Fallback madura to id-ID for now
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: true, // Force offline if supported
      });
      
      setIsRecording(true);
      resetAutoPauseTimer();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
    }
  };

  const pauseRecording = async () => {
    try {
      if (Platform.OS === 'web' && webMockTimerRef.current) {
        clearInterval(webMockTimerRef.current);
        webMockTimerRef.current = null;
      } else if (Platform.OS !== 'web') {
        await ExpoSpeechRecognitionModule.stop();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      setIsRecording(false);
      
      if (autoPauseTimerRef.current) {
        clearTimeout(autoPauseTimerRef.current);
      }
    } catch (e) {
      console.error('Failed to stop speech recognition:', e);
    }
  };

  const startSession = async (classCode: string, subject: string, language: string) => {
    setSession({
      isActive: true,
      classCode,
      subject,
      language,
      transcript: '',
      interimTranscript: '',
      errorMessage: null,
      startTime: Date.now(),
    });
    
    await startRecording(language);
  };

  const endSession = async () => {
    await pauseRecording();
    
    if (session.isActive && session.transcript.length > 0 && role === 'teacher') {
      // Save to database
      const duration = Math.floor((Date.now() - (session.startTime || Date.now())) / 1000);
      const wordCount = session.transcript.split(/\s+/).filter(w => w.length > 0).length;
      
      await saveSession({
        subject: session.subject || 'Sesi Tanpa Judul',
        className: session.classCode || 'Kelas Umum',
        teacherName: user?.name || 'Guru',
        date: `Hari ini, ${getTime()}`,
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

  const resumeRecording = async () => {
    await startRecording(session.language);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await pauseRecording();
    } else {
      await resumeRecording();
    }
  };

  return (
    <SessionContext.Provider value={{ 
      session, 
      startSession, 
      endSession, 
      updateLanguage, 
      pauseRecording, 
      resumeRecording,
      isRecording,
      toggleRecording
    }}>
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
