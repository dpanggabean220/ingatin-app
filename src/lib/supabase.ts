import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import type { Database } from '../types/database';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || 'https://offline-placeholder.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'offline-placeholder-anon-key';

// Fallback memory storage untuk SSR (Node.js build-time) jika window/localStorage belum ada
const memoryStorage: Record<string, string> = {};
const safeStorage =
  Platform.OS === 'web' && typeof window === 'undefined'
    ? {
        getItem: async (key: string) => memoryStorage[key] ?? null,
        setItem: async (key: string, value: string) => {
          memoryStorage[key] = value;
        },
        removeItem: async (key: string) => {
          delete memoryStorage[key];
        },
      }
    : AsyncStorage;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: Platform.OS !== 'web' || typeof window !== 'undefined',
    persistSession: Platform.OS !== 'web' || typeof window !== 'undefined',
    detectSessionInUrl: false,
  },
});

/**
 * Pantau status aplikasi dan kelola auto-refresh token:
 * - Aktif (foreground) → startAutoRefresh()
 * - Tidak aktif (background/inactive) → stopAutoRefresh()
 */
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

