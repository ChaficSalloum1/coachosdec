import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { CancellationNoticesSheet } from '../../components/CancellationNoticesSheet';
import type { Lesson } from '../../types/coach';
import { isToday } from '../../utils/dayNav';
import { DesignTokens } from '../../utils/designTokens';
import { useDayActions } from './useDayActions';
import { t } from '../../i18n';

interface DayActionsProps {
  dateISO: string;
  lessons: Lesson[];
}

// "Remind students" and "Cancel the rest of the day", shown under the day's lessons.
export function DayActions({ dateISO, lessons }: DayActionsProps) {
  const actions = useDayActions(dateISO, lessons);

  return (
    <>
      {actions.hasUpcoming && (
        <View style={{ marginTop: 24 }}>
          <Pressable
            onPress={actions.openReminders}
            accessibilityRole="button"
            style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '600', color: DesignTokens.colors.accent }}>
              {t('today.remindStudents')}
            </Text>
          </Pressable>
          <Pressable
            onPress={actions.confirmCancelDay}
            accessibilityRole="button"
            style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '600', color: DesignTokens.colors.danger }}>
              {isToday(dateISO) ? t('today.cancelRestOfToday') : t('today.cancelThisDay')}
            </Text>
          </Pressable>
        </View>
      )}

      <CancellationNoticesSheet notices={actions.cancelledNotices} onClose={actions.closeCancelledNotices} />
      <CancellationNoticesSheet notices={actions.reminderNotices} title={t('today.remindStudents')} onClose={actions.closeReminderNotices} />
    </>
  );
}
