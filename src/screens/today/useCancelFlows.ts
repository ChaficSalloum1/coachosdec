/*
Cancelling a lesson from the day view: cancel it, then offer to tell the
student in one tap (their messaging app opens with the text written).
Handlers read the live store, so they stay correct even when a cached day page
last rendered a while ago.
*/
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { useCoachStore } from '../../state/coachStore';
import { showToast } from '../../state/toastStore';
import { buildCancellationNotices, type CancellationNotice } from '../../utils/cancellationMessage';
import { futureSeriesLessons } from '../../utils/lessonSeries';

const firstName = (name: string) => name.split(' ')[0];

function offerMessage(notice: CancellationNotice) {
  Alert.alert('Lessons cancelled', `Let ${firstName(notice.studentName)} know?`, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Message', onPress: () => Linking.openURL(notice.url as string).catch(() => {}) },
  ]);
}

export function useCancelFlows() {
  // Several students to tell after cancelling a series: shown as a list.
  const [seriesNotices, setSeriesNotices] = useState<CancellationNotice[] | null>(null);

  const cancelAndOfferMessage = useCallback(async (lessonId: string) => {
    const { lessons, students, coach, cancelLesson } = useCoachStore.getState();
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson || lesson.status === 'cancelled') return;

    await cancelLesson(lessonId);

    const [notice] = buildCancellationNotices({ lessons: [lesson], students, coachName: coach?.name, platform: Platform.OS });
    if (notice?.url) offerMessage(notice);
  }, []);

  // "This and all later": cancel the rest of a weekly series, then one message per student.
  const cancelSeriesAndOfferMessage = useCallback(async (lessonId: string) => {
    const { lessons, students, coach, cancelSeriesFrom } = useCoachStore.getState();
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const affected = futureSeriesLessons(lessons, lesson);
    await cancelSeriesFrom(lessonId);
    const count = affected.length || 1;
    showToast(`Cancelled ${count} ${count === 1 ? 'lesson' : 'lessons'}`, 'success');

    const notices = buildCancellationNotices({
      lessons: affected,
      students,
      coachName: coach?.name,
      platform: Platform.OS,
      weekly: true,
    }).filter((n) => n.url);
    if (notices.length === 1) offerMessage(notices[0]);
    else if (notices.length > 1) setSeriesNotices(notices);
  }, []);

  return {
    cancelAndOfferMessage,
    cancelSeriesAndOfferMessage,
    seriesNotices,
    closeSeriesNotices: useCallback(() => setSeriesNotices(null), []),
  };
}
