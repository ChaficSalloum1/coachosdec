import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: ViewStyle;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style, className }: SkeletonProps) {
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={className}
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#E5E7EB' } as any,
        animatedStyle as any,
        style as any,
      ]}
    />
  );
}

export function SkeletonRow() {
  return (
    <View className="bg-white rounded-xl border border-gray-200 p-4">
      <Skeleton width={180} height={18} />
      <Skeleton width={'70%'} height={16} style={{ marginTop: 8 }} />
      <Skeleton width={'50%'} height={14} style={{ marginTop: 8 }} />
    </View>
  );
}
