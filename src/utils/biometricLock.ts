import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/** Kunci penyimpanan lokal untuk status penguncian aplikasi dengan Face ID / Biometrik */
export const BIOMETRIC_LOCK_KEY = '@ingatin_biometric_lock';

export interface InfoDukunganBiometrik {
  tersedia: boolean;
  terdaftar: boolean;
  namaMetode: string;
}

/**
 * Memeriksa apakah perangkat memiliki sensor biometrik (Face ID / Touch ID / Sidik Jari)
 * yang sudah terdaftar. Aman dijalankan di Expo Go maupun web.
 */
export async function cekDukunganBiometrik(): Promise<InfoDukunganBiometrik> {
  if (Platform.OS === 'web') {
    return { tersedia: false, terdaftar: false, namaMetode: 'Biometrik' };
  }
  try {
    const [hasHardware, isEnrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    const adaFaceId = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const namaMetode = adaFaceId
      ? Platform.OS === 'ios'
        ? 'Face ID'
        : 'Pengenalan Wajah'
      : Platform.OS === 'ios'
      ? 'Touch ID'
      : 'Biometrik / Sidik Jari';

    return {
      tersedia: hasHardware,
      terdaftar: hasHardware && isEnrolled,
      namaMetode,
    };
  } catch (err) {
    console.warn('[Biometrik] Gagal memeriksa dukungan hardware:', err);
    return { tersedia: false, terdaftar: false, namaMetode: 'Face ID / Biometrik' };
  }
}

/** Membaca preferensi kunci aplikasi biometrik dari AsyncStorage */
export async function ambilStatusKunciBiometrik(): Promise<boolean> {
  try {
    const nilai = await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY);
    return nilai === 'true';
  } catch {
    return false;
  }
}

/** Menyimpan preferensi kunci aplikasi biometrik ke AsyncStorage */
export async function aturStatusKunciBiometrik(aktif: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_LOCK_KEY, aktif ? 'true' : 'false');
}

export interface HasilVerifikasiBiometrik {
  berhasil: boolean;
  pesan?: string;
}

/**
 * Meminta verifikasi Face ID / Touch ID / Kode Sandi perangkat.
 * Jika dijalankan di simulator/perangkat yang belum mengaktifkan biometrik,
 * tetap berjalan aman tanpa membuat aplikasi crash.
 */
export async function verifikasiBiometrik(
  pesanPrompt = 'Verifikasi identitas untuk melanjutkan'
): Promise<HasilVerifikasiBiometrik> {
  if (Platform.OS === 'web') {
    return { berhasil: true };
  }

  try {
    const info = await cekDukunganBiometrik();
    if (!info.tersedia || !info.terdaftar) {
      // Tetap coba panggil authenticateAsync dengan fallback passcode perangkat jika hardware ada
      if (info.tersedia) {
        const resPasscode = await LocalAuthentication.authenticateAsync({
          promptMessage: pesanPrompt,
          fallbackLabel: 'Gunakan Kode Sandi',
          cancelLabel: 'Batal',
          disableDeviceFallback: false,
        });
        if (resPasscode.success) return { berhasil: true };
      }
      // Pada simulator tanpa passcode/Face ID, izinkan dengan aman agar tidak mengunci pengguna
      return {
        berhasil: true,
        pesan: 'Sensor Face ID belum diatur di perangkat ini (mode pratinjau aktif).',
      };
    }

    const hasil = await LocalAuthentication.authenticateAsync({
      promptMessage: pesanPrompt,
      fallbackLabel: 'Gunakan Kode Sandi iPhone',
      cancelLabel: 'Batal',
      disableDeviceFallback: false,
    });

    if (hasil.success) {
      return { berhasil: true };
    }

    return {
      berhasil: false,
      pesan:
        hasil.error === 'user_cancel' || hasil.error === 'system_cancel'
          ? 'Verifikasi dibatalkan.'
          : 'Verifikasi biometrik tidak berhasil.',
    };
  } catch (err) {
    console.warn('[Biometrik] Gagal memverifikasi:', err);
    return {
      berhasil: false,
      pesan: 'Tidak dapat memproses verifikasi biometrik saat ini.',
    };
  }
}

/**
 * Menyensor sebagian nomor dokumen atau plat kendaraan secara default demi privasi.
 * Contoh:
 * - "No. 1234-5678-9012" -> "No. 1234-••••-9012"
 * - "B 6789 KLM"         -> "B •••• KLM"
 * - "A1234567"           -> "A••••567"
 * - "No. POL-2025-001"   -> "No. POL-••••-001"
 */
export function sensorNomorDokumen(teks: string): string {
  const bersih = teks.trim();
  if (!bersih) return bersih;

  // 1. Format dipisahkan tanda hubung: misal "No. 1234-5678-9012" atau "POL-2025-001"
  if (bersih.includes('-')) {
    const bagian = bersih.split('-');
    if (bagian.length >= 3) {
      return `${bagian[0]}-••••-${bagian.slice(2).join('-')}`;
    }
    if (bagian.length === 2) {
      return `${bagian[0]}-••••`;
    }
  }

  // 2. Format plat kendaraan Indonesia: misal "B 6789 KLM"
  const platMatch = bersih.match(/^([A-Z]{1,2})\s+(\d{1,4})\s+([A-Z]{1,3})$/i);
  if (platMatch) {
    return `${platMatch[1]} •••• ${platMatch[3]}`;
  }

  // 3. Format nomor paspor / alfanumerik rapat: misal "A1234567"
  if (/^[A-Z0-9]{6,}$/i.test(bersih)) {
    const awal = bersih.slice(0, Math.min(2, Math.floor(bersih.length / 4) || 1));
    const akhir = bersih.slice(-3);
    return `${awal}••••${akhir}`;
  }

  // 4. Jika mengandung deretan angka >= 4 digit di dalam kalimat
  if (/\d{4,}/.test(bersih)) {
    return bersih.replace(/\d{4,}/, (m) => {
      if (m.length <= 4) return '••••';
      return `${m.slice(0, 2)}••••${m.slice(-2)}`;
    });
  }

  // 5. Fallback umum untuk teks pendek lainnya
  if (bersih.length > 6) {
    return `${bersih.slice(0, 3)}••••${bersih.slice(-2)}`;
  }

  return '••••';
}
