import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import {
  ambilPengingatKilat,
  QUICK_REMINDERS_KEY,
  type QuickReminder,
} from '@/features/quick-reminders/quickReminders';
import { jadwalkanPengingatItem } from '@/lib/notifications';
import type { Item, RiwayatPerpanjangan, TemplateType } from '@/types/database';
import {
  ambilSemuaPemilikDokumen,
  type OwnerTag,
  type PetaPemilikDokumen,
  simpanSemuaPemilikDokumen,
} from '@/utils/documentOwner';
import {
  ambilItemsOfflineFirst,
  bacaRiwayatLokal,
  perpanjangItemOfflineFirst,
  tambahItemOfflineFirst,
} from '@/utils/offlineStore';
import {
  ambilSemuaBiayaPerpanjangan,
  type PetaBiayaPerpanjangan,
  simpanSemuaBiayaPerpanjangan,
} from '@/utils/renewalBudget';

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
  renewal_budgets?: PetaBiayaPerpanjangan;
  document_owners?: PetaPemilikDokumen;
  quick_reminders?: QuickReminder[];
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
 * Mengambil seluruh data dokumen dan riwayat milik pengguna (Offline-First),
 * memformatnya ke JSON, dan memicu native share sheet di iOS/Android.
 */
export async function eksporDataPengguna(_userId = 'local'): Promise<HasilEkspor> {
  const [items, riwayat] = await Promise.all([
    ambilItemsOfflineFirst(),
    bacaRiwayatLokal(),
  ]);

  const itemsClean = (items || []).map(({ user_id: _, ...rest }) => rest);
  const riwayatClean = (riwayat || []).map(({ user_id: _, ...rest }) => rest);

  // 3. Ambil estimasi biaya perpanjangan, pemilik dokumen, & pengingat kilat lokal
  const [renewalBudgets, documentOwners, quickReminders] = await Promise.all([
    ambilSemuaBiayaPerpanjangan(),
    ambilSemuaPemilikDokumen(),
    ambilPengingatKilat(),
  ]);

  const payload: BackupPayload = {
    app: 'INGATIN',
    version: '1.2',
    exported_at: new Date().toISOString(),
    total_items: itemsClean.length,
    total_riwayat: riwayatClean.length,
    items: itemsClean,
    riwayat: riwayatClean,
    renewal_budgets: renewalBudgets,
    document_owners: documentOwners,
    quick_reminders: quickReminders,
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
export async function imporDataPengguna(_userId = 'local'): Promise<HasilImpor> {
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

    const { item: itemBaru } = await tambahItemOfflineFirst({
      judul,
      template,
      jatuh_tempo: jatuhTempo,
      siklus_bulan: siklusBulan,
      catatan,
    });

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
        tingkat_pengingat: tingkatPengingat,
      }).catch((err) => console.warn('[Impor Notifikasi] Gagal jadwalkan:', err));
    }
  }

  // 3. Pulihkan riwayat perpanjangan jika ada
  if (Array.isArray(dataParsed.riwayat) && dataParsed.riwayat.length > 0) {
    for (const r of dataParsed.riwayat) {
      const targetItemId = r.item_id ? idMap.get(r.item_id) : undefined;
      if (!targetItemId) continue;

      if (!r.jatuh_tempo_lama || !r.jatuh_tempo_baru) continue;

      await perpanjangItemOfflineFirst({
        itemId: targetItemId,
        jatuhTempoLama: r.jatuh_tempo_lama,
        jatuhTempoBaru: r.jatuh_tempo_baru,
      });
      riwayatDipulihkan++;
    }
  }

  // 4. Pulihkan estimasi biaya perpanjangan (@ingatin_renewal_budgets) jika ada di cadangan
  if (
    dataParsed.renewal_budgets &&
    typeof dataParsed.renewal_budgets === 'object' &&
    !Array.isArray(dataParsed.renewal_budgets)
  ) {
    const petaSaatIni = await ambilSemuaBiayaPerpanjangan();
    const petaBaru: PetaBiayaPerpanjangan = { ...petaSaatIni };

    for (const [oldId, nominal] of Object.entries(dataParsed.renewal_budgets)) {
      if (typeof nominal === 'number' && Number.isFinite(nominal) && nominal > 0) {
        const mappedId = idMap.get(oldId) ?? oldId;
        petaBaru[mappedId] = Math.round(nominal);
      }
    }
    await simpanSemuaBiayaPerpanjangan(petaBaru);
  }

  // 4b. Pulihkan tag pemilik dokumen (@ingatin_document_owners) jika ada di cadangan
  if (
    dataParsed.document_owners &&
    typeof dataParsed.document_owners === 'object' &&
    !Array.isArray(dataParsed.document_owners)
  ) {
    const pemilikSaatIni = await ambilSemuaPemilikDokumen();
    const pemilikBaru: PetaPemilikDokumen = { ...pemilikSaatIni };
    for (const [oldId, tag] of Object.entries(dataParsed.document_owners)) {
      if (typeof tag === 'string') {
        const mappedId = idMap.get(oldId) ?? oldId;
        pemilikBaru[mappedId] = tag as OwnerTag;
      }
    }
    await simpanSemuaPemilikDokumen(pemilikBaru);
  }

  // 5. Pulihkan pengingat kilat (@ingatin_quick_reminders) jika ada di cadangan
  if (Array.isArray(dataParsed.quick_reminders) && dataParsed.quick_reminders.length > 0) {
    const kilatSaatIni = await ambilPengingatKilat();
    const existingIds = new Set(kilatSaatIni.map((k) => k.id));
    const kilatTambahan = dataParsed.quick_reminders.filter(
      (k): k is QuickReminder =>
        !!k &&
        typeof k === 'object' &&
        typeof k.id === 'string' &&
        typeof k.judul === 'string' &&
        typeof k.waktu_target === 'string' &&
        !existingIds.has(k.id)
    );
    if (kilatTambahan.length > 0) {
      await AsyncStorage.setItem(
        QUICK_REMINDERS_KEY,
        JSON.stringify([...kilatSaatIni, ...kilatTambahan])
      );
    }
  }

  return {
    berhasil: true,
    totalItems: itemsDipulihkan,
    totalRiwayat: riwayatDipulihkan,
    pesan: `Berhasil memulihkan ${itemsDipulihkan} dokumen dan ${riwayatDipulihkan} catatan riwayat ke akunmu.`,
  };
}
