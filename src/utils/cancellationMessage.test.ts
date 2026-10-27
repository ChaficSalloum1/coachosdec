import { describe, expect, it } from 'vitest';

import {
  buildCancellationMessage,
  buildCancellationNotices,
  buildContactUrl,
  buildReminderMessage,
  buildReminderNotices,
  lessonsToCancelForDay,
} from './cancellationMessage';
import type { Lesson, Student } from '../types/coach';

describe('buildCancellationMessage', () => {
  it('greets by first name and names the day and time', () => {
    const message = buildCancellationMessage({
      studentName: 'Ana Papadopoulou',
      coachName: 'Chris',
      date: '2026-11-02',
      startTime: '18:30',
    });
    expect(message).toContain('Hi Ana,');
    expect(message).toContain('Mon 2 Nov at 18:30');
    expect(message.endsWith('\nChris')).toBe(true);
  });

  it('says weekly lessons when a whole series is cancelled', () => {
    const message = buildCancellationMessage({ studentName: 'Ana', date: '2026-11-02', startTime: '18:30', weekly: true });
    expect(message).toContain('our weekly lessons from Mon 2 Nov at 18:30');
  });

  it('works without a coach name or a usable student name', () => {
    const message = buildCancellationMessage({ studentName: '  ', date: '2026-11-02', startTime: '09:00' });
    expect(message).toContain('Hi there,');
    expect(message.endsWith('new time.')).toBe(true);
  });
});

describe('buildContactUrl', () => {
  it('opens an sms for phone numbers with the platform body separator', () => {
    expect(buildContactUrl('+30 694 123 4567', 'Hi & bye', { platform: 'ios' })).toBe(
      'sms:+306941234567&body=Hi%20%26%20bye'
    );
    expect(buildContactUrl('(694) 123-4567', 'Hi', { platform: 'android' })).toBe('sms:6941234567?body=Hi');
  });

  it('opens a mailto for emails and returns null with no contact', () => {
    expect(buildContactUrl('ana@example.com', 'Hi', { platform: 'ios' })).toBe(
      'mailto:ana@example.com?subject=Lesson%20cancelled&body=Hi'
    );
    expect(buildContactUrl('   ', 'Hi', { platform: 'ios' })).toBeNull();
    expect(buildContactUrl(undefined, 'Hi', { platform: 'ios' })).toBeNull();
  });
});

const lesson = (over: Partial<Lesson>): Lesson =>
  ({
    id: 'l',
    coachId: 'c',
    studentId: 's1',
    studentName: 'Ana Papadopoulou',
    date: '2026-11-02',
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    price: 40,
    isPaid: false,
    status: 'scheduled',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...over,
  }) as Lesson;

const student = (id: string, contact: string): Student =>
  ({ id, coachId: 'c', name: id, contact, totalLessons: 0, totalSpent: 0, balance: 0, createdAt: '' }) as Student;

describe('lessonsToCancelForDay', () => {
  it("keeps only scheduled lessons that haven't started yet today", () => {
    const now = new Date('2026-11-02T12:00:00');
    const lessons = [
      lesson({ id: 'past', startTime: '09:00' }),
      lesson({ id: 'later', startTime: '15:00' }),
      lesson({ id: 'done', startTime: '16:00', status: 'completed' }),
      lesson({ id: 'gone', startTime: '17:00', status: 'cancelled' }),
      lesson({ id: 'other-day', date: '2026-11-03', startTime: '15:00' }),
    ];
    expect(lessonsToCancelForDay(lessons, '2026-11-02', now).map((l) => l.id)).toEqual(['later']);
    expect(lessonsToCancelForDay(lessons, '2026-11-03', now).map((l) => l.id)).toEqual(['other-day']);
  });

  it('offers nothing for a day that has already passed', () => {
    const now = new Date('2026-11-05T09:00:00');
    expect(lessonsToCancelForDay([lesson({ date: '2026-11-02', status: 'scheduled' })], '2026-11-02', now)).toEqual([]);
  });
});

describe('buildCancellationNotices', () => {
  it('makes one notice per student, in time order, with a null url when there is no contact', () => {
    const notices = buildCancellationNotices({
      lessons: [
        lesson({ id: '2', studentId: 's2', studentName: 'Ben Cole', startTime: '12:00' }),
        lesson({ id: '1', studentId: 's1', startTime: '10:00' }),
        lesson({ id: '3', studentId: 's1', startTime: '14:00' }),
      ],
      students: [student('s1', '+30 694 123 4567'), student('s2', '')],
      coachName: 'Chris',
      platform: 'ios',
    });
    expect(notices.map((n) => n.studentId)).toEqual(['s1', 's2']);
    expect(notices[0].url?.startsWith('sms:+306941234567&body=')).toBe(true);
    expect(notices[1].url).toBeNull();
  });
});

describe('reminders', () => {
  const now = new Date('2026-11-02T20:00:00');

  it('says tomorrow, today, or the date, and includes the place when known', () => {
    const base = { studentName: 'Ana Papadopoulou', coachName: 'Chris', startTime: '18:30', now };
    expect(buildReminderMessage({ ...base, date: '2026-11-03', location: 'Court 2' })).toBe(
      'Hi Ana, a quick reminder about our lesson tomorrow at 18:30 at Court 2. See you then!\nChris'
    );
    expect(buildReminderMessage({ ...base, date: '2026-11-02' })).toContain('lesson today at 18:30.');
    expect(buildReminderMessage({ ...base, date: '2026-11-05' })).toContain('lesson on Thu 5 Nov at 18:30.');
  });

  it('makes one reminder per student with a mailto subject for email contacts', () => {
    const notices = buildReminderNotices({
      lessons: [lesson({ id: '1', studentId: 's1', date: '2026-11-03' }), lesson({ id: '2', studentId: 's1', date: '2026-11-03', startTime: '15:00' })],
      students: [student('s1', 'ana@example.com')],
      platform: 'ios',
      now,
    });
    expect(notices).toHaveLength(1);
    expect(notices[0].url?.startsWith('mailto:ana@example.com?subject=Lesson%20reminder')).toBe(true);
  });
});
