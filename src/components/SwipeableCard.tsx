import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DesignTokens } from '../utils/designTokens';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  onPress?: () => void;
  rightSwipeEnabled?: boolean;
  leftSwipeEnabled?: boolean;
  rightSwipeText?: string;
  leftSwipeText?: string;
  hideSwipeHints?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  onPress,
  rightSwipeEnabled = true,
  leftSwipeEnabled = true,
  rightSwipeText = "Swipe right →",
  leftSwipeText = "← Swipe left",
  hideSwipeHints = false,
}: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const hapticTriggered = useSharedValue(false);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Background color reveal animations
  const rightBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      translateX.value,
      [0, 40, 128],
      [0, 0.3, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity: backgroundColor,
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      backgroundColor: DesignTokens.colors.success,
      borderRadius: DesignTokens.radius.card,
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingLeft: DesignTokens.spacing['2xl'],
    };
  });

  const leftBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      translateX.value,
      [-128, -40, 0],
      [1, 0.3, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: backgroundColor,
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      backgroundColor: DesignTokens.colors.danger,
      borderRadius: DesignTokens.radius.card,
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: DesignTokens.spacing['2xl'],
    };
  });

  // Icon reveal animations
  const rightIconStyle = useAnimatedStyle(() => {
    const iconOpacity = interpolate(
      translateX.value,
      [30, 60],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: iconOpacity,
    };
  });

  const leftIconStyle = useAnimatedStyle(() => {
    const iconOpacity = interpolate(
      translateX.value,
      [-60, -30],
      [1, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: iconOpacity,
    };
  });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      
      // Trigger haptic at threshold
      const threshold = 128;
      if (Math.abs(event.translationX) >= threshold && !hapticTriggered.value) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        hapticTriggered.value = true;
      } else if (Math.abs(event.translationX) < threshold) {
        hapticTriggered.value = false;
      }
    })
    .onEnd((event) => {
      const shouldTrigger = Math.abs(event.translationX) > 128;
      const direction = event.translationX > 0 ? 'right' : 'left';

      if (shouldTrigger) {
        if (direction === 'right' && rightSwipeEnabled && onSwipeRight) {
          // Scale out and fade before action
          scale.value = withSpring(0.9);
          opacity.value = withSpring(0.5, {}, () => {
            runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
            runOnJS(onSwipeRight)();
          });
        } else if (direction === 'left' && leftSwipeEnabled && onSwipeLeft) {
          // Scale out and fade before action
          scale.value = withSpring(0.9);
          opacity.value = withSpring(0.5, {}, () => {
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
            runOnJS(onSwipeLeft)();
          });
        }
      }

      // Spring back
      translateX.value = withSpring(0);
      if (!shouldTrigger) {
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
      }
    });

  const tapGesture = Gesture.Tap()
    .onTouchesDown(() => {
      scale.value = withSpring(0.97);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onTouchesUp(() => {
      scale.value = withSpring(1);
    })
    .onEnd(() => {
      if (onPress) {
        runOnJS(onPress)();
      }
    });

  const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  return (
    <View style={{ position: 'relative' }}>
      {/* Right swipe background (green - mark paid) */}
      {rightSwipeEnabled && (
        <Animated.View style={rightBackgroundStyle}>
          <Animated.View style={rightIconStyle}>
            <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      )}
      
      {/* Left swipe background (red - cancel) */}
      {leftSwipeEnabled && (
        <Animated.View style={leftBackgroundStyle}>
          <Animated.View style={leftIconStyle}>
            <Ionicons name="close-circle" size={32} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      )}

      {/* Card content */}
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={cardStyle}>
          <View
            style={{
              backgroundColor: DesignTokens.colors.white,
              borderRadius: DesignTokens.radius.card,
              padding: DesignTokens.spacing.lg,
              ...DesignTokens.shadows.default
            }}
          >
            {children}

            {/* Swipe hints */}
            {!hideSwipeHints && (rightSwipeEnabled || leftSwipeEnabled) && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: DesignTokens.spacing.md,
                  paddingTop: DesignTokens.spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: DesignTokens.colors.superLightGrey
                }}
              >
                {rightSwipeEnabled && rightSwipeText && (
                  <Text
                    style={{
                      ...DesignTokens.typography.caption1,
                      fontWeight: '600',
                      color: DesignTokens.colors.success
                    }}
                  >
                    {rightSwipeText}
                  </Text>
                )}
                {leftSwipeEnabled && leftSwipeText && (
                  <Text
                    style={{
                      ...DesignTokens.typography.caption1,
                      fontWeight: '600',
                      color: DesignTokens.colors.danger
                    }}
                  >
                    {leftSwipeText}
                  </Text>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
