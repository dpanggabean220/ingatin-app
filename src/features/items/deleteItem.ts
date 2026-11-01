import { supabase } from '@/lib/supabase';

/**
 * Menghapus dokumen dari tabel `item`.
 * Riwayat perpanjangan terkait otomatis terhapus lewat cascade database.
 */
export async function deleteItem(id: string): Promise<{ error: string | null }> {
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
