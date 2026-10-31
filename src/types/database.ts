/** Tipe TypeScript manual untuk tabel database INGATIN */

/** Nilai yang valid untuk kolom `template` pada tabel `item` */
export type TemplateType =
  | 'sim'
  | 'stnk'
  | 'pajak_kendaraan'
  | 'kir'
  | 'paspor'
  | 'asuransi'
  | 'custom';

/** Baris dari tabel `public.item` */
export interface Item {
  id: string;
  user_id: string;
  judul: string;
  template: TemplateType;
  jatuh_tempo: string | null;   // format: 'YYYY-MM-DD'
  siklus_bulan: number | null;
  tingkat_pengingat: number[];
  catatan: string | null;
  dibuat: string;               // ISO 8601 timestamp
  diubah: string;               // ISO 8601 timestamp
}

/** Payload untuk insert ke `public.item` (field auto-generate dikecualikan) */
export type InsertItem = Omit<Item, 'id' | 'user_id' | 'dibuat' | 'diubah'>;

/** Payload untuk update `public.item` */
export type UpdateItem = Partial<InsertItem>;

/** Baris dari tabel `public.riwayat_perpanjangan` */
export interface RiwayatPerpanjangan {
  id: string;
  user_id: string;
  item_id: string;
  jatuh_tempo_lama: string;     // format: 'YYYY-MM-DD'
  jatuh_tempo_baru: string;     // format: 'YYYY-MM-DD'
  diperpanjang_pada: string;    // ISO 8601 timestamp
}

/** Payload untuk insert ke `public.riwayat_perpanjangan` */
export type InsertRiwayatPerpanjangan = Omit<
  RiwayatPerpanjangan,
  'id' | 'user_id' | 'diperpanjang_pada'
>;

/** Struktur database lengkap untuk Supabase client */
export interface Database {
  public: {
    Tables: {
      item: {
        Row: Item;
        Insert: InsertItem & { user_id?: string };
        Update: UpdateItem;
      };
      riwayat_perpanjangan: {
        Row: RiwayatPerpanjangan;
        Insert: InsertRiwayatPerpanjangan & { user_id?: string };
        Update: never;
      };
    };
  };
}

