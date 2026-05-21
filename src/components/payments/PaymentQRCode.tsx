import React from 'react';
import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type Props = {
  payload?: string;
  label?: string;
};

export function PaymentQRCode({ payload, label }: Props) {
  if (!payload) {
    return (
      <View style={{ padding: 16, borderRadius: 8, backgroundColor: '#F7F8FA' }}>
        <Text style={{ color: '#42526E', fontSize: 13 }}>
          No QR is available for this payment method.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={{ padding: 12, borderRadius: 8, backgroundColor: '#FFFFFF' }}>
        <QRCode value={payload} size={180} />
      </View>
      {label ? (
        <Text style={{ color: '#42526E', fontSize: 12, textAlign: 'center' }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
