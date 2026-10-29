/*
Prefilled "I have to cancel" message for a student, and the link that opens it
in their messaging app. Pure so it can be tested without React Native.
*/
import { format } from 'date-fns';

import { t } from '../i18n';
import { formatLocalized } from '../i18n/formatDate';
import type { Lesson, Student } from '../types/coach';

const PHONE_PATTERN = /^[\d\s+\-()]{7,}$/;

export const shortDate = (date: string) => formatLocalized(new Date(`${date}T12:00:00`), 'EEE d MMM');

export function buildCancellationMessage(params: {
  studentName: string;
  coachName?: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  weekly?: boolean; // cancelling a whole run of weekly lessons from this date
}): string {
  const name = params.studentName.trim().split(/\s+/)[0] || t('messages.fallbackName');
  const when = t('messages.when', { date: shortDate(params.date), time: params.startTime });
  const signOff = params.coachName?.trim() ? `\n${params.coachName.trim()}` : '';
  return t(params.weekly ? 'messages.cancelWeekly' : 'messages.cancelOne', { name, when, signOff });
}

// sms: for phone numbers (iOS separates the body with "&", Android with "?"),
// mailto: for emails. Null when the student has no contact on file.
export function buildContactUrl(
  contact: string | undefined,
  message: string,
  options: { platform: 'ios' | 'android' | string; subject?: string }
): string | null {
  const value = contact?.trim();
  if (!value) return null;

  if (PHONE_PATTERN.test(value)) {
    const number = value.replace(/[\s\-()]/g, '');
    const separator = options.platform === 'ios' ? '&' : '?';
    return `sms:${number}${separator}body=${encodeURIComponent(message)}`;
  }

  const subject = encodeURIComponent(options.subject ?? t('messages.cancelSubject'));
  return `mailto:${value}?subject=${subject}&body=${encodeURIComponent(message)}`;
}

// Lessons a "cancel the rest of the day" or "remind students" action applies to:
// still scheduled, on today or a later day, and (for today) not yet started.
export function lessonsToCancelForDay(lessons: Lesson[], dateISO: string, now: Date = new Date()): Lesson[] {
  const today = format(now, 'yyyy-MM-dd');
  if (dateISO < today) return []; // nothing to cancel or remind about on a day that is over
  const nowTime = format(now, 'HH:mm');
  return lessons.filter(
    (l) => l.date === dateISO && l.status === 'scheduled' && (dateISO !== today || l.startTime >= nowTime)
  );
}

export interface CancellationNotice {
  studentId: string;
  studentName: string;
  url: string | null; // null when the student has no contact on file
}

// One notice per student (a student in two lessons gets one message about the first).
function buildNotices(args: {
  lessons: Lesson[];
  students: Student[];
  platform: string;
  subject: string;
  messageFor: (lesson: Lesson) => string;
}): CancellationNotice[] {
  const seen = new Set<string>();
  const notices: CancellationNotice[] = [];
  for (const lesson of [...args.lessons].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    if (seen.has(lesson.studentId)) continue;
    seen.add(lesson.studentId);
    const student = args.students.find((s) => s.id === lesson.studentId);
    notices.push({
      studentId: lesson.studentId,
      studentName: lesson.studentName,
      url: buildContactUrl(student?.contact, args.messageFor(lesson), {
        platform: args.platform,
        subject: args.subject,
      }),
    });
  }
  return notices;
}

export function buildCancellationNotices(args: {
  lessons: Lesson[];
  students: Student[];
  coachName?: string;
  platform: string;
  weekly?: boolean;
}): CancellationNotice[] {
  return buildNotices({
    lessons: args.lessons,
    students: args.students,
    platform: args.platform,
    subject: t('messages.cancelSubject'),
    messageFor: (lesson) =>
      buildCancellationMessage({
        studentName: lesson.studentName,
        coachName: args.coachName,
        date: lesson.date,
        startTime: lesson.startTime,
        weekly: args.weekly,
      }),
  });
}

// "today", "tomorrow", or "on Wed 4 Nov" relative to `now`.
function dayPhrase(date: string, now: Date): string {
  const today = format(now, 'yyyy-MM-dd');
  const tomorrow = format(new Date(now.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  if (date === today) return t('messages.dayToday');
  if (date === tomorrow) return t('messages.dayTomorrow');
  return t('messages.dayOn', { date: shortDate(date) });
}

export function buildReminderMessage(params: {
  studentName: string;
  coachName?: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  location?: string;
  now?: Date;
}): string {
  const name = params.studentName.trim().split(/\s+/)[0] || t('messages.fallbackName');
  const where = params.location?.trim() ? t('messages.where', { place: params.location.trim() }) : '';
  const signOff = params.coachName?.trim() ? `\n${params.coachName.trim()}` : '';
  return t('messages.reminder', {
    name,
    day: dayPhrase(params.date, params.now ?? new Date()),
    time: params.startTime,
    where,
    signOff,
  });
}

export function buildReminderNotices(args: {
  lessons: Lesson[];
  students: Student[];
  coachName?: string;
  platform: string;
  locationFor?: (lesson: Lesson) => string;
  now?: Date;
}): CancellationNotice[] {
  return buildNotices({
    lessons: args.lessons,
    students: args.students,
    platform: args.platform,
    subject: t('messages.reminderSubject'),
    messageFor: (lesson) =>
      buildReminderMessage({
        studentName: lesson.studentName,
        coachName: args.coachName,
        date: lesson.date,
        startTime: lesson.startTime,
        location: args.locationFor?.(lesson),
        now: args.now,
      }),
  });
}
