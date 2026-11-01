import { batalkanPengingatItem, jadwalkanPengingatItem } from '@/lib/notifications';
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
  const { data, error } = await supabase
    .from('item')
    .update(payload)
    .eq('id', id)
    .select('id, judul, jatuh_tempo, tingkat_pengingat')
    .single();

  if (error || !data) {
    return {
      error: 'Gagal memperbarui dokumen. Periksa koneksi internetmu lalu coba lagi.',
    };
  }

  // Sinkronkan jadwal notifikasi lokal
  if (data.jatuh_tempo) {
    await jadwalkanPengingatItem({
      id: data.id,
      judul: data.judul,
      jatuh_tempo: data.jatuh_tempo,
      tingkat_pengingat: data.tingkat_pengingat,
    });
  } else {
    await batalkanPengingatItem(data.id);
  }

  return { error: null };
}

