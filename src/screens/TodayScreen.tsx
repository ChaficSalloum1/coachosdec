import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  AlertButton,
  FlatList,
  Share,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '@react-navigation/native';

import { useCoachStore } from '../state/coachStore';
import { Lesson } from '../types/coach';
import { SwipeableCard } from '../components/SwipeableCard';
import { LessonAvatar } from '../components/LessonAvatar';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { QuickNoteSheet } from '../components/QuickNoteSheet';
import { AddLessonSheet } from '../components/AddLessonSheet';
import { 
  todayISO, 
  addDaysISO, 
  isToday, 
  formatHeaderDate,
  getNextLessonDay,
  getPreviousLessonDay,
  getDayOfWeek,
  getTimeOfDayColor,
} from '../utils/dayNav';
import { DesignTokens } from '../utils/designTokens';

const PAGE_WINDOW_SIZE = 61; // ±30 days from today
const CENTER_PAGE_INDEX = 30; // Today's index

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { lessons, markLessonPaid, cancelLesson } = useCoachStore();
  const navigation = useNavigation<any>();
  const { showActionSheetWithOptions } = useActionSheet();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  
  const [currentPageIndex, setCurrentPageIndex] = useState(CENTER_PAGE_INDEX);
  const [cache, setCache] = useState<Record<string, Lesson[]>>({});
  const [showAddLesson, setShowAddLesson] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const lastTapRef = useRef<Record<string, number>>({});
  const scrollX = useSharedValue(CENTER_PAGE_INDEX * SCREEN_WIDTH);

  // Memoized computation for lessons
  const computeFor = useCallback((dateISO: string) => {
    return lessons
      .filter(l => l.date === dateISO && l.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [lessons]);

  // Get date for page index
  const getDateForPageIndex = useCallback((index: number): string => {
    const offsetDays = index - CENTER_PAGE_INDEX;
    return addDaysISO(todayISO(), offsetDays);
  }, []);

  // Get page index for date
  const getPageIndexForDate = useCallback((dateISO: string): number => {
    const today = todayISO();
    const targetDate = new Date(dateISO);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    return CENTER_PAGE_INDEX + daysDiff;
  }, []);

  const currentDayISO = useMemo(() => getDateForPageIndex(currentPageIndex), [currentPageIndex, getDateForPageIndex]);

  // Prefetch adjacent pages
  useEffect(() => {
    const datesToCache = [
      getDateForPageIndex(currentPageIndex - 1),
      getDateForPageIndex(currentPageIndex),
      getDateForPageIndex(currentPageIndex + 1),
    ];

    setCache(prev => {
      const newCache = { ...prev };
      datesToCache.forEach(dateISO => {
        if (!newCache[dateISO]) {
          newCache[dateISO] = computeFor(dateISO);
        }
      });
      return newCache;
    });
  }, [currentPageIndex, lessons, computeFor, getDateForPageIndex]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const newIndex = viewableItems[0].index;
      setCurrentPageIndex(newIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const navigateToPage = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const navigateToPreviousDay = useCallback(() => {
    navigateToPage(currentPageIndex - 1);
  }, [currentPageIndex, navigateToPage]);

  const navigateToNextDay = useCallback(() => {
    navigateToPage(currentPageIndex + 1);
  }, [currentPageIndex, navigateToPage]);

  // Double-tap detection
  const handleChevronPress = useCallback((direction: 'prev' | 'next') => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const key = direction;
    
    if (now - (lastTapRef.current[key] || 0) < DOUBLE_TAP_DELAY) {
      // Double tap detected - jump to next/previous lesson day
      const targetDate = direction === 'prev' 
        ? getPreviousLessonDay(currentDayISO, lessons)
        : getNextLessonDay(currentDayISO, lessons);
      const targetIndex = getPageIndexForDate(targetDate);
      navigateToPage(targetIndex);
    } else {
      // Single tap - navigate one day
      direction === 'prev' ? navigateToPreviousDay() : navigateToNextDay();
    }
    
    lastTapRef.current[key] = now;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentDayISO, lessons, navigateToPreviousDay, navigateToNextDay, navigateToPage, getPageIndexForDate]);

  const jumpToToday = useCallback(() => {
    navigateToPage(CENTER_PAGE_INDEX);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [navigateToPage]);

  const handleFABPress = useCallback(() => {
    const options = [
      'Add Lesson',
      'Jump to Today',
      'Add Availability',
      'Cancel',
    ];
    const cancelButtonIndex = 3;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: 'Quick Actions',
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          setShowAddLesson(true);
        } else if (buttonIndex === 1) {
          jumpToToday();
        } else if (buttonIndex === 2) {
          navigation.navigate('Settings', { screen: 'Availability' });
        }
      }
    );
  }, [showActionSheetWithOptions, jumpToToday, navigation]);

  const pages = useMemo(() => 
    Array.from({ length: PAGE_WINDOW_SIZE }, (_, i) => ({
      key: i.toString(),
      index: i,
      dateISO: getDateForPageIndex(i),
    })),
    [getDateForPageIndex]
  );

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const pageLessons = cache[item.dateISO] ?? [];
    
    return (
      <AnimatedDayPage
        dateISO={item.dateISO}
        lessons={pageLessons}
        onPreviousDay={() => handleChevronPress('prev')}
        onNextDay={() => handleChevronPress('next')}
        onMarkPaid={markLessonPaid}
        onCancel={cancelLesson}
        insets={insets}
        index={index}
        scrollX={scrollX}
        screenWidth={SCREEN_WIDTH}
      />
    );
  }, [cache, handleChevronPress, markLessonPaid, cancelLesson, insets, scrollX, SCREEN_WIDTH]);

  return (
    <View className="flex-1 bg-white">
      <Animated.FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialScrollIndex={Math.min(CENTER_PAGE_INDEX, Math.max(0, pages.length - 1))}
        windowSize={5}
        maxToRenderPerBatch={3}
        removeClippedSubviews={true}
        bounces={true}
      />

      {/* Jump to Today Button - Appears when not on today */}
      {!isToday(currentDayISO) && (
        <JumpToTodayButton onPress={jumpToToday} bottom={insets.bottom + 24} />
      )}

      {/* FAB — quick actions */}
      <FloatingActionButton onPress={handleFABPress} bottom={insets.bottom + 76} />

      {/* Add Lesson Sheet */}
      <AddLessonSheet
        visible={showAddLesson}
        defaultDate={currentDayISO}
        onClose={() => setShowAddLesson(false)}
      />
    </View>
  );
}

// Jump to Today Button Component
interface JumpToTodayButtonProps {
  onPress: () => void;
  bottom: number;
}

function JumpToTodayButton({ onPress, bottom }: JumpToTodayButtonProps) {
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

// Animated Day Page with 3D Transform
interface AnimatedDayPageProps {
  dateISO: string;
  lessons: Lesson[];
  onPreviousDay: () => void;
  onNextDay: () => void;
  onMarkPaid: (id: string) => void;
  onCancel: (id: string) => void;
  insets: any;
  index: number;
  scrollX: Animated.SharedValue<number>;
  screenWidth: number;
}

const AnimatedDayPage = React.memo(({
  dateISO,
  lessons,
  onPreviousDay,
  onNextDay,
  onMarkPaid,
  onCancel,
  insets,
  index,
  scrollX,
  screenWidth,
}: AnimatedDayPageProps) => {
  const PAGE_PEEK = 16; // Show 16px of adjacent pages
  const [noteLesson, setNoteLesson] = useState<Lesson | null>(null);
  const coach = useCoachStore(s => s.coach);
  
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const translateX = interpolate(scrollX.value, inputRange, [-8, 0, 8], Extrapolate.CLAMP);
    const scale = interpolate(scrollX.value, inputRange, [0.96, 1, 0.96], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], Extrapolate.CLAMP);

    return { transform: [{ translateX }, { scale }], opacity };
  });

  return (
    <Animated.View 
      style={[
        { 
          width: screenWidth - (PAGE_PEEK * 2),
          marginHorizontal: PAGE_PEEK,
          flex: 1,
        }, 
        animatedStyle
      ]}
    >
      {/* Date Header - Fixed at top */}
      <View
        className="flex-row items-center justify-between bg-white border-b"
        style={{
          paddingTop: insets.top + DesignTokens.spacing.md,
          paddingBottom: DesignTokens.spacing.md,
          paddingHorizontal: DesignTokens.spacing['2xl'],
          borderBottomColor: DesignTokens.colors.superLightGrey
        }}
      >
        <Pressable
          onPress={onPreviousDay}
          className="w-11 h-11 rounded-lg items-center justify-center active:opacity-60"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Previous day"
          accessibilityHint="Double tap to jump to previous lesson day"
        >
          <Ionicons name="chevron-back" size={24} color={DesignTokens.colors.graphite} />
        </Pressable>

        <View className="items-center">
          <Text
            style={{
              ...DesignTokens.typography.title2,
              color: DesignTokens.colors.graphite
            }}
          >
            {formatHeaderDate(dateISO)}
          </Text>
          {isToday(dateISO) && (
            <Text
              style={{
                ...DesignTokens.typography.subhead,
                fontWeight: '600',
                color: DesignTokens.colors.accent,
                marginTop: 2
              }}
            >
              Today
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {isToday(dateISO) && coach?.bookingLink && (
            <Pressable
              onPress={() => Share.share({
                message: `Book a lesson: https://coachos.app/book/${coach.bookingLink}`,
                url: `https://coachos.app/book/${coach.bookingLink}`,
              })}
              style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              accessibilityLabel="Share booking link"
            >
              <Ionicons name="share-outline" size={22} color={DesignTokens.colors.accent} />
            </Pressable>
          )}
          <Pressable
            onPress={onNextDay}
            className="w-11 h-11 rounded-lg items-center justify-center active:opacity-60"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Next day"
            accessibilityHint="Double tap to jump to next lesson day"
          >
            <Ionicons name="chevron-forward" size={24} color={DesignTokens.colors.graphite} />
          </Pressable>
        </View>
      </View>

      {/* Next Lesson Hero — today only */}
      {isToday(dateISO) && lessons.length > 0 && (
        <NextLessonHero lessons={lessons} />
      )}

      {/* Scrollable Lesson Content */}
      <ScrollView
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {lessons.length === 0 ? (
            <EmptyState dateISO={dateISO} />
          ) : (
            <View className="space-y-4">
              {lessons.map((lesson, idx) => (
                <AnimatedLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={idx}
                  onMarkPaid={() => onMarkPaid(lesson.id)}
                  onCancel={() => onCancel(lesson.id)}
                  onNotePress={() => setNoteLesson(lesson)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <QuickNoteSheet
        visible={noteLesson !== null}
        lesson={noteLesson}
        onClose={() => setNoteLesson(null)}
      />

    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return prevProps.dateISO === nextProps.dateISO && 
         prevProps.lessons.length === nextProps.lessons.length &&
         prevProps.lessons.every((l, i) => l.id === nextProps.lessons[i]?.id) &&
         prevProps.screenWidth === nextProps.screenWidth;
});

AnimatedDayPage.displayName = 'AnimatedDayPage';

// Next Lesson Hero — shows the upcoming lesson for today
function NextLessonHero({ lessons }: { lessons: Lesson[] }) {
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${minutes} ${ampm}`;
  };

  const minutesUntil = () => {
    const [nh, nm] = nowTime.split(':').map(Number);
    const [lh, lm] = nextLesson.startTime.split(':').map(Number);
    return (lh * 60 + lm) - (nh * 60 + nm);
  };

  const mins = minutesUntil();
  const isImminent = mins <= 5;
  const timeLabel = mins <= 0 ? 'Now' : mins === 1 ? 'in 1 min' : `in ${mins} min`;
  const timeLabelColor = isImminent ? DesignTokens.colors.warning : DesignTokens.colors.success;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: '#EBF5FF',
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
        <LessonAvatar name={nextLesson.studentName} size={36} />
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
            NEXT UP
          </Text>
          <Text
            style={{
              ...DesignTokens.typography.title3 ?? DesignTokens.typography.headline,
              fontWeight: '700',
              color: DesignTokens.colors.graphite,
            }}
            numberOfLines={1}
          >
            {nextLesson.studentName}
          </Text>
          <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey }}>
            {formatTime(nextLesson.startTime)} – {formatTime(nextLesson.endTime)}
          </Text>
        </View>
      </View>
      <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '600', color: timeLabelColor }}>
        {timeLabel}
      </Text>
    </Animated.View>
  );
}

// Empty State with Animation
function EmptyState({ dateISO }: { dateISO: string }) {
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
        No lessons today
      </Text>
      <Text
        style={{
          ...DesignTokens.typography.body,
          color: DesignTokens.colors.grey,
          textAlign: 'center',
          marginBottom: DesignTokens.spacing['2xl']
        }}
      >
        You have a free day! Check your requests or{"\n"}update your availability.
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
          Add Availability
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Animated Lesson Card with Entrance
interface AnimatedLessonCardProps {
  lesson: Lesson;
  index: number;
  onMarkPaid: () => void;
  onCancel: () => void;
  onNotePress: () => void;
}

function AnimatedLessonCard({ lesson, index, onMarkPaid, onCancel, onNotePress }: AnimatedLessonCardProps) {
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
        onNotePress={onNotePress}
      />
    </Animated.View>
  );
}

// Lesson Card Component
interface LessonCardProps {
  lesson: Lesson;
  onMarkPaid: () => void;
  onCancel: () => void;
  onNotePress: () => void;
}

const LessonCard = React.memo(({ lesson, onMarkPaid, onCancel, onNotePress }: LessonCardProps) => {
  const { formatLocationText } = useCoachStore();

  const handleCancelSwipe = () => {
    Alert.alert(
      'Cancel Lesson',
      `Cancel lesson with ${lesson.studentName}?`,
      [
        {
          text: 'Keep Lesson',
          style: 'cancel',
        },
        {
          text: 'Cancel Lesson',
          style: 'destructive',
          onPress: () => {
            onCancel();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleMarkPaidSwipe = () => {
    onMarkPaid();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const showQuickActions = () => {
    const actions: AlertButton[] = [];

    if (!lesson.isPaid) {
      actions.push({
        text: 'Mark as Paid',
        onPress: handleMarkPaidSwipe,
        style: 'default',
      });
    }

    actions.push({
      text: 'Cancel Lesson',
      onPress: handleCancelSwipe,
      style: 'destructive',
    });

    actions.push({
      text: 'Close',
      style: 'cancel',
    });

    Alert.alert(`${lesson.studentName}`, `${lesson.startTime} - ${lesson.endTime}`, actions);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const locationText = formatLocationText(lesson.areaId, lesson.facilityId, lesson.courtId);
  const timeColor = getTimeOfDayColor(lesson.startTime);

  return (
    <SwipeableCard
      onSwipeRight={!lesson.isPaid ? handleMarkPaidSwipe : undefined}
      onSwipeLeft={handleCancelSwipe}
      onPress={showQuickActions}
      rightSwipeEnabled={!lesson.isPaid}
      rightSwipeText="Swipe right to mark paid →"
      leftSwipeText="← Swipe left to cancel"
      hideSwipeHints={false}
    >
      <View className="flex-row items-center">
        {/* Student Avatar */}
        <LessonAvatar name={lesson.studentName} size={40} />

        {/* Time-of-day colored edge */}
        <View
          style={{
            width: 4,
            height: 40,
            backgroundColor: timeColor,
            borderRadius: 2,
            marginLeft: DesignTokens.spacing.md,
            marginRight: DesignTokens.spacing.md
          }}
        />

        {/* Card content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              style={{
                ...DesignTokens.typography.callout,
                fontWeight: '600',
                color: DesignTokens.colors.graphite,
                flex: 1
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatTime(lesson.startTime)} • {lesson.studentName}
            </Text>
            <Text
              style={{
                ...DesignTokens.typography.callout,
                fontWeight: '600',
                color: DesignTokens.colors.graphite,
                marginLeft: DesignTokens.spacing.lg
              }}
            >
              ${lesson.price}
            </Text>
          </View>

          {locationText && (
            <Text
              style={{
                ...DesignTokens.typography.footnote,
                color: DesignTokens.colors.grey,
                marginTop: 2
              }}
            >
              {locationText}
            </Text>
          )}

          {lesson.notes && (
            <Text
              style={{
                ...DesignTokens.typography.footnote,
                fontStyle: 'italic',
                color: DesignTokens.colors.grey,
                marginTop: 2
              }}
            >
              {lesson.notes}
            </Text>
          )}

          {!lesson.isPaid && (
            <Text
              style={{
                ...DesignTokens.typography.caption1,
                fontWeight: '600',
                color: DesignTokens.colors.warning,
                marginTop: DesignTokens.spacing.sm
              }}
            >
              Payment Pending
            </Text>
          )}
        </View>

        {/* Quick note button */}
        <Pressable
          onPress={(e) => { e.stopPropagation(); onNotePress(); }}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: DesignTokens.spacing.sm,
          }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Ionicons name="document-text-outline" size={20} color={DesignTokens.colors.grey} />
        </Pressable>
      </View>
    </SwipeableCard>
  );
});

LessonCard.displayName = 'LessonCard';
