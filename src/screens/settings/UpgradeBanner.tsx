import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export function UpgradeBanner() {
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.navigate('Paywall' as never)}
      style={{
        backgroundColor: '#0B1220',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Upgrade to CoachOS Pro</Text>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
    </Pressable>
  );
}
