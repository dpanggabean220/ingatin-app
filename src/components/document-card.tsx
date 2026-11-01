import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { getKategori } from '@/constants/kategori';
import {
  formatSisaHari,
  formatTanggal,
  hitungSisaHari,
  tentukanStatus,
  type StatusJatuhTempo,
} from '@/lib/tanggal';
import type { Item } from '@/types/database';

export type DocumentCardItem = Pick<Item, 'id' | 'judul' | 'template' | 'jatuh_tempo' | 'catatan'>;

interface DocumentCardProps {
  item: DocumentCardItem;
  onPress?: (id: string) => void;
  onPerpanjang?: (id: string) => void;
  /** Tampilan ringkas (cocok untuk daftar pencarian/filter di Semua Dokumen) */
  compact?: boolean;
}

interface StatusVisual {
  stripeColor: string;
  iconBg: string;
  pillBg: string;
  pillTextColor: string;
  dotColor: string;
  statusLabel: string;
}

const STATUS_CONFIG: Record<StatusJatuhTempo, StatusVisual> = {
  expired: {
    stripeColor: Colors.critical,
    iconBg: Colors.criticalContainer,
    pillBg: Colors.criticalContainer,
    pillTextColor: Colors.criticalDark,
    dotColor: Colors.critical,
    statusLabel: 'Kedaluwarsa',
  },
  kritis: {
    stripeColor: Colors.critical,
    iconBg: Colors.criticalContainer,
    pillBg: Colors.criticalContainer,
    pillTextColor: Colors.criticalDark,
    dotColor: Colors.critical,
    statusLabel: 'Mendesak',
  },
  mendesak: {
    stripeColor: Colors.warning,
    iconBg: Colors.warningContainer,
    pillBg: Colors.warningContainer,
    pillTextColor: Colors.warningDark,
    dotColor: Colors.warning,
    statusLabel: 'Mendekati',
  },
  aman: {
    stripeColor: Colors.safe,
    iconBg: Colors.safeContainer,
    pillBg: Colors.safeContainer,
    pillTextColor: Colors.onSafeContainer,
    dotColor: Colors.safe,
    statusLabel: 'Kondisi Aman',
  },
};

export function DocumentCard({ item, onPress, onPerpanjang, compact = false }: DocumentCardProps) {
  const kategori = getKategori(item.template);
  const sisaHari = item.jatuh_tempo ? hitungSisaHari(item.jatuh_tempo) : null;
  const status = sisaHari === null ? 'aman' : tentukanStatus(sisaHari);
  const visual = STATUS_CONFIG[status];

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [styles.compactCard, pressed && styles.cardPressed]}
        onPress={onPress ? () => onPress(item.id) : undefined}
        accessibilityRole="button"
        accessibilityLabel={`Dokumen ${item.judul}`}
      >
        <View style={[styles.stripe, { backgroundColor: visual.stripeColor }]} />
        <View style={styles.compactRow}>
          <View style={[styles.compactIconBox, { backgroundColor: visual.iconBg }]}>
            <Text style={styles.iconText}>{kategori.icon}</Text>
          </View>

          <View style={styles.compactTextWrap}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {item.judul}
            </Text>
            <View style={styles.compactMetaRow}>
              <Text style={styles.metaKategori}>{kategori.label}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaTanggal}>
                {item.jatuh_tempo ? `Tempo: ${formatTanggal(item.jatuh_tempo)}` : 'Tanpa tanggal'}
              </Text>
            </View>
          </View>

          {sisaHari !== null && (
            <View style={[styles.pill, { backgroundColor: visual.pillBg }]}>
              <View style={[styles.dot, { backgroundColor: visual.dotColor }]} />
              <Text style={[styles.pillText, { color: visual.pillTextColor }]}>
                {formatSisaHari(sisaHari)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  // Tampilan Lengkap (Ingatin Pro Card sesuai Stitch)
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress ? () => onPress(item.id) : undefined}
      accessibilityRole="button"
      accessibilityLabel={`Dokumen ${item.judul}`}
    >
      {/* Stripe Indikator Status di Sisi Kiri */}
      <View style={[styles.stripe, { backgroundColor: visual.stripeColor }]} />

      <View style={styles.body}>
        {/* Header Kartu: Ikon Kategori, Judul, & Badge Countdown */}
        <View style={styles.topRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconBox, { backgroundColor: visual.iconBg }]}>
              <Text style={styles.iconTextLarge}>{kategori.icon}</Text>
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.judul} numberOfLines={1}>
                {item.judul}
              </Text>
              <Text style={styles.subjudul} numberOfLines={1}>
                {kategori.subtitle}
              </Text>
            </View>
          </View>

          {sisaHari !== null && (
            <View style={[styles.pill, { backgroundColor: visual.pillBg }]}>
              <View style={[styles.dot, { backgroundColor: visual.dotColor }]} />
              <Text style={[styles.pillText, { color: visual.pillTextColor }]}>
                {formatSisaHari(sisaHari)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer Kartu: Tanggal Jatuh Tempo & Action Detail/Perpanjang */}
        <View style={styles.bottomMeta}>
          <View style={styles.metaLeft}>
            <Text style={styles.labelJatuhTempo}>Jatuh Tempo</Text>
            <Text
              style={[
                styles.nilaiJatuhTempo,
                status === 'kritis' || status === 'expired' ? styles.tanggalMerah : null,
              ]}
            >
              {item.jatuh_tempo ? formatTanggal(item.jatuh_tempo) : 'Belum diatur'}
            </Text>
          </View>

          {onPerpanjang ? (
            <Pressable
              style={styles.tombolPerpanjang}
              onPress={() => onPerpanjang(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Perpanjang ${item.judul}`}
            >
              <Text style={styles.tombolPerpanjangText}>Perpanjang</Text>
            </Pressable>
          ) : (
            <View style={styles.statusAmanWrap}>
              <Text style={[styles.statusText, { color: visual.pillTextColor }]}>
                {visual.statusLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  compactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    zIndex: 1,
  },
  body: {
    padding: 16,
    paddingLeft: 18,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTextLarge: {
    fontSize: 24,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  judul: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  subjudul: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bottomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaLeft: {
    flexDirection: 'column',
  },
  labelJatuhTempo: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nilaiJatuhTempo: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  tanggalMerah: {
    color: Colors.critical,
    fontWeight: '700',
  },
  tombolPerpanjang: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tombolPerpanjangText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusAmanWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Gaya untuk compact mode
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
    gap: 12,
  },
  compactIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  compactTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaKategori: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaDot: {
    fontSize: 10,
    color: Colors.outlineVariant,
  },
  metaTanggal: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
