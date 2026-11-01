/**
 * Smart Local NLP Parser Bahasa Indonesia untuk "Pengingat Kilat".
 *
 * Mengekstrak WAKTU (tanggal & jam) dan JUDUL TUGAS dari kalimat sehari-hari,
 * 100% lokal berbasis aturan (tanpa API AI). Fungsi murni tanpa dependensi
 * sehingga mudah diuji dan aman dijalankan di Expo Go.
 *
 * Contoh:
 *  - "ingatin gua jam 1 makan siang"        -> Makan Siang, 13:00
 *  - "ingatin jam 8 malam beli galon"       -> Beli Galon, 20:00
 *  - "ingatin besok jam 9 pagi meeting"     -> Meeting, besok 09:00
 *  - "ingatin 30 menit lagi angkat jemuran" -> Angkat Jemuran, sekarang + 30 menit
 *  - "ingatin sore ini jemput adik"         -> Jemput Adik, 16:00
 */

export type Periode = 'pagi' | 'siang' | 'sore' | 'malam';

export interface HasilParse {
  /** true jika judul & waktu berhasil dipahami dan waktunya di masa depan */
  valid: boolean;
  judul: string;
  /** Waktu target, null jika jam belum disebutkan */
  waktu: Date | null;
  /** Label ramah, mis. "Hari ini, 13:00" */
  labelWaktu: string;
  /** Penjelasan singkat jika belum valid */
  alasan?: string;
}

const ANGKA_KATA: Record<string, number> = {
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  'dua belas': 12,
  'lima belas': 15,
  'dua puluh': 20,
  'tiga puluh': 30,
  'empat puluh lima': 45,
};

/** Jam default saat hanya periode yang disebut, mis. "sore ini" */
const JAM_DEFAULT_PERIODE: Record<Periode, number> = {
  pagi: 8,
  siang: 12,
  sore: 16,
  malam: 19,
};

/** Kata pengisi yang dibuang dari mana pun dalam kalimat */
const KATA_PENGISI =
  /\b(ingatin|ingetin|ingatkan|ingetkan|ingatin|ingat|inget|remind|reminder|gua|gue|gw|aku|saya|ane|tolong|dong|donk|ya|yah|yaa|nih|deh|plis|please)\b/g;

/** Kata sambung yang dibuang hanya bila berada di awal judul */
const KATA_SAMBUNG_AWAL =
  /^(untuk|buat|utk|kalau|kalo|klo|bahwa|supaya|agar|mau|harus|wajib|soal|tentang|pada|pas|di|ke)\s+/;

const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const POLA_ANGKA_KATA = Object.keys(ANGKA_KATA)
  .sort((a, b) => b.length - a.length)
  .join('|');

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function awalHari(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function tambahHari(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function hurufBesarAwal(teks: string): string {
  return teks
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Konversi jam 12-an ke 24 jam berdasarkan periode.
 * Mengembalikan jam (0-23) dan tambahan hari (untuk "jam 12 malam" / "jam 2 malam").
 */
function konversiJam(
  jam: number,
  periode: Periode | null,
  petunjuk: Periode | null
): { jam: number; tambahHari: number } {
  if (jam > 12) return { jam: jam % 24, tambahHari: 0 }; // sudah format 24 jam

  switch (periode) {
    case 'pagi':
      return { jam: jam === 12 ? 0 : jam, tambahHari: 0 };
    case 'siang':
      // jam 11 siang = 11:00, jam 12 siang = 12:00, jam 1-6 siang = 13:00-18:00
      return { jam: jam >= 1 && jam <= 6 ? jam + 12 : jam, tambahHari: 0 };
    case 'sore':
      return { jam: jam < 12 ? jam + 12 : jam, tambahHari: 0 };
    case 'malam':
      if (jam === 12) return { jam: 0, tambahHari: 1 }; // tengah malam
      if (jam <= 4) return { jam, tambahHari: 1 }; // dini hari
      return { jam: jam + 12, tambahHari: 0 };
  }

  // Tanpa keterangan periode eksplisit -> gunakan petunjuk dari judul / aturan umum
  if (petunjuk === 'siang' || petunjuk === 'sore') {
    if (jam >= 1 && jam <= 6) return { jam: jam + 12, tambahHari: 0 };
  }
  if (petunjuk === 'malam' && jam >= 6 && jam <= 11) {
    return { jam: jam + 12, tambahHari: 0 };
  }
  // Aturan umum: jam 1-5 tanpa keterangan diasumsikan siang/sore (13:00-17:00)
  if (jam >= 1 && jam <= 5) return { jam: jam + 12, tambahHari: 0 };
  return { jam, tambahHari: 0 };
}

/** Label waktu ramah relatif terhadap `sekarang`. */
export function formatLabelWaktu(waktu: Date, sekarang: Date = new Date()): string {
  const jamStr = `${pad2(waktu.getHours())}:${pad2(waktu.getMinutes())}`;
  const selisihHari = Math.round(
    (awalHari(waktu).getTime() - awalHari(sekarang).getTime()) / (24 * 60 * 60 * 1000)
  );
  if (selisihHari === 0) return `Hari ini, ${jamStr}`;
  if (selisihHari === 1) return `Besok, ${jamStr}`;
  if (selisihHari === 2) return `Lusa, ${jamStr}`;
  if (selisihHari === -1) return `Kemarin, ${jamStr}`;
  return `${NAMA_HARI[waktu.getDay()]}, ${waktu.getDate()} ${NAMA_BULAN[waktu.getMonth()]} ${jamStr}`;
}

/**
 * Parse kalimat perintah menjadi judul dan waktu target.
 * @param teks Kalimat dari pengguna (ketik atau dikte)
 * @param sekarang Waktu acuan (default: sekarang), berguna untuk pengujian
 */
export function parseCommand(teks: string, sekarang: Date = new Date()): HasilParse {
  // 1. Normalisasi dasar
  let s = ` ${teks.toLowerCase()} `
    .replace(/[,!?;"“”'’]/g, ' ')
    .replace(/(\d)\s*[.:]\s*(\d{2})\b/g, '$1:$2') // "8.30" / "8 : 30" -> "8:30"
    .replace(/\bpkl\b/g, 'pukul')
    .replace(/\bbsk\b/g, 'besok')
    .replace(/\bbesuk\b/g, 'besok')
    .replace(/\bmnt\b/g, 'menit')
    .replace(/\s+/g, ' ');

  // Ubah angka-kata hanya pada konteks waktu agar judul tidak ikut berubah
  s = s
    .replace(new RegExp(`\\b(jam|pukul)\\s+(${POLA_ANGKA_KATA})\\b`, 'g'), (_, k: string, w: string) => `${k} ${ANGKA_KATA[w]}`)
    .replace(
      new RegExp(`\\b(${POLA_ANGKA_KATA})\\s+(menit|jam)\\b`, 'g'),
      (_, w: string, u: string) => `${ANGKA_KATA[w]} ${u}`
    )
    .replace(/\bsejam\b/g, '1 jam')
    .replace(/\bsemenit\b/g, '1 menit');

  let waktuRelatifMs: number | null = null;
  let offsetHari: number | null = null; // null = tidak disebut
  let hariEksplisitIni = false; // "hari ini", "sore ini", "nanti"
  let periode: Periode | null = null;
  let jam: number | null = null;
  let menit = 0;

  // 2. Waktu relatif: "30 menit lagi", "2 jam lagi", "setengah jam lagi", "dalam 10 menit"
  s = s.replace(
    /\b(?:dalam\s+)?(setengah|seperempat|\d+(?:[.,]5)?)\s*(menit|jam)(?:\s+lagi)?\b(?=(?:\s|$))/,
    (cocok, nilai: string, satuan: string) => {
      // Hanya diterima jika berbentuk "... lagi" atau diawali "dalam"
      if (!/lagi\b/.test(cocok) && !/^dalam\b/.test(cocok.trim())) return cocok;
      let n: number;
      if (nilai === 'setengah') n = 0.5;
      else if (nilai === 'seperempat') n = 0.25;
      else n = parseFloat(nilai.replace(',', '.'));
      const ms = satuan === 'jam' ? n * 60 * 60 * 1000 : n * 60 * 1000;
      waktuRelatifMs = Math.round(ms);
      return ' ';
    }
  );

  // 3. "<periode> ini" -> hari ini + periode ("siang ini" = 12:00, "sore ini" = 16:00, "malam ini" = 19:00)
  s = s.replace(/\b(pagi|siang|sore|malam)\s+ini\b/, (cocok, p: Periode, offset: number, full: string) => {
    hariEksplisitIni = true;
    offsetHari = 0;
    periode = p;
    // "makan siang ini" -> pertahankan kata "siang" di judul
    if (/\bmakan\s*$/.test(full.slice(0, offset))) return ` ${p} `;
    return ' ';
  });

  // 4. Hari + periode: "besok pagi", "nanti malam", "lusa sore", "hari ini siang"
  s = s.replace(/\b(besok|lusa|nanti|hari ini)\s+(pagi|siang|sore|malam)\b/, (_, h: string, p: Periode) => {
    offsetHari = h === 'besok' ? 1 : h === 'lusa' ? 2 : 0;
    hariEksplisitIni = offsetHari === 0;
    periode = p;
    return ' ';
  });

  // 5. Jam: "jam 8", "jam 8:30", "pukul 9", "jam 7 lewat 15", "jam setengah 8", + periode opsional
  s = s.replace(
    /\b(?:jam|pukul)\s+(?:(setengah)\s+)?(\d{1,2})(?::(\d{2}))?(?:\s+lewat\s+(\d{1,2})(?:\s+menit)?)?(?:\s+(pagi|siang|sore|malam))?\b/,
    (_, setengah: string | undefined, j: string, m: string | undefined, lewat: string | undefined, p: Periode | undefined) => {
      let jamAngka = parseInt(j, 10);
      let menitAngka = m ? parseInt(m, 10) : lewat ? parseInt(lewat, 10) : 0;
      if (setengah) {
        // "jam setengah 8" = 07:30
        jamAngka = jamAngka - 1 <= 0 ? 12 : jamAngka - 1;
        menitAngka = 30;
      }
      jam = jamAngka;
      menit = Math.min(menitAngka, 59);
      if (p) periode = p;
      return ' ';
    }
  );

  // 6. Hari saja: "besok", "lusa", "hari ini", "nanti"
  s = s.replace(/\b(besok|lusa|hari ini|nanti)\b/, (_, h: string) => {
    if (offsetHari === null) {
      offsetHari = h === 'besok' ? 1 : h === 'lusa' ? 2 : 0;
      hariEksplisitIni = offsetHari === 0;
    }
    return ' ';
  });

  // 7. Bersihkan judul
  let judulMentah = s.replace(KATA_PENGISI, ' ').replace(/\s+/g, ' ').trim();
  let sebelumnya = '';
  while (sebelumnya !== judulMentah) {
    sebelumnya = judulMentah;
    judulMentah = judulMentah.replace(KATA_SAMBUNG_AWAL, '').trim();
  }
  // Buang kata "jam"/"pukul" yatim yang tersisa di akhir
  judulMentah = judulMentah.replace(/\s*\b(jam|pukul|lagi)\s*$/, '').trim();
  const judul = hurufBesarAwal(judulMentah);

  // Petunjuk periode dari isi judul ("makan siang", "makan malam")
  const petunjuk: Periode | null = /\bsiang\b/.test(judulMentah)
    ? 'siang'
    : /\bsore\b/.test(judulMentah)
    ? 'sore'
    : /\bmalam\b/.test(judulMentah)
    ? 'malam'
    : /\bpagi\b/.test(judulMentah)
    ? 'pagi'
    : null;

  // 8. Hitung waktu target
  let waktu: Date | null = null;
  let alasan: string | undefined;

  if (waktuRelatifMs !== null) {
    waktu = new Date(sekarang.getTime() + (waktuRelatifMs as number));
  } else {
    // Jika jam tidak disebut tapi periode ada ("sore ini", "besok pagi") -> jam default periode
    const p = periode as Periode | null;
    if (jam === null && p !== null) {
      jam = JAM_DEFAULT_PERIODE[p];
      menit = 0;
    }

    if (jam !== null) {
      const konversi = konversiJam(jam, p, petunjuk);
      const dasar = tambahHari(awalHari(sekarang), (offsetHari ?? 0) + konversi.tambahHari);
      waktu = new Date(dasar.getFullYear(), dasar.getMonth(), dasar.getDate(), konversi.jam, menit, 0, 0);

      if (waktu.getTime() <= sekarang.getTime()) {
        const ambigu = p === null && petunjuk === null && jam >= 6 && jam <= 11;
        const versiMalam = new Date(waktu.getTime() + 12 * 60 * 60 * 1000);
        if (offsetHari === null && ambigu && versiMalam.getTime() > sekarang.getTime()) {
          // "jam 8" diucapkan jam 10 pagi tanpa keterangan -> maksudnya 20:00 hari ini
          waktu = versiMalam;
        } else if (offsetHari === null) {
          // Hari tidak disebut & jam sudah lewat -> geser ke besok
          waktu = tambahHari(waktu, 1);
        } else if (hariEksplisitIni) {
          alasan = 'Jam tersebut hari ini sudah lewat.';
        }
      }
    } else if (offsetHari !== null) {
      alasan = 'Sebutkan jamnya, mis. "jam 9 pagi".';
    } else {
      alasan = 'Sebutkan jam, mis. "jam 3 sore" atau "30 menit lagi".';
    }
  }

  if (!alasan && !judul) {
    alasan = 'Sebutkan tugasnya, mis. "beli galon".';
  }

  return {
    valid: !alasan && waktu !== null && judul.length > 0,
    judul,
    waktu,
    labelWaktu: waktu ? formatLabelWaktu(waktu, sekarang) : '—',
    alasan,
  };
}
