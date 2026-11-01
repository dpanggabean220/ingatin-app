import { batalkanPengingatItem } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

/**
 * Menghapus dokumen dari tabel `item`.
 * Riwayat perpanjangan terkait otomatis terhapus lewat cascade database,
 * dan jadwal notifikasi pengingat dibatalkan.
 */
export async function deleteItem(id: string): Promise<{ error: string | null }> {
  // Batalkan seluruh jadwal notifikasi item ini
  await batalkanPengingatItem(id);

  const { error } = await supabase
    .from('item')
    .delete()
    .eq('id', id);

  if (error) {
    return {
      error: 'Gagal menghapus dokumen. Periksa koneksi internetmu lalu coba lagi.',
    };
  }
  return { error: null };
}

