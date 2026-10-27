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
import { showToast } from '../state/toastStore';
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO } from 'date-fns';

import { AvailabilityRange, BlackoutDate, Area, Facility, Court } from '../types/coach';
import { formatClockTime } from '../utils/timeFormat';
import { DesignTokens } from '../utils/designTokens';
import { formatLocalized, weekdayName } from '../i18n/formatDate';
import { formatDateForDisplay } from '../utils/dayNav';
import { t } from '../i18n';

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
      showToast(t('availability.selectArea'), 'error');
      return;
    }

    if (startTime >= endTime) {
      showToast(t('availability.endAfterStart'), 'error');
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
        t('availability.conflictTitle'),
        t('availability.conflictBody'),
        [{ text: t('common.ok') }]
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
            <Text className="text-base" style={{ color: DesignTokens.colors.brand.default }}>{t('common.cancel')}</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
            {range ? t('availability.editTimeRange') : t('availability.addTimeRange')}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-base font-medium" style={{ color: DesignTokens.colors.brand.default }}>{t('common.save')}</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1">
          {/* Time Range */}
          <View className="p-4">
            <Text className="text-lg font-semibold mb-4" style={{ color: DesignTokens.colors.text.strong }}>
              {t('availability.timeRange')}
            </Text>
            
            <View className="flex-row space-x-4 mb-6">
              <View className="flex-1">
                <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                  {t('availability.startTime')}
                </Text>
                <Pressable
                  onPress={() => setShowStartPicker(true)}
                  className="bg-gray-50 rounded-lg px-3 py-3 border border-gray-200"
                  style={{ minHeight: 44 }}
                >
                  <Text className="text-base" style={{ color: DesignTokens.colors.text.strong }}>
                    {formatTimeDisplay(startTime)}
                  </Text>
                </Pressable>
              </View>
              
              <View className="flex-1">
                <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                  {t('availability.endTime')}
                </Text>
                <Pressable
                  onPress={() => setShowEndPicker(true)}
                  className="bg-gray-50 rounded-lg px-3 py-3 border border-gray-200"
                  style={{ minHeight: 44 }}
                >
                  <Text className="text-base" style={{ color: DesignTokens.colors.text.strong }}>
                    {formatTimeDisplay(endTime)}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Location Picker */}
          <View className="p-4 border-t border-gray-200">
            <Text className="text-lg font-semibold mb-4" style={{ color: DesignTokens.colors.text.strong }}>
              {t('availability.location')}
            </Text>

            {/* Area Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                {t('availability.areaRequired')}
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
                      borderBottomColor: DesignTokens.colors.line.default,
                      minHeight: 44,
                    }}
                  >
                    <Ionicons
                      name={selectedAreaId === area.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={DesignTokens.colors.brand.default}
                    />
                    <Text className="text-base ml-3" style={{ color: DesignTokens.colors.text.strong }}>
                      {area.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Facility Selection */}
            {availableFacilities.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                  {t('availability.facilityOptional')}
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
                      color={DesignTokens.colors.brand.default}
                    />
                    <Text className="text-base ml-3" style={{ color: DesignTokens.colors.text.muted }}>
                      {t('availability.noFacility')}
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
                        borderBottomColor: DesignTokens.colors.line.default,
                        minHeight: 44,
                      }}
                    >
                      <Ionicons
                        name={selectedFacilityId === facility.id ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={DesignTokens.colors.brand.default}
                      />
                      <Text className="text-base ml-3" style={{ color: DesignTokens.colors.text.strong }}>
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
                <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                  {t('availability.courtOptional')}
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
                      color={DesignTokens.colors.brand.default}
                    />
                    <Text className="text-base ml-3" style={{ color: DesignTokens.colors.text.muted }}>
                      {t('availability.noCourt')}
                    </Text>
                  </Pressable>
                  {availableCourts.map((court) => (
                    <Pressable
                      key={court.id}
                      onPress={() => setSelectedCourtId(court.id)}
                      className="px-3 py-3 flex-row items-center"
                      style={{
                        borderBottomWidth: availableCourts.indexOf(court) < availableCourts.length - 1 ? 1 : 0,
                        borderBottomColor: DesignTokens.colors.line.default,
                        minHeight: 44,
                      }}
                    >
                      <Ionicons
                        name={selectedCourtId === court.id ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={DesignTokens.colors.brand.default}
                      />
                      <Text className="text-base ml-3" style={{ color: DesignTokens.colors.text.strong }}>
                        {court.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Location Preview */}
            <View className="bg-blue-50 rounded-lg p-3">
              <Text className="text-sm font-medium mb-1" style={{ color: DesignTokens.colors.text.strong }}>
                {t('availability.selectedLocation')}
              </Text>
              <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
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
            <Text className="text-base" style={{ color: DesignTokens.colors.brand.default }}>{t('common.done')}</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
            {t('availability.blackoutDates')}
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
              <Ionicons name="chevron-back" size={24} color={DesignTokens.colors.text.strong} />
            </Pressable>
            
            <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
              {formatLocalized(selectedMonth, 'LLLL yyyy')}
            </Text>
            
            <Pressable
              onPress={() => navigateMonth('next')}
              className="p-2 rounded-lg active:bg-gray-100"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Ionicons name="chevron-forward" size={24} color={DesignTokens.colors.text.strong} />
            </Pressable>
          </View>

          {/* Day Headers */}
          <View className="flex-row mb-2">
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <View key={day} className="flex-1 items-center py-2">
                <Text className="text-sm font-medium" style={{ color: DesignTokens.colors.text.muted }}>
                  {weekdayName(day)}
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
            <Text className="text-sm font-medium mb-1" style={{ color: DesignTokens.colors.text.strong }}>
              {t('availability.instructions')}
            </Text>
            <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
              {t('availability.blackoutHelp')}
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
        backgroundColor: isBlackedOut ? DesignTokens.colors.red['800'] : isToday ? DesignTokens.colors.brand.tintMaterial : 'transparent',
        opacity: isPast ? 0.5 : 1,
        minHeight: 44,
      }}
    >
      <Text
        className="text-sm font-medium"
        style={{
          color: isBlackedOut ? 'white' : isToday ? DesignTokens.colors.brand.default : DesignTokens.colors.text.strong,
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
    return formatDateForDisplay(parseISO(dateString));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Text className="text-base" style={{ color: DesignTokens.colors.brand.default }}>{t('common.close')}</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
            {t('availability.preview14')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView className="flex-1">
          {Object.keys(groupedSlots).length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="calendar-outline" size={64} color={DesignTokens.colors.text.muted} />
              <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                {t('availability.noAvailabilityYet')}
              </Text>
              <Text className="text-base text-center" style={{ color: DesignTokens.colors.text.muted }}>
                {t('availability.addWeeklyTimes')}
              </Text>
            </View>
          ) : (
            <View className="p-4">
              {Object.entries(groupedSlots)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, daySlots]) => (
                  <View key={date} className="mb-6">
                    <Text className="text-lg font-semibold mb-3" style={{ color: DesignTokens.colors.text.strong }}>
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
                            <Ionicons name="time-outline" size={16} color={DesignTokens.colors.text.muted} />
                            <Text className="text-base font-medium ml-2" style={{ color: DesignTokens.colors.text.strong }}>
                              {formatClockTime(slot.time)}
                            </Text>
                            <Text className="text-sm ml-2" style={{ color: DesignTokens.colors.text.muted }}>
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
