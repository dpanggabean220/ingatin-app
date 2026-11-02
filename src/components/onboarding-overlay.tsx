import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { haptic } from '@/utils/haptics';
import { simpanProfilPengguna } from '@/utils/userProfile';

const SVG_PARTICLE_SPHERE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" fill="none">
  <defs>
    <radialGradient id="amberGlow" cx="50%" cy="68%" r="52%">
      <stop offset="0%" stop-color="#F25C05" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="#D94E04" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#0F0E0D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="160" cy="160" r="145" fill="url(#amberGlow)"/>
  <circle cx="160" cy="160" r="122" stroke="#F25C05" stroke-opacity="0.22" stroke-width="1.2" stroke-dasharray="2 7"/>
  <circle cx="160" cy="160" r="106" stroke="#F25C05" stroke-opacity="0.34" stroke-width="1.4" stroke-dasharray="2 6"/>
  <circle cx="160" cy="160" r="90" stroke="#FF7A29" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="2 5"/>
  <ellipse cx="160" cy="182" rx="112" ry="48" stroke="#F25C05" stroke-opacity="0.5" stroke-width="1.6" stroke-dasharray="3 5"/>
  <ellipse cx="160" cy="196" rx="94" ry="36" stroke="#FF8533" stroke-opacity="0.7" stroke-width="1.8" stroke-dasharray="3 4"/>
  <ellipse cx="160" cy="208" rx="70" ry="22" stroke="#FFA366" stroke-opacity="0.85" stroke-width="2" stroke-dasharray="2 4"/>
</svg>`;

interface OnboardingOverlayProps {
  initialName: string;
  onSelesai: () => void;
}

/**
 * Layar Sambutan "Get Started" sesuai layar kiri pada Foto Referensi 1:
 * Latar Obsidian Dark, bola partikel/glow oranye di tengah, tipografi besar di kiri bawah,
 * dan tombol khas lingkaran oranye "Get Started".
 */
export function OnboardingOverlay({ initialName, onSelesai }: OnboardingOverlayProps) {
  const insets = useSafeAreaInsets();
  const [nama, setNama] = useState(initialName === 'David' ? '' : initialName);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, pulseAnim]);

  const handleMulai = async () => {
    haptic.success();
    const namaSimpan = nama.trim() || initialName || 'David';
    await simpanProfilPengguna({
      namaPanggilan: namaSimpan,
      sudahOnboarding: true,
    });
    onSelesai();
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          paddingTop: Math.max(insets.top + 16, 40),
          paddingBottom: Math.max(insets.bottom + 24, 36),
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Area Visual Tengah: Bola Partikel Oranye + Patung Ikonik */}
        <View style={styles.centerArtworkArea}>
          <Animated.View
            style={[
              styles.sphereWrap,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Image
              source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_PARTICLE_SPHERE)}` }}
              style={styles.sphereSvg}
              contentFit="contain"
            />
            <View style={styles.statueCenterFrame}>
              <Image
                source={require('@/../assets/images/mascot-statue.png')}
                style={styles.statueCenterImg}
                contentFit="cover"
              />
            </View>
          </Animated.View>
        </View>

        {/* Area Bawah Kiri: Judul Besar + Subjudul Oranye + Input Nama + Tombol Get Started */}
        <View style={styles.bottomContent}>
          <Text style={styles.bigHeading}>
            Kelola dokumen{'\n'}pentingmu
          </Text>

          <Text style={styles.orangeSubtitle}>
            Pantau masa berlaku SIM, STNK, Paspor & pengingat harian 100% offline dengan privasi penuh
          </Text>

          {/* Input Nama Panggilan Singkat */}
          <View style={styles.nameInputWrap}>
            <TextInput
              style={styles.nameInput}
              value={nama}
              onChangeText={setNama}
              placeholder="Ketik nama panggilanmu (opsional)..."
              placeholderTextColor="#8A8077"
              returnKeyType="done"
              onSubmitEditing={handleMulai}
              maxLength={25}
            />
          </View>

          {/* Tombol "Get Started" khas Foto Referensi 1 (Lingkaran Oranye + Teks Putih) */}
          <Pressable
            style={({ pressed }) => [
              styles.getStartedWrap,
              pressed && styles.getStartedPressed,
            ]}
            onPress={handleMulai}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
          >
            <View style={styles.orangeCircle} />
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'space-between',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F0E0D',
    paddingHorizontal: 28,
    zIndex: 9998,
  },
  centerArtworkArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereWrap: {
    width: 290,
    height: 290,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sphereSvg: {
    width: 290,
    height: 290,
  },
  statueCenterFrame: {
    position: 'absolute',
    width: 146,
    height: 174,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(242, 92, 5, 0.65)',
  },
  statueCenterImg: {
    width: '100%',
    height: '100%',
  },
  bottomContent: {
    gap: 14,
    paddingBottom: 8,
  },
  bigHeading: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 41,
    letterSpacing: -0.6,
  },
  orangeSubtitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 20,
    maxWidth: '90%',
  },
  nameInputWrap: {
    marginTop: 4,
  },
  nameInput: {
    backgroundColor: '#1B1815',
    borderWidth: 1,
    borderColor: '#3B2C20',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  getStartedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    height: 62,
    paddingRight: 16,
    position: 'relative',
  },
  getStartedPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  orangeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: -36,
    letterSpacing: -0.2,
  },
});
