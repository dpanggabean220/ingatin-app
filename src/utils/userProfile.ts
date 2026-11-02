import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_PROFILE_KEY = '@ingatin_user_profile';

export interface ProfilPenggunaLokal {
  namaPanggilan: string;
  /** Bila true dan belum ada dokumen asli, tampilkan dokumen contoh referensi */
  tampilkanDataContoh: boolean;
}

const DEFAULT_PROFIL: ProfilPenggunaLokal = {
  namaPanggilan: 'David',
  tampilkanDataContoh: true,
};

type ListenerProfil = (profil: ProfilPenggunaLokal) => void;
const listeners = new Set<ListenerProfil>();
let cacheProfil: ProfilPenggunaLokal = { ...DEFAULT_PROFIL };
let sudahDimuat = false;

export function langgananProfilPengguna(fn: ListenerProfil): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function beritahuPerubahan(): void {
  for (const fn of listeners) {
    try {
      fn(cacheProfil);
    } catch {}
  }
}

/** Menghasilkan 2 huruf inisial dari nama panggilan (contoh: "David" -> "DG" atau "Budi Santoso" -> "BS") */
export function buatInisialNama(nama: string): string {
  const bersih = nama.trim();
  if (!bersih) return 'IN';
  if (bersih.toLowerCase() === 'david') return 'DG';
  const bagian = bersih.split(/\s+/).filter(Boolean);
  if (bagian.length >= 2) {
    return `${bagian[0][0]}${bagian[1][0]}`.toUpperCase();
  }
  return bersih.slice(0, 2).toUpperCase();
}

export async function ambilProfilPengguna(): Promise<ProfilPenggunaLokal> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!raw) {
      sudahDimuat = true;
      return cacheProfil;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      sudahDimuat = true;
      return cacheProfil;
    }
    const obj = parsed as Partial<ProfilPenggunaLokal>;
    cacheProfil = {
      namaPanggilan:
        typeof obj.namaPanggilan === 'string' && obj.namaPanggilan.trim()
          ? obj.namaPanggilan.trim()
          : DEFAULT_PROFIL.namaPanggilan,
      tampilkanDataContoh:
        typeof obj.tampilkanDataContoh === 'boolean'
          ? obj.tampilkanDataContoh
          : DEFAULT_PROFIL.tampilkanDataContoh,
    };
    sudahDimuat = true;
    return cacheProfil;
  } catch {
    return cacheProfil;
  }
}

export function ambilCacheProfilPengguna(): ProfilPenggunaLokal {
  if (!sudahDimuat) {
    ambilProfilPengguna().then(() => beritahuPerubahan());
  }
  return cacheProfil;
}

export async function simpanProfilPengguna(
  pembaruan: Partial<ProfilPenggunaLokal>
): Promise<ProfilPenggunaLokal> {
  const saatIni = await ambilProfilPengguna();
  cacheProfil = {
    ...saatIni,
    ...pembaruan,
    namaPanggilan:
      pembaruan.namaPanggilan !== undefined
        ? pembaruan.namaPanggilan.trim() || 'Pengguna'
        : saatIni.namaPanggilan,
  };
  sudahDimuat = true;
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(cacheProfil));
  beritahuPerubahan();
  return cacheProfil;
}
