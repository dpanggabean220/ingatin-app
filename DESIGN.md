# DESIGN.md — Panduan visual INGATIN

Sumber: spesifikasi dasar dari David (belum ada ekspor Google Stitch; ganti/perluas dokumen ini kalau ekspor Stitch sudah tersedia).

## Warna
Semua warna di `src/constants/colors.ts`.
- Utama: `#6D4AFF` (aksen, tombol, chip aktif)
- Aman (hijau): `success` · Mendesak (kuning): `warning` · Expired (merah): `error`

## Kartu dokumen — `src/components/document-card.tsx`
- Latar putih, border tipis 1px, `borderRadius: 12`
- Aksen ungu `#6D4AFF` (strip 4px di sisi kiri)
- Menampilkan: judul, kategori (ikon + nama), tanggal jatuh tempo, badge sisa hari, tombol "Perpanjang"
- Badge sisa hari (dihitung dengan zona waktu HP, tanggal tanpa jam):
  - Hijau (aman): lebih dari 30 hari
  - Kuning (mendesak): 0–30 hari
  - Merah (expired): sudah lewat
- Batas 30 hari = `BATAS_MENDESAK_HARI` di `src/lib/tanggal.ts` (asumsi; sesuaikan dengan PRD)

## Daftar kategori — `src/components/category-list.tsx`
Chips horizontal dengan ikon; chip terpilih berlatar ungu.

| Kategori | Nilai `template` | Ikon |
|---|---|---|
| SIM | `sim` | 🪪 |
| STNK | `stnk` | 📄 |
| Pajak Kendaraan | `pajak_kendaraan` | 🚗 |
| KIR | `kir` | 🚛 |
| Paspor | `paspor` | 🛂 |
| Asuransi | `asuransi` | 🛡️ |
| Custom | `custom` | ✨ |

Ikon emoji dipilih sementara agar tidak menambah dependency; bisa diganti ikon dari Stitch.

