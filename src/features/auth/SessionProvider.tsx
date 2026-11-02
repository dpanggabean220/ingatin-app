import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

// ---------------------------------------------------------------------------
// Tipe konteks
// ---------------------------------------------------------------------------

interface SessionContextValue {
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isLoading: true,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initSession = useCallback(async () => {
    setIsLoading(true);

    try {
      // Coba ambil sesi yang sudah tersimpan di AsyncStorage
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (existingSession) {
        setSession(existingSession);
        return;
      }

      // Belum ada sesi → coba login anonim ke cloud backup (opsional)
      const { data, error: signInError } = await supabase.auth.signInAnonymously();

      if (signInError) {
        throw signInError;
      }

      setSession(data.session);
    } catch {
      // Offline-First: jika tanpa internet atau cloud belum dikonfigurasi pada standalone build,
      // tetap lanjutkan aplikasi 100% di penyimpanan lokal (session = null) tanpa memblokir layar.
      setSession(null);
    } finally {
      setIsLoading(false);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  useEffect(() => {
    initSession();

    // Pantau perubahan sesi (refresh token, dsb.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        setSession(updatedSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initSession]);

  // ----- Loading state -----
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Kembalikan sesi pengguna saat ini dan status loading. */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (ctx === undefined) {
    throw new Error('useSession harus dipakai di dalam SessionProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  errorText: {
    color: Colors.error,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

