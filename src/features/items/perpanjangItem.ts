import { supabase } from '@/lib/supabase';

interface PerpanjangInput {
  itemId: string;
  jatuhTempoLama: string;
  jatuhTempoBaru: string;
}

/**
 * Menghitung estimasi tanggal jatuh tempo baru berdasarkan tanggal lama dan siklus bulan.
 * Jika tanggal lama sudah terlewat, tetap menambahkan siklus dari tanggal lama (atau dari hari ini bila perlu).
 */
export function hitungEstimasiJatuhTempoBaru(
  jatuhTempoLama: string | null,
  siklusBulan: number | null = 12
): Date {
  const bulan = siklusBulan && siklusBulan > 0 ? siklusBulan : 12;

  let baseDate: Date;
  if (jatuhTempoLama) {
    const [y, m, d] = jatuhTempoLama.split('-').map(Number);
    baseDate = new Date(y, m - 1, d);
  } else {
    baseDate = new Date();
  }

  const hasil = new Date(baseDate.getTime());
  hasil.setMonth(hasil.getMonth() + bulan);
  return hasil;
}

/**
 * Menyimpan perpanjangan dokumen:
 * 1. Memperbarui kolom `jatuh_tempo` di tabel `item`.
 * 2. Mencatat riwayat ke tabel `riwayat_perpanjangan`.
 */
export async function perpanjangItem(
  input: PerpanjangInput
): Promise<{ error: string | null }> {
  // 1. Update jatuh tempo di tabel item
  const { error: updateError } = await supabase
    .from('item')
    .update({ jatuh_tempo: input.jatuhTempoBaru })
    .eq('id', input.itemId);

  if (updateError) {
    return {
      error: `Gagal memperbarui tanggal jatuh tempo: ${updateError.message}`,
    };
  }

  // 2. Catat riwayat perpanjangan
  const { error: riwayatError } = await supabase
    .from('riwayat_perpanjangan')
    .insert({
      item_id: input.itemId,
      jatuh_tempo_lama: input.jatuhTempoLama,
      jatuh_tempo_baru: input.jatuhTempoBaru,
    });

  if (riwayatError) {
    // Riwayat gagal tapi item berhasil diupdate
    return {
      error: `Jatuh tempo diperbarui, namun riwayat gagal dicatat: ${riwayatError.message}`,
    };
  }

  return { error: null };
}
