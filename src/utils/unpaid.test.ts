import { describe, expect, it } from 'vitest';

import { summarizeUnpaid } from './unpaid';
import type { Lesson, Student } from '../types/coach';

const lesson = (over: Partial<Lesson>): Lesson =>
  ({
    id: 'l',
    coachId: 'c',
    studentId: 's1',
    studentName: 'Ana',
    date: '2026-10-20',
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    price: 40,
    isPaid: false,
    status: 'completed',
    createdAt: '',
    ...over,
  }) as Lesson;

const student = (id: string): Student =>
  ({ id, coachId: 'c', name: id, contact: '1', totalLessons: 0, totalSpent: 0, balance: 0, createdAt: '' }) as Student;

describe('summarizeUnpaid', () => {
  const students = [student('s1'), student('s2'), student('s3')];

  it('totals unpaid due lessons per student, biggest first, with the oldest to chase', () => {
    const result = summarizeUnpaid(
      [
        lesson({ id: 'a', studentId: 's1', date: '2026-10-20', price: 40 }),
        lesson({ id: 'b', studentId: 's1', date: '2026-10-10', price: 40 }),
        lesson({ id: 'c', studentId: 's2', date: '2026-10-25', price: 100 }),
      ],
      students,
      '2026-10-27'
    );
    expect(result.total).toBe(180);
    expect(result.students.map((r) => [r.student.id, r.amount, r.lessonCount, r.oldestLessonId])).toEqual([
      ['s2', 100, 1, 'c'],
      ['s1', 80, 2, 'b'],
    ]);
    expect(result.students[1].oldestDate).toBe('2026-10-10');
  });

  it('ignores paid, cancelled and future lessons, and lessons of deleted students', () => {
    const result = summarizeUnpaid(
      [
        lesson({ id: 'paid', isPaid: true }),
        lesson({ id: 'gone', status: 'cancelled' }),
        lesson({ id: 'future', date: '2026-11-05', status: 'scheduled' }),
        lesson({ id: 'orphan', studentId: 'nobody' }),
      ],
      students,
      '2026-10-27'
    );
    expect(result).toEqual({ total: 0, students: [] });
  });

  it("counts a scheduled lesson from today as due", () => {
    const result = summarizeUnpaid([lesson({ date: '2026-10-27', status: 'scheduled' })], students, '2026-10-27');
    expect(result.total).toBe(40);
  });
});
