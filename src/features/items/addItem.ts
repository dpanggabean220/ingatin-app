import { jadwalkanPengingatItem } from '@/lib/notifications';
import type { InsertItem } from '@/types/database';
import { tambahItemOfflineFirst } from '@/utils/offlineStore';

export type NewItemInput = Pick<
  InsertItem,
  'judul' | 'template' | 'jatuh_tempo' | 'siklus_bulan' | 'catatan'
>;

/**
 * Simpan dokumen baru secara 100% Offline-First.
 * Langsung tersimpan di penyimpanan lokal perangkat dan disinkronkan ke Supabase di latar belakang.
 */
export async function addItem(input: NewItemInput): Promise<{ error: string | null; id?: string }> {
  try {
    const { item } = await tambahItemOfflineFirst({
      judul: input.judul,
      template: input.template,
      jatuh_tempo: input.jatuh_tempo ?? null,
      siklus_bulan: input.siklus_bulan ?? null,
      catatan: input.catatan ?? null,
    });

    if (item.jatuh_tempo) {
      await jadwalkanPengingatItem({
        id: item.id,
        judul: item.judul,
        jatuh_tempo: item.jatuh_tempo,
        tingkat_pengingat: item.tingkat_pengingat,
      });
    }

    return { error: null, id: item.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan dokumen ke perangkat.';
    return { error: msg };
  }
}

