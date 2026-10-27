import { useEffect } from 'react';
import { Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DesignTokens } from '../../utils/designTokens';

// Jump to Today Button Component
interface JumpToTodayButtonProps {
  onPress: () => void;
  bottom: number;
}

export function JumpToTodayButton({ onPress, bottom }: JumpToTodayButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSpring(1, DesignTokens.animations.spring);
  }, []);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, DesignTokens.animations.cardPress);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, DesignTokens.animations.cardPress);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom,
          left: 0,
          right: 0,
          alignItems: 'center',
          pointerEvents: 'box-none'
        },
        animatedStyle
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: DesignTokens.colors.accent,
          paddingHorizontal: DesignTokens.spacing['2xl'],
          paddingVertical: DesignTokens.spacing.md,
          borderRadius: DesignTokens.radius.full,
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: DesignTokens.touch.minSize,
          ...DesignTokens.shadows.lg
        }}
      >
        <Ionicons name="today" size={20} color={DesignTokens.colors.white} />
        <Text
          style={{
            ...DesignTokens.typography.headline,
            color: DesignTokens.colors.white,
            marginLeft: DesignTokens.spacing.sm
          }}
        >
          Jump to Today
        </Text>
      </Pressable>
    </Animated.View>
  );
}
