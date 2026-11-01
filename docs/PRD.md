# PRD INGATIN v1.1

> **Catatan:** dokumen ini BELUM PRD lengkap. Isinya baru spesifikasi yang diberikan David (kategori dan kartu dokumen) ditambah skema database Minggu 1. Bagian lain (roadmap, fitur, reminder, dsb.) menyusul saat teks PRD v1.1 asli tersedia.

## Kategori dokumen (7, resmi)
SIM, STNK, Pajak Kendaraan, KIR, Paspor, Asuransi, Custom.
Nilai di database (`item.template`): `sim`, `stnk`, `pajak_kendaraan`, `kir`, `paspor`, `asuransi`, `custom`.

## Kartu dokumen
Menampilkan judul, kategori, tanggal jatuh tempo, sisa hari, dan tombol Perpanjang.
Indikator sisa hari: hijau = aman, kuning = mendesak, merah = expired.
Detail visual: lihat `DESIGN.md`.

## Daftar kategori
Chips/grid dengan ikon representatif untuk tiap dari 7 kategori.

## Data (Minggu 1)
Tabel `item` dan `riwayat_perpanjangan` dengan RLS `user_id = auth.uid()`; lihat `supabase/migrations/`.
