import { parseCommand } from '../src/utils/commandParser';

// Acuan: Minggu 1 Nov 2026, 10:00 pagi
const SEKARANG = new Date(2026, 10, 1, 10, 0, 0);
// Acuan sore: 14:30 (jam 1 siang sudah lewat)
const SORE = new Date(2026, 10, 1, 14, 30, 0);

type Kasus = [string, string, string | null, Date?]; // input, judul, label (null = invalid)

const kasus: Kasus[] = [
  ['ingatin gua jam 1 makan siang', 'Makan Siang', 'Hari ini, 13:00'],
  ['ingatin gua jam 1 makan siang', 'Makan Siang', 'Besok, 13:00', SORE],
  ['ingatin jam 8 malam beli galon', 'Beli Galon', 'Hari ini, 20:00'],
  ['ingatin besok jam 9 pagi meeting', 'Meeting', 'Besok, 09:00'],
  ['ingatin 30 menit lagi angkat jemuran', 'Angkat Jemuran', 'Hari ini, 10:30'],
  ['Ingatin siang ini telpon ibu', 'Telpon Ibu', 'Hari ini, 12:00'],
  ['ingatin sore ini jemput adik', 'Jemput Adik', 'Hari ini, 16:00'],
  ['ingetin malam ini bayar listrik', 'Bayar Listrik', 'Hari ini, 19:00'],
  ['ingatin besok pagi olahraga', 'Olahraga', 'Besok, 08:00'],
  ['ingatin besok pagi jam 6 lari', 'Lari', 'Besok, 06:00'],
  ['tolong ingatkan saya jam 3 untuk minum obat', 'Minum Obat', 'Hari ini, 15:00'],
  ['ingatin jam 7 makan malam', 'Makan Malam', 'Hari ini, 19:00'],
  ['ingatin jam 8.30 standup', 'Standup', 'Hari ini, 20:30'],
  ['ingatin jam setengah 8 malam nonton bola', 'Nonton Bola', 'Hari ini, 19:30'],
  ['ingatin jam 12 malam matiin kompor', 'Matiin Kompor', 'Besok, 00:00'],
  ['ingatin sejam lagi cek oven', 'Cek Oven', 'Hari ini, 11:00'],
  ['ingatin setengah jam lagi angkat cucian', 'Angkat Cucian', 'Hari ini, 10:30'],
  ['ingatin lusa jam 10 servis motor', 'Servis Motor', 'Lusa, 10:00'],
  ['ingatin jam 21:15 kunci pintu', 'Kunci Pintu', 'Hari ini, 21:15'],
  ['ingatin jam dua siang rapat', 'Rapat', 'Hari ini, 14:00'],
  ['ingatin beli galon', 'Beli Galon', null],
  ['ingatin jam 5', '', null],
  ['ingatin hari ini jam 9 pagi sarapan', 'Sarapan', null], // sudah lewat
];

let gagal = 0;
for (const [input, judulHarap, labelHarap, acuan] of kasus) {
  const h = parseCommand(input, acuan ?? SEKARANG);
  const okJudul = h.judul === judulHarap;
  const okLabel = labelHarap === null ? !h.valid : h.valid && h.labelWaktu === labelHarap;
  const ok = okJudul && okLabel;
  if (!ok) gagal++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} | ${input}\n       -> judul="${h.judul}" label="${h.labelWaktu}" valid=${h.valid}${h.alasan ? ` alasan="${h.alasan}"` : ''}`
  );
}
console.log(`\n${kasus.length - gagal}/${kasus.length} lulus`);
process.exit(gagal ? 1 : 0);

