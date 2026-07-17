import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated as RNAnimated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, MicOff, Square, Share, Info } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSession } from '../../src/contexts/SessionContext';
import { useSettings } from '../../src/contexts/SettingsContext';
import { KEYWORDS, DEMO_SENTENCES } from '../../src/constants/keywords';
import { parseHighlights, formatDuration } from '../../src/utils/formatters';
import { FontSizes } from '../../src/constants/theme';

export default function LiveScreen() {
  const { role } = useAuth();
  const { session, endSession, appendTranscript } = useSession();
  const { settings } = useSettings();
  const router = useRouter();

  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  // Active Session checking
  useEffect(() => {
    if (!session.isActive) {
      router.replace('/(tabs)/home');
    }
  }, [session.isActive]);

  // Demo transcription logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let sentenceIndex = 0;
    
    if (isRecording) {
      // Pulse animation for recording
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();

      // Demo text generation
      const sentences = DEMO_SENTENCES[session.language] || DEMO_SENTENCES['id'];
      
      timer = setInterval(() => {
        if (sentenceIndex < sentences.length) {
          appendTranscript(sentences[sentenceIndex]);
          sentenceIndex++;
        }
      }, 4000); // Add a new sentence every 4 seconds for demo
      
      // Timer
      const clockTimer = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);

      return () => {
        clearInterval(timer);
        clearInterval(clockTimer);
        pulseAnim.stopAnimation();
      };
    }
  }, [isRecording, session.language]);

  // Auto-scroll
  useEffect(() => {
    if (session.transcript) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [session.transcript]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleEndSession = async () => {
    setIsRecording(false);
    await endSession();
    router.replace('/(tabs)/home');
  };

  const currentKeywords = KEYWORDS[session.language] || KEYWORDS['id'];
  const fontSize = FontSizes[settings.fontSize].transcript;
  const lineHeight = FontSizes[settings.fontSize].lineHeight;
  const isHighContrast = settings.highContrast;

  const bgClass = isHighContrast ? 'bg-slate-900' : 'bg-slate-50';
  const textClass = isHighContrast ? 'text-white' : 'text-slate-800';
  const keywordBg = isHighContrast ? 'bg-amber-500' : 'bg-amber-200';
  const keywordText = isHighContrast ? 'text-slate-900' : 'text-amber-900';

  if (!session.isActive) return null;

  return (
    <View className={`flex-1 ${bgClass}`}>
      {/* Header */}
      <View className={`px-6 pt-12 pb-4 ${isHighContrast ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} border-b flex-row justify-between items-center`}>
        <View>
          <Text className={`${isHighContrast ? 'text-white' : 'text-slate-900'} text-xl font-black`}>
            {session.subject || 'Sesi Live'}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className={`w-2 h-2 rounded-full mr-2 ${isRecording ? 'bg-red-500' : 'bg-slate-300'}`} />
            <Text className={`${isHighContrast ? 'text-slate-300' : 'text-slate-500'} text-xs font-bold`}>
              {session.classCode || 'Umum'} • {formatDuration(elapsed)}
            </Text>
          </View>
        </View>
        
        {role === 'teacher' && (
          <TouchableOpacity onPress={handleEndSession} className="bg-red-100 p-2 rounded-xl border border-red-200">
            <Square size={20} color="#ef4444" fill="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Transcript Area */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-6 py-6"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {session.transcript === '' ? (
          <View className="flex-1 items-center justify-center pt-20">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isHighContrast ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <Info size={32} color={isHighContrast ? '#cbd5e1' : '#94a3b8'} />
            </View>
            <Text className={`text-center ${isHighContrast ? 'text-slate-400' : 'text-slate-500'} font-bold`}>
              {role === 'teacher' ? 'Tekan tombol mikrofon untuk mulai bicara' : 'Menunggu guru berbicara...'}
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize, lineHeight }} className={`${textClass} font-semibold`}>
            {parseHighlights(session.transcript, currentKeywords).map((part, i) => (
              part.isKeyword ? (
                <Text key={i} className={`${keywordBg} ${keywordText} font-black px-1`}>
                  {part.text}
                </Text>
              ) : (
                <Text key={i}>{part.text}</Text>
              )
            ))}
          </Text>
        )}
      </ScrollView>

      {/* Controls */}
      {role === 'teacher' && (
        <View className={`absolute bottom-6 self-center ${isHighContrast ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border px-6 py-4 rounded-full shadow-lg flex-row items-center space-x-6`}>
          <TouchableOpacity onPress={toggleRecording} className="items-center justify-center">
            {isRecording ? (
              <RNAnimated.View style={{ transform: [{ scale: pulseAnim }] }} className="w-16 h-16 bg-red-500 rounded-full items-center justify-center shadow-lg shadow-red-500/50">
                <Mic size={28} color="#ffffff" />
              </RNAnimated.View>
            ) : (
              <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-blue-600/50">
                <MicOff size={28} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
