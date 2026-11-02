import { jadwalkanPengingatItem } from '@/lib/notifications';
import { perpanjangItemOfflineFirst } from '@/utils/offlineStore';

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
 * Menyimpan perpanjangan dokumen secara 100% Offline-First:
 * 1. Memperbarui `jatuh_tempo` secara lokal & cloud.
 * 2. Mencatat riwayat ke penyimpanan lokal & tabel `riwayat_perpanjangan`.
 */
export async function perpanjangItem(
  input: PerpanjangInput
): Promise<{ error: string | null }> {
  try {
    const { item: updatedItem } = await perpanjangItemOfflineFirst(input);

    if (updatedItem?.jatuh_tempo) {
      await jadwalkanPengingatItem({
        id: updatedItem.id,
        judul: updatedItem.judul,
        jatuh_tempo: updatedItem.jatuh_tempo,
        tingkat_pengingat: updatedItem.tingkat_pengingat,
      });
    }

    return { error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal memperpanjang dokumen.';
    return { error: msg };
  }
}

