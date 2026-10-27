import { v4 as uuidv4 } from 'uuid';

import { GROUPS } from '../../config/appSettings';
import { buildGroupLessons, buildGroupMemberLesson, summarizeGroup } from '../../utils/groupLessons';
import { addMinutesToTime } from '../../utils/timeFormat';
import { futureSeriesLessons } from '../../utils/lessonSeries';
import { withInitialPaymentFields, withNewLessonTotals } from '../../utils/lessonRecords';
import type { SliceCreator } from './types';

export interface NewGroupLessonParams {
  studentIds: string[];
  date: string;
  startTime: string;
  duration: number;
  pricePerPlayer: number;
  capacity?: number;
  areaId?: string;
  facilityId?: string;
  courtId?: string;
  seriesId?: string;
}

// Group lessons: one linked lesson per player. The create/add actions throw an
// Error with a coach-readable message when the request is invalid (group full, etc).
export interface GroupLessonsSlice {
  createGroupLesson: (params: NewGroupLessonParams) => string; // returns the new groupId
  addToGroupLesson: (groupId: string, studentId: string) => void;
  removeFromGroupLesson: (groupId: string, studentId: string) => Promise<void>;
  cancelGroupLesson: (groupId: string) => Promise<void>;
  // Cancels this lesson and every later active lesson in its series; returns how many were cancelled.
  cancelSeriesFrom: (lessonId: string) => Promise<number>;
}

export const createGroupLessonsSlice: SliceCreator<GroupLessonsSlice> = (set, get) => ({
  createGroupLesson: (params) => {
    const state = get();
    const coach = state.coach;
    if (!coach) throw new Error('Coach profile not available');

    const players = params.studentIds.map((id) => {
      const student = state.students.find((s) => s.id === id);
      if (!student) throw new Error('One of the selected students was not found.');
      return { id: student.id, name: student.name };
    });

    const groupId = uuidv4();
    const lessons = buildGroupLessons({
      groupId,
      template: {
        coachId: coach.id,
        date: params.date,
        startTime: params.startTime,
        endTime: addMinutesToTime(params.startTime, params.duration),
        duration: params.duration,
        pricePerPlayer: params.pricePerPlayer,
        capacity: params.capacity ?? GROUPS.defaultCapacity,
        areaId: params.areaId,
        facilityId: params.facilityId,
        courtId: params.courtId,
        seriesId: params.seriesId,
      },
      players,
      now: new Date().toISOString(),
      newId: uuidv4,
    }).map((lesson) => withInitialPaymentFields(lesson, coach));

    set((s) => ({
      lessons: [...lessons, ...s.lessons],
      students: s.students.map((student) =>
        lessons.some((l) => l.studentId === student.id)
          ? withNewLessonTotals(student, params.pricePerPlayer, params.date)
          : student
      ),
    }));
    return groupId;
  },

  addToGroupLesson: (groupId, studentId) => {
    const state = get();
    const coach = state.coach;
    if (!coach) throw new Error('Coach profile not available');

    const group = summarizeGroup(state.lessons, groupId);
    if (!group) throw new Error('This group no longer exists.');
    const student = state.students.find((s) => s.id === studentId);
    if (!student) throw new Error('Student not found.');

    const lesson = withInitialPaymentFields(
      buildGroupMemberLesson({
        group,
        coachId: coach.id,
        duration: group.lessons[0].duration,
        player: { id: student.id, name: student.name },
        now: new Date().toISOString(),
        newId: uuidv4,
      }),
      coach
    );

    set((s) => ({
      lessons: [lesson, ...s.lessons],
      students: s.students.map((st) => (st.id === studentId ? withNewLessonTotals(st, lesson.price, lesson.date) : st)),
    }));
  },

  // Cancels that player's lesson with the normal cancel logic (calendar event,
  // student totals), which frees their spot in the group.
  removeFromGroupLesson: async (groupId, studentId) => {
    const lesson = get().lessons.find(
      (l) => l.groupId === groupId && l.studentId === studentId && l.status !== 'cancelled'
    );
    if (!lesson) throw new Error('That player is not in this group.');
    await get().cancelLesson(lesson.id);
  },

  cancelGroupLesson: async (groupId) => {
    const active = get().lessons.filter((l) => l.groupId === groupId && l.status !== 'cancelled');
    for (const lesson of active) {
      await get().cancelLesson(lesson.id);
    }
  },

  cancelSeriesFrom: async (lessonId) => {
    const lesson = get().lessons.find((l) => l.id === lessonId);
    if (!lesson) return 0;
    const toCancel = lesson.seriesId ? futureSeriesLessons(get().lessons, lesson) : [lesson];
    for (const l of toCancel) {
      await get().cancelLesson(l.id);
    }
    return toCancel.length;
  },
});
