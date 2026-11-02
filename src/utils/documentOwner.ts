import AsyncStorage from '@react-native-async-storage/async-storage';

/** Kunci penyimpanan lokal untuk tag pemilik dokumen (Keluarga / Pribadi / Kantor) */
export const DOCUMENT_OWNERS_KEY = '@ingatin_document_owners';

export type OwnerTag = 'pribadi' | 'pasangan' | 'orang_tua' | 'anak' | 'kantor';

export interface InfoPemilik {
  value: OwnerTag;
  label: string;
  bg: string;
  textColor: string;
  borderColor: string;
}

export const DAFTAR_PEMILIK: readonly InfoPemilik[] = [
  {
    value: 'pribadi',
    label: 'Pribadi',
    bg: '#2D1F16',
    textColor: '#FF8533',
    borderColor: '#4A2F1D',
  },
  {
    value: 'pasangan',
    label: 'Pasangan',
    bg: '#2E1A24',
    textColor: '#F472B6',
    borderColor: '#4C2639',
  },
  {
    value: 'orang_tua',
    label: 'Orang Tua',
    bg: '#172630',
    textColor: '#38BDF8',
    borderColor: '#233B4A',
  },
  {
    value: 'anak',
    label: 'Anak',
    bg: '#2E2414',
    textColor: '#FBBF24',
    borderColor: '#4A391E',
  },
  {
    value: 'kantor',
    label: 'Kantor',
    bg: '#152B22',
    textColor: '#34D399',
    borderColor: '#214536',
  },
] as const;

export type PetaPemilikDokumen = Record<string, OwnerTag>;

const DEFAULT_PEMILIK_REFERENSI: PetaPemilikDokumen = {
  'ref-sim-c': 'pribadi',
  'ref-stnk-motor': 'pribadi',
  'ref-paspor': 'pasangan',
  'ref-pajak': 'orang_tua',
  'ref-asuransi': 'orang_tua',
  'ref-kir': 'kantor',
};

const VALID_TAGS: OwnerTag[] = ['pribadi', 'pasangan', 'orang_tua', 'anak', 'kantor'];

type ListenerPemilik = () => void;
const listeners = new Set<ListenerPemilik>();
let cachePetaPemilik: PetaPemilikDokumen = { ...DEFAULT_PEMILIK_REFERENSI };
let sudahDimuat = false;

export function langgananPerubahanPemilik(fn: ListenerPemilik): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function beritahuPerubahan(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {}
  }
}

export function getInfoPemilik(tag: OwnerTag | undefined | null): InfoPemilik {
  return DAFTAR_PEMILIK.find((p) => p.value === tag) ?? DAFTAR_PEMILIK[0];
}

export async function ambilSemuaPemilikDokumen(): Promise<PetaPemilikDokumen> {
  try {
    const raw = await AsyncStorage.getItem(DOCUMENT_OWNERS_KEY);
    if (!raw) {
      cachePetaPemilik = { ...DEFAULT_PEMILIK_REFERENSI };
      sudahDimuat = true;
      return cachePetaPemilik;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      cachePetaPemilik = { ...DEFAULT_PEMILIK_REFERENSI };
      sudahDimuat = true;
      return cachePetaPemilik;
    }
    const bersih: PetaPemilikDokumen = { ...DEFAULT_PEMILIK_REFERENSI };
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string' && VALID_TAGS.includes(v as OwnerTag)) {
        bersih[k] = v as OwnerTag;
      }
    }
    cachePetaPemilik = bersih;
    sudahDimuat = true;
    return bersih;
  } catch {
    return cachePetaPemilik;
  }
}

export function ambilCachePemilikDokumen(): PetaPemilikDokumen {
  if (!sudahDimuat) {
    ambilSemuaPemilikDokumen().then(() => beritahuPerubahan());
  }
  return cachePetaPemilik;
}

export async function simpanSemuaPemilikDokumen(
  peta: PetaPemilikDokumen
): Promise<void> {
  cachePetaPemilik = { ...DEFAULT_PEMILIK_REFERENSI, ...peta };
  sudahDimuat = true;
  await AsyncStorage.setItem(DOCUMENT_OWNERS_KEY, JSON.stringify(cachePetaPemilik));
  beritahuPerubahan();
}

export async function aturPemilikDokumen(
  itemId: string,
  tag: OwnerTag | null
): Promise<void> {
  if (!itemId) return;
  const peta = await ambilSemuaPemilikDokumen();
  if (tag && VALID_TAGS.includes(tag)) {
    peta[itemId] = tag;
  } else {
    delete peta[itemId];
  }
  cachePetaPemilik = { ...peta };
  await AsyncStorage.setItem(DOCUMENT_OWNERS_KEY, JSON.stringify(peta));
  beritahuPerubahan();
}

export function ambilPemilikItem(
  itemId: string,
  peta: PetaPemilikDokumen = cachePetaPemilik
): OwnerTag {
  return peta[itemId] ?? 'pribadi';
}
