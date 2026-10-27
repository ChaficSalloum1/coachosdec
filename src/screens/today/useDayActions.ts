/*
Things a coach does to a whole day: remind everyone still to come, or cancel
the rest of it (rain-out). Each ends with one tap per student to send a message.
*/
import { useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useCoachStore } from '../../state/coachStore';
import type { Lesson } from '../../types/coach';
import {
  buildCancellationNotices,
  buildReminderNotices,
  lessonsToCancelForDay,
  type CancellationNotice,
} from '../../utils/cancellationMessage';
import { isToday } from '../../utils/dayNav';

export function useDayActions(dateISO: string, lessons: Lesson[]) {
  const [cancelledNotices, setCancelledNotices] = useState<CancellationNotice[] | null>(null);
  const [reminderNotices, setReminderNotices] = useState<CancellationNotice[] | null>(null);

  // Lessons still to come on this day (none once the day is over).
  const upcoming = useMemo(() => lessonsToCancelForDay(lessons, dateISO), [lessons, dateISO]);

  const openReminders = () => {
    const { students, coach, formatLocationText } = useCoachStore.getState();
    setReminderNotices(
      buildReminderNotices({
        lessons: upcoming,
        students,
        coachName: coach?.name,
        platform: Platform.OS,
        locationFor: (l) => formatLocationText(l.areaId, l.facilityId, l.courtId),
      })
    );
  };

  const confirmCancelDay = () => {
    Alert.alert(
      upcoming.length === 1 ? 'Cancel 1 lesson?' : `Cancel ${upcoming.length} lessons?`,
      isToday(dateISO) ? 'This cancels everything still to come today.' : 'This cancels every lesson on this day.',
      [
        { text: 'Keep lessons', style: 'cancel' },
        {
          text: 'Cancel lessons',
          style: 'destructive',
          onPress: async () => {
            const toCancel = upcoming;
            const { cancelLesson } = useCoachStore.getState();
            for (const lesson of toCancel) {
              await cancelLesson(lesson.id);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const { students, coach } = useCoachStore.getState();
            setCancelledNotices(
              buildCancellationNotices({ lessons: toCancel, students, coachName: coach?.name, platform: Platform.OS })
            );
          },
        },
      ]
    );
  };

  return {
    hasUpcoming: upcoming.length > 0,
    cancelledNotices,
    closeCancelledNotices: () => setCancelledNotices(null),
    reminderNotices,
    closeReminderNotices: () => setReminderNotices(null),
    openReminders,
    confirmCancelDay,
  };
}
