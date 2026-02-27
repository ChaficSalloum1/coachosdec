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

export function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { getPendingRequests, approveBookingRequest, declineBookingRequest } = useCoachStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  React.useEffect(() => { const t = setTimeout(() => setIsLoading(false), 500); return () => clearTimeout(t); }, []);
  const pendingRequests = getPendingRequests();

  const handleApproveRequest = async (requestId: string) => {
    try {
      setApprovingId(requestId);
      await approveBookingRequest(requestId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const errorMessage = error instanceof Error ? error.message : 'Unable to approve this booking due to a scheduling conflict.';
      
      Alert.alert(
        'Unable to Approve',
        errorMessage,
        [
          { text: 'OK' },
          ...(errorMessage.includes('Court conflict') ? [
            {
              text: 'Try Different Time',
              style: 'default' as const,
              onPress: () => {
                // In a full implementation, this could navigate to a time selection screen
                console.log('User wants to suggest different time');
              }
            }
          ] : [])
        ]
      );
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-xl font-semibold" style={{ color: '#0B1220' }}>
          Requests
        </Text>
      </View>

      <ScrollView className="flex-1">
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
        No pending requests
      </Text>
      <Text
        style={{
          ...DesignTokens.typography.body,
          color: DesignTokens.colors.grey,
          textAlign: 'center'
        }}
      >
        All caught up! New booking requests{"\n"}will appear here.
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

  const handleApproveSwipe = () => {
    Alert.alert(
      'Approve Booking',
      `Approve lesson with ${request.studentName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            onApprove();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleDeclineSwipe = () => {
    Alert.alert(
      'Decline Booking',
      `Decline lesson request from ${request.studentName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            onDecline();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const showRequestDetails = () => {
    Alert.alert(
      request.studentName,
      `${formatDate(request.requestedDate)} at ${formatTime(request.requestedTime)}\n${request.duration} minutes\n\nContact: ${request.studentContact}\n${request.note ? `\nNote: ${request.note}` : ''}`,
      [
        {
          text: 'Approve',
          onPress: handleApproveSwipe,
          style: 'default',
        },
        {
          text: 'Decline',
          onPress: handleDeclineSwipe,
          style: 'destructive',
        },
        {
          text: 'Close',
          style: 'cancel',
        },
      ]
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDateForDisplay(date);
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <SwipeableCard
      onSwipeRight={handleApproveSwipe}
      onSwipeLeft={handleDeclineSwipe}
      onPress={showRequestDetails}
      rightSwipeText="Swipe right to approve →"
      leftSwipeText="← Swipe left to decline"
    >
      {isApproving && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
            Approving...
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
            {formatDate(request.requestedDate)} • {formatTime(request.requestedTime)}
          </Text>
          <Text
            style={{
              ...DesignTokens.typography.footnote,
              color: DesignTokens.colors.grey,
              marginTop: DesignTokens.spacing.xs
            }}
          >
            {request.duration} minutes • {request.studentContact}
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
            "{request.note}"
          </Text>
        </View>
      )}
    </SwipeableCard>
  );
}