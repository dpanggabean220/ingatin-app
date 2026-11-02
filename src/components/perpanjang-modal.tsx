import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { getKategori } from '@/constants/kategori';
import { VectorIcon } from '@/components/vector-icon';
import {
  hitungEstimasiJatuhTempoBaru,
  perpanjangItem,
} from '@/features/items/perpanjangItem';
import { formatTanggal } from '@/lib/tanggal';
import { haptic } from '@/utils/haptics';
import type { Item } from '@/types/database';

export type PerpanjangTargetItem = Pick<
  Item,
  'id' | 'judul' | 'template' | 'jatuh_tempo' | 'siklus_bulan'
>;

interface PerpanjangModalProps {
  visible: boolean;
  item: PerpanjangTargetItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

function keTanggalString(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${t}`;
}

export function PerpanjangModal({
  visible,
  item,
  onClose,
  onSuccess,
}: PerpanjangModalProps) {
  const [tanggalBaru, setTanggalBaru] = useState<Date>(new Date());
  const [tampilPicker, setTampilPicker] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      const estimasi = hitungEstimasiJatuhTempoBaru(
        item.jatuh_tempo,
        item.siklus_bulan
      );
      setTanggalBaru(estimasi);
      setError(null);
    }
  }, [item]);

  if (!item) return null;

  const kategori = getKategori(item.template);

  const onUbahTanggal = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setTampilPicker(false);
    if (event.type === 'set' && selected) setTanggalBaru(selected);
  };

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  const konfirmasi = async () => {
    if (!item.jatuh_tempo) {
      haptic.warning();
      setError('Dokumen ini belum memiliki tanggal jatuh tempo awal.');
      return;
    }

    haptic.medium();
    setMenyimpan(true);
    setError(null);

    const hasil = await perpanjangItem({
      itemId: item.id,
      jatuhTempoLama: item.jatuh_tempo,
      jatuhTempoBaru: keTanggalString(tanggalBaru),
    });

    setMenyimpan(false);

    if (hasil.error) {
      haptic.warning();
      setError(hasil.error);
      return;
    }

    haptic.success();
    onSuccess();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <VectorIcon name={item.template} size={26} />
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Perpanjang Dokumen</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.judul}
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose} accessibilityRole="button">
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Info Card: Jatuh Tempo Saat Ini */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>JATUH TEMPO SAAT INI</Text>
            <Text style={styles.infoValue}>
              {item.jatuh_tempo ? formatTanggal(item.jatuh_tempo) : 'Belum ditentukan'}
            </Text>
            {item.siklus_bulan && (
              <Text style={styles.infoSiklus}>
                Siklus perpanjangan: {item.siklus_bulan} bulan
              </Text>
            )}
          </View>

          {/* Form: Jatuh Tempo Baru */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tanggal Jatuh Tempo Baru</Text>
            <Pressable
              style={styles.datePickerBtn}
              onPress={() => {
                haptic.selection();
                setTampilPicker((prev) => !prev);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.datePickerValue}>
                {formatTanggal(keTanggalString(tanggalBaru))}
              </Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </Pressable>
            {tampilPicker && (
              <DateTimePicker
                value={tanggalBaru}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="dark"
                accentColor={Colors.primary}
                onChange={onUbahTanggal}
              />
            )}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.btnKonfirmasi,
                menyimpan && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              onPress={konfirmasi}
              disabled={menyimpan}
              accessibilityRole="button"
            >
              {menyimpan ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnKonfirmasiText}>Simpan Perpanjangan</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btnBatal, pressed && styles.btnPressed]}
              onPress={handleClose}
              accessibilityRole="button"
            >
              <Text style={styles.btnBatalText}>Batal</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 27, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  infoSiklus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primaryContainer,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  datePickerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  calendarIcon: {
    fontSize: 18,
  },
  errorBox: {
    backgroundColor: Colors.criticalContainer,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.criticalDark,
  },
  actionRow: {
    gap: 8,
  },
  btnKonfirmasi: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnKonfirmasiText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnBatal: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnBatalText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});

