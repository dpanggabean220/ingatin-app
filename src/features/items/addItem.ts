import { supabase } from '@/lib/supabase';
import type { InsertItem } from '@/types/database';

export type NewItemInput = Pick<
  InsertItem,
  'judul' | 'template' | 'jatuh_tempo' | 'siklus_bulan' | 'catatan'
>;

/** Simpan dokumen baru. `user_id` diisi otomatis oleh database (auth.uid()). */
export async function addItem(input: NewItemInput): Promise<{ error: string | null }> {
  const { error } = await supabase.from('item').insert({
    judul: input.judul,
    template: input.template,
    jatuh_tempo: input.jatuh_tempo,
    siklus_bulan: input.siklus_bulan,
    catatan: input.catatan,
    tingkat_pengingat: [30, 7, 1, 0],
  });

  if (error) {
    return { error: 'Dokumen gagal disimpan. Periksa koneksi internetmu lalu coba lagi.' };
  }
  return { error: null };
}
