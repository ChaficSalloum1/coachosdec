import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PaymentStatus } from '../../modules/payments';
import { getPaymentStatusLabel, normalizePaymentStatus } from '../../modules/payments';

type Props = {
  status?: PaymentStatus;
  isPaid?: boolean;
};

const badgeStyles: Record<PaymentStatus, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  NOT_REQUESTED: { bg: '#FFF7E0', fg: '#8A5A00', icon: 'time-outline' },
  REQUESTED: { bg: '#E8F2FF', fg: '#1E5AA8', icon: 'paper-plane-outline' },
  REMINDER_SENT: { bg: '#F1EAFE', fg: '#6542A6', icon: 'notifications-outline' },
  PAID_CONFIRMED: { bg: '#E8F7EF', fg: '#1F7A45', icon: 'checkmark-circle-outline' },
  FAILED_OR_CANCELLED: { bg: '#FCE8E6', fg: '#B3261E', icon: 'close-circle-outline' },
};

export function PaymentStatusBadge({ status, isPaid }: Props) {
  const normalized = normalizePaymentStatus(status, isPaid);
  const style = badgeStyles[normalized];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: style.bg,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Ionicons name={style.icon} size={13} color={style.fg} />
      <Text
        style={{
          color: style.fg,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {getPaymentStatusLabel(status, isPaid)}
      </Text>
    </View>
  );
}
