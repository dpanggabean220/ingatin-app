import { jadwalkanPengingatItem } from '@/lib/notifications';
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
  const { data: updatedItem, error: updateError } = await supabase
    .from('item')
    .update({ jatuh_tempo: input.jatuhTempoBaru })
    .eq('id', input.itemId)
    .select('id, judul, jatuh_tempo, tingkat_pengingat')
    .single();

  if (updateError || !updatedItem) {
    return {
      error: `Gagal memperbarui tanggal jatuh tempo: ${updateError?.message}`,
    };
  }

  // Daftarkan jadwal pengingat baru untuk tanggal perpanjangan
  if (updatedItem.jatuh_tempo) {
    await jadwalkanPengingatItem({
      id: updatedItem.id,
      judul: updatedItem.judul,
      jatuh_tempo: updatedItem.jatuh_tempo,
      tingkat_pengingat: updatedItem.tingkat_pengingat,
    });
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

