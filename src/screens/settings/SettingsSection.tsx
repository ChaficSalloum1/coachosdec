import React from 'react';
import { View, Text } from 'react-native';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SectionProps) {
  return (
    <View className="mb-8">
      <Text className="text-section font-semibold text-ink-900 mb-4">
        {title}
      </Text>
      {children}
    </View>
  );
}
