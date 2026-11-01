import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryList } from '@/components/category-list';
import { DocumentCard } from '@/components/document-card';
import { Colors } from '@/constants/colors';
import { useItems } from '@/features/items/useItems';
import { haptic } from '@/utils/haptics';
import type { TemplateType } from '@/types/database';

export default function DokumenScreen() {
  const router = useRouter();
  const { items, loading, error, refresh } = useItems();
  const [filter, setFilter] = useState<TemplateType | null>(null);
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

  const dokumenTampil = filter ? items.filter((i) => i.template === filter) : items;

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

      {/* Filter Chips Horizontal */}
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
          ListEmptyComponent={
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
    paddingBottom: 8,
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
  filterWrap: {
    paddingBottom: 6,
  },
  daftarList: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
    paddingVertical: 48,
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
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});
