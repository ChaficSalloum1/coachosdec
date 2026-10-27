import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens } from '../utils/designTokens';

export function DemoBanner() {
  return (
    <View
      style={{
        backgroundColor: DesignTokens.colors.amber.tint,
        borderBottomColor: DesignTokens.colors.amber.border,
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Ionicons name="sparkles-outline" size={16} color={DesignTokens.colors.amber.text} />
      <Text style={{ color: DesignTokens.colors.amber.text, fontSize: 13, fontWeight: '700' }}>
        Demo workspace
      </Text>
      <Text style={{ color: DesignTokens.colors.amber.text, fontSize: 13, flex: 1 }}>
        Sample data only. Nothing syncs.
      </Text>
    </View>
  );
}
