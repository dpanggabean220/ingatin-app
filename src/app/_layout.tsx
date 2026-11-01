import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { SessionProvider } from '@/features/auth/SessionProvider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="tambah" options={{ presentation: 'modal' }} />
          <Stack.Screen name="dokumen/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </SessionProvider>
    </ThemeProvider>
  );
}
