/**
 * Centralized date formatting utilities
 * Replaces duplicate implementations across the codebase
 */

import { format, isToday as isTodayFns, addDays, startOfDay } from 'date-fns';

/**
 * Format date for display in short format
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date (e.g., "Wed, Jan 15")
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'EEE, MMM d');
};

/**
 * Format date for display in long format
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date (e.g., "Wednesday, January 15, 2025")
 */
export const formatDateLong = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'EEEE, MMMM d, yyyy');
};

/**
 * Format date for header display
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date (e.g., "January 15")
 */
export const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'MMMM d');
};

/**
 * Check if a date string is today
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns true if date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  return isTodayFns(date);
};

/**
 * Get ISO date string for today
 * @returns ISO date string (YYYY-MM-DD)
 */
export const getTodayISO = (): string => {
  const today = startOfDay(new Date());
  return format(today, 'yyyy-MM-dd');
};

/**
 * Get ISO date string for a date N days from now
 * @param daysFromNow - Number of days to add (can be negative)
 * @returns ISO date string (YYYY-MM-DD)
 */
export const getDateISO = (daysFromNow: number = 0): string => {
  const date = addDays(startOfDay(new Date()), daysFromNow);
  return format(date, 'yyyy-MM-dd');
};

/**
 * Get day of week from date string
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Day of week (0 = Sunday, 6 = Saturday)
 */
export const getDayOfWeek = (dateString: string): number => {
  const date = new Date(dateString);
  return date.getDay();
};

/**
 * Get day name from date string
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Day name (e.g., "Monday")
 */
export const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'EEEE');
};

/**
 * Get short day name from date string
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Short day name (e.g., "Mon")
 */
export const getDayNameShort = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'EEE');
};

/**
 * Format relative date
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Relative date (e.g., "Today", "Tomorrow", "Yesterday", or formatted date)
 */
export const formatDateRelative = (dateString: string): string => {
  const date = new Date(dateString);
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  const dateStart = startOfDay(date);

  if (dateStart.getTime() === today.getTime()) {
    return 'Today';
  } else if (dateStart.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else if (dateStart.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  return formatDateShort(dateString);
};

/**
 * Get time ago string from timestamp
 * @param timestamp - ISO timestamp string
 * @returns Time ago string (e.g., "2 hours ago", "3 days ago")
 */
export const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDateShort(format(past, 'yyyy-MM-dd'));
  }
};

/**
 * Validate date string format (YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @returns true if valid format
 */
export const isValidDateFormat = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Parse date string safely
 * @param dateString - ISO date string
 * @returns Date object or null if invalid
 */
export const parseDate = (dateString: string): Date | null => {
  if (!isValidDateFormat(dateString)) {
    return null;
  }

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Compare two date strings
 * @param date1 - First ISO date string
 * @param date2 - Second ISO date string
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDate = (date1: string, date2: string): number => {
  return date1.localeCompare(date2);
};

/**
 * Check if date is in the past
 * @param dateString - ISO date string
 * @returns true if date is before today
 */
export const isPast = (dateString: string): boolean => {
  const date = startOfDay(new Date(dateString));
  const today = startOfDay(new Date());
  return date < today;
};

/**
 * Check if date is in the future
 * @param dateString - ISO date string
 * @returns true if date is after today
 */
export const isFuture = (dateString: string): boolean => {
  const date = startOfDay(new Date(dateString));
  const today = startOfDay(new Date());
  return date > today;
};
