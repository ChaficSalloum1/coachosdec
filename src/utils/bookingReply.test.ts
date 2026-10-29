import { afterEach, describe, expect, it } from 'vitest';

import { setLanguage } from '../i18n';
import { buildBookingReply } from './bookingReply';

const request = { studentName: 'Maria Kontou', studentContact: '+30 694 123 4567', requestedDate: '2026-11-04', requestedTime: '18:00' };

describe('buildBookingReply', () => {
  afterEach(() => setLanguage('en'));

  it('confirms the lesson with time and place, signed by the coach', () => {
    const { message, url } = buildBookingReply({ decision: 'approved', request, coachName: 'Nikos', place: 'David Lloyd Club', platform: 'ios' });
    expect(message).toBe('Hi Maria, your lesson is confirmed: Wed 4 Nov at 6:00 PM at David Lloyd Club. See you then!\nNikos');
    expect(url).toMatch(/^sms:\+306941234567&body=/);
  });

  it('leaves the place out when unknown', () => {
    const { message } = buildBookingReply({ decision: 'approved', request, platform: 'ios' });
    expect(message).toBe('Hi Maria, your lesson is confirmed: Wed 4 Nov at 6:00 PM. See you then!');
  });

  it('politely declines and invites another time', () => {
    const { message } = buildBookingReply({ decision: 'declined', request, platform: 'android' });
    expect(message).toContain("I can't make Wed 4 Nov at 6:00 PM");
  });

  it('emails a student who gave an email address', () => {
    const { url } = buildBookingReply({ decision: 'approved', request: { ...request, studentContact: 'maria@example.com' }, platform: 'ios' });
    expect(url).toMatch(/^mailto:maria@example.com\?subject=Lesson%20confirmed&body=/);
  });

  it('writes to the student in Greek, informally, with a 24-hour time', async () => {
    await setLanguage('el');
    const { message } = buildBookingReply({ decision: 'approved', request, place: 'David Lloyd Club', platform: 'ios' });
    expect(message).toContain('Γεια σου Maria');
    expect(message).toContain('18:00');
    expect(message).toContain('David Lloyd Club');
  });

  it('gives no link when the student left no usable contact', () => {
    expect(buildBookingReply({ decision: 'approved', request: { ...request, studentContact: '' }, platform: 'ios' }).url).toBeNull();
  });
});
