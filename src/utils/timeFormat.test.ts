import { afterEach, describe, expect, it } from 'vitest';

import { setLanguage } from '../i18n';
import { addMinutesToTime, formatClockTime, normalizeClockTime } from './timeFormat';

describe('addMinutesToTime', () => {
  it('adds minutes within the day', () => {
    expect(addMinutesToTime('09:30', 60)).toBe('10:30');
    expect(addMinutesToTime('09:45', 30)).toBe('10:15');
    expect(addMinutesToTime('00:00', 0)).toBe('00:00');
  });

  it('never runs past 23:59', () => {
    expect(addMinutesToTime('23:30', 60)).toBe('23:59');
    expect(addMinutesToTime('22:00', 600)).toBe('23:59');
  });

  it('rejects a malformed time', () => {
    expect(() => addMinutesToTime('9am', 30)).toThrow();
  });
});

describe('normalizeClockTime', () => {
  it('trims the seconds Postgres adds to time columns', () => {
    expect(normalizeClockTime('18:30:00')).toBe('18:30');
    expect(normalizeClockTime('09:05:00.000')).toBe('09:05');
    expect(normalizeClockTime('18:30')).toBe('18:30');
  });

  it('leaves anything else alone', () => {
    expect(normalizeClockTime(undefined)).toBeUndefined();
    expect(normalizeClockTime(null)).toBeNull();
    expect(normalizeClockTime('tomorrow')).toBe('tomorrow');
  });
});

describe('formatClockTime', () => {
  afterEach(() => setLanguage('en'));

  it('formats times on a 12-hour clock in English', () => {
    expect(formatClockTime('09:30')).toBe('9:30 AM');
    expect(formatClockTime('18:00')).toBe('6:00 PM');
    expect(formatClockTime('00:15')).toBe('12:15 AM');
    expect(formatClockTime('12:00')).toBe('12:00 PM');
  });

  it('uses the 24-hour clock in Greek', async () => {
    await setLanguage('el');
    expect(formatClockTime('09:30')).toBe('09:30');
    expect(formatClockTime('18:00')).toBe('18:00');
  });
});
