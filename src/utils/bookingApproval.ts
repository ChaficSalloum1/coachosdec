/*
Rules for turning a student's booking request into a lesson: is it valid, is
the time still free, and which student is it for. Pure so the store slice only
orchestrates.
*/
import { findConflicts } from './lessonScheduling';
import { normalizeClockTime } from './timeFormat';
import type { BookingRequest, Lesson, Student } from '../types/coach';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

// A coach-readable reason the request cannot be approved, or null if it can.
export function getApprovalBlocker(args: {
  request: BookingRequest;
  lessons: Lesson[];
  requests: BookingRequest[];
}): string | null {
  const { request, lessons, requests } = args;
  const time = String(normalizeClockTime(request.requestedTime));

  if (!DATE_PATTERN.test(request.requestedDate) || !TIME_PATTERN.test(time)) {
    return `Invalid date or time format: ${request.requestedDate} ${request.requestedTime}`;
  }

  // Two pending requests for the same slot: the coach must settle it first.
  const samePending = requests.find(
    (r) =>
      r.id !== request.id &&
      r.status === 'pending' &&
      r.requestedDate === request.requestedDate &&
      normalizeClockTime(r.requestedTime) === time
  );
  if (samePending) {
    return 'Another booking request exists for this time slot. Please refresh and try again.';
  }

  const clash = findConflicts({
    date: request.requestedDate,
    startTime: time,
    durationMinutes: request.duration,
    lessons,
  })[0];
  if (clash) {
    return `Time conflict: You already have a lesson with ${clash.studentName} scheduled at this time.`;
  }

  return null;
}

// The student a request is for: matched by contact, else a new one to create.
export function resolveRequestStudent(
  students: Student[],
  request: BookingRequest,
  newId: () => string,
  now: string
): { student: Student; isNew: boolean } {
  const existing = students.find((s) => s.contact === request.studentContact);
  if (existing) return { student: existing, isNew: false };
  return {
    isNew: true,
    student: {
      id: newId(),
      coachId: request.coachId,
      name: request.studentName,
      contact: request.studentContact,
      totalLessons: 0,
      totalSpent: 0,
      balance: 0,
      createdAt: now,
      lastLessonDate: request.requestedDate,
    },
  };
}
