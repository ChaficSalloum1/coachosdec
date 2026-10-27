import type { CoachState } from './types';

type DataKeys =
  | 'bookingRequests'
  | 'lessons'
  | 'students'
  | 'studentNotes'
  | 'areas'
  | 'facilities'
  | 'courts'
  | 'availabilityRanges'
  | 'blackoutDates';

// Every list the store holds, empty. A function so each caller gets fresh arrays.
export const emptyData = (): Pick<CoachState, DataKeys> => ({
  bookingRequests: [],
  lessons: [],
  students: [],
  studentNotes: [],
  areas: [],
  facilities: [],
  courts: [],
  availabilityRanges: [],
  blackoutDates: [],
});
