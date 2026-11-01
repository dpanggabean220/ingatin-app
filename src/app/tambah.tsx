import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { CategoryList } from '@/components/category-list';
import { Colors } from '@/constants/colors';
import { getKategori } from '@/constants/kategori';
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
  const [template, setTemplate] = useState<TemplateType | null>(null);
  const [judul, setJudul] = useState('');
  const [tanggal, setTanggal] = useState<Date | null>(null);
  const [tampilPicker, setTampilPicker] = useState(false);
  const [siklus, setSiklus] = useState('');
  const [catatan, setCatatan] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPilihKategori = (value: TemplateType | null) => {
    setTemplate(value);
    if (value && judul.trim() === '') {
      setJudul(getKategori(value).label);
    }
  };

  const onUbahTanggal = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setTampilPicker(false);
    if (event.type === 'set' && selected) setTanggal(selected);
  };

  const simpan = async () => {
    setError(null);
    const judulBersih = judul.trim();
    if (!template) {
      setError('Pilih kategori dokumen dulu.');
      return;
    }
    if (judulBersih.length < 1 || judulBersih.length > 100) {
      setError('Judul harus diisi, maksimal 100 karakter.');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.judulLayar}>Tambah Dokumen</Text>

          <Text style={styles.label}>Kategori</Text>
          <View style={styles.kategoriWrap}>
            <CategoryList selected={template} onSelect={onPilihKategori} />
          </View>

          <Text style={styles.label}>Judul</Text>
          <TextInput
            style={styles.input}
            value={judul}
            onChangeText={setJudul}
            placeholder="Contoh: SIM A David"
            placeholderTextColor="#9CA3AF"
            maxLength={100}
          />

          <Text style={styles.label}>Tanggal jatuh tempo</Text>
          <Pressable style={styles.input} onPress={() => setTampilPicker(true)}>
            <Text style={tanggal ? styles.nilai : styles.placeholder}>
              {tanggal ? formatTanggal(keTanggalString(tanggal)) : 'Pilih tanggal'}
            </Text>
          </Pressable>
          {tampilPicker && (
            <DateTimePicker
              value={tanggal ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="light"
              accentColor="#6D4AFF"
              onChange={onUbahTanggal}
            />
          )}

          <Text style={styles.label}>Siklus perpanjangan, dalam bulan (opsional)</Text>
          <TextInput
            style={styles.input}
            value={siklus}
            onChangeText={setSiklus}
            placeholder="Contoh: 60"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Catatan (opsional)</Text>
          <TextInput
            style={[styles.input, styles.catatan]}
            value={catatan}
            onChangeText={setCatatan}
            placeholder="Catatan tambahan"
            placeholderTextColor="#9CA3AF"
            multiline
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.simpan, menyimpan && styles.simpanNonaktif]}
            onPress={simpan}
            disabled={menyimpan}
            accessibilityRole="button"
          >
            <Text style={styles.simpanText}>{menyimpan ? 'Menyimpan…' : 'Simpan'}</Text>
          </Pressable>
          <Pressable style={styles.batal} onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.batalText}>Batal</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, gap: 8 },
  judulLayar: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 8 },
  kategoriWrap: { marginHorizontal: -16 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: Colors.background,
  },
  nilai: { fontSize: 15, color: '#111827' },
  placeholder: { fontSize: 15, color: Colors.tabInactive },
  catatan: { minHeight: 80, textAlignVertical: 'top' },
  error: { color: Colors.error, fontSize: 14, marginTop: 8 },
  simpan: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  simpanNonaktif: { opacity: 0.6 },
  simpanText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  batal: { paddingVertical: 12, alignItems: 'center' },
  batalText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
});

