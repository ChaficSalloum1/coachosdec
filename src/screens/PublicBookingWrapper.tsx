import React from 'react';
import { PublicBookingScreen } from './PublicBookingScreen';
import { useCoachStore } from '../state/coachStore';
import { BookingRequest } from '../types/coach';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveBookingRequestToSupabase } from '../services/supabaseSync';

export function PublicBookingWrapper() {
  const insets = useSafeAreaInsets();
  const {
    coach,
    availabilityRanges,
    blackoutDates,
    lessons,
    areas,
    facilities,
    courts,
    formatLocationText,
    generateSlotsForNext14Days,
    addBookingRequest,
  } = useCoachStore();

  if (!coach) {
    return (
      <View className="flex-1 bg-white items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text className="text-lg mt-4" style={{ color: '#0B1220' }}>
          Loading coach information...
        </Text>
      </View>
    );
  }

  const handleBookingRequest = async (request: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const fullRequest: BookingRequest = {
        ...request,
        id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      // Save to local store first (for immediate UI feedback)
      addBookingRequest(fullRequest);
      
      // Save directly to Supabase (works for unauthenticated users via anon key)
      // This allows public users (QR code/link) to create booking requests
      try {
        const result = await saveBookingRequestToSupabase(fullRequest);
        if (!result.success) {
          // Log error but don't break the UI - request is saved locally
          // It will sync when coach logs in, or user can try again
          if (__DEV__) {
            console.warn('Failed to save booking request to Supabase:', result.error);
          }
        }
      } catch (supabaseError) {
        // Supabase save failed, but don't break the user experience
        // Request is saved locally and will sync when coach logs in
        if (__DEV__) {
          console.warn('Supabase save error (non-critical):', supabaseError);
        }
      }
    } catch (error) {
      console.error('Failed to create booking request:', error);
      throw error; // Re-throw so the UI can handle it
    }
  };

  return (
    <PublicBookingScreen
      coach={coach}
      availabilityRanges={availabilityRanges}
      blackoutDates={blackoutDates}
      lessons={lessons}
      areas={areas}
      facilities={facilities}
      courts={courts}
      formatLocationText={formatLocationText}
      generateSlotsForNext14Days={generateSlotsForNext14Days}
      onBookingRequest={handleBookingRequest}
    />
  );
}