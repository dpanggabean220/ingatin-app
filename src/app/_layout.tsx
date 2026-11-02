import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { SessionProvider } from '@/features/auth/SessionProvider';
import {
  daftarkanKategoriNotifikasiKilat,
  tanganiResponNotifikasiKilat,
} from '@/features/quick-reminders/quickReminders';
import { mintaIzinNotifikasi } from '@/lib/notifications';
import { ambilStatusKunciBiometrik, verifikasiBiometrik } from '@/utils/biometricLock';
import { haptic } from '@/utils/haptics';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [terkunciBiometrik, setTerkunciBiometrik] = useState(false);

  const cobaBukaKunci = useCallback(async () => {
    const res = await verifikasiBiometrik('Buka kunci aplikasi INGATIN dengan Face ID');
    if (res.berhasil) {
      haptic.success();
      setTerkunciBiometrik(false);
    } else {
      haptic.warning();
    }
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    // 1. Minta izin notifikasi & daftarkan kategori interaktif Pengingat Kilat
    mintaIzinNotifikasi();
    daftarkanKategoriNotifikasiKilat();

    // 2. Periksa apakah kunci aplikasi Face ID / Biometrik diaktifkan pengguna
    ambilStatusKunciBiometrik().then((aktif) => {
      if (aktif) {
        setTerkunciBiometrik(true);
        cobaBukaKunci();
      }
    });

    // 3. Listener aksi notifikasi interaktif (MARK_DONE & SNOOZE_10M) dari lockscreen / banner
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      tanganiResponNotifikasiKilat(response);
    });

    return () => {
      sub.remove();
    };
  }, [cobaBukaKunci]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="tambah"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="dokumen/[id]"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </Stack>

        {terkunciBiometrik && (
          <View style={styles.lockOverlay}>
            <View style={styles.lockCard}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockTitle}>INGATIN Terkunci</Text>
              <Text style={styles.lockSubtitle}>
                Verifikasi Face ID / Biometrik diperlukan untuk mengakses dokumen dan pengingatmu.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.unlockBtn, pressed && styles.unlockBtnPressed]}
                onPress={cobaBukaKunci}
                accessibilityRole="button"
                accessibilityLabel="Buka kunci dengan Face ID"
              >
                <Text style={styles.unlockBtnText}>Buka dengan Face ID</Text>
              </Pressable>
            </View>
          </View>
        )}
      </SessionProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(25, 27, 39, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 9999,
  },
  lockCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2DEF5',
  },
  lockIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#191B27',
  },
  lockSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  unlockBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  unlockBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
