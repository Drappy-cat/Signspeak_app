import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated as RNAnimated, Easing, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Square, Play, Users, Globe, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/SessionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { KEYWORDS, LANGUAGE_LABELS } from '../../constants/keywords';
import { parseHighlights, formatDuration } from '../../utils/formatters';
import { FontSizes } from '../../constants/theme';

// ── PulseDot ──────────────────────────────────────────────────────────────────
function PulseDot({ color = 'bg-red-500' }: { color?: string }) {
  const anim = React.useRef(new RNAnimated.Value(0.4)).current;
  React.useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(anim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        RNAnimated.timing(anim, { toValue: 0.4, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
      ])
    ).start();
  }, []);
  return <RNAnimated.View style={{ opacity: anim }} className={`w-2.5 h-2.5 rounded-full ${color}`} />;
}

// ── SpeakingBars ──────────────────────────────────────────────────────────────
function SpeakingBars({ active, hc }: { active: boolean; hc: boolean }) {
  const ratios = [0.45, 0.75, 1.0, 0.85, 0.55, 0.9, 0.65, 0.8, 0.45];
  const color = hc ? "#34d399" : "#10b981";
  const anims = React.useRef(ratios.map(() => new RNAnimated.Value(3))).current;

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
  text, keywords, hc, fontSize,
}: {
  text: string; keywords: string[]; hc: boolean; fontSize: any;
}) {
  const parts = parseHighlights(text, keywords);
  return (
    <Text style={{ fontSize: fontSize.transcript, lineHeight: fontSize.lineHeight }}>
      {parts.map((part, i) =>
        part.isKeyword ? (
          <Text
            key={i}
            style={{
              fontWeight: '800', fontStyle: 'italic',
              backgroundColor: hc ? '#f59e0b' : '#fef3c7',
              color: hc ? '#1c1917' : '#92400e',
              borderRadius: 3, paddingHorizontal: 2,
            }}
          >
            {part.text}
          </Text>
        ) : (
          <Text key={i} style={{ color: hc ? '#f8fafc' : '#0f172a' }}>{part.text}</Text>
        )
      )}
    </Text>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LiveScreen() {
  const { role } = useAuth();
  const { session, endSession, isRecording, toggleRecording, updateLanguage } = useSession();
  const { settings } = useSettings();
  const router = useRouter();

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (!session.isActive) {
      router.replace('/(tabs)/home');
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

  const currentKeywords = KEYWORDS[session.language] || KEYWORDS['id'];
  const hc = settings.highContrast;
  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';

  const headerStyle = hc
    ? { backgroundColor: '#1e293b', borderBottomColor: '#334155', borderBottomWidth: 1 }
    : { backgroundColor: '#ffffff', borderBottomColor: '#e2e8f0', borderBottomWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 };

  const ctrlStyle = hc
    ? { backgroundColor: '#1e293b', borderTopColor: '#334155', borderTopWidth: 1 }
    : { backgroundColor: '#ffffff', borderTopColor: '#e2e8f0', borderTopWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 };

  const cardStyle = hc
    ? { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 12 }
    : { backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderWidth: 1, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 };

  if (!session.isActive) return null;

  // ── Student Live View ─────────────────────────────────────────────────────
  const StudentLive = () => {
    const isSpeaking = session.interimTranscript.length > 0;
    const hasContent = session.transcript.length > 0 || session.interimTranscript.length > 0;

    return (
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {/* Header */}
        <View style={[{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerStyle]}>
          <View>
            <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>Bu Sari Dewi</Text>
            <Text style={{ fontSize: 12, color: mutedColor }}>Biologi — XII IPA 3</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PulseDot color="bg-red-500" />
            <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 }}>LIVE</Text>
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
          <SpeakingBars active={isSpeaking && !paused} hc={hc} />
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: isSpeaking && !paused ? (hc ? '#34d399' : '#059669') : mutedColor }}>
              {isSpeaking && !paused ? 'Sedang berbicara...' : paused ? '⏸ Dijeda' : 'Menunggu guru berbicara...'}
            </Text>
            <Text style={{ fontSize: 10, color: mutedColor }}>Bu Sari Dewi • Guru</Text>
          </View>
        </View>

        {/* Transcript Area */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {!hasContent && !session.errorMessage ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: hc ? '#1e293b' : '#dbeafe', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Mic size={24} color={hc ? '#60a5fa' : '#1d4ed8'} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, textAlign: 'center' }}>
                Menunggu transkripsi...
              </Text>
              <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                Teks guru akan muncul di sini{'\n'}secara otomatis saat mereka berbicara
              </Text>
            </View>
          ) : null}

          {/* Final transcript */}
          {session.transcript ? (
            <HighlightText
              text={session.transcript}
              keywords={currentKeywords}
              hc={hc}
              fontSize={FontSizes[settings.fontSize]}
            />
          ) : null}

          {/* Interim (live typing indicator) */}
          {session.interimTranscript ? (
            <Text style={{
              fontSize: FontSizes[settings.fontSize].transcript,
              lineHeight: FontSizes[settings.fontSize].lineHeight,
              color: mutedColor,
              fontStyle: 'italic',
            }}>
              {session.interimTranscript}
              <Text style={{ opacity: 0.5 }}>▌</Text>
            </Text>
          ) : null}
        </ScrollView>

        {/* Controls bar */}
        <View style={[{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, ctrlStyle]}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: mutedColor }}>
            Ukuran: <Text style={{ color: textColor }}>{settings.fontSize === 'normal' ? 'Normal' : settings.fontSize === 'large' ? 'Besar' : 'X. Besar'}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setPaused(!paused)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
              backgroundColor: paused ? '#1e3a8a' : hc ? '#334155' : '#f1f5f9',
            }}
          >
            {paused
              ? <Play size={13} color="white" fill="white" />
              : <Square size={13} color={hc ? "#e2e8f0" : "#334155"} fill={hc ? "#e2e8f0" : "#334155"} />
            }
            <Text style={{ fontSize: 13, fontWeight: '800', color: paused ? 'white' : hc ? '#e2e8f0' : '#334155' }}>
              {paused ? 'Lanjut' : 'Jeda'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Teacher Live View ─────────────────────────────────────────────────────
  const TeacherLive = () => (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: textColor }}>Kelola Sesi</Text>
        <Text style={{ fontSize: 14, color: mutedColor, marginTop: 2 }}>{session.subject} — {session.classCode}</Text>
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
            onPress={() => { toggleRecording(); if (!isRecording) setElapsed(0); }}
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
              {isRecording ? 'STOP' : 'MULAI'}
            </Text>
          </TouchableOpacity>
        </RNAnimated.View>

        {isRecording ? (
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PulseDot color="bg-red-500" />
              <Text style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: 22, color: textColor }}>{formatDuration(elapsed)}</Text>
            </View>
            <Text style={{ fontSize: 12, color: mutedColor }}>Sesi sedang berjalan · Merekam audio</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', maxWidth: 200, lineHeight: 20 }}>
            Tekan MULAI untuk merekam{'\n'}dan mentranskripsi suara Anda
          </Text>
        )}
      </View>

      {/* Language Switcher */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={[{ padding: 14 }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Globe size={14} color={hc ? '#60a5fa' : '#1e40af'} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: textColor }}>Bahasa Transkripsi</Text>
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
            {session.language === 'mad' ? '⚠️ Madura menggunakan engine Indonesia' : `Menggunakan engine ${LANGUAGE_LABELS[session.language]}`}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {/* Participants stat */}
        <View style={[{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: hc ? '#1e3a8a' : '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={17} color={hc ? "#93c5fd" : "#1d4ed8"} />
            </View>
            <View>
              <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>Peserta Bergabung</Text>
              <Text style={{ fontSize: 12, color: mutedColor }}>dari 28 siswa terdaftar</Text>
            </View>
          </View>
          <Text style={{ fontSize: 30, fontWeight: '900', color: hc ? '#60a5fa' : '#1e3a8a' }}>8</Text>
        </View>

        {/* Join code */}
        <View style={[{ padding: 16 }, cardStyle]}>
          <Text style={{ fontWeight: '800', fontSize: 14, marginBottom: 12, color: textColor }}>Kode Bergabung</Text>
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
              <Text style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: 22, letterSpacing: 4, color: textColor }}>BIO-4821</Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 4 }}>Bagikan ke siswa untuk bergabung</Text>
            </View>
          </View>
        </View>

        {/* Siswa Online chips */}
        <View style={[{ padding: 16 }, cardStyle]}>
          <Text style={{ fontWeight: '800', fontSize: 14, marginBottom: 10, color: textColor }}>Siswa Online</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Andi', 'Siti', 'Budi', 'Rina', 'Doni', 'Maya', 'Heri', 'Lina'].map((name, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: hc ? '#334155' : '#eff6ff' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: hc ? '#cbd5e1' : '#1e40af' }}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* End Session */}
        {!isRecording && (
          <TouchableOpacity
            onPress={() => { endSession(); router.replace('/(tabs)/home'); }}
            style={{ marginTop: 4, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: hc ? '#7f1d1d' : '#fecaca', backgroundColor: hc ? 'rgba(127,29,29,0.2)' : '#fef2f2' }}
          >
            <Text style={{ fontWeight: '800', fontSize: 14, color: hc ? '#f87171' : '#dc2626' }}>Akhiri Sesi</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      {role === 'teacher' ? <TeacherLive /> : <StudentLive />}
    </SafeAreaView>
  );
}
