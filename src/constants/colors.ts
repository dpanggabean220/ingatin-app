/**
 * Palet warna sistem desain INGATIN Pro (Google Stitch)
 * Memadukan ungu royalti (#6D4AFF) dengan indikator tenggat waktu yang tegas.
 */
export const Colors = {
  // Brand & Aksen Utama
  primary: '#6D4AFF',
  primaryDark: '#5427E6',
  primaryLight: '#E5DEFF',
  primaryContainer: '#6D4AFF',
  onPrimary: '#FFFFFF',
  surfaceTint: '#5D36EF',

  // Canvas & Permukaan (Soft Lavender Canvas & Crisp Cards)
  canvas: '#FBF8FF',
  background: '#FBF8FF',
  surface: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F3F2FF',
  surfaceContainer: '#ECECFE',
  surfaceContainerHigh: '#E7E7F8',
  surfaceContainerHighest: '#E1E1F2',

  // Tipografi & Netral
  textPrimary: '#191B27',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#ECEEF5',
  borderLight: '#F1F3F9',
  outline: '#797588',
  outlineVariant: '#C9C4D9',

  // Status Kritis / Mendesak (<= 7 hari & kedaluwarsa)
  critical: '#EF4444',
  criticalDark: '#BA1A1A',
  criticalContainer: '#FFDAD6',
  onCriticalContainer: '#93000A',
  error: '#EF4444',

  // Status Peringatan / Mendekati (8 - 30 hari)
  warning: '#F59E0B',
  warningDark: '#794B00',
  warningContainer: '#FFDDB8',
  onWarningContainer: '#2A1700',

  // Status Aman (> 30 hari)
  safe: '#10B981',
  safeDark: '#006C49',
  safeContainer: '#ECFDF5',
  safeContainerFixed: '#6CF8BB',
  onSafeContainer: '#00714D',
  success: '#10B981',

  // Tab Bar
  tabActive: '#6D4AFF',
  tabInactive: '#94A3B8',
} as const;

export type ColorKey = keyof typeof Colors;
