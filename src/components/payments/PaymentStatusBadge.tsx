import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PaymentStatus } from '../../modules/payments';
import { getPaymentStatusLabel, normalizePaymentStatus } from '../../modules/payments';
import { DesignTokens } from '../../utils/designTokens';

type Props = {
  status?: PaymentStatus;
  isPaid?: boolean;
};

const badgeStyles: Record<PaymentStatus, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  NOT_REQUESTED: { bg: DesignTokens.colors.amber.tint, fg: DesignTokens.colors.amber.text, icon: 'time-outline' },
  REQUESTED: { bg: DesignTokens.colors.brand.tint, fg: DesignTokens.colors.brand.statusText, icon: 'paper-plane-outline' },
  REMINDER_SENT: { bg: DesignTokens.colors.violet.tint, fg: DesignTokens.colors.violet.text, icon: 'notifications-outline' },
  PAID_CONFIRMED: { bg: DesignTokens.colors.green.tint, fg: DesignTokens.colors.green.statusText, icon: 'checkmark-circle-outline' },
  FAILED_OR_CANCELLED: { bg: DesignTokens.colors.red.tint, fg: DesignTokens.colors.red.deep, icon: 'close-circle-outline' },
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
