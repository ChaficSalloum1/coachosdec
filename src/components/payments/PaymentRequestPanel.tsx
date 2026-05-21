import React from 'react';
import { Linking, Pressable, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PaymentInstruction } from '../../modules/payments';
import { PaymentQRCode } from './PaymentQRCode';

type Props = {
  instruction: PaymentInstruction;
  message: string;
  onRequestPayment: () => void;
  onSendReminder: () => void;
  onMarkPaid: () => void;
  onCancelPayment: () => void;
  canSendReminder: boolean;
};

function ActionButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const colors = {
    primary: { bg: '#1E88E5', fg: '#FFFFFF', border: '#1E88E5' },
    secondary: { bg: '#FFFFFF', fg: '#0B1220', border: '#D7DEE8' },
    danger: { bg: '#FFFFFF', fg: '#B3261E', border: '#F0B8B3' },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        minHeight: 44,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: disabled ? '#EEF1F5' : colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 12,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Ionicons name={icon} size={17} color={colors.fg} />
      <Text style={{ color: colors.fg, fontWeight: '700', fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function PaymentRequestPanel({
  instruction,
  message,
  onRequestPayment,
  onSendReminder,
  onMarkPaid,
  onCancelPayment,
  canSendReminder,
}: Props) {
  const qrLabel = instruction.method === 'IBAN'
    ? 'SEPA-compatible QR where supported by the client bank.'
    : instruction.method === 'IRIS'
      ? 'Instruction QR only. Clients complete payment in their own bank app.'
      : undefined;

  const shareMessage = async () => {
    await Share.share({ message });
  };

  const openExternal = async () => {
    if (!instruction.externalUrl) return;
    await Linking.openURL(instruction.externalUrl);
  };

  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text style={{ color: '#0B1220', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
          {instruction.title}
        </Text>
        <Text style={{ color: '#42526E', fontSize: 13, lineHeight: 18 }}>
          {instruction.displayText}
        </Text>
      </View>

      <PaymentQRCode payload={instruction.qrPayload} label={qrLabel} />

      <View style={{ padding: 12, backgroundColor: '#F7F8FA', borderRadius: 8 }}>
        <Text style={{ color: '#42526E', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
          Message preview
        </Text>
        <Text style={{ color: '#0B1220', fontSize: 13, lineHeight: 18 }}>
          {message}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <ActionButton label="Request Payment" icon="paper-plane-outline" onPress={onRequestPayment} />
        <ActionButton label="Share Message" icon="share-outline" onPress={shareMessage} variant="secondary" />
        {instruction.externalUrl ? (
          <ActionButton label="Open Revolut Link" icon="open-outline" onPress={openExternal} variant="secondary" />
        ) : null}
        <ActionButton
          label="Send Reminder"
          icon="notifications-outline"
          onPress={onSendReminder}
          variant="secondary"
          disabled={!canSendReminder}
        />
        <ActionButton label="Mark as Paid" icon="checkmark-circle-outline" onPress={onMarkPaid} variant="secondary" />
        <ActionButton label="Mark as Cancelled" icon="close-circle-outline" onPress={onCancelPayment} variant="danger" />
      </View>
    </View>
  );
}
