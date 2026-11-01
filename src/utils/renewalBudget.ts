import AsyncStorage from '@react-native-async-storage/async-storage';

import { hitungSisaHari } from '@/lib/tanggal';
import type { TemplateType } from '@/types/database';

/** Kunci penyimpanan lokal untuk estimasi biaya perpanjangan per dokumen */
export const RENEWAL_BUDGETS_KEY = '@ingatin_renewal_budgets';

export type PetaBiayaPerpanjangan = Record<string, number>;

/** Default biaya untuk item referensi pratinjau agar badge & ringkasan 30 hari langsung informatif */
const DEFAULT_BIAYA_REFERENSI: Record<string, number> = {
  'ref-sim-c': 200000,
  'ref-stnk-motor': 350000,
  'ref-paspor': 650000,
  'ref-pajak-mobil': 1850000,
  'ref-asuransi': 950000,
  'ref-kir': 150000,
};

type ListenerBiaya = () => void;
const listeners = new Set<ListenerBiaya>();
let cachePetaBiaya: PetaBiayaPerpanjangan = { ...DEFAULT_BIAYA_REFERENSI };
let sudahDimuat = false;

export function langgananPerubahanBiaya(fn: ListenerBiaya): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function beritahuPerubahan(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {}
  }
}

/** Memformat angka menjadi string Rupiah (contoh: 250000 -> "Rp 250.000") */
export function formatRupiah(nominal: number): string {
  const bulat = Math.max(0, Math.round(nominal));
  const ribuan = bulat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${ribuan}`;
}

/** Mengekstrak angka murni dari input teks Rupiah (contoh: "250.000" -> 250000) */
export function parseInputRupiah(teks: string): number | null {
  const digit = teks.replace(/[^\d]/g, '');
  if (!digit) return null;
  const nilai = Number(digit);
  if (!Number.isFinite(nilai) || nilai <= 0) return null;
  return nilai;
}

/** Membaca seluruh pemetaan biaya perpanjangan dari AsyncStorage */
export async function ambilSemuaBiayaPerpanjangan(): Promise<PetaBiayaPerpanjangan> {
  try {
    const raw = await AsyncStorage.getItem(RENEWAL_BUDGETS_KEY);
    if (!raw) {
      cachePetaBiaya = { ...DEFAULT_BIAYA_REFERENSI };
      sudahDimuat = true;
      return cachePetaBiaya;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      cachePetaBiaya = { ...DEFAULT_BIAYA_REFERENSI };
      sudahDimuat = true;
      return cachePetaBiaya;
    }
    const bersih: PetaBiayaPerpanjangan = { ...DEFAULT_BIAYA_REFERENSI };
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
        bersih[k] = v;
      }
    }
    cachePetaBiaya = bersih;
    sudahDimuat = true;
    return bersih;
  } catch {
    return cachePetaBiaya;
  }
}

/** Mengambil cache sinkron (memuat otomatis di latar belakang bila belum dimuat) */
export function ambilCacheBiayaPerpanjangan(): PetaBiayaPerpanjangan {
  if (!sudahDimuat) {
    ambilSemuaBiayaPerpanjangan().then(() => beritahuPerubahan());
  }
  return cachePetaBiaya;
}

/** Menyimpan seluruh pemetaan biaya perpanjangan ke AsyncStorage (dipakai juga saat Restore JSON) */
export async function simpanSemuaBiayaPerpanjangan(
  peta: PetaBiayaPerpanjangan
): Promise<void> {
  cachePetaBiaya = { ...DEFAULT_BIAYA_REFERENSI, ...peta };
  sudahDimuat = true;
  await AsyncStorage.setItem(RENEWAL_BUDGETS_KEY, JSON.stringify(cachePetaBiaya));
  beritahuPerubahan();
}

/** Menyimpan atau menghapus estimasi biaya perpanjangan untuk satu dokumen */
export async function aturBiayaPerpanjangan(
  itemId: string,
  nominal: number | null
): Promise<void> {
  if (!itemId) return;
  const peta = await ambilSemuaBiayaPerpanjangan();
  if (nominal && nominal > 0) {
    peta[itemId] = Math.round(nominal);
  } else {
    delete peta[itemId];
  }
  cachePetaBiaya = { ...peta };
  await AsyncStorage.setItem(RENEWAL_BUDGETS_KEY, JSON.stringify(peta));
  beritahuPerubahan();
}

/**
 * Mengambil estimasi biaya untuk suatu item dari peta biaya atau dari teks catatan
 * jika pengguna menuliskan "Rp 250.000" di dalam catatan.
 */
export function ambilBiayaDokumen(
  item: { id: string; template?: TemplateType; catatan?: string | null },
  peta: PetaBiayaPerpanjangan = cachePetaBiaya
): number | null {
  const dariPeta = peta[item.id];
  if (typeof dariPeta === 'number' && dariPeta > 0) {
    return dariPeta;
  }

  // Fallback ekstraksi jika catatan mencantumkan "Rp 150.000"
  if (item.catatan) {
    const match = item.catatan.match(/Rp\.?\s*([\d.]{4,})/i);
    if (match?.[1]) {
      const n = Number(match[1].replace(/\./g, ''));
      if (Number.isFinite(n) && n > 0) return n;
    }
  }

  return null;
}

/**
 * Menghitung total estimasi biaya perpanjangan untuk dokumen yang akan jatuh tempo
 * dalam 30 hari ke depan (termasuk yang sudah lewat jatuh tempo namun belum diperpanjang).
 */
export function hitungTotalBiaya30Hari(
  items: {
    id: string;
    template?: TemplateType;
    jatuh_tempo: string | null;
    catatan?: string | null;
  }[],
  peta: PetaBiayaPerpanjangan = cachePetaBiaya
): { totalRupiah: number; jumlahDokumen: number } {
  let totalRupiah = 0;
  let jumlahDokumen = 0;

  for (const item of items) {
    if (!item.jatuh_tempo) continue;
    const sisaHari = hitungSisaHari(item.jatuh_tempo);
    if (sisaHari <= 30) {
      const biaya = ambilBiayaDokumen(item, peta);
      if (biaya && biaya > 0) {
        totalRupiah += biaya;
        jumlahDokumen += 1;
      }
    }
  }

  return { totalRupiah, jumlahDokumen };
}
