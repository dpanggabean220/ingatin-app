import type { TemplateType } from '@/types/database';

export interface PanduanPerpanjanganInfo {
  namaLayananResmi: string;
  kanal: string;
  estimasiWaktu: string;
  syaratBerkas: string[];
  tipsSingkat: string;
}

/**
 * Panduan praktis persyaratan & kanal resmi perpanjangan dokumen di Indonesia.
 * Memberikan nilai guna nyata (actionable utility) saat dokumen mendekati jatuh tempo.
 */
export const PANDUAN_PERPANJANGAN: Record<TemplateType, PanduanPerpanjanganInfo> = {
  sim: {
    namaLayananResmi: 'Digital Korlantas POLRI (SINAR) / Satpas Keliling',
    kanal: 'Online (Aplikasi Digital Korlantas) atau Offline di Satpas/SIM Keliling',
    estimasiWaktu: '15–45 menit (wajib sebelum tanggal jatuh tempo lewat)',
    syaratBerkas: [
      'e-KTP asli & fotokopi',
      'SIM lama yang masih aktif (belum lewat masa berlaku)',
      'Surat Keterangan Sehat Jasmani (e-Rikkes / klinik resmi)',
      'Hasil Tes Psikologi (aplikasi ePPsi / lokasi SIM Keliling)',
      'Pas foto latar biru & tanda tangan di kertas putih (khusus perpanjang online)',
    ],
    tipsSingkat:
      'Perpanjang maksimal H-7 sebelum masa berlaku habis. Jika terlambat 1 hari saja, wajib membuat SIM baru dari awal.',
  },
  stnk: {
    namaLayananResmi: 'Aplikasi SIGNAL (Samsat Digital Nasional) / Samsat',
    kanal: 'Online (Aplikasi SIGNAL) atau Gerai Samsat / Samsat Keliling',
    estimasiWaktu: '10–30 menit (Tahunan) / 1–2 jam (5 Tahunan ganti plat)',
    syaratBerkas: [
      'e-KTP asli pemilik sesuai nama di STNK',
      'STNK asli kendaraan',
      'BPKB asli / Surat Keterangan Leasing (khusus perpanjangan 5 tahunan)',
      'Hasil Cek Fisik nomor rangka & mesin (khusus perpanjangan 5 tahunan)',
    ],
    tipsSingkat:
      'Untuk pengesahan STNK tahunan, gunakan aplikasi SIGNAL agar bukti pengesahan e-TBPKP langsung terbit di HP.',
  },
  pajak_kendaraan: {
    namaLayananResmi: 'SIGNAL / e-Samsat Daerah / Indomaret / Tokopedia',
    kanal: 'Online 100% via SIGNAL atau minimarket/e-commerce mitra Samsat',
    estimasiWaktu: '5–15 menit',
    syaratBerkas: [
      'Nomor Polisi (Plat Kendaraan) & 5 digit terakhir Nomor Rangka',
      'NIK e-KTP pemilik sesuai STNK',
    ],
    tipsSingkat:
      'Bayar pajak lebih awal (mulai H-30) untuk menghindari antrean dan denda keterlambatan PKB + SWDKLLJ.',
  },
  paspor: {
    namaLayananResmi: 'Aplikasi M-Paspor (Ditjen Imigrasi)',
    kanal: 'Daftar kuota via aplikasi M-Paspor, lalu wawancara & foto di Kantor Imigrasi',
    estimasiWaktu: '3–4 hari kerja sejak foto & wawancara',
    syaratBerkas: [
      'e-KTP yang masih berlaku',
      'Paspor lama asli (untuk paspor terbitan setelah tahun 2009 di Indonesia)',
      'Kartu Keluarga & Akta Kelahiran / Ijazah (jika ada perubahan data)',
    ],
    tipsSingkat:
      'Negara tujuan umumnya mewajibkan masa berlaku paspor minimal 6 bulan sebelum keberangkatan. Perpanjang sejak H-180 (6 bulan sebelum habis).',
  },
  kir: {
    namaLayananResmi: 'Uji Berkala Kendaraan Bermotor (Dishub)',
    kanal: 'Booking online via aplikasi e-KIR Dishub daerah setempat + uji fisik di UP PKB',
    estimasiWaktu: '45–90 menit',
    syaratBerkas: [
      'STNK asli yang masih hidup',
      'Buku KIR / Kartu Uji Berkala (BLU-e) lama',
      'e-KTP pemilik atau surat kuasa perusahaan',
      'Bukti lulus uji emisi kendaraan',
    ],
    tipsSingkat:
      'Pastikan lampu, rem, klakson, ban, dan emisi gas buang kendaraan dalam kondisi prima sebelum datang ke lokasi uji.',
  },
  asuransi: {
    namaLayananResmi: 'Perpanjangan Polis Asuransi (All Risk / TLO)',
    kanal: 'Aplikasi resmi penyedia asuransi atau agen pemegang polis',
    estimasiWaktu: '1 hari kerja (survei ulang jika polis sempat terputus)',
    syaratBerkas: [
      'Nomor Polis Asuransi sebelumnya',
      'STNK kendaraan aktif',
      'Foto 4 sisi kendaraan terkini (jika diminta inspeksi ulang)',
    ],
    tipsSingkat:
      'Perpanjang sebelum tanggal berakhirnya polis agar tidak perlu melakukan inspeksi/survei fisik ulang dari awal.',
  },
  custom: {
    namaLayananResmi: 'Instansi / Penyedia Layanan Terkait',
    kanal: 'Portal resmi layanan atau kantor cabang terkait',
    estimasiWaktu: 'Sesuai ketentuan instansi',
    syaratBerkas: [
      'Identitas diri (e-KTP)',
      'Dokumen atau kartu anggota periode sebelumnya',
      'Bukti pembayaran biaya perpanjangan (jika berbayar)',
    ],
    tipsSingkat:
      'Siapkan berkas pendukung minimal 7 hari sebelum tanggal jatuh tempo agar proses perpanjangan berjalan lancar.',
  },
};
