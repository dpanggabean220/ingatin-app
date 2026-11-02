import { batalkanPengingatItem, jadwalkanPengingatItem } from '@/lib/notifications';
import type { UpdateItem } from '@/types/database';
import { ubahItemOfflineFirst } from '@/utils/offlineStore';

export type UpdateItemPayload = UpdateItem;

/**
 * Memperbarui data dokumen secara 100% Offline-First
 * (langsung tersimpan di HP dan dicadangkan ke Supabase bila online).
 */
export async function updateItem(
  id: string,
  payload: UpdateItemPayload
): Promise<{ error: string | null }> {
  try {
    const { item } = await ubahItemOfflineFirst(id, payload);

    if (item?.jatuh_tempo) {
      await jadwalkanPengingatItem({
        id: item.id,
        judul: item.judul,
        jatuh_tempo: item.jatuh_tempo,
        tingkat_pengingat: item.tingkat_pengingat,
      });
    } else {
      await batalkanPengingatItem(id);
    }

    return { error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui dokumen.';
    return { error: msg };
  }
}

