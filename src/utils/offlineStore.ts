import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import type { Item, RiwayatPerpanjangan, TemplateType } from '@/types/database';

/**
 * Penyimpanan 100% Offline-First untuk dokumen (`item`) dan `riwayat_perpanjangan`.
 * Aplikasi dapat menambah, mengubah, memperpanjang, dan menghapus dokumen tanpa internet,
 * lalu menyinkronkan ke Supabase di latar belakang sebagai cloud backup.
 */
export const OFFLINE_ITEMS_KEY = '@ingatin_offline_items';
export const OFFLINE_RIWAYAT_KEY = '@ingatin_offline_riwayat';

function buatUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function urutkanItemsJatuhTempo(list: Item[]): Item[] {
  return [...list].sort((a, b) => {
    if (!a.jatuh_tempo && !b.jatuh_tempo) return 0;
    if (!a.jatuh_tempo) return 1;
    if (!b.jatuh_tempo) return -1;
    return a.jatuh_tempo.localeCompare(b.jatuh_tempo);
  });
}

export async function bacaItemsLokal(): Promise<Item[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_ITEMS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return urutkanItemsJatuhTempo(parsed as Item[]);
  } catch {
    return [];
  }
}

export async function tulisItemsLokal(items: Item[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_ITEMS_KEY, JSON.stringify(urutkanItemsJatuhTempo(items)));
}

export async function bacaRiwayatLokal(): Promise<RiwayatPerpanjangan[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_RIWAYAT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RiwayatPerpanjangan[];
  } catch {
    return [];
  }
}

export async function tulisRiwayatLokal(riwayat: RiwayatPerpanjangan[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_RIWAYAT_KEY, JSON.stringify(riwayat));
}

/**
 * Mengambil seluruh dokumen secara Offline-First:
 * 1. Membaca penyimpanan lokal HP terlebih dahulu.
 * 2. Mencoba sinkronisasi dengan Supabase di latar belakang jika ada koneksi internet.
 */
export async function ambilItemsOfflineFirst(): Promise<Item[]> {
  const lokal = await bacaItemsLokal();

  try {
    const { data, error } = await supabase
      .from('item')
      .select('*')
      .order('jatuh_tempo', { ascending: true, nullsFirst: false });

    if (!error && Array.isArray(data)) {
      const cloudItems = data as Item[];
      // Gabungkan item lokal yang belum terkirim ke cloud dengan item dari cloud
      const cloudMap = new Map(cloudItems.map((i) => [i.id, i]));
      const gabungan: Item[] = [...cloudItems];

      for (const itemLokal of lokal) {
        if (!cloudMap.has(itemLokal.id)) {
          gabungan.push(itemLokal);
          // Coba unggah item lokal ke cloud backup di latar belakang
          supabase
            .from('item')
            .upsert({
              id: itemLokal.id,
              judul: itemLokal.judul,
              template: itemLokal.template,
              jatuh_tempo: itemLokal.jatuh_tempo,
              siklus_bulan: itemLokal.siklus_bulan,
              catatan: itemLokal.catatan,
              tingkat_pengingat: itemLokal.tingkat_pengingat,
            })
            .then(() => {});
        }
      }

      const terurut = urutkanItemsJatuhTempo(gabungan);
      await tulisItemsLokal(terurut);
      return terurut;
    }
  } catch {
    // Sedang offline — gunakan data lokal sepenuhnya
  }

  return lokal;
}

export interface InputTambahOffline {
  judul: string;
  template: TemplateType;
  jatuh_tempo: string | null;
  siklus_bulan: number | null;
  catatan: string | null;
}

/**
 * Menambahkan dokumen baru secara 100% Offline-First:
 * Langsung tersimpan di memori lokal HP dan dicadangkan ke Supabase bila online.
 */
export async function tambahItemOfflineFirst(
  input: InputTambahOffline
): Promise<{ item: Item; tersinkronCloud: boolean }> {
  const sekarang = new Date().toISOString();
  const idBaru = buatUuidV4();

  const itemBaru: Item = {
    id: idBaru,
    user_id: 'local',
    judul: input.judul,
    template: input.template,
    jatuh_tempo: input.jatuh_tempo,
    siklus_bulan: input.siklus_bulan,
    catatan: input.catatan,
    tingkat_pengingat: [30, 7, 1, 0],
    dibuat: sekarang,
    diubah: sekarang,
  };

  // 1. Simpan instan ke penyimpanan lokal HP
  const lokal = await bacaItemsLokal();
  await tulisItemsLokal([...lokal, itemBaru]);

  // 2. Coba cadangkan ke Supabase bila terhubung internet
  let tersinkronCloud = false;
  try {
    const { data, error } = await supabase
      .from('item')
      .insert({
        id: idBaru,
        judul: input.judul,
        template: input.template,
        jatuh_tempo: input.jatuh_tempo,
        siklus_bulan: input.siklus_bulan,
        catatan: input.catatan,
        tingkat_pengingat: [30, 7, 1, 0],
      })
      .select('*')
      .single();

    if (!error && data) {
      tersinkronCloud = true;
      const dariCloud = data as Item;
      const terbaru = (await bacaItemsLokal()).map((i) =>
        i.id === idBaru ? dariCloud : i
      );
      await tulisItemsLokal(terbaru);
      return { item: dariCloud, tersinkronCloud: true };
    }
  } catch {
    // Offline: data sudah aman di lokal
  }

  return { item: itemBaru, tersinkronCloud };
}

/**
 * Memperbarui dokumen secara 100% Offline-First.
 */
export async function ubahItemOfflineFirst(
  id: string,
  payload: Partial<Pick<Item, 'judul' | 'template' | 'jatuh_tempo' | 'siklus_bulan' | 'catatan'>>
): Promise<{ item: Item | null; tersinkronCloud: boolean }> {
  const lokal = await bacaItemsLokal();
  const sekarang = new Date().toISOString();
  let updatedLocal: Item | null = null;

  const daftarBaru = lokal.map((item) => {
    if (item.id === id) {
      updatedLocal = {
        ...item,
        ...payload,
        diubah: sekarang,
      };
      return updatedLocal;
    }
    return item;
  });

  if (updatedLocal) {
    await tulisItemsLokal(daftarBaru);
  }

  let tersinkronCloud = false;
  try {
    const { data, error } = await supabase
      .from('item')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      tersinkronCloud = true;
      const dariCloud = data as Item;
      const sinkronList = (await bacaItemsLokal()).map((i) =>
        i.id === id ? dariCloud : i
      );
      await tulisItemsLokal(sinkronList);
      return { item: dariCloud, tersinkronCloud: true };
    }
  } catch {
    // Offline: perubahan lokal tetap tersimpan
  }

  return { item: updatedLocal, tersinkronCloud };
}

/**
 * Menghapus dokumen secara 100% Offline-First.
 */
export async function hapusItemOfflineFirst(id: string): Promise<void> {
  const [lokalItems, lokalRiwayat] = await Promise.all([
    bacaItemsLokal(),
    bacaRiwayatLokal(),
  ]);

  await Promise.all([
    tulisItemsLokal(lokalItems.filter((i) => i.id !== id)),
    tulisRiwayatLokal(lokalRiwayat.filter((r) => r.item_id !== id)),
  ]);

  try {
    await supabase.from('item').delete().eq('id', id);
  } catch {
    // Offline: sudah dihapus dari lokal
  }
}

/**
 * Memperpanjang dokumen & mencatat riwayat secara 100% Offline-First.
 */
export async function perpanjangItemOfflineFirst(input: {
  itemId: string;
  jatuhTempoLama: string;
  jatuhTempoBaru: string;
}): Promise<{ item: Item | null }> {
  const { item } = await ubahItemOfflineFirst(input.itemId, {
    jatuh_tempo: input.jatuhTempoBaru,
  });

  const entriRiwayat: RiwayatPerpanjangan = {
    id: buatUuidV4(),
    item_id: input.itemId,
    user_id: item?.user_id ?? 'local',
    jatuh_tempo_lama: input.jatuhTempoLama,
    jatuh_tempo_baru: input.jatuhTempoBaru,
    diperpanjang_pada: new Date().toISOString(),
  };

  const riwayatLokal = await bacaRiwayatLokal();
  await tulisRiwayatLokal([entriRiwayat, ...riwayatLokal]);

  try {
    await supabase.from('riwayat_perpanjangan').insert({
      id: entriRiwayat.id,
      item_id: input.itemId,
      jatuh_tempo_lama: input.jatuhTempoLama,
      jatuh_tempo_baru: input.jatuhTempoBaru,
      diperpanjang_pada: entriRiwayat.diperpanjang_pada,
    });
  } catch {
    // Offline: riwayat sudah aman di lokal
  }

  return { item };
}

/**
 * Mengambil detail 1 dokumen beserta riwayat perpanjangannya secara Offline-First.
 */
export async function ambilDetailDanRiwayatOfflineFirst(
  id: string,
  fallbackReferensi: Item[] = []
): Promise<{ item: Item | null; riwayat: RiwayatPerpanjangan[] }> {
  const [lokalItems, lokalRiwayat] = await Promise.all([
    bacaItemsLokal(),
    bacaRiwayatLokal(),
  ]);

  let ditemukan =
    lokalItems.find((i) => i.id === id) ??
    fallbackReferensi.find((i) => i.id === id) ??
    null;

  let riwayatItem = lokalRiwayat
    .filter((r) => r.item_id === id)
    .sort((a, b) => b.diperpanjang_pada.localeCompare(a.diperpanjang_pada));

  if (!id.startsWith('ref-')) {
    try {
      const [{ data: itemData }, { data: riwayatData }] = await Promise.all([
        supabase.from('item').select('*').eq('id', id).single(),
        supabase
          .from('riwayat_perpanjangan')
          .select('*')
          .eq('item_id', id)
          .order('diperpanjang_pada', { ascending: false }),
      ]);

      if (itemData) {
        ditemukan = itemData as Item;
      }
      if (Array.isArray(riwayatData) && riwayatData.length > 0) {
        riwayatItem = riwayatData as RiwayatPerpanjangan[];
      }
    } catch {
      // Offline: gunakan data lokal
    }
  }

  return { item: ditemukan, riwayat: riwayatItem };
}
