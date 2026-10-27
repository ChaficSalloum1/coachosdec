import React from 'react';
import { Text, View } from 'react-native';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

export function DemoNotice() {
  return (
    <View
      style={{
        backgroundColor: DesignTokens.colors.amber.tint,
        borderColor: DesignTokens.colors.amber.border,
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
      }}
    >
      <Text style={{ color: DesignTokens.colors.amber.text, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>{t('shell.demoTitle')}</Text>
      <Text style={{ color: DesignTokens.colors.amber.text, fontSize: 13, lineHeight: 18 }}>
        {t('settings.demoNotice')}
      </Text>
    </View>
  );
}
