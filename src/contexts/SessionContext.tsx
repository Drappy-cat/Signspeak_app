import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveSession } from '../services/db';
import { useAuth } from './AuthContext';
import { getTime } from '../utils/formatters';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { Platform } from 'react-native';
import { DEMO_SENTENCES } from '../constants/keywords';

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
  startTime: null,
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ActiveSession>(defaultSession);
  const [isRecording, setIsRecording] = useState(false);
  const { user, role } = useAuth();

  const autoPauseTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Hook for speech recognition events
  useSpeechRecognitionEvent('result', (event) => {
    resetAutoPauseTimer();
    
    let text = '';
    for (const result of event.results) {
      // In continuous mode, event.results contains the accumulated results
      text += result.transcript + ' ';
    }
    
    setSession(prev => ({
      ...prev,
      transcript: text.trim()
    }));
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error, event.message);
    if (event.error === 'no-speech' || event.error === 'network') {
      // Ignore silence or network if we are offline-first
    }
  });

  const resetAutoPauseTimer = () => {
    if (autoPauseTimerRef.current) {
      clearTimeout(autoPauseTimerRef.current);
    }
    // 5 minutes auto-pause if no speech
    autoPauseTimerRef.current = setTimeout(() => {
      console.log('Auto-pausing session due to 5 minutes of silence.');
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
        console.error('Microphone permission denied');
        return;
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
