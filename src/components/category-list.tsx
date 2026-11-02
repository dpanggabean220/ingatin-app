import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { KATEGORI } from '@/constants/kategori';
import type { TemplateType } from '@/types/database';
import { haptic } from '@/utils/haptics';

interface CategoryListProps {
  /** Kategori terpilih; `null` berarti tidak ada yang dipilih (atau "Semua" bila `showAll`). */
  selected: TemplateType | null;
  onSelect: (value: TemplateType | null) => void;
  /** Tampilkan chip "Semua" di awal (untuk filter). Memilihnya memanggil `onSelect(null)`. */
  showAll?: boolean;
  /** Jumlah dokumen per kategori (opsional, untuk angka dalam kurung seperti di referensi Stitch) */
  counts?: Partial<Record<TemplateType | 'all', number>>;
}

/** Chips horizontal filter kategori sesuai referensi Stitch v2.0. */
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
            Semua{counts?.all !== undefined ? ` (${counts.all})` : ''}
          </Text>
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
            {!counts && <Text style={styles.icon}>{k.icon}</Text>}
            <Text style={[styles.label, aktif ? styles.labelAktif : styles.labelInaktif]}>
              {k.label}
              {count !== undefined ? ` (${count})` : ''}
            </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    gap: 5,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  chipInaktif: {
    backgroundColor: '#1B1815',
    borderWidth: 1,
    borderColor: '#33261D',
  },
  chipPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
  chipAktif: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  labelInaktif: {
    color: '#D6CCC2',
  },
  labelAktif: {
    color: '#FFFFFF',
  },
});
