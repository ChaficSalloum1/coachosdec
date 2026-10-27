import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { Extrapolate, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import type { EdgeInsets } from 'react-native-safe-area-context';

import { GroupLessonCard } from '../../components/GroupLessonCard';
import { GroupLessonSheet } from '../../components/GroupLessonSheet';
import { QuickNoteSheet } from '../../components/QuickNoteSheet';
import type { Lesson } from '../../types/coach';
import { isToday } from '../../utils/dayNav';
import { buildDayItems } from '../../utils/groupLessons';
import { AnimatedLessonCard } from './AnimatedLessonCard';
import { DayActions } from './DayActions';
import { DayEmptyState } from './DayEmptyState';
import { DayHeader } from './DayHeader';
import { NextLessonHero } from './NextLessonHero';

const PAGE_PEEK = 16; // how much of the neighbouring days shows at the edges

interface DayPageProps {
  dateISO: string;
  lessons: Lesson[];
  onPreviousDay: () => void;
  onNextDay: () => void;
  onMarkPaid: (id: string) => void;
  onCancel: (id: string) => void;
  onCancelSeries: (id: string) => void;
  insets: EdgeInsets;
  index: number;
  scrollX: Animated.SharedValue<number>;
  screenWidth: number;
}

// Only what the page shows decides whether it redraws; the callbacks it is
// given read live data, so they do not need to trigger a redraw.
const samePage = (prev: DayPageProps, next: DayPageProps) =>
  prev.dateISO === next.dateISO &&
  prev.screenWidth === next.screenWidth &&
  prev.lessons.length === next.lessons.length &&
  prev.lessons.every((lesson, i) => {
    const other = next.lessons[i];
    return (
      !!other &&
      lesson.id === other.id &&
      lesson.status === other.status &&
      lesson.isPaid === other.isPaid &&
      lesson.paymentStatus === other.paymentStatus &&
      lesson.paymentReferenceCode === other.paymentReferenceCode &&
      lesson.lastReminderSentAt === other.lastReminderSentAt &&
      lesson.paidConfirmedAt === other.paidConfirmedAt &&
      lesson.studentName === other.studentName &&
      lesson.startTime === other.startTime &&
      lesson.endTime === other.endTime &&
      lesson.price === other.price &&
      lesson.notes === other.notes &&
      lesson.areaId === other.areaId &&
      lesson.facilityId === other.facilityId &&
      lesson.courtId === other.courtId &&
      lesson.groupId === other.groupId &&
      lesson.groupCapacity === other.groupCapacity
    );
  });

// One day of the swipeable pager: header, next-up card, the day's lessons and day-level actions.
export const DayPage = React.memo(function DayPage({
  dateISO,
  lessons,
  onPreviousDay,
  onNextDay,
  onMarkPaid,
  onCancel,
  onCancelSeries,
  insets,
  index,
  scrollX,
  screenWidth,
}: DayPageProps) {
  const [noteLesson, setNoteLesson] = useState<Lesson | null>(null);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const dayItems = useMemo(() => buildDayItems(lessons), [lessons]);

  // Neighbouring days shrink and fade slightly as they slide past.
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth];
    return {
      transform: [
        { translateX: interpolate(scrollX.value, inputRange, [-8, 0, 8], Extrapolate.CLAMP) },
        { scale: interpolate(scrollX.value, inputRange, [0.96, 1, 0.96], Extrapolate.CLAMP) },
      ],
      opacity: interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], Extrapolate.CLAMP),
    };
  });

  return (
    <Animated.View
      style={[{ width: screenWidth - PAGE_PEEK * 2, marginHorizontal: PAGE_PEEK, flex: 1 }, animatedStyle]}
    >
      <DayHeader dateISO={dateISO} topInset={insets.top} onPreviousDay={onPreviousDay} onNextDay={onNextDay} />

      {isToday(dateISO) && lessons.length > 0 && <NextLessonHero lessons={lessons} />}

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {lessons.length === 0 ? (
            <DayEmptyState dateISO={dateISO} />
          ) : (
            <View className="space-y-4">
              {dayItems.map((item, idx) =>
                item.kind === 'group' ? (
                  <GroupLessonCard
                    key={item.group.groupId}
                    group={item.group}
                    onPress={() => setOpenGroupId(item.group.groupId)}
                  />
                ) : (
                  <AnimatedLessonCard
                    key={item.lesson.id}
                    lesson={item.lesson}
                    index={idx}
                    onMarkPaid={() => onMarkPaid(item.lesson.id)}
                    onCancel={() => onCancel(item.lesson.id)}
                    onCancelSeries={() => onCancelSeries(item.lesson.id)}
                    onNotePress={() => setNoteLesson(item.lesson)}
                  />
                )
              )}
            </View>
          )}

          <DayActions dateISO={dateISO} lessons={lessons} />
        </View>
      </ScrollView>

      <GroupLessonSheet groupId={openGroupId} onClose={() => setOpenGroupId(null)} />
      <QuickNoteSheet visible={noteLesson !== null} lesson={noteLesson} onClose={() => setNoteLesson(null)} />
    </Animated.View>
  );
},
samePage);
