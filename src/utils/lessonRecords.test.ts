import { describe, expect, it } from 'vitest';

import { buildScheduledLesson, withNewLessonTotals } from './lessonRecords';
import type { Coach, Student } from '../types/coach';

const coach = {
  id: 'c1',
  name: 'Chris Coach',
  pricePerHour: 40,
  paymentSettings: { cashEnabled: true, paymentPreference: 'CASH' },
} as unknown as Coach;

describe('buildScheduledLesson', () => {
  it('builds an unpaid scheduled lesson with end time and payment fields', () => {
    const lesson = buildScheduledLesson({
      id: 'l1',
      coach,
      studentId: 's1',
      studentName: 'Ana',
      date: '2026-11-02',
      startTime: '18:30',
      duration: 60,
      price: 45,
      courtId: 'court1',
      createdAt: '2026-10-01T00:00:00.000Z',
    });
    expect(lesson).toMatchObject({
      id: 'l1',
      coachId: 'c1',
      endTime: '19:30',
      status: 'scheduled',
      isPaid: false,
      price: 45,
      courtId: 'court1',
    });
    expect(lesson.paymentStatus).toBeTruthy();
    expect(lesson.paymentReferenceCode).toBeTruthy();
    expect('seriesId' in lesson).toBe(false);
  });

  it('carries the series id when given', () => {
    const lesson = buildScheduledLesson({
      id: 'l2', coach, studentId: 's1', studentName: 'Ana', date: '2026-11-02',
      startTime: '10:00', duration: 30, price: 20, seriesId: 'S1',
    });
    expect(lesson.seriesId).toBe('S1');
  });
});

describe('withNewLessonTotals', () => {
  it('adds one lesson to the running totals', () => {
    const student = { id: 's', totalLessons: 2, totalSpent: 80, balance: 40 } as Student;
    expect(withNewLessonTotals(student, 40, '2026-11-02')).toMatchObject({
      totalLessons: 3, totalSpent: 120, balance: 80, lastLessonDate: '2026-11-02',
    });
  });
});
