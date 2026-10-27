import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useCoachStore } from '../../state/coachStore';
import { exportData } from '../../utils/dataExport';
import { SettingsSection } from './SettingsSection';
import { DesignTokens } from '../../utils/designTokens';

// Lets the coach take a copy of their data.
export function DataSection() {
  const { t } = useTranslation();

  const confirmExport = () => {
    Alert.alert(t('exportDataTitle'), t('exportDataMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('export'),
        onPress: async () => {
          const { coach, bookingRequests, lessons, students } = useCoachStore.getState();
          if (coach) await exportData({ coach, bookingRequests, lessons, students });
        },
      },
    ]);
  };

  return (
    <SettingsSection title={t('data')}>
      <View className="space-y-3">
        <Pressable onPress={confirmExport} className="bg-gray-50 rounded-xl p-4 active:bg-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium mb-1" style={{ color: DesignTokens.colors.text.strong }}>
                {t('exportData')}
              </Text>
              <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                {t('exportDataDesc')}
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color={DesignTokens.colors.text.muted} />
          </View>
        </Pressable>
      </View>
    </SettingsSection>
  );
}
