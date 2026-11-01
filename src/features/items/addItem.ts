import { jadwalkanPengingatItem } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import type { InsertItem } from '@/types/database';

export type NewItemInput = Pick<
  InsertItem,
  'judul' | 'template' | 'jatuh_tempo' | 'siklus_bulan' | 'catatan'
>;

/** Simpan dokumen baru. `user_id` diisi otomatis oleh database (auth.uid()). */
export async function addItem(input: NewItemInput): Promise<{ error: string | null; id?: string }> {
  const { data, error } = await supabase
    .from('item')
    .insert({
      judul: input.judul,
      template: input.template,
      jatuh_tempo: input.jatuh_tempo,
      siklus_bulan: input.siklus_bulan,
      catatan: input.catatan,
      tingkat_pengingat: [30, 7, 1, 0],
    })
    .select('id, judul, jatuh_tempo, tingkat_pengingat')
    .single();

  if (error || !data) {
    return { error: 'Dokumen gagal disimpan. Periksa koneksi internetmu lalu coba lagi.' };
  }

  // Jadwalkan notifikasi pengingat secara otomatis jika ada jatuh tempo
  if (data.jatuh_tempo) {
    await jadwalkanPengingatItem({
      id: data.id,
      judul: data.judul,
      jatuh_tempo: data.jatuh_tempo,
      tingkat_pengingat: data.tingkat_pengingat,
    });
  }

  return { error: null, id: data.id };
}

