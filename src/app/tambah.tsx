import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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

import { Colors } from '@/constants/colors';
import { getKategori, KATEGORI } from '@/constants/kategori';
import { addItem } from '@/features/items/addItem';
import { formatTanggal } from '@/lib/tanggal';
import type { TemplateType } from '@/types/database';

/** Date -> 'YYYY-MM-DD' (tanggal lokal HP, tanpa jam). */
function keTanggalString(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${t}`;
}

export default function TambahScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ template?: TemplateType }>();

  const [template, setTemplate] = useState<TemplateType | null>(params.template ?? null);
  const [judul, setJudul] = useState('');
  const [tanggal, setTanggal] = useState<Date | null>(null);
  const [tampilPicker, setTampilPicker] = useState(false);
  const [siklus, setSiklus] = useState('');
  const [catatan, setCatatan] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Jika parameter template diberikan dari Beranda, langsung set judul default
  useEffect(() => {
    if (params.template) {
      setTemplate(params.template);
      const kat = getKategori(params.template);
      setJudul(kat.label);
    }
  }, [params.template]);

  const onPilihTemplate = (val: TemplateType) => {
    setTemplate(val);
    const kat = getKategori(val);
    if (judul.trim() === '') {
      setJudul(kat.label);
    }
    // Set siklus umum bila ada
    if (val === 'sim') setSiklus('60'); // 5 tahun
    else if (val === 'stnk' || val === 'pajak_kendaraan') setSiklus('12'); // 1 tahun
    else if (val === 'paspor') setSiklus('120'); // 10 tahun
  };

  const onUbahTanggal = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setTampilPicker(false);
    if (event.type === 'set' && selected) setTanggal(selected);
  };

  const simpan = async () => {
    setError(null);
    const judulBersih = judul.trim();
    if (!template) {
      setError('Pilih jenis dokumen terlebih dahulu.');
      return;
    }
    if (judulBersih.length < 1 || judulBersih.length > 100) {
      setError('Judul dokumen wajib diisi (1 - 100 karakter).');
      return;
    }
    let siklusBulan: number | null = null;
    if (siklus.trim() !== '') {
      const n = Number(siklus);
      if (!Number.isInteger(n) || n <= 0) {
        setError('Siklus perpanjangan harus berupa bilangan bulat lebih dari 0.');
        return;
      }
      siklusBulan = n;
    }

    setMenyimpan(true);
    const hasil = await addItem({
      judul: judulBersih,
      template,
      jatuh_tempo: tanggal ? keTanggalString(tanggal) : null,
      siklus_bulan: siklusBulan,
      catatan: catatan.trim() === '' ? null : catatan.trim(),
    });
    setMenyimpan(false);

    if (hasil.error) {
      setError(hasil.error);
      return;
    }
    router.back();
  };

  // ==================== TAHAP 1: PILIH TEMPLATE ====================
  if (!template) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderTitle}>Pilih Jenis Dokumen</Text>
          <Pressable
            style={styles.btnTutup}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Tutup"
          >
            <Text style={styles.btnTutupText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.templateListScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.templateSubtitle}>
            Pilih kategori dokumen yang ingin kamu pantau masa berlakunya:
          </Text>

          <View style={styles.templateGrid}>
            {KATEGORI.map((kat) => (
              <Pressable
                key={kat.value}
                style={styles.templateCard}
                onPress={() => onPilihTemplate(kat.value)}
                accessibilityRole="button"
                accessibilityLabel={kat.label}
              >
                <View style={[styles.templateIconBox, { backgroundColor: kat.accentBg }]}>
                  <Text style={styles.templateIconText}>{kat.icon}</Text>
                </View>
                <View style={styles.templateContent}>
                  <Text style={styles.templateTitle}>{kat.label}</Text>
                  <Text style={styles.templateDesc}>{kat.subtitle}</Text>
                </View>
                <Text style={styles.templateChevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==================== TAHAP 2: FORM ISI RINCIAN DOKUMEN ====================
  const kategoriAktif = getKategori(template);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderTitle}>Rincian Dokumen</Text>
          <Pressable
            style={styles.btnTutup}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Tutup"
          >
            <Text style={styles.btnTutupText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          {/* Selected Template Banner */}
          <View style={styles.selectedBanner}>
            <View style={styles.selectedBannerLeft}>
              <View style={[styles.selectedIconBox, { backgroundColor: kategoriAktif.accentBg }]}>
                <Text style={styles.selectedIconText}>{kategoriAktif.icon}</Text>
              </View>
              <View>
                <Text style={styles.selectedLabel}>{kategoriAktif.label}</Text>
                <Text style={styles.selectedDesc}>{kategoriAktif.subtitle}</Text>
              </View>
            </View>
            <Pressable
              style={styles.btnGantiTemplate}
              onPress={() => setTemplate(null)}
              accessibilityRole="button"
            >
              <Text style={styles.btnGantiTemplateText}>Ubah</Text>
            </Pressable>
          </View>

          {/* Input Judul */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nama / Label Dokumen *</Text>
            <TextInput
              style={styles.input}
              value={judul}
              onChangeText={setJudul}
              placeholder={`Contoh: ${kategoriAktif.label} Pribadi`}
              placeholderTextColor="#94A3B8"
              maxLength={100}
            />
          </View>

          {/* Input Tanggal Jatuh Tempo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tanggal Jatuh Tempo (Masa Berlaku)</Text>
            <Pressable style={styles.inputPressable} onPress={() => setTampilPicker(true)}>
              <Text style={tanggal ? styles.nilaiTanggal : styles.placeholderTanggal}>
                {tanggal ? formatTanggal(keTanggalString(tanggal)) : 'Pilih tanggal kalender'}
              </Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </Pressable>
            {tampilPicker && (
              <DateTimePicker
                value={tanggal ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="light"
                accentColor={Colors.primary}
                onChange={onUbahTanggal}
              />
            )}
          </View>

          {/* Siklus Perpanjangan */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Siklus Perpanjangan (Bulan)</Text>
            <TextInput
              style={styles.input}
              value={siklus}
              onChangeText={setSiklus}
              placeholder="Contoh: 12 (1 tahun) atau 60 (5 tahun)"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
            />
            {/* Quick chips siklus */}
            <View style={styles.siklusChipsRow}>
              <Pressable
                style={[styles.siklusChip, siklus === '12' && styles.siklusChipActive]}
                onPress={() => setSiklus('12')}
              >
                <Text style={[styles.siklusChipText, siklus === '12' && styles.siklusChipTextActive]}>
                  1 Tahun (12 bln)
                </Text>
              </Pressable>
              <Pressable
                style={[styles.siklusChip, siklus === '60' && styles.siklusChipActive]}
                onPress={() => setSiklus('60')}
              >
                <Text style={[styles.siklusChipText, siklus === '60' && styles.siklusChipTextActive]}>
                  5 Tahun (60 bln)
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Catatan Tambahan */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.catatanInput]}
              value={catatan}
              onChangeText={setCatatan}
              placeholder="Nomor registrasi, lokasi berkas, atau catatan lain"
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonActionRow}>
            <Pressable
              style={[styles.btnSimpan, menyimpan && styles.btnDisabled]}
              onPress={simpan}
              disabled={menyimpan}
              accessibilityRole="button"
            >
              <Text style={styles.btnSimpanText}>
                {menyimpan ? 'Menyimpan Dokumen…' : 'Simpan Dokumen'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.btnBatal}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={styles.btnBatalText}>Batal</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.canvas },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  btnTutup: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTutupText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '700',
  },

  // Tahap 1: Template List
  templateListScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  templateSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  templateGrid: {
    gap: 12,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 14,
  },
  templateIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateIconText: {
    fontSize: 24,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  templateDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  templateChevron: {
    fontSize: 22,
    color: Colors.textMuted,
    fontWeight: '300',
  },

  // Tahap 2: Form
  formContainer: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  selectedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectedIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconText: {
    fontSize: 22,
  },
  selectedLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  selectedDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  btnGantiTemplate: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnGantiTemplateText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
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
    color: Colors.textPrimary,
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
  nilaiTanggal: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholderTanggal: {
    fontSize: 15,
    color: '#94A3B8',
  },
  calendarIcon: {
    fontSize: 18,
  },
  siklusChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  siklusChip: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  siklusChipActive: {
    backgroundColor: Colors.primaryContainer,
  },
  siklusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  siklusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  catatanInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorBox: {
    backgroundColor: Colors.criticalContainer,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    color: Colors.criticalDark,
    fontWeight: '600',
  },

  buttonActionRow: {
    gap: 10,
    marginTop: 8,
  },
  btnSimpan: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
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
});
