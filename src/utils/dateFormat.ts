/**
 * Dates shown to the coach as words ("Today", "Wed, Jan 15", "2 hours ago").
 * Weekday and month names follow the app language.
 */
import { format, addDays, startOfDay } from 'date-fns';

import { t } from '../i18n';
import { formatLocalized } from '../i18n/formatDate';

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const RELATIVE_DAYS_LIMIT = 7;

/** "Wed, Jan 15" from an ISO date string. */
const formatDateShort = (dateString: string): string => formatLocalized(new Date(dateString), 'EEE, MMM d');

/** "Today", "Tomorrow", "Yesterday", or a short date. */
export const formatDateRelative = (dateString: string): string => {
  const today = startOfDay(new Date());
  const dateStart = startOfDay(new Date(dateString));

  if (dateStart.getTime() === today.getTime()) return t('common.today');
  if (dateStart.getTime() === addDays(today, 1).getTime()) return t('common.tomorrow');
  if (dateStart.getTime() === addDays(today, -1).getTime()) return t('students.yesterday');

  return formatDateShort(dateString);
};

/** "Just now", "2 hours ago", "3 days ago", or a short date once it is over a week old. */
export const getTimeAgo = (timestamp: string): string => {
  const past = new Date(timestamp);
  const diffMs = Date.now() - past.getTime();
  const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
  const diffHours = Math.floor(diffMs / MS_PER_HOUR);
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffMins < 1) return t('requests.justNow');
  if (diffMins < 60) return t('dates.minutesAgo', { count: diffMins });
  if (diffHours < 24) return t('dates.hoursAgo', { count: diffHours });
  if (diffDays < RELATIVE_DAYS_LIMIT) return t('dates.daysAgo', { count: diffDays });
  return formatDateShort(format(past, 'yyyy-MM-dd'));
};
