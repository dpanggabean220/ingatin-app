import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Kunci penyimpanan pemetaan foto fisik dokumen lokal ({ [itemId]: localUri }).
 * Prinsip Zero-PII: Foto fisik KTP/SIM/STNK/Paspor 100% disimpan di memori internal HP
 * dan tidak pernah diunggah ke server mana pun.
 */
export const DOCUMENT_PHOTOS_KEY = '@ingatin_document_photos';

export type PetaFotoDokumen = Record<string, string>;

export interface HasilPilihFoto {
  berhasil: boolean;
  dibatalkan?: boolean;
  uri?: string;
  pesan?: string;
}

async function ambilPetaFoto(): Promise<PetaFotoDokumen> {
  try {
    const raw = await AsyncStorage.getItem(DOCUMENT_PHOTOS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as PetaFotoDokumen;
  } catch {
    return {};
  }
}

async function simpanPetaFoto(peta: PetaFotoDokumen): Promise<void> {
  await AsyncStorage.setItem(DOCUMENT_PHOTOS_KEY, JSON.stringify(peta));
}

/**
 * Membuka Kamera atau Galeri HP untuk memilih foto dokumen.
 * Mengembalikan URI sementara sebelum disalin ke penyimpanan dokumen permanen aplikasi.
 */
export async function pilihFotoDokumen(
  sumber: 'kamera' | 'galeri'
): Promise<HasilPilihFoto> {
  try {
    if (sumber === 'kamera') {
      const izin = await ImagePicker.requestCameraPermissionsAsync();
      if (!izin.granted) {
        return {
          berhasil: false,
          pesan: 'Izin akses kamera belum diberikan. Aktifkan melalui Pengaturan iPhone.',
        };
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.82,
      });
      if (res.canceled || !res.assets?.[0]?.uri) {
        return { berhasil: false, dibatalkan: true };
      }
      return { berhasil: true, uri: res.assets[0].uri };
    } else {
      const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!izin.granted) {
        return {
          berhasil: false,
          pesan: 'Izin akses galeri foto belum diberikan. Aktifkan melalui Pengaturan iPhone.',
        };
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.82,
      });
      if (res.canceled || !res.assets?.[0]?.uri) {
        return { berhasil: false, dibatalkan: true };
      }
      return { berhasil: true, uri: res.assets[0].uri };
    }
  } catch (err) {
    console.warn('[Foto Lokal] Gagal memilih foto:', err);
    return {
      berhasil: false,
      pesan: 'Tidak dapat membuka kamera atau galeri pada perangkat ini.',
    };
  }
}

/**
 * Menyalin foto pilihan pengguna ke direktori dokumen lokal aplikasi
 * dan menyimpan pemetaan `{ [itemId]: localUri }` di AsyncStorage.
 */
export async function simpanFotoDokumenLokal(
  itemId: string,
  sourceUri: string
): Promise<string> {
  if (!itemId || !sourceUri) return sourceUri;

  const peta = await ambilPetaFoto();
  const uriLama = peta[itemId];

  // Jika URI tidak berubah, langsung kembalikan
  if (uriLama === sourceUri) {
    return sourceUri;
  }

  let finalUri = sourceUri;

  if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
    try {
      const folderDir = `${FileSystem.documentDirectory}ingatin_photos/`;
      const dirInfo = await FileSystem.getInfoAsync(folderDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderDir, { intermediates: true });
      }

      const extMatch = sourceUri.match(/\.(jpg|jpeg|png|webp|heic)$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const destUri = `${folderDir}doc_${itemId}_${Date.now()}.${ext}`;

      await FileSystem.copyAsync({
        from: sourceUri,
        to: destUri,
      });
      finalUri = destUri;

      // Hapus file foto lama jika ada dan berbeda
      if (uriLama && uriLama !== destUri && uriLama.startsWith(FileSystem.documentDirectory)) {
        FileSystem.deleteAsync(uriLama, { idempotent: true }).catch(() => {});
      }
    } catch (err) {
      console.warn('[Foto Lokal] Gagal menyalin file ke direktori dokumen:', err);
    }
  }

  peta[itemId] = finalUri;
  await simpanPetaFoto(peta);
  return finalUri;
}

/** Mengambil URI foto fisik lokal untuk dokumen tertentu (null jika belum ada). */
export async function ambilFotoDokumenLokal(itemId: string): Promise<string | null> {
  if (!itemId) return null;
  const peta = await ambilPetaFoto();
  const uri = peta[itemId];
  if (!uri) return null;

  if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) return null;
    } catch {
      // Abaikan jika gagal mengecek info file
    }
  }
  return uri;
}

/** Menghapus foto fisik lokal suatu dokumen dari direktori HP & AsyncStorage. */
export async function hapusFotoDokumenLokal(itemId: string): Promise<void> {
  if (!itemId) return;
  const peta = await ambilPetaFoto();
  const uri = peta[itemId];

  if (uri && Platform.OS !== 'web' && FileSystem.documentDirectory) {
    try {
      if (uri.startsWith(FileSystem.documentDirectory)) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch {}
  }

  delete peta[itemId];
  await simpanPetaFoto(peta);
}
