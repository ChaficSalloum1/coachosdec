import { describe, expect, it } from 'vitest';

import { generateHourlySlots, hasRangeOverlap, normalizeRanges } from './availabilityRanges';
import type { AvailabilityRange } from '../types/coach';

const range = (id: string, dayOfWeek: number, startTime: string, endTime: string): AvailabilityRange => ({
  id, coachId: 'c', dayOfWeek, startTime, endTime, areaId: 'a',
});

describe('hasRangeOverlap', () => {
  const existing = [range('r1', 1, '09:00', '12:00')];

  it('detects overlap on the same weekday only', () => {
    expect(hasRangeOverlap({ dayOfWeek: 1, startTime: '11:00', endTime: '13:00' }, existing)).toBe(true);
    expect(hasRangeOverlap({ dayOfWeek: 2, startTime: '11:00', endTime: '13:00' }, existing)).toBe(false);
  });

  it('allows ranges that only touch, and ignores the range being edited', () => {
    expect(hasRangeOverlap({ dayOfWeek: 1, startTime: '12:00', endTime: '14:00' }, existing)).toBe(false);
    expect(hasRangeOverlap({ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }, existing, 'r1')).toBe(false);
  });
});

describe('generateHourlySlots', () => {
  // 2026-11-02 is a Monday.
  const from = new Date('2026-11-02T08:00:00');

  it('makes one slot per hour in each matching range and skips blackout days', () => {
    const slots = generateHourlySlots({
      ranges: [range('r1', 1, '09:00', '11:00')],
      blackoutDates: [{ id: 'b', coachId: 'c', date: '2026-11-09' }],
      from,
      days: 10,
    });
    expect(slots.map((s) => `${s.date} ${s.time}`)).toEqual(['2026-11-02 09:00', '2026-11-02 10:00']);
  });

  it('covers every matching weekday in the window', () => {
    const slots = generateHourlySlots({ ranges: [range('r1', 1, '09:00', '10:00')], blackoutDates: [], from, days: 14 });
    expect(slots.map((s) => s.date)).toEqual(['2026-11-02', '2026-11-09']);
  });
});

describe('normalizeRanges', () => {
  it('turns blank facility and court ids into undefined', () => {
    const r = { id: 'r', coachId: 'c', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', areaId: 'a', facilityId: ' ', courtId: 'k' } as AvailabilityRange;
    expect(normalizeRanges([r])[0]).toMatchObject({ facilityId: undefined, courtId: 'k' });
  });
});
