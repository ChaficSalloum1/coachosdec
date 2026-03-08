import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DesignTokens } from '../utils/designTokens';

interface FloatingActionButtonProps {
  onPress: () => void;
  bottom?: number;
  right?: number;
}

export function FloatingActionButton({
  onPress,
  bottom = 16,
  right = 16,
}: FloatingActionButtonProps) {
  const scale = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Scale-in entrance animation
    scale.value = withSpring(1, DesignTokens.animations.spring);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pressScale.value },
    ],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.9, DesignTokens.animations.cardPress);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, DesignTokens.animations.cardPress);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        position: 'absolute',
        bottom,
        right,
      }}
    >
      <Animated.View
        style={[
          {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#007AFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.16,
            shadowRadius: 8,
            elevation: 8,
          },
          animatedStyle,
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Animated.View>
    </Pressable>
  );
}
