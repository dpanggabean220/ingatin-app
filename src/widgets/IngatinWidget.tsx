import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  cornerRadius,
  font,
  foregroundStyle,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export interface IngatinWidgetProps {
  adaDokumen: boolean;
  judulTerdekat: string;
  sisaHari: number | null;
  labelSisaHari: string;
  tanggalJatuhTempo: string;
  statusBadge: 'bahaya' | 'kritis' | 'aman';
  totalAktif: number;
  totalKritis: number;
  terakhirDiperbarui: string;
}

export const initialWidgetProps: IngatinWidgetProps = {
  adaDokumen: false,
  judulTerdekat: 'Belum ada data',
  sisaHari: null,
  labelSisaHari: 'Semua Aman',
  tanggalJatuhTempo: '—',
  statusBadge: 'aman',
  totalAktif: 0,
  totalKritis: 0,
  terakhirDiperbarui: new Date().toISOString(),
};

const IngatinWidgetComponent = (props: IngatinWidgetProps, context: WidgetEnvironment) => {
  'widget';

  const isSmall = context.widgetFamily === 'systemSmall';

  const badgeColor =
    props.statusBadge === 'bahaya'
      ? '#FCA5A5'
      : props.statusBadge === 'kritis'
      ? '#FCD34D'
      : '#6EE7B7';

  const badgeBg =
    props.statusBadge === 'bahaya'
      ? '#3B1818'
      : props.statusBadge === 'kritis'
      ? '#3B2812'
      : '#133326';

  if (!props.adaDokumen) {
    return (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[
          containerBackground('#161311', 'widget'),
          padding({ all: 16 }),
        ]}
      >
        <HStack alignment="center">
          <Text
            modifiers={[
              font({ size: 12, weight: 'bold' }),
              foregroundStyle('#F25C05'),
            ]}
          >
            INGATIN
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 12 })]}>🔔</Text>
        </HStack>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 15, weight: 'bold' }),
            foregroundStyle('#FFFFFF'),
          ]}
        >
          Semua Dokumen Aman
        </Text>
        <Text
          modifiers={[
            font({ size: 12 }),
            foregroundStyle('#A89F96'),
          ]}
        >
          Tidak ada tenggat waktu dalam waktu dekat.
        </Text>
        <Spacer />
      </VStack>
    );
  }

  // Tampilan Ukuran Kecil (systemSmall - 2x2)
  if (isSmall) {
    return (
      <VStack
        alignment="leading"
        spacing={6}
        modifiers={[
          containerBackground('#161311', 'widget'),
          padding({ all: 14 }),
        ]}
      >
        <HStack alignment="center">
          <Text
            modifiers={[
              font({ size: 11, weight: 'heavy' }),
              foregroundStyle('#F25C05'),
            ]}
          >
            INGATIN
          </Text>
          <Spacer />
          <Text
            modifiers={[
              font({ size: 10, weight: 'bold' }),
              foregroundStyle(badgeColor),
              padding({ horizontal: 6, vertical: 2 }),
              background(badgeBg),
              cornerRadius(6),
            ]}
          >
            {props.labelSisaHari}
          </Text>
        </HStack>

        <Spacer />

        <Text
          modifiers={[
            font({ size: 11, weight: 'bold' }),
            foregroundStyle('#A89F96'),
          ]}
        >
          DOKUMEN TERDEKAT
        </Text>
        <Text
          modifiers={[
            font({ size: 15, weight: 'bold' }),
            foregroundStyle('#FFFFFF'),
          ]}
        >
          {props.judulTerdekat}
        </Text>
        <Text
          modifiers={[
            font({ size: 11 }),
            foregroundStyle('#A89F96'),
          ]}
        >
          {props.tanggalJatuhTempo}
        </Text>
      </VStack>
    );
  }

  // Tampilan Ukuran Sedang (systemMedium - 4x2)
  return (
    <VStack
      alignment="leading"
      spacing={8}
      modifiers={[
        containerBackground('#161311', 'widget'),
        padding({ all: 16 }),
      ]}
    >
      <HStack alignment="center">
        <Text
          modifiers={[
            font({ size: 12, weight: 'heavy' }),
            foregroundStyle('#F25C05'),
          ]}
        >
          INGATIN • PENGINGAT DOKUMEN
        </Text>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 11, weight: 'bold' }),
            foregroundStyle(badgeColor),
            padding({ horizontal: 8, vertical: 3 }),
            background(badgeBg),
            cornerRadius(6),
          ]}
        >
          {props.labelSisaHari}
        </Text>
      </HStack>

      <Spacer />

      <HStack alignment="center" spacing={16}>
        <VStack alignment="leading" spacing={4}>
          <Text
            modifiers={[
              font({ size: 11, weight: 'bold' }),
              foregroundStyle('#A89F96'),
            ]}
          >
            TENGGAT TERDEKAT
          </Text>
          <Text
            modifiers={[
              font({ size: 16, weight: 'bold' }),
              foregroundStyle('#FFFFFF'),
            ]}
          >
            {props.judulTerdekat}
          </Text>
          <Text
            modifiers={[
              font({ size: 12 }),
              foregroundStyle('#A89F96'),
            ]}
          >
            Jatuh tempo: {props.tanggalJatuhTempo}
          </Text>
        </VStack>

        <Spacer />

        <VStack alignment="trailing" spacing={4}>
          <Text
            modifiers={[
              font({ size: 12, weight: 'semibold' }),
              foregroundStyle('#D6CCC2'),
            ]}
          >
            Total: {props.totalAktif} Dokumen
          </Text>
          {props.totalKritis > 0 ? (
            <Text
              modifiers={[
                font({ size: 12, weight: 'bold' }),
                foregroundStyle('#FCA5A5'),
              ]}
            >
              ⚠️ {props.totalKritis} Perlu Perhatian
            </Text>
          ) : (
            <Text
              modifiers={[
                font({ size: 12, weight: 'semibold' }),
                foregroundStyle('#6EE7B7'),
              ]}
            >
              ✅ Semua Terkendali
            </Text>
          )}
        </VStack>
      </HStack>
    </VStack>
  );
};

export default createWidget('IngatinWidget', IngatinWidgetComponent, initialWidgetProps);

