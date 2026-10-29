/*
What the store keeps on the phone, and how an older saved copy is upgraded.
Pure (the backend flag is passed in) so both can be tested without storage.

When a backend is configured the server is the source of truth for people and
lessons, so those lists are not written to the phone; locations and
availability still are. Without a backend (or in demo mode) everything is kept
locally.
*/
import { normalizePaymentSettings, normalizePaymentStatus } from '../modules/payments';
import type { Coach, Lesson } from '../types/coach';
import { withInitialPaymentFields } from '../utils/lessonRecords';

export const PERSIST_NAME = 'coach-storage';
export const PERSIST_VERSION = 4;

// A coach row can carry empty payment settings (older profiles); never crash the save over it.
const slimPaymentSettings = (settings: Coach['paymentSettings'] | null | undefined) => ({
  cashEnabled: settings?.cashEnabled ?? true,
  paymentPreference: settings?.paymentPreference ?? 'CASH',
  currency: settings?.currency,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migratePersistedState(persisted: any, syncEnabled: boolean): any {
  if (!persisted) return persisted;

  const coach = persisted.coach
    ? { ...persisted.coach, paymentSettings: normalizePaymentSettings(persisted.coach.paymentSettings) }
    : null;

  const lessons = Array.isArray(persisted.lessons)
    ? persisted.lessons.map((lesson: Lesson) =>
        coach
          ? withInitialPaymentFields(lesson, coach)
          : { ...lesson, paymentStatus: normalizePaymentStatus(lesson.paymentStatus, lesson.isPaid) }
      )
    : [];

  const isDemoMode = persisted.isDemoMode === true;
  if (isDemoMode || !syncEnabled) {
    return { ...persisted, isDemoMode, coach, lessons };
  }

  // With a backend the server copy is reloaded on launch.
  return {
    ...persisted,
    isDemoMode: false,
    coach: coach
      ? {
          ...coach,
          paymentSettings: {
            cashEnabled: coach.paymentSettings?.cashEnabled ?? true,
            paymentPreference: coach.paymentSettings?.paymentPreference ?? 'CASH',
            currency: coach.paymentSettings?.currency,
          },
        }
      : null,
    bookingRequests: [],
    lessons: [],
    students: [],
    studentNotes: [],
  };
}

interface PersistableState {
  isDemoMode: boolean;
  coach: Coach | null;
  bookingRequests: unknown[];
  lessons: unknown[];
  students: unknown[];
  studentNotes: unknown[];
  areas: unknown[];
  facilities: unknown[];
  courts: unknown[];
  availabilityRanges: unknown[];
  blackoutDates: unknown[];
}

export function partializeState<S extends PersistableState>(state: S, syncEnabled: boolean) {
  const serverOwned = syncEnabled && !state.isDemoMode;
  return {
    isDemoMode: state.isDemoMode,
    coach:
      state.coach && serverOwned
        ? { ...state.coach, paymentSettings: slimPaymentSettings(state.coach.paymentSettings) }
        : state.coach,
    bookingRequests: serverOwned ? [] : state.bookingRequests,
    lessons: serverOwned ? [] : state.lessons,
    students: serverOwned ? [] : state.students,
    studentNotes: serverOwned ? [] : state.studentNotes,
    areas: state.areas,
    facilities: state.facilities,
    courts: state.courts,
    availabilityRanges: state.availabilityRanges,
    blackoutDates: state.blackoutDates,
  };
}
