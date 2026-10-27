/*
Earnings summary for the coach: what was paid and what is still outstanding
for lessons dated in this week and this month. Cancelled lessons never count.
Pure so it can be tested.
*/
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';

import type { Lesson } from '../types/coach';

export interface PeriodIncome {
  paid: number;
  outstanding: number;
  lessons: number;
}

export interface IncomeSummary {
  week: PeriodIncome;
  month: PeriodIncome;
}

const sum = (lessons: Lesson[], pick: (l: Lesson) => boolean) =>
  lessons.filter(pick).reduce((total, l) => total + l.price, 0);

function periodIncome(lessons: Lesson[], from: string, to: string): PeriodIncome {
  const inPeriod = lessons.filter((l) => l.status !== 'cancelled' && l.date >= from && l.date <= to);
  return {
    paid: sum(inPeriod, (l) => l.isPaid),
    outstanding: sum(inPeriod, (l) => !l.isPaid),
    lessons: inPeriod.length,
  };
}

export function summarizeIncome(lessons: Lesson[], now: Date = new Date()): IncomeSummary {
  const day = (d: Date) => format(d, 'yyyy-MM-dd');
  return {
    week: periodIncome(lessons, day(startOfWeek(now, { weekStartsOn: 1 })), day(endOfWeek(now, { weekStartsOn: 1 }))),
    month: periodIncome(lessons, day(startOfMonth(now)), day(endOfMonth(now))),
  };
}
