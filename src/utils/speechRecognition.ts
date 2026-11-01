import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import { haptic } from '@/utils/haptics';

export interface UseVoiceDictationOptions {
  onTranscript: (text: string) => void;
  lang?: string;
}

/**
 * Memeriksa apakah modul Speech Recognition tersedia dan didukung pada perangkat ini.
 */
export function isSpeechRecognitionAvailable(): boolean {
  try {
    if (Platform.OS === 'web') return false;
    if (!ExpoSpeechRecognitionModule || typeof ExpoSpeechRecognitionModule.isRecognitionAvailable !== 'function') {
      return false;
    }
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

/**
 * Hook kustom untuk dikte suara (Voice Dictation / Speech-to-Text).
 * Dilengkapi fallback aman agar tidak crash di Expo Go atau environment tanpa modul native.
 */
export function useVoiceDictation({
  onTranscript,
  lang = 'id-ID',
}: UseVoiceDictationOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const callbackRef = useRef(onTranscript);
  callbackRef.current = onTranscript;

  useEffect(() => {
    try {
      const available = isSpeechRecognitionAvailable();
      setIsAvailable(available);
    } catch {
      setIsAvailable(false);
    }
  }, []);

  // Event listener hasil ucapan (hanya aktif jika didukung)
  try {
    useSpeechRecognitionEvent('start', () => {
      setIsListening(true);
    });

    useSpeechRecognitionEvent('result', (event) => {
      const latestTranscript = event.results?.[0]?.transcript;
      if (latestTranscript) {
        callbackRef.current(latestTranscript);
      }
    });

    useSpeechRecognitionEvent('end', () => {
      setIsListening(false);
      haptic.success();
    });

    useSpeechRecognitionEvent('error', (event) => {
      setIsListening(false);
      // Abaikan error "no-speech" atau "aborted" biasa saat pengguna diam atau membatalkan
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      haptic.warning();
      console.warn('[Speech Recognition] Terjadi kesalahan:', event.message || event.error);
    });
  } catch (err) {
    // Fallback jika listener gagal didaftarkan
    console.warn('[Speech Recognition] Listener native tidak aktif:', err);
  }

  const startListening = useCallback(async () => {
    try {
      // 1. Periksa ketersediaan modul native
      if (!isSpeechRecognitionAvailable()) {
        haptic.warning();
        Alert.alert(
          'Dikte Suara Tidak Tersedia',
          'Pengenalan suara on-device memerlukan instalasi build native perangkat (Development Build / iOS Standalone). Fitur ini belum aktif di lingkungan pengujian saat ini.',
          [{ text: 'Mengerti' }]
        );
        return;
      }

      // 2. Minta izin mikrofon & speech recognition
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        haptic.warning();
        Alert.alert(
          'Izin Mikrofon Diperlukan',
          'INGATIN memerlukan izin mikrofon dan pengenalan suara untuk mendiktekan teks dokumen. Silakan aktifkan izin di Pengaturan HP-mu.',
          [{ text: 'Nanti Saja' }]
        );
        return;
      }

      // 3. Mulai mendengarkan suara
      haptic.medium();
      setIsListening(true);

      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false, // fleksibel: gunakan on-device jika ada, online jika perlu
      });
    } catch (err) {
      setIsListening(false);
      haptic.error();
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Speech Recognition] Gagal memulai:', msg);
      Alert.alert(
        'Gagal Memulai Dikte Suara',
        'Terjadi kendala saat mengaktifkan mikrofon. Silakan coba kembali.'
      );
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    try {
      if (isListening && ExpoSpeechRecognitionModule && typeof ExpoSpeechRecognitionModule.stop === 'function') {
        haptic.light();
        ExpoSpeechRecognitionModule.stop();
      }
    } catch (err) {
      console.warn('[Speech Recognition] Gagal menghentikan:', err);
    } finally {
      setIsListening(false);
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isAvailable,
    startListening,
    stopListening,
    toggleListening,
  };
}
