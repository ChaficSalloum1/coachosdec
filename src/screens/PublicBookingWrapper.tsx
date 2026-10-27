import React from 'react';
import { PublicBookingScreen } from './PublicBookingScreen';
import { useCoachStore } from '../state/coachStore';
import { BookingRequest } from '../types/coach';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveBookingRequestToSupabase } from '../services/supabaseSync';
import { isSupabaseConfigured } from '../utils/supabaseConfig';
import { v4 as uuidv4 } from 'uuid';
import { DesignTokens } from '../utils/designTokens';
import { t } from '../i18n';

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
    getOpenSlots,
    addBookingRequest,
    isDemoMode,
  } = useCoachStore();

  if (!coach) {
    return (
      <View className="flex-1 bg-white items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={DesignTokens.colors.brand.default} />
        <Text className="text-lg mt-4" style={{ color: DesignTokens.colors.text.strong }}>
          {t('booking.loadingCoach')}
        </Text>
      </View>
    );
  }

  const handleBookingRequest = async (request: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const fullRequest: BookingRequest = {
        ...request,
        id: uuidv4(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      if (isSupabaseConfigured() && !isDemoMode) {
        // Public booking links must reach Supabase so the coach can receive them.
        const result = await saveBookingRequestToSupabase(fullRequest);
        if (!result.success) {
          throw new Error(result.error || t('errors.bookingSubmitFailed'));
        }
      }

      // Save to local store after remote acceptance, or as the development
      // fallback when Supabase is intentionally not configured.
      addBookingRequest(fullRequest);
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
      getOpenSlots={getOpenSlots}
      onBookingRequest={handleBookingRequest}
    />
  );
}
