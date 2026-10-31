/**
 * test-rls.ts — Tes Row Level Security untuk tabel `item` dan `riwayat_perpanjangan`
 * Jalankan: npx tsx scripts/test-rls.ts
 *
 * Syarat: .env berisi EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL atau EXPO_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan di .env');
  process.exit(1);
}

function buatKlien(): SupabaseClient {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Helper cetak hasil
// ---------------------------------------------------------------------------

let adaKegagalan = false;

function cetak(langkah: string, berhasil: boolean, keterangan?: string): void {
  const ikon = berhasil ? '✔' : '✘';
  const status = berhasil ? 'LULUS' : 'GAGAL';
  console.log(`${ikon} [${status}] ${langkah}${keterangan ? ' — ' + keterangan : ''}`);
  if (!berhasil) {
    adaKegagalan = true;
  }
}

// ---------------------------------------------------------------------------
// Tes utama
// ---------------------------------------------------------------------------

async function jalankanTes(): Promise<void> {
  console.log('\n=== Tes RLS INGATIN ===\n');

  // Buat dua klien terpisah
  const klienA = buatKlien();
  const klienB = buatKlien();

  // Login anonim klien A
  const { data: dataA, error: errA } = await klienA.auth.signInAnonymously();
  const userA = dataA?.user;
  if (errA || !userA) {
    cetak('Inisialisasi: klien A login anonim', false, errA?.message);
    throw new Error("Login anonim gagal");
  }
  const userIdA = userA.id;
  console.log(`Klien A → user_id: ${userIdA.slice(0, 8)}...`);

  // Login anonim klien B
  const { data: dataB, error: errB } = await klienB.auth.signInAnonymously();
  const userB = dataB?.user;
  if (errB || !userB) {
    cetak('Inisialisasi: klien B login anonim', false, errB?.message);
    throw new Error("Login anonim gagal");
  }
  const userIdB = userB.id;
  console.log(`Klien B → user_id: ${userIdB.slice(0, 8)}...`);
  console.log('');

  // ------------------------------------------------------------------
  // Langkah 1: A menambah 1 item → harus berhasil
  // ------------------------------------------------------------------
  const { data: insertA, error: errInsertA } = await klienA
    .from('item')
    .insert({
      judul: 'SIM A Uji RLS',
      template: 'sim',
      jatuh_tempo: '2027-01-01',
      siklus_bulan: 60,
    })
    .select()
    .single();

  cetak(
    'Langkah 1: A menambah item',
    !errInsertA && insertA !== null,
    errInsertA?.message
  );

  if (!insertA) {
    console.error('Tidak bisa lanjut tanpa item A. Hentikan tes.');
    process.exit(1);
  }

  const itemIdA = insertA.id as string;

  // ------------------------------------------------------------------
  // Langkah 2: B membaca semua item → harus 0 baris
  // ------------------------------------------------------------------
  const { data: bacaB, error: errBacaB } = await klienB
    .from('item')
    .select('*');

  cetak(
    'Langkah 2: B membaca semua item (harus 0 baris)',
    !errBacaB && Array.isArray(bacaB) && bacaB.length === 0,
    errBacaB?.message ?? `dapat ${bacaB?.length ?? '?'} baris`
  );

  // ------------------------------------------------------------------
  // Langkah 3: B mengubah item milik A → 0 baris terpengaruh
  // ------------------------------------------------------------------
  const { data: updateB, error: errUpdateB } = await klienB
    .from('item')
    .update({ judul: 'DICURI B' })
    .eq('id', itemIdA)
    .select();

  const judulBerubaH = updateB && updateB.length > 0;
  cetak(
    'Langkah 3: B mengubah item A (harus 0 baris)',
    !errUpdateB && !judulBerubaH,
    errUpdateB?.message ?? `${updateB?.length ?? '?'} baris terpengaruh`
  );

  // Verifikasi data A tidak berubah
  const { data: verifikasiA } = await klienA.from('item').select('judul').eq('id', itemIdA).single();
  cetak(
    'Langkah 3 (verifikasi): data A tidak berubah',
    verifikasiA?.judul === 'SIM A Uji RLS',
    `judul sekarang: "${verifikasiA?.judul}"`
  );

  // ------------------------------------------------------------------
  // Langkah 4: B menghapus item milik A → 0 baris terpengaruh
  // ------------------------------------------------------------------
  const { data: hapusB, error: errHapusB } = await klienB
    .from('item')
    .delete()
    .eq('id', itemIdA)
    .select();

  cetak(
    'Langkah 4: B menghapus item A (harus 0 baris)',
    !errHapusB && Array.isArray(hapusB) && hapusB.length === 0,
    errHapusB?.message ?? `${hapusB?.length ?? '?'} baris dihapus`
  );

  // Verifikasi item A masih ada
  const { data: itemAMasihAda } = await klienA.from('item').select('id').eq('id', itemIdA).single();
  cetak(
    'Langkah 4 (verifikasi): item A masih ada',
    itemAMasihAda !== null,
    itemAMasihAda ? 'ada' : 'HILANG!'
  );

  // ------------------------------------------------------------------
  // Langkah 5: B menambah item dengan user_id milik A → harus ditolak
  // ------------------------------------------------------------------
  const { data: insertBSebagaiA, error: errInsertBSebagaiA } = await klienB
    .from('item')
    .insert({
      judul: 'Penyusupan',
      template: 'custom',
      user_id: userIdA,
    })
    .select();

  // RLS with check harus menolak → error atau 0 baris
  const ditolakLangkah5 =
    errInsertBSebagaiA !== null ||
    (Array.isArray(insertBSebagaiA) && insertBSebagaiA.length === 0);

  cetak(
    'Langkah 5: B menambah item dengan user_id A (harus ditolak)',
    ditolakLangkah5,
    errInsertBSebagaiA?.message ?? 'tidak error tapi 0 baris'
  );

  // ------------------------------------------------------------------
  // Langkah 6: B menambah riwayat untuk item_id milik A → harus ditolak
  // ------------------------------------------------------------------
  const { data: insertRiwayatB, error: errRiwayatB } = await klienB
    .from('riwayat_perpanjangan')
    .insert({
      item_id: itemIdA,
      jatuh_tempo_lama: '2026-01-01',
      jatuh_tempo_baru: '2027-01-01',
    })
    .select();

  const ditolakLangkah6 =
    errRiwayatB !== null ||
    (Array.isArray(insertRiwayatB) && insertRiwayatB.length === 0);

  cetak(
    'Langkah 6: B menambah riwayat untuk item A (harus ditolak)',
    ditolakLangkah6,
    errRiwayatB?.message ?? 'tidak error tapi 0 baris'
  );

  // ------------------------------------------------------------------
  // Langkah 7: A membaca itemnya → tepat 1 baris
  // ------------------------------------------------------------------
  const { data: itemMilikA, error: errBacaA } = await klienA
    .from('item')
    .select('*');

  cetak(
    'Langkah 7: A membaca itemnya (harus tepat 1 baris)',
    !errBacaA && Array.isArray(itemMilikA) && itemMilikA.length === 1,
    errBacaA?.message ?? `dapat ${itemMilikA?.length ?? '?'} baris`
  );

  // ------------------------------------------------------------------
  // Langkah 8: A menghapus itemnya (bersih-bersih)
  // ------------------------------------------------------------------
  const { error: errBersihA } = await klienA
    .from('item')
    .delete()
    .eq('id', itemIdA);

  cetak(
    'Langkah 8: A menghapus itemnya (bersih-bersih)',
    !errBersihA,
    errBersihA?.message
  );

  // ------------------------------------------------------------------
  // Hasil akhir
  // ------------------------------------------------------------------
  console.log('\n' + '='.repeat(40));
  if (adaKegagalan) {
    console.log('❌ Beberapa tes GAGAL. Periksa log di atas.');
    process.exit(1);
  } else {
    console.log('✅ Semua tes LULUS!');
    process.exit(0);
  }
}

jalankanTes().catch((err) => {
  console.error('Error tidak terduga:', err);
  process.exit(1);
});

