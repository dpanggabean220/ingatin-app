import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { jadwalkanPengingatItem } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import type { Item, RiwayatPerpanjangan, TemplateType } from '@/types/database';

const TEMPLATE_VALID: TemplateType[] = [
  'sim',
  'stnk',
  'pajak_kendaraan',
  'kir',
  'paspor',
  'asuransi',
  'custom',
];

export interface BackupPayload {
  app: string;
  version: string;
  exported_at: string;
  total_items: number;
  total_riwayat: number;
  items: Omit<Item, 'user_id'>[];
  riwayat: Omit<RiwayatPerpanjangan, 'user_id'>[];
}

export interface HasilEkspor {
  berhasil: boolean;
  totalItems: number;
  totalRiwayat: number;
  fileUri?: string;
  pesan?: string;
}

export interface HasilImpor {
  berhasil: boolean;
  dibatalkan?: boolean;
  totalItems: number;
  totalRiwayat: number;
  pesan?: string;
}

/**
 * Mengambil seluruh data dokumen dan riwayat milik pengguna dari Supabase,
 * memformatnya ke JSON, dan memicu native share sheet di iOS/Android.
 */
export async function eksporDataPengguna(userId: string): Promise<HasilEkspor> {
  if (!userId) {
    throw new Error('Sesi pengguna tidak ditemukan.');
  }

  // 1. Ambil semua item milik pengguna
  const { data: items, error: errItems } = await supabase
    .from('item')
    .select('*')
    .eq('user_id', userId)
    .order('dibuat', { ascending: true });

  if (errItems) {
    throw new Error(`Gagal mengambil data dokumen: ${errItems.message}`);
  }

  // 2. Ambil semua riwayat perpanjangan milik pengguna
  const { data: riwayat, error: errRiwayat } = await supabase
    .from('riwayat_perpanjangan')
    .select('*')
    .eq('user_id', userId)
    .order('diperpanjang_pada', { ascending: true });

  if (errRiwayat) {
    throw new Error(`Gagal mengambil riwayat perpanjangan: ${errRiwayat.message}`);
  }

  const itemsClean = (items || []).map(({ user_id: _, ...rest }) => rest);
  const riwayatClean = (riwayat || []).map(({ user_id: _, ...rest }) => rest);

  const payload: BackupPayload = {
    app: 'INGATIN',
    version: '1.0',
    exported_at: new Date().toISOString(),
    total_items: itemsClean.length,
    total_riwayat: riwayatClean.length,
    items: itemsClean,
    riwayat: riwayatClean,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const tanggalHariIni = new Date().toISOString().slice(0, 10);
  const fileName = `ingatin_cadangan_${tanggalHariIni}.json`;
  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
  const fileUri = `${baseDir}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, jsonString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Simpan Cadangan INGATIN',
      UTI: 'public.json',
    });
  }

  return {
    berhasil: true,
    totalItems: itemsClean.length,
    totalRiwayat: riwayatClean.length,
    fileUri,
    pesan: `Berhasil mengekspor ${itemsClean.length} dokumen dan ${riwayatClean.length} riwayat perpanjangan.`,
  };
}

/**
 * Membuka pemilih file (.json), memvalidasi skema data,
 * lalu mengimpor dokumen dan riwayat ke Supabase serta menjadwalkan notifikasi lokal.
 */
export async function imporDataPengguna(userId: string): Promise<HasilImpor> {
  if (!userId) {
    throw new Error('Sesi pengguna tidak ditemukan.');
  }

  // 1. Buka DocumentPicker untuk memilih file JSON
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (res.canceled || !res.assets || res.assets.length === 0) {
    return {
      berhasil: false,
      dibatalkan: true,
      totalItems: 0,
      totalRiwayat: 0,
    };
  }

  const fileAsset = res.assets[0];
  const fileContent = await FileSystem.readAsStringAsync(fileAsset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let dataParsed: Partial<BackupPayload>;
  try {
    dataParsed = JSON.parse(fileContent);
  } catch {
    throw new Error('Format file tidak valid. Pastikan file berupa JSON cadangan INGATIN.');
  }

  if (!dataParsed || typeof dataParsed !== 'object') {
    throw new Error('File cadangan kosong atau tidak valid.');
  }

  if (!Array.isArray(dataParsed.items)) {
    throw new Error('Struktur data cadangan tidak memiliki daftar dokumen ("items").');
  }

  const rawItems = dataParsed.items;
  if (rawItems.length === 0) {
    throw new Error('File cadangan tidak berisi dokumen apa pun untuk dipulihkan.');
  }

  // 2. Validasi setiap item
  let itemsDipulihkan = 0;
  let riwayatDipulihkan = 0;

  // Peta ID lama -> ID baru jika ID lama bentrok atau berbeda
  const idMap = new Map<string, string>();

  for (const item of rawItems) {
    const judul = typeof item.judul === 'string' ? item.judul.trim() : '';
    if (!judul) continue;

    const templateRaw = item.template as TemplateType;
    const template: TemplateType = TEMPLATE_VALID.includes(templateRaw) ? templateRaw : 'custom';
    const jatuhTempo = typeof item.jatuh_tempo === 'string' ? item.jatuh_tempo : null;
    const siklusBulan = typeof item.siklus_bulan === 'number' ? item.siklus_bulan : null;
    const catatan = typeof item.catatan === 'string' ? item.catatan : null;
    const tingkatPengingat = Array.isArray(item.tingkat_pengingat)
      ? item.tingkat_pengingat
      : [30, 7, 1, 0];

    const { data: itemBaru, error: errInsert } = await supabase
      .from('item')
      .insert({
        user_id: userId,
        judul,
        template,
        jatuh_tempo: jatuhTempo,
        siklus_bulan: siklusBulan,
        catatan,
        tingkat_pengingat: tingkatPengingat,
      })
      .select('id, judul, jatuh_tempo, tingkat_pengingat')
      .single();

    if (errInsert || !itemBaru) {
      console.warn('[Impor Data] Gagal memulihkan dokumen:', judul, errInsert);
      continue;
    }

    itemsDipulihkan++;
    if (item.id) {
      idMap.set(item.id, itemBaru.id);
    }

    // Jadwalkan notifikasi lokal untuk dokumen yang dipulihkan
    if (itemBaru.jatuh_tempo) {
      jadwalkanPengingatItem({
        id: itemBaru.id,
        judul: itemBaru.judul,
        jatuh_tempo: itemBaru.jatuh_tempo,
        tingkat_pengingat: itemBaru.tingkat_pengingat,
      }).catch((err) => console.warn('[Impor Notifikasi] Gagal jadwalkan:', err));
    }
  }

  // 3. Pulihkan riwayat perpanjangan jika ada
  if (Array.isArray(dataParsed.riwayat) && dataParsed.riwayat.length > 0) {
    for (const r of dataParsed.riwayat) {
      const targetItemId = r.item_id ? idMap.get(r.item_id) : undefined;
      if (!targetItemId) continue;

      if (!r.jatuh_tempo_lama || !r.jatuh_tempo_baru) continue;

      const { error: errRiwayat } = await supabase
        .from('riwayat_perpanjangan')
        .insert({
          user_id: userId,
          item_id: targetItemId,
          jatuh_tempo_lama: r.jatuh_tempo_lama,
          jatuh_tempo_baru: r.jatuh_tempo_baru,
          diperpanjang_pada: r.diperpanjang_pada || new Date().toISOString(),
        });

      if (!errRiwayat) {
        riwayatDipulihkan++;
      }
    }
  }

  return {
    berhasil: true,
    totalItems: itemsDipulihkan,
    totalRiwayat: riwayatDipulihkan,
    pesan: `Berhasil memulihkan ${itemsDipulihkan} dokumen dan ${riwayatDipulihkan} catatan riwayat ke akunmu.`,
  };
}
