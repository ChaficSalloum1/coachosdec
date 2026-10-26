import { describe, expect, it } from 'vitest';

import {
  findConflicts,
  formatTime12,
  getRecentStudents,
  suggestDuration,
  suggestFreeStartTimes,
  suggestPrice,
} from './lessonScheduling';
import type { AvailabilityRange, Lesson, Student } from '../types/coach';

// 2026-11-02 is a Monday (dayOfWeek 1).
const MONDAY = '2026-11-02';

const range = (start: string, end: string, dayOfWeek = 1): AvailabilityRange => ({
  id: `r-${start}-${dayOfWeek}`,
  coachId: 'c',
  dayOfWeek,
  startTime: start,
  endTime: end,
  areaId: 'a',
});

const lesson = (over: Partial<Lesson>): Lesson => ({
  id: over.id ?? 'l',
  coachId: 'c',
  studentId: 's1',
  studentName: 'Ana',
  date: MONDAY,
  startTime: '10:00',
  endTime: '11:00',
  duration: 60,
  price: 40,
  isPaid: false,
  status: 'scheduled',
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

const student = (id: string, name: string): Student => ({
  id,
  coachId: 'c',
  name,
  contact: '123',
  totalLessons: 0,
  totalSpent: 0,
  balance: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
});

const longAgo = new Date('2026-10-01T09:00:00');

describe('suggestFreeStartTimes', () => {
  it('offers start times inside availability that fit the lesson length', () => {
    const times = suggestFreeStartTimes({
      date: MONDAY,
      durationMinutes: 60,
      availabilityRanges: [range('09:00', '11:00')],
      blackoutDates: [],
      lessons: [],
      now: longAgo,
    });
    expect(times).toEqual(['09:00', '09:30', '10:00']);
  });

  it('skips times that would overlap an existing lesson but ignores cancelled ones', () => {
    const times = suggestFreeStartTimes({
      date: MONDAY,
      durationMinutes: 60,
      availabilityRanges: [range('09:00', '13:00')],
      blackoutDates: [],
      lessons: [
        lesson({ startTime: '10:00', endTime: '11:00' }),
        lesson({ id: 'x', startTime: '12:00', endTime: '13:00', status: 'cancelled' }),
      ],
      now: longAgo,
      limit: 20,
    });
    expect(times).toContain('09:00');
    expect(times).not.toContain('09:30');
    expect(times).not.toContain('10:30');
    expect(times).toContain('11:00');
    expect(times).toContain('12:00');
  });

  it('returns nothing on a blackout day and nothing on a day with no availability', () => {
    const base = { durationMinutes: 60, lessons: [], now: longAgo, availabilityRanges: [range('09:00', '12:00')] };
    expect(suggestFreeStartTimes({ ...base, date: MONDAY, blackoutDates: [{ date: MONDAY }] })).toEqual([]);
    expect(suggestFreeStartTimes({ ...base, date: '2026-11-03', blackoutDates: [] })).toEqual([]);
  });

  it('falls back to a daytime window only when no availability is set at all', () => {
    const times = suggestFreeStartTimes({
      date: MONDAY,
      durationMinutes: 60,
      availabilityRanges: [],
      blackoutDates: [],
      lessons: [],
      now: longAgo,
      stepMinutes: 60,
      limit: 3,
    });
    expect(times).toEqual(['08:00', '09:00', '10:00']);
  });

  it('hides times that have already passed today', () => {
    const times = suggestFreeStartTimes({
      date: MONDAY,
      durationMinutes: 60,
      availabilityRanges: [range('09:00', '12:00')],
      blackoutDates: [],
      lessons: [],
      now: new Date('2026-11-02T10:10:00'),
    });
    expect(times).toEqual(['10:30', '11:00']);
  });

  it('never offers a start whose lesson would run past the end of availability', () => {
    const times = suggestFreeStartTimes({
      date: MONDAY,
      durationMinutes: 90,
      availabilityRanges: [range('09:00', '11:00')],
      blackoutDates: [],
      lessons: [],
      now: longAgo,
    });
    expect(times).toEqual(['09:00', '09:30']);
  });
});

describe('findConflicts', () => {
  it('finds overlapping active lessons and counts a group once', () => {
    const group = [
      lesson({ id: 'g1', studentId: 's1', groupId: 'G', groupCapacity: 4, startTime: '18:00', endTime: '19:00' }),
      lesson({ id: 'g2', studentId: 's2', groupId: 'G', groupCapacity: 4, startTime: '18:00', endTime: '19:00' }),
    ];
    const result = findConflicts({ date: MONDAY, startTime: '18:30', durationMinutes: 60, lessons: group });
    expect(result).toHaveLength(1);
    expect(result[0].groupId).toBe('G');
  });

  it('does not flag back-to-back lessons, other days, or cancelled lessons', () => {
    const lessons = [
      lesson({ id: 'a', startTime: '10:00', endTime: '11:00' }),
      lesson({ id: 'b', date: '2026-11-03', startTime: '11:00', endTime: '12:00' }),
      lesson({ id: 'c', startTime: '11:00', endTime: '12:00', status: 'cancelled' }),
    ];
    expect(findConflicts({ date: MONDAY, startTime: '11:00', durationMinutes: 60, lessons })).toEqual([]);
  });
});

describe('getRecentStudents', () => {
  it('puts the most recently taught first, then the rest A to Z, up to the limit', () => {
    const students = [student('s1', 'Ana'), student('s2', 'Ben'), student('s3', 'Zed'), student('s4', 'Cleo')];
    const lessons = [
      lesson({ id: '1', studentId: 's1', date: '2026-10-01' }),
      lesson({ id: '2', studentId: 's2', date: '2026-10-20' }),
    ];
    expect(getRecentStudents(lessons, students, 6).map((s) => s.name)).toEqual(['Ben', 'Ana', 'Cleo', 'Zed']);
    expect(getRecentStudents(lessons, students, 2).map((s) => s.name)).toEqual(['Ben', 'Ana']);
  });
});

describe('suggestDuration and suggestPrice', () => {
  const lessons = [
    lesson({ id: '1', studentId: 's1', date: '2026-10-01', duration: 90, price: 55 }),
    lesson({ id: '2', studentId: 's2', date: '2026-10-20', duration: 45, price: 30 }),
  ];

  it('uses the student\'s last length, else the coach\'s latest, else an hour', () => {
    expect(suggestDuration(lessons, 's1')).toBe(90);
    expect(suggestDuration(lessons, 'new-student')).toBe(45);
    expect(suggestDuration([], undefined)).toBe(60);
  });

  it('reuses what the student paid for the same length, else scales the hourly rate', () => {
    expect(suggestPrice({ lessons, studentId: 's1', durationMinutes: 90, pricePerHour: 40 })).toBe(55);
    expect(suggestPrice({ lessons, studentId: 's1', durationMinutes: 60, pricePerHour: 40 })).toBe(40);
    expect(suggestPrice({ lessons, studentId: undefined, durationMinutes: 30, pricePerHour: 50 })).toBe(25);
  });
});

describe('formatTime12', () => {
  it('formats 24-hour times for chips', () => {
    expect(formatTime12('09:30')).toBe('9:30 AM');
    expect(formatTime12('18:00')).toBe('6:00 PM');
    expect(formatTime12('00:15')).toBe('12:15 AM');
    expect(formatTime12('12:00')).toBe('12:00 PM');
  });
});
