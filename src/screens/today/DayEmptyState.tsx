import { useEffect } from 'react';
import { Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat, withDelay, Easing } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

// Empty State with Animation
export function DayEmptyState({ dateISO }: { dateISO: string }) {
  const navigation = useNavigation<any>();
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Floating icon animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    
    // Fade in with delay
    opacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: DesignTokens.spacing['5xl']
        },
        animatedContainerStyle
      ]}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons name="calendar-outline" size={64} color={DesignTokens.colors.grey} />
      </Animated.View>
      <Text
        style={{
          ...DesignTokens.typography.title3,
          color: DesignTokens.colors.graphite,
          marginTop: DesignTokens.spacing.lg,
          marginBottom: DesignTokens.spacing.sm
        }}
      >
        {t('today.noLessonsToday')}
      </Text>
      <Text
        style={{
          ...DesignTokens.typography.body,
          color: DesignTokens.colors.grey,
          textAlign: 'center',
          marginBottom: DesignTokens.spacing['2xl']
        }}
      >
        {t('today.freeDay')}
      </Text>
      <Pressable
        onPress={() => navigation.navigate('Settings', { screen: 'Availability' })}
        className="active:opacity-80"
        style={{
          backgroundColor: DesignTokens.colors.accent,
          paddingHorizontal: DesignTokens.spacing['2xl'],
          paddingVertical: DesignTokens.spacing.md,
          borderRadius: DesignTokens.radius.full,
          minHeight: DesignTokens.touch.minSize
        }}
      >
        <Text
          style={{
            ...DesignTokens.typography.headline,
            color: DesignTokens.colors.white
          }}
        >
          {t('today.addAvailability')}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
