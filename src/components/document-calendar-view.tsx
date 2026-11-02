import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { getKategori } from '@/constants/kategori';
import { formatTanggal, hitungSisaHari } from '@/lib/tanggal';
import type { Item } from '@/types/database';
import {
  ambilCachePemilikDokumen,
  ambilPemilikItem,
  getInfoPemilik,
} from '@/utils/documentOwner';
import { haptic } from '@/utils/haptics';
import {
  ambilBiayaDokumen,
  ambilCacheBiayaPerpanjangan,
  formatRupiah,
} from '@/utils/renewalBudget';

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const NAMA_BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const HARI_HEADER = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DocumentCalendarViewProps {
  items: Item[];
  onPressItem: (id: string) => void;
}

/**
 * Tampilan Kalender Bulanan & Timeline "Ongoing" sesuai layar sebelah kanan
 * pada Foto Referensi 1 (Obsidian Dark + Lingkaran Tanggal Oranye #F25C05 + Timeline Kartu).
 */
export function DocumentCalendarView({
  items,
  onPressItem,
}: DocumentCalendarViewProps) {
  // Default ke bulan dari dokumen jatuh tempo terdekat agar langsung terlihat aktif
  const tanggalAwal = useMemo(() => {
    const denganTgl = items.find((i) => !!i.jatuh_tempo);
    if (denganTgl?.jatuh_tempo) {
      const [y, m, d] = denganTgl.jatuh_tempo.split('-').map(Number);
      if (y && m) return new Date(y, m - 1, d || 1);
    }
    return new Date();
  }, [items]);

  const [tahun, setTahun] = useState(() => tanggalAwal.getFullYear());
  const [bulan, setBulan] = useState(() => tanggalAwal.getMonth()); // 0..11
  const [hariTerpilih, setHariTerpilih] = useState<number | null>(() =>
    tanggalAwal.getDate()
  );

  const petaBiaya = ambilCacheBiayaPerpanjangan();
  const petaPemilik = ambilCachePemilikDokumen();

  const bulanSebelumnya = (bulan + 11) % 12;
  const bulanBerikutnya = (bulan + 1) % 12;

  const gantiBulan = (delta: number) => {
    haptic.selection();
    const d = new Date(tahun, bulan + delta, 1);
    setTahun(d.getFullYear());
    setBulan(d.getMonth());
    setHariTerpilih(null);
  };

  // Pemetaan tanggal (1..31) -> daftar dokumen jatuh tempo di bulan & tahun ini
  const petaDokumenBulanIni = useMemo(() => {
    const map = new Map<number, Item[]>();
    for (const item of items) {
      if (!item.jatuh_tempo) continue;
      const [y, m, d] = item.jatuh_tempo.split('-').map(Number);
      if (y === tahun && m - 1 === bulan && d) {
        const list = map.get(d) ?? [];
        list.push(item);
        map.set(d, list);
      }
    }
    return map;
  }, [items, tahun, bulan]);

  // Sel kalender bulan aktif
  const selKalender = useMemo(() => {
    const hariPertama = new Date(tahun, bulan, 1).getDay(); // 0 (Sun) .. 6 (Sat)
    const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < hariPertama; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= jumlahHari; d++) {
      cells.push(d);
    }
    return cells;
  }, [tahun, bulan]);

  // Daftar dokumen yang ditampilkan di bagian "Ongoing" di bawah kalender
  const daftarJadwalTampil = useMemo(() => {
    const semuaDiBulanIni: Item[] = [];
    petaDokumenBulanIni.forEach((arr) => {
      semuaDiBulanIni.push(...arr);
    });
    if (hariTerpilih && petaDokumenBulanIni.has(hariTerpilih)) {
      const padaHari = petaDokumenBulanIni.get(hariTerpilih) ?? [];
      const sisanya = semuaDiBulanIni.filter((i) => !padaHari.includes(i));
      return [...padaHari, ...sisanya];
    }
    if (semuaDiBulanIni.length > 0) {
      return semuaDiBulanIni;
    }
    // Jika bulan ini kosong, tampilkan 3 dokumen terdekat secara keseluruhan
    return items.filter((i) => !!i.jatuh_tempo).slice(0, 3);
  }, [items, petaDokumenBulanIni, hariTerpilih]);

  return (
    <View style={styles.container}>
      {/* ==================== KALENDER BULANAN (SESUAI REFERENSI KANAN) ==================== */}
      <View style={styles.calendarCard}>
        {/* Navigasi Bulan: <- Sep   October   Nov -> */}
        <View style={styles.monthHeaderRow}>
          <Pressable
            style={({ pressed }) => [styles.monthNavBtn, pressed && styles.pressed]}
            onPress={() => gantiBulan(-1)}
            accessibilityRole="button"
            accessibilityLabel="Bulan sebelumnya"
          >
            <Text style={styles.monthNavText}>
              ← {NAMA_BULAN_SINGKAT[bulanSebelumnya]}
            </Text>
          </Pressable>

          <Text style={styles.monthTitle}>
            {NAMA_BULAN[bulan]} {tahun}
          </Text>

          <Pressable
            style={({ pressed }) => [styles.monthNavBtn, pressed && styles.pressed]}
            onPress={() => gantiBulan(1)}
            accessibilityRole="button"
            accessibilityLabel="Bulan berikutnya"
          >
            <Text style={styles.monthNavText}>
              {NAMA_BULAN_SINGKAT[bulanBerikutnya]} →
            </Text>
          </Pressable>
        </View>

        {/* Header Hari: Su Mo Tu We Th Fr Sa */}
        <View style={styles.weekHeaderRow}>
          {HARI_HEADER.map((hari) => (
            <View key={hari} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{hari}</Text>
            </View>
          ))}
        </View>

        {/* Grid Tanggal 1..31 */}
        <View style={styles.daysGrid}>
          {selKalender.map((tgl, idx) => {
            if (tgl === null) {
              return <View key={`empty-${idx}`} style={styles.dayCell} />;
            }
            const adaDokumen = petaDokumenBulanIni.has(tgl);
            const isSelected = hariTerpilih === tgl;
            const highlightOranye = isSelected || adaDokumen;

            return (
              <Pressable
                key={`day-${tgl}`}
                style={styles.dayCell}
                onPress={() => {
                  haptic.selection();
                  setHariTerpilih(tgl);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Tanggal ${tgl} ${NAMA_BULAN[bulan]}`}
              >
                <View
                  style={[
                    styles.dayBubble,
                    highlightOranye && styles.dayBubbleOrange,
                    isSelected && styles.dayBubbleSelectedRing,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      highlightOranye && styles.dayTextHighlighted,
                    ]}
                  >
                    {tgl}
                  </Text>
                </View>
                {adaDokumen && !highlightOranye && <View style={styles.dueDot} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ==================== SEKSI "ONGOING" TIMELINE DI BAWAH KALENDER ==================== */}
      <View style={styles.ongoingHeaderRow}>
        <Text style={styles.ongoingTitle}>Ongoing • Jadwal Jatuh Tempo</Text>
        <Text style={styles.ongoingSubtitle}>
          {petaDokumenBulanIni.size > 0
            ? `${petaDokumenBulanIni.size} tanggal aktif di bulan ini`
            : 'Dokumen terdekat'}
        </Text>
      </View>

      <View style={styles.timelineList}>
        {daftarJadwalTampil.map((doc, idx) => {
          const kat = getKategori(doc.template);
          const sisa = doc.jatuh_tempo ? hitungSisaHari(doc.jatuh_tempo) : null;
          const pemilikInfo = getInfoPemilik(ambilPemilikItem(doc.id, petaPemilik));
          const biaya = ambilBiayaDokumen(doc, petaBiaya);
          // Kartu ke-2 atau kartu yang bertepatan dengan tanggal terpilih diberi warna solid Burnt Orange seperti referensi
          const isOrangeFeatured = idx === 1 || (idx === 0 && daftarJadwalTampil.length === 1);
          const tglSingkat = doc.jatuh_tempo ? doc.jatuh_tempo.slice(8, 10) : '--';

          return (
            <View key={doc.id}>
              {/* Garis indikator timeline oranye di antara kartu seperti layar kanan referensi */}
              {idx === 1 && (
                <View style={styles.timelineDividerRow}>
                  <Text style={styles.timelineLeftLabel}>H-{Math.max(0, sisa ?? 0)}</Text>
                  <View style={styles.timelineOrangeDot}>
                    <View style={styles.timelineInnerWhiteDot} />
                  </View>
                  <View style={styles.timelineOrangeLine} />
                </View>
              )}

              <View style={styles.timelineRow}>
                {/* Kolom Kiri: Tanggal / Label Waktu */}
                <View style={styles.timeCol}>
                  <Text style={styles.timeColDay}>Tgl {tglSingkat}</Text>
                  <Text style={styles.timeColMonth}>
                    {doc.jatuh_tempo
                      ? NAMA_BULAN_SINGKAT[Number(doc.jatuh_tempo.slice(5, 7)) - 1]
                      : ''}
                  </Text>
                </View>

                {/* Kartu Agenda Dokumen */}
                <Pressable
                  style={({ pressed }) => [
                    styles.timelineCard,
                    isOrangeFeatured && styles.timelineCardOrange,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    haptic.light();
                    onPressItem(doc.id);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.timelineCardTitle} numberOfLines={1}>
                    {doc.judul}
                  </Text>
                  <Text
                    style={[
                      styles.timelineCardSub,
                      isOrangeFeatured && styles.timelineCardSubOrange,
                    ]}
                    numberOfLines={1}
                  >
                    {kat.label} • {pemilikInfo.label}
                    {biaya ? ` • ${formatRupiah(biaya)}` : ''}
                  </Text>

                  <View style={styles.timelineCardBottom}>
                    <View style={styles.avatarPair}>
                      <View
                        style={[
                          styles.miniBadgeCircle,
                          { backgroundColor: isOrangeFeatured ? '#1B1815' : Colors.primary },
                        ]}
                      >
                        <Text style={styles.miniBadgeCircleText}>
                          {kat.label.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.ownerSmallTag,
                          isOrangeFeatured && { color: '#FFF7ED' },
                        ]}
                      >
                        {doc.jatuh_tempo ? formatTanggal(doc.jatuh_tempo) : 'Belum diatur'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.timelineRightTime,
                        isOrangeFeatured && styles.timelineRightTimeOrange,
                      ]}
                    >
                      {sisa === null
                        ? 'Aman'
                        : sisa < 0
                        ? `Lewat ${Math.abs(sisa)}h`
                        : `${sisa} hari lagi`}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    gap: 14,
  },
  calendarCard: {
    backgroundColor: '#161311',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#30241B',
    gap: 14,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  monthNavBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  monthNavText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#A89F96',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dayHeaderCell: {
    width: '14.28%',
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A89F96',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleOrange: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  dayBubbleSelectedRing: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A89F96',
  },
  dayTextHighlighted: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dueDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },

  // Ongoing Timeline Section
  ongoingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  ongoingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  ongoingSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#A89F96',
  },
  timelineList: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeCol: {
    width: 52,
    alignItems: 'flex-start',
  },
  timeColDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A89F96',
  },
  timeColMonth: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6E655F',
  },
  timelineDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  timelineLeftLabel: {
    width: 48,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A89F96',
  },
  timelineOrangeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInnerWhiteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  timelineOrangeLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.75,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#1B1815',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#33261D',
    gap: 4,
  },
  timelineCardOrange: {
    backgroundColor: Colors.primary,
    borderColor: '#FF7A29',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  timelineCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineCardSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#A89F96',
  },
  timelineCardSubOrange: {
    color: '#FFE4D1',
  },
  timelineCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  avatarPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  miniBadgeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBadgeCircleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ownerSmallTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D6CCC2',
  },
  timelineRightTime: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  timelineRightTimeOrange: {
    color: '#FFFFFF',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
});
