import { laterSeriesCount } from '../../utils/lessonSeries';
import React, { useRef, useState } from 'react';
import { View, Text, Alert, Pressable, AlertButton } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Lesson } from '../../types/coach';
import { DesignTokens } from '../../utils/designTokens';
import { getTimeOfDayColor } from '../../utils/dayNav';
import { formatClockTime } from '../../utils/timeFormat';
import { useCoachStore } from '../../state/coachStore';
import { useCurrency } from '../../hooks/useCurrency';
import { SwipeableCard } from '../../components/SwipeableCard';
import { LessonAvatar } from '../../components/LessonAvatar';
import { LessonPaymentSheet } from '../../components/payments/LessonPaymentSheet';
import { PaymentStatusBadge } from '../../components/payments/PaymentStatusBadge';
import { normalizePaymentStatus } from '../../modules/payments';
import { t } from '../../i18n';

// Lesson Card Component
interface LessonCardProps {
  lesson: Lesson;
  onMarkPaid: () => void;
  onCancel: () => void;
  onCancelSeries: () => void;
  onNotePress: () => void;
}

export const LessonCard = React.memo(({ lesson, onMarkPaid, onCancel, onCancelSeries, onNotePress }: LessonCardProps) => {
  const { formatLocationText } = useCoachStore();
  const { formatMoney } = useCurrency();
  const cancelAlertOpenRef = useRef(false);
  const [paymentPanelVisible, setPaymentPanelVisible] = useState(false);

  const handleCancelSwipe = () => {
    if (cancelAlertOpenRef.current) {
      return;
    }

    cancelAlertOpenRef.current = true;

    // Read at tap time so the card does not re-render on every lesson change.
    const later = lesson.seriesId ? laterSeriesCount(useCoachStore.getState().lessons, lesson) : 0;

    Alert.alert(
      t('today.cancelLesson'),
      t('today.cancelLessonWith', { studentName: lesson.studentName }),
      [
        {
          text: t('today.keepLesson'),
          style: 'cancel',
          onPress: () => {
            cancelAlertOpenRef.current = false;
          },
        },
        ...(later > 0
          ? [
              {
                text: t('today.cancelThisAndLater', { later }),
                style: 'destructive' as const,
                onPress: () => {
                  cancelAlertOpenRef.current = false;
                  onCancelSeries();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
              },
            ]
          : []),
        {
          text: later > 0 ? t('today.justThisOne') : t('today.cancelLesson'),
          style: 'destructive',
          onPress: () => {
            cancelAlertOpenRef.current = false;
            onCancel();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
      {
        onDismiss: () => {
          cancelAlertOpenRef.current = false;
        },
      }
    );
  };

  const handleMarkPaidSwipe = () => {
    onMarkPaid();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const showQuickActions = () => {
    const actions: AlertButton[] = [];

    if (!lesson.isPaid) {
      actions.push({
        text: t('payments.markAsPaid'),
        onPress: handleMarkPaidSwipe,
        style: 'default',
      });
    }

    actions.push({
      text: t('payments.paymentRequest'),
      onPress: () => setPaymentPanelVisible(true),
      style: 'default',
    });

    actions.push({
      text: t('today.cancelLesson'),
      onPress: () => {
        if (lesson.seriesId) {
          handleCancelSwipe();
          return;
        }
        onCancel();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      style: 'destructive',
    });

    actions.push({
      text: t('common.close'),
      style: 'cancel',
    });

    Alert.alert(`${lesson.studentName}`, `${lesson.startTime} - ${lesson.endTime}`, actions);
  };

  const locationText = formatLocationText(lesson.areaId, lesson.facilityId, lesson.courtId);
  const timeColor = getTimeOfDayColor(lesson.startTime);
  const paymentStatus = normalizePaymentStatus(lesson.paymentStatus, lesson.isPaid);

  return (
    <>
      <SwipeableCard
        onSwipeRight={!lesson.isPaid ? handleMarkPaidSwipe : undefined}
        onSwipeLeft={handleCancelSwipe}
        onPress={showQuickActions}
        rightSwipeEnabled={!lesson.isPaid}
        rightSwipeText={t('today.swipeMarkPaid')}
        leftSwipeText={t('today.swipeCancel')}
        hideSwipeHints={false}
      >
        <View className="flex-row items-center">
          <LessonAvatar name={lesson.studentName} size={40} />

          <View
            style={{
              width: 4,
              height: 40,
              backgroundColor: timeColor,
              borderRadius: 2,
              marginLeft: DesignTokens.spacing.md,
              marginRight: DesignTokens.spacing.md
            }}
          />

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text
                style={{
                  ...DesignTokens.typography.callout,
                  fontWeight: '600',
                  color: DesignTokens.colors.graphite,
                  flex: 1
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatClockTime(lesson.startTime)} • {lesson.studentName}
              </Text>
              <Text
                style={{
                  ...DesignTokens.typography.callout,
                  fontWeight: '600',
                  color: DesignTokens.colors.graphite,
                  marginLeft: DesignTokens.spacing.lg
                }}
              >
                {formatMoney(lesson.price)}
              </Text>
            </View>

            {locationText && (
              <Text
                style={{
                  ...DesignTokens.typography.footnote,
                  color: DesignTokens.colors.grey,
                  marginTop: 2
                }}
              >
                {locationText}
              </Text>
            )}

            {lesson.notes && (
              <Text
                style={{
                  ...DesignTokens.typography.footnote,
                  fontStyle: 'italic',
                  color: DesignTokens.colors.grey,
                  marginTop: 2
                }}
              >
                {lesson.notes}
              </Text>
            )}

            <View style={{ marginTop: DesignTokens.spacing.sm }}>
              <PaymentStatusBadge status={paymentStatus} isPaid={lesson.isPaid} />
            </View>
          </View>

          <Pressable
            onPress={(e) => { e.stopPropagation(); onNotePress(); }}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: DesignTokens.spacing.sm,
            }}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="document-text-outline" size={20} color={DesignTokens.colors.grey} />
          </Pressable>
        </View>
      </SwipeableCard>

      <LessonPaymentSheet
        lessonId={paymentPanelVisible ? lesson.id : null}
        onClose={() => setPaymentPanelVisible(false)}
      />
    </>
  );
});

LessonCard.displayName = 'LessonCard';
