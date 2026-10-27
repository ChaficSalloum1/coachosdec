import { describe, expect, it } from 'vitest';

import { checkDataIntegrity, completePastLessons, recalculateStudentTotals } from './lessonMaintenance';
import type { Lesson, Student } from '../types/coach';

const lesson = (over: Partial<Lesson>): Lesson =>
  ({
    id: 'l1', coachId: 'c', studentId: 's1', studentName: 'Ana', date: '2026-11-02',
    startTime: '10:00', endTime: '11:00', duration: 60, price: 40, isPaid: false,
    status: 'scheduled', createdAt: '', ...over,
  }) as Lesson;

const student = (over: Partial<Student> = {}): Student =>
  ({ id: 's1', coachId: 'c', name: 'Ana', contact: '1', totalLessons: 0, totalSpent: 0, balance: 0, createdAt: '', ...over }) as Student;

describe('completePastLessons', () => {
  const now = new Date('2026-11-02T12:00:00');

  it('completes lessons that have ended and moves the last-lesson date forward', () => {
    const result = completePastLessons(
      { lessons: [lesson({}), lesson({ id: 'l2', date: '2026-11-03' })], students: [student({ lastLessonDate: '2026-10-01' })] },
      now
    )!;
    expect(result.lessons.map((l) => l.status)).toEqual(['completed', 'scheduled']);
    expect(result.students[0].lastLessonDate).toBe('2026-11-02');
  });

  it('leaves lessons still in progress, cancelled ones, and returns null when nothing changed', () => {
    expect(completePastLessons({ lessons: [lesson({ endTime: '12:30' }), lesson({ id: 'x', status: 'cancelled' })], students: [student()] }, now)).toBeNull();
  });

  it('does not move a later last-lesson date backwards', () => {
    const result = completePastLessons({ lessons: [lesson({})], students: [student({ lastLessonDate: '2026-12-01' })] }, now)!;
    expect(result.students[0].lastLessonDate).toBe('2026-12-01');
  });

  it('copes with end times that still carry seconds', () => {
    expect(completePastLessons({ lessons: [lesson({ endTime: '11:00:00' })], students: [student()] }, now)).not.toBeNull();
  });
});

describe('recalculateStudentTotals', () => {
  it('rebuilds totals and balance from non-cancelled lessons', () => {
    const lessons = [
      lesson({ id: 'a', price: 40 }),
      lesson({ id: 'b', price: 50, isPaid: true, status: 'completed', date: '2026-10-20' }),
      lesson({ id: 'c', price: 99, status: 'cancelled' }),
    ];
    const [result] = recalculateStudentTotals(lessons, [student({ totalLessons: 9, totalSpent: 999, balance: 5 })]);
    expect(result).toMatchObject({ totalLessons: 2, totalSpent: 90, balance: 40, lastLessonDate: '2026-10-20' });
  });
});

describe('checkDataIntegrity', () => {
  it('reports disagreeing totals and orphan or overdue lessons', () => {
    const report = checkDataIntegrity(
      [lesson({}), lesson({ id: 'o', studentId: 'ghost', date: '2099-01-01' })],
      [student({ totalLessons: 5, totalSpent: 40, balance: 40 })],
      new Date('2026-11-05T00:00:00')
    );
    expect(report.studentIssues.map((i) => i.issue)).toEqual(['totalLessons mismatch: stored=5, actual=1']);
    expect(report.lessonIssues.map((i) => i.issue)).toEqual([
      'Lesson ended in the past but still marked as scheduled',
      'Student with id ghost not found in students array',
    ]);
  });

  it('is clean when everything agrees', () => {
    const report = checkDataIntegrity([lesson({})], [student({ totalLessons: 1, totalSpent: 40, balance: 40 })], new Date('2026-11-01T00:00:00'));
    expect(report).toEqual({ studentIssues: [], lessonIssues: [] });
  });
});
