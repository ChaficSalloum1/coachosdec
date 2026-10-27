import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

import { useCoachStore } from '../state/coachStore';
import { UI_TIMING } from '../config/appSettings';
import { showToast } from '../state/toastStore';
import { AvailabilityRange, BlackoutDate } from '../types/coach';
import { RangeEditorModal, BlackoutCalendarModal, PreviewModal } from '../components/AvailabilityModals';
import { formatClockTime } from '../utils/timeFormat';
import { DesignTokens } from '../utils/designTokens';
import { weekdayName } from '../i18n/formatDate';
import { t } from '../i18n';

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]; // Sunday first, as stored on availability ranges

export function AvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    coach,
    availabilityRanges,
    blackoutDates,
    addAvailabilityRange,
    updateAvailabilityRange,
    deleteAvailabilityRange,
    addBlackoutDate,
    removeBlackoutDate,
    getAvailabilityRangesForDay,
    getOpenSlots,
    validateRangeOverlap,
    areas,
    facilities,
    courts,
    formatLocationText,
  } = useCoachStore();

  const [selectedDay, setSelectedDay] = useState(1); // Monday
  const [showRangeEditor, setShowRangeEditor] = useState(false);
  const [editingRange, setEditingRange] = useState<AvailabilityRange | null>(null);
  const [showBlackoutCalendar, setShowBlackoutCalendar] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [undoAction, setUndoAction] = useState<{ action: () => void; timeout: NodeJS.Timeout } | null>(null);

  // Ref to track preview timeout for cleanup
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dayRanges = getAvailabilityRangesForDay(selectedDay);

  // Cleanup preview timeout on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddRange = () => {
    if (areas.length === 0) {
      showToast(t('availability.createAreaFirst'), 'error');
      return;
    }
    setEditingRange(null);
    setShowRangeEditor(true);
  };

  const handleEditRange = (range: AvailabilityRange) => {
    setEditingRange(range);
    setShowRangeEditor(true);
  };

  const handleDeleteRange = (rangeId: string) => {
    const deletedRange = availabilityRanges.find(r => r.id === rangeId);
    if (!deletedRange) return;

    deleteAvailabilityRange(rangeId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Show undo option - clear existing timeout first
    if (undoAction) {
      clearTimeout(undoAction.timeout);
    }

    const timeout = setTimeout(() => {
      setUndoAction(null);
    }, UI_TIMING.undoWindowMs);

    setUndoAction({
      action: () => {
        addAvailabilityRange(deletedRange);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setUndoAction(null);
      },
      timeout,
    });
  };

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (undoAction) {
        clearTimeout(undoAction.timeout);
      }
    };
  }, [undoAction]);

  const handleClearDay = () => {
    const rangesToDelete = dayRanges;
    if (rangesToDelete.length === 0) return;

    Alert.alert(
      t('availability.clearDayTitle'),
      t('availability.clearDayBody', { count: rangesToDelete.length, day: weekdayName(selectedDay) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('availability.clear'),
          style: 'destructive',
          onPress: () => {
            rangesToDelete.forEach(range => deleteAvailabilityRange(range.id));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        {/* Left: Close Button */}
        <Pressable 
          onPress={() => navigation.goBack()}
          className="w-11 h-11 rounded-lg items-center justify-center active:bg-gray-100 mr-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={26} color={DesignTokens.colors.text.strong} />
        </Pressable>
        
        {/* Center: Title */}
        <View className="flex-1 items-center">
          <Text className="text-xl font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
            {t('settings.availability')}
          </Text>
        </View>
        
        {/* Right: Preview Button */}
        <Pressable
          onPress={() => {
            setIsPreviewLoading(true);
            const previewTimeout = setTimeout(() => {
              setShowPreview(true);
              setIsPreviewLoading(false);
            }, 500);

            // Store timeout ref for cleanup
            previewTimeoutRef.current = previewTimeout;
          }}
          className="px-3 py-2 rounded-lg active:bg-gray-100"
        >
          <Text className="text-base font-medium" style={{ color: DesignTokens.colors.brand.default }}>
            {t('availability.preview')}
          </Text>
        </Pressable>
      </View>

       {isPreviewLoading && (
         <View className="px-4 py-3">
           <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
             <Text className="text-base mb-2" style={{ color: DesignTokens.colors.text.muted }}>{t('availability.loadingPreview')}</Text>
             <View className="flex-row flex-wrap gap-2">
               <View className="w-20 h-8 bg-gray-200 rounded-md" />
               <View className="w-24 h-8 bg-gray-200 rounded-md" />
               <View className="w-16 h-8 bg-gray-200 rounded-md" />
             </View>
           </View>
         </View>
       )}
       <ScrollView className="flex-1">
         {/* Day Chips */}
         <View className="px-4 py-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: DesignTokens.colors.text.strong }}>
            {t('availability.selectDay')}
          </Text>
          <View className="flex-row justify-between">
            {WEEKDAYS.map((day) => (
              <DayChip
                key={day}
                day={day}
                isSelected={selectedDay === day}
                onPress={() => handleDaySelect(day)}
              />
            ))}
          </View>
        </View>

        {/* Time Ranges */}
        <View className="px-4 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
              {t('availability.dayTimes', { day: weekdayName(selectedDay) })}
            </Text>
            {dayRanges.length > 0 && (
              <Pressable onPress={handleClearDay} className="px-3 py-1 rounded-lg active:bg-gray-100">
                <Text className="text-sm font-medium" style={{ color: DesignTokens.colors.red['800'] }}>
                  {t('availability.clearDay')}
                </Text>
              </Pressable>
            )}
          </View>

          {dayRanges.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="time-outline" size={48} color={DesignTokens.colors.text.muted} />
              <Text className="text-base mt-2 mb-1" style={{ color: DesignTokens.colors.text.strong }}>
                {t('availability.noTimesSet')}
              </Text>
              <Text className="text-sm text-center" style={{ color: DesignTokens.colors.text.muted }}>
                {t('availability.addHoursForDay')}
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {dayRanges.map((range) => (
                <RangeCard
                  key={range.id}
                  range={range}
                  onEdit={() => handleEditRange(range)}
                  onDelete={() => handleDeleteRange(range.id)}
                  formatLocationText={formatLocationText}
                />
              ))}
            </View>
          )}
        </View>

        {/* Blackout Dates */}
        <View className="px-4 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
              {t('availability.blackoutDates')}
            </Text>
            <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
              {t('availability.datesCount', { count: blackoutDates.length })}
            </Text>
          </View>
          
          <Pressable
            onPress={() => setShowBlackoutCalendar(true)}
            className="bg-gray-50 rounded-xl p-4 active:bg-gray-100"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-medium mb-1" style={{ color: DesignTokens.colors.text.strong }}>
                  {t('availability.manageBlackout')}
                </Text>
                <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                  {blackoutDates.length === 0
                    ? t('availability.noBlackoutSet')
                    : t('availability.datesUnavailable', { count: blackoutDates.length })
                  }
                </Text>
              </View>
              <Ionicons name="calendar-outline" size={24} color={DesignTokens.colors.text.muted} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="px-4 pb-6 border-t border-gray-200 bg-white">
        <Pressable
          onPress={handleAddRange}
          className="rounded-lg py-4 px-4 active:opacity-80 mt-4"
          style={{ backgroundColor: DesignTokens.colors.brand.default, minHeight: 44 }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-base font-medium text-white ml-2">
              {t('availability.addTimeRange')}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Undo Toast */}
      {undoAction && (
        <View className="absolute bottom-20 left-4 right-4">
          <View className="bg-gray-800 rounded-lg p-4 flex-row items-center justify-between">
            <Text className="text-white font-medium">{t('availability.rangeDeleted')}</Text>
            <Pressable
              onPress={undoAction.action}
              className="px-3 py-1 rounded bg-white/20 active:bg-white/30"
            >
              <Text className="text-white font-medium">{t('common.undo')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Modals */}
      <RangeEditorModal
        visible={showRangeEditor}
        onClose={() => setShowRangeEditor(false)}
        range={editingRange}
        dayOfWeek={selectedDay}
        areas={areas}
        facilities={facilities}
        courts={courts}
        formatLocationText={formatLocationText}
        validateRangeOverlap={validateRangeOverlap}
        onSave={(range) => {
          if (editingRange) {
            updateAvailabilityRange(editingRange.id, range);
          } else if (coach) {
            const newRange: AvailabilityRange = {
              id: uuidv4(),
              coachId: coach.id,
              ...range,
              dayOfWeek: selectedDay,
            };
            addAvailabilityRange(newRange);
          }
          setShowRangeEditor(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      />

      <BlackoutCalendarModal
        visible={showBlackoutCalendar}
        onClose={() => setShowBlackoutCalendar(false)}
        blackoutDates={blackoutDates}
        onAddDate={(date) => {
          if (coach) {
            const blackout: BlackoutDate = {
              id: uuidv4(),
              coachId: coach.id,
              date,
            };
            addBlackoutDate(blackout);
          }
        }}
        onRemoveDate={(date) => {
          const blackout = blackoutDates.find(b => b.date === date);
          if (blackout) {
            removeBlackoutDate(blackout.id);
          }
        }}
      />

      <PreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        slots={getOpenSlots()}
        formatLocationText={formatLocationText}
      />
    </View>
  );
}

interface DayChipProps {
  day: number;
  isSelected: boolean;
  onPress: () => void;
}

function DayChip({ day, isSelected, onPress }: DayChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const gesture = Gesture.Tap()
    .onTouchesDown(() => {
      scale.value = withSpring(0.95);
    })
    .onTouchesUp(() => {
      scale.value = withSpring(1);
    })
    .onEnd(() => {
      runOnJS(onPress)();
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{
            backgroundColor: isSelected ? DesignTokens.colors.brand.default : DesignTokens.colors.surface.subtle,
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Text
            className="text-sm font-medium"
            style={{
              color: isSelected ? 'white' : DesignTokens.colors.text.muted,
            }}
          >
            {weekdayName(day)}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

interface RangeCardProps {
  range: AvailabilityRange;
  onEdit: () => void;
  onDelete: () => void;
  formatLocationText: (areaId?: string, facilityId?: string, courtId?: string) => string;
}

function RangeCard({ range, onEdit, onDelete, formatLocationText }: RangeCardProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldDelete = event.translationX < -128;
      
      if (shouldDelete) {
        runOnJS(onDelete)();
      }
      
      translateX.value = withSpring(0);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onEdit)();
  });

  const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={animatedStyle}>
        <View className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-lg font-semibold mb-1" style={{ color: DesignTokens.colors.text.strong }}>
                {formatClockTime(range.startTime)} - {formatClockTime(range.endTime)}
              </Text>
              <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                {formatLocationText(range.areaId, range.facilityId, range.courtId)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DesignTokens.colors.text.muted} />
          </View>
          
          {/* Swipe hint */}
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xs font-medium text-center" style={{ color: DesignTokens.colors.red['800'] }}>
              {t('availability.swipeToDelete')}
            </Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// Modal components are imported from AvailabilityModals.tsx
