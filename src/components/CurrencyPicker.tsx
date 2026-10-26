import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { CURRENCY_CODES, CURRENCY_LABELS, currencySymbol, type CurrencyCode } from '../modules/payments';

interface CurrencyPickerProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
}

// Same chip style as the payment-method chips in Settings.
export function CurrencyPicker({ value, onChange }: CurrencyPickerProps) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {CURRENCY_CODES.map((code) => {
        const selected = value === code;
        const symbol = currencySymbol(code);
        return (
          <Pressable
            key={code}
            onPress={() => onChange(code)}
            accessibilityRole="button"
            accessibilityLabel={CURRENCY_LABELS[code]}
            accessibilityState={{ selected }}
            className="rounded-lg px-3 border"
            style={{
              minHeight: 44,
              justifyContent: 'center',
              backgroundColor: selected ? '#E8F2FF' : '#FFFFFF',
              borderColor: selected ? '#1E88E5' : '#D7DEE8',
            }}
          >
            <Text className="text-sm font-semibold" style={{ color: selected ? '#1E88E5' : '#0B1220' }}>
              {symbol === code ? code : `${symbol} ${code}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
