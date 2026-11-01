import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';

import { formatTanggal, hitungSisaHari, tentukanStatus } from '@/lib/tanggal';
import type { Item } from '@/types/database';
import type { IngatinWidgetProps } from '@/widgets/IngatinWidget';

export const WIDGET_STORAGE_KEY = '@ingatin_widget_payload';

/**
 * Memeriksa apakah native module ExpoWidgets tersedia di runtime saat ini.
 * Di Expo Go standar, fungsi ini mengembalikan false agar tidak menyebabkan crash.
 */
export function isWidgetNativeAvailable(): boolean {
  try {
    const mod = requireOptionalNativeModule('ExpoWidgets');
    return mod !== null && mod !== undefined;
  } catch {
    return false;
  }
}

/**
 * Menghitung dan menyusun snapshot data widget dari daftar item aktif pengguna.
 */
export function buatWidgetSnapshot(items: Item[]): IngatinWidgetProps {
  const itemsDenganTanggal = items.filter(
    (i) => typeof i.jatuh_tempo === 'string' && i.jatuh_tempo.trim() !== ''
  );

  if (itemsDenganTanggal.length === 0) {
    return {
      adaDokumen: false,
      judulTerdekat: 'Belum ada data',
      sisaHari: null,
      labelSisaHari: 'Semua Aman',
      tanggalJatuhTempo: '—',
      statusBadge: 'aman',
      totalAktif: items.length,
      totalKritis: 0,
      terakhirDiperbarui: new Date().toISOString(),
    };
  }

  // Urutkan berdasarkan jatuh tempo terdekat
  const itemsUrut = [...itemsDenganTanggal].sort((a, b) => {
    const sisaA = hitungSisaHari(a.jatuh_tempo!);
    const sisaB = hitungSisaHari(b.jatuh_tempo!);
    return sisaA - sisaB;
  });

  const terdekat = itemsUrut[0];
  const sisa = hitungSisaHari(terdekat.jatuh_tempo!);
  const status = tentukanStatus(sisa);

  let statusBadge: 'bahaya' | 'kritis' | 'aman' = 'aman';
  let labelSisaHari = `${sisa} Hari`;

  if (status === 'expired') {
    statusBadge = 'bahaya';
    labelSisaHari = `Lewat ${Math.abs(sisa)}h`;
  } else if (sisa === 0) {
    statusBadge = 'bahaya';
    labelSisaHari = 'Hari Ini!';
  } else if (sisa <= 7) {
    statusBadge = 'kritis';
    labelSisaHari = `H-${sisa}`;
  } else {
    statusBadge = 'aman';
    labelSisaHari = `${sisa} Hari`;
  }

  const totalKritis = itemsDenganTanggal.filter((i) => {
    const s = hitungSisaHari(i.jatuh_tempo!);
    return s <= 7;
  }).length;

  return {
    adaDokumen: true,
    judulTerdekat: terdekat.judul,
    sisaHari: sisa,
    labelSisaHari,
    tanggalJatuhTempo: formatTanggal(terdekat.jatuh_tempo!),
    statusBadge,
    totalAktif: items.length,
    totalKritis,
    terakhirDiperbarui: new Date().toISOString(),
  };
}

/**
 * Menyinkronkan daftar item pengguna ke homescreen widget INGATIN dan local storage.
 * Aman dipanggil kapan saja tanpa takut melempar error di Expo Go.
 */
export async function sinkronkanDataWidget(items: Item[]): Promise<boolean> {
  const snapshot = buatWidgetSnapshot(items);

  // 1. Simpan selalu ke AsyncStorage lokal
  try {
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.debug('[WidgetSync] Gagal simpan ke AsyncStorage:', err);
  }

  // 2. Jika modul native widget tersedia (Development Build / Production), kirim updateSnapshot
  if (isWidgetNativeAvailable()) {
    try {
      const widgetMod = await import('@/widgets/IngatinWidget');
      widgetMod.default.updateSnapshot(snapshot);
      return true;
    } catch (err) {
      console.debug('[WidgetSync] Gagal memperbarui native widget snapshot:', err);
    }
  }

  return false;
}
