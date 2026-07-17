import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated as RNAnimated, Easing, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, MicOff, Square, Play, CheckCircle, Users } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/SessionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { KEYWORDS } from '../../constants/keywords';
import { parseHighlights, formatDuration } from '../../utils/formatters';
import { FontSizes } from '../../constants/theme';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing as REasing } from 'react-native-reanimated';

function PulseDot() {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true
    ),
  }));
  return <Animated.View style={animatedStyle} className="w-2 h-2 rounded-full bg-red-500" />;
}

function SpeakingBars({ active, hc }: { active: boolean; hc: boolean }) {
  const ratios = [0.45, 0.75, 1.0, 0.85, 0.55, 0.9, 0.65, 0.8, 0.45];
  const color = hc ? "#34d399" : "#10b981";
  
  return (
    <View className="flex-row items-end h-9" style={{ gap: 3 }}>
      {ratios.map((r, i) => {
        const animatedStyle = useAnimatedStyle(() => {
          if (!active) {
            return { height: withTiming(3, { duration: 300 }) };
          }
          return {
            height: withDelay(
              i * 110,
              withRepeat(
                withSequence(
                  withTiming(r * 6, { duration: 250, easing: REasing.inOut(REasing.ease) }),
                  withTiming(r * 36, { duration: 250, easing: REasing.inOut(REasing.ease) }),
                  withTiming(r * 10, { duration: 250, easing: REasing.inOut(REasing.ease) }),
                  withTiming(r * 30, { duration: 250, easing: REasing.inOut(REasing.ease) }),
                  withTiming(r * 6, { duration: 250, easing: REasing.inOut(REasing.ease) })
                ),
                -1,
                false
              )
            )
          };
        }, [active]);
        
        return (
          <Animated.View
            key={i}
            style={[{ backgroundColor: color, width: 3, borderRadius: 99 }, animatedStyle]}
          />
        );
      })}
    </View>
  );
}

export default function LiveScreen() {
  const { role } = useAuth();
  const { session, endSession, isRecording, toggleRecording } = useSession();
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

  useEffect(() => {
    let clockTimer: NodeJS.Timeout;
    if (isRecording && role === 'teacher') {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();

      clockTimer = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => { clearInterval(clockTimer); pulseAnim.stopAnimation(); };
    }
  }, [isRecording, role]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [session.transcript, session.interimTranscript]);

  const currentKeywords = KEYWORDS[session.language] || KEYWORDS['id'];
  const hc = settings.highContrast;
  const bg = hc ? "bg-slate-900" : "bg-[#F0F7FF]";
  const textMain = hc ? "text-white" : "text-slate-900";
  const headerBg = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const ctrlBg = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const muted = hc ? "text-slate-400" : "text-slate-500";
  const card = hc ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";

  if (!session.isActive) return null;

  const StudentLive = () => {
    const isSpeaking = session.interimTranscript.length > 0;
    
    return (
      <View className={`flex-1 ${bg}`}>
        {/* Header */}
        <View className={`px-4 py-3 border-b flex-row items-center justify-between ${headerBg}`}>
          <View>
            <Text className={`font-extrabold text-sm ${textMain}`}>Bu Sari Dewi</Text>
            <Text className={`text-xs ${muted}`}>Biologi — XII IPA 3</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <PulseDot />
            <Text className="text-red-500 text-xs font-black tracking-wider">LIVE</Text>
          </View>
        </View>

        {/* Speaking indicator */}
        <View className={`px-5 py-3 flex-row items-center gap-4 border-b ${hc ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white/60"}`}>
          <SpeakingBars active={isSpeaking && !paused} hc={hc} />
          <View>
            <Text className={`text-xs font-bold ${isSpeaking && !paused ? (hc ? "text-emerald-400" : "text-emerald-600") : muted}`}>
              {isSpeaking && !paused ? "Sedang berbicara..." : paused ? "Dijeda" : "Menunggu..."}
            </Text>
            <Text className={`text-[10px] ${muted}`}>Bu Sari Dewi • Guru</Text>
          </View>
        </View>

        {/* Transcript */}
        <ScrollView ref={scrollViewRef} className="flex-1 px-5 py-4" contentContainerStyle={{ gap: 12 }}>
          {session.errorMessage ? (
            <View className="bg-red-100 border border-red-200 p-4 rounded-xl">
              <Text className="text-red-800 font-bold">{session.errorMessage}</Text>
            </View>
          ) : null}

          {session.transcript ? (
            <Text style={{ fontSize: FontSizes[settings.fontSize].transcript, lineHeight: FontSizes[settings.fontSize].lineHeight }} className={`leading-relaxed ${textMain}`}>
              {parseHighlights(session.transcript, currentKeywords).map((part, i) =>
                part.isKeyword ? (
                  <Text key={`final-${i}`} className={`font-extrabold ${hc ? "bg-amber-400 text-slate-900" : "bg-amber-100 text-amber-900"}`}>
                    {part.text}
                  </Text>
                ) : (
                  <Text key={`final-${i}`}>{part.text}</Text>
                )
              )}
            </Text>
          ) : null}

          {session.interimTranscript ? (
            <Text style={{ fontSize: FontSizes[settings.fontSize].transcript, lineHeight: FontSizes[settings.fontSize].lineHeight }} className={`font-extrabold ${textMain}`}>
              {parseHighlights(session.interimTranscript, currentKeywords).map((part, i) =>
                part.isKeyword ? (
                  <Text key={`interim-${i}`} className={`font-extrabold ${hc ? "bg-amber-400 text-slate-900" : "bg-amber-100 text-amber-900"}`}>
                    {part.text}
                  </Text>
                ) : (
                  <Text key={`interim-${i}`}>{part.text}</Text>
                )
              )}
            </Text>
          ) : null}
        </ScrollView>

        {/* Controls */}
        <View className={`px-4 py-3 border-t flex-row items-center justify-between ${ctrlBg}`}>
          <Text className={`text-xs font-bold ${muted}`}>
            Ukuran: <Text className={hc ? "text-white" : "text-slate-800"}>{settings.fontSize === 'normal' ? 'Normal' : settings.fontSize === 'large' ? 'Besar' : 'X. Besar'}</Text>
          </Text>
          <TouchableOpacity 
            onPress={() => setPaused(!paused)}
            className={`flex-row items-center gap-1.5 px-4 py-2 rounded-xl ${paused ? 'bg-blue-900' : hc ? 'bg-slate-700' : 'bg-slate-100'}`}
          >
            {paused ? <Play size={13} color="white" fill="white" /> : <Square size={13} color={hc ? "#e2e8f0" : "#334155"} fill={hc ? "#e2e8f0" : "#334155"} />}
            <Text className={`text-sm font-extrabold ${paused ? 'text-white' : hc ? 'text-slate-200' : 'text-slate-700'}`}>
              {paused ? "Lanjut" : "Jeda"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const TeacherLive = () => (
    <ScrollView className={`flex-1 ${bg} pt-4 pb-10`}>
      <View className="px-5 pt-3 pb-2">
        <Text className={`text-xl font-black ${textMain}`}>Kelola Sesi</Text>
        <Text className={`text-sm ${muted} mt-0.5`}>Biologi — XII IPA 3</Text>
      </View>

      <View className="items-center py-6 gap-4">
        <TouchableOpacity
          activeOpacity={0.93}
          onPress={() => { toggleRecording(); if (!isRecording) setElapsed(0); }}
          className={`w-28 h-28 rounded-full items-center justify-center shadow-lg ${isRecording ? "bg-red-500 shadow-red-500/40" : hc ? "bg-blue-800 shadow-blue-900/40" : "bg-blue-900 shadow-blue-900/40"}`}
        >
          <RNAnimated.View style={{ transform: [{ scale: pulseAnim }] }}>
            {isRecording ? <Square size={30} color="white" fill="white" /> : <Mic size={30} color="white" />}
          </RNAnimated.View>
          <Text className="text-white text-xs font-black mt-1">{isRecording ? "STOP" : "MULAI"}</Text>
        </TouchableOpacity>

        {isRecording ? (
          <View className="items-center gap-1">
            <View className="flex-row items-center gap-2">
              <PulseDot />
              <Text className={`font-mono font-black text-xl ${textMain}`}>{formatDuration(elapsed)}</Text>
            </View>
            <Text className={`text-xs ${muted}`}>Sesi sedang berjalan · 8 siswa terhubung</Text>
          </View>
        ) : (
          <Text className={`text-sm ${muted} text-center max-w-[200px]`}>
            Tekan untuk mulai merekam dan mentranskripsi suara
          </Text>
        )}
      </View>

      <View className="px-5 gap-3">
        {/* Participants stat */}
        <View className={`rounded-xl border p-4 flex-row items-center justify-between ${card}`}>
          <View className="flex-row items-center gap-3">
            <View className={`w-10 h-10 rounded-xl items-center justify-center ${hc ? "bg-blue-900" : "bg-blue-50"}`}>
              <Users size={17} color={hc ? "#93c5fd" : "#1d4ed8"} />
            </View>
            <View>
              <Text className={`font-extrabold text-sm ${textMain}`}>Peserta Bergabung</Text>
              <Text className={`text-xs ${muted}`}>dari 28 siswa terdaftar</Text>
            </View>
          </View>
          <Text className={`text-3xl font-black ${hc ? "text-blue-400" : "text-blue-900"}`}>8</Text>
        </View>

        {/* Join code */}
        <View className={`rounded-xl border p-4 ${card}`}>
          <Text className={`font-extrabold text-sm mb-3 ${textMain}`}>Kode Bergabung</Text>
          <View className="flex-row items-center gap-4">
            <View className={`w-16 h-16 rounded-xl items-center justify-center ${hc ? "bg-slate-700" : "bg-slate-100"}`}>
              {/* Fake QR */}
              <View className="flex-row flex-wrap w-10 h-10 gap-0.5">
                {[1,1,0,1, 0,1,1,0, 1,0,1,1, 0,1,0,1].map((b, i) => (
                  <View key={i} className={`w-2 h-2 rounded-[2px] ${b ? (hc ? "bg-white" : "bg-slate-800") : (hc ? "bg-slate-600" : "bg-slate-200")}`} />
                ))}
              </View>
            </View>
            <View>
              <Text className={`font-mono font-black text-2xl tracking-widest ${textMain}`}>BIO-4821</Text>
              <Text className={`text-xs ${muted} mt-1`}>Bagikan ke siswa untuk bergabung</Text>
            </View>
          </View>
        </View>

        {/* Participant chips */}
        <View className={`rounded-xl border p-4 ${card}`}>
          <Text className={`font-extrabold text-sm mb-2 ${textMain}`}>Siswa Online</Text>
          <View className="flex-row flex-wrap gap-2">
            {["Andi", "Siti", "Budi", "Rina", "Doni", "Maya", "Heri", "Lina"].map((name, i) => (
              <View key={i} className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${hc ? "bg-slate-700" : "bg-blue-50"}`}>
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className={`text-xs font-bold ${hc ? "text-slate-200" : "text-blue-800"}`}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* End Session Button */}
        {!isRecording && (
          <TouchableOpacity 
            onPress={() => { endSession(); router.replace('/(tabs)/home'); }}
            className={`mt-4 w-full py-3 rounded-xl items-center border ${hc ? "border-red-900/50 bg-red-900/20" : "border-red-200 bg-red-50"}`}
          >
            <Text className={hc ? "text-red-400 font-extrabold text-sm" : "text-red-600 font-extrabold text-sm"}>
              Akhiri Sesi
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className={`flex-1 ${bg}`}>
      {role === 'teacher' ? <TeacherLive /> : <StudentLive />}
    </SafeAreaView>
  );
}
