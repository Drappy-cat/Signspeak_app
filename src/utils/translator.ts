import dictDataMad from '../assets/dictionary_id_mad.json';
import dictDataJv from '../assets/dictionary_id_jv.json';

const dictionaryMad: Record<string, string> = dictDataMad;
const dictionaryJv: Record<string, string> = dictDataJv;

let cachedRegexMad: RegExp | null = null;
let cachedRegexJv: RegExp | null = null;

const madureseKeys = Object.keys(dictionaryMad);

/**
 * Fast Levenshtein distance implementation for string similarity
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Perform fast fuzzy matching on Madurese dictionary keys
 */
function findFuzzyMatchMadurese(word: string): string | null {
  const lower = word.toLowerCase();
  if (lower.length < 4) return null; // Skip short words to avoid false positives

  let bestMatch: string | null = null;
  let minDistance = 3; // Maximum allowed edit distance is 2

  for (const key of madureseKeys) {
    if (Math.abs(key.length - lower.length) > 2) continue;

    const dist = levenshteinDistance(lower, key);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = key;
      if (dist === 1) break; // Found close match
    }
  }

  return bestMatch;
}

/**
 * Menerjemahkan kalimat Bahasa Indonesia ke Bahasa Madura secara real-time kata demi kata & frasa demi frasa (dengan Fuzzy Matching).
 */
export function translateToMadurese(text: string): string {
  if (!text) return '';

  if (!cachedRegexMad) {
    const sortedKeys = Object.keys(dictionaryMad).sort((a, b) => b.length - a.length);
    const escapedKeys = sortedKeys.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    cachedRegexMad = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');
  }

  // 1. First pass: Replace exact dictionary key matches
  const translated = text.replace(cachedRegexMad, (match) => {
    const lowerMatch = match.toLowerCase();
    const translation = dictionaryMad[lowerMatch];
    
    if (translation) {
      if (match === match.toUpperCase()) return translation.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return translation[0].toUpperCase() + translation.slice(1);
      return translation;
    }
    return match;
  });

  // 2. Second pass: Fuzzy match for remaining un-translated Indonesian words (if length >= 4)
  const words = translated.split(/(\s+)/);
  const resultWords = words.map(word => {
    if (!word || /^\s+$/.test(word)) return word;

    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if (!cleanWord || cleanWord.length < 4) return word;

    const fuzzyKey = findFuzzyMatchMadurese(cleanWord);
    if (fuzzyKey && dictionaryMad[fuzzyKey]) {
      const translation = dictionaryMad[fuzzyKey];
      let formattedTranslation = translation;
      if (cleanWord === cleanWord.toUpperCase()) {
        formattedTranslation = translation.toUpperCase();
      } else if (cleanWord[0] === cleanWord[0].toUpperCase()) {
        formattedTranslation = translation[0].toUpperCase() + translation.slice(1);
      }
      return word.replace(cleanWord, formattedTranslation);
    }

    return word;
  });

  return resultWords.join('');
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
