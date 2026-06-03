import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function DemoBanner() {
  return (
    <View
      style={{
        backgroundColor: '#FFF7E0',
        borderBottomColor: '#F2D28A',
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Ionicons name="sparkles-outline" size={16} color="#8A5A00" />
      <Text style={{ color: '#8A5A00', fontSize: 13, fontWeight: '700' }}>
        Demo workspace
      </Text>
      <Text style={{ color: '#8A5A00', fontSize: 13, flex: 1 }}>
        Sample data only. Nothing syncs.
      </Text>
    </View>
  );
}
