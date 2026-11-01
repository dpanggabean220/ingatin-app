import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Item } from '@/types/database';
import { sinkronkanDataWidget } from '@/utils/widgetSync';

function tanggalOffsetHari(hariDariSekarang: number): string {
  const d = new Date();
  d.setDate(d.getDate() + hariDariSekarang);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${t}`;
}

/**
 * Data dokumen contoh sesuai referensi Stitch v2.0 (ditampilkan bila akun belum memiliki dokumen di Supabase).
 */
export const DOKUMEN_REFERENSI: Item[] = [
  {
    id: 'ref-sim-c',
    user_id: 'local',
    judul: 'SIM C Pribadi',
    template: 'sim',
    jatuh_tempo: tanggalOffsetHari(5),
    siklus_bulan: 60,
    catatan: 'No. 1234-5678-9012 • 25 Nov 2025',
    tingkat_pengingat: [30, 7, 1, 0],
    dibuat: new Date().toISOString(),
    diubah: new Date().toISOString(),
  },
  {
    id: 'ref-stnk-motor',
    user_id: 'local',
    judul: 'STNK Motor',
    template: 'stnk',
    jatuh_tempo: tanggalOffsetHari(18),
    siklus_bulan: 12,
    catatan: 'B 6789 KLM • 18 Des 2025',
    tingkat_pengingat: [30, 7, 1, 0],
    dibuat: new Date().toISOString(),
    diubah: new Date().toISOString(),
  },
  {
    id: 'ref-paspor',
    user_id: 'local',
    judul: 'Paspor',
    template: 'paspor',
    jatuh_tempo: tanggalOffsetHari(81),
    siklus_bulan: 120,
    catatan: 'A1234567 • 20 Jan 2026',
    tingkat_pengingat: [30, 7, 1, 0],
    dibuat: new Date().toISOString(),
    diubah: new Date().toISOString(),
  },
  {
    id: 'ref-pajak',
    user_id: 'local',
    judul: 'Pajak Kendaraan',
    template: 'pajak_kendaraan',
    jatuh_tempo: tanggalOffsetHari(107),
    siklus_bulan: 12,
    catatan: 'B 6789 KLM • 15 Feb 2026',
    tingkat_pengingat: [30, 7, 1, 0],
    dibuat: new Date().toISOString(),
    diubah: new Date().toISOString(),
  },
  {
    id: 'ref-asuransi',
    user_id: 'local',
    judul: 'Asuransi Kendaraan',
    template: 'asuransi',
    jatuh_tempo: tanggalOffsetHari(150),
    siklus_bulan: 12,
    catatan: 'No. POL-2025-001 • 30 Mar 2026',
    tingkat_pengingat: [30, 7, 1, 0],
    dibuat: new Date().toISOString(),
    diubah: new Date().toISOString(),
  },
  {
    id: 'ref-kir',
    user_id: 'local',
    judul: 'KIR Kendaraan',
    template: 'kir',
    jatuh_tempo: tanggalOffsetHari(163),
    siklus_bulan: 6,
    catatan: 'B 6789 KLM • 12 Apr 2026',
    tingkat_pengingat: [30, 7, 1, 0],
    dibuat: new Date().toISOString(),
    diubah: new Date().toISOString(),
  },
];

interface UseItemsResult {
  items: Item[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Ambil semua item milik pengguna, urut jatuh tempo (fallback ke DOKUMEN_REFERENSI bila kosong). */
export function useItems(): UseItemsResult {
  const [items, setItems] = useState<Item[]>(DOKUMEN_REFERENSI);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('item')
        .select('*')
        .order('jatuh_tempo', { ascending: true, nullsFirst: false });

      if (!fetchError && data && data.length > 0) {
        const itemsList = data as Item[];
        setItems(itemsList);
        sinkronkanDataWidget(itemsList).catch((err) =>
          console.debug('[useItems] Gagal sinkronkan widget:', err)
        );
      } else {
        setItems(DOKUMEN_REFERENSI);
      }
    } catch {
      setItems(DOKUMEN_REFERENSI);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
