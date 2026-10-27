import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens } from '../utils/designTokens';

interface LessonAvatarProps {
  name: string;
  size?: number;
}

export function LessonAvatar({ name, size = 40 }: LessonAvatarProps) {
  // Generate consistent gradient colors from name
  const gradientColors = useMemo(() => {
    const colors = Object.values(DesignTokens.colors.avatar) as [string, string][];
    
    // Simple hash function to pick color consistently
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [name]);
  
  const initial = name.charAt(0).toUpperCase();
  
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: DesignTokens.colors.white,
            fontSize: size * 0.45,
            fontWeight: '600',
          }}
        >
          {initial}
        </Text>
      </LinearGradient>
    </View>
  );
}
