import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated as RNAnimated, Easing, SafeAreaView, Platform, StatusBar as RNStatusBar, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Square, Play, Users, Globe, AlertCircle, Volume2, HelpCircle, Moon, Sun, X, Edit3, Copy, Check, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/SessionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { KEYWORDS, LANGUAGE_LABELS, GLOSSARY } from '../../constants/keywords';
import { getOriginalIndonesianWord } from '../../utils/translator';
import { parseHighlights, formatDuration } from '../../utils/formatters';
import { FontSizes } from '../../constants/theme';
import { DICT } from '../../constants/i18n';
import { getCardShadow } from '../../utils/formatters';

// ── PulseDot ──────────────────────────────────────────────────────────────────
function PulseDot({ color = 'bg-red-500' }: { color?: string }) {
  const anim = React.useMemo(() => new RNAnimated.Value(0.4), []);
  React.useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(anim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        RNAnimated.timing(anim, { toValue: 0.4, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);
  return <RNAnimated.View style={{ opacity: anim }} className={`w-2.5 h-2.5 rounded-full ${color}`} />;
}

// ── SpeakingBars ──────────────────────────────────────────────────────────────
function SpeakingBars({ active, hc }: { active: boolean; hc: boolean }) {
  const ratios = [0.45, 0.75, 1.0, 0.85, 0.55, 0.9, 0.65, 0.8, 0.45];
  const color = hc ? "#34d399" : "#10b981";
  const anims = React.useMemo(() => ratios.map(() => new RNAnimated.Value(3)), []);

  React.useEffect(() => {
    if (!active) {
      anims.forEach(a => RNAnimated.timing(a, { toValue: 3, duration: 300, useNativeDriver: false }).start());
      return;
    }
    const animations = anims.map((anim, i) => {
      const r = ratios[i];
      return RNAnimated.sequence([
        RNAnimated.delay(i * 110),
        RNAnimated.loop(
          RNAnimated.sequence([
            RNAnimated.timing(anim, { toValue: r * 36, duration: 250, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            RNAnimated.timing(anim, { toValue: r * 10, duration: 250, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            RNAnimated.timing(anim, { toValue: r * 30, duration: 250, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            RNAnimated.timing(anim, { toValue: r * 6, duration: 250, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
          ])
        )
      ]);
    });
    RNAnimated.parallel(animations).start();
    return () => { anims.forEach(a => a.stopAnimation()); };
  }, [active]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 36, gap: 3 }}>
      {ratios.map((_, i) => (
        <RNAnimated.View key={i} style={{ backgroundColor: color, width: 3, borderRadius: 99, height: anims[i] }} />
      ))}
    </View>
  );
}

// ── Highlighted Transcript Text ───────────────────────────────────────────────
function HighlightText({
  text, keywords, hc, fontSize, isOld = false, customColor = null, onWordLongPress,
}: {
  text: string; keywords: string[]; hc: boolean; fontSize: any; isOld?: boolean; customColor?: string | null;
  onWordLongPress?: (word: string) => void;
}) {
  const parts = parseHighlights(text, keywords);
  const defaultTextColor = customColor || (hc ? '#f8fafc' : '#0f172a');
  const textColorStr = isOld ? (hc ? '#475569' : '#94a3b8') : defaultTextColor;
  const fs = fontSize || { transcript: 20, lineHeight: 30 };

  return (
    <Text style={{ fontSize: isOld ? fs.transcript * 0.85 : fs.transcript, lineHeight: isOld ? fs.lineHeight * 0.85 : fs.lineHeight }}>
      {parts.map((part, i) => {
        if (part.isKeyword) {
          return (
            <Text
              key={i}
              onLongPress={onWordLongPress ? () => onWordLongPress(part.text) : undefined}
              style={{
                fontWeight: '800', fontStyle: 'italic',
                backgroundColor: isOld 
                  ? (hc ? 'rgba(245,158,11,0.15)' : 'rgba(254,243,199,0.5)')
                  : (hc ? '#f59e0b' : '#fef3c7'),
                color: isOld 
                  ? (hc ? '#94a3b8' : '#b45309')
                  : (hc ? '#1c1917' : '#92400e'),
                borderRadius: 3, paddingHorizontal: 2,
              }}
            >
              {part.text}
            </Text>
          );
        } else {
          // Split regular text into individual words so they can be long-pressed too!
          const words = part.text.split(/(\s+)/);
          return words.map((word, wi) => {
            if (word.trim() === '') {
              return <Text key={`${i}-${wi}`} style={{ color: textColorStr }}>{word}</Text>;
            }
            // Clean word from punctuation
            const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
            return (
              <Text
                key={`${i}-${wi}`}
                onLongPress={onWordLongPress ? () => onWordLongPress(cleanWord) : undefined}
                style={{ color: textColorStr }}
              >
                {word}
              </Text>
            );
          });
        }
      })}
    </Text>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LiveScreen() {
  const { role, logout, clearStudentRoomCode } = useAuth();
  const { session, endSession, isRecording, toggleRecording, updateLanguage, updateTranscript } = useSession();
  const { settings, updateSettings } = useSettings();
  const router = useRouter();
  const appLang = settings.appLang || 'id';

  // Glossary and Word Info Modal states
  const [glossaryVisible, setGlossaryVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [glossaryDef, setGlossaryDef] = useState<string | null>(null);
  const [originalIndoWord, setOriginalIndoWord] = useState<string | null>(null);

  // Teacher Live Transcript Corrector states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');

  const handleWordLongPress = async (word: string) => {
    if (!word) return;
    
    const cleanWord = word.toLowerCase().trim();
    setSelectedWord(word);
    
    // Check if it has a glossary definition
    let def = null;
    if (session.customGlossary && session.customGlossary[cleanWord]) {
      def = session.customGlossary[cleanWord];
    } else if (GLOSSARY[cleanWord]) {
      def = GLOSSARY[cleanWord][appLang] || GLOSSARY[cleanWord]['id'];
    }
    setGlossaryDef(def);
    
    // Check if it's a translated word (Madurese or Javanese)
    let original = null;
    if (session.language === 'mad' || session.language === 'jv') {
      original = getOriginalIndonesianWord(cleanWord, session.language);
    }
    setOriginalIndoWord(original);
    
    // Only show modal if we either have a glossary definition or a translation reverse lookup
    if (def || original) {
      if (settings.vibrate) {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (_) {}
      }
      setGlossaryVisible(true);
    }
  };

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [studentQuestion, setStudentQuestion] = useState('');
  const [copiedLiveText, setCopiedLiveText] = useState(false);

  const handleCopyLiveTranscript = async () => {
    const textToCopy = (session.transcript + ' ' + session.interimTranscript).trim();
    if (!textToCopy) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const { Share } = require('react-native');
        await Share.share({ message: textToCopy });
      }
      setCopiedLiveText(true);
      if (settings.vibrate) {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
      }
      setTimeout(() => setCopiedLiveText(false), 2000);
    } catch (_) {}
  };
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = React.useMemo(() => new RNAnimated.Value(1), []);

  const handleSpeakQuestion = async () => {
    if (!studentQuestion.trim()) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(studentQuestion);
        utterance.lang = appLang === 'en' ? 'en-US' : 'id-ID';
        window.speechSynthesis.speak(utterance);
      } else {
        Alert.alert('Error', 'Browser tidak mendukung Text-to-Speech.');
      }
    } else {
      try {
        const Speech = require('expo-speech');
        await Speech.speak(studentQuestion, {
          language: appLang === 'en' ? 'en-US' : 'id-ID',
          pitch: 1.0,
          rate: 0.9,
        });
      } catch (e) {
        console.error('[TTS] Native speech error:', e);
        Alert.alert('Error', 'Gagal memanggil mesin Text-to-Speech HP.');
      }
    }

    setStudentQuestion('');
  };

  const d = DICT[appLang];
  const alertedRef = useRef(false);

  const handleStudentRedirectPostSession = React.useCallback(async () => {
    try {
      await clearStudentRoomCode();
    } catch (_) {}
    router.replace('/(auth)/login');
  }, [clearStudentRoomCode, router]);

  useEffect(() => {
    if (role === 'student' && session.isSessionEnding && (session.sessionEndingCountdown ?? 0) <= 0) {
      handleStudentRedirectPostSession();
    }
  }, [role, session.isSessionEnding, session.sessionEndingCountdown, handleStudentRedirectPostSession]);

  useEffect(() => {
    if (role === 'student' && !session.isActive && !session.isSessionEnding) {
      if (!alertedRef.current) {
        Alert.alert(
          appLang === 'en' ? 'Waiting for Teacher' : 'Menunggu Sesi Guru',
          appLang === 'en' 
            ? 'Teacher has not started the session yet. You will enter the waiting room.' 
            : 'Guru belum membuka sesi kelas. Anda tetap masuk ke ruang tunggu untuk menunggu sesi dimulai.',
          [{ text: 'OK' }]
        );
        alertedRef.current = true;
      }
    } else if (session.isActive) {
      alertedRef.current = false;
    }
  }, [session.isActive]);
  // Elapsed timer for teacher
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecording && role === 'teacher') {
      timer = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, role]);

  // Mic pulse animation for teacher
  useEffect(() => {
    if (isRecording && role === 'teacher') {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.08, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording, role]);

  // Auto scroll transcript to bottom
  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [session.transcript, session.interimTranscript]);

  // Auto-logout student when teacher ends session
  useEffect(() => {
    if (role === 'student' && !session.isActive && session.errorMessage === 'Sesi telah diakhiri oleh guru.') {
      // Small delay to let them read the end message
      const timer = setTimeout(async () => {
        await logout();
        router.replace('/');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [role, session.isActive, session.errorMessage]);

  const defaultKeywords = KEYWORDS[session.language] || KEYWORDS['id'];
  const currentKeywords = [...defaultKeywords, ...(session.customKeywords || [])];
  const hc = settings.highContrast;
  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';

  const headerStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: hc ? '#334155' : '#e2e8f0',
    ...getCardShadow(hc, 'sm'),
  };

  const ctrlStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderTopWidth: 1,
    borderTopColor: hc ? '#334155' : '#e2e8f0',
    ...getCardShadow(hc, 'sm'),
  };

  const cardStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    ...getCardShadow(hc, 'md'),
  };

  // ── Student Live View ─────────────────────────────────────────────────────
  const renderStudentLive = () => {
    const isSpeaking = session.interimTranscript.length > 0;
    const hasContent = session.transcript.length > 0 || session.interimTranscript.length > 0;
    const activeFontSize = FontSizes[settings.fontSize] || FontSizes.normal;

    // Split completed transcript into sentences to style older sentences differently
    const sentences = (session.transcript || '').split(/(?<=[.!?])\s+/).filter(Boolean);

    return (
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {/* Header */}
        <View style={[{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerStyle]}>
          <View>
            <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>
              {session.isActive ? (session.teacherName || 'Guru') : (appLang === 'en' ? 'No Active Teacher' : 'Belum Ada Guru')}
            </Text>
            <Text style={{ fontSize: 12, color: mutedColor }}>
              {session.isActive ? `${session.subject} — ${session.roomCode}` : (appLang === 'en' ? 'Waiting Room' : 'Ruang Tunggu')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PulseDot color={session.isActive ? "bg-red-500" : "bg-amber-500"} />
              <Text style={{ color: session.isActive ? '#ef4444' : '#f59e0b', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 }}>
                {session.isActive ? 'LIVE' : (appLang === 'en' ? 'WAITING' : 'MENUNGGU')}
              </Text>
            </View>

            {/* Language Mode Badge (Top Right Indicator) */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: session.language === 'jv'
                ? (hc ? '#713f12' : '#fef9c3')
                : session.language === 'mad'
                ? (hc ? '#14532d' : '#dcfce7')
                : (hc ? '#1e3a8a' : '#dbeafe'),
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: session.language === 'jv'
                ? (hc ? '#a16207' : '#fde047')
                : session.language === 'mad'
                ? (hc ? '#15803d' : '#86efac')
                : (hc ? '#1d4ed8' : '#bfdbfe'),
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '900',
                color: session.language === 'jv'
                  ? (hc ? '#fef08a' : '#854d0e')
                  : session.language === 'mad'
                  ? (hc ? '#86efac' : '#14532d')
                  : (hc ? '#93c5fd' : '#1e40af'),
              }}>
                🇮🇩 {session.language === 'jv' ? 'JAWA' : session.language === 'mad' ? 'MADURA' : 'INDO'}
              </Text>
            </View>

            {/* Accessibility Buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Copy Live Text Button */}
              {((session.transcript || '') + (session.interimTranscript || '')).trim().length > 0 && (
                <TouchableOpacity
                  onPress={handleCopyLiveTranscript}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: copiedLiveText ? (hc ? '#065f46' : '#dcfce7') : (hc ? '#334155' : '#e2e8f0'), alignItems: 'center', justifyContent: 'center' }}
                >
                  {copiedLiveText ? <Check size={16} color={hc ? '#34d399' : '#059669'} /> : <Copy size={15} color={textColor} />}
                </TouchableOpacity>
              )}
              
              {/* Size Button */}
              <TouchableOpacity
                onPress={() => {
                  const nextSize = settings.fontSize === 'normal' ? 'large' : settings.fontSize === 'large' ? 'xlarge' : 'normal';
                  updateSettings({ fontSize: nextSize });
                }}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: hc ? '#334155' : '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontWeight: '900', color: textColor, fontSize: 14 }}>A<Text style={{ fontSize: 10 }}>A</Text></Text>
              </TouchableOpacity>
              
              {/* Theme Button */}
              <TouchableOpacity
                onPress={() => updateSettings({ highContrast: !settings.highContrast })}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: hc ? '#334155' : '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}
              >
                {settings.highContrast ? <Sun size={16} color="#f8fafc" /> : <Moon size={16} color="#0f172a" />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={async () => {
                await logout();
                router.replace('/(auth)/role-select');
              }}
              style={{ backgroundColor: hc ? '#ef4444' : '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
            >
              <Text style={{ color: hc ? '#ffffff' : '#ef4444', fontSize: 11, fontWeight: '800' }}>{appLang === 'en' ? 'Logout' : 'Keluar'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error / Status Banner */}
        {session.errorMessage ? (
          <View style={{ marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 10, backgroundColor: hc ? '#1c1917' : '#fffbeb', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <AlertCircle size={14} color="#d97706" />
            <Text style={{ fontSize: 12, color: '#d97706', flex: 1, lineHeight: 18 }}>{session.errorMessage}</Text>
          </View>
        ) : null}

        {/* Speaking Indicator Bar */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: hc ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.6)', borderBottomWidth: 1, borderBottomColor: hc ? '#334155' : '#e2e8f0' }}>
          <SpeakingBars active={isSpeaking && !paused && session.isActive} hc={hc} />
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: isSpeaking && !paused && session.isActive ? (hc ? '#34d399' : '#059669') : mutedColor }}>
              {!session.isActive
                ? (appLang === 'en' ? 'Waiting for class to start...' : 'Menunggu kelas dimulai...')
                : isSpeaking && !paused 
                  ? (appLang === 'en' ? 'Speaking...' : 'Sedang berbicara...') 
                  : paused 
                    ? (appLang === 'en' ? '⏸ Paused' : '⏸ Dijeda') 
                    : (appLang === 'en' ? 'Waiting for teacher...' : 'Menunggu guru berbicara...')}
            </Text>
            <Text style={{ fontSize: 10, color: mutedColor }}>
              {session.isActive ? (session.teacherName || 'Guru') : (appLang === 'en' ? 'LENTERA System' : 'Sistem LENTERA')} • {appLang === 'en' ? 'Teacher' : 'Guru'}
            </Text>
          </View>
        </View>

        {/* Teacher Identity Badge Bar */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: hc ? '#1e293b' : '#ffffff',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          ...getCardShadow(hc, 'sm'),
        }}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: hc ? '#1e3a8a' : '#eff6ff',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Users size={18} color={hc ? '#93c5fd' : '#1d4ed8'} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Guru Pengampu Sesi
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: textColor, marginTop: 1 }} numberOfLines={1}>
              {session.teacherName || 'Guru Pengampu'}
            </Text>
            {(session.teacherSchool || session.teacherNip) && (
              <Text style={{ fontSize: 11, color: mutedColor, marginTop: 1 }} numberOfLines={1}>
                {[session.teacherSchool, session.teacherNip ? `NIP. ${session.teacherNip}` : null].filter(Boolean).join(' • ')}
              </Text>
            )}
          </View>
          {session.roomCode && (
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: hc ? '#334155' : '#f1f5f9',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: hc ? '#38bdf8' : '#0284c7' }}>
                {session.roomCode}
              </Text>
            </View>
          )}
        </View>

        {/* Transcript Area */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {!session.isActive ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: hc ? '#1e293b' : '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Mic size={24} color={hc ? '#60a5fa' : '#1d4ed8'} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, textAlign: 'center' }}>
                {appLang === 'en' ? 'Waiting for Teacher to Start Session' : 'Menunggu Guru Memulai Sesi'}
              </Text>
              <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', marginTop: 8, lineHeight: 22, paddingHorizontal: 20 }}>
                {appLang === 'en' 
                  ? "You will automatically receive the transcription once the teacher starts the live class." 
                  : "Anda telah terhubung ke ruang kelas. Transkripsi teks akan otomatis muncul saat guru berbicara."}
              </Text>

              {session.teacherName && (
                <View style={{
                  marginTop: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: hc ? '#1e293b' : '#ffffff',
                  borderWidth: 1,
                  borderColor: hc ? '#334155' : '#e2e8f0',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor }}>Guru Pengampu Kode Ini:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: textColor }}>{session.teacherName}</Text>
                  <Text style={{ fontSize: 12, color: hc ? '#60a5fa' : '#1e40af', fontWeight: '600' }}>
                    {[session.subject, `Kode: ${session.roomCode}`].filter(Boolean).join(' • ')}
                  </Text>
                </View>
              )}
            </View>
          ) : !hasContent && !session.errorMessage ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: hc ? '#1e293b' : '#dbeafe', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Mic size={24} color={hc ? '#60a5fa' : '#1d4ed8'} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, textAlign: 'center' }}>
                {appLang === 'en' ? 'Waiting for transcription...' : 'Menunggu transkripsi...'}
              </Text>
              <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                {appLang === 'en' 
                  ? "Teacher's speech will appear here\nautomatically in real-time" 
                  : "Teks guru akan muncul di sini\nsecara otomatis saat mereka berbicara"}
              </Text>
            </View>
          ) : null}

          {/* Render sentences, dimming older ones like Lentera prototype */}
          {sentences.map((sentence, idx) => {
            const isLast = idx === sentences.length - 1;
            return (
              <View key={idx} style={{ marginBottom: 6 }}>
                <HighlightText
                  text={sentence}
                  keywords={currentKeywords}
                  hc={hc}
                  fontSize={activeFontSize}
                  isOld={!isLast}
                  onWordLongPress={handleWordLongPress}
                />
              </View>
            );
          })}

          {/* Interim (live typing indicator) */}
          {session.interimTranscript ? (
            <View style={{ marginTop: 4 }}>
              <Text style={{
                fontSize: activeFontSize.transcript,
                lineHeight: activeFontSize.lineHeight,
                color: hc ? '#cbd5e1' : '#475569',
                fontStyle: 'italic',
                fontWeight: '700',
              }}>
                {session.interimTranscript}
                <Text style={{ color: hc ? '#38bdf8' : '#1d4ed8', fontWeight: '900' }}>▌</Text>
              </Text>
            </View>
          ) : null}
        </ScrollView>



        {/* Fitur Tanya Balik (Text-to-Speech) */}
        <View style={{ 
          paddingHorizontal: 16, 
          paddingVertical: 12, 
          borderTopWidth: 1, 
          borderTopColor: hc ? '#334155' : '#e2e8f0', 
          backgroundColor: hc ? '#1e293b' : '#f8fafc',
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 10 
        }}>
          <TextInput
            placeholder={appLang === 'en' ? 'Type a question to speak out loud...' : 'Ketik untuk menyuarakan pertanyaan...'}
            placeholderTextColor={mutedColor}
            value={studentQuestion}
            onChangeText={setStudentQuestion}
            style={{
              flex: 1,
              backgroundColor: hc ? '#0f172a' : '#ffffff',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 14,
              color: textColor,
              borderWidth: 1,
              borderColor: hc ? '#334155' : '#cbd5e1',
            }}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSpeakQuestion}
            style={{
              backgroundColor: '#1e3a8a',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Volume2 size={16} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
              {appLang === 'en' ? 'Speak' : 'Tanya'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Teacher Live View ─────────────────────────────────────────────────────
  const renderTeacherLive = () => (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: textColor }}>{d.manageSession}</Text>
        <Text style={{ fontSize: 14, color: mutedColor, marginTop: 2 }}>
          {session.subject || (appLang === 'en' ? 'General Class Session' : 'Sesi Kelas Umum')}
        </Text>
        {session.isActive && session.roomCode && (
          <View style={{ marginTop: 12, padding: 16, backgroundColor: hc ? '#1e3a8a' : '#eff6ff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...getCardShadow(hc, 'sm') }}>
             <Text style={{ fontSize: 13, color: hc ? '#93c5fd' : '#1e40af', fontWeight: '800' }}>Kode Ruangan</Text>
             <Text style={{ fontSize: 24, fontWeight: '900', color: hc ? '#ffffff' : '#1e3a8a', letterSpacing: 4 }}>{session.roomCode}</Text>
          </View>
        )}
      </View>

      {/* Error / Demo mode banner */}
      {session.errorMessage ? (
        <View style={{ marginHorizontal: 20, marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: hc ? '#1c1917' : '#fffbeb', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <AlertCircle size={14} color="#d97706" />
          <Text style={{ fontSize: 12, color: '#d97706', flex: 1, lineHeight: 18 }}>{session.errorMessage}</Text>
        </View>
      ) : null}

      {/* Mic Button */}
      <View style={{ alignItems: 'center', paddingVertical: 24, gap: 16 }}>
        <RNAnimated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch (_) {}
              toggleRecording();
              if (!isRecording) setElapsed(0);
            }}
            style={{
              width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center',
              backgroundColor: isRecording ? '#ef4444' : '#1e3a8a',
              shadowColor: isRecording ? '#ef4444' : '#1e3a8a',
              shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
            }}
          >
            {isRecording
              ? <Square size={32} color="white" fill="white" />
              : <Mic size={32} color="white" />
            }
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '900', marginTop: 4 }}>
              {isRecording ? 'STOP' : (appLang === 'en' ? 'START' : 'MULAI')}
            </Text>
          </TouchableOpacity>
        </RNAnimated.View>

        {isRecording ? (
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PulseDot color="bg-red-500" />
              <Text style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: 22, color: textColor }}>{formatDuration(elapsed)}</Text>
            </View>
            <Text style={{ fontSize: 12, color: mutedColor }}>
              {appLang === 'en' ? 'Session in progress · Recording' : 'Sesi sedang berjalan · Merekam audio'}
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', maxWidth: 200, lineHeight: 20 }}>
            {appLang === 'en' 
              ? 'Press START to record\nand transcribe your voice' 
              : 'Tekan MULAI untuk merekam\ndan mentranskripsi suara Anda'}
          </Text>
        )}
      </View>

      {/* Teacher Live Real-time Transcript & Corrector Card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <View style={[{ padding: 16 }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Volume2 size={16} color={hc ? '#60a5fa' : '#1e3a8a'} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: textColor }}>
                {appLang === 'en' ? 'Live Real-Time Transcript' : 'Transkrip Teks Real-Time'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setEditText(session.transcript || '');
                setEditModalVisible(true);
              }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: hc ? '#1e3a8a' : '#eff6ff',
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
              }}
            >
              <Edit3 size={13} color={hc ? '#93c5fd' : '#1d4ed8'} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: hc ? '#93c5fd' : '#1d4ed8' }}>
                {appLang === 'en' ? 'Edit / Correct' : 'Edit / Koreksi'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{
            backgroundColor: hc ? '#0f172a' : '#f8fafc',
            borderRadius: 12, borderWidth: 1, borderColor: hc ? '#334155' : '#e2e8f0',
            padding: 14, minHeight: 100, maxHeight: 180,
          }}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {(session.transcript || session.interimTranscript) ? (
                <Text style={{ fontSize: 15, lineHeight: 22, color: textColor }}>
                  {session.transcript}
                  {session.interimTranscript ? (
                    <Text style={{ color: hc ? '#f59e0b' : '#d97706', fontStyle: 'italic' }}>
                      {' '}{session.interimTranscript}
                    </Text>
                  ) : null}
                </Text>
              ) : (
                <Text style={{ fontSize: 13, color: mutedColor, fontStyle: 'italic', textAlign: 'center', marginTop: 24 }}>
                  {appLang === 'en' 
                    ? 'Spoken text will appear here in real-time.' 
                    : 'Teks hasil rekaman suara akan muncul di sini secara real-time.'}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Language Switcher */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={[{ padding: 14 }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Globe size={14} color={hc ? '#60a5fa' : '#1e40af'} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: textColor }}>{d.transcriptionLang}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Object.entries(LANGUAGE_LABELS).map(([code, label]) => {
              const isActive = session.language === code;
              return (
                <TouchableOpacity
                  key={code}
                  activeOpacity={0.7}
                  onPress={async () => {
                    updateLanguage(code);
                    if (isRecording) {
                      await toggleRecording(); // stop
                      setTimeout(() => toggleRecording(), 400); // restart in new lang
                    }
                  }}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                    backgroundColor: isActive ? '#1e3a8a' : hc ? '#334155' : '#f1f5f9',
                  }}
                >
                  <Text style={{
                    fontSize: 12, fontWeight: '800',
                    color: isActive ? '#ffffff' : hc ? '#cbd5e1' : '#475569',
                  }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={{ fontSize: 11, color: mutedColor, marginTop: 8, textAlign: 'center' }}>
            {session.language === 'mad'
              ? (appLang === 'en' 
                ? `⚠️ Madurese uses Indonesian engine` 
                : `⚠️ Bahasa Madura menggunakan engine Indonesia`) 
              : `${appLang === 'en' ? 'Engine:' : 'Engine:'} Bahasa ${LANGUAGE_LABELS[session.language || 'id']}`}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {/* Participants stat */}
        <View style={[{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: hc ? '#1e3a8a' : '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={17} color={hc ? "#93c5fd" : "#1d4ed8"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>
                {appLang === 'en' ? 'Participants Joined' : 'Peserta Bergabung'}
              </Text>
              <Text style={{ fontSize: 12, color: mutedColor }}>
                {appLang === 'en' ? 'active students in session' : 'siswa aktif dalam sesi ini'}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 30, fontWeight: '900', color: hc ? '#60a5fa' : '#1e3a8a' }}>
            {session.participants ? session.participants.length : 0}
          </Text>
        </View>

        {/* Join code */}
        <View style={[{ padding: 16 }, cardStyle]}>
          <Text style={{ fontWeight: '800', fontSize: 14, marginBottom: 12, color: textColor }}>
            {appLang === 'en' ? 'Join Code' : 'Kode Bergabung'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: hc ? '#334155' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
              {/* Fake QR */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 40, height: 40, gap: 2 }}>
                {[1,1,0,1, 0,1,1,0, 1,0,1,1, 0,1,0,1].map((b, i) => (
                  <View key={i} style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: b ? (hc ? '#ffffff' : '#1e293b') : (hc ? '#334155' : '#e2e8f0') }} />
                ))}
              </View>
            </View>
            <View>
              <Text style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: 22, letterSpacing: 4, color: textColor }}>
                {session.roomCode || '---'}
              </Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 4 }}>
                {appLang === 'en' ? 'Share with students to join' : 'Bagikan ke siswa untuk bergabung'}
              </Text>
            </View>
          </View>
        </View>

        {/* Siswa Online Table */}
        <View style={[{ padding: 16 }, cardStyle]}>
          <Text style={{ fontWeight: '800', fontSize: 14, marginBottom: 14, color: textColor }}>
            {appLang === 'en' ? 'Online Student List' : 'Daftar Kehadiran Siswa'}
          </Text>

          {/* Table Header */}
          <View style={{
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: hc ? '#334155' : '#e2e8f0',
            paddingBottom: 8,
            marginBottom: 8,
          }}>
            <Text style={{ width: 30, fontSize: 11, fontWeight: '800', color: mutedColor }}>No.</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '800', color: mutedColor }}>{appLang === 'en' ? 'Name' : 'Nama'}</Text>
            <Text style={{ width: 60, fontSize: 11, fontWeight: '800', color: mutedColor, textAlign: 'center' }}>{appLang === 'en' ? 'Abs' : 'Absen'}</Text>
            <Text style={{ width: 80, fontSize: 11, fontWeight: '800', color: mutedColor, textAlign: 'right' }}>{appLang === 'en' ? 'Status' : 'Status'}</Text>
          </View>

          {/* Table Body */}
          {(!session.participants || session.participants.length === 0) ? (
            <Text style={{ fontSize: 12, color: mutedColor, textAlign: 'center', paddingVertical: 16 }}>
              {appLang === 'en' ? 'No students joined yet.' : 'Belum ada siswa yang bergabung.'}
            </Text>
          ) : (
            session.participants.map((student, index) => {
              const isOnline = student.status === 'online';
              return (
                <View 
                  key={student.name + student.absen} 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: index === session.participants.length - 1 ? 0 : 1,
                    borderBottomColor: hc ? '#1e293b' : '#f1f5f9',
                  }}
                >
                  {/* Number */}
                  <Text style={{ width: 30, fontSize: 13, fontWeight: '700', color: textColor }}>
                    {index + 1}.
                  </Text>
                  
                  {/* Name */}
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: textColor }} numberOfLines={1}>
                    {student.name}
                  </Text>
                  
                  {/* Attendance Number */}
                  <Text style={{ width: 60, fontSize: 13, color: textColor, textAlign: 'center', fontWeight: '700' }}>
                    {student.absen}
                  </Text>
                  
                  {/* Status Indicator */}
                  <View style={{ width: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: isOnline ? '#22c55e' : '#ef4444',
                    }} />
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: isOnline ? (hc ? '#4ade80' : '#166534') : (hc ? '#f87171' : '#991b1b'),
                    }}>
                      {isOnline ? (appLang === 'en' ? 'Online' : 'Online') : (appLang === 'en' ? 'Offline' : 'Offline')}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* End Session */}
        {!isRecording && (
          <TouchableOpacity
            onPress={() => { endSession(); router.replace('/(tabs)/home'); }}
            style={{ marginTop: 4, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: hc ? '#7f1d1d' : '#fecaca', backgroundColor: hc ? 'rgba(127,29,29,0.2)' : '#fef2f2' }}
          >
            <Text style={{ fontWeight: '800', fontSize: 14, color: hc ? '#f87171' : '#dc2626' }}>
              {appLang === 'en' ? 'End Session' : 'Akhiri Sesi'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  if (role === 'teacher' && !session.isActive) {
    const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={[{ padding: 24, alignItems: 'center', gap: 16, width: '100%' }, cardStyle]}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: hc ? '#1e3a8a' : '#dbeafe', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={30} color={hc ? '#60a5fa' : '#1e3a8a'} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, textAlign: 'center' }}>
            {appLang === 'en' ? 'No Active Session' : 'Tidak Ada Sesi Aktif'}
          </Text>
          <Text style={{ fontSize: 14, color: mutedColor, textAlign: 'center', lineHeight: 22 }}>
            {appLang === 'en' 
              ? 'Please start a new session from the Home screen to begin transcription.' 
              : 'Silakan mulai sesi baru dari halaman Beranda untuk mengaktifkan mikrofon dan transkripsi.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/home')}
            style={{ backgroundColor: '#1e3a8a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
              {appLang === 'en' ? 'Go to Home' : 'Ke Beranda'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
      {role === 'teacher' ? renderTeacherLive() : renderStudentLive()}

      {/* Glossary & Definition Modal */}
      <Modal transparent visible={glossaryVisible} animationType="fade" onRequestClose={() => setGlossaryVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: hc ? '#1e293b' : '#ffffff',
            borderRadius: 24,
            padding: 24,
            ...getCardShadow(hc, 'lg'),
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: hc ? '#1e3a8a' : '#dbeafe',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <HelpCircle size={20} color={hc ? '#60a5fa' : '#1e40af'} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: textColor }}>
                {appLang === 'en' ? 'Word Info' : 'Keterangan Kata'}
              </Text>
            </View>

            {/* Content: Selected Word */}
            <Text style={{ fontSize: 22, fontWeight: '900', color: textColor, marginBottom: 4 }}>
              {selectedWord}
            </Text>

            {/* Translation details if available */}
            {originalIndoWord ? (
              <View style={{
                backgroundColor: hc ? 'rgba(59,130,246,0.1)' : '#f0f7ff',
                borderRadius: 12,
                padding: 12,
                marginVertical: 12,
              }}>
                <Text style={{ fontSize: 11, color: mutedColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {appLang === 'en' ? 'Original Word (Indonesian)' : 'Kata Asli (Bahasa Indonesia)'}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: hc ? '#60a5fa' : '#1e40af', marginTop: 2 }}>
                  {originalIndoWord}
                </Text>
                <Text style={{ fontSize: 11, color: mutedColor, marginTop: 4 }}>
                  {appLang === 'en' 
                    ? `Translated to ${LANGUAGE_LABELS[session.language || 'id']} in transcript` 
                    : `Diterjemahkan ke Bahasa ${LANGUAGE_LABELS[session.language || 'id']} pada transkrip`}
                </Text>
              </View>
            ) : null}

            {/* Glossary Definition if available */}
            {glossaryDef ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: mutedColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  {appLang === 'en' ? 'Definition / Explanation' : 'Definisi / Penjelasan'}
                </Text>
                <Text style={{ fontSize: 13, color: textColor, lineHeight: 18 }}>
                  {glossaryDef}
                </Text>
              </View>
            ) : null}

            {/* Dismiss Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setGlossaryVisible(false)}
              style={{
                width: '100%',
                backgroundColor: '#1e3a8a',
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 20,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                {appLang === 'en' ? 'Close' : 'Tutup'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Teacher Live Transcript Corrector Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            width: '100%', maxWidth: 440, backgroundColor: hc ? '#1e293b' : '#ffffff',
            borderRadius: 20, padding: 20, ...getCardShadow(hc, 'lg'),
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color={hc ? '#60a5fa' : '#1e3a8a'} />
                <Text style={{ fontSize: 16, fontWeight: '900', color: textColor }}>
                  {appLang === 'en' ? 'Edit & Correct Transcript' : 'Edit & Koreksi Transkrip'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={20} color={mutedColor} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: mutedColor, marginBottom: 12, lineHeight: 18 }}>
              {appLang === 'en'
                ? 'Correct misrecognized words or edit the transcript text below. Changes will be synced instantly to all connected student screens.'
                : 'Perbaiki kata yang salah ucap atau perbarui teks transkrip di bawah. Perubahan akan langsung disinkronkan ke layar semua siswa.'}
            </Text>

            <TextInput
              multiline
              numberOfLines={6}
              value={editText}
              onChangeText={setEditText}
              placeholder={appLang === 'en' ? 'Type or edit transcript text...' : 'Ketik atau edit teks transkrip...'}
              placeholderTextColor={mutedColor}
              style={{
                backgroundColor: hc ? '#0f172a' : '#f8fafc',
                color: textColor, borderRadius: 12, borderWidth: 1,
                borderColor: hc ? '#334155' : '#cbd5e1', padding: 12,
                fontSize: 14, lineHeight: 20, height: 140, textAlignVertical: 'top',
              }}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: hc ? '#334155' : '#e2e8f0', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '800', color: textColor, fontSize: 14 }}>
                  {appLang === 'en' ? 'Cancel' : 'Batal'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await updateTranscript(editText);
                  setEditModalVisible(false);
                  Alert.alert(
                    appLang === 'en' ? 'Success' : 'Berhasil',
                    appLang === 'en' ? 'Transcript updated and synced to all students.' : 'Transkrip telah diperbarui dan disinkronkan ke semua siswa.'
                  );
                }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1e3a8a', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '800', color: '#ffffff', fontSize: 14 }}>
                  {appLang === 'en' ? 'Save & Sync' : 'Simpan & Sinkron'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 10-Second Language Switch Pause Pop-Up Modal */}
      <Modal
        transparent
        visible={Boolean(session.isLangSwitching || (session.langPauseCountdown && session.langPauseCountdown > 0))}
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.78)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: hc ? '#1e293b' : '#ffffff',
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            ...getCardShadow(hc, 'lg'),
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: hc ? '#1e3a8a' : '#dbeafe',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Globe size={32} color={hc ? '#60a5fa' : '#2563eb'} />
            </View>

            <Text style={{ fontSize: 18, fontWeight: '900', color: textColor, textAlign: 'center', marginBottom: 6 }}>
              {appLang === 'en' ? 'Changing Transcript Language...' : 'Mengubah Bahasa Transkrip...'}
            </Text>

            {/* Language Transition Badge */}
            <View style={{
              backgroundColor: hc ? '#334155' : '#eff6ff',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: hc ? '#475569' : '#bfdbfe',
              marginVertical: 10,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: hc ? '#93c5fd' : '#1d4ed8' }}>
                🔄 {session.langSwitchLabel || 'Indonesia ➔ Indonesia'}
              </Text>
            </View>

            <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', lineHeight: 20, marginVertical: 8 }}>
              {appLang === 'en'
                ? 'Transcript paused for 10 seconds to adjust translation modules.'
                : 'Transkrip di-pause sejenak selama 10 detik untuk menyesuaikan modul penerjemahan.'}
            </Text>

            {/* Live 10s Countdown Badge */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#ef4444',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginTop: 12,
            }}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>
                ⏸ PAUSE ({session.langPauseCountdown || 10}s)
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* 10-Second Session Ended Pop-Up Modal */}
      <Modal
        transparent
        visible={Boolean(role === 'student' && (session.isSessionEnding || (session.sessionEndingCountdown && session.sessionEndingCountdown > 0)))}
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: hc ? '#1e293b' : '#ffffff',
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            ...getCardShadow(hc, 'lg'),
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: hc ? '#7f1d1d' : '#fee2e2',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <CheckCircle2 size={32} color={hc ? '#fca5a5' : '#dc2626'} />
            </View>

            <Text style={{ fontSize: 18, fontWeight: '900', color: textColor, textAlign: 'center', marginBottom: 6 }}>
              {appLang === 'en' ? 'Class Session Ended' : 'Sesi Kelas Berakhir'}
            </Text>

            <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', lineHeight: 20, marginVertical: 8 }}>
              {session.sessionEndingMessage || (appLang === 'en' ? 'Session ended by teacher.' : 'Sesi telah diakhiri oleh guru.')}
            </Text>
            
            <Text style={{ fontSize: 12, color: hc ? '#94a3b8' : '#64748b', textAlign: 'center', fontStyle: 'italic', marginBottom: 12 }}>
              Profil & identitas Anda tetap tersimpan. Mengalihkan ke Halaman Masuk Kode Baru dalam {session.sessionEndingCountdown || 10} detik...
            </Text>

            {/* Live 10s Countdown Badge */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#ef4444',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginBottom: 16,
            }}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>
                ⏸ MENGALIHKAN ({session.sessionEndingCountdown || 10}s)
              </Text>
            </View>

            {/* Direct Button */}
            <TouchableOpacity
              onPress={handleStudentRedirectPostSession}
              style={{
                width: '100%',
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: '#1d4ed8',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                Masuk Kode Baru Sekarang
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
