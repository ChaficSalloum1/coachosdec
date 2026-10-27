import React from 'react';
import { Linking, Pressable, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PaymentInstruction } from '../../modules/payments';
import { PaymentQRCode } from './PaymentQRCode';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

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
    primary: { bg: DesignTokens.colors.brand.default, fg: DesignTokens.colors.white, border: DesignTokens.colors.brand.default },
    secondary: { bg: DesignTokens.colors.white, fg: DesignTokens.colors.text.strong, border: DesignTokens.colors.brand.outline },
    danger: { bg: DesignTokens.colors.white, fg: DesignTokens.colors.red.deep, border: DesignTokens.colors.red.border },
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
        backgroundColor: disabled ? DesignTokens.colors.surface.disabled : colors.bg,
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
    ? t('payments.sepaQr')
    : instruction.method === 'IRIS'
      ? t('payments.instructionQr')
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
        <Text style={{ color: DesignTokens.colors.text.strong, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
          {instruction.title}
        </Text>
        <Text style={{ color: DesignTokens.colors.text.muted, fontSize: 13, lineHeight: 18 }}>
          {instruction.displayText}
        </Text>
      </View>

      <PaymentQRCode payload={instruction.qrPayload} label={qrLabel} />

      <View style={{ padding: 12, backgroundColor: DesignTokens.colors.surface.raised, borderRadius: 8 }}>
        <Text style={{ color: DesignTokens.colors.text.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
          {t('payments.messagePreview')}
        </Text>
        <Text style={{ color: DesignTokens.colors.text.strong, fontSize: 13, lineHeight: 18 }}>
          {message}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <ActionButton label={t('payments.requestPayment')} icon="paper-plane-outline" onPress={onRequestPayment} />
        <ActionButton label={t('payments.shareMessage')} icon="share-outline" onPress={shareMessage} variant="secondary" />
        {instruction.externalUrl ? (
          <ActionButton label={t('payments.openRevolut')} icon="open-outline" onPress={openExternal} variant="secondary" />
        ) : null}
        <ActionButton
          label={t('payments.sendReminder')}
          icon="notifications-outline"
          onPress={onSendReminder}
          variant="secondary"
          disabled={!canSendReminder}
        />
        <ActionButton label={t('payments.markAsPaid')} icon="checkmark-circle-outline" onPress={onMarkPaid} variant="secondary" />
        <ActionButton label={t('payments.markAsCancelled')} icon="close-circle-outline" onPress={onCancelPayment} variant="danger" />
      </View>
    </View>
  );
}
