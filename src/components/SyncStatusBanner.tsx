import React from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOfflineQueueStore } from '../state/offlineQueueStore';
import { summarizeSyncQueue } from '../state/offlineQueueLogic';
import { DesignTokens } from '../utils/designTokens';

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
    ? `${status.stuck} ${status.stuck === 1 ? 'change' : 'changes'} could not sync. Tap for details`
    : `${status.pending} ${status.pending === 1 ? 'change' : 'changes'} waiting to sync`;

  return (
    <Pressable
      onPress={() =>
        Alert.alert(
          stuck ? 'Sync problem' : 'Waiting to sync',
          stuck
            ? `Your changes are saved on this phone and will keep retrying.\n\nLast error: ${status.lastError ?? 'unknown'}`
            : 'Your changes are saved on this phone and will upload automatically when you are back online.'
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
        backgroundColor: stuck ? '#FFF4E0' : DesignTokens.colors.superLightGrey,
      }}
    >
      <Ionicons
        name={stuck ? 'warning-outline' : 'cloud-offline-outline'}
        size={14}
        color={stuck ? '#B26A00' : DesignTokens.colors.grey}
      />
      <Text style={{ ...DesignTokens.typography.caption1, color: stuck ? '#B26A00' : DesignTokens.colors.grey }}>{label}</Text>
    </Pressable>
  );
}
