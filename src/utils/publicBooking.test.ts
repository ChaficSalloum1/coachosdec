import { describe, expect, it } from 'vitest';

import { buildBookableDays, buildBookingUrl, type PublicAvailabilityRow } from './publicBooking';

// 2026-11-02 is a Monday (day_of_week 1).
const NOW = new Date('2026-11-02T08:00:00');

const row = (over: Partial<PublicAvailabilityRow>): PublicAvailabilityRow => ({
  kind: 'availability',
  id: Math.random().toString(36).slice(2),
  day_of_week: null,
  date: null,
  start_time: null,
  end_time: null,
  ...over,
});

describe('buildBookableDays', () => {
  it('lists free start times on days the coach is available, skipping other days', () => {
    const days = buildBookableDays({
      now: NOW,
      days: 3,
      rows: [row({ day_of_week: 1, start_time: '09:00:00', end_time: '11:00:00' })],
    });
    expect(days).toEqual([{ date: '2026-11-02', label: 'Today', times: ['09:00', '09:30', '10:00'] }]);
  });

  it('removes booked times (cancelled lessons are never sent) and blacked-out days', () => {
    const days = buildBookableDays({
      now: NOW,
      days: 9,
      rows: [
        row({ day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' }),
        row({ kind: 'lesson', date: '2026-11-02', start_time: '10:00:00', end_time: '11:00:00' }),
        row({ kind: 'blackout', date: '2026-11-09' }),
      ],
    });
    expect(days).toHaveLength(1);
    expect(days[0].times).toEqual(['09:00', '11:00']);
  });

  it('is empty when the coach has set no availability', () => {
    expect(buildBookableDays({ now: NOW, rows: [row({ kind: 'lesson', date: '2026-11-02', start_time: '10:00:00', end_time: '11:00:00' })] })).toEqual([]);
  });

  it('labels tomorrow and later days', () => {
    const days = buildBookableDays({
      now: NOW,
      days: 3,
      rows: [
        row({ day_of_week: 1, start_time: '09:00:00', end_time: '10:00:00' }),
        row({ day_of_week: 2, start_time: '09:00:00', end_time: '10:00:00' }),
        row({ day_of_week: 3, start_time: '09:00:00', end_time: '10:00:00' }),
      ],
    });
    expect(days.map((d) => d.label)).toEqual(['Today', 'Tomorrow', 'Wed 4 Nov']);
  });
});

describe('buildBookingUrl', () => {
  it('uses the default base and a configured base without double slashes', () => {
    expect(buildBookingUrl('nikos-padel')).toBe('https://coachos.app/book/nikos-padel');
    expect(buildBookingUrl('nikos padel', 'https://book.example.com/book/')).toBe('https://book.example.com/book/nikos%20padel');
  });
});
