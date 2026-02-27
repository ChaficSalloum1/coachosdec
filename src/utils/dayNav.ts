import { addDays, format, parseISO, startOfDay, startOfWeek, differenceInDays } from 'date-fns';

// DST-safe day navigation helpers using date-fns
// Handles Daylight Saving Time transitions properly to prevent day skipping
export function todayISO(): string {
  return format(startOfDay(new Date()), 'yyyy-MM-dd');
}

export function addDaysISO(dateISO: string, n: number): string {
  const date = parseISO(dateISO);
  const newDate = addDays(date, n);
  return format(newDate, 'yyyy-MM-dd');
}

export function isToday(dateISO: string): boolean {
  return dateISO === todayISO();
}

export function formatHeaderDate(dateISO: string): string {
  const date = parseISO(dateISO);
  return format(date, 'EEEE, MMM d'); // Thursday, Oct 10
}

// Additional utility functions for better date handling
export function createDateFromISO(dateISO: string): Date {
  return parseISO(dateISO);
}

export function formatDateForDisplay(date: Date): string {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  const tomorrow = addDays(today, 1);
  
  if (format(targetDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    return 'Today';
  } else if (format(targetDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
    return 'Tomorrow';
  } else {
    return format(targetDate, 'EEE, MMM d');
  }
}

// Smart navigation helpers
export function getNextLessonDay(currentDate: string, lessons: Array<{ date: string; status: string }>): string {
  const current = parseISO(currentDate);
  const futureLessons = lessons
    .filter(l => {
      const lessonDate = parseISO(l.date);
      return lessonDate > current && l.status !== 'cancelled';
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return futureLessons.length > 0 ? futureLessons[0].date : todayISO();
}

export function getPreviousLessonDay(currentDate: string, lessons: Array<{ date: string; status: string }>): string {
  const current = parseISO(currentDate);
  const pastLessons = lessons
    .filter(l => {
      const lessonDate = parseISO(l.date);
      return lessonDate < current && l.status !== 'cancelled';
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  
  return pastLessons.length > 0 ? pastLessons[0].date : todayISO();
}

export function getDayOfWeek(dateISO: string): number {
  return parseISO(dateISO).getDay(); // 0 = Sunday, 6 = Saturday
}

export function getWeekDates(dateISO: string): string[] {
  const date = parseISO(dateISO);
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Start on Sunday
  
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return format(day, 'yyyy-MM-dd');
  });
}

export function getTimeOfDayColor(timeString: string): string {
  const hour = parseInt(timeString.split(':')[0]);
  
  if (hour >= 6 && hour < 12) return '#F59E0B'; // Morning: amber
  if (hour >= 12 && hour < 18) return '#007AFF'; // Afternoon: blue
  if (hour >= 18 && hour < 22) return '#8B5CF6'; // Evening: purple
  return '#6B7280'; // Night: grey
}

export function getTimeOfDayPeriod(timeString: string): string {
  const hour = parseInt(timeString.split(':')[0]);
  
  if (hour >= 6 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 18) return 'Afternoon';
  if (hour >= 18 && hour < 22) return 'Evening';
  return 'Night';
}

export function getDaysDifference(date1ISO: string, date2ISO: string): number {
  return differenceInDays(parseISO(date1ISO), parseISO(date2ISO));
}
