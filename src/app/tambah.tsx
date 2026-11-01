import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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

import { Colors } from '@/constants/colors';
import { getKategori, KATEGORI } from '@/constants/kategori';
import { addItem } from '@/features/items/addItem';
import { formatTanggal } from '@/lib/tanggal';
import type { TemplateType } from '@/types/database';
import { haptic } from '@/utils/haptics';
import { pilihFotoDokumen, simpanFotoDokumenLokal } from '@/utils/localDocumentPhoto';
import {
  aturBiayaPerpanjangan,
  formatRupiah,
  parseInputRupiah,
} from '@/utils/renewalBudget';
import { useVoiceDictation } from '@/utils/speechRecognition';

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
  const [estimasiBiayaInput, setEstimasiBiayaInput] = useState('');
  const [fotoUriSementara, setFotoUriSementara] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetDikte, setTargetDikte] = useState<'judul' | 'catatan' | null>(null);

  const { isListening, startListening, stopListening } = useVoiceDictation({
    lang: 'id-ID',
    onTranscript: (teks) => {
      if (targetDikte === 'judul') {
        setJudul(teks);
      } else if (targetDikte === 'catatan') {
        setCatatan(teks);
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

  // Jika parameter template diberikan dari Beranda, langsung set judul default
  useEffect(() => {
    if (params.template) {
      setTemplate(params.template);
      const kat = getKategori(params.template);
      setJudul(kat.label);
    }
  }, [params.template]);

  const onPilihTemplate = (val: TemplateType) => {
    haptic.selection();
    setTemplate(val);
    const kat = getKategori(val);
    if (judul.trim() === '' || KATEGORI.some((k) => k.label === judul.trim())) {
      setJudul(kat.label);
    }
    // Set siklus umum bila ada
    if (val === 'sim') {
      setSiklus('60'); // 5 tahun
      if (!estimasiBiayaInput) setEstimasiBiayaInput('200000');
    } else if (val === 'stnk' || val === 'pajak_kendaraan') {
      setSiklus('12'); // 1 tahun
      if (!estimasiBiayaInput) setEstimasiBiayaInput('350000');
    } else if (val === 'paspor') {
      setSiklus('120'); // 10 tahun
      if (!estimasiBiayaInput) setEstimasiBiayaInput('650000');
    }
  };

  const onAmbilFoto = async (sumber: 'kamera' | 'galeri') => {
    haptic.light();
    const res = await pilihFotoDokumen(sumber);
    if (res.dibatalkan) return;
    if (!res.berhasil || !res.uri) {
      haptic.warning();
      if (res.pesan) Alert.alert('Foto Dokumen', res.pesan);
      return;
    }
    haptic.success();
    setFotoUriSementara(res.uri);
  };

  const onUbahTanggal = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setTampilPicker(false);
    if (event.type === 'set' && selected) setTanggal(selected);
  };

  const simpan = async () => {
    setError(null);
    const judulBersih = judul.trim();
    if (!template) {
      haptic.warning();
      setError('Pilih jenis dokumen terlebih dahulu.');
      return;
    }
    if (judulBersih.length < 1 || judulBersih.length > 100) {
      haptic.warning();
      setError('Judul dokumen wajib diisi (1 - 100 karakter).');
      return;
    }
    let siklusBulan: number | null = null;
    if (siklus.trim() !== '') {
      const n = Number(siklus);
      if (!Number.isInteger(n) || n <= 0) {
        haptic.warning();
        setError('Siklus perpanjangan harus berupa bilangan bulat lebih dari 0.');
        return;
      }
      siklusBulan = n;
    }

    haptic.medium();
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
      haptic.error();
      setError(hasil.error);
      return;
    }

    // Simpan estimasi biaya & foto fisik lokal jika ada
    if (hasil.id) {
      const nominalBiaya = parseInputRupiah(estimasiBiayaInput);
      if (nominalBiaya) {
        await aturBiayaPerpanjangan(hasil.id, nominalBiaya);
      }
      if (fotoUriSementara) {
        await simpanFotoDokumenLokal(hasil.id, fotoUriSementara);
      }
    }

    haptic.success();
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
            onPress={() => {
              haptic.light();
              router.back();
            }}
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
                style={({ pressed }) => [
                  styles.templateCard,
                  pressed && styles.cardPressed,
                ]}
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
            onPress={() => {
              haptic.light();
              router.back();
            }}
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
              onPress={() => {
                haptic.light();
                setTemplate(null);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.btnGantiTemplateText}>Ubah</Text>
            </Pressable>
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

          {/* Input Judul */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Nama / Label Dokumen *</Text>
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
            <Pressable
              style={styles.inputPressable}
              onPress={() => {
                haptic.selection();
                setTampilPicker((prev) => !prev);
              }}
            >
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

          {/* Estimasi Biaya Perpanjangan (Opsional) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>💰 Estimasi Biaya Perpanjangan (Opsional)</Text>
            <TextInput
              style={styles.input}
              value={estimasiBiayaInput}
              onChangeText={(t) => setEstimasiBiayaInput(t.replace(/[^\d.]/g, ''))}
              placeholder="Contoh: 250000 (untuk Rp 250.000)"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
            />
            {parseInputRupiah(estimasiBiayaInput) !== null && (
              <Text style={styles.biayaPreviewText}>
                Terbaca: {formatRupiah(parseInputRupiah(estimasiBiayaInput) ?? 0)}
              </Text>
            )}
            <View style={styles.siklusChipsRow}>
              {[150000, 250000, 650000].map((nom) => {
                const aktif = parseInputRupiah(estimasiBiayaInput) === nom;
                return (
                  <Pressable
                    key={nom}
                    style={[styles.siklusChip, aktif && styles.siklusChipActive]}
                    onPress={() => {
                      haptic.selection();
                      setEstimasiBiayaInput(String(nom));
                    }}
                  >
                    <Text style={[styles.siklusChipText, aktif && styles.siklusChipTextActive]}>
                      {formatRupiah(nom)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Lampirkan Foto Fisik Dokumen secara Lokal */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>📷 Foto Fisik Dokumen (Tersimpan Lokal di HP)</Text>
            <Text style={styles.subLabelPrivacy}>
              🔒 Zero-PII: Foto tersimpan 100% di memori iPhone dan tidak pernah diunggah ke server.
            </Text>

            {fotoUriSementara ? (
              <View style={styles.fotoPreviewCard}>
                <Image
                  source={{ uri: fotoUriSementara }}
                  style={styles.fotoPreviewImg}
                  contentFit="cover"
                />
                <View style={styles.fotoActionRow}>
                  <Pressable
                    style={({ pressed }) => [styles.btnFotoKecil, pressed && styles.btnPressed]}
                    onPress={() => onAmbilFoto('kamera')}
                  >
                    <Text style={styles.btnFotoKecilText}>📸 Foto Ulang</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.btnFotoKecil, pressed && styles.btnPressed]}
                    onPress={() => onAmbilFoto('galeri')}
                  >
                    <Text style={styles.btnFotoKecilText}>🖼️ Ganti Galeri</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btnFotoKecil,
                      styles.btnFotoHapus,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => {
                      haptic.light();
                      setFotoUriSementara(null);
                    }}
                  >
                    <Text style={styles.btnFotoHapusText}>🗑️ Hapus</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.fotoPickRow}>
                <Pressable
                  style={({ pressed }) => [styles.btnPilihFoto, pressed && styles.btnPressed]}
                  onPress={() => onAmbilFoto('kamera')}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnPilihFotoIcon}>📸</Text>
                  <Text style={styles.btnPilihFotoText}>Ambil dari Kamera</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.btnPilihFoto, pressed && styles.btnPressed]}
                  onPress={() => onAmbilFoto('galeri')}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnPilihFotoIcon}>🖼️</Text>
                  <Text style={styles.btnPilihFotoText}>Pilih dari Galeri</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Catatan Tambahan */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
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
              style={({ pressed }) => [
                styles.btnSimpan,
                menyimpan && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              onPress={simpan}
              disabled={menyimpan}
              accessibilityRole="button"
            >
              <Text style={styles.btnSimpanText}>
                {menyimpan ? 'Menyimpan Dokumen…' : 'Simpan Dokumen'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btnBatal, pressed && styles.btnPressed]}
              onPress={() => {
                haptic.light();
                router.back();
              }}
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
  biayaPreviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  subLabelPrivacy: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  fotoPickRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnPilihFoto: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  btnPilihFotoIcon: {
    fontSize: 16,
  },
  btnPilihFotoText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  fotoPreviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginTop: 4,
  },
  fotoPreviewImg: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  fotoActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnFotoKecil: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnFotoKecilText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  btnFotoHapus: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  btnFotoHapusText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
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
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
});
