import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

import { useCoachStore } from '../state/coachStore';
import { BookingRequest } from '../types/coach';
import { DesignTokens } from '../utils/designTokens';

interface RouteParams {
  slug?: string;
}

export function PublicBookingPreview() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { slug } = (route.params as RouteParams) || {};
  
  const { 
    coach, 
    getOpenSlots, 
    addBookingRequest,
    formatLocationText 
  } = useCoachStore();

  const [selectedSlot, setSelectedSlot] = useState<{date: string, time: string, range: any} | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentContact, setStudentContact] = useState('');
  const [note, setNote] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);

  if (!coach) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-lg" style={{ color: DesignTokens.colors.text.muted }}>
          No coach profile found
        </Text>
      </View>
    );
  }

  const handleBookingSubmit = () => {
    if (!studentName.trim() || !studentContact.trim() || !selectedSlot) {
      return;
    }

    const request: Omit<BookingRequest, 'id' | 'status' | 'createdAt'> = {
      coachId: coach.id,
      studentName: studentName.trim(),
      studentContact: studentContact.trim(),
      requestedDate: selectedSlot.date,
      requestedTime: selectedSlot.time,
      duration: 60, // 60-minute slots
      note: note.trim() || undefined,
      areaId: selectedSlot.range.areaId,
      facilityId: selectedSlot.range.facilityId,
      courtId: selectedSlot.range.courtId,
    };

    const fullRequest: BookingRequest = {
      ...request,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    addBookingRequest(fullRequest);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Reset form and dismiss modal
    setShowBookingForm(false);
    setStudentName('');
    setStudentContact('');
    setNote('');
    setSelectedSlot(null);
    navigation.goBack();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const groupSlotsByDate = () => {
    const slots = getOpenSlots();
    const grouped: { [date: string]: Array<{date: string, time: string, range: any}> } = {};
    
    slots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    
    return grouped;
  };

  if (showBookingForm && selectedSlot) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Pressable onPress={() => setShowBookingForm(false)}>
            <Ionicons name="arrow-back" size={24} color={DesignTokens.colors.text.strong} />
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
            Book Lesson
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                Your Name *
              </Text>
              <TextInput
                value={studentName}
                onChangeText={setStudentName}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="John Smith"
                style={{ color: DesignTokens.colors.text.strong }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                Contact (Email or Phone) *
              </Text>
              <TextInput
                value={studentContact}
                onChangeText={setStudentContact}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="john@email.com or (555) 123-4567"
                style={{ color: DesignTokens.colors.text.strong }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                Selected Time
              </Text>
              <Text className="text-base" style={{ color: DesignTokens.colors.text.muted }}>
                {formatDate(selectedSlot.date)} at {selectedSlot.time}
                {(selectedSlot.range.areaId || selectedSlot.range.facilityId || selectedSlot.range.courtId) && (
                  <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                    {'\n'}{formatLocationText(selectedSlot.range.areaId, selectedSlot.range.facilityId, selectedSlot.range.courtId)}
                  </Text>
                )}
              </Text>
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                Note (Optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="Any specific requests or goals..."
                multiline
                numberOfLines={3}
                style={{ color: DesignTokens.colors.text.strong, textAlignVertical: 'top' }}
              />
            </View>
          </View>

          <Pressable
            onPress={handleBookingSubmit}
            className="mt-8 rounded-lg py-4 px-4 active:opacity-80"
            style={{ backgroundColor: DesignTokens.colors.brand.default }}
          >
            <Text className="text-base font-medium text-white text-center">
              Send Booking Request
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const groupedSlots = groupSlotsByDate();
  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={DesignTokens.colors.text.strong} />
        </Pressable>
        <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
          Public Booking
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Coach Profile */}
      <View className="items-center px-4 py-6 border-b border-gray-200">
        <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-4">
          <Ionicons name="person" size={40} color={DesignTokens.colors.text.muted} />
        </View>
        <Text className="text-xl font-semibold mb-2" style={{ color: DesignTokens.colors.text.strong }}>
          {coach.name}
        </Text>
        <Text className="text-base mb-1" style={{ color: DesignTokens.colors.text.muted }}>
          {coach.sports.join(' • ')}
        </Text>
        <Text className="text-lg font-medium" style={{ color: DesignTokens.colors.brand.default }}>
          ${coach.pricePerHour}/hour
        </Text>
      </View>

      {/* Available Times */}
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: DesignTokens.colors.text.strong }}>
            Available Times
          </Text>
          
          {sortedDates.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="calendar-outline" size={48} color={DesignTokens.colors.text.muted} />
              <Text className="text-base mt-4" style={{ color: DesignTokens.colors.text.muted }}>
                No available slots in the next 14 days
              </Text>
            </View>
          ) : (
            sortedDates.map(date => {
              const slots = groupedSlots[date];
              
              return (
                <View key={date} className="mb-6">
                  <Text className="text-base font-medium mb-3" style={{ color: DesignTokens.colors.text.strong }}>
                    {formatDate(date)}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {slots.map((slot, index) => (
                      <Pressable
                        key={`${slot.time}-${index}`}
                        onPress={() => {
                          setSelectedSlot(slot);
                          setShowBookingForm(true);
                        }}
                        className="bg-gray-100 px-4 py-2 rounded-lg active:bg-gray-200"
                      >
                        <Text className="text-sm font-medium" style={{ color: DesignTokens.colors.text.strong }}>
                          {slot.time}
                        </Text>
                        {(slot.range.areaId || slot.range.facilityId || slot.range.courtId) && (
                          <Text className="text-xs mt-1" style={{ color: DesignTokens.colors.text.muted }}>
                            {formatLocationText(slot.range.areaId, slot.range.facilityId, slot.range.courtId)}
                          </Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
