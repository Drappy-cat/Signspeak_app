import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { saveSession } from '../services/db';
import { addNotification } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { getTime } from '../utils/formatters';
import { Platform } from 'react-native';
import { DEMO_SENTENCES } from '../constants/keywords';
import { translateToMadurese, translateToJavanese } from '../utils/translator';
import { supabase, db } from '../services/supabase';


// ─── Language Mapping ─────────────────────────────────────────────────────────
// Maps our internal language codes to BCP-47 tags recognized by Web Speech API & Android STT
const LANG_TO_BCP47: Record<string, string> = {
  id: 'id-ID',   // Bahasa Indonesia — full support in Chrome, Edge, Android
  jv: 'id-ID',   // Bahasa Jawa — fallback to id-ID for dictionary translation
  mad: 'id-ID',  // Bahasa Madura — no dedicated STT yet, fallback to id-ID
};

function translateText(text: string, lang: string): string {
  if (lang === 'mad') return translateToMadurese(text);
  if (lang === 'jv') return translateToJavanese(text);
  return text;
}

export interface Participant {
  name: string;
  absen: string;
  className: string;
  status: 'online' | 'offline';
  lastSeen: number;
}

export interface ActiveSession {
  isActive: boolean;
  roomCode: string | null;
  subject: string | null;
  teacherName: string | null;
  teacherSchool?: string | null;
  teacherNip?: string | null;
  subjectId: string | null;
  classId: string | null;
  language: string;
  transcript: string;
  interimTranscript: string;
  errorMessage: string | null;
  startTime: number | null;
  participants: Participant[];
  customKeywords: string[];
  customGlossary: Record<string, string>;
  isLangSwitching?: boolean;
  langPauseCountdown?: number;
  langSwitchFrom?: string;
  langSwitchTo?: string;
  langSwitchLabel?: string;
}

interface SessionContextType {
  session: ActiveSession;
  startSession: (roomCode: string, subject: string, language: string, classId: string, subjectId: string, customGlossaryList?: Array<{ word: string; definition: string }>) => Promise<void>;
  endSession: () => Promise<void>;
  updateLanguage: (language: string) => void;
  updateTranscript: (newTranscript: string) => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  isRecording: boolean;
  toggleRecording: () => Promise<void>;
}

const defaultSession: ActiveSession = {
  isActive: false,
  roomCode: null,
  subject: null,
  teacherName: null,
  teacherSchool: null,
  teacherNip: null,
  subjectId: null,
  classId: null,
  language: 'id',
  transcript: '',
  interimTranscript: '',
  errorMessage: null,
  startTime: null,
  participants: [],
  customKeywords: [],
  customGlossary: {},
  isLangSwitching: false,
  langPauseCountdown: 0,
  langSwitchFrom: 'id',
  langSwitchTo: 'id',
  langSwitchLabel: '',
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
    this.recognition.continuous = true; // Use true for less delay between sentences
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
        }, 10);
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
  const [isSttReady, setIsSttReady] = useState(false);
  const { user, role } = useAuth();

  // Refs for side-effect objects
  const webSpeechRef = useRef<WebSpeechEngine | null>(null);
  const webMockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const langCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const customGlossaryRef = useRef<{ keywords: string[]; glossary: Record<string, string> }>({ keywords: [], glossary: {} });
  const teacherChannelRef = useRef<any>(null);

  const triggerLangPause = useCallback((fromLang: string, toLang: string, labelStr: string) => {
    if (langCountdownTimerRef.current) {
      clearInterval(langCountdownTimerRef.current);
      langCountdownTimerRef.current = null;
    }

    setSession(prev => ({
      ...prev,
      language: toLang,
      isLangSwitching: true,
      langPauseCountdown: 10,
      langSwitchFrom: fromLang,
      langSwitchTo: toLang,
      langSwitchLabel: labelStr,
    }));

    let count = 10;
    langCountdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (langCountdownTimerRef.current) {
          clearInterval(langCountdownTimerRef.current);
          langCountdownTimerRef.current = null;
        }
        setSession(prev => ({
          ...prev,
          isLangSwitching: false,
          langPauseCountdown: 0,
        }));
      } else {
        setSession(prev => ({
          ...prev,
          langPauseCountdown: count,
        }));
      }
    }, 1000);
  }, []);

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
            const finalTranscript = translateText(accumulatedTranscriptRef.current, prev.language);
            const finalInterim = translateText(interimText, prev.language);

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

  // ── Supabase Student Subscription ─────────────────────────────────────────────
  useEffect(() => {
    let channel: any = null;
    let heartbeatTimer: any = null;
    let pollTimer: any = null;

    if (role === 'student' && user?.joinedRoomCode) {
      const roomCode = user.joinedRoomCode;
      
      const fetchInitial = async () => {
        try {
          const { data } = await db.from('live_sessions')
            .select('*, teacher:teachers(full_name, nip, school:schools(school_name)), subject_rel:subjects(subject_name)')
            .eq('room_code', roomCode)
            .eq('is_active', true)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            if (pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }

            const teacherObj: any = data.teacher;
            let resolvedTeacherName = teacherObj?.full_name || data.teacher_name;
            let resolvedSchool = teacherObj?.school?.school_name || data.teacher_school;
            let resolvedNip = teacherObj?.nip;

            // Direct fallback lookup if relation returned null
            if (!resolvedTeacherName && data.teacher_id) {
              const { data: directTeacher } = await db.from('teachers')
                .select('full_name, nip, school:schools(school_name)')
                .eq('id', data.teacher_id)
                .maybeSingle();
              if (directTeacher) {
                resolvedTeacherName = directTeacher.full_name;
                resolvedNip = directTeacher.nip;
                resolvedSchool = (directTeacher.school as any)?.school_name || resolvedSchool;
              }
            }

            setSession({
              isActive: true,
              roomCode: data.room_code,
              subject: data.subject_rel?.subject_name || 'Sesi Pembelajaran', 
              teacherName: resolvedTeacherName || 'Guru Pengampu',
              teacherNip: resolvedNip || null,
              teacherSchool: resolvedSchool || null,
              subjectId: data.subject_id,
              classId: data.class_id,
              language: data.language || 'id',
              transcript: data.transcript || '',
              interimTranscript: data.interim_transcript || '',
              errorMessage: null,
              startTime: new Date(data.started_at).getTime(),
              participants: [],
              customKeywords: [],
              customGlossary: {},
            });
          } else {
            setSession(prev => ({
              ...prev,
              isActive: false,
              roomCode: roomCode,
              errorMessage: null,
            }));
          }
        } catch (err) {
          console.warn('Failed fetchInitial for session:', err);
        }
      };
      fetchInitial();
      
      // Polling fallback every 3s to guarantee initial connection without needing page refresh
      pollTimer = setInterval(() => {
        fetchInitial();
      }, 3000);

      channel = supabase
        .channel(`room_${roomCode}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'live_sessions', filter: `room_code=eq.${roomCode}` },
          () => {
            fetchInitial();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'live_sessions', filter: `room_code=eq.${roomCode}` },
          (payload) => {
            const updated = payload.new;
            if (!updated.is_active) {
              setSession(prev => ({ ...prev, isActive: false, errorMessage: 'Sesi telah diakhiri oleh guru.' }));
            }
          }
        )
        .on(
          'broadcast',
          { event: 'sync_transcript' },
          (payload) => {
            const data = payload.payload;
            setSession(prev => ({
              ...prev,
              isActive: true, // Automatically activate if transcript is received
              transcript: data.transcript,
              interimTranscript: data.interimTranscript,
              teacherName: data.teacherName || prev.teacherName,
              teacherSchool: data.teacherSchool || prev.teacherSchool,
            }));
          }
        )
        .on(
          'broadcast',
          { event: 'end_session' },
          () => {
            setSession(prev => ({ ...prev, isActive: false, errorMessage: 'Sesi telah diakhiri oleh guru.' }));
          }
        )
        .on(
          'broadcast',
          { event: 'sync_teacher_info' },
          (payload) => {
            const data = payload.payload;
            if (data?.teacherName) {
              setSession(prev => ({
                ...prev,
                isActive: true, // Activate if teacher info is received (meaning teacher is there)
                teacherName: data.teacherName,
                teacherSchool: data.teacherSchool || prev.teacherSchool,
              }));
            }
          }
        )
        .on(
          'broadcast',
          { event: 'session_started' },
          () => {
            setSession(prev => ({ ...prev, isActive: true, errorMessage: null }));
          }
        )
        .on(
          'broadcast',
          { event: 'sync_glossary' },
          (payload) => {
            const data = payload.payload;
            setSession(prev => ({
              ...prev,
              customKeywords: data.keywords || [],
              customGlossary: data.glossary || {},
            }));
          }
        )
        .on(
          'broadcast',
          { event: 'sync_language_switch' },
          (payload) => {
            const data = payload.payload;
            if (data) {
              triggerLangPause(data.fromLang || 'id', data.toLang || 'id', data.label || 'Perubahan Bahasa Transkrip');
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Broadcast initial presence
            channel.send({
              type: 'broadcast',
              event: 'student_presence',
              payload: {
                name: user?.name || 'Siswa',
                absen: user?.absen || '0',
                className: user?.className || '',
                status: 'online'
              }
            });
            
            // Set periodic presence heartbeat
            heartbeatTimer = setInterval(() => {
              channel.send({
                type: 'broadcast',
                event: 'student_presence',
                payload: {
                  name: user?.name || 'Siswa',
                  absen: user?.absen || '0',
                  className: user?.className || '',
                  status: 'online'
                }
              });
            }, 15000);
          }
        });
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [role, user?.joinedRoomCode, user?.name, user?.absen, user?.className]);

  // ── Supabase Teacher Sync ───────────────────────────────────────────────────
  useEffect(() => {
    if (role === 'teacher' && session.isActive && session.roomCode) {
      // 1. Broadcast instantly to all students
      if (teacherChannelRef.current) {
        teacherChannelRef.current.send({
          type: 'broadcast',
          event: 'sync_transcript',
          payload: {
            transcript: session.transcript,
            interimTranscript: session.interimTranscript,
            teacherName: user?.name || session.teacherName || 'Guru',
            teacherSchool: user?.school || session.teacherSchool || null,
          }
        });
      }

      // 2. Debounce DB save
      const timer = setTimeout(() => {
        db.from('live_sessions').update({
          transcript: session.transcript,
          interim_transcript: session.interimTranscript,
        }).eq('room_code', session.roomCode).then(({ error }: any) => {
          if (error) console.error('[Supabase] Failed to sync transcript', error);
        });
      }, 1000); // Debounce interval
      return () => clearTimeout(timer);
    }
  }, [role, session.isActive, session.roomCode, session.transcript, session.interimTranscript, user?.name, user?.school]);

  // ── Supabase Teacher Participants Receiver ──────────────────────────────────
  useEffect(() => {
    let channel: any = null;
    if (role === 'teacher' && session.isActive && session.roomCode) {
      const roomCode = session.roomCode;
      
      channel = supabase
        .channel(`room_${roomCode}`)
        .on(
          'broadcast',
          { event: 'student_presence' },
          (payload) => {
            const student = payload.payload;
            channel.send({
              type: 'broadcast',
              event: 'sync_teacher_info',
              payload: {
                teacherName: user?.name || 'Guru',
                teacherSchool: user?.school || null,
              }
            });

            setSession(prev => {
              const currentParticipants = prev.participants || [];
              const idx = currentParticipants.findIndex(p => p.absen === student.absen && p.name === student.name);
              let updatedParticipants;
              if (idx > -1) {
                updatedParticipants = [...currentParticipants];
                updatedParticipants[idx] = {
                  ...updatedParticipants[idx],
                  status: 'online' as const,
                  lastSeen: Date.now()
                };
              } else {
                updatedParticipants = [...currentParticipants, {
                  name: student.name,
                  absen: student.absen,
                  className: student.className,
                  status: 'online' as const,
                  lastSeen: Date.now()
                }];
              }
              return {
                ...prev,
                participants: updatedParticipants
              };
            });

            // Send back the current glossary to this student!
            if (customGlossaryRef.current.keywords.length > 0) {
              channel.send({
                type: 'broadcast',
                event: 'sync_glossary',
                payload: {
                  keywords: customGlossaryRef.current.keywords,
                  glossary: customGlossaryRef.current.glossary,
                }
              });
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'sync_teacher_info',
              payload: {
                teacherName: user?.name || 'Guru',
                teacherSchool: user?.school || null,
              }
            });
          }
        });
        
      teacherChannelRef.current = channel;
        
      // Periodically mark students as offline
      const timer = setInterval(() => {
        setSession(prev => {
          const currentParticipants = prev.participants || [];
          const updatedParticipants = currentParticipants.map(p => {
            if (p.status === 'online' && Date.now() - p.lastSeen > 30000) {
              return { ...p, status: 'offline' as const };
            }
            return p;
          });
          return {
            ...prev,
            participants: updatedParticipants
          };
        });
      }, 10000);
      
      return () => {
        clearInterval(timer);
        if (channel) supabase.removeChannel(channel);
      };
    } else {
      setSession(prev => {
        if (prev.participants && prev.participants.length > 0) {
          return { ...prev, participants: [] };
        }
        return prev;
      });
    }
  }, [role, session.isActive, session.roomCode, user?.name, user?.school]);

  // ── Native STT via expo-speech-recognition ──────────────────────────────────
  // We import these conditionally to avoid crashes on web
  const nativeSTT = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Dynamic import to avoid crashing on web
      try {
        const mod = require('expo-speech-recognition');
        nativeSTT.current = {
          module: mod.ExpoSpeechRecognitionModule,
          useEvent: mod.useSpeechRecognitionEvent,
        };
        setIsSttReady(true);
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
          const finalTranscript = translateText(baseText, prev.language);

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
  const startSession = async (
    roomCode: string, 
    subject: string, 
    language: string, 
    classId: string,
    subjectId: string,
    customGlossaryList?: Array<{ word: string; definition: string }>
  ) => {
    accumulatedTranscriptRef.current = '';
    
    // Parse custom glossary list to active state
    const keywords: string[] = [];
    const glossary: Record<string, string> = {};
    if (customGlossaryList && customGlossaryList.length > 0) {
      customGlossaryList.forEach(item => {
        if (item.word.trim()) {
          const lowerWord = item.word.toLowerCase().trim();
          keywords.push(lowerWord);
          glossary[lowerWord] = item.definition.trim();
        }
      });
    }
    
    customGlossaryRef.current = { keywords, glossary };
    
    try {
      let insertPayload: any = {
        room_code: roomCode,
        teacher_id: user?.teacher_id || null,
        teacher_name: user?.name || 'Guru',
        teacher_school: user?.school || null,
        class_id: classId || null,
        subject_id: subjectId || null,
        language: language,
        is_active: true,
        transcript: '',
        interim_transcript: ''
      };

      let { error } = await db.from('live_sessions').insert(insertPayload);

      // Graceful fallback if database schema cache doesn't have teacher_name column yet
      if (error && error.code === 'PGRST204') {
        delete insertPayload.teacher_name;
        delete insertPayload.teacher_school;
        const res = await db.from('live_sessions').insert(insertPayload);
        error = res.error;
      }

      if (error) {
        console.error('[Supabase] Failed to start session', error);
      }
    } catch (e) {
      console.error('[Supabase] Exception starting session:', e);
    }

    setSession({
      isActive: true,
      roomCode,
      subject,
      teacherName: user?.name || 'Guru',
      teacherSchool: user?.school || null,
      classId,
      subjectId,
      language,
      transcript: '',
      interimTranscript: '',
      errorMessage: null,
      startTime: Date.now(),
      participants: [],
      customKeywords: keywords,
      customGlossary: glossary,
    });

    addNotification({
      title: `Kelas ${subject} Dimulai!`,
      body: 'Sesi live transcription sedang berlangsung sekarang.',
      type: 'live_session',
    });

    // Notify all students in the waiting room
    if (teacherChannelRef.current) {
      teacherChannelRef.current.send({
        type: 'broadcast',
        event: 'session_started',
        payload: { startedAt: Date.now() }
      });
      // Also send teacher info just in case
      teacherChannelRef.current.send({
        type: 'broadcast',
        event: 'sync_teacher_info',
        payload: {
          teacherName: user?.name || 'Guru',
          teacherSchool: user?.school || null,
        }
      });
    }

    await startRecording(language);
  };

  const endSession = async () => {
    await pauseRecording();

    if (session.isActive && accumulatedTranscriptRef.current.length > 0 && role === 'teacher') {
      const duration = Math.floor((Date.now() - (session.startTime || Date.now())) / 1000);
      const text = translateText(accumulatedTranscriptRef.current, session.language);
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

      // End session in live_sessions
      if (session.roomCode) {
        await db.from('live_sessions').update({ is_active: false }).eq('room_code', session.roomCode);
        
        if (teacherChannelRef.current) {
          teacherChannelRef.current.send({
            type: 'broadcast',
            event: 'end_session',
            payload: {}
          });
        }
      }

      // Serialize glossary metadata if there is a custom glossary
      let finalTranscriptText = text;
      if (session.customGlossary && Object.keys(session.customGlossary).length > 0) {
        finalTranscriptText = text + "\n\n---GLOSSARY---\n" + JSON.stringify(session.customGlossary);
      }

      // Save to sessions table in Supabase
      if (user?.teacher_id && session.classId && session.subjectId) {
        const { error: historyError } = await db.from('session_history').insert({
          teacher_id: user.teacher_id,
          class_id: session.classId,
          subject_id: session.subjectId,
          teacher_name: user?.name || 'Guru',
          class_display: session.roomCode || 'Kelas Umum',
          subject_display: session.subject || 'Sesi Tanpa Judul',
          language: session.language,
          duration,
          word_count: wordCount,
          excerpt: text.substring(0, 120) + (text.length > 120 ? '...' : ''),
          transcript_full: finalTranscriptText,
          session_date: new Date().toISOString(),
        });
        
        if (historyError) {
          console.error('[SessionContext] Failed to save session history to Supabase:', historyError);
        } else {
          console.log('[SessionContext] Session history saved successfully.');
        }
      } else {
        console.warn('[SessionContext] Skipped saving history to Supabase because of missing IDs:', { 
          teacherId: user?.teacher_id, 
          classId: session.classId, 
          subjectId: session.subjectId 
        });

        addNotification({
          title: 'Transkrip Sesi Tersedia',
          body: `Transkripsi sesi ${session.subject || 'Sesi'} (${wordCount} kata) telah tersimpan di Riwayat.`,
          type: 'history_ready',
        });
      }

      try {
        await saveSession({
          subject: session.subject || 'Sesi Tanpa Judul',
          className: session.roomCode || 'Kelas Umum',
          teacherName: user?.name || 'Guru',
          date: `Hari ini, ${getTime()}`,
          duration,
          wordCount,
          language: session.language,
          excerpt: text.substring(0, 120) + (text.length > 120 ? '...' : ''),
          transcriptFull: finalTranscriptText,
        });
      } catch (e) {
        console.error('[DB] Failed to save session:', e);
      }
    }

    accumulatedTranscriptRef.current = '';
    customGlossaryRef.current = { keywords: [], glossary: {} };
    setSession(defaultSession);
    setIsRecording(false);
  };

  const updateLanguage = (newLanguage: string) => {
    const prevLang = session.language || 'id';
    const getLangLabel = (code: string) => {
      if (code === 'jv') return 'Bahasa Jawa';
      if (code === 'mad') return 'Bahasa Madura';
      return 'Indonesia';
    };

    const labelStr = `${getLangLabel(prevLang)} ➔ ${getLangLabel(newLanguage)}`;

    // 1. Trigger 10s pause locally
    triggerLangPause(prevLang, newLanguage, labelStr);

    // 2. Broadcast to all students in live session
    if (role === 'teacher' && teacherChannelRef.current) {
      try {
        teacherChannelRef.current.send({
          type: 'broadcast',
          event: 'sync_language_switch',
          payload: {
            language: newLanguage,
            fromLang: prevLang,
            toLang: newLanguage,
            label: labelStr,
          },
        });
      } catch (err) {
        console.error('[SessionContext] Failed to broadcast language switch:', err);
      }
    }
  };

  const updateTranscript = async (newTranscript: string) => {
    accumulatedTranscriptRef.current = newTranscript;
    setSession(prev => ({
      ...prev,
      transcript: newTranscript,
      interimTranscript: '',
    }));

    if (session.isActive && session.roomCode && supabase) {
      try {
        await (supabase as any)
          .from('live_sessions')
          .update({ transcript: newTranscript })
          .eq('room_code', session.roomCode);
      } catch (err) {
        console.error('[Supabase] Failed to update transcript correction:', err);
      }
    }
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
    const hook = nativeSTT.current?.useEvent;
    if (!hook) return null;

    hook('result', (event: any) => {
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
        const finalTranscript = translateText(accumulatedTranscriptRef.current, prev.language);
        const finalInterim = translateText(interimStr.trim(), prev.language);

        return {
          ...prev,
          transcript: finalTranscript,
          interimTranscript: finalInterim,
          errorMessage: null,
        };
      });

      resetAutoPauseTimer();
    });

    hook('error', (event: any) => {
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
      updateTranscript,
      pauseRecording,
      resumeRecording,
      isRecording,
      toggleRecording,
    }}>
      {children}
      {Platform.OS !== 'web' && isSttReady && <NativeEventBridge />}
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
