import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// 1. Konfigurasi Handler Notifikasi (Agar muncul saat aplikasi aktif/foreground)
// ---------------------------------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------------------------------------------------------------------------
// 2. Pemeriksaan & Permintaan Izin Sistem (iOS & Android)
// ---------------------------------------------------------------------------

/**
 * Memeriksa status izin notifikasi saat ini tanpa memunculkan prompt dialog.
 */
export async function cekStatusIzinNotifikasi(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return 'granted';
    }
    if (settings.canAskAgain) {
      return 'undetermined';
    }
    return 'denied';
  } catch (err) {
    console.warn('[Notifikasi] Gagal memeriksa status izin:', err);
    return 'undetermined';
  }
}

/**
 * Meminta izin notifikasi secara asinkron.
 * Tidak akan memblokir alur aplikasi jika pengguna menolak.
 */
export async function mintaIzinNotifikasi(): Promise<boolean> {
  try {
    const statusSaatIni = await Notifications.getPermissionsAsync();
    if (
      statusSaatIni.granted ||
      statusSaatIni.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    const diizinkan = status === 'granted';
    console.log(`[Notifikasi] Permintaan izin notifikasi: ${diizinkan ? 'DIIZINKAN' : 'DITOLAK'}`);
    return diizinkan;
  } catch (err) {
    console.warn('[Notifikasi] Error saat meminta izin notifikasi:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 3. Otomasi Penjadwalan Berdasarkan Jatuh Tempo
// ---------------------------------------------------------------------------

export interface ItemPengingatInput {
  id: string;
  judul: string;
  jatuh_tempo: string | null; // format: 'YYYY-MM-DD'
  tingkat_pengingat?: number[]; // default: [30, 7, 1, 0]
}

/**
 * Menghitung waktu picu notifikasi pada pukul 09:00 pagi (zona waktu HP)
 * sejumlah `hariSebelum` sebelum tanggal jatuh tempo.
 */
function hitungWaktuPicu(jatuhTempoStr: string, hariSebelum: number): Date {
  const [y, m, d] = jatuhTempoStr.split('-').map(Number);
  // Jam 09:00:00 lokal
  const tanggalJatuhTempo = new Date(y, m - 1, d, 9, 0, 0, 0);
  const waktuPicuMs = tanggalJatuhTempo.getTime() - hariSebelum * 24 * 60 * 60 * 1000;
  return new Date(waktuPicuMs);
}

/**
 * Menjadwalkan alarm notifikasi lokal untuk suatu dokumen.
 * Secara otomatis membatalkan jadwal lama dokumen tersebut sebelum mendaftarkan jadwal baru.
 */
export async function jadwalkanPengingatItem(item: ItemPengingatInput): Promise<number> {
  if (!item.jatuh_tempo) {
    console.log(`[Notifikasi] Dokumen "${item.judul}" tidak memiliki tanggal jatuh tempo. Penjadwalan dilewati.`);
    return 0;
  }

  // 1. Batalkan jadwal lama milik item ini agar tidak dobel
  await batalkanPengingatItem(item.id);

  const tingkatPengingat = item.tingkat_pengingat && item.tingkat_pengingat.length > 0
    ? item.tingkat_pengingat
    : [30, 7, 1, 0];

  const sekarang = Date.now();
  let jumlahTerjadwal = 0;

  for (const hari of tingkatPengingat) {
    const waktuPicu = hitungWaktuPicu(item.jatuh_tempo, hari);

    // Abaikan jika waktu pengingat sudah terlewat di masa lalu
    if (waktuPicu.getTime() <= sekarang) {
      console.log(`[Notifikasi] Pengingat H-${hari} untuk "${item.judul}" sudah terlewat (${waktuPicu.toLocaleString()}). Dilewati.`);
      continue;
    }

    let judulNotif = `Pengingat: ${hari} Hari Lagi`;
    let pesanNotif = `Dokumen "${item.judul}" akan jatuh tempo dalam ${hari} hari. Jangan lupa siapkan perpanjangannya.`;

    if (hari === 0) {
      judulNotif = `Tenggat Waktu Hari Ini!`;
      pesanNotif = `Masa berlaku dokumen "${item.judul}" jatuh tempo hari ini. Segera lakukan perpanjangan agar bebas denda.`;
    } else if (hari === 1) {
      judulNotif = `Peringatan: 1 Hari Lagi!`;
      pesanNotif = `Masa berlaku dokumen "${item.judul}" jatuh tempo besok. Periksa kembali kelengkapan berkasmu.`;
    }

    try {
      const identifier = `ingatin-${item.id}-h${hari}`;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: judulNotif,
          body: pesanNotif,
          sound: true,
          data: {
            itemId: item.id,
            hari,
            url: `/dokumen/${item.id}`,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: waktuPicu,
        },
      });

      jumlahTerjadwal++;
      console.log(`✔ [Notifikasi] Terjadwal H-${hari} "${item.judul}" pada ${waktuPicu.toLocaleString()} (ID: ${identifier})`);
    } catch (err) {
      console.warn(`✘ [Notifikasi] Gagal menjadwalkan H-${hari} untuk "${item.judul}":`, err);
    }
  }

  return jumlahTerjadwal;
}

/**
 * Membatalkan semua notifikasi terjadwal yang terhubung dengan suatu dokumen.
 */
export async function batalkanPengingatItem(itemId: string): Promise<void> {
  try {
    const semuaJadwal = await Notifications.getAllScheduledNotificationsAsync();
    const prefix = `ingatin-${itemId}-`;

    for (const notif of semuaJadwal) {
      const cocokIdentifier = notif.identifier.startsWith(prefix);
      const cocokData = (notif.content.data as { itemId?: string })?.itemId === itemId;

      if (cocokIdentifier || cocokData) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        console.log(`[Notifikasi] Dibatalkan: ${notif.identifier}`);
      }
    }
  } catch (err) {
    console.warn(`[Notifikasi] Gagal membatalkan pengingat dokumen ${itemId}:`, err);
  }
}

// ---------------------------------------------------------------------------
// 4. Mekanisme Uji Coba Pengingat (5 Detik)
// ---------------------------------------------------------------------------

/**
 * Menjadwalkan satu notifikasi uji coba 5 detik dari sekarang untuk verifikasi di HP.
 */
export async function ujiKirimNotifikasi5Detik(): Promise<{ berhasil: boolean; pesan: string }> {
  try {
    const diizinkan = await mintaIzinNotifikasi();
    if (!diizinkan) {
      return {
        berhasil: false,
        pesan: 'Izin notifikasi belum diaktifkan di pengaturan perangkatmu.',
      };
    }

    const triggerDate = new Date(Date.now() + 5000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Uji Coba Notifikasi INGATIN',
        body: 'Sistem pengingat berfungsi dengan baik di perangkatmu!',
        sound: true,
        data: { test: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log(`✔ [Notifikasi Uji] Notifikasi dijadwalkan dalam 5 detik (${triggerDate.toLocaleTimeString()})`);
    return {
      berhasil: true,
      pesan: 'Notifikasi uji coba berhasil dijadwalkan! Tunggu 5 detik (pastikan volume/suara aktif).',
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('✘ [Notifikasi Uji] Gagal mengirim notifikasi tes:', err);
    return {
      berhasil: false,
      pesan: `Gagal menjadwalkan notifikasi tes: ${errorMsg}`,
    };
  }
}
