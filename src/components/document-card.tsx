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

export type DocumentCardItem = Pick<Item, 'id' | 'judul' | 'template' | 'jatuh_tempo'>;

interface DocumentCardProps {
  item: DocumentCardItem;
  onPress?: (id: string) => void;
  onPerpanjang?: (id: string) => void;
}

const STATUS_COLOR: Record<StatusJatuhTempo, string> = {
  aman: Colors.success,
  mendesak: Colors.warning,
  expired: Colors.error,
};

export function DocumentCard({ item, onPress, onPerpanjang }: DocumentCardProps) {
  const kategori = getKategori(item.template);
  const sisaHari = item.jatuh_tempo ? hitungSisaHari(item.jatuh_tempo) : null;
  const status = sisaHari === null ? null : tentukanStatus(sisaHari);
  const warnaStatus = status ? STATUS_COLOR[status] : Colors.textSecondary;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress ? () => onPress(item.id) : undefined}
      accessibilityRole="button"
      accessibilityLabel={`Dokumen ${item.judul}`}
    >
      <View style={styles.aksen} />
      <View style={styles.isi}>
        <Text style={styles.judul} numberOfLines={1}>
          {item.judul}
        </Text>
        <Text style={styles.kategori}>
          {kategori.icon} {kategori.label}
        </Text>

        <View style={styles.barisTanggal}>
          <Text style={styles.tanggal}>
            {item.jatuh_tempo ? `Jatuh tempo: ${formatTanggal(item.jatuh_tempo)}` : 'Belum ada tanggal jatuh tempo'}
          </Text>
          {sisaHari !== null && (
            <View style={[styles.badge, { backgroundColor: warnaStatus }]}>
              <Text style={styles.badgeText}>{formatSisaHari(sisaHari)}</Text>
            </View>
          )}
        </View>

        {onPerpanjang && (
          <Pressable
            style={styles.tombol}
            onPress={() => onPerpanjang(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Perpanjang ${item.judul}`}
          >
            <Text style={styles.tombolText}>Perpanjang</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  aksen: {
    width: 4,
    backgroundColor: Colors.primary,
  },
  isi: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  judul: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  kategori: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  barisTanggal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  tanggal: {
    flexShrink: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tombol: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  tombolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

