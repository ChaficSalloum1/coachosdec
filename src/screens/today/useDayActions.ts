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
import { t } from '../../i18n';

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
      upcoming.length === 1 ? t('today.cancelOneLessonTitle') : t('today.cancelLessonsTitle', { count: upcoming.length }),
      isToday(dateISO) ? t('today.cancelDayBodyToday') : t('today.cancelDayBodyOther'),
      [
        { text: t('today.keepLessons'), style: 'cancel' },
        {
          text: t('today.cancelLessons'),
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
