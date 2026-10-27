/*
Every table the app syncs, in one place. The order matters: a row must reach
the server after the rows it points to (a lesson after its court and student),
so places come first, then people, then what refers to them.
*/
import {
  deleteFromSupabase,
  saveAreaToSupabase,
  saveAvailabilityRangeToSupabase,
  saveBlackoutDateToSupabase,
  saveBookingRequestToSupabase,
  saveCoachToSupabase,
  saveCourtToSupabase,
  saveFacilityToSupabase,
  saveLessonToSupabase,
  saveStudentNoteToSupabase,
  saveStudentToSupabase,
} from './supabaseSync';
import type { SyncedEntity } from './syncTypes';

export const SYNCED_ENTITIES: SyncedEntity[] = [
  { kind: 'area', table: 'areas', storeKey: 'areas', versioned: false, syncDeletes: true, save: saveAreaToSupabase },
  { kind: 'facility', table: 'facilities', storeKey: 'facilities', versioned: false, syncDeletes: true, save: saveFacilityToSupabase },
  { kind: 'court', table: 'courts', storeKey: 'courts', versioned: false, syncDeletes: true, save: saveCourtToSupabase },
  { kind: 'student', table: 'students', storeKey: 'students', versioned: true, syncDeletes: true, save: saveStudentToSupabase },
  // Lessons are cancelled, never removed, so there is nothing to delete remotely.
  { kind: 'lesson', table: 'lessons', storeKey: 'lessons', versioned: true, syncDeletes: false, save: saveLessonToSupabase },
  { kind: 'bookingRequest', table: 'booking_requests', storeKey: 'bookingRequests', versioned: true, syncDeletes: false, save: saveBookingRequestToSupabase },
  { kind: 'studentNote', table: 'student_notes', storeKey: 'studentNotes', versioned: true, syncDeletes: true, save: saveStudentNoteToSupabase },
  { kind: 'availabilityRange', table: 'availability_ranges', storeKey: 'availabilityRanges', versioned: false, syncDeletes: true, save: saveAvailabilityRangeToSupabase },
  { kind: 'blackoutDate', table: 'blackout_dates', storeKey: 'blackoutDates', versioned: false, syncDeletes: true, save: saveBlackoutDateToSupabase },
];

// The coach profile is saved by its own effect, but queued writes for it replay through here too.
const COACH_ENTITY: SyncedEntity = {
  kind: 'coach',
  table: 'coaches',
  versioned: true,
  syncDeletes: false,
  save: saveCoachToSupabase,
};

export const entityForKind = (kind: SyncedEntity['kind']): SyncedEntity => {
  const entity = kind === 'coach' ? COACH_ENTITY : SYNCED_ENTITIES.find((e) => e.kind === kind);
  if (!entity) throw new Error(`No sync entry for ${kind}`);
  return entity;
};

export { deleteFromSupabase };
