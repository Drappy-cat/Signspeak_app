import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { saveSession } from '../services/db';
import { useAuth } from './AuthContext';
import { getTime } from '../utils/formatters';
import { Platform } from 'react-native';
import { DEMO_SENTENCES } from '../constants/keywords';
import { translateToMadurese } from '../utils/translator';


// ─── Language Mapping ─────────────────────────────────────────────────────────
// Maps our internal language codes to BCP-47 tags recognized by Web Speech API & Android STT
const LANG_TO_BCP47: Record<string, string> = {
  id: 'id-ID',   // Bahasa Indonesia — full support in Chrome, Edge, Android
  jv: 'jv-ID',   // Bahasa Jawa — supported on Android, fallback to id-ID on web
  mad: 'id-ID',  // Bahasa Madura — no dedicated STT yet, fallback to id-ID
};

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

// ─── Web Speech API Helper ────────────────────────────────────────────────────
// Separate class to manage the Web SpeechRecognition instance cleanly
class WebSpeechEngine {
  private recognition: any = null;
  private lang: string = 'id-ID';
  private onResult: (transcript: string, interim: string) => void;
  private onError: (msg: string) => void;
  private active: boolean = false;
  private restartTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    onResult: (transcript: string, interim: string) => void,
    onError: (msg: string) => void,
  ) {
    this.onResult = onResult;
    this.onError = onError;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      (typeof (window as any).SpeechRecognition !== 'undefined' ||
       typeof (window as any).webkitSpeechRecognition !== 'undefined');
  }

  start(lang: string): boolean {
    if (!this.isSupported()) return false;
    this.lang = lang;
    this.active = true;
    this._createAndStart();
    return true;
  }

  stop() {
    this.active = false;
    if (this.restartTimeoutId) {
      clearTimeout(this.restartTimeoutId);
      this.restartTimeoutId = null;
    }
    if (this.recognition) {
      try { this.recognition.stop(); } catch (_) {}
      this.recognition = null;
    }
  }

  private _createAndStart() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.lang;
    this.recognition.interimResults = true;
    this.recognition.continuous = false; // Will be restarted on end for continuous effect
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
        } else {
          interimText += result[0].transcript;
        }
      }

      this.onResult(finalText.trim(), interimText.trim());
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Expected — restart silently
        return;
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.onError('Izin mikrofon ditolak. Aktifkan mikrofon di browser Anda.');
        this.active = false;
        return;
      }
      if (event.error === 'network') {
        this.onError('Koneksi internet diperlukan untuk Speech Recognition di browser.');
        return;
      }
      // Other errors — try restarting
      console.warn('[STT] Error:', event.error);
    };

    this.recognition.onend = () => {
      // Auto-restart to simulate continuous mode (Web API doesn't support it natively)
      if (this.active) {
        this.restartTimeoutId = setTimeout(() => {
          if (this.active) {
            this._createAndStart();
          }
        }, 300);
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[STT] Could not start:', e);
    }
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ActiveSession>(defaultSession);
  const [isRecording, setIsRecording] = useState(false);
  const { user, role } = useAuth();

  // Refs for side-effect objects
  const webSpeechRef = useRef<WebSpeechEngine | null>(null);
  const webMockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  // Initialize Web Speech Engine once
  useEffect(() => {
    if (Platform.OS === 'web') {
      webSpeechRef.current = new WebSpeechEngine(
        // onResult callback
        (finalText: string, interimText: string) => {
          if (finalText) {
            accumulatedTranscriptRef.current =
              accumulatedTranscriptRef.current
                ? accumulatedTranscriptRef.current + ' ' + finalText
                : finalText;
          }

          setSession(prev => {
            const isMad = prev.language === 'mad';
            const finalTranscript = isMad 
              ? translateToMadurese(accumulatedTranscriptRef.current) 
              : accumulatedTranscriptRef.current;
            const finalInterim = isMad 
              ? translateToMadurese(interimText) 
              : interimText;

            return {
              ...prev,
              transcript: finalTranscript,
              interimTranscript: finalInterim,
              errorMessage: null,
            };
          });

          resetAutoPauseTimer();
        },
        // onError callback
        (msg: string) => {
          setSession(prev => ({ ...prev, errorMessage: msg }));
        },
      );
    }

    return () => {
      webSpeechRef.current?.stop();
      if (webMockTimerRef.current) clearInterval(webMockTimerRef.current);
      if (autoPauseTimerRef.current) clearTimeout(autoPauseTimerRef.current);
    };
  }, []);

  // ── Native STT via expo-speech-recognition ──────────────────────────────────
  // We import these conditionally to avoid crashes on web
  const nativeSTT = useRef<{
    module: any;
    useEvent: any;
  } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Dynamic import to avoid crashing on web
      try {
        const mod = require('expo-speech-recognition');
        nativeSTT.current = {
          module: mod.ExpoSpeechRecognitionModule,
          useEvent: mod.useSpeechRecognitionEvent,
        };
      } catch (e) {
        console.warn('[STT] expo-speech-recognition not available');
      }
    }
  }, []);

  const resetAutoPauseTimer = () => {
    if (autoPauseTimerRef.current) clearTimeout(autoPauseTimerRef.current);
    autoPauseTimerRef.current = setTimeout(async () => {
      console.log('[STT] Auto-pause: 5 minutes of silence');
      await pauseRecording();
    }, 5 * 60 * 1000);
  };

  // ── Start Recording ──────────────────────────────────────────────────────────
  const startRecording = async (lang: string) => {
    const bcp47 = LANG_TO_BCP47[lang] || 'id-ID';
    accumulatedTranscriptRef.current = session.transcript;

    if (Platform.OS === 'web') {
      // Try real Web Speech API first
      const engine = webSpeechRef.current;
      if (engine && engine.isSupported()) {
        console.log(`[STT] Starting Web Speech API in ${bcp47}...`);
        const started = engine.start(bcp47);
        if (started) {
          setIsRecording(true);
          resetAutoPauseTimer();
          setSession(prev => ({ ...prev, errorMessage: null }));
          return;
        }
      }

      // Fallback: Demo simulation mode (browser doesn't support or permission denied)
      console.log('[STT] Falling back to demo simulation mode...');
      _startDemoMode(lang);
      return;
    }

    // ── Native (Android / iOS) ────────────────────────────────────────────────
    try {
      const mod = nativeSTT.current?.module;
      if (!mod) {
        console.warn('[STT] Native module not available, using demo mode');
        _startDemoMode(lang);
        return;
      }

      const { granted } = await mod.requestPermissionsAsync();
      if (!granted) {
        setSession(prev => ({ ...prev, errorMessage: 'Izin mikrofon ditolak. Buka Pengaturan dan aktifkan izin Mikrofon.' }));
        return;
      }

      await mod.start({
        lang: bcp47,
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: false,
      });

      setIsRecording(true);
      resetAutoPauseTimer();
    } catch (e: any) {
      console.error('[STT] Native start error:', e);
      setSession(prev => ({ ...prev, errorMessage: `Gagal memulai: ${e.message}` }));
      // Fallback to demo
      _startDemoMode(lang);
    }
  };

  // ── Demo Mode (when real STT not available) ───────────────────────────────
  const _startDemoMode = (lang: string) => {
    const sentences = DEMO_SENTENCES[lang] || DEMO_SENTENCES['id'];
    let sentenceIndex = 0;
    let baseText = accumulatedTranscriptRef.current;

    setSession(prev => ({
      ...prev,
      errorMessage: '⚠️ Demo Mode: Mikrofon tidak tersedia — menampilkan simulasi teks',
    }));

    webMockTimerRef.current = setInterval(() => {
      if (sentenceIndex < sentences.length) {
        const nextSentence = sentences[sentenceIndex];
        baseText = baseText ? baseText + ' ' + nextSentence : nextSentence;
        accumulatedTranscriptRef.current = baseText;

        setSession(prev => {
          const isMad = prev.language === 'mad';
          const finalTranscript = isMad 
            ? translateToMadurese(baseText) 
            : baseText;

          return {
            ...prev,
            transcript: finalTranscript,
            interimTranscript: '',
          };
        });

        sentenceIndex++;
        resetAutoPauseTimer();
      } else {
        // Loop sentences
        sentenceIndex = 0;
      }
    }, 3500);

    setIsRecording(true);
    resetAutoPauseTimer();
  };

  // ── Pause Recording ──────────────────────────────────────────────────────────
  const pauseRecording = async () => {
    // Stop Web Speech
    if (Platform.OS === 'web') {
      webSpeechRef.current?.stop();
    }

    // Stop demo mode timer
    if (webMockTimerRef.current) {
      clearInterval(webMockTimerRef.current);
      webMockTimerRef.current = null;
    }

    // Stop native STT
    if (Platform.OS !== 'web') {
      try {
        await nativeSTT.current?.module?.stop();
      } catch (_) {}
    }

    setIsRecording(false);
    setSession(prev => ({ ...prev, interimTranscript: '' }));

    if (autoPauseTimerRef.current) {
      clearTimeout(autoPauseTimerRef.current);
    }
  };

  // ── Session Lifecycle ────────────────────────────────────────────────────────
  const startSession = async (classCode: string, subject: string, language: string) => {
    accumulatedTranscriptRef.current = '';
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

    if (session.isActive && accumulatedTranscriptRef.current.length > 0 && role === 'teacher') {
      const duration = Math.floor((Date.now() - (session.startTime || Date.now())) / 1000);
      const text = session.language === 'mad'
        ? translateToMadurese(accumulatedTranscriptRef.current)
        : accumulatedTranscriptRef.current;
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

      try {
        await saveSession({
          subject: session.subject || 'Sesi Tanpa Judul',
          className: session.classCode || 'Kelas Umum',
          teacherName: user?.name || 'Guru',
          date: `Hari ini, ${getTime()}`,
          duration,
          wordCount,
          language: session.language,
          excerpt: text.substring(0, 120) + (text.length > 120 ? '...' : ''),
          transcriptFull: text,
        });
      } catch (e) {
        console.error('[DB] Failed to save session:', e);
      }
    }

    accumulatedTranscriptRef.current = '';
    setSession(defaultSession);
    setIsRecording(false);
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

  // ── Native event hooks (only used when running natively) ─────────────────────
  // We can't call hooks conditionally, so we always register but they only fire natively
  const NativeEventBridge = () => {
    if (Platform.OS === 'web' || !nativeSTT.current?.useEvent) return null;

    const { useSpeechRecognitionEvent } = nativeSTT.current;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEvent('result', (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (const result of event.results) {
        if (result.isFinal) {
          finalStr += result.transcript + ' ';
        } else {
          interimStr += result.transcript + ' ';
        }
      }

      if (finalStr.trim()) {
        accumulatedTranscriptRef.current =
          accumulatedTranscriptRef.current
            ? accumulatedTranscriptRef.current + ' ' + finalStr.trim()
            : finalStr.trim();
      }

      setSession(prev => {
        const isMad = prev.language === 'mad';
        const finalTranscript = isMad 
          ? translateToMadurese(accumulatedTranscriptRef.current) 
          : accumulatedTranscriptRef.current;
        const finalInterim = isMad 
          ? translateToMadurese(interimStr.trim()) 
          : interimStr.trim();

        return {
          ...prev,
          transcript: finalTranscript,
          interimTranscript: finalInterim,
          errorMessage: null,
        };
      });

      resetAutoPauseTimer();
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEvent('error', (event: any) => {
      if (event.error === 'no-speech') return;
      setSession(prev => ({
        ...prev,
        errorMessage: `Peringatan STT: ${event.message || event.error}`,
      }));
    });

    return null;
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
      toggleRecording,
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
