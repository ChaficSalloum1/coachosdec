import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { formatDateForDisplay } from '../utils/dayNav';

import { useCoachStore } from '../state/coachStore';
import { BookingRequest } from '../types/coach';
import { SwipeableCard } from '../components/SwipeableCard';
import { SkeletonRow } from '../components/Skeleton';
import { DesignTokens } from '../utils/designTokens';
import { formatClockTime } from '../utils/timeFormat';
import { t } from '../i18n';

export function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { getPendingRequests, approveBookingRequest, declineBookingRequest, availabilityRanges, lessons, bookingRequests, isInitialSyncComplete } = useCoachStore();
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const isLoading = !isInitialSyncComplete;
  const pendingRequests = getPendingRequests();

  const getOpenSlotsForRequest = (requestId: string): string[] => {
    const request = bookingRequests.find(r => r.id === requestId);
    if (!request) return [];
    const dayOfWeek = new Date(request.requestedDate + 'T12:00:00').getDay();
    const dayRanges = availabilityRanges.filter(r => r.dayOfWeek === dayOfWeek);
    const slots: string[] = [];
    for (const range of dayRanges) {
      const [startH] = range.startTime.split(':').map(Number);
      const [endH] = range.endTime.split(':').map(Number);
      for (let h = startH; h < endH; h++) {
        const slot = `${String(h).padStart(2, '0')}:00`;
        const hasLesson = lessons.some(
          l => l.date === request.requestedDate && l.startTime === slot && l.status !== 'cancelled'
        );
        if (!hasLesson) slots.push(slot);
      }
    }
    return slots.slice(0, 3);
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setApprovingId(requestId);
      await approveBookingRequest(requestId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const errorMessage = error instanceof Error ? error.message : t('requests.approveFallbackError');
      const request = bookingRequests.find(r => r.id === requestId);
      const openSlots = getOpenSlotsForRequest(requestId);

      const slotsMessage = openSlots.length > 0
        ? t('requests.openSlotsOn', {
            date: request?.requestedDate ?? t('requests.thatDay'),
            slots: openSlots.map(formatClockTime).join('  ·  '),
            name: request?.studentName ?? t('requests.theStudent'),
          })
        : '';

      Alert.alert(
        t('requests.unableToApprove'),
        errorMessage + slotsMessage,
        [{ text: t('common.ok') }]
      );
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-xl font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
          {t('requests.title')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      >
        <View className="px-4 py-6">
          {isLoading ? (
            <View className="space-y-3">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </View>
          ) : pendingRequests.length === 0 ? (
            <EmptyState />
          ) : (
            <View className="space-y-3">
              {pendingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApprove={() => handleApproveRequest(request.id)}
                  onDecline={() => declineBookingRequest(request.id)}
                  isApproving={approvingId === request.id}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function EmptyState() {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: DesignTokens.spacing['5xl']
      }}
    >
      <Ionicons name="mail-outline" size={64} color={DesignTokens.colors.grey} />
      <Text
        style={{
          ...DesignTokens.typography.title3,
          color: DesignTokens.colors.graphite,
          marginTop: DesignTokens.spacing.lg,
          marginBottom: DesignTokens.spacing.sm
        }}
      >
        {t('requests.noneTitle')}
      </Text>
      <Text
        style={{
          ...DesignTokens.typography.body,
          color: DesignTokens.colors.grey,
          textAlign: 'center'
        }}
      >
        {t('requests.noneBody')}
      </Text>
    </View>
  );
}

interface RequestCardProps {
  request: BookingRequest;
  onApprove: () => void;
  onDecline: () => void;
  isApproving?: boolean;
}

function RequestCard({ request, onApprove, onDecline, isApproving }: RequestCardProps) {
  const { formatLocationText } = useCoachStore();
  const approvalAlertOpenRef = React.useRef(false);
  const declineAlertOpenRef = React.useRef(false);

  const handleApproveSwipe = () => {
    if (approvalAlertOpenRef.current) {
      return;
    }

    approvalAlertOpenRef.current = true;

    Alert.alert(
      t('requests.approveTitle'),
      t('requests.approveBody', { name: request.studentName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {
            approvalAlertOpenRef.current = false;
          },
        },
        {
          text: t('requests.approve'),
          style: 'default',
          onPress: () => {
            approvalAlertOpenRef.current = false;
            onApprove();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
      {
        onDismiss: () => {
          approvalAlertOpenRef.current = false;
        },
      }
    );
  };

  const handleDeclineSwipe = () => {
    if (declineAlertOpenRef.current) {
      return;
    }

    declineAlertOpenRef.current = true;

    Alert.alert(
      t('requests.declineTitle'),
      t('requests.declineBody', { name: request.studentName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {
            declineAlertOpenRef.current = false;
          },
        },
        {
          text: t('requests.decline'),
          style: 'destructive',
          onPress: () => {
            declineAlertOpenRef.current = false;
            onDecline();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ],
      {
        onDismiss: () => {
          declineAlertOpenRef.current = false;
        },
      }
    );
  };

  const showRequestDetails = () => {
    Alert.alert(
      request.studentName,
      t('requests.detailsBody', {
        date: formatDate(request.requestedDate),
        time: formatClockTime(request.requestedTime),
        duration: request.duration,
        contact: request.studentContact,
        note: request.note ? t('requests.detailsNote', { note: request.note }) : '',
      }),
      [
        {
          text: t('requests.approve'),
          onPress: () => {
            onApprove();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          style: 'default',
        },
        {
          text: t('requests.decline'),
          onPress: () => {
            onDecline();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
          style: 'destructive',
        },
        {
          text: t('common.close'),
          style: 'cancel',
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDateForDisplay(date);
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('requests.justNow');
    if (diffInMinutes < 60) return t('requests.minutesAgo', { count: diffInMinutes });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('requests.hoursAgo', { count: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    return t('requests.daysAgo', { count: diffInDays });
  };

  return (
    <SwipeableCard
      onSwipeRight={handleApproveSwipe}
      onSwipeLeft={handleDeclineSwipe}
      onPress={showRequestDetails}
      rightSwipeText={t('requests.swipeApprove')}
      leftSwipeText={t('requests.swipeDecline')}
    >
      {isApproving && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: DesignTokens.colors.overlay.whiteStrong,
            borderRadius: DesignTokens.radius.card,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          <View
            style={{
              backgroundColor: DesignTokens.colors.accent,
              borderRadius: DesignTokens.radius.full,
              padding: DesignTokens.spacing.md
            }}
          >
            <Ionicons name="checkmark" size={24} color="white" />
          </View>
          <Text
            style={{
              ...DesignTokens.typography.subhead,
              fontWeight: '600',
              color: DesignTokens.colors.graphite,
              marginTop: DesignTokens.spacing.sm
            }}
          >
            {t('requests.approving')}
          </Text>
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: DesignTokens.spacing.md
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...DesignTokens.typography.headline,
              color: DesignTokens.colors.graphite,
              marginBottom: DesignTokens.spacing.xs
            }}
          >
            {request.studentName}
          </Text>
          {(request.areaId || request.facilityId || request.courtId) && (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                ...DesignTokens.typography.callout,
                color: DesignTokens.colors.grey
              }}
            >
              {formatLocationText(request.areaId, request.facilityId, request.courtId)}
            </Text>
          )}
          <Text
            style={{
              ...DesignTokens.typography.callout,
              color: DesignTokens.colors.grey,
              marginTop: DesignTokens.spacing.xs
            }}
          >
            {t('requests.dateAndTime', { date: formatDate(request.requestedDate), time: formatClockTime(request.requestedTime) })}
          </Text>
          <Text
            style={{
              ...DesignTokens.typography.footnote,
              color: DesignTokens.colors.grey,
              marginTop: DesignTokens.spacing.xs
            }}
          >
            {t('requests.durationAndContact', { duration: request.duration, contact: request.studentContact })}
          </Text>
        </View>

        <View style={{ marginLeft: DesignTokens.spacing.lg }}>
          <Text
            style={{
              ...DesignTokens.typography.caption1,
              fontWeight: '600',
              color: DesignTokens.colors.grey
            }}
          >
            {getTimeAgo(request.createdAt)}
          </Text>
        </View>
      </View>

      {request.note && (
        <View
          style={{
            backgroundColor: DesignTokens.colors.superLightGrey,
            borderRadius: DesignTokens.radius.default,
            padding: DesignTokens.spacing.md,
            marginBottom: DesignTokens.spacing.md
          }}
        >
          <Text
            style={{
              ...DesignTokens.typography.footnote,
              color: DesignTokens.colors.grey
            }}
          >
            {t('common.quoted', { text: request.note })}
          </Text>
        </View>
      )}
    </SwipeableCard>
  );
}
