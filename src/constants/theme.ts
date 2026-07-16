// SignSpeak Theme Constants
// Color palette matching the Figma prototype

export const Colors = {
  light: {
    // Primary blues
    primary: '#1e3a8a',
    primaryLight: '#3b82f6',
    primaryDark: '#0c2461',

    // Background
    background: '#F0F7FF',
    surface: '#FFFFFF',
    surfaceVariant: '#F8FAFC',

    // Text
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',

    // Accent
    accent: '#f59e0b',
    accentLight: '#fbbf24',

    // Status
    success: '#10b981',
    successLight: '#34d399',
    error: '#dc2626',
    errorLight: '#f87171',
    warning: '#f59e0b',
    info: '#3b82f6',

    // Borders
    border: 'rgba(15, 23, 42, 0.08)',
    borderLight: '#E2E8F0',

    // Keyword highlighting
    keywordBg: '#FEF3C7',
    keywordText: '#92400E',

    // Cards
    card: '#FFFFFF',
    cardBorder: '#F1F5F9',

    // Navigation
    navActive: '#1e3a8a',
    navInactive: '#94A3B8',
    navBg: '#FFFFFF',

    // Icons
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8',

    // Buttons
    buttonPrimary: '#1e3a8a',
    buttonSecondary: '#F1F5F9',
    buttonSecondaryText: '#475569',
    buttonDanger: '#FEF2F2',
    buttonDangerText: '#DC2626',
  },
  dark: {
    // Primary blues (high contrast mode)
    primary: '#93C5FD',
    primaryLight: '#60A5FA',
    primaryDark: '#1e3a8a',

    // Background
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',

    // Text
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Accent
    accent: '#fbbf24',
    accentLight: '#FCD34D',

    // Status
    success: '#34d399',
    successLight: '#6EE7B7',
    error: '#f87171',
    errorLight: '#FCA5A5',
    warning: '#fbbf24',
    info: '#60A5FA',

    // Borders
    border: 'rgba(248, 250, 252, 0.08)',
    borderLight: '#334155',

    // Keyword highlighting
    keywordBg: '#F59E0B',
    keywordText: '#0F172A',

    // Cards
    card: '#1E293B',
    cardBorder: '#334155',

    // Navigation
    navActive: '#60A5FA',
    navInactive: '#64748B',
    navBg: '#1E293B',

    // Icons
    iconBg: '#1e3a8a',
    iconColor: '#93C5FD',

    // Buttons
    buttonPrimary: '#1D4ED8',
    buttonSecondary: '#334155',
    buttonSecondaryText: '#CBD5E1',
    buttonDanger: 'rgba(127, 29, 29, 0.4)',
    buttonDangerText: '#F87171',
  },
};

export const FontSizes = {
  normal: {
    transcript: 20,
    lineHeight: 30,
  },
  large: {
    transcript: 24,
    lineHeight: 34,
  },
  xlarge: {
    transcript: 30,
    lineHeight: 40,
  },
};

export const FontSizeLabels: Record<string, string> = {
  normal: 'Normal',
  large: 'Besar',
  xlarge: 'X. Besar',
};

export type FontSizeKey = 'normal' | 'large' | 'xlarge';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Gradients = {
  primary: ['#0c2461', '#1a3a8a'] as const,
  primaryAlt: ['#1a3a8a', '#1e40af'] as const,
  hero: ['#0c2461', '#1e40af'] as const,
};
