/*
Prefilled "I have to cancel" message for a student, and the link that opens it
in their messaging app. Pure so it can be tested without React Native.
*/
import { format } from 'date-fns';

import type { Lesson, Student } from '../types/coach';

const PHONE_PATTERN = /^[\d\s+\-()]{7,}$/;

export function buildCancellationMessage(params: {
  studentName: string;
  coachName?: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  weekly?: boolean; // cancelling a whole run of weekly lessons from this date
}): string {
  const firstName = params.studentName.trim().split(/\s+/)[0] || 'there';
  const when = `${format(new Date(`${params.date}T12:00:00`), 'EEE d MMM')} at ${params.startTime}`;
  const signOff = params.coachName?.trim() ? `\n${params.coachName.trim()}` : '';
  const what = params.weekly ? `our weekly lessons from ${when}` : `our lesson on ${when}`;
  return `Hi ${firstName}, I'm sorry, I have to cancel ${what}. Let me know when suits you and we'll find a new time.${signOff}`;
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

  const subject = encodeURIComponent(options.subject ?? 'Lesson cancelled');
  return `mailto:${value}?subject=${subject}&body=${encodeURIComponent(message)}`;
}

// Lessons a "cancel the rest of the day" action should cancel: still scheduled,
// and (for today) not yet started.
export function lessonsToCancelForDay(lessons: Lesson[], dateISO: string, now: Date = new Date()): Lesson[] {
  const today = format(now, 'yyyy-MM-dd');
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
    subject: 'Lesson cancelled',
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
  if (date === today) return 'today';
  if (date === tomorrow) return 'tomorrow';
  return `on ${format(new Date(`${date}T12:00:00`), 'EEE d MMM')}`;
}

export function buildReminderMessage(params: {
  studentName: string;
  coachName?: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  location?: string;
  now?: Date;
}): string {
  const firstName = params.studentName.trim().split(/\s+/)[0] || 'there';
  const where = params.location?.trim() ? ` at ${params.location.trim()}` : '';
  const signOff = params.coachName?.trim() ? `\n${params.coachName.trim()}` : '';
  return `Hi ${firstName}, a quick reminder about our lesson ${dayPhrase(params.date, params.now ?? new Date())} at ${params.startTime}${where}. See you then!${signOff}`;
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
    subject: 'Lesson reminder',
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
