import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DesignTokens } from '../../utils/designTokens';

export function UpgradeBanner() {
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.navigate('Paywall' as never)}
      style={{
        backgroundColor: DesignTokens.colors.text.strong,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '700', color: DesignTokens.colors.white }}>Upgrade to CoachOS Pro</Text>
      <Ionicons name="chevron-forward" size={18} color={DesignTokens.colors.overlay.whiteSoft} />
    </Pressable>
  );
}
