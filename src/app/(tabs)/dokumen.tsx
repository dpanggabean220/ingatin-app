import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryList } from '@/components/category-list';
import { DocumentCard } from '@/components/document-card';
import { Colors } from '@/constants/colors';
import { useItems } from '@/features/items/useItems';
import type { TemplateType } from '@/types/database';

export default function DokumenScreen() {
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

  const tampil = filter ? items.filter((i) => i.template === filter) : items;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.judul}>Semua Dokumen</Text>
      <CategoryList selected={filter} onSelect={setFilter} showAll />

      {loading ? (
        <View style={styles.tengah}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.tengah}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.coba} onPress={refresh} accessibilityRole="button">
            <Text style={styles.cobaText}>Coba lagi</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={tampil}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DocumentCard item={item} />}
          contentContainerStyle={styles.daftar}
          ItemSeparatorComponent={() => <View style={styles.pemisah} />}
          refreshing={menyegarkan}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <Text style={styles.kosong}>
              {filter
                ? 'Belum ada dokumen di kategori ini.'
                : 'Belum ada dokumen. Tambahkan dokumen pertamamu.'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  judul: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tengah: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  error: { fontSize: 15, color: Colors.error, textAlign: 'center', lineHeight: 22 },
  coba: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cobaText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  daftar: { padding: 16, flexGrow: 1 },
  pemisah: { height: 12 },
  kosong: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 48,
  },
});
