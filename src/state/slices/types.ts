/*
The store is the sum of small slices, one per domain (see ./index.ts). A slice
is a function that returns its own data and actions; it can read and write
other slices' data through set/get, but each file owns one area.
*/
import type { StateCreator } from 'zustand';

import type { AvailabilitySlice } from './availabilitySlice';
import type { BookingRequestsSlice } from './bookingRequestsSlice';
import type { GroupLessonsSlice } from './groupLessonsSlice';
import type { LessonPaymentsSlice } from './lessonPaymentsSlice';
import type { LessonsSlice } from './lessonsSlice';
import type { LocalModeSlice } from './localModeSlice';
import type { LocationsSlice } from './locationsSlice';
import type { NotesSlice } from './notesSlice';
import type { SessionSlice } from './sessionSlice';
import type { StudentsSlice } from './studentsSlice';

export type CoachState = SessionSlice &
  StudentsSlice &
  NotesSlice &
  LessonsSlice &
  GroupLessonsSlice &
  LessonPaymentsSlice &
  BookingRequestsSlice &
  LocationsSlice &
  AvailabilitySlice &
  LocalModeSlice;

// The store is wrapped in persist (src/state/coachStore.ts), hence the mutator.
export type SliceCreator<T> = StateCreator<CoachState, [['zustand/persist', unknown]], [], T>;
