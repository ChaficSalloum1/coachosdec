/*
Date formatting for display. Always go through formatLocalized so weekday and
month names follow the app language; machine formats ('yyyy-MM-dd', 'HH:mm')
keep using date-fns `format` directly because they are not words.
*/
import { format } from 'date-fns';
import { el } from 'date-fns/locale/el';
import { enUS } from 'date-fns/locale/en-US';

import { currentLanguage } from './index';

export const dateLocale = () => (currentLanguage() === 'el' ? el : enUS);

export const formatLocalized = (date: Date, pattern: string) => format(date, pattern, { locale: dateLocale() });

// Day-of-week name for 0 (Sunday) to 6 (Saturday), in the app language.
export const weekdayName = (dayOfWeek: number, style: 'short' | 'long' = 'short') =>
  formatLocalized(new Date(2024, 0, 7 + dayOfWeek), style === 'short' ? 'EEE' : 'EEEE'); // 7 Jan 2024 was a Sunday
