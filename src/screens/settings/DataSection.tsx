import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCoachStore } from '../../state/coachStore';
import { exportData } from '../../utils/dataExport';
import { SettingsSection } from './SettingsSection';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

// Lets the coach take a copy of their data.
export function DataSection() {

  const confirmExport = () => {
    Alert.alert(t('settings.exportData'), t('settings.exportDataMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.export'),
        onPress: async () => {
          const { coach, bookingRequests, lessons, students } = useCoachStore.getState();
          if (coach) await exportData({ coach, bookingRequests, lessons, students });
        },
      },
    ]);
  };

  return (
    <SettingsSection title={t('settings.data')}>
      <View className="space-y-3">
        <Pressable onPress={confirmExport} className="bg-gray-50 rounded-xl p-4 active:bg-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium mb-1" style={{ color: DesignTokens.colors.text.strong }}>
                {t('settings.exportData')}
              </Text>
              <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                {t('settings.exportDataDesc')}
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color={DesignTokens.colors.text.muted} />
          </View>
        </Pressable>
      </View>
    </SettingsSection>
  );
}
