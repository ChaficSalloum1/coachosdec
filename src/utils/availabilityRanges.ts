/*
Pure rules for a coach's weekly availability: whether a new range clashes
with an existing one, and the hourly slots the public preview shows.
*/
import { addDays, format } from 'date-fns';

import { PUBLIC_BOOKING } from '../config/appSettings';
import type { AvailabilityRange, BlackoutDate } from '../types/coach';

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// The coach can only be in one place at a time, so any overlap on the same
// weekday is a clash. `excludeId` is the range being edited.
export function hasRangeOverlap(
  candidate: Pick<AvailabilityRange, 'dayOfWeek' | 'startTime' | 'endTime'>,
  existing: AvailabilityRange[],
  excludeId?: string
): boolean {
  const start = toMinutes(candidate.startTime);
  const end = toMinutes(candidate.endTime);
  return existing.some(
    (range) =>
      range.id !== excludeId &&
      range.dayOfWeek === candidate.dayOfWeek &&
      start < toMinutes(range.endTime) &&
      end > toMinutes(range.startTime)
  );
}

export interface OpenSlot {
  date: string; // yyyy-MM-dd
  time: string; // HH:00
  range: AvailabilityRange;
}

// One slot per whole hour inside each availability range, for the coming days,
// skipping blacked-out dates.
export function generateHourlySlots(args: {
  ranges: AvailabilityRange[];
  blackoutDates: BlackoutDate[];
  from?: Date;
  days?: number;
}): OpenSlot[] {
  const from = args.from ?? new Date();
  const days = args.days ?? PUBLIC_BOOKING.windowDays;
  const slots: OpenSlot[] = [];

  for (let i = 0; i < days; i++) {
    const day = addDays(from, i); // date-fns keeps this correct across daylight-saving changes
    const date = format(day, 'yyyy-MM-dd');
    if (args.blackoutDates.some((b) => b.date === date)) continue;

    for (const range of args.ranges.filter((r) => r.dayOfWeek === day.getDay())) {
      const startHour = parseInt(range.startTime.split(':')[0], 10);
      const endHour = parseInt(range.endTime.split(':')[0], 10);
      for (let hour = startHour; hour < endHour; hour++) {
        slots.push({ date, time: `${hour.toString().padStart(2, '0')}:00`, range });
      }
    }
  }
  return slots;
}

// Empty facility/court ids (from older saves) become "not set".
export function normalizeRanges(ranges: AvailabilityRange[]): AvailabilityRange[] {
  return ranges.map((range) => ({
    ...range,
    facilityId: range.facilityId && range.facilityId.trim() !== '' ? range.facilityId : undefined,
    courtId: range.courtId && range.courtId.trim() !== '' ? range.courtId : undefined,
  }));
}
