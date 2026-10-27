import React from 'react';
import { Text, View } from 'react-native';

export function DemoNotice() {
  return (
    <View
      style={{
        backgroundColor: '#FFF7E0',
        borderColor: '#F2D28A',
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
      }}
    >
      <Text style={{ color: '#8A5A00', fontSize: 15, fontWeight: '700', marginBottom: 4 }}>Demo workspace</Text>
      <Text style={{ color: '#8A5A00', fontSize: 13, lineHeight: 18 }}>
        You are exploring sample data locally. Nothing is synced to Supabase.
      </Text>
    </View>
  );
}
