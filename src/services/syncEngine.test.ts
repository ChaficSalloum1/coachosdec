import { describe, expect, it, vi } from 'vitest';

import { EMPTY_SYNC_STATE, pickSyncState, uploadChanges } from './syncEngine';
import type { SyncedEntity, SyncState } from './syncTypes';

const state = (over: Partial<SyncState>): SyncState => ({ ...EMPTY_SYNC_STATE, ...over });

const setup = (saveResult: { success: boolean; conflict?: boolean } | Error = { success: true }) => {
  const calls: string[] = [];
  const queue = { enqueue: vi.fn(), removeForEntity: vi.fn() };
  const save = vi.fn(async (row: { id: string }) => {
    calls.push(`save:${row.id}`);
    if (saveResult instanceof Error) throw saveResult;
    return saveResult;
  });
  const entities: SyncedEntity[] = [
    { kind: 'court', table: 'courts', storeKey: 'courts', versioned: false, syncDeletes: true, save },
    { kind: 'lesson', table: 'lessons', storeKey: 'lessons', versioned: true, syncDeletes: false, save },
  ];
  const deleteRow = vi.fn(async (table: string, id: string) => {
    calls.push(`delete:${table}:${id}`);
    return { success: true };
  });
  return { calls, queue, save, entities, deleteRow };
};

describe('uploadChanges', () => {
  it('uploads parents before children, in registry order', async () => {
    const t = setup();
    await uploadChanges(
      EMPTY_SYNC_STATE,
      state({ courts: [{ id: 'k1' }] as never, lessons: [{ id: 'l1' }] as never }),
      t.entities,
      t
    );
    expect(t.calls).toEqual(['save:k1', 'save:l1']);
  });

  it('sends the row version only for versioned tables', async () => {
    const t = setup();
    await uploadChanges(
      EMPTY_SYNC_STATE,
      state({ courts: [{ id: 'k1', version: 7 }] as never, lessons: [{ id: 'l1', version: 3 }] as never }),
      t.entities,
      t
    );
    expect(t.save).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'k1' }), undefined);
    expect(t.save).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 'l1' }), 3);
  });

  it('clears older queued writes for a row once a live write succeeds', async () => {
    const t = setup();
    await uploadChanges(EMPTY_SYNC_STATE, state({ lessons: [{ id: 'l1' }] as never }), t.entities, t);
    expect(t.queue.removeForEntity).toHaveBeenCalledWith('lesson', 'l1', 'upsert');
    expect(t.queue.enqueue).not.toHaveBeenCalled();
  });

  it('queues a failed or throwing write, but not a version conflict', async () => {
    const failed = setup({ success: false });
    await uploadChanges(EMPTY_SYNC_STATE, state({ lessons: [{ id: 'l1' }] as never }), failed.entities, failed);
    expect(failed.queue.enqueue).toHaveBeenCalledWith(expect.objectContaining({ kind: 'lesson', operation: 'upsert', entityId: 'l1' }));

    const threw = setup(new Error('offline'));
    await uploadChanges(EMPTY_SYNC_STATE, state({ lessons: [{ id: 'l1' }] as never }), threw.entities, threw);
    expect(threw.queue.enqueue).toHaveBeenCalledTimes(1);

    const conflict = setup({ success: false, conflict: true });
    await uploadChanges(EMPTY_SYNC_STATE, state({ lessons: [{ id: 'l1' }] as never }), conflict.entities, conflict);
    expect(conflict.queue.enqueue).not.toHaveBeenCalled();
  });

  it('deletes removed rows only for tables that sync deletes', async () => {
    const t = setup();
    await uploadChanges(
      state({ courts: [{ id: 'k1' }] as never, lessons: [{ id: 'l1' }] as never }),
      EMPTY_SYNC_STATE,
      t.entities,
      t
    );
    expect(t.calls).toEqual(['delete:courts:k1']);
  });

  it('queues a delete that fails', async () => {
    const t = setup();
    t.deleteRow.mockResolvedValueOnce({ success: false });
    await uploadChanges(state({ courts: [{ id: 'k1' }] as never }), EMPTY_SYNC_STATE, t.entities, t);
    expect(t.queue.enqueue).toHaveBeenCalledWith({ kind: 'court', operation: 'delete', entityId: 'k1' });
  });

  it('uploads nothing when nothing changed', async () => {
    const t = setup();
    const same = state({ lessons: [{ id: 'l1' }] as never });
    await uploadChanges(same, same, t.entities, t);
    expect(t.calls).toEqual([]);
  });
});

describe('pickSyncState', () => {
  it('keeps only the lists named in the registry', () => {
    const t = setup();
    const full = { ...EMPTY_SYNC_STATE, courts: [{ id: 'k1' }], lessons: [{ id: 'l1' }], students: [{ id: 's1' }], coach: { id: 'c' } } as never;
    const picked = pickSyncState(full, t.entities);
    expect(picked.courts).toHaveLength(1);
    expect(picked.lessons).toHaveLength(1);
    expect(picked.students).toEqual([]); // not in this test's registry
    expect('coach' in picked).toBe(false);
  });
});
