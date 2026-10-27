/*
The swipeable day-by-day pager: which day is showing, the lessons of the days
around it, and moving between days (a double tap on an arrow jumps to the next
day that has lessons).
*/
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ViewToken, useWindowDimensions } from 'react-native';
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DAY_PAGER } from '../../config/appSettings';
import { useCoachStore } from '../../state/coachStore';
import type { Lesson } from '../../types/coach';
import { addDaysISO, getNextLessonDay, getPreviousLessonDay, todayISO } from '../../utils/dayNav';

const PAGE_WINDOW_SIZE: number = DAY_PAGER.windowSize;
const CENTER_PAGE_INDEX: number = DAY_PAGER.centerIndex;
const DOUBLE_TAP_MS = 300;

const dateForPage = (index: number): string => addDaysISO(todayISO(), index - CENTER_PAGE_INDEX);

const pageForDate = (dateISO: string): number => {
  const days = Math.floor((new Date(dateISO).getTime() - new Date(todayISO()).getTime()) / (1000 * 60 * 60 * 24));
  return CENTER_PAGE_INDEX + days;
};

export function useDayPager() {
  const lessons = useCoachStore((s) => s.lessons);
  const { width: screenWidth } = useWindowDimensions();

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(CENTER_PAGE_INDEX);
  const [cache, setCache] = useState<Record<string, Lesson[]>>({});
  const flatListRef = useRef<FlatList>(null);
  const lastTapRef = useRef<Record<string, number>>({});
  const scrollX = useSharedValue(CENTER_PAGE_INDEX * screenWidth);

  const currentDayISO = useMemo(() => dateForPage(currentPageIndex), [currentPageIndex]);

  const pages = useMemo(
    () => Array.from({ length: PAGE_WINDOW_SIZE }, (_, i) => ({ key: i.toString(), index: i, dateISO: dateForPage(i) })),
    []
  );

  // Keep the lessons of the day showing and its neighbours ready.
  useEffect(() => {
    const dates = [currentPageIndex - 1, currentPageIndex, currentPageIndex + 1].map(dateForPage);
    setCache((prev) => {
      const next = { ...prev };
      for (const dateISO of dates) {
        next[dateISO] = lessons
          .filter((l) => l.date === dateISO && l.status !== 'cancelled')
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
      }
      return next;
    });
  }, [currentPageIndex, lessons]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentPageIndex(viewableItems[0].index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const goToPage = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const handleChevronPress = useCallback(
    (direction: 'prev' | 'next') => {
      const now = Date.now();
      if (now - (lastTapRef.current[direction] || 0) < DOUBLE_TAP_MS) {
        const target =
          direction === 'prev' ? getPreviousLessonDay(currentDayISO, lessons) : getNextLessonDay(currentDayISO, lessons);
        goToPage(pageForDate(target));
      } else {
        goToPage(currentPageIndex + (direction === 'prev' ? -1 : 1));
      }
      lastTapRef.current[direction] = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [currentDayISO, currentPageIndex, lessons, goToPage]
  );

  const jumpToToday = useCallback(() => {
    goToPage(CENTER_PAGE_INDEX);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [goToPage]);

  return {
    flatListRef,
    pages,
    cache,
    screenWidth,
    scrollX,
    scrollHandler,
    onViewableItemsChanged,
    viewabilityConfig,
    currentDayISO,
    handleChevronPress,
    jumpToToday,
    initialIndex: Math.min(CENTER_PAGE_INDEX, Math.max(0, PAGE_WINDOW_SIZE - 1)),
  };
}
