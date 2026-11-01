import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { Colors } from '@/constants/colors';
import { getKategori } from '@/constants/kategori';
import { deleteItem } from '@/features/items/deleteItem';
import { updateItem } from '@/features/items/updateItem';
import { supabase } from '@/lib/supabase';
import {
  formatSisaHari,
  formatTanggal,
  hitungSisaHari,
  tentukanStatus,
} from '@/lib/tanggal';
import type { Item, RiwayatPerpanjangan, TemplateType } from '@/types/database';

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
  const [editCatatan, setEditCatatan] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [menghapus, setMenghapus] = useState(false);

  // State modal perpanjangan
  const [modalPerpanjangVisible, setModalPerpanjangVisible] = useState(false);

  const muatData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    // Ambil detail item
    const { data: itemData, error: itemError } = await supabase
      .from('item')
      .select('*')
      .eq('id', id)
      .single();

    if (itemError || !itemData) {
      setError('Dokumen tidak ditemukan atau gagal dimuat.');
      setLoading(false);
      return;
    }

    const fetchedItem = itemData as Item;
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

    // Ambil riwayat perpanjangan
    const { data: riwayatData } = await supabase
      .from('riwayat_perpanjangan')
      .select('*')
      .eq('item_id', id)
      .order('diperpanjang_pada', { ascending: false });

    if (riwayatData) {
      setRiwayat(riwayatData as RiwayatPerpanjangan[]);
    }

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
      Alert.alert('Validasi', 'Judul dokumen wajib diisi (1 - 100 karakter).');
      return;
    }

    let siklusBulan: number | null = null;
    if (editSiklus.trim() !== '') {
      const n = Number(editSiklus);
      if (!Number.isInteger(n) || n <= 0) {
        Alert.alert('Validasi', 'Siklus perpanjangan harus berupa angka lebih dari 0.');
        return;
      }
      siklusBulan = n;
    }

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
      Alert.alert('Gagal', hasil.error);
      return;
    }

    setIsEditMode(false);
    muatData();
  };

  const konfirmasiHapus = () => {
    if (!item) return;
    Alert.alert(
      'Hapus Dokumen',
      `Apakah kamu yakin ingin menghapus dokumen "${item.judul}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setMenghapus(true);
            const hasil = await deleteItem(item.id);
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
  const sisaHari = item.jatuh_tempo ? hitungSisaHari(item.jatuh_tempo) : null;
  const status = sisaHari === null ? 'aman' : tentukanStatus(sisaHari);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            style={styles.navBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Text style={styles.navBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.navTitle}>
            {isEditMode ? 'Ubah Dokumen' : 'Rincian Dokumen'}
          </Text>
          <Pressable
            style={styles.navDeleteBtn}
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

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Dokumen *</Text>
                <TextInput
                  style={styles.input}
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
                  onPress={() => setTampilPicker(true)}
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
                <Text style={styles.label}>Catatan Tambahan</Text>
                <TextInput
                  style={[styles.input, styles.catatanInput]}
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
                  style={[styles.btnSimpan, menyimpan && styles.btnDisabled]}
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
                  style={styles.btnBatal}
                  onPress={() => setIsEditMode(false)}
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
                    <Text style={styles.heroIconText}>{kategori.icon}</Text>
                  </View>
                  <View style={styles.heroTitleWrap}>
                    <Text style={styles.heroTitle}>{item.judul}</Text>
                    <Text style={styles.heroCategory}>{kategori.label}</Text>
                  </View>
                </View>

                {/* Status Tenggat Bar */}
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
              </View>

              {/* Action Perpanjang Utama */}
              <Pressable
                style={styles.btnPerpanjangUtama}
                onPress={() => setModalPerpanjangVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Perpanjang Dokumen Ini"
              >
                <Text style={styles.btnPerpanjangIcon}>⚡</Text>
                <Text style={styles.btnPerpanjangText}>Perpanjang Dokumen Ini</Text>
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
                  <Text style={styles.infoRowLabel}>Siklus Perpanjangan</Text>
                  <Text style={styles.infoRowValue}>
                    {item.siklus_bulan ? `${item.siklus_bulan} Bulan` : 'Tidak ditentukan'}
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

              {/* Tombol Ubah Data */}
              <Pressable
                style={styles.btnUbahData}
                onPress={() => setIsEditMode(true)}
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
  heroStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
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
});
