import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, format } from 'date-fns';

import { Coach, BookingRequest, TimeSlot, AvailabilityRange, Lesson } from '../types/coach';

interface PublicBookingScreenProps {
  coach: Coach;
  availabilityRanges: AvailabilityRange[];
  blackoutDates: any[];
  lessons: Lesson[];
  areas: any[];
  facilities: any[];
  courts: any[];
  formatLocationText: (areaId?: string, facilityId?: string, courtId?: string) => string;
  generateSlotsForNext14Days: () => Array<{date: string, time: string, range: AvailabilityRange}>;
  onBookingRequest: (request: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
}

export function PublicBookingScreen({ coach, availabilityRanges, blackoutDates, lessons, formatLocationText, onBookingRequest }: PublicBookingScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentContact, setStudentContact] = useState('');
  const [note, setNote] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Phone validation regex (allows various formats)
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;

  const validateContact = (contact: string): boolean => {
    const trimmed = contact.trim();
    if (trimmed.length === 0) return false;

    // Check if it looks like an email or phone
    return emailRegex.test(trimmed) || phoneRegex.test(trimmed);
  };

  const handleBookingSubmit = async () => {
    if (!studentName.trim() || !studentContact.trim() || !selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Validate contact format
    if (!validateContact(studentContact)) {
      Alert.alert('Invalid Contact', 'Please enter a valid email address or phone number.');
      return;
    }

    // Validate name length
    if (studentName.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter a valid name (at least 2 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const request: Omit<BookingRequest, 'id' | 'status' | 'createdAt'> = {
        coachId: coach.id,
        studentName: studentName.trim(),
        studentContact: studentContact.trim(),
        requestedDate: selectedDate,
        requestedTime: selectedTime,
        duration: 60, // Default 1 hour
        note: note.trim() || undefined,
        areaId: selectedSlot?.areaId,
        facilityId: selectedSlot?.facilityId,
        courtId: selectedSlot?.courtId,
      };

      // Call async handler (saves to Supabase)
      await onBookingRequest(request);

      Alert.alert(
        'Request Sent!',
        `Your booking request has been sent to ${coach.name}. They will review and confirm your lesson.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowBookingForm(false);
              setStudentName('');
              setStudentContact('');
              setNote('');
              setSelectedDate('');
              setSelectedTime('');
              setSelectedSlot(null);
              setIsSubmitting(false);
            },
          },
        ]
      );
    } catch (error) {
      if (__DEV__) {
        console.error('Booking request failed:', error);
      }
      Alert.alert(
        'Booking Failed',
        error instanceof Error ? error.message : 'Unable to submit your booking request. Please try again.',
        [{ text: 'OK' }]
      );
      setIsSubmitting(false);
    }
  };

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      // Use date-fns addDays for DST-safe date calculation
      const date = addDays(today, i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEE, MMM d');
  };

  const getAvailableTimeSlots = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    
    // Check if this date is blacked out
    const isBlackedOut = blackoutDates.some(b => b.date === dateString);
    if (isBlackedOut) return [];
    
    // Get availability ranges for this day
    const ranges = availabilityRanges.filter(r => r.dayOfWeek === dayOfWeek);
    
    const slots: Array<{ time: string; slot: AvailabilityRange }> = [];
    
    ranges.forEach(range => {
      // Generate hourly slots from range
      const startHour = parseInt(range.startTime.split(':')[0]);
      const endHour = parseInt(range.endTime.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const slotEndTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        // Check if this time slot conflicts with existing lessons
        // Coach can only be in one place at a time
        const hasConflict = lessons.some(lesson => {
          // Only check non-cancelled lessons on the same date
          if (lesson.status === 'cancelled' || lesson.date !== dateString) {
            return false;
          }
          
          // If there's a lesson at this time, the slot is unavailable
          const hasTimeOverlap = (time < lesson.endTime && slotEndTime > lesson.startTime);
          
          return hasTimeOverlap;
        });
        
        if (!hasConflict) {
          slots.push({ time, slot: range });
        }
      }
    });
    
    return slots;
  };

  if (showBookingForm) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Pressable onPress={() => setShowBookingForm(false)}>
            <Ionicons name="arrow-back" size={24} color="#0B1220" />
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
            Book Lesson
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Your Name *
              </Text>
              <TextInput
                value={studentName}
                onChangeText={setStudentName}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="John Smith"
                style={{ color: '#0B1220' }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Contact (Email or Phone) *
              </Text>
              <TextInput
                value={studentContact}
                onChangeText={setStudentContact}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="john@email.com or (555) 123-4567"
                style={{ color: '#0B1220' }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Selected Time
              </Text>
              <Text className="text-base" style={{ color: '#42526E' }}>
                {formatDate(new Date(selectedDate))} at {selectedTime}
                {selectedSlot && (selectedSlot.areaId || selectedSlot.facilityId || selectedSlot.courtId) && (
                  <Text className="text-sm" style={{ color: '#42526E' }}>
                    {'\n'}{formatLocationText(selectedSlot.areaId, selectedSlot.facilityId, selectedSlot.courtId)}
                  </Text>
                )}
              </Text>
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Note (Optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="Any specific requests or goals..."
                multiline
                numberOfLines={3}
                style={{ color: '#0B1220', textAlignVertical: 'top' }}
              />
            </View>
          </View>

          <Pressable
            onPress={handleBookingSubmit}
            disabled={isSubmitting}
            className="mt-8 rounded-lg py-4 px-4 active:opacity-80"
            style={{
              backgroundColor: isSubmitting ? '#90CAF9' : '#1E88E5',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-base font-medium text-white ml-2">
                  Sending...
                </Text>
              </View>
            ) : (
              <Text className="text-base font-medium text-white text-center">
                Send Booking Request
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="items-center px-4 py-6 border-b border-gray-200">
        <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-4">
          <Ionicons name="person" size={40} color="#42526E" />
        </View>
        <Text className="text-xl font-semibold mb-2" style={{ color: '#0B1220' }}>
          {coach.name}
        </Text>
        <Text className="text-base mb-1" style={{ color: '#42526E' }}>
          {coach.sports.join(' • ')}
        </Text>
        <Text className="text-lg font-medium" style={{ color: '#1E88E5' }}>
          ${coach.pricePerHour}/hour
        </Text>
      </View>

      {/* Available Times */}
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: '#0B1220' }}>
            Available Times
          </Text>
          
          {getNextWeekDates().map(date => {
            const timeSlots = getAvailableTimeSlots(date);
            if (timeSlots.length === 0) return null;

            return (
              <View key={format(date, 'yyyy-MM-dd')} className="mb-6">
                <Text className="text-base font-medium mb-3" style={{ color: '#0B1220' }}>
                  {formatDate(date)}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {timeSlots.map(({ time, slot }, index) => (
                    <Pressable
                      key={`${time}-${index}`}
                      onPress={() => {
                        setSelectedDate(format(date, 'yyyy-MM-dd'));
                        setSelectedTime(time);
                        setSelectedSlot(slot);
                        setShowBookingForm(true);
                      }}
                      className="bg-gray-100 px-4 py-2 rounded-lg active:bg-gray-200"
                    >
                      <Text className="text-sm font-medium" style={{ color: '#0B1220' }}>
                        {time}
                      </Text>
                      {(slot.areaId || slot.facilityId || slot.courtId) && (
                        <Text className="text-xs mt-1" style={{ color: '#42526E' }}>
                          {formatLocationText(slot.areaId, slot.facilityId, slot.courtId)}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}