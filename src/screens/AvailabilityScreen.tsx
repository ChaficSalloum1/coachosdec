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

import { useCoachStore } from '../state/coachStore';
import { AvailabilityRange, BlackoutDate } from '../types/coach';
import { RangeEditorModal, BlackoutCalendarModal, PreviewModal } from '../components/AvailabilityModals';

const DAYS = [
  { name: 'Sun', value: 0 },
  { name: 'Mon', value: 1 },
  { name: 'Tue', value: 2 },
  { name: 'Wed', value: 3 },
  { name: 'Thu', value: 4 },
  { name: 'Fri', value: 5 },
  { name: 'Sat', value: 6 },
];

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
    generateSlotsForNext14Days,
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
      Alert.alert('No Areas', 'Please create an area first in Settings → Locations.');
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
    }, 3000);

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
      'Clear Day',
      `Remove all ${rangesToDelete.length} time ranges for ${DAYS.find(d => d.value === selectedDay)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
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
          className="w-10 h-10 rounded-lg items-center justify-center active:bg-gray-100 mr-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={26} color="#0B1220" />
        </Pressable>
        
        {/* Center: Title */}
        <View className="flex-1 items-center">
          <Text className="text-xl font-semibold" style={{ color: '#0B1220' }}>
            Availability
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
          <Text className="text-base font-medium" style={{ color: '#1E88E5' }}>
            Preview
          </Text>
        </Pressable>
      </View>

       {isPreviewLoading && (
         <View className="px-4 py-3">
           <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
             <Text className="text-base mb-2" style={{ color: '#42526E' }}>Loading preview…</Text>
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
          <Text className="text-lg font-semibold mb-4" style={{ color: '#0B1220' }}>
            Select Day
          </Text>
          <View className="flex-row justify-between">
            {DAYS.map((day) => (
              <DayChip
                key={day.value}
                day={day}
                isSelected={selectedDay === day.value}
                onPress={() => handleDaySelect(day.value)}
              />
            ))}
          </View>
        </View>

        {/* Time Ranges */}
        <View className="px-4 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
              {DAYS.find(d => d.value === selectedDay)?.name} Times
            </Text>
            {dayRanges.length > 0 && (
              <Pressable onPress={handleClearDay} className="px-3 py-1 rounded-lg active:bg-gray-100">
                <Text className="text-sm font-medium" style={{ color: '#C62828' }}>
                  Clear day
                </Text>
              </Pressable>
            )}
          </View>

          {dayRanges.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="time-outline" size={48} color="#42526E" />
              <Text className="text-base mt-2 mb-1" style={{ color: '#0B1220' }}>
                No times set
              </Text>
              <Text className="text-sm text-center" style={{ color: '#42526E' }}>
                Add your available hours{'\n'}for this day
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
            <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
              Blackout Dates
            </Text>
            <Text className="text-sm" style={{ color: '#42526E' }}>
              {blackoutDates.length} dates
            </Text>
          </View>
          
          <Pressable
            onPress={() => setShowBlackoutCalendar(true)}
            className="bg-gray-50 rounded-xl p-4 active:bg-gray-100"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-medium mb-1" style={{ color: '#0B1220' }}>
                  Manage Blackout Dates
                </Text>
                <Text className="text-sm" style={{ color: '#42526E' }}>
                  {blackoutDates.length === 0 
                    ? 'No blackout dates set' 
                    : `${blackoutDates.length} dates unavailable`
                  }
                </Text>
              </View>
              <Ionicons name="calendar-outline" size={24} color="#42526E" />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="px-4 pb-6 border-t border-gray-200 bg-white">
        <Pressable
          onPress={handleAddRange}
          className="rounded-lg py-4 px-4 active:opacity-80 mt-4"
          style={{ backgroundColor: '#1E88E5', minHeight: 44 }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-base font-medium text-white ml-2">
              Add Time Range
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Undo Toast */}
      {undoAction && (
        <View className="absolute bottom-20 left-4 right-4">
          <View className="bg-gray-800 rounded-lg p-4 flex-row items-center justify-between">
            <Text className="text-white font-medium">Range deleted</Text>
            <Pressable
              onPress={undoAction.action}
              className="px-3 py-1 rounded bg-white/20 active:bg-white/30"
            >
              <Text className="text-white font-medium">Undo</Text>
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
              id: `range_${Date.now()}`,
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
              id: `blackout_${Date.now()}`,
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
        slots={generateSlotsForNext14Days()}
        formatLocationText={formatLocationText}
      />
    </View>
  );
}

interface DayChipProps {
  day: { name: string; value: number };
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
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: isSelected ? '#1E88E5' : '#F5F5F5',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Text
            className="text-sm font-medium"
            style={{
              color: isSelected ? 'white' : '#42526E',
            }}
          >
            {day.name}
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={animatedStyle}>
        <View className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-lg font-semibold mb-1" style={{ color: '#0B1220' }}>
                {formatTime(range.startTime)} - {formatTime(range.endTime)}
              </Text>
              <Text className="text-sm" style={{ color: '#42526E' }}>
                {formatLocationText(range.areaId, range.facilityId, range.courtId)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#42526E" />
          </View>
          
          {/* Swipe hint */}
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xs font-medium text-center" style={{ color: '#C62828' }}>
              ← Swipe left to delete
            </Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// Modal components are imported from AvailabilityModals.tsx