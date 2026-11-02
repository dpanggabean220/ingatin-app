import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { tautkanAkunEmail } from '@/features/auth/authLinking';
import { haptic } from '@/utils/haptics';

interface TautkanAkunModalProps {
  visible: boolean;
  onTutup: () => void;
  onBerhasil: (email: string) => void;
}

export function TautkanAkunModal({
  visible,
  onTutup,
  onBerhasil,
}: TautkanAkunModalProps) {
  const [email, setEmail] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [konfirmasiSandi, setKonfirmasiSandi] = useState('');
  const [loading, setLoading] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setKataSandi('');
    setKonfirmasiSandi('');
    setPesanError(null);
  };

  const handleClose = () => {
    if (loading) return;
    haptic.light();
    resetForm();
    onTutup();
  };

  const handleSubmit = async () => {
    setPesanError(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      haptic.warning();
      setPesanError('Silakan masukkan alamat email kamu.');
      return;
    }
    if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      haptic.warning();
      setPesanError('Format alamat email tidak valid.');
      return;
    }
    if (!kataSandi || kataSandi.length < 6) {
      haptic.warning();
      setPesanError('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }
    if (kataSandi !== konfirmasiSandi) {
      haptic.warning();
      setPesanError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    haptic.medium();
    setLoading(true);
    try {
      const res = await tautkanAkunEmail(emailTrimmed, kataSandi);
      haptic.success();
      resetForm();
      onBerhasil(res.email ?? emailTrimmed);
    } catch (err) {
      haptic.error();
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menautkan akun.';
      setPesanError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.card}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconShield}>🛡️</Text>
              </View>
              <Text style={styles.title}>Amankan Datamu</Text>
              <Text style={styles.subtitle}>
                Tautkan akun anonimmu ke email agar dokumen pengingat tidak hilang saat berganti perangkat.
              </Text>
            </View>

            {/* Error Message */}
            {pesanError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {pesanError}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ALAMAT EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="nama@email.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setPesanError(null);
                  }}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>KATA SANDI</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  autoCapitalize="none"
                  value={kataSandi}
                  onChangeText={(v) => {
                    setKataSandi(v);
                    setPesanError(null);
                  }}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>KONFIRMASI KATA SANDI</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ulangi kata sandi"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  autoCapitalize="none"
                  value={konfirmasiSandi}
                  onChangeText={(v) => {
                    setKonfirmasiSandi(v);
                    setPesanError(null);
                  }}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Tombol Aksi */}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimary,
                  loading && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleSubmit}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Tautkan Akun Sekarang"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Tautkan Akun Sekarang</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
                onPress={handleClose}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Nanti Saja"
              >
                <Text style={styles.btnSecondaryText}>Nanti Saja</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconShield: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#3B1818',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '600',
    lineHeight: 17,
  },
  form: {
    gap: 14,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  actions: {
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnSecondary: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
