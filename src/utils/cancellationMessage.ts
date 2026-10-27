/*
Prefilled "I have to cancel" message for a student, and the link that opens it
in their messaging app. Pure so it can be tested without React Native.
*/
import { format } from 'date-fns';

const PHONE_PATTERN = /^[\d\s+\-()]{7,}$/;

export function buildCancellationMessage(params: {
  studentName: string;
  coachName?: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
}): string {
  const firstName = params.studentName.trim().split(/\s+/)[0] || 'there';
  const when = `${format(new Date(`${params.date}T12:00:00`), 'EEE d MMM')} at ${params.startTime}`;
  const signOff = params.coachName?.trim() ? `\n${params.coachName.trim()}` : '';
  return `Hi ${firstName}, I'm sorry, I have to cancel our lesson on ${when}. Let me know when suits you and we'll find a new time.${signOff}`;
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
