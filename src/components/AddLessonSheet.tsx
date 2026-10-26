import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { addDays, format } from 'date-fns';

import { useCoachStore } from '../state/coachStore';
import { DesignTokens } from '../utils/designTokens';
import {
  DEFAULT_GROUP_CAPACITY,
  MAX_GROUP_CAPACITY,
  MIN_GROUP_CAPACITY,
} from '../utils/groupLessons';

interface AddLessonSheetProps {
  visible: boolean;
  defaultDate: string; // ISO yyyy-MM-dd
  onClose: () => void;
}

const DURATIONS = [
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
  { label: '90m', minutes: 90 },
  { label: '2h', minutes: 120 },
];

// Build a 14-day pill list starting from today
function buildDatePills(defaultDate: string) {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i);
    return {
      iso: format(d, 'yyyy-MM-dd'),
      dayAbbrev: format(d, 'EEE'),
      dayNum: format(d, 'd'),
    };
  });
}

export function AddLessonSheet({ visible, defaultDate, onClose }: AddLessonSheetProps) {
  const insets = useSafeAreaInsets();
  const { students, coach, createLesson, createGroupLesson, areas, facilities, courts } = useCoachStore();

  const [studentSearch, setStudentSearch] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [capacity, setCapacity] = useState(DEFAULT_GROUP_CAPACITY);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const datePills = buildDatePills(defaultDate);

  // Auto-fill price when duration changes
  useEffect(() => {
    if (coach) {
      const computed = ((duration / 60) * coach.pricePerHour).toFixed(0);
      setPrice(computed);
    }
  }, [duration, coach]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setStudentSearch('');
      setIsGroup(false);
      setCapacity(DEFAULT_GROUP_CAPACITY);
      setSelectedStudentIds([]);
      setSelectedCourtId(courts[0]?.id ?? null);
      setSelectedDate(defaultDate);
      setStartTime('');
      setDuration(60);
      setPrice(coach ? ((60 / 60) * coach.pricePerHour).toFixed(0) : '');
      setError('');
    }
  }, [visible]);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));

  // Single lesson: tapping a student picks just that one. Group: taps toggle.
  const toggleStudent = (id: string) => {
    setError('');
    if (!isGroup) {
      setSelectedStudentIds([id]);
      return;
    }
    setSelectedStudentIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= capacity) {
        setError(`This group holds ${capacity} players.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const changeGroupMode = (value: boolean) => {
    setIsGroup(value);
    setError('');
    // Leaving group mode keeps at most one student selected.
    if (!value) setSelectedStudentIds(prev => prev.slice(0, 1));
  };

  const changeCapacity = (next: number) => {
    const clamped = Math.min(MAX_GROUP_CAPACITY, Math.max(MIN_GROUP_CAPACITY, next));
    setCapacity(clamped);
    // Never keep more players selected than the group holds.
    setSelectedStudentIds(prev => prev.slice(0, clamped));
    setError('');
  };

  // A court implies its facility and area.
  const locationFor = (courtId: string | null) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return {};
    const facility = facilities.find(f => f.id === court.facilityId);
    return { courtId: court.id, facilityId: court.facilityId, areaId: facility?.areaId };
  };

  const formatEndTime = (start: string, mins: number) => {
    const match = start.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return '';
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    const totalMins = h * 60 + m + mins;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    const endMeridiem = endH >= 12 ? 'PM' : 'AM';
    const display = (endH % 12 || 12) + ':' + String(endM).padStart(2, '0') + ' ' + endMeridiem;
    return display;
  };

  const parseTimeToHHMM = (input: string): string | null => {
    const match = input.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleSave = () => {
    setError('');

    if (selectedStudentIds.length === 0) {
      setError(isGroup ? 'Select at least one player.' : 'Please select a student.');
      return;
    }
    const hhMM = parseTimeToHHMM(startTime);
    if (!hhMM) {
      setError('Enter a valid start time, e.g. "9:00 AM".');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid price.');
      return;
    }

    const location = locationFor(selectedCourtId);

    if (isGroup) {
      try {
        createGroupLesson({
          studentIds: selectedStudentIds,
          date: selectedDate,
          startTime: hhMM,
          duration,
          pricePerPlayer: priceNum,
          capacity,
          ...location,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not create the group lesson.');
        return;
      }
    } else {
      createLesson({
        studentId: selectedStudentIds[0],
        studentName: selectedStudents[0].name,
        date: selectedDate,
        startTime: hhMM,
        duration,
        price: priceNum,
        ...location,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const canSave = selectedStudentIds.length > 0 && !!startTime.trim();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'white' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: DesignTokens.colors.superLightGrey,
          }}
        >
          <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ ...DesignTokens.typography.body, color: DesignTokens.colors.grey }}>
              Cancel
            </Text>
          </Pressable>
          <Text style={{ ...DesignTokens.typography.headline, color: DesignTokens.colors.graphite }}>
            {isGroup ? 'Add Group Lesson' : 'Add Lesson'}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                ...DesignTokens.typography.body,
                fontWeight: '600',
                color: canSave ? DesignTokens.colors.accent : DesignTokens.colors.grey,
              }}
            >
              Add
            </Text>
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Error */}
          {!!error && (
            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.danger }}>
                {error}
              </Text>
            </View>
          )}

          {/* Group lesson */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ ...DesignTokens.typography.body, fontWeight: '500', color: DesignTokens.colors.graphite }}>
                Group lesson
              </Text>
              <Text style={{ ...DesignTokens.typography.footnote, color: DesignTokens.colors.grey }}>
                Several players share one session
              </Text>
            </View>
            <Switch
              value={isGroup}
              onValueChange={changeGroupMode}
              trackColor={{ false: '#E0E0E0', true: DesignTokens.colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          {isGroup && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ ...DesignTokens.typography.body, color: DesignTokens.colors.graphite }}>
                Max players
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Pressable
                  onPress={() => changeCapacity(capacity - 1)}
                  disabled={capacity <= MIN_GROUP_CAPACITY}
                  accessibilityLabel="Fewer players"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: DesignTokens.colors.superLightGrey,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: capacity <= MIN_GROUP_CAPACITY ? 0.4 : 1,
                  }}
                >
                  <Ionicons name="remove" size={20} color={DesignTokens.colors.graphite} />
                </Pressable>
                <Text style={{ ...DesignTokens.typography.title3, color: DesignTokens.colors.graphite, minWidth: 24, textAlign: 'center' }}>
                  {capacity}
                </Text>
                <Pressable
                  onPress={() => changeCapacity(capacity + 1)}
                  disabled={capacity >= MAX_GROUP_CAPACITY}
                  accessibilityLabel="More players"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: DesignTokens.colors.superLightGrey,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: capacity >= MAX_GROUP_CAPACITY ? 0.4 : 1,
                  }}
                >
                  <Ionicons name="add" size={20} color={DesignTokens.colors.graphite} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Student */}
          <SectionHeader
            title={isGroup ? `Players (${selectedStudentIds.length}/${capacity})` : 'Student'}
          />
          <View style={{ paddingHorizontal: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: DesignTokens.colors.superLightGrey,
                borderRadius: 10,
                paddingHorizontal: 12,
                marginBottom: 10,
              }}
            >
              <Ionicons name="search" size={16} color={DesignTokens.colors.grey} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 8,
                  ...DesignTokens.typography.body,
                  color: DesignTokens.colors.graphite,
                  height: 40,
                }}
                placeholder="Search students…"
                placeholderTextColor={DesignTokens.colors.grey}
                value={studentSearch}
                onChangeText={setStudentSearch}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {filteredStudents.slice(0, 20).map(s => (
                  <Pressable
                    key={s.id}
                    onPress={() => toggleStudent(s.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: DesignTokens.radius.full,
                      backgroundColor:
                        selectedStudentIds.includes(s.id)
                          ? DesignTokens.colors.accent
                          : DesignTokens.colors.superLightGrey,
                      minHeight: 44,
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        ...DesignTokens.typography.subhead,
                        fontWeight: '500',
                        color:
                          selectedStudentIds.includes(s.id) ? 'white' : DesignTokens.colors.graphite,
                      }}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                ))}
                {filteredStudents.length === 0 && (
                  <Text
                    style={{
                      ...DesignTokens.typography.subhead,
                      color: DesignTokens.colors.grey,
                      paddingVertical: 10,
                    }}
                  >
                    No students found
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Date */}
          <SectionHeader title="Date" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 20 }}>
              {datePills.map(p => (
                <Pressable
                  key={p.iso}
                  onPress={() => setSelectedDate(p.iso)}
                  style={{
                    width: 56,
                    height: 64,
                    borderRadius: DesignTokens.radius.default,
                    backgroundColor:
                      selectedDate === p.iso
                        ? DesignTokens.colors.accent
                        : DesignTokens.colors.superLightGrey,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      ...DesignTokens.typography.caption1,
                      color: selectedDate === p.iso ? 'rgba(255,255,255,0.8)' : DesignTokens.colors.grey,
                    }}
                  >
                    {p.dayAbbrev}
                  </Text>
                  <Text
                    style={{
                      ...DesignTokens.typography.title3,
                      color: selectedDate === p.iso ? 'white' : DesignTokens.colors.graphite,
                    }}
                  >
                    {p.dayNum}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Start Time */}
          <SectionHeader title="Start Time" />
          <View style={{ paddingHorizontal: 20 }}>
            <TextInput
              style={{
                backgroundColor: DesignTokens.colors.superLightGrey,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                ...DesignTokens.typography.body,
                color: DesignTokens.colors.graphite,
              }}
              placeholder="e.g. 9:00 AM"
              placeholderTextColor={DesignTokens.colors.grey}
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
            />
            {startTime.trim() && parseTimeToHHMM(startTime) && (
              <Text
                style={{
                  ...DesignTokens.typography.footnote,
                  color: DesignTokens.colors.grey,
                  marginTop: 6,
                }}
              >
                Ends at {formatEndTime(startTime, duration)}
              </Text>
            )}
          </View>

          {/* Duration */}
          <SectionHeader title="Duration" />
          <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 8 }}>
            {DURATIONS.map(d => (
              <Pressable
                key={d.minutes}
                onPress={() => setDuration(d.minutes)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: DesignTokens.radius.default,
                  backgroundColor:
                    duration === d.minutes
                      ? DesignTokens.colors.accent
                      : DesignTokens.colors.superLightGrey,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    ...DesignTokens.typography.subhead,
                    fontWeight: '600',
                    color: duration === d.minutes ? 'white' : DesignTokens.colors.graphite,
                  }}
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Court */}
          {courts.length > 0 && (
            <>
              <SectionHeader title="Court" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingRight: 20 }}>
                  {[{ id: null as string | null, label: 'No court' }, ...courts.map(c => ({
                    id: c.id as string | null,
                    label: facilities.length > 1
                      ? `${c.label} · ${facilities.find(f => f.id === c.facilityId)?.name ?? ''}`
                      : c.label,
                  }))].map(option => {
                    const selected = selectedCourtId === option.id;
                    return (
                      <Pressable
                        key={option.id ?? 'none'}
                        onPress={() => setSelectedCourtId(option.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: DesignTokens.radius.full,
                          backgroundColor: selected
                            ? DesignTokens.colors.accent
                            : DesignTokens.colors.superLightGrey,
                          minHeight: 44,
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            ...DesignTokens.typography.subhead,
                            fontWeight: '500',
                            color: selected ? 'white' : DesignTokens.colors.graphite,
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          {/* Price */}
          <SectionHeader title={isGroup ? 'Price per player' : 'Price'} />
          <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                ...DesignTokens.typography.title2,
                color: DesignTokens.colors.grey,
                marginRight: 4,
              }}
            >
              $
            </Text>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: DesignTokens.colors.superLightGrey,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                ...DesignTokens.typography.body,
                color: DesignTokens.colors.graphite,
              }}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </ScrollView>

        {/* Save button */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: DesignTokens.colors.superLightGrey,
            backgroundColor: 'white',
          }}
        >
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={{
              backgroundColor: canSave ? DesignTokens.colors.accent : DesignTokens.colors.superLightGrey,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                ...DesignTokens.typography.headline,
                color: canSave ? 'white' : DesignTokens.colors.grey,
              }}
            >
              Add Lesson
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        ...DesignTokens.typography.footnote,
        fontWeight: '600',
        color: DesignTokens.colors.grey,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
      }}
    >
      {title}
    </Text>
  );
}
