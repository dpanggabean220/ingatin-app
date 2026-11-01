import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Utilitas Haptic Feedback untuk memberikan mikro-interaksi taktil yang mulus.
 * Dilengkapi dengan fallback aman (.catch) agar tidak memicu error di simulator atau web.
 */
export const haptic = {
  /** Sentuhan sangat ringan: cocok untuk filter kategori, chip, dan toggle */
  selection: () => {
    if (Platform.OS === 'web') return;
    Haptics.selectionAsync().catch(() => {});
  },

  /** Sentuhan ringan: cocok untuk kartu dokumen, tombol sekunder, dan navigasi */
  light: () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },

  /** Sentuhan sedang: cocok untuk FAB (+ Tambah), tombol Simpan, Perpanjang */
  medium: () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },

  /** Sentuhan tegas: cocok untuk tombol konfirmasi penting */
  heavy: () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },

  /** Umpan balik sukses: dokumen tersimpan, berhasil perpanjang, akun ditautkan */
  success: () => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },

  /** Umpan balik peringatan: batal atau konfirmasi sebelum hapus */
  warning: () => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },

  /** Umpan balik bahaya/error: aksi hapus dokumen atau hapus seluruh data */
  error: () => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};

