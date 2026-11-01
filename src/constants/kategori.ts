import type { TemplateType } from '@/types/database';

export interface Kategori {
  value: TemplateType;
  label: string;
  subtitle: string;
  icon: string;
  /** Warna aksen latar belakang ikon */
  accentBg: string;
}

/** 7 kategori dokumen resmi INGATIN (sesuai skema database `item.template`). */
export const KATEGORI: readonly Kategori[] = [
  {
    value: 'sim',
    label: 'SIM',
    subtitle: 'Surat Izin Mengemudi (A/C)',
    icon: '🪪',
    accentBg: '#F3F2FF',
  },
  {
    value: 'stnk',
    label: 'STNK & Pajak',
    subtitle: 'Surat Tanda Nomor Kendaraan',
    icon: '📄',
    accentBg: '#FFFBEB',
  },
  {
    value: 'pajak_kendaraan',
    label: 'Pajak Kendaraan',
    subtitle: 'Pajak Tahunan / 5 Tahunan Samsat',
    icon: '🚗',
    accentBg: '#FFFBEB',
  },
  {
    value: 'kir',
    label: 'KIR',
    subtitle: 'Uji Kelayakan Kendaraan Niaga',
    icon: '🚛',
    accentBg: '#ECFDF5',
  },
  {
    value: 'paspor',
    label: 'Paspor',
    subtitle: 'Paspor Republik Indonesia',
    icon: '🛂',
    accentBg: '#ECFDF5',
  },
  {
    value: 'asuransi',
    label: 'Asuransi',
    subtitle: 'Polis Kesehatan / Kendaraan / Jiwa',
    icon: '🛡️',
    accentBg: '#F3F2FF',
  },
  {
    value: 'custom',
    label: 'Lainnya',
    subtitle: 'Dokumen kustom pilihanmu',
    icon: '✨',
    accentBg: '#ECECFE',
  },
] as const;

export function getKategori(value: TemplateType): Kategori {
  return KATEGORI.find((k) => k.value === value) ?? KATEGORI[KATEGORI.length - 1];
}
