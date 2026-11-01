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

import { TautkanAkunModal } from '@/components/tautkan-akun-modal';
import { Colors } from '@/constants/colors';
import { hapusAkunDanSeluruhData } from '@/features/auth/authLinking';
import { useSession } from '@/features/auth/SessionProvider';
import {
  cekStatusIzinNotifikasi,
  mintaIzinNotifikasi,
  ujiKirimNotifikasi5Detik,
} from '@/lib/notifications';

export default function PengaturanScreen() {
  const { session } = useSession();

  const user = session?.user;
  const userId = user?.id ?? '';
  const userEmail = user?.email ?? null;
  const isAnonymous = !userEmail;
  const userId8 = userId ? userId.slice(0, 8) : '—';

  const [statusIzin, setStatusIzin] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [mengujiNotif, setMengujiNotif] = useState(false);
  const [modalTautkanVisible, setModalTautkanVisible] = useState(false);
  const [sedangMenghapus, setSedangMenghapus] = useState(false);

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

  const onSalinUserId = () => {
    if (!userId) return;
    Alert.alert(
      'User ID Pengguna',
      `ID Sesi Supabase kamu:\n\n${userId}\n\n(Teks dapat disorot dan disalin)`,
      [{ text: 'Tutup', style: 'cancel' }]
    );
  };

  const onKonfirmasiHapusAkun = () => {
    Alert.alert(
      'Hapus Akun & Seluruh Data?',
      'Tindakan ini akan menghapus semua dokumen, riwayat perpanjangan, serta membatalkan seluruh jadwal notifikasi pengingat di perangkatmu.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lanjutkan',
          style: 'destructive',
          onPress: eksekusiKonfirmasiKedua,
        },
      ]
    );
  };

  const eksekusiKonfirmasiKedua = () => {
    Alert.alert(
      'Konfirmasi Terakhir ⚠️',
      'Data yang sudah dihapus TIDAK DAPAT dipulihkan kembali. Apakah kamu benar-benar yakin ingin melanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Permanen',
          style: 'destructive',
          onPress: prosesHapusAkun,
        },
      ]
    );
  };

  const prosesHapusAkun = async () => {
    if (!userId) return;
    setSedangMenghapus(true);
    try {
      await hapusAkunDanSeluruhData(userId);
      Alert.alert(
        'Data Berhasil Dihapus',
        'Seluruh dokumen dan pengingat telah dibersihkan. Akun kamu telah direset ke sesi baru.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus akun.';
      Alert.alert('Gagal Menghapus Data', msg);
    } finally {
      setSedangMenghapus(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Layar */}
        <View style={styles.headerLayar}>
          <Text style={styles.judul}>Pengaturan</Text>
          <Text style={styles.subjudul}>Kelola akun, preferensi pengingat, dan data aplikasi.</Text>
        </View>

        {/* Section 1: Akun & Keamanan (Stitch Pro Card) */}
        <Text style={styles.sectionHeader}>AKUN & KEAMANAN</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>STATUS AKUN</Text>
              <Text style={styles.nilai}>
                {isAnonymous ? 'Akun Tamu (Anonim)' : 'Akun Terverifikasi'}
              </Text>
            </View>
            <View style={[styles.badge, isAnonymous ? styles.badgeWarning : styles.badgeSuccess]}>
              <Text style={[styles.badgeText, isAnonymous ? styles.badgeWarningText : styles.badgeSuccessText]}>
                {isAnonymous ? 'Belum Tertaut' : 'Tersinkron ✅'}
              </Text>
            </View>
          </View>

          {isAnonymous ? (
            <View style={styles.bannerAmankan}>
              <Text style={styles.bannerIcon}>🛡️</Text>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Amankan Dokumenmu</Text>
                <Text style={styles.bannerText}>
                  Tautkan akun anonim ini ke email agar pengingat dokumen tetap aman jika kamu berganti HP.
                </Text>
                <Pressable
                  style={styles.btnTautkan}
                  onPress={() => setModalTautkanVisible(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnTautkanText}>+ Tautkan Akun Email</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.infoEmailTersambung}>
              <Text style={styles.label}>EMAIL TERTAUT</Text>
              <Text style={styles.nilaiEmail}>{userEmail}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>USER ID (DEBUG)</Text>
              <Text selectable style={styles.userId}>
                {userId8}…
              </Text>
            </View>
            <Pressable style={styles.btnSalinId} onPress={onSalinUserId} accessibilityRole="button">
              <Text style={styles.btnSalinIdText}>Lihat Detail</Text>
            </Pressable>
          </View>
        </View>

        {/* Section 2: Pengingat & Notifikasi */}
        <Text style={styles.sectionHeader}>PENGINGAT & NOTIFIKASI</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>STATUS IZIN NOTIFIKASI</Text>
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

          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>WAKTU PENGINGAT HARIAN</Text>
              <Text style={styles.nilai}>Pukul 09:00 Pagi (Waktu Lokal)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>JADWAL PENGINGAT OTOMATIS</Text>
              <Text style={styles.nilaiSub}>H-30, H-7, H-1, dan Hari H Jatuh Tempo</Text>
            </View>
          </View>

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

        {/* Section 3: Privasi & Keamanan Data */}
        <Text style={styles.sectionHeader}>PRIVASI & KEAMANAN DATA</Text>
        <View style={styles.card}>
          <View style={styles.privacyItem}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <View style={styles.col}>
              <Text style={styles.privacyTitle}>Foto Dokumen Bersifat Lokal</Text>
              <Text style={styles.privacyDesc}>
                Foto fisik KTP, SIM, atau dokumen lainnya tersimpan 100% di penyimpanan internal HP dan tidak diunggah ke server mana pun.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.privacyItem}>
            <Text style={styles.privacyIcon}>🛡️</Text>
            <View style={styles.col}>
              <Text style={styles.privacyTitle}>Row Level Security (RLS)</Text>
              <Text style={styles.privacyDesc}>
                Data metadata pengingat di Supabase hanya dapat diakses oleh sesi unik perangkatmu.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: Tentang Aplikasi */}
        <Text style={styles.sectionHeader}>TENTANG APLIKASI</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>APLIKASI</Text>
            <Text style={styles.nilaiTentang}>INGATIN (Ingatin Pro)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.label}>VERSI</Text>
            <Text style={styles.nilaiTentang}>1.0.0 (Roadmap Minggu 3)</Text>
          </View>
        </View>

        {/* Section 5: Zona Berbahaya */}
        <Text style={[styles.sectionHeader, styles.sectionHeaderDanger]}>ZONA BERBAHAYA</Text>
        <View style={[styles.card, styles.cardDanger]}>
          <Text style={styles.dangerTitle}>Hapus Akun & Seluruh Data</Text>
          <Text style={styles.dangerDesc}>
            Menghapus permanen seluruh dokumen, riwayat perpanjangan, serta membatalkan alarm lokal. Akun akan kembali ke kondisi awal yang bersih.
          </Text>

          <Pressable
            style={[styles.btnHapusData, sedangMenghapus && styles.btnDisabled]}
            onPress={onKonfirmasiHapusAkun}
            disabled={sedangMenghapus}
            accessibilityRole="button"
            accessibilityLabel="Hapus Akun dan Seluruh Data"
          >
            {sedangMenghapus ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.btnHapusIcon}>🗑️</Text>
                <Text style={styles.btnHapusText}>Hapus Akun & Seluruh Data</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal Tautkan Akun */}
      <TautkanAkunModal
        visible={modalTautkanVisible}
        onTutup={() => setModalTautkanVisible(false)}
        onBerhasil={(email) => {
          setModalTautkanVisible(false);
          Alert.alert(
            'Berhasil Ditautkan!',
            `Akunmu telah berhasil ditautkan ke alamat email:\n${email}`
          );
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 150,
    gap: 12,
  },
  headerLayar: {
    marginBottom: 4,
  },
  judul: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.6,
  },
  subjudul: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 12,
    marginLeft: 4,
  },
  sectionHeaderDanger: {
    color: '#DC2626',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F8',
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
    letterSpacing: 0.5,
  },
  nilai: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  nilaiSub: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  nilaiEmail: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '700',
  },
  nilaiTentang: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  userId: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bannerAmankan: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  bannerIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  bannerContent: {
    flex: 1,
    gap: 6,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3730A3',
  },
  bannerText: {
    fontSize: 12,
    color: '#4338CA',
    lineHeight: 17,
  },
  btnTautkan: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  btnTautkanText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  infoEmailTersambung: {
    gap: 4,
  },
  btnSalinId: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnSalinIdText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
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
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  privacyIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  privacyDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B91C1C',
  },
  dangerDesc: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  btnHapusData: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  btnHapusIcon: {
    fontSize: 16,
  },
  btnHapusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
