/*
Group lessons: several players in one session. Each player keeps their own
Lesson (own price, payment status, notes, totals); lessons that share a
groupId are the same session. This module is the pure logic: summarising
groups and building/validating the lessons. The store wires it to state.
*/
import { GROUPS } from '../config/appSettings';
import type { Lesson } from '../types/coach';
import { t } from '../i18n';

export interface LessonGroup {
  groupId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  pricePerPlayer: number;
  areaId?: string;
  facilityId?: string;
  courtId?: string;
  lessons: Lesson[]; // active (not cancelled), in the order players joined
  spotsLeft: number;
  isFull: boolean;
}

const isActive = (lesson: Lesson) => lesson.status !== 'cancelled';

const byJoinOrder = (a: Lesson, b: Lesson) => a.createdAt.localeCompare(b.createdAt);

function toGroup(groupId: string, members: Lesson[]): LessonGroup | null {
  const lessons = members.filter(isActive).sort(byJoinOrder);
  if (lessons.length === 0) return null;

  const first = lessons[0];
  const capacity = Math.max(first.groupCapacity ?? GROUPS.defaultCapacity, lessons.length);
  const spotsLeft = capacity - lessons.length;

  return {
    groupId,
    date: first.date,
    startTime: first.startTime,
    endTime: first.endTime,
    capacity,
    pricePerPlayer: first.price,
    areaId: first.areaId,
    facilityId: first.facilityId,
    courtId: first.courtId,
    lessons,
    spotsLeft,
    isFull: spotsLeft === 0,
  };
}

export function summarizeGroup(lessons: Lesson[], groupId: string): LessonGroup | null {
  return toGroup(groupId, lessons.filter((l) => l.groupId === groupId));
}

// Every group that still has at least one active player, soonest first.
export function summarizeGroups(lessons: Lesson[]): LessonGroup[] {
  const byGroup = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    if (!lesson.groupId) continue;
    const members = byGroup.get(lesson.groupId);
    if (members) members.push(lesson);
    else byGroup.set(lesson.groupId, [lesson]);
  }

  const groups: LessonGroup[] = [];
  byGroup.forEach((members, groupId) => {
    const group = toGroup(groupId, members);
    if (group) groups.push(group);
  });

  return groups.sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
  );
}

export type DayItem = { kind: 'lesson'; lesson: Lesson } | { kind: 'group'; group: LessonGroup };

// What a day's list shows: ordinary lessons as they are, and each group as ONE
// entry at the position of its first lesson. A group whose players are all
// cancelled disappears.
export function buildDayItems(lessons: Lesson[]): DayItem[] {
  const seenGroups = new Set<string>();
  const items: DayItem[] = [];

  for (const lesson of lessons) {
    if (!lesson.groupId) {
      items.push({ kind: 'lesson', lesson });
      continue;
    }
    if (seenGroups.has(lesson.groupId)) continue;
    seenGroups.add(lesson.groupId);

    const group = summarizeGroup(lessons, lesson.groupId);
    if (group) items.push({ kind: 'group', group });
  }
  return items;
}

export type AddToGroupCheck = { ok: true } | { ok: false; reason: 'full' | 'already-in-group' };

export function checkCanAddToGroup(group: LessonGroup, studentId: string): AddToGroupCheck {
  if (group.lessons.some((l) => l.studentId === studentId)) {
    return { ok: false, reason: 'already-in-group' };
  }
  if (group.isFull) {
    return { ok: false, reason: 'full' };
  }
  return { ok: true };
}

export function validateGroupCapacity(capacity: number): void {
  if (!Number.isInteger(capacity) || capacity < GROUPS.minCapacity || capacity > GROUPS.maxCapacity) {
    throw new Error(
      t('errors.groupCapacityRange', { min: GROUPS.minCapacity, max: GROUPS.maxCapacity })
    );
  }
}

export interface GroupLessonTemplate {
  coachId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  pricePerPlayer: number;
  capacity: number;
  areaId?: string;
  facilityId?: string;
  courtId?: string;
  seriesId?: string;
}

export interface GroupPlayer {
  id: string;
  name: string;
}

function buildLesson(
  template: GroupLessonTemplate,
  groupId: string,
  player: GroupPlayer,
  now: string,
  newId: () => string
): Lesson {
  return {
    id: newId(),
    coachId: template.coachId,
    studentId: player.id,
    studentName: player.name,
    date: template.date,
    startTime: template.startTime,
    endTime: template.endTime,
    duration: template.duration,
    price: template.pricePerPlayer,
    isPaid: false,
    status: 'scheduled',
    createdAt: now,
    areaId: template.areaId,
    facilityId: template.facilityId,
    courtId: template.courtId,
    groupId,
    groupCapacity: template.capacity,
    ...(template.seriesId ? { seriesId: template.seriesId } : {}),
  };
}

// New group with its first players. Throws a coach-readable Error on bad input.
export function buildGroupLessons(args: {
  groupId: string;
  template: GroupLessonTemplate;
  players: GroupPlayer[];
  now: string;
  newId: () => string;
}): Lesson[] {
  const { groupId, template, players, now, newId } = args;

  validateGroupCapacity(template.capacity);
  if (players.length === 0) {
    throw new Error(t('errors.groupNeedsPlayer'));
  }
  if (players.length > template.capacity) {
    throw new Error(t('errors.groupOverCapacity', { capacity: template.capacity, count: players.length }));
  }
  if (new Set(players.map((p) => p.id)).size !== players.length) {
    throw new Error(t('errors.playerAddedTwice'));
  }
  if (!(template.pricePerPlayer >= 0)) {
    throw new Error(t('errors.invalidGroupPrice'));
  }

  return players.map((player, i) =>
    // 1ms apart keeps join order stable when sorting, and stays a valid timestamp.
    buildLesson(template, groupId, player, new Date(new Date(now).getTime() + i).toISOString(), newId)
  );
}

// One more player joining an existing group, with the group's own price/slot.
export function buildGroupMemberLesson(args: {
  group: LessonGroup;
  coachId: string;
  duration: number;
  player: GroupPlayer;
  now: string;
  newId: () => string;
}): Lesson {
  const { group, coachId, duration, player, now, newId } = args;

  const check = checkCanAddToGroup(group, player.id);
  if (!check.ok) {
    throw new Error(
      check.reason === 'full'
        ? t('errors.groupFull')
        : t('errors.alreadyInGroup', { name: player.name })
    );
  }

  return buildLesson(
    {
      coachId,
      date: group.date,
      startTime: group.startTime,
      endTime: group.endTime,
      duration,
      pricePerPlayer: group.pricePerPlayer,
      capacity: group.capacity,
      areaId: group.areaId,
      facilityId: group.facilityId,
      courtId: group.courtId,
    },
    group.groupId,
    player,
    now,
    newId
  );
}
