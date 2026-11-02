import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentCard, type DocumentCardItem } from '@/components/document-card';
import {
  PerpanjangModal,
  type PerpanjangTargetItem,
} from '@/components/perpanjang-modal';
import { QuickReminderList } from '@/components/quick-reminder-list';
import { SmartCommandBar } from '@/components/smart-command-bar';
import { Colors } from '@/constants/colors';
import { useItems } from '@/features/items/useItems';
import { useQuickReminders } from '@/features/quick-reminders/useQuickReminders';
import { hitungSisaHari, tentukanStatus } from '@/lib/tanggal';
import { haptic } from '@/utils/haptics';
import {
  ambilCacheProfilPengguna,
  ambilProfilPengguna,
  buatInisialNama,
  langgananProfilPengguna,
} from '@/utils/userProfile';

const SVG_MIC_PURPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F25C05"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V20h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0z"/></svg>`;

const SVG_WAVEFORM_PURPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F25C05" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="10" x2="4" y2="14"/><line x1="8" y1="7" x2="8" y2="17"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="16" y1="7" x2="16" y2="17"/><line x1="20" y1="10" x2="20" y2="14"/></svg>`;

const SVG_CALENDAR_PURPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F25C05" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" fill="#2A1E17"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8.5" cy="14.5" r="1" fill="#F25C05"/><circle cx="12" cy="14.5" r="1" fill="#F25C05"/><circle cx="15.5" cy="14.5" r="1" fill="#F25C05"/></svg>`;

// Pemuatan aset gambar referensi kedua untuk bagian kanan kartu utama
let STATUE_CARD_ASSET: number | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  STATUE_CARD_ASSET = require('@/../assets/images/mascot-statue.png');
} catch {
  STATUE_CARD_ASSET = null;
}

export default function BerandaScreen() {
  const router = useRouter();
  const { items, loading, refresh } = useItems();
  const [targetPerpanjang, setTargetPerpanjang] = useState<DocumentCardItem | null>(null);
  const [modalPerpanjangVisible, setModalPerpanjangVisible] = useState(false);
  const [mascotImgError, setMascotImgError] = useState(false);
  const [profil, setProfil] = useState(ambilCacheProfilPengguna);

  useEffect(() => {
    ambilProfilPengguna().then(setProfil);
    return langgananProfilPengguna(setProfil);
  }, []);

  // Animasi fade-in & scale halus untuk kartu maskot 3D
  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const heroScaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(heroScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroFadeAnim, heroScaleAnim]);

  const onTekanHeroMaskot = () => {
    haptic.light();
    Animated.sequence([
      Animated.timing(heroScaleAnim, {
        toValue: 0.975,
        duration: 95,
        useNativeDriver: true,
      }),
      Animated.spring(heroScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const {
    reminders: pengingatKilat,
    refresh: refreshKilat,
    selesaikan: selesaikanKilat,
    hapus: hapusKilat,
  } = useQuickReminders();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshKilat();
    }, [refresh, refreshKilat])
  );

  // Hitung metrik ringkasan dokumen
  const itemsDenganTanggal = items.filter((i) => i.jatuh_tempo !== null);
  const kritisCount = itemsDenganTanggal.filter((i) => {
    const sisa = hitungSisaHari(i.jatuh_tempo!);
    const status = tentukanStatus(sisa);
    return status === 'kritis' || status === 'expired';
  }).length;

  const mendesakCount = itemsDenganTanggal.filter((i) => {
    const sisa = hitungSisaHari(i.jatuh_tempo!);
    return tentukanStatus(sisa) === 'mendesak';
  }).length;

  const duaTerdekat = items.slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header Bar sesuai Referensi Stitch v2.0 */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Image
            source={require('@/../assets/images/logo-bell-clock.png')}
            style={styles.logoBellImg}
            contentFit="contain"
          />
          <View>
            <Text style={styles.brandTitle}>INGATIN</Text>
            <Text style={styles.brandSubtitle}>v2.0 • Stitch Pro Edition</Text>
          </View>
        </View>

        <Pressable
          style={styles.avatarCircle}
          onPress={() => {
            haptic.selection();
            router.push('/pengaturan');
          }}
          accessibilityRole="button"
          accessibilityLabel="Profil pengguna"
        >
          <Text style={styles.avatarInitials}>{buatInisialNama(profil.namaPanggilan)}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.tengah}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================== ZONA ATAS: Sapaan + Maskot 3D + Kartu Ungu ==================== */}
          <Animated.View
            style={[
              styles.heroAnimatedWrap,
              {
                opacity: heroFadeAnim,
                transform: [{ scale: heroScaleAnim }],
              },
            ]}
          >
            <Pressable
              style={styles.heroBannerContainer}
              onPress={onTekanHeroMaskot}
              accessibilityRole="button"
              accessibilityLabel={`${items.length} dokumen terpantau, ${kritisCount} kritis, ${mendesakCount} mendekati jatuh tempo`}
            >
              <View style={styles.heroFallbackBg}>
                <View style={styles.heroFallbackPurpleCard}>
                  {/* Efek Glow Oranye Hangat seperti Foto Referensi 1 */}
                  <View style={styles.heroOrangeGlowCorner} />
                </View>
                <View style={styles.heroFallbackMascotWrap}>
                  {STATUE_CARD_ASSET && !mascotImgError ? (
                    <Image
                      source={STATUE_CARD_ASSET}
                      style={styles.heroStatueCardImg}
                      contentFit="cover"
                      onError={() => setMascotImgError(true)}
                    />
                  ) : (
                    <View style={styles.heroFallbackMascotAvatar}>
                      <Text style={styles.heroFallbackMascotEmoji}>🗿</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Sapaan Kiri Atas */}
              <View style={styles.greetingOverlay}>
                <Text style={styles.greetingTitle} numberOfLines={1}>
                  Halo, {profil.namaPanggilan} 👋
                </Text>
                <Text style={styles.greetingSubtitle} numberOfLines={1}>
                  Semoga harimu produktif!
                </Text>
              </View>

              {/* Sisi Kiri Kartu Ungu: Angka Total Dokumen Terpantau */}
              <View style={styles.summaryTitleOverlay}>
                <Text style={styles.summaryBigText} numberOfLines={2} adjustsFontSizeToFit>
                  {items.length} Dokumen{'\n'}Terpantau
                </Text>
              </View>

              {/* Sisi Kiri Bawah Kartu Ungu: Dua Pill Status (Kritis & Mendekati) */}
              <View style={styles.summaryPillsOverlay}>
                <View style={styles.pillKritis}>
                  <View style={styles.dotRed} />
                  <View>
                    <Text style={styles.pillKritisTitle}>{kritisCount} Kritis</Text>
                    <Text style={styles.pillKritisSub}>(≤7 hari)</Text>
                  </View>
                </View>

                <View style={styles.pillMendekati}>
                  <View style={styles.dotOrange} />
                  <View>
                    <Text style={styles.pillMendekatiTitle}>{mendesakCount} Mendekati</Text>
                    <Text style={styles.pillMendekatiSub}>(≤30 hari)</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* ==================== ZONA TENGAH: Pusat Perintah Suara & Kilat ==================== */}
          <View style={styles.commandCenterCard}>
            <View style={styles.commandCenterHeader}>
              <View style={styles.commandCenterLeft}>
                <Image
                  source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_MIC_PURPLE)}` }}
                  style={styles.micHeaderIcon}
                />
                <Text style={styles.commandCenterLabel}>PUSAT PERINTAH SUARA & KILAT</Text>
              </View>
              <Image
                source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_WAVEFORM_PURPLE)}` }}
                style={styles.waveHeaderIcon}
              />
            </View>

            <SmartCommandBar embedded onDitambahkan={refreshKilat} />

            <QuickReminderList
              embedded
              reminders={pengingatKilat}
              onSelesai={selesaikanKilat}
              onHapus={hapusKilat}
            />
          </View>

          {/* ==================== ZONA BAWAH: Dokumen Jatuh Tempo Terdekat ==================== */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Image
                source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_CALENDAR_PURPLE)}` }}
                style={styles.calendarIcon}
              />
              <Text style={styles.sectionTitle}>Dokumen Jatuh Tempo Terdekat</Text>
            </View>

            <Pressable
              onPress={() => {
                haptic.selection();
                router.push('/dokumen');
              }}
              accessibilityRole="button"
            >
              <Text style={styles.lihatSemuaText}>Lihat Semua ›</Text>
            </Pressable>
          </View>

          <View style={styles.twoColGrid}>
            {duaTerdekat.map((item) => (
              <DocumentCard
                key={item.id}
                item={item}
                miniGrid
                onPress={(id) => {
                  router.push({ pathname: '/dokumen/[id]', params: { id } });
                }}
                onPerpanjang={(target) => {
                  if (target.id.startsWith('ref-')) {
                    Alert.alert('Contoh Dokumen', 'Tambahkan dokumen aslimu lewat tombol + di bawah untuk memperpanjang masa berlaku.');
                  } else {
                    setTargetPerpanjang(target);
                    setModalPerpanjangVisible(true);
                  }
                }}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Modal Perpanjangan Cepat */}
      <PerpanjangModal
        visible={modalPerpanjangVisible}
        item={targetPerpanjang as PerpanjangTargetItem}
        onClose={() => {
          setModalPerpanjangVisible(false);
          setTargetPerpanjang(null);
        }}
        onSuccess={() => {
          Alert.alert('Berhasil', 'Dokumen berhasil diperpanjang!');
          refresh();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: Colors.canvas,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBellImg: {
    width: 38,
    height: 38,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 20,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A1F18',
    borderWidth: 1,
    borderColor: '#4A3020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Hero Banner (Greeting + Statue Image + Obsidian Orange Glow Card)
  heroAnimatedWrap: {
    width: '100%',
    marginBottom: 10,
  },
  heroBannerContainer: {
    width: '100%',
    aspectRatio: 404 / 256,
    position: 'relative',
  },
  heroFallbackBg: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  heroFallbackPurpleCard: {
    width: '100%',
    height: '66%',
    backgroundColor: '#1B1714',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3E2B1D',
    overflow: 'hidden',
    shadowColor: '#F25C05',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
  heroOrangeGlowCorner: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(242, 92, 5, 0.22)',
  },
  heroFallbackMascotWrap: {
    position: 'absolute',
    right: '4%',
    bottom: '5%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatueCardImg: {
    width: 124,
    height: 146,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F25C05',
  },
  heroFallbackMascotAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(242, 92, 5, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(242, 92, 5, 0.45)',
  },
  heroFallbackMascotEmoji: {
    fontSize: 64,
  },
  greetingOverlay: {
    position: 'absolute',
    top: '4%',
    left: '2%',
    maxWidth: '58%',
  },
  greetingTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 12.5,
    color: '#A89F96',
    fontWeight: '500',
    marginTop: 2,
  },
  summaryTitleOverlay: {
    position: 'absolute',
    top: '38%',
    left: '6%',
    maxWidth: '54%',
  },
  summaryBigText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 27,
    letterSpacing: -0.4,
  },
  summaryPillsOverlay: {
    position: 'absolute',
    bottom: '8.5%',
    left: '5.5%',
    maxWidth: '62%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillKritis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2E1618',
    borderWidth: 1,
    borderColor: '#5C2327',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dotRed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  pillKritisTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FCA5A5',
    lineHeight: 13,
  },
  pillKritisSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#F87171',
    lineHeight: 12,
  },
  pillMendekati: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2E2012',
    borderWidth: 1,
    borderColor: '#664019',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dotOrange: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
  },
  pillMendekatiTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FCD34D',
    lineHeight: 13,
  },
  pillMendekatiSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#FBBF24',
    lineHeight: 12,
  },

  // Unified Pusat Perintah Suara & Kilat Card
  commandCenterCard: {
    backgroundColor: '#1B1815',
    borderRadius: 22,
    padding: 15,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#33261D',
    shadowColor: '#F25C05',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  commandCenterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commandCenterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  micHeaderIcon: {
    width: 18,
    height: 18,
  },
  waveHeaderIcon: {
    width: 20,
    height: 20,
  },
  commandCenterLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Bottom Section: Dokumen Jatuh Tempo Terdekat
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  calendarIcon: {
    width: 19,
    height: 19,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  lihatSemuaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  twoColGrid: {
    flexDirection: 'row',
    gap: 10,
  },

  tengah: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
