import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

import { formatRupiah } from './renewalBudget';

export interface InputKalenderDokumen {
  judul: string;
  jatuhTempo: string; // 'YYYY-MM-DD'
  kategoriLabel: string;
  catatan?: string | null;
  estimasiBiaya?: number | null;
}

export interface HasilSinkronKalender {
  berhasil: boolean;
  eventId?: string;
  namaKalender?: string;
  pesan: string;
}

type KalenderPerangkat = Awaited<ReturnType<typeof Calendar.getCalendarsAsync>>[number];

/**
 * Mencari kalender yang dapat ditulis (allowsModifications: true).
 * Mencoba Calendar.getDefaultCalendarAsync() terlebih dahulu di iOS,
 * lalu fallback ke daftar Calendar.getCalendarsAsync(EVENT) jika gagal/null.
 */
async function cariKalenderYangDapatDitulis(): Promise<KalenderPerangkat | null> {
  if (Platform.OS === 'ios') {
    try {
      const defaultCal = await Calendar.getDefaultCalendarAsync();
      if (defaultCal && defaultCal.allowsModifications) {
        return defaultCal;
      }
    } catch {
      // Lanjut ke fallback daftar kalender di bawah
    }
  }

  try {
    const daftar = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const bisaDitulis = daftar.filter((c) => c.allowsModifications);
    if (bisaDitulis.length === 0) return null;

    // Utamakan kalender utama (isPrimary) atau kalender iCloud/Default
    const utama =
      bisaDitulis.find((c) => c.isPrimary) ??
      bisaDitulis.find((c) =>
        /icloud|default|calendar|pribadi/i.test(`${c.title} ${c.source?.name ?? ''}`)
      ) ??
      bisaDitulis[0];

    return utama ?? null;
  } catch (err) {
    console.warn('[Kalender] Gagal membaca daftar kalender:', err);
    return null;
  }
}

/**
 * Menambahkan jadwal jatuh tempo dokumen sebagai All-Day Event ke Kalender iPhone / perangkat.
 * Aman dijalankan di Expo Go iPhone.
 */
export async function tambahkanKeKalenderIPhone(
  input: InputKalenderDokumen
): Promise<HasilSinkronKalender> {
  if (Platform.OS === 'web') {
    return {
      berhasil: false,
      pesan: 'Fitur sinkronisasi kalender hanya tersedia di aplikasi iPhone / Android.',
    };
  }

  if (!input.jatuhTempo) {
    return {
      berhasil: false,
      pesan: 'Tanggal jatuh tempo dokumen belum diatur.',
    };
  }

  try {
    const izin = await Calendar.requestCalendarPermissionsAsync();
    if (!izin.granted) {
      return {
        berhasil: false,
        pesan:
          'Izin akses Kalender belum diberikan. Aktifkan izin Kalender untuk Expo Go di Pengaturan iPhone.',
      };
    }

    const kalender = await cariKalenderYangDapatDitulis();
    if (!kalender) {
      return {
        berhasil: false,
        pesan: 'Tidak ditemukan kalender yang dapat ditulis pada perangkat ini.',
      };
    }

    const [y, m, d] = input.jatuhTempo.split('-').map(Number);
    if (!y || !m || !d) {
      return {
        berhasil: false,
        pesan: 'Format tanggal jatuh tempo tidak valid.',
      };
    }

    // Untuk All-Day Event di iOS/Android, gunakan UTC midnight atau tanggal lokal penuh
    const startDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));

    const barisCatatan: string[] = [
      `Dokumen: ${input.judul} (${input.kategoriLabel})`,
    ];
    if (input.estimasiBiaya && input.estimasiBiaya > 0) {
      barisCatatan.push(`Estimasi Biaya Perpanjangan: ${formatRupiah(input.estimasiBiaya)}`);
    }
    if (input.catatan?.trim()) {
      barisCatatan.push(`Catatan: ${input.catatan.trim()}`);
    }
    barisCatatan.push('Dibuat otomatis oleh aplikasi INGATIN.');

    const eventId = await Calendar.createEventAsync(kalender.id, {
      title: `🔔 Jatuh Tempo: ${input.judul}`,
      startDate,
      endDate,
      allDay: true,
      notes: barisCatatan.join('\n'),
      alarms: [
        { relativeOffset: -7 * 24 * 60 }, // H-7
        { relativeOffset: -1 * 24 * 60 }, // H-1
      ],
    });

    return {
      berhasil: true,
      eventId,
      namaKalender: kalender.title,
      pesan: `Jadwal "${input.judul}" berhasil ditambahkan sebagai All-Day Event di kalender "${kalender.title}" lengkap dengan pengingat H-7 & H-1.`,
    };
  } catch (err) {
    console.warn('[Kalender] Gagal membuat event kalender:', err);
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan ke kalender.';
    return {
      berhasil: false,
      pesan: `Gagal menambahkan ke kalender: ${msg}`,
    };
  }
}
