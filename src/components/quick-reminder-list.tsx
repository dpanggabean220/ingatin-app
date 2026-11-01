import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { QuickReminder } from '@/features/quick-reminders/quickReminders';
import { formatLabelWaktu } from '@/utils/commandParser';
import { haptic } from '@/utils/haptics';

interface QuickReminderListProps {
  reminders: QuickReminder[];
  onSelesai: (id: string) => void;
  onHapus: (id: string) => void;
}

function akhirHariIni(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

/**
 * Seksi "⚡ Pengingat Kilat Hari Ini" di Beranda.
 * Menampilkan pengingat hari ini (termasuk yang terlewat), dengan opsi
 * membuka pengingat untuk hari-hari berikutnya.
 */
export function QuickReminderList({ reminders, onSelesai, onHapus }: QuickReminderListProps) {
  const [tampilBerikutnya, setTampilBerikutnya] = useState(false);

  if (reminders.length === 0) return null;

  const batas = akhirHariIni();
  const hariIni = reminders.filter((r) => new Date(r.waktu_target).getTime() <= batas);
  const berikutnya = reminders.filter(
    (r) => !r.selesai && new Date(r.waktu_target).getTime() > batas
  );
  const aktifHariIni = hariIni.filter((r) => !r.selesai).length;

  const konfirmasiHapus = (r: QuickReminder) => {
    haptic.warning();
    Alert.alert('Hapus Pengingat?', `"${r.judul}" akan dihapus beserta alarmnya.`, [
      { text: 'Batal', style: 'cancel', onPress: () => haptic.light() },
      { text: 'Hapus', style: 'destructive', onPress: () => onHapus(r.id) },
    ]);
  };

  const renderBaris = (r: QuickReminder) => {
    const waktu = new Date(r.waktu_target);
    const terlewat = !r.selesai && waktu.getTime() < Date.now();
    return (
      <View key={r.id} style={[styles.row, r.selesai && styles.rowSelesai]}>
        <Pressable
          style={({ pressed }) => [
            styles.checkbox,
            r.selesai && styles.checkboxOn,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            if (r.selesai) return;
            haptic.success();
            onSelesai(r.id);
          }}
          disabled={r.selesai}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: r.selesai }}
          accessibilityLabel={`Tandai ${r.judul} selesai`}
        >
          {r.selesai && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>

        <View style={styles.rowContent}>
          <Text style={[styles.judul, r.selesai && styles.judulSelesai]} numberOfLines={1}>
            {r.judul}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.waktu}>⏰ {formatLabelWaktu(waktu)}</Text>
            {terlewat && (
              <View style={styles.badgeTerlewat}>
                <Text style={styles.badgeTerlewatText}>Terlewat</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.btnHapus, pressed && styles.pressed]}
          onPress={() => konfirmasiHapus(r)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Hapus ${r.judul}`}
        >
          <Text style={styles.btnHapusIcon}>🗑️</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>⚡ Pengingat Kilat Hari Ini</Text>
        {aktifHariIni > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{aktifHariIni}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        {hariIni.length > 0 ? (
          hariIni.map(renderBaris)
        ) : (
          <Text style={styles.kosong}>Tidak ada pengingat kilat untuk hari ini. 🎉</Text>
        )}

        {berikutnya.length > 0 && (
          <>
            <Pressable
              style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
              onPress={() => {
                haptic.selection();
                setTampilBerikutnya((v) => !v);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.toggleText}>
                {tampilBerikutnya
                  ? 'Sembunyikan pengingat berikutnya ▲'
                  : `+${berikutnya.length} terjadwal untuk hari berikutnya ▼`}
              </Text>
            </Pressable>
            {tampilBerikutnya && berikutnya.map(renderBaris)}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowSelesai: {
    opacity: 0.55,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  judul: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  judulSelesai: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waktu: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  badgeTerlewat: {
    backgroundColor: Colors.criticalContainer,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeTerlewatText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.criticalDark,
  },
  btnHapus: {
    padding: 4,
  },
  btnHapusIcon: {
    fontSize: 16,
  },
  kosong: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingVertical: 12,
    textAlign: 'center',
  },
  toggle: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});

