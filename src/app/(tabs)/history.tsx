import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Platform, StatusBar as RNStatusBar, Modal, Share } from 'react-native';
import { Search, BookOpen, Clock, HelpCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { DICT } from '../../constants/i18n';
import { getCardShadow, parseHighlights } from '../../utils/formatters';
import { useFocusEffect } from 'expo-router';
import { getHistory, SessionRecord } from '../../services/db';
import { KEYWORDS, GLOSSARY, LANGUAGE_LABELS } from '../../constants/keywords';
import { getOriginalIndonesianWord } from '../../utils/translator';
import { FontSizes } from '../../constants/theme';

// Using mock data to match prototype
const HISTORY_DATA = [
  { id: 1, subject: "Biologi", kelas: "XII IPA 3", teacher: "Bu Sari Dewi", date: "Hari ini, 08:00", duration: "45 mnt", words: 1240, excerpt: "...fotosintesis terjadi di dalam kloroplas pada sel tumbuhan..." },
  { id: 2, subject: "Matematika", kelas: "XII IPA 3", teacher: "Pak Budi Santoso", date: "Kemarin, 10:00", duration: "50 mnt", words: 980, excerpt: "...turunan fungsi trigonometri dan aplikasi integral..." },
  { id: 3, subject: "Fisika", kelas: "XII IPA 3", teacher: "Pak Ahmad Rizki", date: "Senin, 11:00", duration: "45 mnt", words: 1100, excerpt: "...hukum Newton tentang gerak, gaya, dan percepatan..." },
  { id: 4, subject: "Kimia", kelas: "XII IPA 3", teacher: "Bu Ratna Sari", date: "Jumat, 08:00", duration: "45 mnt", words: 890, excerpt: "...ikatan kovalen polar dan struktur Lewis molekul..." },
];

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
          const words = part.text.split(/(\s+)/);
          return words.map((word, wi) => {
            if (word.trim() === '') {
              return <Text key={`${i}-${wi}`} style={{ color: textColorStr }}>{word}</Text>;
            }
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

export default function HistoryScreen() {
  const { settings } = useSettings();
  const hc = settings.highContrast;
  const appLang = settings.appLang || 'id';
  const d = DICT[appLang];

  const [historyList, setHistoryList] = React.useState<SessionRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedSession, setSelectedSession] = React.useState<SessionRecord | null>(null);

  // Glossary and Word Info Modal states
  const [glossaryVisible, setGlossaryVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [glossaryDef, setGlossaryDef] = useState<string | null>(null);
  const [originalIndoWord, setOriginalIndoWord] = useState<string | null>(null);

  const parseTranscriptAndGlossary = (rawTranscript: string) => {
    let cleanText = rawTranscript || '';
    let customGlossary: Record<string, string> = {};
    let customKeywords: string[] = [];

    if (rawTranscript && rawTranscript.includes("\n\n---GLOSSARY---\n")) {
      const parts = rawTranscript.split("\n\n---GLOSSARY---\n");
      cleanText = parts[0];
      try {
        customGlossary = JSON.parse(parts[1]);
        customKeywords = Object.keys(customGlossary);
      } catch (_) {}
    }

    return { cleanText, customGlossary, customKeywords };
  };

  const handleWordLongPress = async (word: string) => {
    if (!word || !selectedSession) return;
    
    const cleanWord = word.toLowerCase().trim();
    setSelectedWord(word);
    
    // Parse glossary metadata
    const { customGlossary } = parseTranscriptAndGlossary(selectedSession.transcriptFull || selectedSession.excerpt);
    
    // Check if it has a glossary definition
    let def = null;
    if (customGlossary && customGlossary[cleanWord]) {
      def = customGlossary[cleanWord];
    } else if (GLOSSARY[cleanWord]) {
      def = GLOSSARY[cleanWord][appLang] || GLOSSARY[cleanWord]['id'];
    }
    setGlossaryDef(def);
    
    // Check if it's a translated word (Madurese or Javanese)
    let original = null;
    if (selectedSession.language === 'mad' || selectedSession.language === 'jv') {
      original = getOriginalIndonesianWord(cleanWord, selectedSession.language);
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

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      getHistory().then(data => {
        if (isMounted) {
          setHistoryList(data);
          setLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const bgColor = hc ? "#0f172a" : "#F0F7FF";
  const textColor = hc ? '#f8fafc' : '#0f172a';
  const mutedColor = hc ? '#94a3b8' : '#64748b';

  const cardStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    ...getCardShadow(hc, 'md'),
  };

  const searchStyle = {
    backgroundColor: hc ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    ...getCardShadow(hc, 'sm'),
  };

  const iconBgColor = hc ? '#1e3a8a' : '#eff6ff';
  const iconColor = hc ? "#93c5fd" : "#1d4ed8";
  const dividerColor = hc ? '#334155' : '#f1f5f9';
  const linkColor = hc ? '#60a5fa' : '#1e40af';

  const headerTitle = appLang === 'en' ? 'Transcript History' : 'Riwayat Transkrip';
  const searchPlaceholder = appLang === 'en' ? 'Search subjects or keywords...' : 'Cari mata pelajaran atau kata kunci...';
  const sectionHeader = appLang === 'en' ? 'This Week' : 'Minggu Ini';
  const completedLabel = appLang === 'en' ? 'Completed' : 'Selesai';
  const wordsLabel = appLang === 'en' ? 'words' : 'kata';
  const openLabel = appLang === 'en' ? 'Open →' : 'Buka →';

  const androidPadding = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  // Filter history based on search query
  const filteredHistory = historyList.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      (item.subject || '').toLowerCase().includes(query) ||
      (item.teacherName || '').toLowerCase().includes(query) ||
      (item.className || '').toLowerCase().includes(query) ||
      (item.excerpt || '').toLowerCase().includes(query) ||
      (item.transcriptFull || '').toLowerCase().includes(query)
    );
  });

  const handleShare = async (session: SessionRecord) => {
    try {
      const languageLabel = session.language === 'en' ? 'English' : session.language === 'jv' ? 'Jawa' : 'Madura';
      const durationStr = `${Math.floor(session.duration / 60)} mnt ${session.duration % 60} dtk`;
      
      const shareMessage = `📚 *RANGKUMAN KELAS LENTERA*\n\n` +
        `📖 *Mata Pelajaran:* ${session.subject}\n` +
        `🏫 *Kelas:* ${session.className}\n` +
        `👤 *Guru:* ${session.teacherName}\n` +
        `🌐 *Bahasa:* ${languageLabel}\n` +
        `⏱️ *Durasi:* ${durationStr}\n` +
        `📊 *Jumlah Kata:* ${session.wordCount}\n` +
        `📅 *Tanggal:* ${session.date}\n\n` +
        `📝 *Transkrip Lengkap:* \n` +
        `"${session.transcriptFull || session.excerpt}"\n\n` +
        `--- Diposkan via LENTERA App ---`;

      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error('[Share] Error sharing transcript:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: androidPadding }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', marginBottom: 12, color: textColor }}>{headerTitle}</Text>
        {/* Search bar */}
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }, searchStyle]}>
          <Search size={15} color={mutedColor} />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={mutedColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, fontSize: 14, fontWeight: '500', color: textColor, padding: 0 }}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', color: mutedColor, marginBottom: 2 }}>
          {sectionHeader}
        </Text>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: mutedColor, fontSize: 14 }}>
              {appLang === 'en' ? 'Loading history...' : 'Memuat riwayat...'}
            </Text>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: mutedColor, fontSize: 14 }}>
              {appLang === 'en' ? 'No history records found' : 'Tidak ada riwayat kelas'}
            </Text>
          </View>
        ) : (
          filteredHistory.map(item => (
            <TouchableOpacity 
              key={item.id} 
              activeOpacity={0.9} 
              onPress={() => setSelectedSession(item)}
              style={cardStyle}
            >
              {/* Card body */}
              <View style={{ padding: 16, flexDirection: 'row', gap: 12 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: iconBgColor,
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                }}>
                  <BookOpen size={17} color={iconColor} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '800', fontSize: 14, color: textColor }}>{item.subject}</Text>
                  <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{item.teacherName} · {item.className}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Clock size={10} color={mutedColor} />
                    <Text style={{ fontSize: 12, color: mutedColor }}>
                      {item.date} · {Math.floor(item.duration / 60)} mnt {item.duration % 60} dtk
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: mutedColor, marginTop: 6, fontStyle: 'italic', lineHeight: 18 }} numberOfLines={2}>
                    {item.excerpt}
                  </Text>
                </View>
              </View>

              {/* Card footer */}
              <View style={{
                marginHorizontal: 16, paddingTop: 10, paddingBottom: 12,
                borderTopWidth: 1, borderTopColor: dividerColor,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: mutedColor }}>
                    {item.wordCount.toLocaleString('id-ID')} {wordsLabel}
                  </Text>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: hc ? '#475569' : '#cbd5e1' }} />
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: hc ? '#1e293b' : '#ecfdf5' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: hc ? '#94a3b8' : '#059669' }}>{completedLabel}</Text>
                  </View>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedSession(item)}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: linkColor }}>{openLabel}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selectedSession !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSession(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            height: '85%',
            backgroundColor: hc ? '#0f172a' : '#f0f7ff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 16,
            ...getCardShadow(hc, 'lg')
          }}>
            {/* Modal Drag Indicator */}
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: hc ? '#475569' : '#cbd5e1' }} />
            </View>

            {selectedSession && (
              <View style={{ flex: 1, paddingHorizontal: 20 }}>
                {/* Modal Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: textColor }}>{selectedSession.subject}</Text>
                    <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>
                      {selectedSession.teacherName} · {selectedSession.className}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setSelectedSession(null)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: hc ? '#1e293b' : '#e2e8f0' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: textColor }}>
                      {appLang === 'en' ? 'Close' : 'Tutup'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Session Stats */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: hc ? '#1e293b' : '#ffffff', borderWidth: 1, borderColor: dividerColor }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: mutedColor, textTransform: 'uppercase' }}>
                      {appLang === 'en' ? 'Duration' : 'Durasi'}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: textColor, marginTop: 2 }}>
                      {Math.floor(selectedSession.duration / 60)}m {selectedSession.duration % 60}s
                    </Text>
                  </View>
                  <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: hc ? '#1e293b' : '#ffffff', borderWidth: 1, borderColor: dividerColor }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: mutedColor, textTransform: 'uppercase' }}>
                      {appLang === 'en' ? 'Word Count' : 'Jumlah Kata'}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: textColor, marginTop: 2 }}>
                      {selectedSession.wordCount}
                    </Text>
                  </View>
                  <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: hc ? '#1e293b' : '#ffffff', borderWidth: 1, borderColor: dividerColor }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: mutedColor, textTransform: 'uppercase' }}>
                      {appLang === 'en' ? 'Language' : 'Bahasa'}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: textColor, marginTop: 2 }}>
                      {selectedSession.language === 'en' ? 'English' : selectedSession.language === 'jv' ? 'Jawa' : 'Madura'}
                    </Text>
                  </View>
                </View>

                {/* Full Transcript Area */}
                <Text style={{ fontSize: 11, fontWeight: '800', color: mutedColor, textTransform: 'uppercase', marginBottom: 6 }}>
                  {appLang === 'en' ? 'Full Transcript' : 'Transkrip Lengkap'}
                </Text>
                <View style={{ flex: 1, borderRadius: 12, backgroundColor: hc ? '#1e293b' : '#ffffff', borderWidth: 1, borderColor: dividerColor, padding: 16, marginBottom: 16 }}>
                  {(() => {
                    const { cleanText, customKeywords } = parseTranscriptAndGlossary(selectedSession.transcriptFull || selectedSession.excerpt);
                    const defaultKeywords = KEYWORDS[selectedSession.language] || KEYWORDS['id'];
                    const currentKeywords = [...defaultKeywords, ...customKeywords];
                    const activeFontSize = FontSizes[settings.fontSize] || FontSizes.normal;
                    const sentences = (cleanText || '').split(/(?<=[.!?])\s+/).filter(Boolean);

                    return (
                      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ gap: 8 }}>
                        {sentences.length === 0 ? (
                          <Text style={{ fontSize: 15, lineHeight: 24, fontWeight: '600', color: textColor }}>
                            {cleanText}
                          </Text>
                        ) : (
                          sentences.map((sentence, idx) => (
                            <View key={idx} style={{ marginBottom: 4 }}>
                              <HighlightText
                                text={sentence}
                                keywords={currentKeywords}
                                hc={hc}
                                fontSize={activeFontSize}
                                isOld={false}
                                onWordLongPress={handleWordLongPress}
                              />
                            </View>
                          ))
                        )}
                      </ScrollView>
                    );
                  })()}
                </View>

                {/* Actions Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleShare(selectedSession)}
                  style={{
                    backgroundColor: '#1e3a8a',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginBottom: 24,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                    {appLang === 'en' ? 'Share Transcript' : 'Bagikan Kelas (WhatsApp)'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
            {selectedSession && originalIndoWord ? (
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
                    ? `Translated to ${LANGUAGE_LABELS[selectedSession.language || 'id']} in transcript` 
                    : `Diterjemahkan ke Bahasa ${LANGUAGE_LABELS[selectedSession.language || 'id']} pada transkrip`}
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
                ...getCardShadow(hc, 'sm'),
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                {appLang === 'en' ? 'Close' : 'Tutup'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
