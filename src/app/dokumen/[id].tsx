import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryList } from '@/components/category-list';
import {
  PerpanjangModal,
  type PerpanjangTargetItem,
} from '@/components/perpanjang-modal';
import { VectorIcon } from '@/components/vector-icon';
import { Colors } from '@/constants/colors';
import { getKategori } from '@/constants/kategori';
import { PANDUAN_PERPANJANGAN } from '@/constants/panduanPerpanjangan';
import { deleteItem } from '@/features/items/deleteItem';
import { updateItem } from '@/features/items/updateItem';
import { DOKUMEN_REFERENSI } from '@/features/items/useItems';
import {
  formatSisaHari,
  formatTanggal,
  hitungSisaHari,
  tentukanStatus,
} from '@/lib/tanggal';
import type { Item, RiwayatPerpanjangan, TemplateType } from '@/types/database';
import { verifikasiBiometrik } from '@/utils/biometricLock';
import { tambahkanKeKalenderIPhone } from '@/utils/calendarSync';
import {
  ambilPemilikItem,
  ambilSemuaPemilikDokumen,
  aturPemilikDokumen,
  DAFTAR_PEMILIK,
  getInfoPemilik,
  type OwnerTag,
} from '@/utils/documentOwner';
import { haptic } from '@/utils/haptics';
import {
  ambilFotoDokumenLokal,
  hapusFotoDokumenLokal,
  pilihFotoDokumen,
  simpanFotoDokumenLokal,
} from '@/utils/localDocumentPhoto';
import { ambilDetailDanRiwayatOfflineFirst } from '@/utils/offlineStore';
import {
  ambilBiayaDokumen,
  ambilSemuaBiayaPerpanjangan,
  aturBiayaPerpanjangan,
  formatRupiah,
  parseInputRupiah,
} from '@/utils/renewalBudget';
import { useVoiceDictation } from '@/utils/speechRecognition';

function keTanggalString(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${t}`;
}

export default function DetailDokumenScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<Item | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatPerpanjangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State mode edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [editJudul, setEditJudul] = useState('');
  const [editTemplate, setEditTemplate] = useState<TemplateType>('sim');
  const [editTanggal, setEditTanggal] = useState<Date | null>(null);
  const [tampilPicker, setTampilPicker] = useState(false);
  const [editSiklus, setEditSiklus] = useState('');
  const [editBiaya, setEditBiaya] = useState('');
  const [editCatatan, setEditCatatan] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [menghapus, setMenghapus] = useState(false);
  const [targetDikte, setTargetDikte] = useState<'judul' | 'catatan' | null>(null);

  // State foto lokal, biaya, pemilik, & kalender
  const [fotoLokalUri, setFotoLokalUri] = useState<string | null>(null);
  const [fotoTerbuka, setFotoTerbuka] = useState(false);
  const [modalZoomFoto, setModalZoomFoto] = useState(false);
  const [estimasiBiaya, setEstimasiBiaya] = useState<number | null>(null);
  const [pemilikDokumen, setPemilikDokumen] = useState<OwnerTag>('pribadi');
  const [editPemilik, setEditPemilik] = useState<OwnerTag>('pribadi');
  const [menyimpanKalender, setMenyimpanKalender] = useState(false);

  const { isListening, startListening, stopListening } = useVoiceDictation({
    lang: 'id-ID',
    onTranscript: (teks) => {
      if (targetDikte === 'judul') {
        setEditJudul(teks);
      } else if (targetDikte === 'catatan') {
        setEditCatatan(teks);
      }
    },
  });

  const onToggleDikte = (target: 'judul' | 'catatan') => {
    if (isListening) {
      stopListening();
      if (targetDikte === target) {
        setTargetDikte(null);
        return;
      }
    }
    setTargetDikte(target);
    startListening();
  };

  // State modal perpanjangan
  const [modalPerpanjangVisible, setModalPerpanjangVisible] = useState(false);

  const muatData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const { item: fetchedItem, riwayat: riwayatData } =
      await ambilDetailDanRiwayatOfflineFirst(id, DOKUMEN_REFERENSI);

    if (!fetchedItem) {
      setError('Dokumen tidak ditemukan atau gagal dimuat.');
      setLoading(false);
      return;
    }

    setItem(fetchedItem);

    // Inisialisasi form edit
    setEditJudul(fetchedItem.judul);
    setEditTemplate(fetchedItem.template);
    if (fetchedItem.jatuh_tempo) {
      const [y, m, d] = fetchedItem.jatuh_tempo.split('-').map(Number);
      setEditTanggal(new Date(y, m - 1, d));
    } else {
      setEditTanggal(null);
    }
    setEditSiklus(fetchedItem.siklus_bulan ? String(fetchedItem.siklus_bulan) : '');
    setEditCatatan(fetchedItem.catatan ?? '');

    // Ambil foto fisik lokal, estimasi biaya perpanjangan, & tag pemilik
    const [uriFoto, petaBiaya, petaPemilik] = await Promise.all([
      ambilFotoDokumenLokal(fetchedItem.id),
      ambilSemuaBiayaPerpanjangan(),
      ambilSemuaPemilikDokumen(),
    ]);
    setFotoLokalUri(uriFoto);
    const biayaItem = ambilBiayaDokumen(fetchedItem, petaBiaya);
    setEstimasiBiaya(biayaItem);
    setEditBiaya(biayaItem ? String(biayaItem) : '');
    const tagPemilik = ambilPemilikItem(fetchedItem.id, petaPemilik);
    setPemilikDokumen(tagPemilik);
    setEditPemilik(tagPemilik);

    setRiwayat(riwayatData);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    muatData();
  }, [muatData]);

  const onUbahTanggal = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setTampilPicker(false);
    if (event.type === 'set' && selected) setEditTanggal(selected);
  };

  const simpanPerubahan = async () => {
    if (!item) return;
    const judulBersih = editJudul.trim();
    if (judulBersih.length < 1 || judulBersih.length > 100) {
      haptic.warning();
      Alert.alert('Validasi', 'Judul dokumen wajib diisi (1 - 100 karakter).');
      return;
    }

    let siklusBulan: number | null = null;
    if (editSiklus.trim() !== '') {
      const n = Number(editSiklus);
      if (!Number.isInteger(n) || n <= 0) {
        haptic.warning();
        Alert.alert('Validasi', 'Siklus perpanjangan harus berupa angka lebih dari 0.');
        return;
      }
      siklusBulan = n;
    }

    haptic.medium();
    setMenyimpan(true);
    const hasil = await updateItem(item.id, {
      judul: judulBersih,
      template: editTemplate,
      jatuh_tempo: editTanggal ? keTanggalString(editTanggal) : null,
      siklus_bulan: siklusBulan,
      catatan: editCatatan.trim() === '' ? null : editCatatan.trim(),
    });
    setMenyimpan(false);

    if (hasil.error) {
      haptic.error();
      Alert.alert('Gagal', hasil.error);
      return;
    }

    const nominalBiaya = parseInputRupiah(editBiaya);
    await Promise.all([
      aturBiayaPerpanjangan(item.id, nominalBiaya),
      aturPemilikDokumen(item.id, editPemilik),
    ]);
    setEstimasiBiaya(nominalBiaya);
    setPemilikDokumen(editPemilik);

    haptic.success();
    setIsEditMode(false);
    muatData();
  };

  const onPilihDanSimpanFoto = async (sumber: 'kamera' | 'galeri') => {
    if (!item) return;
    haptic.light();
    const res = await pilihFotoDokumen(sumber);
    if (res.dibatalkan) return;
    if (!res.berhasil || !res.uri) {
      haptic.warning();
      if (res.pesan) Alert.alert('Foto Dokumen', res.pesan);
      return;
    }
    const tersimpanUri = await simpanFotoDokumenLokal(item.id, res.uri);
    setFotoLokalUri(tersimpanUri);
    setFotoTerbuka(false);
    haptic.success();
    Alert.alert(
      '📷 Foto Tersimpan Lokal',
      'Foto fisik dokumen berhasil disimpan di memori internal iPhone dengan proteksi Face ID.'
    );
  };

  const onHapusFotoLokal = () => {
    if (!item || !fotoLokalUri) return;
    haptic.warning();
    Alert.alert(
      'Hapus Foto Fisik?',
      'Foto lokal dokumen ini akan dihapus dari penyimpanan HP.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Foto',
          style: 'destructive',
          onPress: async () => {
            await hapusFotoDokumenLokal(item.id);
            setFotoLokalUri(null);
            setFotoTerbuka(false);
            haptic.success();
          },
        },
      ]
    );
  };

  const onBukaAtauPerbesarFoto = async (bukaZoom = false) => {
    if (!fotoLokalUri) return;
    if (fotoTerbuka) {
      if (bukaZoom) {
        haptic.light();
        setModalZoomFoto(true);
      } else {
        haptic.light();
        setFotoTerbuka(false);
      }
      return;
    }

    haptic.light();
    const verif = await verifikasiBiometrik(
      `Verifikasi Face ID untuk melihat foto fisik ${item?.judul ?? 'dokumen'}`
    );
    if (verif.berhasil) {
      haptic.success();
      setFotoTerbuka(true);
      if (bukaZoom) {
        setModalZoomFoto(true);
      }
    } else if (verif.pesan && verif.pesan !== 'Verifikasi dibatalkan.') {
      haptic.warning();
      Alert.alert('Verifikasi Diperlukan', verif.pesan);
    }
  };

  const onTambahKeKalender = async () => {
    if (!item) return;
    if (!item.jatuh_tempo) {
      haptic.warning();
      Alert.alert('Tanggal Belum Diatur', 'Atur tanggal jatuh tempo dokumen terlebih dahulu.');
      return;
    }

    haptic.medium();
    setMenyimpanKalender(true);
    const kat = getKategori(item.template);
    const hasil = await tambahkanKeKalenderIPhone({
      judul: item.judul,
      jatuhTempo: item.jatuh_tempo,
      kategoriLabel: kat.label,
      catatan: item.catatan,
      estimasiBiaya,
    });
    setMenyimpanKalender(false);

    if (hasil.berhasil) {
      haptic.success();
      Alert.alert('📅 Tersimpan di Kalender iPhone!', hasil.pesan);
    } else {
      haptic.warning();
      Alert.alert('Gagal Menambahkan ke Kalender', hasil.pesan);
    }
  };

  const konfirmasiHapus = () => {
    if (!item) return;
    haptic.warning();
    Alert.alert(
      'Hapus Dokumen',
      `Apakah kamu yakin ingin menghapus dokumen "${item.judul}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        {
          text: 'Batal',
          style: 'cancel',
          onPress: () => haptic.light(),
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            haptic.error();
            setMenghapus(true);
            const hasil = await deleteItem(item.id);
            await Promise.all([
              hapusFotoDokumenLokal(item.id),
              aturBiayaPerpanjangan(item.id, null),
              aturPemilikDokumen(item.id, null),
            ]);
            setMenghapus(false);
            if (hasil.error) {
              Alert.alert('Gagal', hasil.error);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tengah}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tengah}>
          <Text style={styles.errorText}>{error ?? 'Dokumen tidak ditemukan'}</Text>
          <Pressable style={styles.btnKembali} onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.btnKembaliText}>Kembali</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const kategori = getKategori(item.template);
  const panduan = PANDUAN_PERPANJANGAN[item.template] ?? PANDUAN_PERPANJANGAN.custom;
  const sisaHari = item.jatuh_tempo ? hitungSisaHari(item.jatuh_tempo) : null;
  const status = sisaHari === null ? 'aman' : tentukanStatus(sisaHari);

  // Hitung persentase progress masa berlaku untuk visualisasi bar
  const totalHariSiklus = (item.siklus_bulan && item.siklus_bulan > 0 ? item.siklus_bulan : 12) * 30;
  const persenMasaBerlaku =
    sisaHari === null
      ? 100
      : Math.max(4, Math.min(100, Math.round((Math.max(0, sisaHari) / totalHariSiklus) * 100)));
  const warnaBarProgress =
    status === 'kritis' || status === 'expired'
      ? '#EF4444'
      : status === 'mendesak'
      ? '#F59E0B'
      : '#10B981';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            style={({ pressed }) => [styles.navBtn, pressed && styles.btnPressed]}
            onPress={() => {
              haptic.light();
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Text style={styles.navBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.navTitle}>
            {isEditMode ? 'Ubah Dokumen' : 'Rincian Dokumen'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.navDeleteBtn, pressed && styles.btnPressed]}
            onPress={konfirmasiHapus}
            disabled={menghapus}
            accessibilityRole="button"
            accessibilityLabel="Hapus Dokumen"
          >
            <Text style={styles.navDeleteText}>Hapus</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {isEditMode ? (
            /* ==================== FORM EDIT DOKUMEN ==================== */
            <View style={styles.formWrap}>
              <Text style={styles.labelSection}>Kategori Dokumen</Text>
              <View style={styles.kategoriScrollWrap}>
                <CategoryList
                  selected={editTemplate}
                  onSelect={(v) => v && setEditTemplate(v)}
                />
              </View>

              {/* Banner Status Mendengarkan Suara */}
              {isListening && (
                <View style={styles.bannerDikte}>
                  <View style={styles.bannerDikteKiri}>
                    <Text style={styles.bannerDikteIcon}>🎙️</Text>
                    <Text style={styles.bannerDikteTeks}>
                      Mendengarkan {targetDikte === 'judul' ? 'Nama Dokumen' : 'Catatan'}… Bicara sekarang.
                    </Text>
                  </View>
                  <Pressable style={styles.btnDikteSelesai} onPress={stopListening} accessibilityRole="button">
                    <Text style={styles.btnDikteSelesaiTeks}>Selesai</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Nama Dokumen *</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btnMic,
                      targetDikte === 'judul' && isListening && styles.btnMicActive,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => onToggleDikte('judul')}
                    accessibilityRole="button"
                    accessibilityLabel="Dikte suara nama dokumen"
                  >
                    <Text style={styles.btnMicIcon}>🎙️</Text>
                    <Text
                      style={[
                        styles.btnMicText,
                        targetDikte === 'judul' && isListening && styles.btnMicTextActive,
                      ]}
                    >
                      {targetDikte === 'judul' && isListening ? 'Mendengarkan…' : 'Dikte'}
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    targetDikte === 'judul' && isListening && styles.inputListening,
                  ]}
                  value={editJudul}
                  onChangeText={setEditJudul}
                  placeholderTextColor="#94A3B8"
                  maxLength={100}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tanggal Jatuh Tempo</Text>
                <Pressable
                  style={styles.inputPressable}
                  onPress={() => {
                    haptic.selection();
                    setTampilPicker((prev) => !prev);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={editTanggal ? styles.inputDateValue : styles.inputDatePlaceholder}>
                    {editTanggal ? formatTanggal(keTanggalString(editTanggal)) : 'Pilih tanggal kalender'}
                  </Text>
                  <Text style={styles.calendarIcon}>📅</Text>
                </Pressable>
                {tampilPicker && (
                  <DateTimePicker
                    value={editTanggal ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    themeVariant="light"
                    accentColor={Colors.primary}
                    onChange={onUbahTanggal}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Pemilik Dokumen (Keluarga / Pribadi)</Text>
                <View style={styles.ownerEditRow}>
                  {DAFTAR_PEMILIK.map((p) => {
                    const aktif = editPemilik === p.value;
                    return (
                      <Pressable
                        key={p.value}
                        style={[
                          styles.ownerEditChip,
                          aktif && {
                            backgroundColor: p.bg,
                            borderColor: p.textColor,
                            borderWidth: 1.5,
                          },
                        ]}
                        onPress={() => {
                          haptic.selection();
                          setEditPemilik(p.value);
                        }}
                      >
                        <Text
                          style={[
                            styles.ownerEditChipText,
                            aktif && { color: p.textColor, fontWeight: '800' },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Siklus Perpanjangan (Bulan)</Text>
                <TextInput
                  style={styles.input}
                  value={editSiklus}
                  onChangeText={setEditSiklus}
                  placeholder="Contoh: 12 atau 60"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>💰 Estimasi Biaya Perpanjangan (Rp)</Text>
                <TextInput
                  style={styles.input}
                  value={editBiaya}
                  onChangeText={(t) => setEditBiaya(t.replace(/[^\d.]/g, ''))}
                  placeholder="Contoh: 250000 (opsional)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                />
                {parseInputRupiah(editBiaya) !== null && (
                  <Text style={styles.biayaHelperText}>
                    Terbaca: {formatRupiah(parseInputRupiah(editBiaya) ?? 0)}
                  </Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>📷 Foto Fisik Dokumen (Tersimpan Lokal di HP)</Text>
                <View style={styles.fotoActionRow}>
                  <Pressable
                    style={({ pressed }) => [styles.btnFotoPilih, pressed && styles.btnPressed]}
                    onPress={() => onPilihDanSimpanFoto('kamera')}
                  >
                    <Text style={styles.btnFotoPilihText}>📸 Kamera</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.btnFotoPilih, pressed && styles.btnPressed]}
                    onPress={() => onPilihDanSimpanFoto('galeri')}
                  >
                    <Text style={styles.btnFotoPilihText}>🖼️ Galeri</Text>
                  </Pressable>
                  {fotoLokalUri && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.btnFotoPilih,
                        styles.btnFotoHapus,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={onHapusFotoLokal}
                    >
                      <Text style={styles.btnFotoHapusText}>🗑️ Hapus</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Catatan Tambahan</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btnMic,
                      targetDikte === 'catatan' && isListening && styles.btnMicActive,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => onToggleDikte('catatan')}
                    accessibilityRole="button"
                    accessibilityLabel="Dikte suara catatan dokumen"
                  >
                    <Text style={styles.btnMicIcon}>🎙️</Text>
                    <Text
                      style={[
                        styles.btnMicText,
                        targetDikte === 'catatan' && isListening && styles.btnMicTextActive,
                      ]}
                    >
                      {targetDikte === 'catatan' && isListening ? 'Mendengarkan…' : 'Dikte'}
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.catatanInput,
                    targetDikte === 'catatan' && isListening && styles.inputListening,
                  ]}
                  value={editCatatan}
                  onChangeText={setEditCatatan}
                  placeholder="Catatan, nomor berkas, atau lokasi fisik"
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>

              {/* Action Buttons Edit */}
              <View style={styles.editActionRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSimpan,
                    menyimpan && styles.btnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={simpanPerubahan}
                  disabled={menyimpan}
                  accessibilityRole="button"
                >
                  {menyimpan ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnSimpanText}>Simpan Perubahan</Text>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.btnBatal, pressed && styles.btnPressed]}
                  onPress={() => {
                    haptic.light();
                    setIsEditMode(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnBatalText}>Batal</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* ==================== TAMPILAN DETAIL DOKUMEN ==================== */
            <View style={styles.detailWrap}>
              {/* Hero Card Dokumen */}
              <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <View style={[styles.heroIconBox, { backgroundColor: kategori.accentBg }]}>
                    <VectorIcon name={item.template} size={28} />
                  </View>
                  <View style={styles.heroTitleWrap}>
                    <Text style={styles.heroTitle}>{item.judul}</Text>
                    <Text style={styles.heroCategory}>{kategori.label}</Text>
                  </View>
                </View>

                {/* Status Tenggat Bar + Progress Bar Masa Berlaku */}
                <View style={styles.heroStatusBox}>
                  <View style={styles.heroStatusBar}>
                    <View style={styles.heroStatusLeft}>
                      <Text style={styles.heroStatusLabel}>Jatuh Tempo</Text>
                      <Text style={styles.heroStatusValue}>
                        {item.jatuh_tempo ? formatTanggal(item.jatuh_tempo) : 'Belum diatur'}
                      </Text>
                    </View>
                    {sisaHari !== null && (
                      <View
                        style={[
                          styles.heroPill,
                          status === 'kritis' || status === 'expired'
                            ? styles.heroPillCritical
                            : status === 'mendesak'
                            ? styles.heroPillWarning
                            : styles.heroPillSafe,
                        ]}
                      >
                        <Text
                          style={[
                            styles.heroPillText,
                            status === 'kritis' || status === 'expired'
                              ? styles.heroPillTextCritical
                              : status === 'mendesak'
                              ? styles.heroPillTextWarning
                              : styles.heroPillTextSafe,
                          ]}
                        >
                          {formatSisaHari(sisaHari)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {sisaHari !== null && (
                    <View style={styles.lifecycleWrap}>
                      <View style={styles.lifecycleTrack}>
                        <View
                          style={[
                            styles.lifecycleFill,
                            {
                              width: `${persenMasaBerlaku}%`,
                              backgroundColor: warnaBarProgress,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.lifecycleMetaRow}>
                        <Text style={styles.lifecycleMetaText}>
                          Sisa masa aktif siklus {item.siklus_bulan ?? 12} bulan
                        </Text>
                        <Text style={[styles.lifecyclePercentText, { color: warnaBarProgress }]}>
                          {persenMasaBerlaku}%
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Perpanjang Utama */}
              <Pressable
                style={({ pressed }) => [styles.btnPerpanjangUtama, pressed && styles.btnPressed]}
                onPress={() => {
                  haptic.medium();
                  setModalPerpanjangVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Perpanjang Dokumen Ini"
              >
                <VectorIcon name="bolt" size={18} />
                <Text style={styles.btnPerpanjangText}>Perpanjang Dokumen Ini</Text>
              </Pressable>

              {/* Tombol Tambahkan ke Kalender iPhone */}
              <Pressable
                style={({ pressed }) => [
                  styles.btnKalenderIPhone,
                  menyimpanKalender && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
                onPress={onTambahKeKalender}
                disabled={menyimpanKalender}
                accessibilityRole="button"
                accessibilityLabel="Tambahkan ke Kalender iPhone"
              >
                {menyimpanKalender ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <VectorIcon name="calendar" size={18} />
                    <Text style={styles.btnKalenderText}>Tambahkan ke Kalender iPhone</Text>
                  </>
                )}
              </Pressable>

              {/* Rincian Tambahan */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Informasi Dokumen</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoRowLabel}>Jenis Kategori</Text>
                  <Text style={styles.infoRowValue}>{kategori.label}</Text>
                </View>
                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoRowLabel}>Pemilik Dokumen</Text>
                  <View
                    style={[
                      styles.ownerDetailPill,
                      {
                        backgroundColor: getInfoPemilik(pemilikDokumen).bg,
                        borderColor: getInfoPemilik(pemilikDokumen).borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ownerDetailPillText,
                        { color: getInfoPemilik(pemilikDokumen).textColor },
                      ]}
                    >
                      {getInfoPemilik(pemilikDokumen).label}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoRowLabel}>Siklus Perpanjangan</Text>
                  <Text style={styles.infoRowValue}>
                    {item.siklus_bulan ? `${item.siklus_bulan} Bulan` : 'Tidak ditentukan'}
                  </Text>
                </View>
                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoRowLabel}>Estimasi Biaya Perpanjangan</Text>
                  <Text style={[styles.infoRowValue, estimasiBiaya ? styles.infoRowValuePurple : undefined]}>
                    {estimasiBiaya && estimasiBiaya > 0
                      ? formatRupiah(estimasiBiaya)
                      : 'Belum diatur'}
                  </Text>
                </View>
                <View style={styles.infoDivider} />

                <View style={styles.infoRowColumn}>
                  <Text style={styles.infoRowLabel}>Catatan</Text>
                  <Text style={styles.infoRowValueLarge}>
                    {item.catatan ? item.catatan : 'Belum ada catatan tambahan.'}
                  </Text>
                </View>
              </View>

              {/* Seksi Foto Fisik Dokumen (Tersimpan Lokal di HP) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderWithIcon}>
                  <VectorIcon name="camera" size={18} />
                  <Text style={styles.sectionHeadingNoMargin}>
                    Foto Fisik Dokumen (Lokal di HP)
                  </Text>
                </View>
                <Text style={styles.fotoZeroPiiDesc}>
                  Privasi Zero-PII: Foto fisik disimpan 100% di memori internal HP dan tidak pernah diunggah ke server.
                </Text>

                {fotoLokalUri ? (
                  <View style={styles.fotoDetailWrap}>
                    <Pressable
                      style={styles.fotoPreviewBox}
                      onPress={() => onBukaAtauPerbesarFoto(true)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        fotoTerbuka ? 'Perbesar foto dokumen' : 'Verifikasi Face ID untuk melihat foto dokumen'
                      }
                    >
                      <Image
                        source={{ uri: fotoLokalUri }}
                        style={styles.fotoDetailImg}
                        contentFit="cover"
                        blurRadius={fotoTerbuka ? 0 : 28}
                      />
                      {!fotoTerbuka && (
                        <View style={styles.fotoMaskOverlay}>
                          <VectorIcon name="lock" size={28} />
                          <Text style={styles.fotoMaskTitle}>Foto Disamarkan Demi Privasi</Text>
                          <Text style={styles.fotoMaskSub}>
                            Ketuk untuk verifikasi Face ID dan melihat foto asli
                          </Text>
                        </View>
                      )}
                    </Pressable>

                    <View style={styles.fotoActionRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.btnFotoUtama,
                          pressed && styles.btnPressed,
                        ]}
                        onPress={() => onBukaAtauPerbesarFoto(false)}
                      >
                        <Text style={styles.btnFotoUtamaText}>
                          {fotoTerbuka ? 'Sembunyikan Foto' : 'Lihat Foto Asli (Face ID)'}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.btnFotoPilih,
                          pressed && styles.btnPressed,
                        ]}
                        onPress={() => onBukaAtauPerbesarFoto(true)}
                      >
                        <Text style={styles.btnFotoPilihText}>Perbesar</Text>
                      </Pressable>
                    </View>

                    <View style={styles.fotoActionRow}>
                      <Pressable
                        style={({ pressed }) => [styles.btnFotoPilih, pressed && styles.btnPressed]}
                        onPress={() => onPilihDanSimpanFoto('kamera')}
                      >
                        <Text style={styles.btnFotoPilihText}>Ganti Kamera</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.btnFotoPilih, pressed && styles.btnPressed]}
                        onPress={() => onPilihDanSimpanFoto('galeri')}
                      >
                        <Text style={styles.btnFotoPilihText}>Ganti Galeri</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.btnFotoPilih,
                          styles.btnFotoHapus,
                          pressed && styles.btnPressed,
                        ]}
                        onPress={onHapusFotoLokal}
                      >
                        <Text style={styles.btnFotoHapusText}>Hapus</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.fotoActionRow}>
                    <Pressable
                      style={({ pressed }) => [styles.btnFotoPilih, pressed && styles.btnPressed]}
                      onPress={() => onPilihDanSimpanFoto('kamera')}
                    >
                      <VectorIcon name="camera" size={15} />
                      <Text style={styles.btnFotoPilihText}>Ambil dari Kamera</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.btnFotoPilih, pressed && styles.btnPressed]}
                      onPress={() => onPilihDanSimpanFoto('galeri')}
                    >
                      <VectorIcon name="gallery" size={15} />
                      <Text style={styles.btnFotoPilihText}>Pilih dari Galeri</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Riwayat Perpanjangan */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Riwayat Perpanjangan</Text>
                {riwayat.length === 0 ? (
                  <Text style={styles.riwayatKosongText}>
                    Belum ada riwayat perpanjangan tercatat.
                  </Text>
                ) : (
                  <View style={styles.riwayatList}>
                    {riwayat.map((r, idx) => (
                      <View key={r.id} style={styles.riwayatItem}>
                        <View style={styles.riwayatBadgeNum}>
                          <Text style={styles.riwayatBadgeNumText}>#{riwayat.length - idx}</Text>
                        </View>
                        <View style={styles.riwayatContent}>
                          <Text style={styles.riwayatTanggalBaru}>
                            {formatTanggal(r.jatuh_tempo_baru)}
                          </Text>
                          <Text style={styles.riwayatTanggalLama}>
                            Sebelumnya: {formatTanggal(r.jatuh_tempo_lama)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Panduan & Syarat Perpanjangan Resmi (Actionable Checklist) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderWithIcon}>
                  <VectorIcon name="checklist" size={18} />
                  <Text style={styles.sectionHeadingNoMargin}>
                    Panduan & Syarat Perpanjangan Resmi
                  </Text>
                </View>
                <View style={styles.panduanMetaBox}>
                  <Text style={styles.panduanMetaLabel}>KANAL / APLIKASI RESMI</Text>
                  <Text style={styles.panduanMetaTitle}>{panduan.namaLayananResmi}</Text>
                  <Text style={styles.panduanMetaSub}>
                    Estimasi proses: {panduan.estimasiWaktu}
                  </Text>
                </View>

                <Text style={styles.panduanChecklistHeading}>Berkas yang Perlu Disiapkan:</Text>
                <View style={styles.panduanChecklistWrap}>
                  {panduan.syaratBerkas.map((syarat, idx) => (
                    <View key={idx} style={styles.panduanChecklistItem}>
                      <VectorIcon name="check" size={14} style={{ marginTop: 2 }} />
                      <Text style={styles.panduanCheckText}>{syarat}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.panduanTipsBox}>
                  <Text style={styles.panduanTipsText}>Catatan Penting: {panduan.tipsSingkat}</Text>
                </View>
              </View>

              {/* Tombol Ubah Data */}
              <Pressable
                style={({ pressed }) => [styles.btnUbahData, pressed && styles.btnPressed]}
                onPress={() => {
                  haptic.light();
                  setIsEditMode(true);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.btnUbahDataText}>Ubah Rincian Dokumen</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Perpanjang */}
      <PerpanjangModal
        visible={modalPerpanjangVisible}
        item={item as PerpanjangTargetItem}
        onClose={() => setModalPerpanjangVisible(false)}
        onSuccess={() => {
          Alert.alert('Berhasil', 'Dokumen berhasil diperpanjang!');
          muatData();
        }}
      />

      {/* Modal Perbesar Foto Fisik Dokumen */}
      <Modal
        visible={modalZoomFoto && !!fotoLokalUri}
        transparent
        animationType="fade"
        onRequestClose={() => setModalZoomFoto(false)}
      >
        <View style={styles.zoomModalBackdrop}>
          <View style={styles.zoomModalHeader}>
            <Text style={styles.zoomModalTitle} numberOfLines={1}>
              📷 {item.judul}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.zoomCloseBtn, pressed && styles.btnPressed]}
              onPress={() => {
                haptic.light();
                setModalZoomFoto(false);
              }}
            >
              <Text style={styles.zoomCloseBtnText}>✕ Tutup</Text>
            </Pressable>
          </View>
          {fotoLokalUri && (
            <Image
              source={{ uri: fotoLokalUri }}
              style={styles.zoomFullImage}
              contentFit="contain"
            />
          )}
          <Text style={styles.zoomFooterNote}>
            🔒 Tersimpan 100% lokal di perangkatmu (Zero-PII)
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.canvas },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  navDeleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.critical,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // Detail View Styles
  detailWrap: {
    gap: 16,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: {
    fontSize: 26,
  },
  heroTitleWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  heroCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  heroStatusBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  heroStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lifecycleWrap: {
    gap: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  lifecycleTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  lifecycleFill: {
    height: '100%',
    borderRadius: 999,
  },
  lifecycleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lifecycleMetaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  lifecyclePercentText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionHeadingNoMargin: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  heroStatusLeft: {
    gap: 2,
  },
  heroStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  heroStatusValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  heroPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroPillSafe: {
    backgroundColor: Colors.safeContainer,
  },
  heroPillTextSafe: {
    color: Colors.onSafeContainer,
    fontSize: 12,
    fontWeight: '700',
  },
  heroPillWarning: {
    backgroundColor: Colors.warningContainer,
  },
  heroPillTextWarning: {
    color: Colors.warningDark,
    fontSize: 12,
    fontWeight: '700',
  },
  heroPillCritical: {
    backgroundColor: Colors.criticalContainer,
  },
  heroPillTextCritical: {
    color: Colors.criticalDark,
    fontSize: 12,
    fontWeight: '700',
  },

  btnPerpanjangUtama: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  btnPerpanjangIcon: {
    fontSize: 18,
  },
  btnPerpanjangText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnKalenderIPhone: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  btnKalenderIcon: {
    fontSize: 16,
  },
  btnKalenderText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  infoRowValuePurple: {
    color: Colors.primary,
  },
  ownerDetailPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  ownerDetailPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ownerEditRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  ownerEditChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ownerEditChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  biayaHelperText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  fotoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fotoZeroPiiDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: -6,
  },
  fotoDetailWrap: {
    gap: 10,
  },
  fotoPreviewBox: {
    width: '100%',
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
    position: 'relative',
  },
  fotoDetailImg: {
    width: '100%',
    height: '100%',
  },
  fotoMaskOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(25, 27, 39, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 4,
  },
  fotoMaskLockIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  fotoMaskTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  fotoMaskSub: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  fotoActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnFotoUtama: {
    flex: 1.4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFotoUtamaText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  btnFotoPilih: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnFotoPilihText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  btnFotoHapus: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  btnFotoHapusText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  zoomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'space-between',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  zoomModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  zoomModalTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  zoomCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  zoomCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  zoomFullImage: {
    width: '100%',
    height: '76%',
    borderRadius: 12,
  },
  zoomFooterNote: {
    color: '#CBD5E1',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },

  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRowColumn: {
    gap: 4,
  },
  infoRowLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  infoRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoRowValueLarge: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  riwayatKosongText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  riwayatList: {
    gap: 10,
  },
  riwayatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
  },
  riwayatBadgeNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riwayatBadgeNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  riwayatContent: {
    flex: 1,
  },
  riwayatTanggalBaru: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  riwayatTanggalLama: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  panduanMetaBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2DEF5',
    gap: 2,
  },
  panduanMetaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  panduanMetaTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#191B27',
  },
  panduanMetaSub: {
    fontSize: 11.5,
    color: '#4B5563',
    marginTop: 2,
  },
  panduanChecklistHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#191B27',
    marginTop: 2,
  },
  panduanChecklistWrap: {
    gap: 6,
  },
  panduanChecklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  panduanCheckBullet: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#059669',
    marginTop: 1,
  },
  panduanCheckText: {
    flex: 1,
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 18,
  },
  panduanTipsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  panduanTipsText: {
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
    fontWeight: '600',
  },

  btnUbahData: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnUbahDataText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },

  // Edit Form Styles
  formWrap: {
    gap: 16,
  },
  labelSection: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  kategoriScrollWrap: {
    marginHorizontal: -20,
    marginBottom: 4,
  },
  formGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  btnMic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnMicActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
  },
  btnMicIcon: {
    fontSize: 12,
  },
  btnMicText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  btnMicTextActive: {
    color: '#DC2626',
  },
  inputListening: {
    borderColor: Colors.primary,
    backgroundColor: '#FBF8FF',
  },
  bannerDikte: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  bannerDikteKiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bannerDikteIcon: {
    fontSize: 18,
  },
  bannerDikteTeks: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
    flex: 1,
  },
  btnDikteSelesai: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnDikteSelesaiTeks: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputPressable: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputDateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  inputDatePlaceholder: {
    fontSize: 15,
    color: '#94A3B8',
  },
  calendarIcon: {
    fontSize: 18,
  },
  catatanInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActionRow: {
    gap: 10,
    marginTop: 10,
  },
  btnSimpan: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnSimpanText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnBatal: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnBatalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  tengah: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: Colors.critical,
    textAlign: 'center',
    marginBottom: 16,
  },
  btnKembali: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  btnKembaliText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
