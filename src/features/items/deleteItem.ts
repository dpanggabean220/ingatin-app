import { batalkanPengingatItem } from '@/lib/notifications';
import { hapusItemOfflineFirst } from '@/utils/offlineStore';

/**
 * Menghapus dokumen secara 100% Offline-First (lokal + cloud backup)
 * dan membatalkan jadwal notifikasi pengingat.
 */
export async function deleteItem(id: string): Promise<{ error: string | null }> {
  await batalkanPengingatItem(id);
  await hapusItemOfflineFirst(id);
  return { error: null };
}

