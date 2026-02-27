import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { addDays, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO } from 'date-fns';

import { AvailabilityRange, BlackoutDate, Area, Facility, Court } from '../types/coach';

interface RangeEditorModalProps {
  visible: boolean;
  onClose: () => void;
  range: AvailabilityRange | null;
  dayOfWeek: number;
  areas: Area[];
  facilities: Facility[];
  courts: Court[];
  formatLocationText: (areaId?: string, facilityId?: string, courtId?: string) => string;
  validateRangeOverlap: (range: Omit<AvailabilityRange, 'id' | 'coachId'>, excludeId?: string) => boolean;
  onSave: (range: Omit<AvailabilityRange, 'id' | 'coachId'>) => void;
}

export function RangeEditorModal({
  visible,
  onClose,
  range,
  dayOfWeek,
  areas,
  facilities,
  courts,
  formatLocationText,
  validateRangeOverlap,
  onSave,
}: RangeEditorModalProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (range) {
      setStartTime(range.startTime);
      setEndTime(range.endTime);
      setSelectedAreaId(range.areaId);
      setSelectedFacilityId(range.facilityId || '');
      setSelectedCourtId(range.courtId || '');
    } else {
      setStartTime('09:00');
      setEndTime('17:00');
      setSelectedAreaId(areas[0]?.id || '');
      setSelectedFacilityId('');
      setSelectedCourtId('');
    }
  }, [range, areas, visible]);

  const availableFacilities = facilities.filter(f => f.areaId === selectedAreaId);
  const availableCourts = courts.filter(c => c.facilityId === selectedFacilityId);

  const handleSave = () => {
    if (!selectedAreaId) {
      Alert.alert('Missing Area', 'Please select an area.');
      return;
    }

    if (startTime >= endTime) {
      Alert.alert('Invalid Time Range', 'End time must be after start time.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    const rangeData = {
      dayOfWeek,
      startTime,
      endTime,
      areaId: selectedAreaId,
      facilityId: (selectedFacilityId && selectedFacilityId.trim() !== '') 
        ? selectedFacilityId 
        : undefined,
      courtId: (selectedCourtId && selectedCourtId.trim() !== '') 
        ? selectedCourtId 
        : undefined,
    };

    // Validate overlap
    const hasOverlap = validateRangeOverlap(rangeData, range?.id);
    if (hasOverlap) {
      Alert.alert(
        'Time Conflict',
        'You already have availability set for this day and time. You can only be in one place at a time.\n\nPlease choose a different time or edit your existing availability.',
        [{ text: 'OK' }]
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    onSave(rangeData);
  };

  const parseTime = (timeString: string): Date => {
    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(timeString)) {
      throw new Error(`Invalid time format: ${timeString}. Expected HH:mm format.`);
    }

    const [hours, minutes] = timeString.split(':').map(Number);

    // Additional validation
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time values: ${timeString}`);
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTimeFromDate = (date: Date): string => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Text className="text-base" style={{ color: '#1E88E5' }}>Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
            {range ? 'Edit Time Range' : 'Add Time Range'}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-base font-medium" style={{ color: '#1E88E5' }}>Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1">
          {/* Time Range */}
          <View className="p-4">
            <Text className="text-lg font-semibold mb-4" style={{ color: '#0B1220' }}>
              Time Range
            </Text>
            
            <View className="flex-row space-x-4 mb-6">
              <View className="flex-1">
                <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                  Start Time
                </Text>
                <Pressable
                  onPress={() => setShowStartPicker(true)}
                  className="bg-gray-50 rounded-lg px-3 py-3 border border-gray-200"
                  style={{ minHeight: 44 }}
                >
                  <Text className="text-base" style={{ color: '#0B1220' }}>
                    {formatTimeDisplay(startTime)}
                  </Text>
                </Pressable>
              </View>
              
              <View className="flex-1">
                <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                  End Time
                </Text>
                <Pressable
                  onPress={() => setShowEndPicker(true)}
                  className="bg-gray-50 rounded-lg px-3 py-3 border border-gray-200"
                  style={{ minHeight: 44 }}
                >
                  <Text className="text-base" style={{ color: '#0B1220' }}>
                    {formatTimeDisplay(endTime)}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Location Picker */}
          <View className="p-4 border-t border-gray-200">
            <Text className="text-lg font-semibold mb-4" style={{ color: '#0B1220' }}>
              Location
            </Text>

            {/* Area Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Area (Required)
              </Text>
              <View className="bg-gray-50 rounded-lg border border-gray-200">
                {areas.map((area) => (
                  <Pressable
                    key={area.id}
                    onPress={() => {
                      setSelectedAreaId(area.id);
                      setSelectedFacilityId('');
                      setSelectedCourtId('');
                    }}
                    className="px-3 py-3 flex-row items-center"
                    style={{
                      borderBottomWidth: areas.indexOf(area) < areas.length - 1 ? 1 : 0,
                      borderBottomColor: '#E0E0E0',
                      minHeight: 44,
                    }}
                  >
                    <Ionicons
                      name={selectedAreaId === area.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color="#1E88E5"
                    />
                    <Text className="text-base ml-3" style={{ color: '#0B1220' }}>
                      {area.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Facility Selection */}
            {availableFacilities.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                  Facility (Optional)
                </Text>
                <View className="bg-gray-50 rounded-lg border border-gray-200">
                  <Pressable
                    onPress={() => {
                      setSelectedFacilityId('');
                      setSelectedCourtId('');
                    }}
                    className="px-3 py-3 flex-row items-center border-b border-gray-200"
                    style={{ minHeight: 44 }}
                  >
                    <Ionicons
                      name={selectedFacilityId === '' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color="#1E88E5"
                    />
                    <Text className="text-base ml-3" style={{ color: '#42526E' }}>
                      No specific facility
                    </Text>
                  </Pressable>
                  {availableFacilities.map((facility) => (
                    <Pressable
                      key={facility.id}
                      onPress={() => {
                        setSelectedFacilityId(facility.id);
                        setSelectedCourtId('');
                      }}
                      className="px-3 py-3 flex-row items-center"
                      style={{
                        borderBottomWidth: availableFacilities.indexOf(facility) < availableFacilities.length - 1 ? 1 : 0,
                        borderBottomColor: '#E0E0E0',
                        minHeight: 44,
                      }}
                    >
                      <Ionicons
                        name={selectedFacilityId === facility.id ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color="#1E88E5"
                      />
                      <Text className="text-base ml-3" style={{ color: '#0B1220' }}>
                        {facility.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Court Selection */}
            {selectedFacilityId && availableCourts.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                  Court (Optional)
                </Text>
                <View className="bg-gray-50 rounded-lg border border-gray-200">
                  <Pressable
                    onPress={() => setSelectedCourtId('')}
                    className="px-3 py-3 flex-row items-center border-b border-gray-200"
                    style={{ minHeight: 44 }}
                  >
                    <Ionicons
                      name={selectedCourtId === '' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color="#1E88E5"
                    />
                    <Text className="text-base ml-3" style={{ color: '#42526E' }}>
                      No specific court
                    </Text>
                  </Pressable>
                  {availableCourts.map((court) => (
                    <Pressable
                      key={court.id}
                      onPress={() => setSelectedCourtId(court.id)}
                      className="px-3 py-3 flex-row items-center"
                      style={{
                        borderBottomWidth: availableCourts.indexOf(court) < availableCourts.length - 1 ? 1 : 0,
                        borderBottomColor: '#E0E0E0',
                        minHeight: 44,
                      }}
                    >
                      <Ionicons
                        name={selectedCourtId === court.id ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color="#1E88E5"
                      />
                      <Text className="text-base ml-3" style={{ color: '#0B1220' }}>
                        {court.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Location Preview */}
            <View className="bg-blue-50 rounded-lg p-3">
              <Text className="text-sm font-medium mb-1" style={{ color: '#0B1220' }}>
                Selected Location:
              </Text>
              <Text className="text-sm" style={{ color: '#42526E' }}>
                {formatLocationText(selectedAreaId, selectedFacilityId || undefined, selectedCourtId || undefined)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Time Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={parseTime(startTime)}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowStartPicker(Platform.OS === 'ios');
              if (selectedDate) {
                setStartTime(formatTimeFromDate(selectedDate));
              }
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={parseTime(endTime)}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowEndPicker(Platform.OS === 'ios');
              if (selectedDate) {
                setEndTime(formatTimeFromDate(selectedDate));
              }
            }}
          />
        )}
      </View>
    </Modal>
  );
}

interface BlackoutCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  blackoutDates: BlackoutDate[];
  onAddDate: (date: string) => void;
  onRemoveDate: (date: string) => void;
}

export function BlackoutCalendarModal({
  visible,
  onClose,
  blackoutDates,
  onAddDate,
  onRemoveDate,
}: BlackoutCalendarModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const blackoutDateStrings = blackoutDates.map(b => b.date);

  const getDaysInMonth = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // Return array with null for days outside current month, Date objects for days in month
    return days.map(day => {
      if (day.getMonth() === date.getMonth()) {
        return day;
      }
      return null;
    });
  };

  const handleDatePress = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    if (blackoutDateStrings.includes(dateString)) {
      onRemoveDate(dateString);
    } else {
      onAddDate(dateString);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedMonth(subMonths(selectedMonth, 1));
    } else {
      setSelectedMonth(addMonths(selectedMonth, 1));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Text className="text-base" style={{ color: '#1E88E5' }}>Done</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
            Blackout Dates
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View className="p-4">
          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => navigateMonth('prev')}
              className="p-2 rounded-lg active:bg-gray-100"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Ionicons name="chevron-back" size={24} color="#0B1220" />
            </Pressable>
            
            <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
              {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            
            <Pressable
              onPress={() => navigateMonth('next')}
              className="p-2 rounded-lg active:bg-gray-100"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Ionicons name="chevron-forward" size={24} color="#0B1220" />
            </Pressable>
          </View>

          {/* Day Headers */}
          <View className="flex-row mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <View key={day} className="flex-1 items-center py-2">
                <Text className="text-sm font-medium" style={{ color: '#42526E' }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap">
            {getDaysInMonth(selectedMonth).map((date, index) => (
              <View key={index} style={{ width: '14.28%' }} className="aspect-square p-1">
                {date ? (
                  <DayCell
                    date={date}
                    isBlackedOut={blackoutDateStrings.includes(format(date, 'yyyy-MM-dd'))}
                    onPress={() => handleDatePress(date)}
                  />
                ) : (
                  <View />
                )}
              </View>
            ))}
          </View>
        </View>

        <View className="px-4 pb-4">
          <View className="bg-blue-50 rounded-lg p-3">
            <Text className="text-sm font-medium mb-1" style={{ color: '#0B1220' }}>
              Instructions:
            </Text>
            <Text className="text-sm" style={{ color: '#42526E' }}>
              Tap dates to add/remove blackouts. Blacked out dates won't show available slots to students.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface DayCellProps {
  date: Date;
  isBlackedOut: boolean;
  onPress: () => void;
}

function DayCell({ date, isBlackedOut, onPress }: DayCellProps) {
  const isToday = date.toDateString() === new Date().toDateString();
  const isPast = date < new Date() && !isToday;

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center rounded-lg"
      style={{
        backgroundColor: isBlackedOut ? '#C62828' : isToday ? '#E3F2FD' : 'transparent',
        opacity: isPast ? 0.5 : 1,
        minHeight: 44,
      }}
    >
      <Text
        className="text-sm font-medium"
        style={{
          color: isBlackedOut ? 'white' : isToday ? '#1E88E5' : '#0B1220',
        }}
      >
        {date.getDate()}
      </Text>
      {isBlackedOut && (
        <Ionicons name="close" size={12} color="white" style={{ position: 'absolute' }} />
      )}
    </Pressable>
  );
}

interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  slots: Array<{ date: string; time: string; range: AvailabilityRange }>;
  formatLocationText: (areaId?: string, facilityId?: string, courtId?: string) => string;
}

export function PreviewModal({ visible, onClose, slots, formatLocationText }: PreviewModalProps) {
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, typeof slots>);

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    const today = new Date();
    const tomorrow = addDays(today, 1);

    if (isSameDay(date, today)) {
      return 'Today';
    } else if (isSameDay(date, tomorrow)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEE, MMM d');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Text className="text-base" style={{ color: '#1E88E5' }}>Close</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
            14-Day Preview
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView className="flex-1">
          {Object.keys(groupedSlots).length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="calendar-outline" size={64} color="#42526E" />
              <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: '#0B1220' }}>
                No availability yet
              </Text>
              <Text className="text-base text-center" style={{ color: '#42526E' }}>
                Add your weekly times below
              </Text>
            </View>
          ) : (
            <View className="p-4">
              {Object.entries(groupedSlots)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, daySlots]) => (
                  <View key={date} className="mb-6">
                    <Text className="text-lg font-semibold mb-3" style={{ color: '#0B1220' }}>
                      {formatDate(date)}
                    </Text>
                    <View className="space-y-2">
                      {daySlots
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((slot, index) => (
                          <View
                            key={`${slot.time}-${index}`}
                            className="bg-gray-50 rounded-lg p-3 flex-row items-center"
                          >
                            <Ionicons name="time-outline" size={16} color="#42526E" />
                            <Text className="text-base font-medium ml-2" style={{ color: '#0B1220' }}>
                              {formatTime(slot.time)}
                            </Text>
                            <Text className="text-sm ml-2" style={{ color: '#42526E' }}>
                              • {formatLocationText(slot.range.areaId, slot.range.facilityId, slot.range.courtId)}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}