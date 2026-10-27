import { v4 as uuidv4 } from 'uuid';

import type { Lesson } from '../../types/coach';
import { applyLessonCancellation } from '../../utils/lessonCancellation';
import { completePastLessons } from '../../utils/lessonMaintenance';
import { buildScheduledLesson, withInitialPaymentFields, withNewLessonTotals } from '../../utils/lessonRecords';
import { getCalendarService } from '../calendarBridge';
import type { SliceCreator } from './types';

export interface NewLessonParams {
  studentId: string;
  studentName: string;
  date: string;
  startTime: string;
  duration: number;
  price: number;
  areaId?: string;
  facilityId?: string;
  courtId?: string;
  seriesId?: string;
}

export interface LessonsSlice {
  lessons: Lesson[];
  addLesson: (lesson: Lesson) => void;
  createLesson: (params: NewLessonParams) => void;
  cancelLesson: (lessonId: string) => Promise<void>;
  getStudentLessons: (studentId: string) => Lesson[];
  // Marks lessons that have ended as completed (run at start-up).
  autoCompletePastLessons: () => void;
}

export const createLessonsSlice: SliceCreator<LessonsSlice> = (set, get) => ({
  lessons: [],

  addLesson: (lesson) =>
    set((state) => ({
      lessons: [state.coach ? withInitialPaymentFields(lesson, state.coach) : lesson, ...state.lessons],
    })),

  createLesson: (params) =>
    set((state) => {
      if (!state.coach) return state;
      const lesson = buildScheduledLesson({ id: uuidv4(), coach: state.coach, ...params });
      return {
        lessons: [lesson, ...state.lessons],
        students: state.students.map((s) =>
          s.id === params.studentId ? withNewLessonTotals(s, params.price, params.date) : s
        ),
      };
    }),

  cancelLesson: async (lessonId) => {
    const lesson = get().lessons.find((l) => l.id === lessonId);
    if (!lesson || lesson.status === 'cancelled') return;

    // Remove the device calendar event first; a failure here must not block the cancellation.
    if (lesson.calendarEventId && get().coach?.calendarSyncEnabled) {
      try {
        const CalendarService = await getCalendarService();
        await CalendarService?.deleteLessonEvent(lesson.calendarEventId);
      } catch (error) {
        if (__DEV__) {
          console.warn('📅 Failed to delete calendar event:', error);
        }
      }
    }

    // Apply to the latest state: anything may have changed while the calendar call was pending.
    set((state) => applyLessonCancellation(state, lessonId) ?? state);
  },

  autoCompletePastLessons: () => set((state) => completePastLessons(state, new Date()) ?? state),

  getStudentLessons: (studentId) =>
    get()
      .lessons.filter((l) => l.studentId === studentId)
      .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)),
});
