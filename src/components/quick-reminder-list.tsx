import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { QuickReminder } from '@/features/quick-reminders/quickReminders';
import { haptic } from '@/utils/haptics';

interface QuickReminderListProps {
  reminders: QuickReminder[];
  onSelesai: (id: string) => void;
  onHapus: (id: string) => void;
  /** Bila true, tampil menyatu di dalam Hero Card Pusat Perintah */
  embedded?: boolean;
}

function akhirHariIni(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

function formatJamMenit(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Seksi "⚡ Pengingat Kilat Hari Ini" di Beranda.
 */
export function QuickReminderList({
  reminders,
  onSelesai,
  onHapus,
  embedded = false,
}: QuickReminderListProps) {
  const [tampilBerikutnya, setTampilBerikutnya] = useState(false);

  if (!embedded && reminders.length === 0) return null;

  const batas = akhirHariIni();
  const hariIni = reminders.filter((r) => new Date(r.waktu_target).getTime() <= batas);
  const berikutnya = reminders.filter(
    (r) => !r.selesai && new Date(r.waktu_target).getTime() > batas
  );

  const konfirmasiHapus = (r: QuickReminder) => {
    haptic.warning();
    Alert.alert('Hapus Pengingat?', `"${r.judul}" akan dihapus beserta alarmnya.`, [
      { text: 'Batal', style: 'cancel', onPress: () => haptic.light() },
      { text: 'Hapus', style: 'destructive', onPress: () => onHapus(r.id) },
    ]);
  };

  const renderBaris = (r: QuickReminder, idx: number, total: number) => {
    const waktu = new Date(r.waktu_target);
    const jamStr = formatJamMenit(waktu);
    const isLast = idx === total - 1;

    return (
      <Pressable
        key={r.id}
        style={[
          styles.row,
          isLast && styles.rowLast,
          r.selesai && styles.rowSelesai,
        ]}
        onPress={() => {
          if (r.selesai) return;
          haptic.success();
          onSelesai(r.id);
        }}
        onLongPress={() => konfirmasiHapus(r)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: r.selesai }}
        accessibilityLabel={`${r.judul} jam ${jamStr}`}
      >
        <View style={[styles.checkbox, r.selesai && styles.checkboxOn]}>
          {r.selesai && <Text style={styles.checkmark}>✓</Text>}
        </View>

        <Text style={[styles.judul, r.selesai && styles.judulSelesai]} numberOfLines={1}>
          {r.judul} jam {jamStr}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      <View style={styles.headerRow}>
        <Text style={styles.lightningIcon}>⚡</Text>
        <Text style={styles.title}>Pengingat Kilat Hari Ini</Text>
      </View>

      <View style={embedded ? styles.embeddedList : styles.card}>
        {hariIni.length > 0 ? (
          hariIni.map((r, i) => renderBaris(r, i, hariIni.length))
        ) : (
          <Text style={styles.kosong}>
            Belum ada pengingat kilat hari ini. Ketik atau ucapkan perintah di atas!
          </Text>
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
            {tampilBerikutnya &&
              berikutnya.map((r, i) => renderBaris(r, i, berikutnya.length))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  wrapEmbedded: {
    paddingTop: 6,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lightningIcon: {
    fontSize: 14,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  embeddedList: {
    paddingTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFFA',
  },
  rowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  rowSelesai: {
    opacity: 0.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: '#BDB7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  judul: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#191B27',
  },
  judulSelesai: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  kosong: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    paddingVertical: 8,
  },
  toggle: {
    paddingTop: 6,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
