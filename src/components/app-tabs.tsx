import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors as AppColors } from '@/constants/colors';

export default function AppTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <NativeTabs
      backgroundColor={isDark ? '#000000' : '#ffffff'}
      indicatorColor={AppColors.primary}
      labelStyle={{
        selected: { color: AppColors.primary },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Beranda</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="dokumen">
        <NativeTabs.Trigger.Label>Semua Dokumen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="pengaturan">
        <NativeTabs.Trigger.Label>Pengaturan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
