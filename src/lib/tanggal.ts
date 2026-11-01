const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Batas hari status sesuai spesifikasi Ingatin Pro (DESIGN.md) */
export const BATAS_KRITIS_HARI = 7;
export const BATAS_MENDESAK_HARI = 30;

export type StatusJatuhTempo = 'aman' | 'mendesak' | 'kritis' | 'expired';

/** Parse 'YYYY-MM-DD' sebagai tanggal lokal (tanpa jam, zona waktu HP). */
function parseTanggalLokal(tanggal: string): Date {
  const [y, m, d] = tanggal.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Sisa hari dari hari ini (zona waktu HP) sampai tanggal jatuh tempo. Negatif jika lewat. */
export function hitungSisaHari(jatuhTempo: string, sekarang: Date = new Date()): number {
  const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  const target = parseTanggalLokal(jatuhTempo);
  return Math.round((target.getTime() - hariIni.getTime()) / MS_PER_DAY);
}

/**
 * Penentuan status berdasarkan tenggat waktu Stitch:
 * - expired : < 0 hari
 * - kritis   : 0 - 7 hari (Mendesak / Kritis)
 * - mendesak : 8 - 30 hari (Mendekati tenggat)
 * - aman    : > 30 hari
 */
export function tentukanStatus(sisaHari: number): StatusJatuhTempo {
  if (sisaHari < 0) return 'expired';
  if (sisaHari <= BATAS_KRITIS_HARI) return 'kritis';
  if (sisaHari <= BATAS_MENDESAK_HARI) return 'mendesak';
  return 'aman';
}

export function formatSisaHari(sisaHari: number): string {
  if (sisaHari < 0) return `Lewat ${Math.abs(sisaHari)} hari`;
  if (sisaHari === 0) return 'Hari ini';
  return `${sisaHari} hari lagi`;
}

const BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

/** '2027-01-05' -> '5 Jan 2027' */
export function formatTanggal(tanggal: string): string {
  const d = parseTanggalLokal(tanggal);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
