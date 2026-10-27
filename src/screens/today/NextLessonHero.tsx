import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Lesson } from '../../types/coach';
import { DesignTokens } from '../../utils/designTokens';
import { formatClockTime } from '../../utils/timeFormat';
import { LessonAvatar } from '../../components/LessonAvatar';
import { t } from '../../i18n';

// Next Lesson Hero — shows the upcoming lesson for today
export function NextLessonHero({ lessons }: { lessons: Lesson[] }) {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, DesignTokens.animations.spring);
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const nowTime = new Date().toTimeString().slice(0, 5);
  const nextLesson = lessons.find(l => l.status === 'scheduled' && l.startTime >= nowTime) ?? null;

  if (!nextLesson) return null;

  // A group is one session: say so once instead of naming whichever player sorts first.
  const groupPlayers = nextLesson.groupId
    ? lessons.filter((l) => l.groupId === nextLesson.groupId && l.status === 'scheduled').length
    : 0;
  const heroTitle = groupPlayers > 0 ? t('today.groupHero', { count: groupPlayers }) : nextLesson.studentName;

  const minutesUntil = () => {
    const [nh, nm] = nowTime.split(':').map(Number);
    const [lh, lm] = nextLesson.startTime.split(':').map(Number);
    return (lh * 60 + lm) - (nh * 60 + nm);
  };

  const mins = minutesUntil();
  const isImminent = mins <= 5;
  const timeLabel = mins <= 0 ? t('today.now') : mins === 1 ? t('today.inOneMinute') : t('today.inMinutes', { count: mins });
  const timeLabelColor = isImminent ? DesignTokens.colors.warning : DesignTokens.colors.success;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: DesignTokens.colors.brand.tintSoft,
          borderWidth: 1,
          borderColor: DesignTokens.colors.accent,
          borderRadius: DesignTokens.radius?.card ?? 12,
          marginHorizontal: 16,
          marginTop: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        animatedStyle,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <LessonAvatar name={groupPlayers > 0 ? t('addLesson.group') : nextLesson.studentName} size={36} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text
            style={{
              ...DesignTokens.typography.caption1,
              fontWeight: '700',
              color: DesignTokens.colors.accent,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {t('today.nextUp')}
          </Text>
          <Text
            style={{
              ...DesignTokens.typography.title3 ?? DesignTokens.typography.headline,
              fontWeight: '700',
              color: DesignTokens.colors.graphite,
            }}
            numberOfLines={1}
          >
            {heroTitle}
          </Text>
          <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey }}>
            {formatClockTime(nextLesson.startTime)} – {formatClockTime(nextLesson.endTime)}
          </Text>
        </View>
      </View>
      <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '600', color: timeLabelColor }}>
        {timeLabel}
      </Text>
    </Animated.View>
  );
}
