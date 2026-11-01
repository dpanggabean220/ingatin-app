import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentCard } from '@/components/document-card';
import { Colors } from '@/constants/colors';
import { useItems } from '@/features/items/useItems';
import { hitungSisaHari, tentukanStatus } from '@/lib/tanggal';
import type { TemplateType } from '@/types/database';

export default function BerandaScreen() {
  const router = useRouter();
  const { items, loading, error, refresh } = useItems();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const bukaTambah = (template?: TemplateType) => {
    if (template) {
      router.push({ pathname: '/tambah', params: { template } });
    } else {
      router.push('/tambah');
    }
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>⚡</Text>
          </View>
          <Text style={styles.brandTitle}>INGATIN</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.actionCircle}
            accessibilityRole="button"
            accessibilityLabel="Notifikasi"
          >
            <Text style={styles.actionIcon}>🔔</Text>
          </Pressable>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.tengah}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.tengah}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.cobaButton} onPress={refresh} accessibilityRole="button">
            <Text style={styles.cobaButtonText}>Coba lagi</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        /* ==================== STATE KOSONG (EMPTY STATE STITCH) ==================== */
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingTitle}>Halo!</Text>
              <Text style={styles.greetingWave}>👋</Text>
            </View>
            <Text style={styles.greetingSubtitle}>Mulai kelola tenggat waktu pentingmu</Text>
          </View>

          {/* Main Empty State Card */}
          <View style={styles.emptyCard}>
            {/* Visual Ilustrasi Dokumen & Pengingat */}
            <View style={styles.illustrationWrap}>
              <View style={styles.illusCircleOuter}>
                <View style={styles.illusCircleInner} />
                <View style={styles.illusCardBack} />
                <View style={styles.illusCardFront}>
                  <View style={styles.illusCardHeader} />
                  <View style={styles.illusCardLine1} />
                  <View style={styles.illusCardLine2} />
                  <View style={styles.illusCardLine3} />
                </View>
                <View style={styles.illusBellCircle}>
                  <Text style={styles.illusBellIcon}>🔔</Text>
                </View>
              </View>
            </View>

            <View style={styles.emptyTextWrap}>
              <Text style={styles.emptyTitle}>Belum Ada Dokumen</Text>
              <Text style={styles.emptyDesc}>
                Tambahkan dokumen pertamamu seperti SIM, STNK, atau Paspor agar tidak terlambat
                perpanjang.
              </Text>
            </View>

            {/* Tombol Utama Tambah Dokumen */}
            <Pressable
              style={styles.btnTambahUtama}
              onPress={() => bukaTambah()}
              accessibilityRole="button"
              accessibilityLabel="Tambah Dokumen"
            >
              <Text style={styles.btnTambahUtamaIcon}>+</Text>
              <Text style={styles.btnTambahUtamaText}>Tambah Dokumen</Text>
            </Pressable>

            {/* Pilihan Cepat */}
            <View style={styles.pilihanCepatSection}>
              <Text style={styles.pilihanCepatLabel}>PILIHAN CEPAT</Text>
              <View style={styles.pilihanCepatRow}>
                <Pressable
                  style={styles.quickChip}
                  onPress={() => bukaTambah('sim')}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickChipIcon}>🪪</Text>
                  <Text style={styles.quickChipText}>+ SIM</Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() => bukaTambah('stnk')}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickChipIcon}>📄</Text>
                  <Text style={styles.quickChipText}>+ STNK & Pajak</Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() => bukaTambah('paspor')}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickChipIcon}>🛂</Text>
                  <Text style={styles.quickChipText}>+ Paspor</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Banner Informasi Tambahan */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>🛡️</Text>
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Notifikasi Otomatis Siaga</Text>
              <Text style={styles.featureDesc}>
                Pengingat alarm otomatis aktif setelah dokumen disimpan.
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ==================== STATE BERISI DOKUMEN (STITCH HOME) ==================== */
        <ScrollView
          contentContainerStyle={styles.filledScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingTitle}>Halo!</Text>
              <Text style={styles.greetingWave}>👋</Text>
            </View>
            <Text style={styles.greetingSubtitle}>Pantau tenggat dokumenmu tepat waktu</Text>
          </View>

          {/* Purple Gradient Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryPill}>
              <View style={styles.summaryPillDot} />
              <Text style={styles.summaryPillText}>RINGKASAN TENGGAT WAKTU</Text>
            </View>

            <Text style={styles.summaryHeading}>
              {kritisCount > 0
                ? `${kritisCount} dokumen perlu perhatian segera`
                : `${items.length} dokumen tersimpan dalam pantauan`}
            </Text>

            <View style={styles.summaryPillsRow}>
              {kritisCount > 0 && (
                <View style={styles.miniPill}>
                  <View style={[styles.miniDot, { backgroundColor: Colors.critical }]} />
                  <Text style={styles.miniPillText}>{kritisCount} Mendesak (≤ 7 hari)</Text>
                </View>
              )}
              {mendesakCount > 0 && (
                <View style={styles.miniPill}>
                  <View style={[styles.miniDot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.miniPillText}>{mendesakCount} Mendekati (≤ 30 hari)</Text>
                </View>
              )}
              {kritisCount === 0 && mendesakCount === 0 && (
                <View style={styles.miniPill}>
                  <View style={[styles.miniDot, { backgroundColor: Colors.safe }]} />
                  <Text style={styles.miniPillText}>Semua dokumen dalam kondisi aman</Text>
                </View>
              )}
            </View>
          </View>

          {/* Section List Header */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>Perlu Perhatian Segera</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{items.length}</Text>
              </View>
            </View>
          </View>

          {/* Cards List */}
          <View style={styles.documentListWrap}>
            {items.map((item) => (
              <DocumentCard key={item.id} item={item} />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Floating Action Button (Hanya jika ada dokumen) */}
      {!loading && !error && items.length > 0 && (
        <Pressable
          style={styles.fab}
          onPress={() => bukaTambah()}
          accessibilityRole="button"
          accessibilityLabel="Tambah dokumen"
        >
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabText}>Tambah Dokumen</Text>
        </Pressable>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.canvas,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    fontSize: 16,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
  },

  greetingSection: {
    marginBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  greetingWave: {
    fontSize: 24,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // State Kosong (Empty State)
  emptyScroll: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 16,
  },
  illustrationWrap: {
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illusCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illusCircleInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#ECECFE',
    position: 'absolute',
  },
  illusCardBack: {
    width: 55,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    position: 'absolute',
    left: 30,
    top: 35,
    transform: [{ rotate: '-10deg' }],
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  illusCardFront: {
    width: 65,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#ECEEF5',
    padding: 8,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  illusCardHeader: {
    height: 12,
    backgroundColor: '#ECECFE',
    borderRadius: 4,
  },
  illusCardLine1: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
    width: '80%',
  },
  illusCardLine2: {
    height: 5,
    backgroundColor: '#C9C4D9',
    borderRadius: 3,
    width: '60%',
  },
  illusCardLine3: {
    height: 5,
    backgroundColor: '#E1E1F2',
    borderRadius: 3,
    width: '40%',
  },
  illusBellCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    position: 'absolute',
    right: 18,
    bottom: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  illusBellIcon: {
    fontSize: 20,
  },
  emptyTextWrap: {
    alignItems: 'center',
    marginVertical: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  btnTambahUtama: {
    width: '100%',
    backgroundColor: Colors.primaryContainer,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnTambahUtamaIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  btnTambahUtamaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pilihanCepatSection: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  pilihanCepatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  pilihanCepatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainer,
  },
  quickChipIcon: {
    fontSize: 14,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 18,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // State Berisi (Filled State)
  filledScroll: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  summaryCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  summaryPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.safeContainerFixed,
  },
  summaryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  summaryHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  summaryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  documentListWrap: {
    gap: 12,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  fabPlus: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  tengah: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: Colors.critical,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  cobaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cobaButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
