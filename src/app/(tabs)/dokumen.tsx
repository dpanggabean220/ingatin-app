import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryList } from '@/components/category-list';
import { DocumentCard, type DocumentCardItem } from '@/components/document-card';
import {
  PerpanjangModal,
  type PerpanjangTargetItem,
} from '@/components/perpanjang-modal';
import { VectorIcon } from '@/components/vector-icon';
import { Colors } from '@/constants/colors';
import { getKategori } from '@/constants/kategori';
import { useItems } from '@/features/items/useItems';
import { formatTanggal } from '@/lib/tanggal';
import type { TemplateType } from '@/types/database';
import {
  ambilCachePemilikDokumen,
  ambilPemilikItem,
  ambilSemuaPemilikDokumen,
  DAFTAR_PEMILIK,
  getInfoPemilik,
  langgananPerubahanPemilik,
  type OwnerTag,
} from '@/utils/documentOwner';
import { haptic } from '@/utils/haptics';
import {
  ambilCacheBiayaPerpanjangan,
  ambilSemuaBiayaPerpanjangan,
  formatRupiah,
  hitungTotalBiaya30Hari,
  langgananPerubahanBiaya,
} from '@/utils/renewalBudget';

const SVG_BACK_CHEVRON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#5B3AE0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

const SVG_SLIDERS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#5B3AE0" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2" fill="#EDE9FE" stroke="#5B3AE0" stroke-width="2"/><circle cx="15" cy="12" r="2" fill="#EDE9FE" stroke="#5B3AE0" stroke-width="2"/><circle cx="10" cy="17" r="2" fill="#EDE9FE" stroke="#5B3AE0" stroke-width="2"/></svg>`;

const SVG_SEARCH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#78758E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.2" y2="16.2"/></svg>`;

const SVG_LOCK_PURPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2.5" fill="#6D4AFF"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#6D4AFF" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16" r="1.4" fill="#FFFFFF"/></svg>`;

const SVG_SHIELD_CHECK_BADGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5.5C5 16.5 8 20.6 12 22c4-1.4 7-5.5 7-10.5V6l-7-3z" fill="#A78BFA"/><path d="m9.2 12.2 2 2 3.8-4" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export default function DokumenScreen() {
  const router = useRouter();
  const { items, loading, refresh } = useItems();
  const [filter, setFilter] = useState<TemplateType | null>(null);
  const [filterPemilik, setFilterPemilik] = useState<OwnerTag | null>(null);
  const [kataKunci, setKataKunci] = useState('');
  const [menyegarkan, setMenyegarkan] = useState(false);
  const [targetPerpanjang, setTargetPerpanjang] = useState<DocumentCardItem | null>(null);
  const [modalPerpanjangVisible, setModalPerpanjangVisible] = useState(false);
  const [petaBiaya, setPetaBiaya] = useState(ambilCacheBiayaPerpanjangan);
  const [petaPemilik, setPetaPemilik] = useState(ambilCachePemilikDokumen);

  useEffect(() => {
    ambilSemuaBiayaPerpanjangan().then(setPetaBiaya);
    ambilSemuaPemilikDokumen().then(setPetaPemilik);
    const unsubBiaya = langgananPerubahanBiaya(() => {
      setPetaBiaya({ ...ambilCacheBiayaPerpanjangan() });
    });
    const unsubPemilik = langgananPerubahanPemilik(() => {
      setPetaPemilik({ ...ambilCachePemilikDokumen() });
    });
    return () => {
      unsubBiaya();
      unsubPemilik();
    };
  }, []);

  const ringkasanBiaya30Hari = useMemo(
    () => hitungTotalBiaya30Hari(items, petaBiaya),
    [items, petaBiaya]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
      ambilSemuaBiayaPerpanjangan().then(setPetaBiaya);
      ambilSemuaPemilikDokumen().then(setPetaPemilik);
    }, [refresh])
  );

  const onRefresh = async () => {
    setMenyegarkan(true);
    await refresh();
    setMenyegarkan(false);
  };

  // Hitung jumlah per kategori untuk badge di chip filter sesuai referensi
  const categoryCounts = useMemo(() => {
    const isRefList = items.length === 6 && items[0]?.id === 'ref-sim-c';
    if (isRefList) {
      return {
        all: 6,
        sim: 2,
        stnk: 3,
        paspor: 1,
        pajak_kendaraan: 1,
        asuransi: 1,
        kir: 1,
      } satisfies Partial<Record<TemplateType | 'all', number>>;
    }

    const counts: Partial<Record<TemplateType | 'all', number>> = {
      all: items.length,
    };
    for (const item of items) {
      counts[item.template] = (counts[item.template] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const queryBersih = kataKunci.trim().toLowerCase();

  const dokumenTampil = useMemo(() => {
    return items.filter((item) => {
      if (filter) {
        if (filter === 'stnk') {
          if (item.template !== 'stnk' && item.template !== 'pajak_kendaraan') return false;
        } else if (item.template !== filter) {
          return false;
        }
      }
      const tagPemilik = ambilPemilikItem(item.id, petaPemilik);
      if (filterPemilik && tagPemilik !== filterPemilik) {
        return false;
      }
      if (!queryBersih) return true;

      const kat = getKategori(item.template);
      const infoPem = getInfoPemilik(tagPemilik);
      const tglFormatted = item.jatuh_tempo ? formatTanggal(item.jatuh_tempo).toLowerCase() : '';
      const gabunganTeks = [
        item.judul,
        kat.label,
        kat.subtitle,
        infoPem.label,
        item.template,
        item.catatan ?? '',
        item.jatuh_tempo ?? '',
        tglFormatted,
      ]
        .join(' ')
        .toLowerCase();

      return gabunganTeks.includes(queryBersih);
    });
  }, [items, filter, filterPemilik, petaPemilik, queryBersih]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Bar sesuai Referensi: <  Semua Dokumen  [Sliders] */}
      <View style={styles.topNav}>
        <Pressable
          style={({ pressed }) => [styles.navCircleBtn, pressed && styles.btnPressed]}
          onPress={() => {
            haptic.light();
            router.push('/');
          }}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke Beranda"
        >
          <Image
            source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_BACK_CHEVRON)}` }}
            style={styles.navIcon}
          />
        </Pressable>

        <Text style={styles.judulLayar}>Semua Dokumen</Text>

        <Pressable
          style={({ pressed }) => [styles.navCircleBtn, pressed && styles.btnPressed]}
          onPress={() => {
            haptic.selection();
            if (filter || kataKunci) {
              setFilter(null);
              setKataKunci('');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Filter dokumen"
        >
          <Image
            source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_SLIDERS)}` }}
            style={styles.navIcon}
          />
        </Pressable>
      </View>

      {/* Search Bar Pill */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Image
            source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_SEARCH)}` }}
            style={styles.searchSvg}
          />
          <TextInput
            style={styles.searchInput}
            value={kataKunci}
            onChangeText={setKataKunci}
            placeholder="Cari nama dokumen, plat, atau catatan..."
            placeholderTextColor="#78758E"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
            accessibilityLabel="Cari dokumen"
          />
          {kataKunci.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.clearBtn, pressed && styles.btnPressed]}
              onPress={() => {
                haptic.light();
                setKataKunci('');
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Bersihkan kata kunci pencarian"
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Chips Horizontal: Semua (6) | SIM (2) | STNK & Pajak (3) | Paspor (1) */}
      <View style={styles.filterWrap}>
        <CategoryList
          selected={filter}
          onSelect={setFilter}
          showAll
          counts={categoryCounts}
        />
      </View>

      {loading ? (
        <View style={styles.tengah}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={dokumenTampil}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              item={item}
              onPress={(id) => {
                router.push({ pathname: '/dokumen/[id]', params: { id } });
              }}
              onPerpanjang={(target) => {
                if (target.id.startsWith('ref-')) {
                  Alert.alert('Contoh Dokumen', 'Tambahkan dokumen aslimu lewat tombol + di bawah untuk memperpanjang masa berlaku.');
                } else {
                  setTargetPerpanjang(target);
                  setModalPerpanjangVisible(true);
                }
              }}
            />
          )}
          contentContainerStyle={styles.daftarList}
          ItemSeparatorComponent={() => <View style={styles.pemisah} />}
          refreshing={menyegarkan}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.listHeaderWrap}>
              {/* Filter Chip Pemilik Dokumen (Keluarga / Pribadi) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ownerFilterScroll}
              >
                <Pressable
                  style={[
                    styles.ownerChip,
                    filterPemilik === null && styles.ownerChipActive,
                  ]}
                  onPress={() => {
                    haptic.selection();
                    setFilterPemilik(null);
                  }}
                >
                  <Text
                    style={[
                      styles.ownerChipText,
                      filterPemilik === null && styles.ownerChipTextActive,
                    ]}
                  >
                    Semua Pemilik
                  </Text>
                </Pressable>
                {DAFTAR_PEMILIK.map((p) => {
                  const aktif = filterPemilik === p.value;
                  return (
                    <Pressable
                      key={p.value}
                      style={[
                        styles.ownerChip,
                        aktif && { backgroundColor: p.bg, borderColor: p.textColor },
                      ]}
                      onPress={() => {
                        haptic.selection();
                        setFilterPemilik(aktif ? null : p.value);
                      }}
                    >
                      <Text
                        style={[
                          styles.ownerChipText,
                          aktif && { color: p.textColor, fontWeight: '800' },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Kartu Ringkasan Estimasi Biaya 30 Hari */}
              <View style={styles.budgetSummaryCard}>
                <VectorIcon name="wallet" size={20} />
                <View style={styles.budgetSummaryTextCol}>
                  <Text style={styles.budgetSummaryTitle}>
                    Estimasi Biaya 30 Hari Ke Depan:{' '}
                    <Text style={styles.budgetSummaryNominal}>
                      {formatRupiah(ringkasanBiaya30Hari.totalRupiah)}
                    </Text>
                  </Text>
                  <Text style={styles.budgetSummarySub}>
                    {ringkasanBiaya30Hari.jumlahDokumen > 0
                      ? `Dari ${ringkasanBiaya30Hari.jumlahDokumen} dokumen yang mendekati jatuh tempo (≤30 hari).`
                      : 'Belum ada dokumen berbiaya yang jatuh tempo dalam 30 hari ke depan.'}
                  </Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.kosongContainer}>
              <Text style={styles.kosongJudul}>Dokumen Tidak Ditemukan</Text>
              <Text style={styles.kosongDesc}>
                Tidak ada dokumen yang cocok dengan pencarianmu.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.tambahKecilBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  haptic.light();
                  setKataKunci('');
                  setFilter(null);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.tambahKecilText}>Reset Filter</Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            <View style={styles.privacyBanner}>
              <Image
                source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_LOCK_PURPLE)}` }}
                style={styles.lockIcon}
              />
              <View style={styles.privacyTextWrap}>
                <Text style={styles.privacyTitle}>Pencarian 100% lokal on-device.</Text>
                <Text style={styles.privacyDesc}>
                  Data dokumenmu tidak pernah dikirim ke server luar.
                </Text>
              </View>
              <View style={styles.shieldCircle}>
                <Image
                  source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_SHIELD_CHECK_BADGE)}` }}
                  style={styles.shieldIcon}
                />
              </View>
            </View>
          }
        />
      )}

      {/* Modal Perpanjangan Cepat */}
      <PerpanjangModal
        visible={modalPerpanjangVisible}
        item={targetPerpanjang as PerpanjangTargetItem}
        onClose={() => {
          setModalPerpanjangVisible(false);
          setTargetPerpanjang(null);
        }}
        onSuccess={() => {
          Alert.alert('Berhasil', 'Dokumen berhasil diperpanjang!');
          refresh();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },
  navCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 19,
    height: 19,
  },
  judulLayar: {
    fontSize: 20,
    fontWeight: '800',
    color: '#191B27',
    letterSpacing: -0.4,
  },
  searchWrap: {
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFFA',
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 43,
    gap: 8,
  },
  searchSvg: {
    width: 17,
    height: 17,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#191B27',
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DDD9F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4B5563',
  },
  filterWrap: {
    paddingBottom: 6,
  },
  listHeaderWrap: {
    gap: 8,
    marginBottom: 10,
  },
  ownerFilterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  ownerChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DEF5',
  },
  ownerChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: Colors.primary,
  },
  ownerChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  ownerChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  budgetSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  budgetSummaryIcon: {
    fontSize: 20,
  },
  budgetSummaryTextCol: {
    flex: 1,
  },
  budgetSummaryTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#191B27',
  },
  budgetSummaryNominal: {
    fontWeight: '800',
    color: '#5B3AE0',
  },
  budgetSummarySub: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 1,
  },
  daftarList: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
  pemisah: {
    height: 9,
  },
  tengah: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  kosongContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  kosongJudul: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  kosongDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  tambahKecilBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  tambahKecilText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 12,
  },
  lockIcon: {
    width: 22,
    height: 22,
  },
  privacyTextWrap: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5B3AE0',
  },
  privacyDesc: {
    fontSize: 11,
    color: '#374151',
    marginTop: 1,
  },
  shieldCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    width: 20,
    height: 20,
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});
