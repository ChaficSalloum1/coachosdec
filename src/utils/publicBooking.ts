/*
Logic for the public student booking page: turns the rows returned by the
get_public_booking_availability RPC into days with bookable start times, and
builds the shareable booking URL. Pure so the web page and the app share it.
*/
import { addDays, format } from 'date-fns';

import { PUBLIC_BOOKING } from '../config/appSettings';
import { suggestFreeStartTimes } from './lessonScheduling';
import type { AvailabilityRange, Lesson } from '../types/coach';
import { t } from '../i18n';
import { formatLocalized } from '../i18n/formatDate';

export interface PublicAvailabilityRow {
  kind: 'availability' | 'lesson' | 'blackout' | string;
  id: string;
  day_of_week: number | null;
  date: string | null; // yyyy-MM-dd
  start_time: string | null; // HH:mm:ss
  end_time: string | null;
  area_id?: string | null;
  facility_id?: string | null;
  court_id?: string | null;
  place_name?: string | null; // facility name, else area name (availability rows only)
}

// Where a lesson starting at a given time would take place.
export interface BookablePlace {
  name: string | null;
  areaId: string | null;
  facilityId: string | null;
  courtId: string | null;
}

export interface BookableDay {
  date: string; // yyyy-MM-dd
  label: string; // Today, Tomorrow, Mon 2
  times: string[]; // HH:mm
  places: Record<string, BookablePlace>; // by start time
}

const toHHMM = (time: string | null): string => (time ?? '').slice(0, 5);

const minutesOf = (hhmm: string): number => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

// The first of the coach's hours that day which covers a lesson starting at `time`.
function placeFor(ranges: PublicAvailabilityRow[], weekday: number, time: string, durationMinutes: number): BookablePlace {
  const start = minutesOf(time);
  const covering = ranges.find(
    (r) =>
      r.day_of_week === weekday &&
      minutesOf(toHHMM(r.start_time)) <= start &&
      start + durationMinutes <= minutesOf(toHHMM(r.end_time))
  );
  return {
    name: covering?.place_name ?? null,
    areaId: covering?.area_id ?? null,
    facilityId: covering?.facility_id ?? null,
    courtId: covering?.court_id ?? null,
  };
}

export function buildBookableDays(args: {
  rows: PublicAvailabilityRow[];
  now?: Date;
  days?: number;
  durationMinutes?: number;
}): BookableDay[] {
  const now = args.now ?? new Date();
  const days = args.days ?? PUBLIC_BOOKING.windowDays;
  const durationMinutes = args.durationMinutes ?? PUBLIC_BOOKING.lessonMinutes;

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
  const placedRanges = args.rows.filter((r) => r.kind === 'availability' && r.day_of_week !== null);
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
      limit: PUBLIC_BOOKING.maxSlotsShownPerDay,
    });
    if (times.length === 0) continue;
    result.push({
      date,
      label: i === 0 ? t('common.today') : i === 1 ? t('common.tomorrow') : formatLocalized(day, 'EEE d MMM'),
      times,
      places: Object.fromEntries(times.map((time) => [time, placeFor(placedRanges, day.getDay(), time, durationMinutes)])),
    });
  }
  return result;
}

// The hosted booking page's address, from EXPO_PUBLIC_BOOKING_BASE_URL (for
// example https://book.yourdomain.com/book). Null until the page is deployed,
// so the app never hands coaches a link to a page that does not exist.
export function getBookingBaseUrl(configured?: string): string | null {
  const base = configured?.trim().replace(/\/+$/, '');
  return base ? base : null;
}

// The one place the shareable link is built; null when the page is not set up.
export function buildBookingUrl(bookingLink: string, configuredBase?: string): string | null {
  const base = getBookingBaseUrl(configuredBase);
  return base ? `${base}/${encodeURIComponent(bookingLink)}` : null;
}
