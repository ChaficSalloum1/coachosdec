import React from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCoachStore } from '../../state/coachStore';
import { formatHeaderDate, isToday } from '../../utils/dayNav';
import { DesignTokens } from '../../utils/designTokens';
import { buildBookingUrl } from '../../utils/publicBooking';
import { t } from '../../i18n';

interface DayHeaderProps {
  dateISO: string;
  topInset: number;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

// The date, day-to-day arrows, and (on today) a shortcut to share the booking link.
export function DayHeader({ dateISO, topInset, onPreviousDay, onNextDay }: DayHeaderProps) {
  const bookingLink = useCoachStore((s) => s.coach?.bookingLink);
  const bookingUrl = bookingLink ? buildBookingUrl(bookingLink, process.env.EXPO_PUBLIC_BOOKING_BASE_URL) : null;

  return (
    <View
      className="flex-row items-center justify-between bg-white border-b"
      style={{
        paddingTop: topInset + DesignTokens.spacing.md,
        paddingBottom: DesignTokens.spacing.md,
        paddingHorizontal: DesignTokens.spacing['2xl'],
        borderBottomColor: DesignTokens.colors.superLightGrey,
      }}
    >
      <Pressable
        onPress={onPreviousDay}
        className="w-11 h-11 rounded-lg items-center justify-center active:opacity-60"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={t('today.previousDay')}
        accessibilityHint={t('today.previousDayHint')}
      >
        <Ionicons name="chevron-back" size={24} color={DesignTokens.colors.graphite} />
      </Pressable>

      <View className="items-center">
        <Text style={{ ...DesignTokens.typography.title2, color: DesignTokens.colors.graphite }}>{formatHeaderDate(dateISO)}</Text>
        {isToday(dateISO) && (
          <Text
            style={{
              ...DesignTokens.typography.subhead,
              fontWeight: '600',
              color: DesignTokens.colors.accent,
              marginTop: 2,
            }}
          >
            {t('common.today')}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {isToday(dateISO) && bookingUrl && (
          <Pressable
            onPress={() => Share.share({ message: t('today.shareMessage', { bookingUrl }), url: bookingUrl })}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityLabel={t('today.shareBookingLink')}
          >
            <Ionicons name="share-outline" size={22} color={DesignTokens.colors.accent} />
          </Pressable>
        )}
        <Pressable
          onPress={onNextDay}
          className="w-11 h-11 rounded-lg items-center justify-center active:opacity-60"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={t('today.nextDay')}
          accessibilityHint={t('today.nextDayHint')}
        >
          <Ionicons name="chevron-forward" size={24} color={DesignTokens.colors.graphite} />
        </Pressable>
      </View>
    </View>
  );
}
