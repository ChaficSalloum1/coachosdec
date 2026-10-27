import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Area } from '../../types/coach';
import { isUuid } from '../../utils/ids';
import type { SliceCreator } from './types';
import { emptyData } from './emptyData';

// Only used without a backend (local-only mode), where data may predate the
// current format. Safe to call on every start.
export interface LocalModeSlice {
  migrateExistingData: () => Promise<void>;
}

const GENERAL_AREA_ID = '550e8400-e29b-41d4-a716-446655440009';

export const createLocalModeSlice: SliceCreator<LocalModeSlice> = (set, get) => ({
  migrateExistingData: async () => {
    const state = get();

    // Very old data used ids like "coach_1". Start fresh rather than carry them forward.
    if (state.coach?.id && !isUuid(state.coach.id)) {
      try {
        await AsyncStorage.clear();
      } catch (error) {
        if (__DEV__) {
          console.warn('⚠️ Could not clear AsyncStorage:', error);
        }
      }
      set({ coach: null, ...emptyData() });
      return; // the mock-data loader repopulates
    }

    if (state.areas.length === 0 && state.coach) {
      const generalArea: Area = { id: GENERAL_AREA_ID, coachId: state.coach.id, name: 'General' };
      set((s) => ({ areas: [generalArea, ...s.areas] }));
    }

    // Give anything saved before locations existed the default area.
    if (state.coach?.availability) {
      const availability = { ...state.coach.availability };
      Object.keys(availability).forEach((day) => {
        availability[day] = availability[day].map((slot) => ({ ...slot, areaId: slot.areaId || GENERAL_AREA_ID }));
      });
      set((s) => (s.coach ? { coach: { ...s.coach, availability } } : {}));
    }
    set((s) => ({ lessons: s.lessons.map((l) => ({ ...l, areaId: l.areaId || GENERAL_AREA_ID })) }));
    set((s) => ({ bookingRequests: s.bookingRequests.map((r) => ({ ...r, areaId: r.areaId || GENERAL_AREA_ID })) }));
  },
});
