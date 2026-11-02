import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { TemplateType } from '@/types/database';

export type VectorIconName =
  | TemplateType
  | 'mic'
  | 'calendar'
  | 'camera'
  | 'gallery'
  | 'trash'
  | 'wallet'
  | 'shield'
  | 'lock'
  | 'bell'
  | 'upload'
  | 'download'
  | 'widget'
  | 'bolt'
  | 'check'
  | 'checklist'
  | 'refresh'
  | 'user';

const SVG_MAP: Record<VectorIconName, string> = {
  sim: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 22" fill="none"><rect width="28" height="22" rx="4" fill="#3B82F6"/><circle cx="9" cy="9" r="2.6" fill="#FFFFFF"/><path d="M4.8 16.5c0-2.1 1.9-3.5 4.2-3.5s4.2 1.4 4.2 3.5" fill="#FFFFFF"/><rect x="15.5" y="6.5" width="8" height="2" rx="1" fill="#DBEAFE"/><rect x="15.5" y="10.5" width="8" height="2" rx="1" fill="#DBEAFE"/><rect x="15.5" y="14.5" width="5.5" height="2" rx="1" fill="#DBEAFE"/></svg>`,
  stnk: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" fill="none"><path d="M5.5 10 7.6 4.8A2 2 0 0 1 9.45 3.5h9.1a2 2 0 0 1 1.85 1.3L22.5 10H5.5z" fill="#3B82F6"/><rect x="3" y="9.5" width="22" height="8.5" rx="3" fill="#2563EB"/><circle cx="7.5" cy="14" r="1.8" fill="#FFFFFF"/><circle cx="20.5" cy="14" r="1.8" fill="#FFFFFF"/><rect x="4.5" y="17" width="3.5" height="3.5" rx="1" fill="#1D4ED8"/><rect x="20" y="17" width="3.5" height="3.5" rx="1" fill="#1D4ED8"/></svg>`,
  pajak_kendaraan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" fill="none"><rect x="4" y="3" width="20" height="18" rx="3.5" fill="#F59E0B"/><path d="M8 8h12M8 12h8M8 16h5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/><circle cx="19" cy="15.5" r="2.5" fill="#FEF3C7"/></svg>`,
  paspor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" fill="none"><rect x="3" y="2" width="18" height="24" rx="3" fill="#10B981"/><circle cx="12" cy="12" r="5" stroke="#FFFFFF" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="2.4" ry="5" stroke="#FFFFFF" stroke-width="1.3"/><line x1="7" y1="12" x2="17" y2="12" stroke="#FFFFFF" stroke-width="1.3"/><rect x="7.5" y="20" width="9" height="1.8" rx="0.9" fill="#D1FAE5"/></svg>`,
  asuransi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 26" fill="none"><path d="M12 2 4 5.5v6.8C4 17.8 7.4 22.8 12 24.5c4.6-1.7 8-6.7 8-12.2V5.5L12 2z" fill="#7C3AED"/><path d="m8.8 13.2 2.2 2.2 4.5-4.6" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  kir: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" fill="none"><path d="M5.5 10 7.6 5a2 2 0 0 1 1.85-1.3h9.1A2 2 0 0 1 20.4 5l2.1 5H5.5z" fill="#06B6D4"/><rect x="3" y="9.5" width="22" height="8.5" rx="3" fill="#0891B2"/><circle cx="7.5" cy="14" r="1.8" fill="#FFFFFF"/><circle cx="20.5" cy="14" r="1.8" fill="#FFFFFF"/><rect x="4.5" y="17" width="3.5" height="3.5" rx="1" fill="#0E7490"/><rect x="20" y="17" width="3.5" height="3.5" rx="1" fill="#0E7490"/></svg>`,
  custom: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="3" fill="#6D4AFF"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/></svg>`,
  mic: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6D4AFF"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V20h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0z"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" fill="#EDE9FE"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  camera: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="#F5F3FF"/><circle cx="12" cy="13" r="4"/></svg>`,
  gallery: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" fill="#F5F3FF"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  wallet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3" fill="#EDE9FE"/><path d="M16 12h.01"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 2 4 5.5v6C4 17 7.4 21.6 12 23c4.6-1.4 8-6 8-11.5v-6L12 2z" fill="#6D4AFF"/><path d="m9 12 2 2 4-4" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2.5" fill="#6D4AFF"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#6D4AFF" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16" r="1.5" fill="#FFFFFF"/></svg>`,
  bell: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  upload: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  widget: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="#EDE9FE"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="#EDE9FE"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="#EDE9FE"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="#EDE9FE"/></svg>`,
  bolt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  checklist: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5" fill="#F5F3FF"/><path d="m9 11 2 2 4-4"/><line x1="9" y1="16" x2="15" y2="16"/></svg>`,
  refresh: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4" fill="#EDE9FE"/></svg>`,
};

interface VectorIconProps {
  name: VectorIconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Komponen ikon vektor SVG tajam (Anti-AI Slop) pengganti emoji OS generik.
 */
export function VectorIcon({ name, size = 22, style }: VectorIconProps) {
  const svg = SVG_MAP[name] ?? SVG_MAP.custom;
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
