import { Platform } from 'react-native';

/**
 * Format seconds into MM:SS string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds into human-readable duration (e.g., "45 mnt")
 */
export function formatDurationLabel(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} mnt`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours} jam ${remainingMins} mnt` : `${hours} jam`;
}

/**
 * Get current time as HH:MM string (Indonesian locale)
 */
export function getTime(): string {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format number with Indonesian locale (e.g., 1.240)
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('id-ID');
}

/**
 * Format large numbers with K/M suffix
 */
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Generate a random class code (e.g., "BIO-4821")
 */
export function generateClassCode(subject: string): string {
  const prefix = subject.substring(0, 3).toUpperCase();
  const code = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${code}`;
}

/**
 * Parse text and identify keyword segments for highlighting
 */
export function parseHighlights(
  text: string,
  keywords: string[]
): Array<{ text: string; isKeyword: boolean }> {
  const lower = text.toLowerCase();
  const ranges: Array<{ start: number; end: number }> = [];

  for (const kw of keywords) {
    let idx = 0;
    while (idx < lower.length) {
      const pos = lower.indexOf(kw, idx);
      if (pos === -1) break;
      ranges.push({ start: pos, end: pos + kw.length });
      idx = pos + kw.length;
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  const result: Array<{ text: string; isKeyword: boolean }> = [];
  let pos = 0;
  for (const range of ranges) {
    if (range.start < pos) continue;
    if (range.start > pos) {
      result.push({ text: text.slice(pos, range.start), isKeyword: false });
    }
    result.push({ text: text.slice(range.start, range.end), isKeyword: true });
    pos = range.end;
  }
  if (pos < text.length) {
    result.push({ text: text.slice(pos), isKeyword: false });
  }
  return result;
}

export function getCardShadow(hc: boolean, level: 'sm' | 'md' | 'lg' = 'md') {
  if (hc) {
    return {
      borderWidth: 1,
      borderColor: '#334155',
    };
  }

  if (Platform.OS === 'web') {
    if (level === 'sm') {
      return {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        borderColor: '#e2e8f0',
      };
    }
    if (level === 'lg') {
      return {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        borderWidth: 1,
        borderColor: '#e2e8f0',
      };
    }
    return {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.07)',
      borderWidth: 1,
      borderColor: '#f1f5f9',
    };
  }

  // Native iOS/Android shadows
  if (level === 'sm') {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    };
  }
  if (level === 'lg') {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  };
}

