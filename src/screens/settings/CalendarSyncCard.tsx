import React from 'react';
import { View, Text, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../../state/toastStore';
import { Coach } from '../../types/coach';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

interface CalendarSyncCardProps {
  coach: Coach;
  onUpdate: (updates: Partial<Coach>) => void;
}

export function CalendarSyncCard({ coach, onUpdate }: CalendarSyncCardProps) {
  const [isInitializing, setIsInitializing] = React.useState(false);

  const handleToggle = async (value: boolean) => {
    if (value) {
      // Request calendar permissions when enabling
      setIsInitializing(true);
      try {
        const { CalendarService } = await import('../../utils/calendarService');
        const hasPermission = await CalendarService.checkPermissions();

        if (!hasPermission) {
          const initialized = await CalendarService.initialize();
          if (!initialized) {
            Alert.alert(
              t('settings.calendarAccessRequired'),
              t('settings.calendarAccessMessage'),
              [{ text: t('common.ok') }]
            );
            return;
          }
        }

        onUpdate({ calendarSyncEnabled: true });
        showToast(t('settings.calendarSyncEnabled'), 'success');
      } catch {
        showToast(t('settings.calendarSyncFailed'), 'error');
      } finally {
        setIsInitializing(false);
      }
    } else {
      onUpdate({ calendarSyncEnabled: false });
    }
  };

  return (
    <View className="bg-gray-50 rounded-card p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="calendar-outline" size={20} color={DesignTokens.colors.brand.default} style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
              {t('settings.syncToCalendar')}
            </Text>
          </View>
          <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
            {t('settings.syncToCalendarDesc')}
          </Text>
        </View>
        <Switch
          value={coach.calendarSyncEnabled ?? false}
          onValueChange={handleToggle}
          disabled={isInitializing}
          trackColor={{ false: DesignTokens.colors.line.default, true: DesignTokens.colors.brand.default }}
          thumbColor={DesignTokens.colors.white}
        />
      </View>

      {coach.calendarSyncEnabled && (
        <View className="bg-blue-50 rounded-lg p-3 mt-2">
          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color={DesignTokens.colors.brand.default} style={{ marginRight: 6, marginTop: 2 }} />
            <Text className="text-xs flex-1" style={{ color: DesignTokens.colors.brand.default }}>
              {t('settings.calendarSyncActive')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
