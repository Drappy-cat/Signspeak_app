/**
 * Utility functions for STT post-processing: Auto-Punctuation, Capitalization, and Glossary Corrections.
 */

/**
 * Capitalizes the first letter of a sentence or string
 */
export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats STT text with automatic punctuation (periods, sentence capitalization)
 */
export function formatAutoPunctuation(text: string): string {
  if (!text || !text.trim()) return '';

  let cleaned = text.trim();
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Split into sentences backwards-compatibly without regex lookbehinds for legacy Android engines
  const parts = cleaned.split(/([.!?])\s+/);
  let result = '';
  for (let i = 0; i < parts.length; i += 2) {
    let sentence = parts[i]?.trim();
    if (!sentence) continue;
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    const punc = parts[i + 1] || '';
    result += (result ? ' ' : '') + sentence + punc;
  }

  let finalRes = result.trim();
  if (finalRes.length > 3 && !/[.!?]$/.test(finalRes)) {
    finalRes += '.';
  }

  return finalRes;
}

/**
 * Replaces common STT misheard terms with exact terms defined in custom glossary
 */
export function applyGlossaryCorrections(
  text: string,
  customGlossary?: Record<string, string>
): string {
  if (!text) return '';

  let processed = text;

  // Apply custom glossary corrections if present
  // B4 Fix: Replace misheard words (keys) with their correct form (values)
  if (customGlossary && Object.keys(customGlossary).length > 0) {
    for (const [key, value] of Object.entries(customGlossary)) {
      if (!key.trim() || !value.trim()) continue;
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKey}\\b`, 'gi');
      processed = processed.replace(regex, (match) => {
        // Preserve original casing pattern
        if (match === match.toUpperCase()) return value.toUpperCase();
        if (match[0] === match[0].toUpperCase()) return value[0].toUpperCase() + value.slice(1);
        return value;
      });
    }
  }

  return processed;
}
