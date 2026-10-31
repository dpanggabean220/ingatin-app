/** Palet warna utama INGATIN */
export const Colors = {
  /** Ungu utama */
  primary: '#6D4AFF',
  /** Variasi lebih gelap untuk pressed state */
  primaryDark: '#5535DD',
  /** Latar belakang umum */
  background: '#FFFFFF',
  /** Latar belakang sekunder / card */
  surface: '#F5F5F5',
  /** Teks utama */
  textPrimary: '#1A1A2E',
  /** Teks sekunder / hint */
  textSecondary: '#6B6B8D',
  /** Garis pemisah */
  border: '#E0E0E0',
  /** Warna sukses */
  success: '#22C55E',
  /** Warna peringatan */
  warning: '#F59E0B',
  /** Warna error */
  error: '#EF4444',
  /** Tab bar aktif */
  tabActive: '#6D4AFF',
  /** Tab bar tidak aktif */
  tabInactive: '#9CA3AF',
} as const;

export type ColorKey = keyof typeof Colors;

