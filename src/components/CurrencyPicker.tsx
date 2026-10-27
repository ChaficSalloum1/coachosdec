import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { CURRENCY_CODES, currencyLabel, currencySymbol, type CurrencyCode } from '../modules/payments';
import { DesignTokens } from '../utils/designTokens';

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
            accessibilityLabel={currencyLabel(code)}
            accessibilityState={{ selected }}
            className="rounded-lg px-3 border"
            style={{
              minHeight: 44,
              justifyContent: 'center',
              backgroundColor: selected ? DesignTokens.colors.brand.tint : DesignTokens.colors.white,
              borderColor: selected ? DesignTokens.colors.brand.default : DesignTokens.colors.brand.outline,
            }}
          >
            <Text className="text-sm font-semibold" style={{ color: selected ? DesignTokens.colors.brand.default : DesignTokens.colors.text.strong }}>
              {symbol === code ? code : `${symbol} ${code}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
