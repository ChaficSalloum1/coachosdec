import { describe, expect, it } from 'vitest';

import {
  applyEnqueue,
  applyRecordAttemptFailure,
  applyRemove,
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

  it('keeps an upsert and a delete for the same entity as separate entries', () => {
    let queue: PendingMutation[] = [];
    queue = applyEnqueue(
      queue,
      { kind: 'student', operation: 'upsert', entityId: 's1', payload: { id: 's1' } },
      'id-1',
      '2026-01-01T00:00:00.000Z'
    );
    queue = applyEnqueue(
      queue,
      { kind: 'student', operation: 'delete', entityId: 's1' },
      'id-2',
      '2026-01-01T00:00:01.000Z'
    );

    expect(queue).toHaveLength(2);
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
