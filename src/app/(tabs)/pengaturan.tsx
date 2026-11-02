import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TautkanAkunModal } from '@/components/tautkan-akun-modal';
import { VectorIcon } from '@/components/vector-icon';
import { Colors } from '@/constants/colors';
import { hapusAkunDanSeluruhData } from '@/features/auth/authLinking';
import { useSession } from '@/features/auth/SessionProvider';
import {
  cekStatusIzinNotifikasi,
  mintaIzinNotifikasi,
  ujiKirimNotifikasi5Detik,
} from '@/lib/notifications';
import type { Item } from '@/types/database';
import { eksporDataPengguna, imporDataPengguna } from '@/utils/backupRestore';
import {
  ambilStatusKunciBiometrik,
  aturStatusKunciBiometrik,
  cekDukunganBiometrik,
  verifikasiBiometrik,
} from '@/utils/biometricLock';
import { haptic } from '@/utils/haptics';
import { ambilItemsOfflineFirst } from '@/utils/offlineStore';
import {
  ambilProfilPengguna,
  simpanProfilPengguna,
} from '@/utils/userProfile';
import { sinkronkanDataWidget } from '@/utils/widgetSync';

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
  const [sedangEkspor, setSedangEkspor] = useState(false);
  const [sedangImpor, setSedangImpor] = useState(false);
  const [sedangSinkronWidget, setSedangSinkronWidget] = useState(false);
  const [kunciBiometrik, setKunciBiometrik] = useState(false);
  const [namaBiometrik, setNamaBiometrik] = useState('Face ID / Biometrik');
  const [namaPanggilan, setNamaPanggilan] = useState('David');
  const [tampilkanDataContoh, setTampilkanDataContoh] = useState(true);

  const periksaIzin = useCallback(async () => {
    const [status, statusBio, infoBio, profil] = await Promise.all([
      cekStatusIzinNotifikasi(),
      ambilStatusKunciBiometrik(),
      cekDukunganBiometrik(),
      ambilProfilPengguna(),
    ]);
    setStatusIzin(status);
    setKunciBiometrik(statusBio);
    setNamaBiometrik(infoBio.namaMetode);
    setNamaPanggilan(profil.namaPanggilan);
    setTampilkanDataContoh(profil.tampilkanDataContoh);
  }, []);

  useEffect(() => {
    periksaIzin();
  }, [periksaIzin]);

  const onToggleBiometrik = async (nilaiBaru: boolean) => {
    haptic.light();
    const res = await verifikasiBiometrik(
      nilaiBaru
        ? `Verifikasi ${namaBiometrik} untuk mengaktifkan kunci aplikasi`
        : `Verifikasi ${namaBiometrik} untuk menonaktifkan kunci aplikasi`
    );
    if (!res.berhasil) {
      haptic.warning();
      if (res.pesan && res.pesan !== 'Verifikasi dibatalkan.') {
        Alert.alert('Gagal Mengubah Kunci Biometrik', res.pesan);
      }
      return;
    }

    await aturStatusKunciBiometrik(nilaiBaru);
    setKunciBiometrik(nilaiBaru);
    haptic.success();
    if (res.pesan) {
      Alert.alert(
        nilaiBaru ? 'Kunci Biometrik Aktif 🔒' : 'Kunci Biometrik Nonaktif',
        res.pesan
      );
    }
  };

  const onAktifkanIzin = async () => {
    haptic.medium();
    const hasil = await mintaIzinNotifikasi();
    periksaIzin();
    if (hasil) {
      haptic.success();
      Alert.alert('Izin Notifikasi', 'Notifikasi berhasil diaktifkan!');
    } else {
      haptic.warning();
      Alert.alert(
        'Izin Notifikasi',
        'Izin belum diberikan. Kamu dapat mengaktifkannya lewat menu Pengaturan perangkat HP-mu.'
      );
    }
  };

  const onTesNotifikasi = async () => {
    haptic.medium();
    setMengujiNotif(true);
    const hasil = await ujiKirimNotifikasi5Detik();
    setMengujiNotif(false);
    periksaIzin();

    if (hasil.berhasil) {
      haptic.success();
    } else {
      haptic.error();
    }

    Alert.alert(
      hasil.berhasil ? 'Notifikasi Dijadwalkan' : 'Gagal Mengirim',
      hasil.pesan
    );
  };

  const onSalinUserId = () => {
    if (!userId) return;
    haptic.selection();
    Alert.alert(
      'User ID Pengguna',
      `ID Sesi Supabase kamu:\n\n${userId}\n\n(Teks dapat disorot dan disalin)`,
      [{ text: 'Tutup', style: 'cancel' }]
    );
  };

  const onEksporData = async () => {
    haptic.medium();
    setSedangEkspor(true);
    try {
      const hasil = await eksporDataPengguna(userId || 'local');
      haptic.success();
      Alert.alert(
        'Ekspor Berhasil! 🎉',
        `${hasil.pesan}\n\nFile cadangan JSON siap disimpan ke Files, iCloud Drive, atau dibagikan.`
      );
    } catch (err) {
      haptic.error();
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengekspor data.';
      Alert.alert('Gagal Ekspor Data', msg);
    } finally {
      setSedangEkspor(false);
    }
  };

  const onKonfirmasiImporData = () => {
    haptic.medium();
    Alert.alert(
      'Pulihkan Data Dokumen?',
      'Aplikasi akan membaca file cadangan (.json) pilihanmu dan memulihkan seluruh dokumen ke perangkat ini.',
      [
        {
          text: 'Batal',
          style: 'cancel',
          onPress: () => haptic.light(),
        },
        {
          text: 'Pilih File JSON',
          onPress: prosesImporData,
        },
      ]
    );
  };

  const prosesImporData = async () => {
    setSedangImpor(true);
    try {
      const hasil = await imporDataPengguna(userId || 'local');
      if (hasil.dibatalkan) {
        haptic.light();
        return;
      }
      haptic.success();
      Alert.alert(
        'Pemulihan Berhasil! 🎉',
        `${hasil.pesan}\n\nJadwal pengingat otomatis telah diaktifkan kembali di perangkatmu.`
      );
    } catch (err) {
      haptic.error();
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memulihkan file.';
      Alert.alert('Gagal Memulihkan Data', msg);
    } finally {
      setSedangImpor(false);
    }
  };

  const onSinkronkanWidget = async () => {
    haptic.medium();
    setSedangSinkronWidget(true);
    try {
      const items = await ambilItemsOfflineFirst();
      const hasil = await sinkronkanDataWidget(items as Item[]);
      haptic.success();
      Alert.alert(
        'Widget Disinkronkan ✨',
        hasil
          ? 'Snapshot dokumen terbaru berhasil dikirim ke widget layar utama.'
          : 'Data telah disimpan ke cache lokal. Pada Expo Go, widget native berjalan dalam mode simulasi.'
      );
    } catch (err) {
      haptic.error();
      const msg = err instanceof Error ? err.message : 'Gagal menyinkronkan data widget.';
      Alert.alert('Gagal Sinkronisasi', msg);
    } finally {
      setSedangSinkronWidget(false);
    }
  };

  const onKonfirmasiHapusAkun = () => {
    haptic.warning();
    Alert.alert(
      'Hapus Akun & Seluruh Data?',
      'Tindakan ini akan menghapus semua dokumen, riwayat perpanjangan, serta membatalkan seluruh jadwal notifikasi pengingat di perangkatmu.',
      [
        {
          text: 'Batal',
          style: 'cancel',
          onPress: () => haptic.light(),
        },
        {
          text: 'Lanjutkan',
          style: 'destructive',
          onPress: eksekusiKonfirmasiKedua,
        },
      ]
    );
  };

  const eksekusiKonfirmasiKedua = () => {
    haptic.warning();
    Alert.alert(
      'Konfirmasi Terakhir ⚠️',
      'Data yang sudah dihapus TIDAK DAPAT dipulihkan kembali. Apakah kamu benar-benar yakin ingin melanjutkan?',
      [
        {
          text: 'Batal',
          style: 'cancel',
          onPress: () => haptic.light(),
        },
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
    haptic.error();
    setSedangMenghapus(true);
    try {
      await hapusAkunDanSeluruhData(userId);
      haptic.success();
      Alert.alert(
        'Data Berhasil Dihapus',
        'Seluruh dokumen dan pengingat telah dibersihkan. Akun kamu telah direset ke sesi baru.'
      );
    } catch (err) {
      haptic.error();
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
          {/* Nama Panggilan Pengguna (Dinamis di Beranda) */}
          <View style={styles.col}>
            <Text style={styles.label}>NAMA PANGGILAN DI BERANDA</Text>
            <View style={styles.namaInputRow}>
              <TextInput
                style={styles.namaInput}
                value={namaPanggilan}
                onChangeText={setNamaPanggilan}
                onBlur={() => {
                  simpanProfilPengguna({ namaPanggilan });
                }}
                onSubmitEditing={() => {
                  haptic.success();
                  simpanProfilPengguna({ namaPanggilan });
                }}
                placeholder="Nama panggilanmu..."
                placeholderTextColor="#94A3B8"
                returnKeyType="done"
                maxLength={25}
              />
              <Pressable
                style={({ pressed }) => [styles.btnSalinId, pressed && styles.btnPressed]}
                onPress={() => {
                  haptic.success();
                  simpanProfilPengguna({ namaPanggilan });
                  Alert.alert('Tersimpan', `Sapaan Beranda diperbarui menjadi "Halo, ${namaPanggilan.trim() || 'Pengguna'} 👋"`);
                }}
              >
                <Text style={styles.btnSalinIdText}>Simpan</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Opsi Data Contoh Referensi */}
          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>MODE PRATINJAU (DATA CONTOH)</Text>
              <Text style={styles.nilaiSub}>
                Tampilkan contoh dokumen saat daftar masih kosong
              </Text>
            </View>
            <Switch
              value={tampilkanDataContoh}
              onValueChange={async (val) => {
                haptic.selection();
                setTampilkanDataContoh(val);
                await simpanProfilPengguna({ tampilkanDataContoh: val });
              }}
              trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>STATUS AKUN (OFFLINE-FIRST)</Text>
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
              <VectorIcon name="shield" size={24} style={{ marginTop: 2 }} />
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Amankan Dokumenmu</Text>
                <Text style={styles.bannerText}>
                  Tautkan akun anonim ini ke email agar pengingat dokumen tetap aman jika kamu berganti HP.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.btnTautkan, pressed && styles.btnPressed]}
                  onPress={() => {
                    haptic.light();
                    setModalTautkanVisible(true);
                  }}
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

          {/* Pengaturan Kunci Aplikasi dengan Face ID / Biometrik */}
          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>KEAMANAN BIOMETRIK</Text>
              <Text style={styles.nilai}>
                Kunci Aplikasi dengan Face ID / Biometrik
              </Text>
              <Text style={styles.biometrikSub}>
                Lindungi akses aplikasi dan sensor nomor dokumen dengan {namaBiometrik}.
              </Text>
            </View>
            <Switch
              value={kunciBiometrik}
              onValueChange={onToggleBiometrik}
              trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Kunci Aplikasi dengan Face ID atau Biometrik"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={styles.col}>
              <Text style={styles.label}>USER ID (DEBUG)</Text>
              <Text selectable style={styles.userId}>
                {userId8}…
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.btnSalinId, pressed && styles.btnPressed]}
              onPress={onSalinUserId}
              accessibilityRole="button"
            >
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
              <Pressable
                style={({ pressed }) => [styles.btnMiniIzin, pressed && styles.btnPressed]}
                onPress={onAktifkanIzin}
                accessibilityRole="button"
              >
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
            style={({ pressed }) => [
              styles.btnTesNotif,
              mengujiNotif && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={onTesNotifikasi}
            disabled={mengujiNotif}
            accessibilityRole="button"
            accessibilityLabel="Kirim Notifikasi Tes"
          >
            {mengujiNotif ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <VectorIcon name="bell" size={16} />
                <Text style={styles.btnTesNotifText}>Kirim Notifikasi Tes (5 Detik)</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Section: Widget Layar Utama */}
        <Text style={styles.sectionHeader}>WIDGET LAYAR UTAMA (HOMESCREEN)</Text>
        <View style={styles.card}>
          <View style={styles.backupHeader}>
            <VectorIcon name="widget" size={22} style={{ marginTop: 2 }} />
            <View style={styles.col}>
              <Text style={styles.backupHeaderTitle}>Pantau Status dari Layar Depan</Text>
              <Text style={styles.backupHeaderDesc}>
                Tampilkan sisa hari dan status dokumen terdekat langsung di homescreen HP dengan warna tema Royal Purple (#6D4AFF) dan badge status dinamis.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.widgetPetunjuk}>
            <Text style={styles.widgetPetunjukText}>
              <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>Cara Pasang di iPhone:</Text> Sentuh & tahan latar layar utama HP hingga ikon bergoyang → ketuk tombol <Text style={{ fontWeight: '700', color: Colors.primary }}>+</Text> di pojok atas → cari & pilih <Text style={{ fontWeight: '700', color: Colors.primary }}>INGATIN</Text>.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.btnImpor,
              sedangSinkronWidget && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={onSinkronkanWidget}
            disabled={sedangSinkronWidget}
            accessibilityRole="button"
            accessibilityLabel="Perbarui Data Widget Sekarang"
          >
            {sedangSinkronWidget ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <VectorIcon name="refresh" size={16} />
                <Text style={styles.btnImporText}>Perbarui Data Widget Sekarang</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Section: Cadangan & Pemulihan Data */}
        <Text style={styles.sectionHeader}>CADANGAN & PEMULIHAN DATA</Text>
        <View style={styles.card}>
          <View style={styles.backupHeader}>
            <VectorIcon name="checklist" size={22} style={{ marginTop: 2 }} />
            <View style={styles.col}>
              <Text style={styles.backupHeaderTitle}>Cadangan Mandiri (Offline / JSON)</Text>
              <Text style={styles.backupHeaderDesc}>
                Simpan seluruh data dokumen dan riwayat perpanjangan ke format JSON terbuka untuk disimpan di Files, iCloud Drive, atau dipindahkan ke perangkat baru.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.btnEkspor,
              sedangEkspor && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={onEksporData}
            disabled={sedangEkspor || sedangImpor}
            accessibilityRole="button"
            accessibilityLabel="Ekspor Cadangan Data JSON"
          >
            {sedangEkspor ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <VectorIcon name="upload" size={16} />
                <Text style={styles.btnEksporText}>Ekspor Cadangan Data (JSON)</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.btnImpor,
              sedangImpor && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={onKonfirmasiImporData}
            disabled={sedangEkspor || sedangImpor}
            accessibilityRole="button"
            accessibilityLabel="Pulihkan Data dari Cadangan"
          >
            {sedangImpor ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <VectorIcon name="download" size={16} />
                <Text style={styles.btnImporText}>Pulihkan Data dari Cadangan</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Section 3: Privasi & Keamanan Data */}
        <Text style={styles.sectionHeader}>PRIVASI & KEAMANAN DATA</Text>
        <View style={styles.card}>
          <View style={styles.privacyItem}>
            <VectorIcon name="lock" size={20} style={{ marginTop: 2 }} />
            <View style={styles.col}>
              <Text style={styles.privacyTitle}>Foto Dokumen Bersifat Lokal</Text>
              <Text style={styles.privacyDesc}>
                Foto fisik KTP, SIM, atau dokumen lainnya tersimpan 100% di penyimpanan internal HP dan tidak diunggah ke server mana pun.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.privacyItem}>
            <VectorIcon name="shield" size={20} style={{ marginTop: 2 }} />
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
            style={({ pressed }) => [
              styles.btnHapusData,
              sedangMenghapus && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
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
    borderColor: '#5C2327',
    backgroundColor: '#261416',
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
  biometrikSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
    paddingRight: 8,
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
    backgroundColor: '#362413',
  },
  badgeWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCD34D',
  },
  badgeSuccess: {
    backgroundColor: '#142E22',
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bannerAmankan: {
    flexDirection: 'row',
    backgroundColor: '#261C15',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#422D1E',
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
    color: '#FFFFFF',
  },
  bannerText: {
    fontSize: 12,
    color: '#D6CCC2',
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
  namaInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  namaInput: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
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
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backupHeaderIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  backupHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  backupHeaderDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  widgetPetunjuk: {
    backgroundColor: '#261C15',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#422D1E',
  },
  widgetPetunjukText: {
    fontSize: 12,
    color: '#D6CCC2',
    lineHeight: 17,
  },
  btnEkspor: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  btnEksporText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnImpor: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnImporText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  btnActionIcon: {
    fontSize: 16,
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
    color: '#FCA5A5',
  },
  dangerDesc: {
    fontSize: 12,
    color: '#F87171',
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
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
