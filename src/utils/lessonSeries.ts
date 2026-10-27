/*
Recurring lessons: lessons created together by "Repeat weekly" share a
seriesId, so a coach can cancel "this and all later" in one tap.
*/
import type { Lesson } from '../types/coach';

const startsAt = (lesson: Lesson) => `${lesson.date} ${lesson.startTime}`;

// Active lessons in the same series that start at or after `lesson`, including
// it. Group series return every player's lesson. Empty for a one-off lesson.
export function futureSeriesLessons(lessons: Lesson[], lesson: Lesson): Lesson[] {
  if (!lesson.seriesId) return [];
  const from = startsAt(lesson);
  return lessons
    .filter((l) => l.seriesId === lesson.seriesId && l.status !== 'cancelled' && startsAt(l) >= from)
    .sort((a, b) => startsAt(a).localeCompare(startsAt(b)));
}

// How many later weeks "this and all later" would also cancel.
export function laterSeriesCount(lessons: Lesson[], lesson: Lesson): number {
  const ownSlot = (l: Lesson) => `${l.date} ${l.startTime}`;
  const slots = new Set(futureSeriesLessons(lessons, lesson).map(ownSlot));
  slots.delete(ownSlot(lesson));
  return slots.size;
}
