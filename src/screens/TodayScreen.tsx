import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { AddLessonSheet } from '../components/AddLessonSheet';
import { CancellationNoticesSheet } from '../components/CancellationNoticesSheet';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { useCoachStore } from '../state/coachStore';
import { isToday } from '../utils/dayNav';
import { DayPage } from './today/DayPage';
import { JumpToTodayButton } from './today/JumpToTodayButton';
import { useCancelFlows } from './today/useCancelFlows';
import { useDayPager } from './today/useDayPager';

// The coach's day: swipe between days, add a lesson, act on today's lessons.
export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const markLessonPaid = useCoachStore((s) => s.markLessonPaid);
  const [showAddLesson, setShowAddLesson] = useState(false);

  const pager = useDayPager();
  const { cache, handleChevronPress, scrollX, screenWidth } = pager;
  const { cancelAndOfferMessage, cancelSeriesAndOfferMessage, seriesNotices, closeSeriesNotices } = useCancelFlows();

  const openAddLesson = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddLesson(true);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: { dateISO: string }; index: number }) => (
      <DayPage
        dateISO={item.dateISO}
        lessons={cache[item.dateISO] ?? []}
        onPreviousDay={() => handleChevronPress('prev')}
        onNextDay={() => handleChevronPress('next')}
        onMarkPaid={markLessonPaid}
        onCancel={cancelAndOfferMessage}
        onCancelSeries={cancelSeriesAndOfferMessage}
        insets={insets}
        index={index}
        scrollX={scrollX}
        screenWidth={screenWidth}
      />
    ),
    [cache, handleChevronPress, scrollX, screenWidth, markLessonPaid, cancelAndOfferMessage, cancelSeriesAndOfferMessage, insets]
  );

  return (
    <View className="flex-1 bg-white">
      <SyncStatusBanner />
      <Animated.FlatList
        ref={pager.flatListRef}
        data={pager.pages}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={pager.scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={pager.onViewableItemsChanged}
        viewabilityConfig={pager.viewabilityConfig}
        getItemLayout={(_data, index) => ({ length: pager.screenWidth, offset: pager.screenWidth * index, index })}
        initialScrollIndex={pager.initialIndex}
        windowSize={5}
        maxToRenderPerBatch={3}
        removeClippedSubviews
        bounces
      />

      {!isToday(pager.currentDayISO) && <JumpToTodayButton onPress={pager.jumpToToday} bottom={insets.bottom + 24} />}

      <FloatingActionButton onPress={openAddLesson} bottom={insets.bottom + 76} />

      <AddLessonSheet visible={showAddLesson} defaultDate={pager.currentDayISO} onClose={() => setShowAddLesson(false)} />

      <CancellationNoticesSheet notices={seriesNotices} onClose={closeSeriesNotices} />
    </View>
  );
}
