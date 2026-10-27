import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay } from 'react-native-reanimated';
import { Lesson } from '../../types/coach';
import { DesignTokens } from '../../utils/designTokens';
import { LessonCard } from './LessonCard';

// Animated Lesson Card with Entrance
interface AnimatedLessonCardProps {
  lesson: Lesson;
  index: number;
  onMarkPaid: () => void;
  onCancel: () => void;
  onCancelSeries: () => void;
  onNotePress: () => void;
}

export function AnimatedLessonCard({ lesson, index, onMarkPaid, onCancel, onCancelSeries, onNotePress }: AnimatedLessonCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * 50; // Staggered entrance
    opacity.value = withDelay(delay, withTiming(1, DesignTokens.animations.fadeIn));
    translateY.value = withDelay(
      delay, 
      withSpring(0, DesignTokens.animations.spring)
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <LessonCard
        lesson={lesson}
        onMarkPaid={onMarkPaid}
        onCancel={onCancel}
        onCancelSeries={onCancelSeries}
        onNotePress={onNotePress}
      />
    </Animated.View>
  );
}
