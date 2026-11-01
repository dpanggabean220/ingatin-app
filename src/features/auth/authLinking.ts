import { supabase } from '@/lib/supabase';
import { batalkanSemuaPengingatLokal } from '@/lib/notifications';

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
  if (!userId) {
    throw new Error('User ID tidak ditemukan.');
  }

  // 1. Hapus riwayat perpanjangan milik pengguna
  const { error: errRiwayat } = await supabase
    .from('riwayat_perpanjangan')
    .delete()
    .eq('user_id', userId);

  if (errRiwayat) {
    console.warn('[Hapus Akun] Gagal menghapus riwayat perpanjangan:', errRiwayat);
  }

  // 2. Hapus dokumen/item milik pengguna
  const { error: errItem } = await supabase
    .from('item')
    .delete()
    .eq('user_id', userId);

  if (errItem) {
    throw new Error(`Gagal menghapus data dokumen: ${errItem.message}`);
  }

  // 3. Batalkan semua pengingat notifikasi lokal di perangkat
  await batalkanSemuaPengingatLokal();

  // 4. Keluar dari sesi Supabase
  await supabase.auth.signOut();

  // 5. Buat sesi anonim baru yang bersih
  const { error: errNewAnon } = await supabase.auth.signInAnonymously();
  if (errNewAnon) {
    console.warn('[Hapus Akun] Gagal membuat sesi anonim baru setelah keluar:', errNewAnon);
  }

  return true;
}
