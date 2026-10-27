import {
  cancelPaymentStatus,
  confirmPaidStatus,
  generatePaymentReferenceCode,
  normalizePaymentStatus,
  requestPaymentStatus,
  sendReminderStatus,
} from '../../modules/payments';
import type { SliceCreator } from './types';

// Payment state of a lesson: request, remind, confirm paid, or withdraw the request.
export interface LessonPaymentsSlice {
  requestLessonPayment: (lessonId: string) => void;
  sendLessonPaymentReminder: (lessonId: string) => void;
  cancelLessonPayment: (lessonId: string) => void;
  markLessonPaid: (lessonId: string) => void;
}

export const createLessonPaymentsSlice: SliceCreator<LessonPaymentsSlice> = (set) => ({
  requestLessonPayment: (lessonId) =>
    set((state) => {
      const now = new Date().toISOString();
      return {
        lessons: state.lessons.map((l) => {
          if (l.id !== lessonId || l.paymentStatus === 'PAID_CONFIRMED') return l;
          return {
            ...l,
            paymentStatus: requestPaymentStatus(normalizePaymentStatus(l.paymentStatus, l.isPaid)),
            paymentRequestedAt: l.paymentRequestedAt ?? now,
            paymentReferenceCode:
              l.paymentReferenceCode ?? (state.coach ? generatePaymentReferenceCode(state.coach.name, l.id) : l.id),
          };
        }),
      };
    }),

  sendLessonPaymentReminder: (lessonId) =>
    set((state) => {
      const now = new Date().toISOString();
      return {
        lessons: state.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const paymentStatus = sendReminderStatus(normalizePaymentStatus(l.paymentStatus, l.isPaid));
          return paymentStatus === l.paymentStatus ? l : { ...l, paymentStatus, lastReminderSentAt: now };
        }),
      };
    }),

  cancelLessonPayment: (lessonId) =>
    set((state) => {
      const lesson = state.lessons.find((l) => l.id === lessonId);
      if (!lesson) return state;
      return {
        lessons: state.lessons.map((l) =>
          l.id === lessonId ? { ...l, paymentStatus: cancelPaymentStatus(), isPaid: false } : l
        ),
        // A lesson that was paid becomes owed again.
        students: lesson.isPaid
          ? state.students.map((s) => (s.id === lesson.studentId ? { ...s, balance: s.balance + lesson.price } : s))
          : state.students,
      };
    }),

  markLessonPaid: (lessonId) =>
    set((state) => {
      const lesson = state.lessons.find((l) => l.id === lessonId);
      if (!lesson || lesson.isPaid) return state;
      return {
        lessons: state.lessons.map((l) =>
          l.id === lessonId
            ? { ...l, isPaid: true, paymentStatus: confirmPaidStatus(), paidConfirmedAt: new Date().toISOString() }
            : l
        ),
        students: state.students.map((s) =>
          s.id === lesson.studentId ? { ...s, balance: Math.max(0, s.balance - lesson.price) } : s
        ),
      };
    }),
});
