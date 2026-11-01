import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type {
  ExpoSpeechRecognitionModuleType,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule.types';

import { haptic } from '@/utils/haptics';

export interface UseVoiceDictationOptions {
  onTranscript: (text: string) => void;
  lang?: string;
}

/**
 * Mengakses modul native speech recognition secara aman tanpa memicu crash jika
 * modul belum dikompilasi (misalnya saat aplikasi dijalankan di Expo Go standar).
 */
function getNativeSpeechModule(): ExpoSpeechRecognitionModuleType | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('expo-speech-recognition');
    if (pkg && pkg.ExpoSpeechRecognitionModule) {
      return pkg.ExpoSpeechRecognitionModule as ExpoSpeechRecognitionModuleType;
    }
    return null;
  } catch {
    // Tangkap error jika modul native tidak ditemukan di Expo Go
    return null;
  }
}

/**
 * Memeriksa apakah modul Speech Recognition tersedia dan didukung pada perangkat ini.
 */
export function isSpeechRecognitionAvailable(): boolean {
  try {
    const nativeModule = getNativeSpeechModule();
    if (!nativeModule || typeof nativeModule.isRecognitionAvailable !== 'function') {
      return false;
    }
    return nativeModule.isRecognitionAvailable();
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
    const nativeModule = getNativeSpeechModule();
    if (!nativeModule || typeof (nativeModule as unknown as { addListener?: unknown }).addListener !== 'function') {
      return;
    }

    let subStart: { remove?: () => void } | undefined;
    let subResult: { remove?: () => void } | undefined;
    let subEnd: { remove?: () => void } | undefined;
    let subError: { remove?: () => void } | undefined;

    try {
      const emitter = nativeModule as unknown as {
        addListener: (event: string, cb: (...args: unknown[]) => void) => { remove: () => void };
      };

      subStart = emitter.addListener('start', () => {
        setIsListening(true);
      });

      subResult = emitter.addListener('result', (event: unknown) => {
        const resultEvent = event as ExpoSpeechRecognitionResultEvent;
        const latestTranscript = resultEvent.results?.[0]?.transcript;
        if (latestTranscript) {
          callbackRef.current(latestTranscript);
        }
      });

      subEnd = emitter.addListener('end', () => {
        setIsListening(false);
        haptic.success();
      });

      subError = emitter.addListener('error', (event: unknown) => {
        setIsListening(false);
        const errEvent = event as { error?: string };
        if (errEvent?.error === 'no-speech' || errEvent?.error === 'aborted') {
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
    try {
      const nativeModule = getNativeSpeechModule();

      // Pengecekan aman jika modul native tidak tersedia (misal di Expo Go)
      if (!nativeModule || !isSpeechRecognitionAvailable()) {
        haptic.warning();
        Alert.alert(
          'Fitur Dikte Suara',
          'Pengenalan suara on-device memerlukan instalasi build native (Development Build) dan belum didukung langsung di dalam Expo Go.\n\nSilakan gunakan input teks untuk saat ini.',
          [{ text: 'Mengerti' }]
        );
        return;
      }

      // Minta izin mikrofon dan pengenalan suara
      const permission = await nativeModule.requestPermissionsAsync();
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

      nativeModule.start({
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
      const nativeModule = getNativeSpeechModule();
      if (nativeModule && typeof nativeModule.stop === 'function') {
        haptic.light();
        nativeModule.stop();
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
