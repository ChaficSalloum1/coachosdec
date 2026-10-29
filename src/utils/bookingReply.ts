/*
The message the coach sends a student after approving or declining their
booking request, ready to open in the student's messaging app. Pure so it can
be tested without React Native.
*/
import { t } from '../i18n';
import type { BookingRequest } from '../types/coach';
import { buildContactUrl, shortDate } from './cancellationMessage';
import { formatClockTime } from './timeFormat';

export type BookingDecision = 'approved' | 'declined';

export function buildBookingReply(params: {
  decision: BookingDecision;
  request: Pick<BookingRequest, 'studentName' | 'studentContact' | 'requestedDate' | 'requestedTime'>;
  coachName?: string;
  place?: string; // where the lesson is, if known
  platform: string;
}): { message: string; url: string | null } {
  const { decision, request } = params;
  const name = request.studentName.trim().split(/\s+/)[0] || t('messages.fallbackName');
  const when = t('messages.when', { date: shortDate(request.requestedDate), time: formatClockTime(request.requestedTime) });
  const where = params.place?.trim() ? t('messages.where', { place: params.place.trim() }) : '';
  const signOff = params.coachName?.trim() ? `\n${params.coachName.trim()}` : '';

  const message =
    decision === 'approved'
      ? t('messages.bookingApproved', { name, when, where, signOff })
      : t('messages.bookingDeclined', { name, when, signOff });
  const subject = t(decision === 'approved' ? 'messages.bookingApprovedSubject' : 'messages.bookingDeclinedSubject');

  return { message, url: buildContactUrl(request.studentContact, message, { platform: params.platform, subject }) };
}
