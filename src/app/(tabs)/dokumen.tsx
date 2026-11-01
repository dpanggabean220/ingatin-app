import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryList } from '@/components/category-list';
import { DocumentCard } from '@/components/document-card';
import { Colors } from '@/constants/colors';
import { getKategori } from '@/constants/kategori';
import { useItems } from '@/features/items/useItems';
import { formatTanggal } from '@/lib/tanggal';
import type { TemplateType } from '@/types/database';
import { haptic } from '@/utils/haptics';

export default function DokumenScreen() {
  const router = useRouter();
  const { items, loading, error, refresh } = useItems();
  const [filter, setFilter] = useState<TemplateType | null>(null);
  const [kataKunci, setKataKunci] = useState('');
  const [menyegarkan, setMenyegarkan] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = async () => {
    setMenyegarkan(true);
    await refresh();
    setMenyegarkan(false);
  };

  // Hitung jumlah per kategori untuk badge di chip filter
  const categoryCounts = useMemo(() => {
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
      if (filter && item.template !== filter) return false;
      if (!queryBersih) return true;

      const kat = getKategori(item.template);
      const tglFormatted = item.jatuh_tempo ? formatTanggal(item.jatuh_tempo).toLowerCase() : '';
      const gabunganTeks = [
        item.judul,
        kat.label,
        kat.subtitle,
        item.template,
        item.catatan ?? '',
        item.jatuh_tempo ?? '',
        tglFormatted,
      ]
        .join(' ')
        .toLowerCase();

      return gabunganTeks.includes(queryBersih);
    });
  }, [items, filter, queryBersih]);

  const sedangMemfilter = filter !== null || queryBersih.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Context */}
      <View style={styles.headerContext}>
        <View style={styles.titleRow}>
          <Text style={styles.judulLayar}>Semua Dokumen</Text>
          <View style={styles.badgeAktif}>
            <Text style={styles.badgeAktifText}>{items.length} Aktif</Text>
          </View>
        </View>
        <Text style={styles.subjudul}>
          Total {items.length} dokumen tersimpan dalam pantauan
        </Text>
      </View>

      {/* Smart Search Bar (Di atas chip filter kategori) */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={kataKunci}
            onChangeText={setKataKunci}
            placeholder="Cari nama dokumen, nomor plat, atau catatan..."
            placeholderTextColor="#6B7280"
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

      {/* Filter Chips Horizontal */}
      <View style={styles.filterWrap}>
        <CategoryList
          selected={filter}
          onSelect={setFilter}
          showAll
          counts={categoryCounts}
        />
      </View>

      {/* Label Jumlah Hasil Filter */}
      {!loading && !error && (
        <View style={styles.resultMetaRow}>
          <Text style={styles.resultMetaText}>
            MENAMPILKAN {dokumenTampil.length} DOKUMEN
            {sedangMemfilter && items.length > 0 ? ` (DARI ${items.length})` : ''}
          </Text>
          {sedangMemfilter && (
            <Pressable
              onPress={() => {
                haptic.selection();
                setKataKunci('');
                setFilter(null);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.resetFilterText}>Reset Filter</Text>
            </Pressable>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.tengah}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.tengah}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.cobaButton} onPress={refresh} accessibilityRole="button">
            <Text style={styles.cobaButtonText}>Coba lagi</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={dokumenTampil}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              item={item}
              compact
              onPress={(id) =>
                router.push({ pathname: '/dokumen/[id]', params: { id } })
              }
            />
          )}
          contentContainerStyle={styles.daftarList}
          ItemSeparatorComponent={() => <View style={styles.pemisah} />}
          refreshing={menyegarkan}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            queryBersih.length > 0 ? (
              <View style={styles.kosongContainer}>
                <View style={styles.kosongIconWrap}>
                  <Text style={styles.kosongEmoji}>🔎</Text>
                </View>
                <Text style={styles.kosongJudul}>Dokumen Tidak Ditemukan</Text>
                <Text style={styles.kosongDesc}>
                  Tidak ada dokumen yang cocok dengan kata kunci{' '}
                  <Text style={styles.boldText}>{`"${kataKunci.trim()}"`}</Text>
                  {filter ? ` pada kategori ${getKategori(filter).label}` : ''}.
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
                  <Text style={styles.tambahKecilText}>Reset Pencarian</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.kosongContainer}>
                <View style={styles.kosongIconWrap}>
                  <Text style={styles.kosongEmoji}>📂</Text>
                </View>
                <Text style={styles.kosongJudul}>
                  {filter ? 'Kategori Ini Masih Kosong' : 'Belum Ada Dokumen'}
                </Text>
                <Text style={styles.kosongDesc}>
                  {filter
                    ? 'Belum ada dokumen yang disimpan dalam kategori ini.'
                    : 'Tambahkan dokumen pertamamu agar pengingat aktif.'}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.tambahKecilBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    haptic.medium();
                    if (filter) {
                      router.push({ pathname: '/tambah', params: { template: filter } });
                    } else {
                      router.push('/tambah');
                    }
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.tambahKecilText}>+ Tambah Dokumen</Text>
                </Pressable>
              </View>
            )
          }
          ListFooterComponent={
            <View style={styles.privacyInfoCard}>
              <View style={styles.privacyIconCircle}>
                <Text style={styles.privacyIcon}>🔒</Text>
              </View>
              <View style={styles.privacyTextWrap}>
                <Text style={styles.privacyTitle}>Pencarian 100% lokal on-device</Text>
                <Text style={styles.privacyDesc}>
                  Kata kunci dan catatan dokumenmu difilter langsung di memori HP tanpa dikirim ke server eksternal.
                </Text>
              </View>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  headerContext: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  judulLayar: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  badgeAktif: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeAktifText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  subjudul: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 11,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  filterWrap: {
    paddingBottom: 4,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 6,
  },
  resultMetaText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  daftarList: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 130,
    flexGrow: 1,
  },
  pemisah: {
    height: 10,
  },
  tengah: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.critical,
    textAlign: 'center',
    marginBottom: 12,
  },
  cobaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cobaButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  kosongContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  kosongIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kosongEmoji: {
    fontSize: 28,
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
    lineHeight: 18,
    marginBottom: 16,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tambahKecilBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tambahKecilText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  privacyInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyIcon: {
    fontSize: 16,
  },
  privacyTextWrap: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  privacyDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});
