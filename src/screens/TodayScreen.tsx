import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  AlertButton,
  FlatList,
  Modal,
  Share,
  Linking,
  Platform,
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
import { DAY_PAGER } from '../config/appSettings';
import { showToast } from '../state/toastStore';
import { buildBookingUrl } from '../utils/publicBooking';
import { futureSeriesLessons, laterSeriesCount } from '../utils/lessonSeries';
import {
  buildCancellationMessage,
  buildCancellationNotices,
  buildContactUrl,
  buildReminderNotices,
  lessonsToCancelForDay,
  type CancellationNotice,
} from '../utils/cancellationMessage';
import { CancellationNoticesSheet } from '../components/CancellationNoticesSheet';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { useNavigation } from '@react-navigation/native';

import { useCoachStore } from '../state/coachStore';
import { Lesson } from '../types/coach';
import { SwipeableCard } from '../components/SwipeableCard';
import { LessonAvatar } from '../components/LessonAvatar';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { QuickNoteSheet } from '../components/QuickNoteSheet';
import { AddLessonSheet } from '../components/AddLessonSheet';
import { GroupLessonCard } from '../components/GroupLessonCard';
import { GroupLessonSheet } from '../components/GroupLessonSheet';
import { buildDayItems } from '../utils/groupLessons';
import { useCurrency } from '../hooks/useCurrency';
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
import { LessonPaymentSheet } from '../components/payments/LessonPaymentSheet';
import { PaymentStatusBadge } from '../components/payments/PaymentStatusBadge';
import { normalizePaymentStatus } from '../modules/payments';
import { formatTime12Hour } from '../utils/timeFormat';

const PAGE_WINDOW_SIZE: number = DAY_PAGER.windowSize;
const CENTER_PAGE_INDEX: number = DAY_PAGER.centerIndex;

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { lessons, students, coach, markLessonPaid, cancelLesson, cancelSeriesFrom } = useCoachStore();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  
  const [currentPageIndex, setCurrentPageIndex] = useState(CENTER_PAGE_INDEX);
  const [cache, setCache] = useState<Record<string, Lesson[]>>({});
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [seriesNotices, setSeriesNotices] = useState<CancellationNotice[] | null>(null);
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
        newCache[dateISO] = computeFor(dateISO);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddLesson(true);
  }, []);

  const pages = useMemo(() => 
    Array.from({ length: PAGE_WINDOW_SIZE }, (_, i) => ({
      key: i.toString(),
      index: i,
      dateISO: getDateForPageIndex(i),
    })),
    [getDateForPageIndex]
  );

  // Cancel, then offer to tell the student in one tap (their messaging app opens prefilled).
  const cancelAndOfferMessage = useCallback(
    async (lessonId: string) => {
      const lesson = lessons.find((l) => l.id === lessonId);
      const student = lesson ? students.find((s) => s.id === lesson.studentId) : undefined;
      await cancelLesson(lessonId);
      if (!lesson || lesson.status === 'cancelled') return;

      const url = buildContactUrl(
        student?.contact,
        buildCancellationMessage({
          studentName: lesson.studentName,
          coachName: coach?.name,
          date: lesson.date,
          startTime: lesson.startTime,
        }),
        { platform: Platform.OS }
      );
      if (!url) return;

      Alert.alert('Lesson cancelled', `Let ${lesson.studentName.split(' ')[0]} know?`, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Message', onPress: () => Linking.openURL(url).catch(() => {}) },
      ]);
    },
    [lessons, students, coach?.name, cancelLesson]
  );

  // "This and all later": cancel the rest of a weekly series, then offer one message per student.
  const cancelSeriesAndOfferMessage = useCallback(
    async (lessonId: string) => {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return;
      const affected = futureSeriesLessons(lessons, lesson);
      await cancelSeriesFrom(lessonId);
      showToast(`Cancelled ${affected.length || 1} ${affected.length === 1 ? 'lesson' : 'lessons'}`, 'success');
      const notices = buildCancellationNotices({
        lessons: affected,
        students,
        coachName: coach?.name,
        platform: Platform.OS,
        weekly: true,
      }).filter((n) => n.url);
      if (notices.length === 1) {
        const only = notices[0];
        Alert.alert('Lessons cancelled', `Let ${only.studentName.split(' ')[0]} know?`, [
          { text: 'Not now', style: 'cancel' },
          { text: 'Message', onPress: () => Linking.openURL(only.url as string).catch(() => {}) },
        ]);
      } else if (notices.length > 1) {
        setSeriesNotices(notices);
      }
    },
    [lessons, students, coach?.name, cancelSeriesFrom]
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
        onCancel={cancelAndOfferMessage}
        onCancelSeries={cancelSeriesAndOfferMessage}
        insets={insets}
        index={index}
        scrollX={scrollX}
        screenWidth={SCREEN_WIDTH}
      />
    );
  }, [cache, handleChevronPress, markLessonPaid, cancelAndOfferMessage, cancelSeriesAndOfferMessage, insets, scrollX, SCREEN_WIDTH]);

  return (
    <View className="flex-1 bg-white">
      <SyncStatusBanner />
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

      <CancellationNoticesSheet notices={seriesNotices} onClose={() => setSeriesNotices(null)} />
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
  onCancelSeries: (id: string) => void;
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
  onCancelSeries,
  insets,
  index,
  scrollX,
  screenWidth,
}: AnimatedDayPageProps) => {
  const PAGE_PEEK = 16; // Show 16px of adjacent pages
  const [noteLesson, setNoteLesson] = useState<Lesson | null>(null);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const dayItems = useMemo(() => buildDayItems(lessons), [lessons]);
  const coach = useCoachStore(s => s.coach);
  const students = useCoachStore(s => s.students);
  const cancelLessonById = useCoachStore(s => s.cancelLesson);
  const [notices, setNotices] = useState<CancellationNotice[] | null>(null);
  const [reminders, setReminders] = useState<CancellationNotice[] | null>(null);
  const formatLocationText = useCoachStore(s => s.formatLocationText);
  const cancellable = useMemo(() => lessonsToCancelForDay(lessons, dateISO), [lessons, dateISO]);

  // Reminder texts for everyone still to come on this day, one tap per student.
  const openReminders = () => {
    setReminders(
      buildReminderNotices({
        lessons: cancellable,
        students,
        coachName: coach?.name,
        platform: Platform.OS,
        locationFor: (l) => formatLocationText(l.areaId, l.facilityId, l.courtId),
      })
    );
  };

  // Rain-out: cancel everything still to come on this day, then offer one-tap messages.
  const confirmCancelDay = () => {
    Alert.alert(
      cancellable.length === 1 ? 'Cancel 1 lesson?' : `Cancel ${cancellable.length} lessons?`,
      isToday(dateISO) ? 'This cancels everything still to come today.' : 'This cancels every lesson on this day.',
      [
        { text: 'Keep lessons', style: 'cancel' },
        {
          text: 'Cancel lessons',
          style: 'destructive',
          onPress: async () => {
            const toCancel = cancellable;
            for (const lesson of toCancel) {
              await cancelLessonById(lesson.id);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setNotices(
              buildCancellationNotices({ lessons: toCancel, students, coachName: coach?.name, platform: Platform.OS })
            );
          },
        },
      ]
    );
  };
  
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
          {isToday(dateISO) && coach?.bookingLink && buildBookingUrl(coach.bookingLink, process.env.EXPO_PUBLIC_BOOKING_BASE_URL) && (
            <Pressable
              onPress={() => {
                const url = buildBookingUrl(coach.bookingLink, process.env.EXPO_PUBLIC_BOOKING_BASE_URL);
                if (url) Share.share({ message: `Book a lesson: ${url}`, url });
              }}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
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

          {cancellable.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Pressable
                onPress={openReminders}
                accessibilityRole="button"
                style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '600', color: DesignTokens.colors.accent }}>
                  Remind students
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmCancelDay}
                accessibilityRole="button"
                style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ ...DesignTokens.typography.subhead, fontWeight: '600', color: DesignTokens.colors.danger }}>
                  {isToday(dateISO) ? 'Cancel the rest of today' : 'Cancel this day'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <CancellationNoticesSheet notices={notices} onClose={() => setNotices(null)} />
      <CancellationNoticesSheet notices={reminders} title="Remind students" onClose={() => setReminders(null)} />

      <GroupLessonSheet groupId={openGroupId} onClose={() => setOpenGroupId(null)} />

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
         prevProps.lessons.every((lesson, i) => {
           const nextLesson = nextProps.lessons[i];
           return nextLesson &&
             lesson.id === nextLesson.id &&
             lesson.status === nextLesson.status &&
             lesson.isPaid === nextLesson.isPaid &&
             lesson.paymentStatus === nextLesson.paymentStatus &&
             lesson.paymentReferenceCode === nextLesson.paymentReferenceCode &&
             lesson.lastReminderSentAt === nextLesson.lastReminderSentAt &&
             lesson.paidConfirmedAt === nextLesson.paidConfirmedAt &&
             lesson.studentName === nextLesson.studentName &&
             lesson.startTime === nextLesson.startTime &&
             lesson.endTime === nextLesson.endTime &&
             lesson.price === nextLesson.price &&
             lesson.notes === nextLesson.notes &&
             lesson.areaId === nextLesson.areaId &&
             lesson.facilityId === nextLesson.facilityId &&
             lesson.courtId === nextLesson.courtId &&
             lesson.groupId === nextLesson.groupId &&
             lesson.groupCapacity === nextLesson.groupCapacity;
         }) &&
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

  // A group is one session: say so once instead of naming whichever player sorts first.
  const groupPlayers = nextLesson.groupId
    ? lessons.filter((l) => l.groupId === nextLesson.groupId && l.status === 'scheduled').length
    : 0;
  const heroTitle = groupPlayers > 0 ? `Group · ${groupPlayers} player${groupPlayers === 1 ? '' : 's'}` : nextLesson.studentName;

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
        <LessonAvatar name={groupPlayers > 0 ? 'Group' : nextLesson.studentName} size={36} />
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
            {heroTitle}
          </Text>
          <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey }}>
            {formatTime12Hour(nextLesson.startTime)} – {formatTime12Hour(nextLesson.endTime)}
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
  onCancelSeries: () => void;
  onNotePress: () => void;
}

function AnimatedLessonCard({ lesson, index, onMarkPaid, onCancel, onCancelSeries, onNotePress }: AnimatedLessonCardProps) {
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

// Lesson Card Component
interface LessonCardProps {
  lesson: Lesson;
  onMarkPaid: () => void;
  onCancel: () => void;
  onCancelSeries: () => void;
  onNotePress: () => void;
}

const LessonCard = React.memo(({ lesson, onMarkPaid, onCancel, onCancelSeries, onNotePress }: LessonCardProps) => {
  const { formatLocationText } = useCoachStore();
  const { formatMoney } = useCurrency();
  const cancelAlertOpenRef = useRef(false);
  const [paymentPanelVisible, setPaymentPanelVisible] = useState(false);

  const handleCancelSwipe = () => {
    if (cancelAlertOpenRef.current) {
      return;
    }

    cancelAlertOpenRef.current = true;

    // Read at tap time so the card does not re-render on every lesson change.
    const later = lesson.seriesId ? laterSeriesCount(useCoachStore.getState().lessons, lesson) : 0;

    Alert.alert(
      'Cancel Lesson',
      `Cancel lesson with ${lesson.studentName}?`,
      [
        {
          text: 'Keep Lesson',
          style: 'cancel',
          onPress: () => {
            cancelAlertOpenRef.current = false;
          },
        },
        ...(later > 0
          ? [
              {
                text: `This and ${later} later`,
                style: 'destructive' as const,
                onPress: () => {
                  cancelAlertOpenRef.current = false;
                  onCancelSeries();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
              },
            ]
          : []),
        {
          text: later > 0 ? 'Just this one' : 'Cancel Lesson',
          style: 'destructive',
          onPress: () => {
            cancelAlertOpenRef.current = false;
            onCancel();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
      {
        onDismiss: () => {
          cancelAlertOpenRef.current = false;
        },
      }
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
      text: 'Payment Request',
      onPress: () => setPaymentPanelVisible(true),
      style: 'default',
    });

    actions.push({
      text: 'Cancel Lesson',
      onPress: () => {
        if (lesson.seriesId) {
          handleCancelSwipe();
          return;
        }
        onCancel();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      style: 'destructive',
    });

    actions.push({
      text: 'Close',
      style: 'cancel',
    });

    Alert.alert(`${lesson.studentName}`, `${lesson.startTime} - ${lesson.endTime}`, actions);
  };

  const locationText = formatLocationText(lesson.areaId, lesson.facilityId, lesson.courtId);
  const timeColor = getTimeOfDayColor(lesson.startTime);
  const paymentStatus = normalizePaymentStatus(lesson.paymentStatus, lesson.isPaid);

  return (
    <>
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
          <LessonAvatar name={lesson.studentName} size={40} />

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
                {formatTime12Hour(lesson.startTime)} • {lesson.studentName}
              </Text>
              <Text
                style={{
                  ...DesignTokens.typography.callout,
                  fontWeight: '600',
                  color: DesignTokens.colors.graphite,
                  marginLeft: DesignTokens.spacing.lg
                }}
              >
                {formatMoney(lesson.price)}
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

            <View style={{ marginTop: DesignTokens.spacing.sm }}>
              <PaymentStatusBadge status={paymentStatus} isPaid={lesson.isPaid} />
            </View>
          </View>

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

      <LessonPaymentSheet
        lessonId={paymentPanelVisible ? lesson.id : null}
        onClose={() => setPaymentPanelVisible(false)}
      />
    </>
  );
});

LessonCard.displayName = 'LessonCard';
