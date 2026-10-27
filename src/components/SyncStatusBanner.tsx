import React from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOfflineQueueStore } from '../state/offlineQueueStore';
import { summarizeSyncQueue } from '../state/offlineQueueLogic';
import { DesignTokens } from '../utils/designTokens';
import { t } from '../i18n';

// Shown only while changes are saved on this phone but not yet in the cloud,
// as a small pill beside the add button. Offline is normal for a coach on
// court, so it is a quiet grey note; if the
// same writes keep failing it turns amber and tapping it shows the reason.
export function SyncStatusBanner() {
  const insets = useSafeAreaInsets();
  const queue = useOfflineQueueStore((s) => s.queue);
  const status = summarizeSyncQueue(queue);

  if (status.pending === 0) return null;

  const stuck = status.stuck > 0;
  const label = stuck
    ? t('sync.couldNotSync', { count: status.stuck })
    : t('sync.waiting', { count: status.pending });

  return (
    <Pressable
      onPress={() =>
        Alert.alert(
          stuck ? t('sync.problemTitle') : t('sync.waitingTitle'),
          stuck
            ? t('sync.problemBody', { error: status.lastError ?? 'unknown' })
            : t('sync.waitingBody')
        )
      }
      accessibilityRole="button"
      style={{
        position: 'absolute',
        left: 16,
        bottom: insets.bottom + 84,
        maxWidth: '65%',
        zIndex: 10,
        minHeight: 36,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: stuck ? DesignTokens.colors.amber.tint : DesignTokens.colors.superLightGrey,
      }}
    >
      <Ionicons
        name={stuck ? 'warning-outline' : 'cloud-offline-outline'}
        size={14}
        color={stuck ? DesignTokens.colors.amber.textWarm : DesignTokens.colors.grey}
      />
      <Text style={{ ...DesignTokens.typography.caption1, color: stuck ? DesignTokens.colors.amber.textWarm : DesignTokens.colors.grey }}>{label}</Text>
    </Pressable>
  );
}
