import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { getKategori } from '@/constants/kategori';
import {
  formatTanggal,
  hitungSisaHari,
  tentukanStatus,
  type StatusJatuhTempo,
} from '@/lib/tanggal';
import type { Item, TemplateType } from '@/types/database';
import { sensorNomorDokumen, verifikasiBiometrik } from '@/utils/biometricLock';
import {
  ambilCachePemilikDokumen,
  ambilPemilikItem,
  getInfoPemilik,
  langgananPerubahanPemilik,
} from '@/utils/documentOwner';
import { haptic } from '@/utils/haptics';
import {
  ambilBiayaDokumen,
  ambilCacheBiayaPerpanjangan,
  formatRupiah,
  langgananPerubahanBiaya,
} from '@/utils/renewalBudget';

export type DocumentCardItem = Pick<
  Item,
  'id' | 'judul' | 'template' | 'jatuh_tempo' | 'siklus_bulan' | 'catatan'
>;

interface DocumentCardProps {
  item: DocumentCardItem;
  onPress?: (id: string) => void;
  onPerpanjang?: (item: DocumentCardItem) => void;
  /** Tampilan daftar di halaman Semua Dokumen */
  compact?: boolean;
  /** Tampilan kartu grid 2 kolom di Beranda (Dokumen Jatuh Tempo Terdekat) */
  miniGrid?: boolean;
}

const SVG_ID_CARD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 22" fill="none"><rect width="28" height="22" rx="4" fill="#3B82F6"/><circle cx="9" cy="9" r="2.6" fill="#FFFFFF"/><path d="M4.8 16.5c0-2.1 1.9-3.5 4.2-3.5s4.2 1.4 4.2 3.5" fill="#FFFFFF"/><rect x="15.5" y="6.5" width="8" height="2" rx="1" fill="#DBEAFE"/><rect x="15.5" y="10.5" width="8" height="2" rx="1" fill="#DBEAFE"/><rect x="15.5" y="14.5" width="5.5" height="2" rx="1" fill="#DBEAFE"/></svg>`;

const SVG_CAR_BLUE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" fill="none"><path d="M5.5 10 7.6 4.8A2 2 0 0 1 9.45 3.5h9.1a2 2 0 0 1 1.85 1.3L22.5 10H5.5z" fill="#3B82F6"/><rect x="3" y="9.5" width="22" height="8.5" rx="3" fill="#2563EB"/><circle cx="7.5" cy="14" r="1.8" fill="#FFFFFF"/><circle cx="20.5" cy="14" r="1.8" fill="#FFFFFF"/><rect x="4.5" y="17" width="3.5" height="3.5" rx="1" fill="#1D4ED8"/><rect x="20" y="17" width="3.5" height="3.5" rx="1" fill="#1D4ED8"/></svg>`;

const SVG_SCOOTER_BLUE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" fill="none"><circle cx="6.5" cy="17.5" r="3.2" stroke="#2563EB" stroke-width="2.2" fill="#EFF6FF"/><circle cx="21.5" cy="17.5" r="3.2" stroke="#2563EB" stroke-width="2.2" fill="#EFF6FF"/><path d="M9.5 17.5h6.5l2.5-6.5h-4l-1.5 3.5H9.5l-2-4.5H5" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 6.5h3.5l2 11" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SVG_PASSPORT_GREEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" fill="none"><rect x="3" y="2" width="18" height="24" rx="3" fill="#10B981"/><circle cx="12" cy="12" r="5" stroke="#FFFFFF" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="2.4" ry="5" stroke="#FFFFFF" stroke-width="1.3"/><line x1="7" y1="12" x2="17" y2="12" stroke="#FFFFFF" stroke-width="1.3"/><rect x="7.5" y="20" width="9" height="1.8" rx="0.9" fill="#D1FAE5"/></svg>`;

const SVG_SHIELD_PURPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 26" fill="none"><path d="M12 2 4 5.5v6.8C4 17.8 7.4 22.8 12 24.5c4.6-1.7 8-6.7 8-12.2V5.5L12 2z" fill="#F25C05"/><path d="m8.8 13.2 2.2 2.2 4.5-4.6" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SVG_KIR_TEAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" fill="none"><path d="M5.5 10 7.6 5a2 2 0 0 1 1.85-1.3h9.1A2 2 0 0 1 20.4 5l2.1 5H5.5z" fill="#06B6D4"/><rect x="3" y="9.5" width="22" height="8.5" rx="3" fill="#0891B2"/><circle cx="7.5" cy="14" r="1.8" fill="#FFFFFF"/><circle cx="20.5" cy="14" r="1.8" fill="#FFFFFF"/><rect x="4.5" y="17" width="3.5" height="3.5" rx="1" fill="#0E7490"/><rect x="20" y="17" width="3.5" height="3.5" rx="1" fill="#0E7490"/></svg>`;

const SVG_EYE_CLOSED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F25C05" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;

const SVG_EYE_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#A89F96" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function getCategorySvg(template: TemplateType, miniGrid = false): string {
  if (template === 'sim') return SVG_ID_CARD;
  if (template === 'stnk') return miniGrid ? SVG_SCOOTER_BLUE : SVG_CAR_BLUE;
  if (template === 'pajak_kendaraan') return SVG_CAR_BLUE;
  if (template === 'paspor') return SVG_PASSPORT_GREEN;
  if (template === 'asuransi') return SVG_SHIELD_PURPLE;
  if (template === 'kir') return SVG_KIR_TEAL;
  return SVG_ID_CARD;
}

function parseCatatanDanTanggal(
  item: DocumentCardItem,
  fallbackSubtitle: string
): { nomorLabel: string; tanggalLabel: string } {
  if (item.catatan && item.catatan.includes('•')) {
    const [kiri, kanan] = item.catatan.split('•').map((s) => s.trim());
    return {
      nomorLabel: kiri || fallbackSubtitle,
      tanggalLabel:
        kanan || (item.jatuh_tempo ? formatTanggal(item.jatuh_tempo) : 'Belum diatur'),
    };
  }
  return {
    nomorLabel: item.catatan?.trim() || fallbackSubtitle,
    tanggalLabel: item.jatuh_tempo ? formatTanggal(item.jatuh_tempo) : 'Belum diatur',
  };
}

export function DocumentCard({
  item,
  onPress,
  onPerpanjang,
  miniGrid = false,
}: DocumentCardProps) {
  const kategori = getKategori(item.template);
  const sisaHari = item.jatuh_tempo ? hitungSisaHari(item.jatuh_tempo) : null;
  const status: StatusJatuhTempo = sisaHari === null ? 'aman' : tentukanStatus(sisaHari);

  const { nomorLabel, tanggalLabel } = parseCatatanDanTanggal(item, kategori.subtitle);
  const svgIcon = getCategorySvg(item.template, miniGrid);

  const [nomorTerbuka, setNomorTerbuka] = useState(false);
  const [petaBiaya, setPetaBiaya] = useState(ambilCacheBiayaPerpanjangan);
  const [petaPemilik, setPetaPemilik] = useState(ambilCachePemilikDokumen);

  useEffect(() => {
    setPetaBiaya(ambilCacheBiayaPerpanjangan());
    setPetaPemilik(ambilCachePemilikDokumen());
    const unsubBiaya = langgananPerubahanBiaya(() => {
      setPetaBiaya({ ...ambilCacheBiayaPerpanjangan() });
    });
    const unsubPemilik = langgananPerubahanPemilik(() => {
      setPetaPemilik({ ...ambilCachePemilikDokumen() });
    });
    return () => {
      unsubBiaya();
      unsubPemilik();
    };
  }, []);

  const estimasiBiaya = ambilBiayaDokumen(item, petaBiaya);
  const infoPemilik = getInfoPemilik(ambilPemilikItem(item.id, petaPemilik));
  const teksNomorTampil = nomorTerbuka ? nomorLabel : sensorNomorDokumen(nomorLabel);

  const onToggleLihatNomor = async (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    if (nomorTerbuka) {
      haptic.light();
      setNomorTerbuka(false);
      return;
    }

    haptic.light();
    const res = await verifikasiBiometrik(
      `Verifikasi Face ID untuk melihat nomor ${item.judul}`
    );
    if (res.berhasil) {
      haptic.success();
      setNomorTerbuka(true);
    } else if (res.pesan && res.pesan !== 'Verifikasi dibatalkan.') {
      haptic.warning();
      Alert.alert('Verifikasi Diperlukan', res.pesan);
    }
  };

  const isKritis = status === 'kritis' || status === 'expired';
  const isMendesak = status === 'mendesak';

  const stripeColor = isKritis
    ? '#EF4444'
    : isMendesak
    ? '#F59E0B'
    : item.template === 'kir'
    ? '#06B6D4'
    : '#10B981';

  const pillBg = isKritis ? '#36191B' : isMendesak ? '#332211' : '#142E22';
  const pillTextColor = isKritis ? '#FCA5A5' : isMendesak ? '#FCD34D' : '#6EE7B7';

  const labelHariSingkat =
    sisaHari === null
      ? 'Aman'
      : sisaHari < 0
      ? `Lewat ${Math.abs(sisaHari)} Hari`
      : sisaHari === 0
      ? 'Hari Ini!'
      : `${sisaHari} Hari Lagi`;

  // ==================== MODE MINI GRID 2 KOLOM DI BERANDA ====================
  if (miniGrid) {
    return (
      <Pressable
        style={({ pressed }) => [styles.miniCard, pressed && styles.cardPressed]}
        onPress={
          onPress
            ? () => {
                haptic.light();
                onPress(item.id);
              }
            : undefined
        }
        accessibilityRole="button"
        accessibilityLabel={`Dokumen ${item.judul}`}
      >
        <View style={styles.miniTopRow}>
          <Image
            source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svgIcon)}` }}
            style={styles.miniSvgIcon}
            contentFit="contain"
          />
          <View style={styles.miniTitleCol}>
            <Text style={styles.miniTitle} numberOfLines={1}>
              {item.judul}
            </Text>
            <View style={styles.nomorPrivacyRow}>
              <Text style={styles.miniSub} numberOfLines={1}>
                {teksNomorTampil}
              </Text>
              <Pressable
                onPress={onToggleLihatNomor}
                hitSlop={8}
                style={({ pressed }) => [styles.eyeBtnMini, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel={
                  nomorTerbuka ? 'Sembunyikan nomor dokumen' : 'Lihat nomor dokumen lengkap dengan Face ID'
                }
              >
                <Image
                  source={{
                    uri: `data:image/svg+xml;utf8,${encodeURIComponent(
                      nomorTerbuka ? SVG_EYE_OPEN : SVG_EYE_CLOSED
                    )}`,
                  }}
                  style={styles.eyeIconMini}
                />
              </Pressable>
            </View>
          </View>
          <Text style={styles.miniChevron}>›</Text>
        </View>

        <View style={[styles.miniStatusPill, { backgroundColor: pillBg }]}>
          {isKritis ? (
            <View style={styles.bangCircleRed}>
              <Text style={styles.bangText}>!</Text>
            </View>
          ) : (
            <Text style={styles.clockMiniIcon}>🕒</Text>
          )}
          <Text style={[styles.miniPillText, { color: pillTextColor }]} numberOfLines={1}>
            Sisa {labelHariSingkat}
          </Text>
        </View>

        {isMendesak && onPerpanjang && (
          <View style={styles.miniActionRow}>
            <Pressable
              style={({ pressed }) => [styles.btnPerpanjangMini, pressed && styles.btnPressed]}
              onPress={(e) => {
                e.stopPropagation?.();
                haptic.medium();
                onPerpanjang(item);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.btnPerpanjangMiniText}>Perpanjang</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  }

  // ==================== MODE KARTU DAFTAR (SEMUA DOKUMEN) ====================
  const tampilTombolPerpanjang = (isKritis || isMendesak) && !!onPerpanjang;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={
        onPress
          ? () => {
              haptic.light();
              onPress(item.id);
            }
          : undefined
      }
      accessibilityRole="button"
      accessibilityLabel={`Dokumen ${item.judul}`}
    >
      {/* Stripe Indikator Status di Sisi Kiri */}
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      <View style={styles.rowContainer}>
        {/* Ikon Kategori */}
        <View style={styles.leftIconWrap}>
          <Image
            source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svgIcon)}` }}
            style={styles.leftSvgIcon}
            contentFit="contain"
          />
        </View>

        {/* Kolom Tengah: Judul, Nomor/Plat, & Tanggal Jatuh Tempo */}
        <View style={styles.centerCol}>
          <Text style={styles.judul} numberOfLines={1}>
            {item.judul}
          </Text>
          <View style={styles.nomorPrivacyRow}>
            <Text style={styles.nomorSub} numberOfLines={1}>
              {teksNomorTampil}
            </Text>
            <Pressable
              onPress={onToggleLihatNomor}
              hitSlop={8}
              style={({ pressed }) => [styles.eyeBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel={
                nomorTerbuka ? 'Sembunyikan nomor dokumen' : 'Lihat nomor dokumen lengkap dengan Face ID'
              }
            >
              <Image
                source={{
                  uri: `data:image/svg+xml;utf8,${encodeURIComponent(
                    nomorTerbuka ? SVG_EYE_OPEN : SVG_EYE_CLOSED
                  )}`,
                }}
                style={styles.eyeIcon}
              />
            </Pressable>
          </View>
          <View style={styles.dueRow}>
            <Text style={[styles.dueIcon, { color: pillTextColor }]}>
              {isKritis || isMendesak ? '📅' : '✔'}
            </Text>
            <Text style={[styles.dueText, { color: pillTextColor }]} numberOfLines={1}>
              Jatuh Tempo: {tanggalLabel}
            </Text>
          </View>
          <View style={styles.metaBadgesRow}>
            <View
              style={[
                styles.ownerBadge,
                { backgroundColor: infoPemilik.bg, borderColor: infoPemilik.borderColor },
              ]}
            >
              <Text style={[styles.ownerBadgeText, { color: infoPemilik.textColor }]} numberOfLines={1}>
                {infoPemilik.label}
              </Text>
            </View>
            {estimasiBiaya !== null && estimasiBiaya > 0 && (
              <View style={styles.budgetBadge}>
                <Text style={styles.budgetBadgeText} numberOfLines={1}>
                  Est. {formatRupiah(estimasiBiaya)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Kolom Kanan: Badge Sisa Hari & Tombol Perpanjang */}
        <View style={styles.rightCol}>
          {sisaHari !== null && (
            <View style={[styles.pill, { backgroundColor: pillBg }]}>
              {isKritis ? (
                <View style={styles.bangCircleRed}>
                  <Text style={styles.bangText}>!</Text>
                </View>
              ) : (
                <Text style={[styles.clockIcon, { color: pillTextColor }]}>🕒</Text>
              )}
              <Text style={[styles.pillText, { color: pillTextColor }]}>
                {labelHariSingkat}
              </Text>
            </View>
          )}

          {tampilTombolPerpanjang && (
            <Pressable
              style={({ pressed }) => [
                styles.tombolPerpanjang,
                pressed && styles.btnPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                haptic.medium();
                onPerpanjang(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Perpanjang ${item.judul}`}
            >
              <Text style={styles.tombolPerpanjangText}>Perpanjang</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.chevronRight}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1B1815',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#33261D',
    overflow: 'hidden',
    shadowColor: '#F25C05',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.94,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    zIndex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingLeft: 14,
    paddingRight: 10,
    gap: 10,
  },
  leftIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftSvgIcon: {
    width: 34,
    height: 30,
  },
  centerCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  judul: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nomorPrivacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  nomorSub: {
    fontSize: 12,
    color: '#A89F96',
    fontWeight: '500',
    flexShrink: 1,
  },
  eyeBtn: {
    padding: 2,
    borderRadius: 6,
    backgroundColor: '#291E17',
  },
  eyeIcon: {
    width: 14,
    height: 14,
  },
  eyeBtnMini: {
    padding: 1.5,
    borderRadius: 5,
    backgroundColor: '#291E17',
  },
  eyeIconMini: {
    width: 12,
    height: 12,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  dueIcon: {
    fontSize: 11,
    fontWeight: '800',
  },
  dueText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  metaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 3,
  },
  ownerBadge: {
    borderRadius: 6,
    paddingHorizontal: 6.5,
    paddingVertical: 1.5,
    borderWidth: 1,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  budgetBadge: {
    backgroundColor: '#291E17',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderWidth: 1,
    borderColor: '#452E1E',
  },
  budgetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF8533',
    fontVariant: ['tabular-nums'],
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bangCircleRed: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bangText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  clockIcon: {
    fontSize: 11,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tombolPerpanjang: {
    backgroundColor: '#F25C05',
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tombolPerpanjangText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  chevronRight: {
    fontSize: 20,
    color: '#8A8077',
    fontWeight: '600',
    marginLeft: 2,
  },
  btnPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },

  // ==================== MINI GRID CARD (BERANDA) ====================
  miniCard: {
    flex: 1,
    backgroundColor: '#1B1815',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#33261D',
    gap: 8,
    shadowColor: '#F25C05',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
  },
  miniTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniSvgIcon: {
    width: 28,
    height: 24,
  },
  miniTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  miniSub: {
    fontSize: 10.5,
    color: '#A89F96',
    marginTop: 1,
    flexShrink: 1,
  },
  miniChevron: {
    fontSize: 18,
    color: '#8A8077',
    fontWeight: '600',
  },
  miniStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  clockMiniIcon: {
    fontSize: 11,
  },
  miniPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  miniActionRow: {
    alignItems: 'flex-end',
    marginTop: -2,
  },
  btnPerpanjangMini: {
    backgroundColor: '#F25C05',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  btnPerpanjangMiniText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
