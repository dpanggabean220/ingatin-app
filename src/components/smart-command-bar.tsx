import { Image } from 'expo-image';
import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
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

const SVG_MIC_WHITE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V20h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0z"/></svg>`;

const KALIMAT_CONTOH_DEFAULT = 'Ingatin gua jam 1 makan siang';

interface SmartCommandBarProps {
  /** Dipanggil setelah pengingat berhasil dipasang */
  onDitambahkan?: () => void;
  /** Bila true, tampil menyatu di dalam Hero Card tanpa border/header ganda */
  embedded?: boolean;
}

/**
 * Bar perintah pintar untuk memasang "Pengingat Kilat" dari kalimat sehari-hari.
 * Aman di Expo Go: dikte utama memakai mikrofon bawaan keyboard iPhone,
 * modul speech recognition native hanya dipakai jika tersedia.
 */
export function SmartCommandBar({ onDitambahkan, embedded = false }: SmartCommandBarProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const tipsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [teks, setTeks] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [tampilTipsIos, setTampilTipsIos] = useState(false);

  useEffect(() => {
    return () => {
      if (tipsTimerRef.current) clearTimeout(tipsTimerRef.current);
    };
  }, []);

  const { isListening, isAvailable, startListening, stopListening } = useVoiceDictation({
    lang: 'id-ID',
    onTranscript: setTeks,
  });

  // Live preview: bila kosong tampilkan preview contoh referensi "Tugas: Makan Siang • Hari ini, 13:00"
  const hasil = useMemo(
    () => (teks.trim() ? parseCommand(teks) : parseCommand(KALIMAT_CONTOH_DEFAULT)),
    [teks]
  );

  const onTekanMic = () => {
    if (isListening) {
      stopListening();
      return;
    }
    if (!isAvailable) {
      haptic.light();
      inputRef.current?.focus();
      setTampilTipsIos(true);
      if (tipsTimerRef.current) clearTimeout(tipsTimerRef.current);
      tipsTimerRef.current = setTimeout(() => {
        setTampilTipsIos(false);
      }, 4500);
      return;
    }
    startListening();
  };

  const onPasang = async () => {
    const sumberTeks = teks.trim() ? teks : KALIMAT_CONTOH_DEFAULT;
    const final = parseCommand(sumberTeks);
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
      kalimatAsli: sumberTeks,
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
    <View style={embedded ? styles.embeddedWrap : styles.card}>
      {/* Baris Input Pill + Tombol Mikrofon Bulat Ungu */}
      <View style={styles.topInputRow}>
        <View style={[styles.inputPill, isListening && styles.inputPillListening]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={teks}
            onChangeText={setTeks}
            placeholder="Ingatin gua jam 1 makan siang..."
            placeholderTextColor="#78758E"
            returnKeyType="done"
            onSubmitEditing={() => bisaPasang && onPasang()}
            autoCorrect={false}
            autoCapitalize="none"
            multiline={false}
            accessibilityLabel="Perintah pengingat kilat"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.micCircleBtn,
            isListening && styles.micCircleBtnActive,
            pressed && styles.pressed,
          ]}
          onPress={onTekanMic}
          accessibilityRole="button"
          accessibilityLabel={isListening ? 'Hentikan dikte' : 'Dikte suara'}
        >
          <Image
            source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_MIC_WHITE)}` }}
            style={styles.micSvg}
          />
        </Pressable>
      </View>

      {/* Banner/Toast Tips iPhone saat tombol mikrofon ditekan di Expo Go */}
      {tampilTipsIos && (
        <View style={styles.tipsBanner}>
          <Text style={styles.tipsBannerText}>
            💡 Tips iPhone: Ketuk ikon mikrofon 🎙️ di pojok kanan bawah keyboard iOS untuk mulai bicara.
          </Text>
        </View>
      )}

      {/* Baris Live Preview Badge + Tombol Pasang di Sebelah Kanan */}
      <View style={styles.previewRow}>
        {hasil.valid ? (
          <View style={styles.previewPill}>
            <Text style={styles.previewText} numberOfLines={1}>
              📌 <Text style={styles.previewLabel}>Tugas:</Text>{' '}
              <Text style={styles.previewBold}>{hasil.judul}</Text>
              {'  •  '}⏰ <Text style={styles.previewBold}>{hasil.labelWaktu}</Text>
            </Text>
          </View>
        ) : (
          <View style={[styles.previewPill, styles.previewPillWarn]}>
            <Text style={styles.previewWarnText} numberOfLines={1}>
              ⚠️ {hasil.alasan}
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.btnPasangPill,
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
            <Text style={styles.btnPasangText}>Pasang</Text>
          )}
        </Pressable>
      </View>
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
  },
  embeddedWrap: {
    gap: 10,
  },
  topInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputPill: {
    flex: 1,
    backgroundColor: '#241E1A',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#3B2D22',
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  inputPillListening: {
    borderColor: Colors.primary,
    backgroundColor: '#2D2017',
  },
  input: {
    fontSize: 13.5,
    color: '#FFFFFF',
    fontWeight: '500',
    paddingVertical: 0,
  },
  micCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  micCircleBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  micSvg: {
    width: 20,
    height: 20,
  },
  tipsBanner: {
    backgroundColor: '#2A1E16',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4D3220',
  },
  tipsBannerText: {
    fontSize: 11.5,
    color: '#FFB07B',
    fontWeight: '600',
    lineHeight: 16,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewPill: {
    flex: 1,
    backgroundColor: '#261D17',
    borderWidth: 1,
    borderColor: '#3B2B20',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewPillWarn: {
    backgroundColor: '#2D2013',
  },
  previewText: {
    fontSize: 11.5,
    color: '#D6CCC2',
  },
  previewLabel: {
    fontWeight: '600',
    color: '#A89F96',
  },
  previewBold: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewWarnText: {
    fontSize: 11.5,
    color: '#FBBF24',
    fontWeight: '600',
  },
  btnPasangPill: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  btnPasangText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
