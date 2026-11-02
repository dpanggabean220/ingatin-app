/**
 * Palet warna sistem desain INGATIN (Obsidian Dark & Burnt Orange Glow)
 * Sesuai referensi desain gelap elegan dengan aksen oranye hangat (#F25C05).
 */
export const Colors = {
  // Brand & Aksen Utama (Burnt Orange / Warm Amber)
  primary: '#F25C05',
  primaryDark: '#D94E04',
  primaryLight: '#3B2314',
  primaryContainer: '#F25C05',
  onPrimary: '#FFFFFF',
  surfaceTint: '#FF6B1A',

  // Canvas & Permukaan (Obsidian Dark & Warm Espresso Cards)
  canvas: '#0F0E0D',
  background: '#0F0E0D',
  surface: '#1B1815',
  surfaceContainerLowest: '#141210',
  surfaceContainerLow: '#231E1A',
  surfaceContainer: '#2A231D',
  surfaceContainerHigh: '#332A22',
  surfaceContainerHighest: '#3D3228',

  // Tipografi & Netral
  textPrimary: '#FFFFFF',
  textSecondary: '#A89F96',
  textMuted: '#6E655F',
  border: '#2E251E',
  borderLight: '#3B2E23',
  outline: '#8A8077',
  outlineVariant: '#42352B',

  // Status Kritis / Mendesak (<= 7 hari & kedaluwarsa)
  critical: '#EF4444',
  criticalDark: '#FCA5A5',
  criticalContainer: '#3B1818',
  onCriticalContainer: '#FCA5A5',
  error: '#EF4444',

  // Status Peringatan / Mendekati (8 - 30 hari)
  warning: '#F59E0B',
  warningDark: '#FCD34D',
  warningContainer: '#3B2812',
  onWarningContainer: '#FCD34D',

  // Status Aman (> 30 hari)
  safe: '#10B981',
  safeDark: '#6EE7B7',
  safeContainer: '#133326',
  safeContainerFixed: '#10B981',
  onSafeContainer: '#6EE7B7',
  success: '#10B981',

  // Tab Bar
  tabActive: '#F25C05',
  tabInactive: '#8A8077',
} as const;

export type ColorKey = keyof typeof Colors;
