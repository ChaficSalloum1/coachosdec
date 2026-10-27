import { describe, expect, it } from 'vitest';

import { futureSeriesLessons, laterSeriesCount } from './lessonSeries';
import type { Lesson } from '../types/coach';

const lesson = (over: Partial<Lesson>): Lesson =>
  ({
    id: 'l',
    coachId: 'c',
    studentId: 's1',
    studentName: 'Ana',
    date: '2026-11-02',
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    price: 40,
    isPaid: false,
    status: 'scheduled',
    createdAt: '',
    ...over,
  }) as Lesson;

const series = [
  lesson({ id: 'w1', date: '2026-11-02', seriesId: 'S' }),
  lesson({ id: 'w2', date: '2026-11-09', seriesId: 'S' }),
  lesson({ id: 'w3', date: '2026-11-16', seriesId: 'S' }),
  lesson({ id: 'w4', date: '2026-11-23', seriesId: 'S', status: 'cancelled' }),
  lesson({ id: 'other', date: '2026-11-16', seriesId: 'T' }),
  lesson({ id: 'oneoff', date: '2026-11-16' }),
];

describe('futureSeriesLessons', () => {
  it('returns this lesson and later active ones in the same series, in order', () => {
    expect(futureSeriesLessons(series, series[1]).map((l) => l.id)).toEqual(['w2', 'w3']);
    expect(futureSeriesLessons(series, series[0]).map((l) => l.id)).toEqual(['w1', 'w2', 'w3']);
  });

  it('is empty for a one-off lesson', () => {
    expect(futureSeriesLessons(series, series[5])).toEqual([]);
  });

  it('includes every player of a group series', () => {
    const group = [
      lesson({ id: 'a1', studentId: 'a', date: '2026-11-02', seriesId: 'G' }),
      lesson({ id: 'b1', studentId: 'b', date: '2026-11-02', seriesId: 'G' }),
      lesson({ id: 'a2', studentId: 'a', date: '2026-11-09', seriesId: 'G' }),
      lesson({ id: 'b2', studentId: 'b', date: '2026-11-09', seriesId: 'G' }),
    ];
    expect(futureSeriesLessons(group, group[0]).map((l) => l.id)).toEqual(['a1', 'b1', 'a2', 'b2']);
  });
});

describe('laterSeriesCount', () => {
  it('counts later weeks, not players', () => {
    expect(laterSeriesCount(series, series[0])).toBe(2);
    expect(laterSeriesCount(series, series[2])).toBe(0);
    expect(laterSeriesCount(series, series[5])).toBe(0);
  });
});
