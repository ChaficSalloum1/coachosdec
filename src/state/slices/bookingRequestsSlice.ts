import { v4 as uuidv4 } from 'uuid';

import type { BookingRequest } from '../../types/coach';
import { getApprovalBlocker, resolveRequestStudent } from '../../utils/bookingApproval';
import { buildScheduledLesson, withNewLessonTotals } from '../../utils/lessonRecords';
import { normalizeClockTime } from '../../utils/timeFormat';
import { getCalendarService } from '../calendarBridge';
import type { SliceCreator } from './types';

export interface BookingRequestsSlice {
  bookingRequests: BookingRequest[];
  addBookingRequest: (request: BookingRequest) => void;
  // Turns a pending request into a lesson (creating the student if new). Throws a coach-readable Error if it cannot.
  approveBookingRequest: (requestId: string) => Promise<void>;
  declineBookingRequest: (requestId: string) => void;
  getPendingRequests: () => BookingRequest[];
}

export const createBookingRequestsSlice: SliceCreator<BookingRequestsSlice> = (set, get) => ({
  bookingRequests: [],

  addBookingRequest: (request) =>
    set((state) => {
      if (!request.coachId || !request.studentName || !request.studentContact || !request.requestedDate || !request.requestedTime) {
        throw new Error('Missing required booking information');
      }
      if (!request.id) {
        throw new Error('Booking request must have an ID');
      }
      return { bookingRequests: [request, ...state.bookingRequests] };
    }),

  approveBookingRequest: async (requestId) => {
    const state = get();
    const request = state.bookingRequests.find((r) => r.id === requestId);
    if (!request) throw new Error('Booking request not found');
    const coach = state.coach;
    if (!coach) throw new Error('Coach profile not available');
    if (request.status !== 'pending') throw new Error('Request has already been processed');

    const blocker = getApprovalBlocker({ request, lessons: state.lessons, requests: state.bookingRequests });
    if (blocker) throw new Error(blocker);

    const { student: found, isNew } = resolveRequestStudent(state.students, request, uuidv4, new Date().toISOString());

    const lesson = buildScheduledLesson({
      id: uuidv4(),
      coach,
      studentId: found.id,
      studentName: request.studentName,
      date: request.requestedDate,
      startTime: String(normalizeClockTime(request.requestedTime)),
      duration: request.duration,
      price: (request.duration / 60) * coach.pricePerHour,
      notes: request.note,
      areaId: request.areaId,
      facilityId: request.facilityId,
      courtId: request.courtId,
    });

    // Sync to the device calendar if enabled; a calendar failure never fails the booking.
    if (coach.calendarSyncEnabled) {
      try {
        const CalendarService = await getCalendarService();
        const calendarEventId = await CalendarService?.createLessonEvent(lesson, coach.paymentSettings?.currency);
        if (calendarEventId) lesson.calendarEventId = calendarEventId;
      } catch (error) {
        if (__DEV__) {
          console.warn('📅 Failed to sync lesson to calendar:', error);
        }
      }
    }

    const student = withNewLessonTotals(found, lesson.price, request.requestedDate);

    // Apply to the latest state: the calendar call above may have taken a moment.
    set((s) => ({
      bookingRequests: s.bookingRequests.map((r) => (r.id === requestId ? { ...r, status: 'approved' as const } : r)),
      lessons: [lesson, ...s.lessons],
      students: isNew ? [student, ...s.students] : s.students.map((st) => (st.id === student.id ? student : st)),
    }));
  },

  declineBookingRequest: (requestId) =>
    set((state) => ({
      bookingRequests: state.bookingRequests.map((r) => (r.id === requestId ? { ...r, status: 'declined' as const } : r)),
    })),

  getPendingRequests: () =>
    get()
      .bookingRequests.filter((r) => r.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
});
