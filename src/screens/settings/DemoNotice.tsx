import React from 'react';
import { Text, View } from 'react-native';
import { DesignTokens } from '../../utils/designTokens';

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
      <Text style={{ color: DesignTokens.colors.amber.text, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>Demo workspace</Text>
      <Text style={{ color: DesignTokens.colors.amber.text, fontSize: 13, lineHeight: 18 }}>
        You are exploring sample data locally. Nothing is synced to Supabase.
      </Text>
    </View>
  );
}
