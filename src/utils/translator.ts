import dictData from '../assets/dictionary_id_mad.json';

const dictionary: Record<string, string> = dictData;
let cachedRegex: RegExp | null = null;

/**
 * Menerjemahkan kalimat Bahasa Indonesia ke Bahasa Madura secara real-time kata demi kata & frasa demi frasa.
 * Mempertahankan tanda baca, spasi, dan gaya penulisan huruf besar/kecil.
 */
export function translateToMadurese(text: string): string {
  if (!text) return '';

  if (!cachedRegex) {
    // Urutkan kunci berdasarkan panjang karakter menurun agar frasa panjang (e.g. "kemarin malam")
    // dicocokkan terlebih dahulu sebelum kata tunggal (e.g. "malam")
    const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
    const escapedKeys = sortedKeys.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    // Compile semua kunci menjadi satu regular expression state machine untuk pencarian O(N) instan
    cachedRegex = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');
  }

  return text.replace(cachedRegex, (match) => {
    const lowerMatch = match.toLowerCase();
    const translation = dictionary[lowerMatch];
    
    if (translation) {
      // Pertahankan huruf besar jika kata asli menggunakan huruf besar semua
      if (match === match.toUpperCase()) {
        return translation.toUpperCase();
      }
      // Pertahankan huruf besar di awal kata (Capitalized)
      if (match[0] === match[0].toUpperCase()) {
        return translation[0].toUpperCase() + translation.slice(1);
      }
      return translation;
    }
    
    return match;
  });
}
