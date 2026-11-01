import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { mintaIzinNotifikasi } from '@/lib/notifications';

/**
 * Pengingat Kilat: pengingat harian/jam-jaman yang disimpan 100% lokal,
 * terpisah dari dokumen utama (SIM/STNK/Paspor) di Supabase.
 */
export const QUICK_REMINDERS_KEY = '@ingatin_quick_reminders';
const QUICK_REMINDERS_SEEDED_KEY = '@ingatin_quick_reminders_seeded_v2';

function buatWaktuHariIni(jam: number, menit: number): string {
  const d = new Date();
  d.setHours(jam, menit, 0, 0);
  return d.toISOString();
}

export function buatDefaultPengingatKilat(): QuickReminder[] {
  return [
    {
      id: 'default-galon',
      judul: 'Beli galon',
      waktu_target: buatWaktuHariIni(15, 30),
      kalimat_asli: 'Beli galon jam 15:30',
      selesai: false,
      notification_id: null,
    },
    {
      id: 'default-meeting',
      judul: 'Meeting tim',
      waktu_target: buatWaktuHariIni(10, 0),
      kalimat_asli: 'Meeting tim jam 10:00',
      selesai: false,
      notification_id: null,
    },
  ];
}

export interface QuickReminder {
  id: string;
  judul: string;
  /** ISO string lengkap (tanggal & jam) */
  waktu_target: string;
  kalimat_asli: string;
  selesai: boolean;
  notification_id: string | null;
}

export interface InputPengingatKilat {
  judul: string;
  waktu: Date;
  kalimatAsli: string;
}

const SATU_HARI_MS = 24 * 60 * 60 * 1000;

function buatId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatJam(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function simpanSemua(list: QuickReminder[]): Promise<void> {
  await AsyncStorage.setItem(QUICK_REMINDERS_KEY, JSON.stringify(list));
}

/** Membaca semua pengingat kilat. Data rusak diabaikan dengan aman. */
export async function ambilPengingatKilat(): Promise<QuickReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(QUICK_REMINDERS_KEY);
    if (!raw) {
      const seeded = await AsyncStorage.getItem(QUICK_REMINDERS_SEEDED_KEY);
      if (!seeded) {
        const defaults = buatDefaultPengingatKilat();
        await AsyncStorage.setItem(QUICK_REMINDERS_SEEDED_KEY, '1');
        await simpanSemua(defaults);
        return defaults;
      }
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is QuickReminder =>
        !!r &&
        typeof r === 'object' &&
        typeof (r as QuickReminder).id === 'string' &&
        typeof (r as QuickReminder).judul === 'string' &&
        typeof (r as QuickReminder).waktu_target === 'string'
    );
  } catch (err) {
    console.warn('[Pengingat Kilat] Gagal membaca penyimpanan:', err);
    return [];
  }
}

async function batalkanNotifikasi(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('[Pengingat Kilat] Gagal membatalkan notifikasi:', err);
  }
}

export type HasilTambahKilat =
  | { berhasil: true; reminder: QuickReminder }
  | { berhasil: false; pesan: string };

/**
 * Menjadwalkan notifikasi lokal tepat pada waktu target lalu menyimpan pengingat.
 */
export async function tambahPengingatKilat(input: InputPengingatKilat): Promise<HasilTambahKilat> {
  if (input.waktu.getTime() <= Date.now()) {
    return { berhasil: false, pesan: 'Waktu pengingat sudah lewat. Pilih jam yang akan datang.' };
  }

  const diizinkan = await mintaIzinNotifikasi();
  if (!diizinkan) {
    return {
      berhasil: false,
      pesan: 'Izin notifikasi belum aktif. Aktifkan lewat Pengaturan HP agar pengingat bisa berbunyi.',
    };
  }

  const id = buatId();
  const identifier = `kilat-${id}`;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `⚡ ${input.judul}`,
        body: `Pengingat kilat pukul ${formatJam(input.waktu)} — "${input.kalimatAsli.trim()}"`,
        sound: true,
        data: { jenis: 'kilat', reminderId: id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: input.waktu,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { berhasil: false, pesan: `Gagal menjadwalkan notifikasi: ${msg}` };
  }

  const reminder: QuickReminder = {
    id,
    judul: input.judul,
    waktu_target: input.waktu.toISOString(),
    kalimat_asli: input.kalimatAsli.trim(),
    selesai: false,
    notification_id: identifier,
  };

  const list = await ambilPengingatKilat();
  await simpanSemua([...list, reminder]);
  return { berhasil: true, reminder };
}

/** Menandai pengingat selesai dan membatalkan notifikasinya. */
export async function tandaiSelesai(id: string): Promise<void> {
  const list = await ambilPengingatKilat();
  const target = list.find((r) => r.id === id);
  if (!target) return;

  await batalkanNotifikasi(target.notification_id);
  await simpanSemua(
    list.map((r) => (r.id === id ? { ...r, selesai: true, notification_id: null } : r))
  );
}

/** Menghapus pengingat beserta notifikasi terjadwalnya. */
export async function hapusPengingatKilat(id: string): Promise<void> {
  const list = await ambilPengingatKilat();
  const target = list.find((r) => r.id === id);
  if (target) await batalkanNotifikasi(target.notification_id);
  await simpanSemua(list.filter((r) => r.id !== id));
}

/** Menghapus semua pengingat kilat (dipakai saat reset akun). */
export async function hapusSemuaPengingatKilat(): Promise<void> {
  const list = await ambilPengingatKilat();
  for (const r of list) await batalkanNotifikasi(r.notification_id);
  await AsyncStorage.removeItem(QUICK_REMINDERS_KEY);
}

/**
 * Membersihkan pengingat yang sudah selesai atau terlewat lebih dari 1 hari
 * agar penyimpanan lokal tetap ramping.
 */
export async function bersihkanPengingatLama(): Promise<QuickReminder[]> {
  const list = await ambilPengingatKilat();
  const batas = Date.now() - SATU_HARI_MS;
  const tersisa = list.filter((r) => new Date(r.waktu_target).getTime() >= batas);
  if (tersisa.length !== list.length) await simpanSemua(tersisa);
  return tersisa;
}
