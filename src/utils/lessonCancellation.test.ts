import { describe, expect, it } from 'vitest';

import { applyLessonCancellation } from './lessonCancellation';
import type { Lesson, Student } from '../types/coach';

const lesson = (over: Partial<Lesson>): Lesson =>
  ({
    id: 'l1', coachId: 'c', studentId: 's1', studentName: 'Ana', date: '2026-11-02',
    startTime: '10:00', endTime: '11:00', duration: 60, price: 40, isPaid: false,
    status: 'scheduled', createdAt: '', ...over,
  }) as Lesson;

const student = (over: Partial<Student> = {}): Student =>
  ({ id: 's1', coachId: 'c', name: 'Ana', contact: '1', totalLessons: 3, totalSpent: 120, balance: 80, createdAt: '', ...over }) as Student;

describe('applyLessonCancellation', () => {
  it('marks the lesson cancelled and lowers the student\'s totals and balance', () => {
    const result = applyLessonCancellation({ lessons: [lesson({})], students: [student()] }, 'l1')!;
    expect(result.lessons[0].status).toBe('cancelled');
    expect(result.students[0]).toMatchObject({ totalLessons: 2, totalSpent: 80, balance: 40 });
  });

  it('leaves the balance alone for a paid lesson', () => {
    const result = applyLessonCancellation({ lessons: [lesson({ isPaid: true })], students: [student()] }, 'l1')!;
    expect(result.students[0]).toMatchObject({ totalLessons: 2, totalSpent: 80, balance: 80 });
  });

  it('never lets totals go negative', () => {
    const result = applyLessonCancellation(
      { lessons: [lesson({ price: 500 })], students: [student({ totalLessons: 0, totalSpent: 10, balance: 10 })] },
      'l1'
    )!;
    expect(result.students[0]).toMatchObject({ totalLessons: 0, totalSpent: 0, balance: 0 });
  });

  it('sets last lesson date to their latest completed lesson, or none', () => {
    const lessons = [lesson({}), lesson({ id: 'l2', date: '2026-10-20', status: 'completed' }), lesson({ id: 'l3', date: '2026-10-10', status: 'completed' })];
    expect(applyLessonCancellation({ lessons, students: [student()] }, 'l1')!.students[0].lastLessonDate).toBe('2026-10-20');
    expect(applyLessonCancellation({ lessons: [lesson({})], students: [student()] }, 'l1')!.students[0].lastLessonDate).toBeUndefined();
  });

  it('still cancels when the student record is gone', () => {
    const result = applyLessonCancellation({ lessons: [lesson({})], students: [] }, 'l1')!;
    expect(result.lessons[0].status).toBe('cancelled');
    expect(result.students).toEqual([]);
  });

  it('does nothing for an unknown or already cancelled lesson', () => {
    expect(applyLessonCancellation({ lessons: [lesson({})], students: [student()] }, 'nope')).toBeNull();
    expect(applyLessonCancellation({ lessons: [lesson({ status: 'cancelled' })], students: [student()] }, 'l1')).toBeNull();
  });
});
