/*
Logic for the public student booking page: turns the rows returned by the
get_public_booking_availability RPC into days with bookable start times, and
builds the shareable booking URL. Pure so the web page and the app share it.
*/
import { addDays, format } from 'date-fns';

import { suggestFreeStartTimes } from './lessonScheduling';
import type { AvailabilityRange, Lesson } from '../types/coach';

export interface PublicAvailabilityRow {
  kind: 'availability' | 'lesson' | 'blackout' | string;
  id: string;
  day_of_week: number | null;
  date: string | null; // yyyy-MM-dd
  start_time: string | null; // HH:mm:ss
  end_time: string | null;
}

export interface BookableDay {
  date: string; // yyyy-MM-dd
  label: string; // Today, Tomorrow, Mon 2
  times: string[]; // HH:mm
}

export const PUBLIC_BOOKING_DAYS = 14;
export const PUBLIC_BOOKING_DURATION_MINUTES = 60;

const toHHMM = (time: string | null): string => (time ?? '').slice(0, 5);

export function buildBookableDays(args: {
  rows: PublicAvailabilityRow[];
  now?: Date;
  days?: number;
  durationMinutes?: number;
}): BookableDay[] {
  const now = args.now ?? new Date();
  const days = args.days ?? PUBLIC_BOOKING_DAYS;
  const durationMinutes = args.durationMinutes ?? PUBLIC_BOOKING_DURATION_MINUTES;

  const availabilityRanges = args.rows
    .filter((r) => r.kind === 'availability' && r.day_of_week !== null)
    .map(
      (r) =>
        ({
          id: r.id,
          dayOfWeek: r.day_of_week,
          startTime: toHHMM(r.start_time),
          endTime: toHHMM(r.end_time),
        }) as AvailabilityRange
    );
  // A coach who has set no availability is not bookable (the app's own
  // 08:00-21:00 fallback is for the coach, not for the public).
  if (availabilityRanges.length === 0) return [];

  const lessons = args.rows
    .filter((r) => r.kind === 'lesson' && r.date)
    .map(
      (r) =>
        ({
          id: r.id,
          date: r.date,
          startTime: toHHMM(r.start_time),
          endTime: toHHMM(r.end_time),
          status: 'scheduled',
        }) as Lesson
    );
  const blackoutDates = args.rows.filter((r) => r.kind === 'blackout' && r.date).map((r) => ({ date: r.date as string }));

  const result: BookableDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(now, i);
    const date = format(day, 'yyyy-MM-dd');
    const times = suggestFreeStartTimes({
      date,
      durationMinutes,
      availabilityRanges,
      blackoutDates,
      lessons,
      now,
      limit: 48,
    });
    if (times.length === 0) continue;
    result.push({ date, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(day, 'EEE d MMM'), times });
  }
  return result;
}

const DEFAULT_BOOKING_BASE_URL = 'https://coachos.app/book';

// The one place the shareable link is built. Set EXPO_PUBLIC_BOOKING_BASE_URL
// (e.g. https://book.yourdomain.com/book) once the page is hosted.
export function buildBookingUrl(bookingLink: string, baseUrl?: string): string {
  const base = (baseUrl?.trim() || DEFAULT_BOOKING_BASE_URL).replace(/\/+$/, '');
  return `${base}/${encodeURIComponent(bookingLink)}`;
}
