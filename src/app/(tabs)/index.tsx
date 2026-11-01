import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentCard } from '@/components/document-card';
import { Colors } from '@/constants/colors';
import { useItems } from '@/features/items/useItems';

const JUMLAH_TERDEKAT = 5;

export default function BerandaScreen() {
  const router = useRouter();
  const { items, loading, error, refresh } = useItems();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const terdekat = items.filter((i) => i.jatuh_tempo !== null).slice(0, JUMLAH_TERDEKAT);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.judul}>INGATIN</Text>
        <Pressable
          style={styles.tambah}
          onPress={() => router.push('/tambah')}
          accessibilityRole="button"
          accessibilityLabel="Tambah dokumen"
        >
          <Text style={styles.tambahText}>+</Text>
        </Pressable>
      </View>

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
      ) : terdekat.length === 0 ? (
        <View style={styles.tengah}>
          <Text style={styles.kosong}>Belum ada dokumen. Tambahkan dokumen pertamamu.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.daftar}>
          <Text style={styles.subjudul}>Jatuh tempo terdekat</Text>
          {terdekat.map((item) => (
            <DocumentCard key={item.id} item={item} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  judul: { fontSize: 28, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
  tambah: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tambahText: { color: '#FFFFFF', fontSize: 24, fontWeight: '600', lineHeight: 28 },
  tengah: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  kosong: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  error: { fontSize: 15, color: Colors.error, textAlign: 'center', lineHeight: 22 },
  coba: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cobaText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  daftar: { padding: 16, gap: 12 },
  subjudul: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
});
