import React from 'react';
import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

type Props = {
  payload?: string;
  label?: string;
};

export function PaymentQRCode({ payload, label }: Props) {
  if (!payload) {
    return (
      <View style={{ padding: 16, borderRadius: 8, backgroundColor: DesignTokens.colors.surface.raised }}>
        <Text style={{ color: DesignTokens.colors.text.muted, fontSize: 13 }}>
          {t('payments.qrUnavailable')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={{ padding: 12, borderRadius: 8, backgroundColor: DesignTokens.colors.white }}>
        <QRCode value={payload} size={180} />
      </View>
      {label ? (
        <Text style={{ color: DesignTokens.colors.text.muted, fontSize: 12, textAlign: 'center' }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
