import { supabase } from '@/lib/supabase';
import type { UpdateItem } from '@/types/database';

export type UpdateItemPayload = UpdateItem;

/**
 * Memperbarui data dokumen di tabel `item`.
 * RLS memastikan hanya dokumen milik pengguna yang terautentikasi yang dapat diubah.
 */
export async function updateItem(
  id: string,
  payload: UpdateItemPayload
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('item')
    .update(payload)
    .eq('id', id);

  if (error) {
    return {
      error: 'Gagal memperbarui dokumen. Periksa koneksi internetmu lalu coba lagi.',
    };
  }
  return { error: null };
}
