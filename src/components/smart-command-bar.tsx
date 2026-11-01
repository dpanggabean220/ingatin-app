import { type ComponentRef, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { tambahPengingatKilat } from '@/features/quick-reminders/quickReminders';
import { parseCommand } from '@/utils/commandParser';
import { haptic } from '@/utils/haptics';
import { useVoiceDictation } from '@/utils/speechRecognition';

interface SmartCommandBarProps {
  /** Dipanggil setelah pengingat berhasil dipasang */
  onDitambahkan?: () => void;
}

const CONTOH_PERINTAH = ['jam 1 makan siang', 'sore ini jemput adik', '30 menit lagi angkat jemuran'];

/**
 * Bar perintah pintar untuk memasang "Pengingat Kilat" dari kalimat sehari-hari.
 * Aman di Expo Go: dikte utama memakai mikrofon bawaan keyboard iPhone,
 * modul speech recognition native hanya dipakai jika tersedia.
 */
export function SmartCommandBar({ onDitambahkan }: SmartCommandBarProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [teks, setTeks] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);

  const { isListening, isAvailable, startListening, stopListening } = useVoiceDictation({
    lang: 'id-ID',
    onTranscript: setTeks,
  });

  // Live preview: parse ulang setiap teks berubah
  const hasil = useMemo(() => (teks.trim() ? parseCommand(teks) : null), [teks]);

  const onTekanMic = () => {
    if (isListening) {
      stopListening();
      return;
    }
    if (!isAvailable) {
      haptic.light();
      Alert.alert(
        '🎙️ Dikte Lewat Keyboard',
        'Ketuk kolom perintah, lalu tekan ikon mikrofon di pojok kanan bawah keyboard iPhone dan ucapkan perintahmu.\n\nContoh: "Ingatin gua jam 1 makan siang".',
        [{ text: 'Mengerti', onPress: () => inputRef.current?.focus() }]
      );
      return;
    }
    startListening();
  };

  const onPasang = async () => {
    // Parse ulang saat submit agar acuan "sekarang" selalu terbaru
    const final = parseCommand(teks);
    if (!final.valid || !final.waktu) {
      haptic.warning();
      Alert.alert('Perintah Belum Lengkap', final.alasan ?? 'Coba sebutkan tugas dan jamnya.');
      return;
    }

    setMenyimpan(true);
    haptic.medium();
    const res = await tambahPengingatKilat({
      judul: final.judul,
      waktu: final.waktu,
      kalimatAsli: teks,
    });
    setMenyimpan(false);

    if (!res.berhasil) {
      haptic.error();
      Alert.alert('Gagal Memasang Pengingat', res.pesan);
      return;
    }

    haptic.success();
    Alert.alert('⚡ Pengingat Terpasang!', `${final.judul}\n⏰ ${final.labelWaktu}`);
    setTeks('');
    inputRef.current?.blur();
    onDitambahkan?.();
  };

  const bisaPasang = !!hasil?.valid && !menyimpan;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerIcon}>⚡</Text>
        <Text style={styles.headerTitle}>Pengingat Kilat</Text>
      </View>

      <View style={[styles.inputRow, isListening && styles.inputRowListening]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={teks}
          onChangeText={setTeks}
          placeholder={'🎙️ Ketuk & ucapkan: "Ingatin gua jam 1 makan siang"...'}
          placeholderTextColor="#6B7280"
          returnKeyType="done"
          onSubmitEditing={() => bisaPasang && onPasang()}
          autoCorrect={false}
          autoCapitalize="none"
          multiline={false}
          accessibilityLabel="Perintah pengingat kilat"
        />
        <Pressable
          style={({ pressed }) => [
            styles.micButton,
            isListening && styles.micButtonActive,
            pressed && styles.pressed,
          ]}
          onPress={onTekanMic}
          accessibilityRole="button"
          accessibilityLabel={isListening ? 'Hentikan dikte' : 'Dikte suara'}
        >
          <Text style={styles.micIcon}>{isListening ? '⏹️' : '🎙️'}</Text>
        </Pressable>
      </View>

      {/* Live Preview Badge */}
      {hasil ? (
        hasil.valid ? (
          <View style={[styles.preview, styles.previewValid]}>
            <Text style={styles.previewValidText} numberOfLines={2}>
              📌 Tugas: <Text style={styles.bold}>{hasil.judul}</Text>
              {'  |  '}⏰ <Text style={styles.bold}>{hasil.labelWaktu}</Text>
            </Text>
          </View>
        ) : (
          <View style={[styles.preview, styles.previewWarn]}>
            <Text style={styles.previewWarnText} numberOfLines={2}>
              ⚠️ {hasil.alasan}
              {hasil.judul ? `  (Tugas: ${hasil.judul})` : ''}
            </Text>
          </View>
        )
      ) : (
        <View style={styles.contohRow}>
          {CONTOH_PERINTAH.map((c) => (
            <Pressable
              key={c}
              style={({ pressed }) => [styles.contohChip, pressed && styles.pressed]}
              onPress={() => {
                haptic.selection();
                setTeks(`ingatin ${c}`);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.contohChipText}>{c}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {hasil && (
        <Pressable
          style={({ pressed }) => [
            styles.btnPasang,
            !bisaPasang && styles.btnDisabled,
            pressed && bisaPasang && styles.pressed,
          ]}
          onPress={onPasang}
          disabled={!bisaPasang}
          accessibilityRole="button"
          accessibilityLabel="Pasang pengingat"
        >
          {menyimpan ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.btnPasangText}>⚡ Pasang Pengingat</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIcon: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.surfaceContainerLow,
    paddingLeft: 14,
    paddingRight: 6,
  },
  inputRowListening: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F3FF',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 12,
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  micButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  micIcon: {
    fontSize: 17,
  },
  preview: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
  },
  previewValid: {
    backgroundColor: '#F5F3FF',
    borderColor: Colors.primaryLight,
  },
  previewValidText: {
    fontSize: 13,
    color: Colors.primaryDark,
  },
  previewWarn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  previewWarnText: {
    fontSize: 13,
    color: '#B45309',
  },
  bold: {
    fontWeight: '800',
  },
  contohRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  contohChip: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  contohChipText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  btnPasang: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPasangText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});

