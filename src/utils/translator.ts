import dictDataMad from '../assets/dictionary_id_mad.json';
import dictDataJv from '../assets/dictionary_id_jv.json';

const dictionaryMad: Record<string, string> = dictDataMad;
const dictionaryJv: Record<string, string> = dictDataJv;

let cachedRegexMad: RegExp | null = null;
let cachedRegexJv: RegExp | null = null;

/**
 * Menerjemahkan kalimat Bahasa Indonesia ke Bahasa Madura secara real-time kata demi kata & frasa demi frasa.
 */
export function translateToMadurese(text: string): string {
  if (!text) return '';

  if (!cachedRegexMad) {
    const sortedKeys = Object.keys(dictionaryMad).sort((a, b) => b.length - a.length);
    const escapedKeys = sortedKeys.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    cachedRegexMad = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');
  }

  return text.replace(cachedRegexMad, (match) => {
    const lowerMatch = match.toLowerCase();
    const translation = dictionaryMad[lowerMatch];
    
    if (translation) {
      if (match === match.toUpperCase()) return translation.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return translation[0].toUpperCase() + translation.slice(1);
      return translation;
    }
    return match;
  });
}

/**
 * Menerjemahkan kalimat Bahasa Indonesia ke Bahasa Jawa secara real-time kata demi kata & frasa demi frasa.
 */
export function translateToJavanese(text: string): string {
  if (!text) return '';

  if (!cachedRegexJv) {
    const sortedKeys = Object.keys(dictionaryJv).sort((a, b) => b.length - a.length);
    const escapedKeys = sortedKeys.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    cachedRegexJv = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');
  }

  return text.replace(cachedRegexJv, (match) => {
    const lowerMatch = match.toLowerCase();
    const translation = dictionaryJv[lowerMatch];
    
    if (translation) {
      if (match === match.toUpperCase()) return translation.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return translation[0].toUpperCase() + translation.slice(1);
      return translation;
    }
    return match;
  });
}

let cachedReverseDictMad: Record<string, string> | null = null;
let cachedReverseDictJv: Record<string, string> | null = null;

/**
 * Mencari kata asli Bahasa Indonesia dari kata terjemahan Bahasa Madura/Jawa (Reverse Lookup)
 */
export function getOriginalIndonesianWord(translatedWord: string, lang: string): string | null {
  if (!translatedWord) return null;
  
  if (lang === 'mad') {
    if (!cachedReverseDictMad) {
      cachedReverseDictMad = {};
      for (const [indo, mad] of Object.entries(dictionaryMad)) {
        cachedReverseDictMad[mad.toLowerCase()] = indo;
      }
    }
    return cachedReverseDictMad[translatedWord.toLowerCase()] || null;
  }
  
  if (lang === 'jv') {
    if (!cachedReverseDictJv) {
      cachedReverseDictJv = {};
      for (const [indo, jv] of Object.entries(dictionaryJv)) {
        cachedReverseDictJv[jv.toLowerCase()] = indo;
      }
    }
    return cachedReverseDictJv[translatedWord.toLowerCase()] || null;
  }
  
  return null;
}
