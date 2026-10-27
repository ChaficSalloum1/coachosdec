import type { StateCreator } from 'zustand';

import { createAvailabilitySlice } from './availabilitySlice';
import { createBookingRequestsSlice } from './bookingRequestsSlice';
import { createGroupLessonsSlice } from './groupLessonsSlice';
import { createLessonPaymentsSlice } from './lessonPaymentsSlice';
import { createLessonsSlice } from './lessonsSlice';
import { createLocalModeSlice } from './localModeSlice';
import { createLocationsSlice } from './locationsSlice';
import { createNotesSlice } from './notesSlice';
import { createSessionSlice } from './sessionSlice';
import { createStudentsSlice } from './studentsSlice';
import type { CoachState } from './types';

export type { CoachState } from './types';

// The whole store, assembled from one slice per domain. coachStore.ts wraps
// this in persistence; tests use it directly.
export const createCoachState: StateCreator<CoachState, [['zustand/persist', unknown]], [], CoachState> = (...args) => ({
  ...createSessionSlice(...args),
  ...createStudentsSlice(...args),
  ...createNotesSlice(...args),
  ...createLessonsSlice(...args),
  ...createGroupLessonsSlice(...args),
  ...createLessonPaymentsSlice(...args),
  ...createBookingRequestsSlice(...args),
  ...createLocationsSlice(...args),
  ...createAvailabilitySlice(...args),
  ...createLocalModeSlice(...args),
});
