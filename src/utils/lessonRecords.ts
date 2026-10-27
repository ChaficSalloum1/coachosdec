/*
Pure builders for lesson and student records, shared by every place that
creates a lesson (manual, group, approved booking request). Keeping them here
means the store slices only decide *when* to create, not *what* a lesson is.
*/
import { addMinutesToTime } from './timeFormat';
import type { Coach, Lesson, Student } from '../types/coach';
import {
  generatePaymentReferenceCode,
  getDefaultPaymentMethod,
  normalizePaymentSettings,
  normalizePaymentStatus,
} from '../modules/payments';

// A student's running totals after one more lesson is booked for them.
export const withNewLessonTotals = (student: Student, price: number, date: string): Student => ({
  ...student,
  totalLessons: student.totalLessons + 1,
  totalSpent: student.totalSpent + price,
  balance: student.balance + price,
  lastLessonDate: date,
});

// Fills in the payment fields a new lesson needs from the coach's settings.
export const withInitialPaymentFields = (lesson: Lesson, coach: Coach): Lesson => {
  const paymentSettings = normalizePaymentSettings(coach.paymentSettings);
  return {
    ...lesson,
    paymentStatus: normalizePaymentStatus(lesson.paymentStatus, lesson.isPaid),
    paymentMethodRequested:
      lesson.paymentMethodRequested ?? getDefaultPaymentMethod(paymentSettings.paymentPreference, paymentSettings),
    paymentReferenceCode: lesson.paymentReferenceCode ?? generatePaymentReferenceCode(coach.name, lesson.id),
    paidConfirmedAt: lesson.isPaid && !lesson.paidConfirmedAt ? new Date().toISOString() : lesson.paidConfirmedAt,
  };
};

export interface NewLessonInput {
  id: string;
  coach: Coach;
  studentId: string;
  studentName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  duration: number;
  price: number;
  notes?: string;
  areaId?: string;
  facilityId?: string;
  courtId?: string;
  seriesId?: string;
  createdAt?: string;
}

// A new scheduled, unpaid one-to-one lesson with its payment fields filled in.
export function buildScheduledLesson(input: NewLessonInput): Lesson {
  return withInitialPaymentFields(
    {
      id: input.id,
      coachId: input.coach.id,
      studentId: input.studentId,
      studentName: input.studentName,
      date: input.date,
      startTime: input.startTime,
      endTime: addMinutesToTime(input.startTime, input.duration),
      duration: input.duration,
      price: input.price,
      isPaid: false,
      status: 'scheduled',
      notes: input.notes,
      createdAt: input.createdAt ?? new Date().toISOString(),
      areaId: input.areaId,
      facilityId: input.facilityId,
      courtId: input.courtId,
      ...(input.seriesId ? { seriesId: input.seriesId } : {}),
    },
    input.coach
  );
}
