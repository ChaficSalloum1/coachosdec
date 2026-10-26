import React from 'react';
import { View, Text } from 'react-native';

import { SwipeableCard } from './SwipeableCard';
import { LessonAvatar } from './LessonAvatar';
import { useCoachStore } from '../state/coachStore';
import { DesignTokens } from '../utils/designTokens';
import { getTimeOfDayColor } from '../utils/dayNav';
import { useCurrency } from '../hooks/useCurrency';
import type { LessonGroup } from '../utils/groupLessons';

const MAX_AVATARS = 4;

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
};

interface GroupLessonCardProps {
  group: LessonGroup;
  onPress: () => void;
}

// One card for a whole group session, in place of one card per player.
export function GroupLessonCard({ group, onPress }: GroupLessonCardProps) {
  const formatLocationText = useCoachStore((s) => s.formatLocationText);
  const { formatMoney } = useCurrency();
  const locationText = formatLocationText(group.areaId, group.facilityId, group.courtId);
  const paidCount = group.lessons.filter((l) => l.isPaid).length;
  const shown = group.lessons.slice(0, MAX_AVATARS);
  const extra = group.lessons.length - shown.length;

  return (
    <SwipeableCard
      onPress={onPress}
      leftSwipeEnabled={false}
      rightSwipeEnabled={false}
      hideSwipeHints
    >
      <View className="flex-row items-center">
        <View style={{ flexDirection: 'row', width: 40 + (shown.length - 1) * 18 }}>
          {shown.map((lesson, i) => (
            <View
              key={lesson.id}
              style={{
                marginLeft: i === 0 ? 0 : -22,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: 'white',
              }}
            >
              <LessonAvatar name={lesson.studentName} size={40} />
            </View>
          ))}
        </View>

        <View
          style={{
            width: 4,
            height: 40,
            backgroundColor: getTimeOfDayColor(group.startTime),
            borderRadius: 2,
            marginLeft: DesignTokens.spacing.md,
            marginRight: DesignTokens.spacing.md,
          }}
        />

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              style={{
                ...DesignTokens.typography.callout,
                fontWeight: '600',
                color: DesignTokens.colors.graphite,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {formatTime(group.startTime)} • Group {group.lessons.length}/{group.capacity}
            </Text>
            <Text
              style={{
                ...DesignTokens.typography.callout,
                fontWeight: '600',
                color: DesignTokens.colors.graphite,
                marginLeft: DesignTokens.spacing.lg,
              }}
            >
              {formatMoney(group.pricePerPlayer)} each
            </Text>
          </View>

          <Text
            style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey, marginTop: 2 }}
            numberOfLines={1}
          >
            {shown.map((l) => l.studentName.split(' ')[0]).join(', ')}
            {extra > 0 ? ` +${extra}` : ''}
          </Text>

          {locationText ? (
            <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey, marginTop: 2 }}>
              {locationText}
            </Text>
          ) : null}

          <Text
            style={{
              ...DesignTokens.typography.footnote,
              fontWeight: '500',
              marginTop: DesignTokens.spacing.sm,
              color:
                paidCount === group.lessons.length ? DesignTokens.colors.success : DesignTokens.colors.grey,
            }}
          >
            {paidCount} of {group.lessons.length} paid
            {group.isFull ? ' • Full' : ` • ${group.spotsLeft} ${group.spotsLeft === 1 ? 'spot' : 'spots'} left`}
          </Text>
        </View>
      </View>
    </SwipeableCard>
  );
}
