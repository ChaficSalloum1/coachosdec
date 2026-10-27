/*
Clock-time helpers. Times inside the app are always "HH:mm" (24-hour); only
what is shown on screen changes with the language.
*/
import { currentLanguage } from '../i18n';

const TIME_PATTERN = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
const LAST_MINUTE_OF_DAY = 24 * 60 - 1;

/** "14:30" for display: "2:30 PM" in English, "14:30" in Greek (24-hour clock). */
export const formatClockTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  if (currentLanguage() === 'el') return `${hours.padStart(2, '0')}:${minutes}`;
  const hour = parseInt(hours, 10);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
};

/**
 * Postgres returns time columns as "18:30:00"; the app works with "18:30".
 * Trims seconds so every value inside the app has one shape.
 * Anything that is not a clock time is returned unchanged.
 */
export const normalizeClockTime = <T>(time: T): T | string => {
  if (typeof time !== 'string') return time;
  const match = /^(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(time);
  return match ? match[1] : time;
};

/** Hours and minutes of an "HH:mm" time. Throws on anything else. */
export const parseTime = (time: string): { hours: number; minutes: number } => {
  if (!TIME_PATTERN.test(time)) {
    throw new Error(`Invalid time format: ${time}. Expected HH:mm format.`);
  }

  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Add minutes to a time string, staying within the same day.
 * Lessons are stored with same-day start and end times, so a result past
 * midnight is clamped to 23:59 ("24:30" is not a valid time and the database
 * rejects it); the Add Lesson sheet stops people creating such lessons.
 */
export const addMinutesToTime = (time: string, minutesToAdd: number): string => {
  const { hours, minutes } = parseTime(time);
  const total = Math.min(hours * 60 + minutes + minutesToAdd, LAST_MINUTE_OF_DAY);
  const newHours = Math.floor(total / 60).toString().padStart(2, '0');
  const newMinutes = (total % 60).toString().padStart(2, '0');
  return `${newHours}:${newMinutes}`;
};
