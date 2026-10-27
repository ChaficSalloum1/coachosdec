import { describe, expect, it } from 'vitest';

import { summarizeIncome } from './income';
import type { Lesson } from '../types/coach';

const lesson = (over: Partial<Lesson>): Lesson =>
  ({
    id: 'l',
    coachId: 'c',
    studentId: 's',
    studentName: 'Ana',
    date: '2026-11-04',
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    price: 40,
    isPaid: false,
    status: 'scheduled',
    createdAt: '',
    ...over,
  }) as Lesson;

// Wednesday 4 Nov 2026: the week is Mon 2 - Sun 8 Nov.
const NOW = new Date('2026-11-04T12:00:00');

describe('summarizeIncome', () => {
  it('splits paid and outstanding for this week and this month, Monday to Sunday', () => {
    const result = summarizeIncome(
      [
        lesson({ id: 'a', date: '2026-11-02', isPaid: true, price: 40 }), // Monday, paid
        lesson({ id: 'b', date: '2026-11-08', price: 50 }), // Sunday, outstanding
        lesson({ id: 'c', date: '2026-11-09', isPaid: true, price: 60 }), // next week, same month
        lesson({ id: 'd', date: '2026-10-31', isPaid: true, price: 99 }), // last month
        lesson({ id: 'e', date: '2026-11-04', status: 'cancelled', price: 70 }), // cancelled
      ],
      NOW
    );
    expect(result.week).toEqual({ paid: 40, outstanding: 50, lessons: 2 });
    expect(result.month).toEqual({ paid: 100, outstanding: 50, lessons: 3 });
  });

  it('is all zeros with no lessons', () => {
    expect(summarizeIncome([], NOW).week).toEqual({ paid: 0, outstanding: 0, lessons: 0 });
  });
});
