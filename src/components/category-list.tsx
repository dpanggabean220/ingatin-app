import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { KATEGORI } from '@/constants/kategori';
import { haptic } from '@/utils/haptics';
import type { TemplateType } from '@/types/database';

interface CategoryListProps {
  /** Kategori terpilih; `null` berarti tidak ada yang dipilih (atau "Semua" bila `showAll`). */
  selected: TemplateType | null;
  onSelect: (value: TemplateType | null) => void;
  /** Tampilkan chip "Semua" di awal (untuk filter). Memilihnya memanggil `onSelect(null)`. */
  showAll?: boolean;
  /** Jumlah dokumen per kategori (opsional, untuk badge angka seperti di Stitch) */
  counts?: Partial<Record<TemplateType | 'all', number>>;
}

/** Chips horizontal filter kategori sesuai gaya Stitch Ingatin Pro. */
export function CategoryList({ selected, onSelect, showAll = false, counts }: CategoryListProps) {
  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {showAll && (
        <Pressable
          style={({ pressed }) => [
            styles.chip,
            selected === null ? styles.chipAktif : styles.chipInaktif,
            pressed && styles.chipPressed,
          ]}
          onPress={() => {
            haptic.selection();
            onSelect(null);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === null }}
          accessibilityLabel="Semua dokumen"
        >
          <Text style={[styles.label, selected === null ? styles.labelAktif : styles.labelInaktif]}>
            Semua
          </Text>
          {counts?.all !== undefined && (
            <View
              style={[
                styles.badge,
                selected === null ? styles.badgeAktif : styles.badgeInaktif,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  selected === null ? styles.badgeTextAktif : styles.badgeTextInaktif,
                ]}
              >
                {counts.all}
              </Text>
            </View>
          )}
        </Pressable>
      )}

      {KATEGORI.map((k) => {
        const aktif = k.value === selected;
        const count = counts?.[k.value];

        return (
          <Pressable
            key={k.value}
            style={({ pressed }) => [
              styles.chip,
              aktif ? styles.chipAktif : styles.chipInaktif,
              pressed && styles.chipPressed,
            ]}
            onPress={() => {
              haptic.selection();
              onSelect(k.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: aktif }}
            accessibilityLabel={k.label}
          >
            <Text style={styles.icon}>{k.icon}</Text>
            <Text style={[styles.label, aktif ? styles.labelAktif : styles.labelInaktif]}>
              {k.label}
            </Text>
            {count !== undefined && (
              <View style={[styles.badge, aktif ? styles.badgeAktif : styles.badgeInaktif]}>
                <Text style={[styles.badgeText, aktif ? styles.badgeTextAktif : styles.badgeTextInaktif]}>
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  chipInaktif: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  chipPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  chipAktif: {
    backgroundColor: Colors.primaryContainer,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  labelInaktif: {
    color: Colors.textSecondary,
  },
  labelAktif: {
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInaktif: {
    backgroundColor: Colors.outlineVariant,
  },
  badgeAktif: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextInaktif: {
    color: Colors.textPrimary,
  },
  badgeTextAktif: {
    color: '#FFFFFF',
  },
});
