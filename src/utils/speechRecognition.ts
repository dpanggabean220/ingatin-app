import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

import { haptic } from '@/utils/haptics';

export interface UseVoiceDictationOptions {
  onTranscript: (text: string) => void;
  lang?: string;
}

// ---------------------------------------------------------------------------
// Pengecekan Aman pada Tingkat Global / Inisialisasi
// ---------------------------------------------------------------------------
// requireOptionalNativeModule mengembalikan null jika modul belum ada di binary
// (seperti saat berjalan di Expo Go standar) dan TIDAK PERNAH melempar error.
let nativeSpeechAvailable = false;
let nativeSpeechModule: any = null;

try {
  if (Platform.OS !== 'web') {
    const nativeMod = requireOptionalNativeModule('ExpoSpeechRecognition');
    if (nativeMod) {
      // Modul native ada (Development Build / Standalone iOS/Android)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require('expo-speech-recognition');
      nativeSpeechModule = pkg.ExpoSpeechRecognitionModule ?? nativeMod;
      nativeSpeechAvailable = true;
    }
  }
} catch {
  // Jika terjadi kendala saat require, tangkap dengan aman
  nativeSpeechAvailable = false;
  nativeSpeechModule = null;
}

/**
 * Memeriksa apakah modul Speech Recognition tersedia dan didukung pada perangkat ini.
 * Mengembalikan false secara aman jika dibuka di Expo Go atau web.
 */
export function isSpeechRecognitionAvailable(): boolean {
  if (!nativeSpeechAvailable || !nativeSpeechModule) {
    return false;
  }
  try {
    if (typeof nativeSpeechModule.isRecognitionAvailable === 'function') {
      return nativeSpeechModule.isRecognitionAvailable();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook kustom untuk dikte suara (Voice Dictation / Speech-to-Text).
 * Sepenuhnya aman digunakan di Expo Go maupun Development Build native.
 */
export function useVoiceDictation({
  onTranscript,
  lang = 'id-ID',
}: UseVoiceDictationOptions) {
  const [isListening, setIsListening] = useState(false);
  const callbackRef = useRef(onTranscript);
  callbackRef.current = onTranscript;

  useEffect(() => {
    if (
      !nativeSpeechAvailable ||
      !nativeSpeechModule ||
      typeof nativeSpeechModule.addListener !== 'function'
    ) {
      return;
    }

    let subStart: { remove?: () => void } | undefined;
    let subResult: { remove?: () => void } | undefined;
    let subEnd: { remove?: () => void } | undefined;
    let subError: { remove?: () => void } | undefined;

    try {
      subStart = nativeSpeechModule.addListener('start', () => {
        setIsListening(true);
      });

      subResult = nativeSpeechModule.addListener('result', (event: any) => {
        const latestTranscript = event?.results?.[0]?.transcript;
        if (latestTranscript) {
          callbackRef.current(latestTranscript);
        }
      });

      subEnd = nativeSpeechModule.addListener('end', () => {
        setIsListening(false);
        haptic.success();
      });

      subError = nativeSpeechModule.addListener('error', (event: any) => {
        setIsListening(false);
        if (event?.error === 'no-speech' || event?.error === 'aborted') {
          return;
        }
        haptic.warning();
      });
    } catch (err) {
      console.warn('[Speech Recognition] Gagal memasang event listener:', err);
    }

    return () => {
      subStart?.remove?.();
      subResult?.remove?.();
      subEnd?.remove?.();
      subError?.remove?.();
    };
  }, []);

  const startListening = useCallback(async () => {
    // 1. Pengecekan aman jika modul native tidak tersedia (seperti di Expo Go standar)
    if (!nativeSpeechAvailable || !nativeSpeechModule || !isSpeechRecognitionAvailable()) {
      haptic.warning();
      Alert.alert(
        'Fitur Dikte Suara',
        'Pengenalan suara on-device memerlukan instalasi build native (Development Build) dan belum didukung langsung di dalam Expo Go.\n\nSilakan gunakan input teks untuk saat ini.',
        [{ text: 'Mengerti' }]
      );
      return;
    }

    // 2. Minta izin mikrofon dan pengenalan suara
    try {
      const permission = await nativeSpeechModule.requestPermissionsAsync();
      if (!permission.granted) {
        haptic.warning();
        Alert.alert(
          'Izin Mikrofon Diperlukan',
          'INGATIN memerlukan izin mikrofon dan pengenalan suara untuk mendiktekan teks dokumen. Silakan aktifkan izin di Pengaturan HP-mu.',
          [{ text: 'Nanti Saja' }]
        );
        return;
      }

      haptic.medium();
      setIsListening(true);

      nativeSpeechModule.start({
        lang,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
      });
    } catch (err) {
      setIsListening(false);
      haptic.error();
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Speech Recognition] Gagal memulai:', msg);
      Alert.alert(
        'Fitur Dikte Suara',
        'Pengenalan suara on-device belum aktif di lingkungan saat ini. Silakan gunakan input teks biasa.',
        [{ text: 'Mengerti' }]
      );
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    try {
      if (nativeSpeechAvailable && nativeSpeechModule && typeof nativeSpeechModule.stop === 'function') {
        haptic.light();
        nativeSpeechModule.stop();
      }
    } catch (err) {
      console.warn('[Speech Recognition] Gagal menghentikan:', err);
    } finally {
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isAvailable: isSpeechRecognitionAvailable(),
    startListening,
    stopListening,
    toggleListening,
  };
}
