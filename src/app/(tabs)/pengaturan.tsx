import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/features/auth/SessionProvider';
import { Colors } from '@/constants/colors';

export default function PengaturanScreen() {
  const { session } = useSession();

  const userId = session?.user?.id ?? null;
  const userId8 = userId ? userId.slice(0, 8) : '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.judul}>Pengaturan</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Status akun</Text>
          <Text style={styles.nilai}>Anonim (belum ditautkan)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>User ID (debug)</Text>
          <Text style={styles.userId}>{userId8}…</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  judul: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nilai: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  userId: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});

