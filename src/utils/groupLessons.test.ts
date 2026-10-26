import { describe, expect, it } from 'vitest';

import {
  DEFAULT_GROUP_CAPACITY,
  buildDayItems,
  buildGroupLessons,
  buildGroupMemberLesson,
  checkCanAddToGroup,
  summarizeGroup,
  summarizeGroups,
  validateGroupCapacity,
  type GroupLessonTemplate,
} from './groupLessons';
import type { Lesson } from '../types/coach';

const template: GroupLessonTemplate = {
  coachId: 'coach-1',
  date: '2026-11-02',
  startTime: '18:00',
  endTime: '19:30',
  duration: 90,
  pricePerPlayer: 25,
  capacity: 4,
  courtId: 'court-1',
};

const idGen = () => {
  let n = 0;
  return () => `lesson-${++n}`;
};

const ana = { id: 's-ana', name: 'Ana' };
const ben = { id: 's-ben', name: 'Ben' };
const cleo = { id: 's-cleo', name: 'Cleo' };

const NOW = '2026-10-26T10:00:00.000Z';

function makeGroup(players = [ana, ben]) {
  return buildGroupLessons({ groupId: 'g1', template, players, now: NOW, newId: idGen() });
}

describe('buildGroupLessons', () => {
  it('creates one linked lesson per player with the shared slot, price and capacity', () => {
    const lessons = makeGroup();

    expect(lessons).toHaveLength(2);
    for (const lesson of lessons) {
      expect(lesson).toMatchObject({
        groupId: 'g1',
        groupCapacity: 4,
        date: '2026-11-02',
        startTime: '18:00',
        endTime: '19:30',
        price: 25,
        courtId: 'court-1',
        status: 'scheduled',
        isPaid: false,
      });
    }
    expect(lessons.map((l) => l.studentName)).toEqual(['Ana', 'Ben']);
  });

  it('gives each lesson a valid timestamp and keeps join order stable', () => {
    const lessons = makeGroup([ana, ben, cleo]);

    for (const lesson of lessons) {
      expect(new Date(lesson.createdAt).toISOString()).toBe(lesson.createdAt);
    }
    expect(summarizeGroup([...lessons].reverse(), 'g1')!.lessons.map((l) => l.studentName)).toEqual([
      'Ana',
      'Ben',
      'Cleo',
    ]);
  });

  it('rejects bad input with readable errors', () => {
    const base = { groupId: 'g1', now: NOW, newId: idGen() };
    expect(() => buildGroupLessons({ ...base, template, players: [] })).toThrow('at least one player');
    expect(() => buildGroupLessons({ ...base, template, players: [ana, ana] })).toThrow('twice');
    expect(() =>
      buildGroupLessons({ ...base, template: { ...template, capacity: 2 }, players: [ana, ben, cleo] })
    ).toThrow('holds 2');
    expect(() =>
      buildGroupLessons({ ...base, template: { ...template, capacity: 1 }, players: [ana] })
    ).toThrow('between 2 and 12');
    expect(() =>
      buildGroupLessons({ ...base, template: { ...template, pricePerPlayer: -5 }, players: [ana] })
    ).toThrow('valid price');
  });
});

describe('summarizeGroup', () => {
  it('counts spots and flags a full group', () => {
    const lessons = makeGroup([ana, ben]);
    expect(summarizeGroup(lessons, 'g1')).toMatchObject({ capacity: 4, spotsLeft: 2, isFull: false, pricePerPlayer: 25 });

    const full = makeGroup([ana, ben, cleo, { id: 's-dan', name: 'Dan' }]);
    expect(summarizeGroup(full, 'g1')).toMatchObject({ spotsLeft: 0, isFull: true });
  });

  it('ignores cancelled players, freeing their spot, and disappears when nobody is left', () => {
    const lessons = makeGroup([ana, ben]);
    const oneCancelled = lessons.map((l) => (l.studentId === 's-ana' ? { ...l, status: 'cancelled' as const } : l));

    expect(summarizeGroup(oneCancelled, 'g1')!.lessons.map((l) => l.studentName)).toEqual(['Ben']);
    expect(summarizeGroup(oneCancelled, 'g1')!.spotsLeft).toBe(3);

    const allCancelled = lessons.map((l) => ({ ...l, status: 'cancelled' as const }));
    expect(summarizeGroup(allCancelled, 'g1')).toBeNull();
  });

  it('falls back to the default capacity for lessons without one', () => {
    const lesson = { ...makeGroup([ana])[0], groupCapacity: undefined };
    expect(summarizeGroup([lesson], 'g1')!.capacity).toBe(DEFAULT_GROUP_CAPACITY);
  });
});

describe('summarizeGroups', () => {
  it('lists groups soonest first and skips ordinary one-to-one lessons', () => {
    const early = buildGroupLessons({
      groupId: 'early',
      template: { ...template, date: '2026-11-01' },
      players: [ana],
      now: NOW,
      newId: idGen(),
    });
    const late = makeGroup([ben]);
    const solo: Lesson = { ...makeGroup([cleo])[0], groupId: undefined, groupCapacity: undefined };

    expect(summarizeGroups([...late, solo, ...early]).map((g) => g.groupId)).toEqual(['early', 'g1']);
  });
});

describe('adding players to an existing group', () => {
  it('builds a lesson with the group slot, price and capacity', () => {
    const group = summarizeGroup(makeGroup([ana]), 'g1')!;
    const lesson = buildGroupMemberLesson({
      group,
      coachId: 'coach-1',
      duration: 90,
      player: ben,
      now: NOW,
      newId: idGen(),
    });

    expect(lesson).toMatchObject({
      studentId: 's-ben',
      groupId: 'g1',
      groupCapacity: 4,
      price: 25,
      startTime: '18:00',
      courtId: 'court-1',
    });
  });

  it('refuses a full group or a duplicate player', () => {
    const full = summarizeGroup(makeGroup([ana, ben, cleo, { id: 's-dan', name: 'Dan' }]), 'g1')!;
    expect(checkCanAddToGroup(full, 's-eve')).toEqual({ ok: false, reason: 'full' });
    expect(() =>
      buildGroupMemberLesson({ group: full, coachId: 'c', duration: 90, player: { id: 's-eve', name: 'Eve' }, now: NOW, newId: idGen() })
    ).toThrow('full');

    const open = summarizeGroup(makeGroup([ana]), 'g1')!;
    expect(checkCanAddToGroup(open, 's-ana')).toEqual({ ok: false, reason: 'already-in-group' });
    expect(() =>
      buildGroupMemberLesson({ group: open, coachId: 'c', duration: 90, player: ana, now: NOW, newId: idGen() })
    ).toThrow('already in this group');
  });

  it('lets a cancelled player rejoin', () => {
    const lessons = makeGroup([ana, ben]).map((l) =>
      l.studentId === 's-ana' ? { ...l, status: 'cancelled' as const } : l
    );
    expect(checkCanAddToGroup(summarizeGroup(lessons, 'g1')!, 's-ana')).toEqual({ ok: true });
  });
});

describe('validateGroupCapacity', () => {
  it('accepts 2 to 12 whole players only', () => {
    expect(() => validateGroupCapacity(2)).not.toThrow();
    expect(() => validateGroupCapacity(12)).not.toThrow();
    expect(() => validateGroupCapacity(13)).toThrow();
    expect(() => validateGroupCapacity(3.5)).toThrow();
  });
});

describe('buildDayItems', () => {
  it('shows each group once, in place, alongside ordinary lessons', () => {
    const solo: Lesson = { ...makeGroup([cleo])[0], id: 'solo', groupId: undefined, groupCapacity: undefined, startTime: '09:00' };
    const group = makeGroup([ana, ben, cleo]);
    const items = buildDayItems([solo, ...group]);

    expect(items.map((i) => i.kind)).toEqual(['lesson', 'group']);
    const groupItem = items[1];
    expect(groupItem.kind === 'group' && groupItem.group.lessons).toHaveLength(3);
  });

  it('hides a group once every player has cancelled, but keeps it while one remains', () => {
    const group = makeGroup([ana, ben]);
    const oneLeft = group.map((l) => (l.studentId === 's-ana' ? { ...l, status: 'cancelled' as const } : l));
    expect(buildDayItems(oneLeft)).toHaveLength(1);

    const noneLeft = group.map((l) => ({ ...l, status: 'cancelled' as const }));
    expect(buildDayItems(noneLeft)).toHaveLength(0);
  });
});
