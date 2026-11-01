import { Image } from 'expo-image';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { haptic } from '@/utils/haptics';

const SVG_HOME_ACTIVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6D4AFF"><path d="M12 3.2 3 10.5V20a1 1 0 0 0 1 1h5.5v-6h5v6H20a1 1 0 0 0 1-1v-9.5L12 3.2z"/></svg>`;
const SVG_HOME_INACTIVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>`;

const SVG_DOC_ACTIVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6D4AFF"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM8 12h8v1.8H8V12zm0 4h8v1.8H8V16zm0-8h3v1.8H8V8z"/></svg>`;
const SVG_DOC_INACTIVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="11" y2="9"/></svg>`;

const SVG_GEAR_ACTIVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const SVG_GEAR_INACTIVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

export default function AppTabs() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ state }) => {
        const activeRoute = state.routes[state.index]?.name ?? 'index';

        const goTab = (path: '/' | '/dokumen' | '/pengaturan') => {
          haptic.selection();
          router.navigate(path);
        };

        return (
          <View
            style={[
              styles.tabBar,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            {/* Tab 1: Beranda */}
            <Pressable
              style={styles.tabItem}
              onPress={() => goTab('/')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeRoute === 'index' }}
            >
              <Image
                source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(activeRoute === 'index' ? SVG_HOME_ACTIVE : SVG_HOME_INACTIVE)}` }}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeRoute === 'index' && styles.tabLabelActive,
                ]}
              >
                Beranda
              </Text>
              {activeRoute === 'index' && <View style={styles.activeIndicator} />}
            </Pressable>

            {/* Tab 2: Dokumen */}
            <Pressable
              style={styles.tabItem}
              onPress={() => goTab('/dokumen')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeRoute === 'dokumen' }}
            >
              <Image
                source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(activeRoute === 'dokumen' ? SVG_DOC_ACTIVE : SVG_DOC_INACTIVE)}` }}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeRoute === 'dokumen' && styles.tabLabelActive,
                ]}
              >
                Dokumen
              </Text>
              {activeRoute === 'dokumen' && <View style={styles.activeIndicator} />}
            </Pressable>

            {/* Tombol Tengah Mengambang (+) */}
            <View style={styles.plusWrap}>
              <Pressable
                style={({ pressed }) => [
                  styles.plusButton,
                  pressed && styles.plusPressed,
                ]}
                onPress={() => {
                  haptic.medium();
                  router.push('/tambah');
                }}
                accessibilityRole="button"
                accessibilityLabel="Tambah Dokumen"
              >
                <Text style={styles.plusText}>+</Text>
              </Pressable>
            </View>

            {/* Tab 3: Pengaturan */}
            <Pressable
              style={styles.tabItem}
              onPress={() => goTab('/pengaturan')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeRoute === 'pengaturan' }}
            >
              <Image
                source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(activeRoute === 'pengaturan' ? SVG_GEAR_ACTIVE : SVG_GEAR_INACTIVE)}` }}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeRoute === 'pengaturan' && styles.tabLabelActive,
                ]}
              >
                Pengaturan
              </Text>
              {activeRoute === 'pengaturan' && <View style={styles.activeIndicator} />}
            </Pressable>
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="dokumen" />
      <Tabs.Screen name="pengaturan" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF5',
    shadowColor: '#191B27',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
    position: 'relative',
  },
  tabIcon: {
    width: 22,
    height: 22,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  plusWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 6,
  },
  plusPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.92,
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 32,
  },
});
