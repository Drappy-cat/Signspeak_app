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

  // Normalize multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Split into sentences by existing punctuation (. ! ?)
  const sentences = cleaned.split(/(?<=[.!?])\s+/);

  const processedSentences = sentences.map(sentence => {
    let s = sentence.trim();
    if (!s) return '';

    // Capitalize first letter of each sentence
    s = s.charAt(0).toUpperCase() + s.slice(1);

    return s;
  });

  let result = processedSentences.filter(Boolean).join(' ');

  // Ensure trailing sentence ending punctuation if length > 3 and doesn't end with punctuation
  if (result.length > 3 && !/[.!?]$/.test(result)) {
    result += '.';
  }

  return result;
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
  if (customGlossary && Object.keys(customGlossary).length > 0) {
    for (const [key] of Object.entries(customGlossary)) {
      if (!key.trim()) continue;
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKey}\\b`, 'gi');
      processed = processed.replace(regex, (match) => {
        if (match === match.toUpperCase()) return key.toUpperCase();
        if (match[0] === match[0].toUpperCase()) return key[0].toUpperCase() + key.slice(1);
        return key;
      });
    }
  }

  return processed;
}
