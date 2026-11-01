import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { KATEGORI } from '@/constants/kategori';
import type { TemplateType } from '@/types/database';

interface CategoryListProps {
  /** Kategori terpilih; `null` berarti tidak ada yang dipilih (atau "Semua" bila `showAll`). */
  selected: TemplateType | null;
  onSelect: (value: TemplateType | null) => void;
  /** Tampilkan chip "Semua" di awal (untuk filter). Memilihnya memanggil `onSelect(null)`. */
  showAll?: boolean;
}

/** Chips horizontal untuk 7 kategori dokumen. */
export function CategoryList({ selected, onSelect, showAll = false }: CategoryListProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {showAll && (
        <Pressable
          style={[styles.chip, selected === null && styles.chipAktif]}
          onPress={() => onSelect(null)}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === null }}
          accessibilityLabel="Semua"
        >
          <Text style={[styles.label, selected === null && styles.labelAktif]}>Semua</Text>
        </Pressable>
      )}
      {KATEGORI.map((k) => {
        const aktif = k.value === selected;
        return (
          <Pressable
            key={k.value}
            style={[styles.chip, aktif && styles.chipAktif]}
            onPress={() => onSelect(k.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: aktif }}
            accessibilityLabel={k.label}
          >
            <Text style={styles.icon}>{k.icon}</Text>
            <Text style={[styles.label, aktif && styles.labelAktif]}>{k.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipAktif: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  labelAktif: {
    color: '#FFFFFF',
  },
});
