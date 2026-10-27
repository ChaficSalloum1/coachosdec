import type { Coach } from '../../types/coach';
import { isSupabaseConfigured } from '../../utils/supabaseConfig';
import { createDemoWorkspace } from '../../utils/demoWorkspace';
import { useOfflineQueueStore } from '../offlineQueueStore';
import { emptyData } from './emptyData';
import type { SliceCreator } from './types';

export interface SessionSlice {
  isDemoMode: boolean;
  // True once the initial load from Supabase (or the decision that there's
  // nothing to load, e.g. demo mode / no backend configured) has settled.
  // Resets to false on each app launch; screens use it to show a real
  // loading state instead of a fixed timer.
  isInitialSyncComplete: boolean;
  coach: Coach | null;

  enterDemoMode: () => void;
  exitDemoMode: () => void;
  setCoach: (coach: Coach | null) => void;
  updateCoach: (updates: Partial<Coach>) => void;
  clearAllData: () => void;
}

export const createSessionSlice: SliceCreator<SessionSlice> = (set) => ({
  isDemoMode: false,
  isInitialSyncComplete: false,
  coach: null,

  enterDemoMode: () => {
    const demo = createDemoWorkspace();
    set({
      isDemoMode: true,
      isInitialSyncComplete: true,
      coach: demo.coach,
      bookingRequests: demo.bookingRequests,
      lessons: demo.lessons,
      students: demo.students,
      studentNotes: demo.studentNotes,
      areas: demo.areas,
      facilities: demo.facilities,
      courts: demo.courts,
      availabilityRanges: demo.availabilityRanges,
      blackoutDates: demo.blackoutDates,
    });
  },

  exitDemoMode: () =>
    set({
      isDemoMode: false,
      isInitialSyncComplete: false,
      coach: null,
      ...emptyData(),
    }),

  setCoach: (coach) => set({ coach }),

  updateCoach: (updates) =>
    set((state) => ({
      coach: state.coach ? { ...state.coach, ...updates } : null,
    })),

  clearAllData: () => {
    // Queued writes belong to the account being cleared; replaying them
    // under a different login would fail forever and leak their data.
    useOfflineQueueStore.getState().clear();
    set({
      isDemoMode: false,
      // Re-arm the loading state for the next login (nothing to load if no backend).
      isInitialSyncComplete: !isSupabaseConfigured(),
      coach: null,
      ...emptyData(),
    });
  },
});
