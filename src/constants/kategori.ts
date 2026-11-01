import type { TemplateType } from '@/types/database';

export interface Kategori {
  value: TemplateType;
  label: string;
  /** Ikon representatif (emoji, tanpa dependency tambahan) */
  icon: string;
}

/** 7 kategori dokumen resmi INGATIN (sesuai constraint kolom `item.template`). */
export const KATEGORI: readonly Kategori[] = [
  { value: 'sim', label: 'SIM', icon: '🪪' },
  { value: 'stnk', label: 'STNK', icon: '📄' },
  { value: 'pajak_kendaraan', label: 'Pajak Kendaraan', icon: '🚗' },
  { value: 'kir', label: 'KIR', icon: '🚛' },
  { value: 'paspor', label: 'Paspor', icon: '🛂' },
  { value: 'asuransi', label: 'Asuransi', icon: '🛡️' },
  { value: 'custom', label: 'Custom', icon: '✨' },
] as const;

export function getKategori(value: TemplateType): Kategori {
  return KATEGORI.find((k) => k.value === value) ?? KATEGORI[KATEGORI.length - 1];
}

