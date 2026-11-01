import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useSession } from '@/features/auth/SessionProvider';
import {
  cekStatusIzinNotifikasi,
  mintaIzinNotifikasi,
  ujiKirimNotifikasi5Detik,
} from '@/lib/notifications';

export default function PengaturanScreen() {
  const { session } = useSession();

  const userId = session?.user?.id ?? null;
  const userId8 = userId ? userId.slice(0, 8) : '—';

  const [statusIzin, setStatusIzin] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [mengujiNotif, setMengujiNotif] = useState(false);

  const periksaIzin = useCallback(async () => {
    const status = await cekStatusIzinNotifikasi();
    setStatusIzin(status);
  }, []);

  useEffect(() => {
    periksaIzin();
  }, [periksaIzin]);

  const onAktifkanIzin = async () => {
    const hasil = await mintaIzinNotifikasi();
    periksaIzin();
    if (hasil) {
      Alert.alert('Izin Notifikasi', 'Notifikasi berhasil diaktifkan!');
    } else {
      Alert.alert(
        'Izin Notifikasi',
        'Izin belum diberikan. Kamu dapat mengaktifkannya lewat menu Pengaturan perangkat HP-mu.'
      );
    }
  };

  const onTesNotifikasi = async () => {
    setMengujiNotif(true);
    const hasil = await ujiKirimNotifikasi5Detik();
    setMengujiNotif(false);
    periksaIzin();

    Alert.alert(
      hasil.berhasil ? 'Notifikasi Dijadwalkan' : 'Gagal Mengirim',
      hasil.pesan
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.judul}>Pengaturan</Text>

        {/* Section: Pengingat & Notifikasi */}
        <Text style={styles.sectionHeader}>PENGINGAT & NOTIFIKASI</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>Status Izin Notifikasi</Text>
              <Text style={styles.nilai}>
                {statusIzin === 'granted'
                  ? 'Aktif (Diizinkan) ✅'
                  : statusIzin === 'denied'
                  ? 'Nonaktif (Ditolak) ❌'
                  : 'Belum Diatur ⚠️'}
              </Text>
            </View>
            {statusIzin !== 'granted' && (
              <Pressable style={styles.btnMiniIzin} onPress={onAktifkanIzin} accessibilityRole="button">
                <Text style={styles.btnMiniIzinText}>Aktifkan</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={styles.infoPengingat}>
            Pengingat otomatis dijadwalkan pada pukul 09:00 pagi untuk H-30, H-7, H-1, dan Hari H jatuh tempo dokumen.
          </Text>

          <Pressable
            style={[styles.btnTesNotif, mengujiNotif && styles.btnDisabled]}
            onPress={onTesNotifikasi}
            disabled={mengujiNotif}
            accessibilityRole="button"
            accessibilityLabel="Kirim Notifikasi Tes"
          >
            {mengujiNotif ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.btnTesNotifIcon}>🔔</Text>
                <Text style={styles.btnTesNotifText}>Kirim Notifikasi Tes (5 Detik)</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Section: Akun & Keamanan */}
        <Text style={styles.sectionHeader}>AKUN & KEAMANAN</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Status Akun</Text>
          <Text style={styles.nilai}>Anonim (belum ditautkan)</Text>
          <View style={styles.divider} />
          <Text style={styles.label}>User ID (Debug)</Text>
          <Text style={styles.userId}>{userId8}…</Text>
        </View>

        {/* Section: Tentang Aplikasi */}
        <Text style={styles.sectionHeader}>TENTANG APLIKASI</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Aplikasi</Text>
          <Text style={styles.nilai}>INGATIN (Ingatin Pro)</Text>
          <View style={styles.divider} />
          <Text style={styles.label}>Versi</Text>
          <Text style={styles.nilai}>1.0.0 (Roadmap Minggu 3)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 12,
  },
  judul: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  col: {
    gap: 4,
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nilai: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  userId: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  btnMiniIzin: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnMiniIzinText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  infoPengingat: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  btnTesNotif: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnTesNotifIcon: {
    fontSize: 16,
  },
  btnTesNotifText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
