import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LessonAvatarProps {
  name: string;
  size?: number;
}

export function LessonAvatar({ name, size = 40 }: LessonAvatarProps) {
  // Generate consistent gradient colors from name
  const gradientColors = useMemo(() => {
    const colors: [string, string][] = [
      ['#3B82F6', '#60A5FA'], // Blue
      ['#8B5CF6', '#A78BFA'], // Purple
      ['#EC4899', '#F472B6'], // Pink
      ['#F59E0B', '#FBBF24'], // Amber
      ['#10B981', '#34D399'], // Green
      ['#06B6D4', '#22D3EE'], // Cyan
      ['#EF4444', '#F87171'], // Red
      ['#6366F1', '#818CF8'], // Indigo
    ];
    
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
            color: '#FFFFFF',
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
