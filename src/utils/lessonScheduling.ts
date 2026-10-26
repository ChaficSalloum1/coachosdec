/*
Logic behind the fast Add Lesson sheet: which start times are free, who to
suggest, what length and price to prefill, and whether a time double-books.
Pure functions so the sheet itself stays thin.
*/
import type { AvailabilityRange, Lesson, Student } from '../types/coach';

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const formatTime12 = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const isActive = (lesson: Lesson) => lesson.status !== 'cancelled';

const overlaps = (startA: number, endA: number, startB: number, endB: number) =>
  startA < endB && endA > startB;

const localDateString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Used only when a coach hasn't set up any availability yet.
const FALLBACK_WINDOW = { start: '08:00', end: '21:00' };

export function suggestFreeStartTimes(args: {
  date: string; // yyyy-MM-dd
  durationMinutes: number;
  availabilityRanges: AvailabilityRange[];
  blackoutDates: { date: string }[];
  lessons: Lesson[];
  now?: Date;
  stepMinutes?: number;
  limit?: number;
}): string[] {
  const { date, durationMinutes, availabilityRanges, blackoutDates, lessons } = args;
  const step = args.stepMinutes ?? 30;
  const limit = args.limit ?? 8;
  const now = args.now ?? new Date();

  if (blackoutDates.some((b) => b.date === date)) return [];

  const weekday = new Date(`${date}T12:00:00`).getDay();
  let windows: { start: number; end: number }[];

  if (availabilityRanges.length === 0) {
    windows = [{ start: toMinutes(FALLBACK_WINDOW.start), end: toMinutes(FALLBACK_WINDOW.end) }];
  } else {
    windows = availabilityRanges
      .filter((r) => r.dayOfWeek === weekday)
      .map((r) => ({ start: toMinutes(r.startTime), end: toMinutes(r.endTime) }));
  }

  const booked = lessons
    .filter((l) => isActive(l) && l.date === date)
    .map((l) => ({ start: toMinutes(l.startTime), end: toMinutes(l.endTime) }));

  const earliestToday = localDateString(now) === date ? now.getHours() * 60 + now.getMinutes() : -1;

  const times = new Set<number>();
  for (const window of windows) {
    for (let start = window.start; start + durationMinutes <= window.end; start += step) {
      if (start <= earliestToday) continue;
      if (booked.some((b) => overlaps(start, start + durationMinutes, b.start, b.end))) continue;
      times.add(start);
    }
  }

  return [...times].sort((a, b) => a - b).slice(0, limit).map(toHHMM);
}

// Existing lessons that this time would double-book. A group counts once.
export function findConflicts(args: {
  date: string;
  startTime: string; // HH:mm
  durationMinutes: number;
  lessons: Lesson[];
}): Lesson[] {
  const start = toMinutes(args.startTime);
  const end = start + args.durationMinutes;

  const clashing = args.lessons.filter(
    (l) => isActive(l) && l.date === args.date && overlaps(start, end, toMinutes(l.startTime), toMinutes(l.endTime))
  );

  const seen = new Set<string>();
  return clashing.filter((l) => {
    const key = l.groupId ?? l.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Students ordered by who the coach taught most recently; never-taught students follow, A to Z.
export function getRecentStudents(lessons: Lesson[], students: Student[], limit = 6): Student[] {
  const lastSeen = new Map<string, string>();
  for (const lesson of lessons) {
    if (!isActive(lesson)) continue;
    const stamp = `${lesson.date} ${lesson.startTime}`;
    const prev = lastSeen.get(lesson.studentId);
    if (!prev || stamp > prev) lastSeen.set(lesson.studentId, stamp);
  }

  const taught = students
    .filter((s) => lastSeen.has(s.id))
    .sort((a, b) => lastSeen.get(b.id)!.localeCompare(lastSeen.get(a.id)!));
  const rest = students
    .filter((s) => !lastSeen.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...taught, ...rest].slice(0, limit);
}

const latestFirst = (a: Lesson, b: Lesson) =>
  `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`);

export const DEFAULT_DURATION_MINUTES = 60;

// The length this student usually books, else the coach's most recent, else an hour.
export function suggestDuration(lessons: Lesson[], studentId?: string): number {
  const active = lessons.filter(isActive).sort(latestFirst);
  const forStudent = studentId ? active.find((l) => l.studentId === studentId) : undefined;
  return (forStudent ?? active[0])?.duration ?? DEFAULT_DURATION_MINUTES;
}

// What this student paid last time for the same length, else the coach's hourly rate scaled.
export function suggestPrice(args: {
  lessons: Lesson[];
  studentId?: string;
  durationMinutes: number;
  pricePerHour: number;
}): number {
  const { lessons, studentId, durationMinutes, pricePerHour } = args;
  const previous = studentId
    ? lessons
        .filter((l) => isActive(l) && l.studentId === studentId && l.duration === durationMinutes && !l.groupId)
        .sort(latestFirst)[0]
    : undefined;
  if (previous) return previous.price;
  return Math.round((durationMinutes / 60) * pricePerHour);
}
