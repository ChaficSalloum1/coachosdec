/*
Business and behaviour constants in one place. Nothing here depends on React
Native, so the mobile app, the pure logic modules and the web booking page all
import the same values. Change a number here, not in a component.
*/

export const SCHEDULING = {
  defaultLessonMinutes: 60,
  lessonLengthOptions: [30, 45, 60, 90, 120],
  slotStepMinutes: 30, // spacing of suggested start times
  suggestedTimesLimit: 8, // free-time chips shown in Add Lesson
  // Used only when a coach has set no availability at all.
  fallbackDayWindow: { start: '08:00', end: '21:00' },
  repeatWeeklyOptions: [4, 8, 12], // lessons in total, one per week
  defaultRepeatWeeks: 8,
  datePillDays: 14, // day chips shown in Add Lesson
  recentStudentsShown: 6,
  searchStudentsAfter: 6, // show the student search box above this many students
} as const;

export const GROUPS = {
  defaultCapacity: 4, // padel is almost always doubles
  minCapacity: 2,
  maxCapacity: 12,
} as const;

// The limits below are also enforced by submit_public_booking_request in
// Supabase (supabase-schema.sql); keep both in step.
export const PUBLIC_BOOKING = {
  windowDays: 14,
  lessonMinutes: 60,
  maxNameLength: 80,
  maxContactLength: 120,
  maxNoteLength: 500,
  maxSlotsShownPerDay: 48,
} as const;

export const SYNC = {
  debounceMs: 2000, // batch local edits before uploading
  coachSaveDebounceMs: 1000, // wait after a profile edit before saving it
  retryIntervalMs: 30_000, // how often the offline queue retries
  stuckAfterAttempts: 3, // failures before a change is reported as a sync problem
} as const;

export const UI_TIMING = {
  toastVisibleMs: 3000,
  copiedFlashMs: 2000,
  undoWindowMs: 3000,
  authStartupTimeoutMs: 3000,
} as const;

export const DAY_PAGER = {
  windowSize: 61, // days kept swipeable: 30 either side of today
  centerIndex: 30, // today's page
} as const;
