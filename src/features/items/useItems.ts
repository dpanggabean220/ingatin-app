import { useCallback, useEffect, useState } from 'react';

import type { Item } from '@/types/database';
import { ambilItemsOfflineFirst, bacaItemsLokal } from '@/utils/offlineStore';
import { ambilProfilPengguna, langgananProfilPengguna } from '@/utils/userProfile';
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

/**
 * Ambil semua item milik pengguna secara 100% Offline-First.
 * Jika pengguna belum memiliki dokumen asli dan opsi `tampilkanDataContoh` aktif,
 * tampilkan `DOKUMEN_REFERENSI`.
 */
export function useItems(): UseItemsResult {
  const [items, setItems] = useState<Item[]>(DOKUMEN_REFERENSI);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      // 1. Tampilkan instan dari cache lokal terlebih dahulu
      const [lokalAwal, profil] = await Promise.all([
        bacaItemsLokal(),
        ambilProfilPengguna(),
      ]);

      if (lokalAwal.length > 0) {
        setItems(lokalAwal);
      } else {
        setItems(profil.tampilkanDataContoh ? DOKUMEN_REFERENSI : []);
      }

      // 2. Sinkronkan dengan cloud backup di latar belakang jika online
      const hasilSinkron = await ambilItemsOfflineFirst();
      if (hasilSinkron.length > 0) {
        setItems(hasilSinkron);
        sinkronkanDataWidget(hasilSinkron).catch((err) =>
          console.debug('[useItems] Gagal sinkronkan widget:', err)
        );
      } else {
        const profilTerbaru = await ambilProfilPengguna();
        const fallback = profilTerbaru.tampilkanDataContoh ? DOKUMEN_REFERENSI : [];
        setItems(fallback);
        sinkronkanDataWidget(fallback).catch(() => {});
      }
    } catch {
      const profil = await ambilProfilPengguna();
      setItems(profil.tampilkanDataContoh ? DOKUMEN_REFERENSI : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return langgananProfilPengguna(() => {
      refresh();
    });
  }, [refresh]);

  return { items, loading, error, refresh };
}
