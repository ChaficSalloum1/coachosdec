/**
 * Centralized time conflict validation service
 * Single source of truth for all time overlap and conflict checking
 */

import { Lesson, AvailabilityRange, BookingRequest } from '../types/coach';
import { parseTime } from '../utils/timeFormat';

export interface TimeRange {
  startTime: string;
  endTime: string;
  date: string;
}

export interface ConflictValidationResult {
  hasConflict: boolean;
  conflictingItem?: Lesson | AvailabilityRange | BookingRequest;
  message?: string;
}

export class TimeConflictValidator {
  /**
   * Check if two time ranges overlap
   * Handles midnight crossing cases
   */
  static hasTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    // Convert to Date objects for comparison
    const start1Date = this.timeToDate(start1);
    const end1Date = this.timeToDate(end1);
    const start2Date = this.timeToDate(start2);
    const end2Date = this.timeToDate(end2);

    // Check if either range crosses midnight
    const range1CrossesMidnight = end1Date < start1Date;
    const range2CrossesMidnight = end2Date < start2Date;

    if (range1CrossesMidnight || range2CrossesMidnight) {
      // Complex midnight crossing logic
      // Overlap exists if NOT (range1 ends before range2 starts OR range1 starts after range2 ends)
      return !(end1Date <= start2Date || start1Date >= end2Date);
    }

    // Standard overlap check: start1 < end2 AND end1 > start2
    return start1Date < end2Date && end1Date > start2Date;
  }

  /**
   * Check if a booking conflicts with existing lessons
   */
  static validateBookingAgainstLessons(
    requestDate: string,
    requestStartTime: string,
    requestEndTime: string,
    lessons: Lesson[]
  ): ConflictValidationResult {
    const conflictingLesson = lessons.find((lesson) => {
      // Skip cancelled lessons and different dates
      if (lesson.status === 'cancelled' || lesson.date !== requestDate) {
        return false;
      }

      // Validate lesson times
      try {
        parseTime(lesson.startTime);
        parseTime(lesson.endTime);
      } catch (error) {
        if (__DEV__) {
          console.warn('Invalid lesson time format:', lesson);
        }
        return false;
      }

      return this.hasTimeOverlap(
        requestStartTime,
        requestEndTime,
        lesson.startTime,
        lesson.endTime
      );
    });

    if (conflictingLesson) {
      return {
        hasConflict: true,
        conflictingItem: conflictingLesson,
        message: `Time conflict: You already have a lesson with ${conflictingLesson.studentName} scheduled at this time.`,
      };
    }

    return { hasConflict: false };
  }

  /**
   * Check if availability range overlaps with existing ranges
   */
  static validateAvailabilityRange(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    existingRanges: AvailabilityRange[],
    excludeRangeId?: string
  ): ConflictValidationResult {
    const conflictingRange = existingRanges.find((range) => {
      // Skip if it's the same range being edited
      if (excludeRangeId && range.id === excludeRangeId) {
        return false;
      }

      // Only check ranges for the same day
      if (range.dayOfWeek !== dayOfWeek) {
        return false;
      }

      return this.hasTimeOverlap(startTime, endTime, range.startTime, range.endTime);
    });

    if (conflictingRange) {
      return {
        hasConflict: true,
        conflictingItem: conflictingRange,
        message:
          'You already have availability set for this day and time. You can only be in one place at a time.',
      };
    }

    return { hasConflict: false };
  }

  /**
   * Check for concurrent pending booking requests
   */
  static validateAgainstPendingRequests(
    requestId: string,
    requestDate: string,
    requestTime: string,
    bookingRequests: BookingRequest[]
  ): ConflictValidationResult {
    const conflictingRequest = bookingRequests.find(
      (r) =>
        r.id !== requestId &&
        r.status === 'pending' &&
        r.requestedDate === requestDate &&
        r.requestedTime === requestTime
    );

    if (conflictingRequest) {
      return {
        hasConflict: true,
        conflictingItem: conflictingRequest,
        message:
          'Another booking request exists for this time slot. Please refresh and try again.',
      };
    }

    return { hasConflict: false };
  }

  /**
   * Validate a complete booking request
   */
  static validateBooking(
    requestId: string,
    requestDate: string,
    requestStartTime: string,
    duration: number,
    lessons: Lesson[],
    bookingRequests: BookingRequest[]
  ): ConflictValidationResult {
    // Calculate end time
    const endTime = this.addMinutesToTime(requestStartTime, duration);

    // Check against existing lessons
    const lessonConflict = this.validateBookingAgainstLessons(
      requestDate,
      requestStartTime,
      endTime,
      lessons
    );

    if (lessonConflict.hasConflict) {
      return lessonConflict;
    }

    // Check against pending requests (race condition prevention)
    const requestConflict = this.validateAgainstPendingRequests(
      requestId,
      requestDate,
      requestStartTime,
      bookingRequests
    );

    return requestConflict;
  }

  /**
   * Helper: Convert time string to Date object
   */
  private static timeToDate(time: string): Date {
    const { hours, minutes } = parseTime(time);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Helper: Add minutes to time string
   */
  private static addMinutesToTime(time: string, minutes: number): string {
    const date = this.timeToDate(time);
    date.setMinutes(date.getMinutes() + minutes);
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }

  /**
   * Check if a date is a blackout date
   */
  static isBlackoutDate(date: string, blackoutDates: string[]): boolean {
    return blackoutDates.includes(date);
  }

  /**
   * Get all conflicts for a given time range
   */
  static getAllConflicts(
    date: string,
    startTime: string,
    endTime: string,
    lessons: Lesson[]
  ): Lesson[] {
    return lessons.filter((lesson) => {
      if (lesson.status === 'cancelled' || lesson.date !== date) {
        return false;
      }

      return this.hasTimeOverlap(startTime, endTime, lesson.startTime, lesson.endTime);
    });
  }
}
