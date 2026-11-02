import AsyncStorage from '@react-native-async-storage/async-storage';

import { hapusSemuaPengingatKilat } from '@/features/quick-reminders/quickReminders';
import { batalkanSemuaPengingatLokal } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { OFFLINE_ITEMS_KEY, OFFLINE_RIWAYAT_KEY } from '@/utils/offlineStore';

export interface TautkanAkunResult {
  berhasil: boolean;
  email?: string;
  pesan?: string;
}

/**
 * Mentautkan sesi login anonim pengguna saat ini ke email dan kata sandi permanen.
 * Menggunakan Supabase Auth `updateUser`.
 */
export async function tautkanAkunEmail(
  email: string,
  kataSandi: string
): Promise<TautkanAkunResult> {
  const emailTrimmed = email.trim().toLowerCase();

  // Validasi input
  if (!emailTrimmed || !emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
    throw new Error('Alamat email tidak valid. Silakan periksa kembali.');
  }

  if (!kataSandi || kataSandi.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter demi keamanan akunmu.');
  }

  const { data, error } = await supabase.auth.updateUser({
    email: emailTrimmed,
    password: kataSandi,
  });

  if (error) {
    // Terjemahkan error umum Supabase ke Bahasa Indonesia yang ramah
    if (error.message.includes('already registered') || error.message.includes('User already registered')) {
      throw new Error('Alamat email ini sudah terdaftar pada akun lain.');
    }
    if (error.message.includes('Password should be at least')) {
      throw new Error('Kata sandi minimal 6 karakter.');
    }
    throw new Error(error.message || 'Gagal menautkan akun email.');
  }

  return {
    berhasil: true,
    email: data.user?.email ?? emailTrimmed,
    pesan: 'Akun berhasil ditautkan! Data dokumenmu kini aman tersimpan.',
  };
}

/**
 * Menghapus seluruh data dokumen dan riwayat milik pengguna,
 * membatalkan seluruh jadwal notifikasi lokal,
 * lalu mereset sesi akun kembali ke sesi anonim baru.
 */
export async function hapusAkunDanSeluruhData(userId: string): Promise<boolean> {
  // 1. Bersihkan penyimpanan lokal Offline-First & Pengingat Kilat
  await Promise.all([
    AsyncStorage.removeItem(OFFLINE_ITEMS_KEY),
    AsyncStorage.removeItem(OFFLINE_RIWAYAT_KEY),
    hapusSemuaPengingatKilat(),
    batalkanSemuaPengingatLokal(),
  ]);

  // 2. Hapus dari cloud backup Supabase bila online dan ada userId
  if (userId) {
    try {
      await supabase.from('riwayat_perpanjangan').delete().eq('user_id', userId);
      await supabase.from('item').delete().eq('user_id', userId);
      await supabase.auth.signOut();
      await supabase.auth.signInAnonymously();
    } catch (err) {
      console.warn('[Hapus Akun] Sedang offline, data lokal telah dibersihkan:', err);
    }
  }

  return true;
}

