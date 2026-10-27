import { describe, expect, it } from 'vitest';

import {
  applyEnqueue,
  applyRecordAttemptFailure,
  applyRemove,
  applyRemoveForEntity,
  summarizeSyncQueue,
  type PendingMutation,
} from './offlineQueueLogic';

describe('offline queue', () => {
  it('enqueues a new mutation', () => {
    const queue = applyEnqueue(
      [],
      { kind: 'student', operation: 'upsert', entityId: 's1', payload: { id: 's1' } },
      'id-1',
      '2026-01-01T00:00:00.000Z'
    );

    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      id: 'id-1',
      kind: 'student',
      operation: 'upsert',
      entityId: 's1',
      attempts: 0,
    });
  });

  it('collapses a repeated edit to the same row into the latest write', () => {
    let queue: PendingMutation[] = [];
    queue = applyEnqueue(
      queue,
      { kind: 'student', operation: 'upsert', entityId: 's1', payload: { id: 's1', name: 'first' } },
      'id-1',
      '2026-01-01T00:00:00.000Z'
    );
    queue = applyEnqueue(
      queue,
      { kind: 'student', operation: 'upsert', entityId: 's1', payload: { id: 's1', name: 'second' } },
      'id-2',
      '2026-01-01T00:00:01.000Z'
    );

    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe('id-2');
    expect(queue[0].payload).toMatchObject({ name: 'second' });
  });

  it('keeps separate entries for different rows and operations', () => {
    let queue: PendingMutation[] = [];
    queue = applyEnqueue(queue, { kind: 'student', operation: 'upsert', entityId: 's1', payload: {} }, 'a', 't1');
    queue = applyEnqueue(queue, { kind: 'student', operation: 'delete', entityId: 's2' }, 'b', 't2');
    queue = applyEnqueue(queue, { kind: 'lesson', operation: 'upsert', entityId: 's1', payload: {} }, 'c', 't3');

    expect(queue).toHaveLength(3);
  });

  it('keeps a re-edited row in its original position so parents replay before children', () => {
    let queue: PendingMutation[] = [];
    queue = applyEnqueue(queue, { kind: 'student', operation: 'upsert', entityId: 's1', payload: { v: 1 } }, 'a', 't1');
    queue = applyEnqueue(queue, { kind: 'lesson', operation: 'upsert', entityId: 'l1', payload: {} }, 'b', 't2');
    queue = applyEnqueue(queue, { kind: 'student', operation: 'upsert', entityId: 's1', payload: { v: 2 } }, 'c', 't3');

    expect(queue.map((m) => m.kind)).toEqual(['student', 'lesson']);
    expect(queue[0].payload).toEqual({ v: 2 });
  });

  it('drops a queued upsert when the same row is then deleted', () => {
    let queue: PendingMutation[] = [];
    queue = applyEnqueue(queue, { kind: 'area', operation: 'upsert', entityId: 'a1', payload: {} }, 'a', 't1');
    queue = applyEnqueue(queue, { kind: 'area', operation: 'delete', entityId: 'a1' }, 'b', 't2');

    expect(queue).toHaveLength(1);
    expect(queue[0].operation).toBe('delete');
  });

  it('removes stale queued writes for one row without touching others', () => {
    let queue: PendingMutation[] = [];
    queue = applyEnqueue(queue, { kind: 'student', operation: 'upsert', entityId: 's1', payload: {} }, 'a', 't1');
    queue = applyEnqueue(queue, { kind: 'student', operation: 'upsert', entityId: 's2', payload: {} }, 'b', 't2');
    queue = applyEnqueue(queue, { kind: 'student', operation: 'delete', entityId: 's1' }, 'c', 't3');

    queue = applyRemoveForEntity(queue, 'student', 's1', 'upsert');

    expect(queue.map((m) => `${m.entityId}:${m.operation}`)).toEqual(['s2:upsert', 's1:delete']);
  });

  it('removes a mutation by id', () => {
    let queue: PendingMutation[] = [];
    queue = applyEnqueue(
      queue,
      { kind: 'lesson', operation: 'upsert', entityId: 'l1', payload: { id: 'l1' } },
      'id-1',
      '2026-01-01T00:00:00.000Z'
    );

    queue = applyRemove(queue, 'id-1');

    expect(queue).toHaveLength(0);
  });

  it('records a failed attempt without dropping the mutation', () => {
    let queue: PendingMutation[] = [];
    queue = applyEnqueue(
      queue,
      { kind: 'lesson', operation: 'upsert', entityId: 'l1', payload: { id: 'l1' } },
      'id-1',
      '2026-01-01T00:00:00.000Z'
    );

    queue = applyRecordAttemptFailure(queue, 'id-1', 'network error');
    queue = applyRecordAttemptFailure(queue, 'id-1', 'network error');

    expect(queue).toHaveLength(1);
    expect(queue[0].attempts).toBe(2);
    expect(queue[0].lastError).toBe('network error');
  });
});

describe('summarizeSyncQueue', () => {
  const entry = (attempts: number, lastError?: string) =>
    ({ id: String(Math.random()), kind: 'lesson', operation: 'upsert', entityId: 'e', createdAt: '', attempts, lastError }) as PendingMutation;

  it('is empty when nothing is waiting', () => {
    expect(summarizeSyncQueue([])).toEqual({ pending: 0, stuck: 0, lastError: undefined });
  });

  it('counts waiting changes, and only flags ones that failed repeatedly as stuck', () => {
    const status = summarizeSyncQueue([entry(0), entry(1, 'offline'), entry(4, 'column "series_id" does not exist')]);
    expect(status.pending).toBe(3);
    expect(status.stuck).toBe(1);
    expect(status.lastError).toBe('column "series_id" does not exist');
  });
});
