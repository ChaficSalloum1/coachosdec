/*
The upload half of syncing: given what the server is known to hold and what
the store holds now, send the difference. A write that fails is queued for
retry instead of being lost. Pure of React and of storage (the queue and the
delete call are passed in), so the rules are tested.
*/
import { diffEntities } from './syncDiff';
import type { SaveResult, SyncedEntity, SyncQueueApi, SyncState } from './syncTypes';

export const EMPTY_SYNC_STATE: SyncState = {
  areas: [],
  facilities: [],
  courts: [],
  students: [],
  lessons: [],
  bookingRequests: [],
  studentNotes: [],
  availabilityRanges: [],
  blackoutDates: [],
};

// The synced lists of a store state, as listed in the registry.
export function pickSyncState(state: SyncState, entities: SyncedEntity[]): SyncState {
  const picked: Partial<SyncState> = {};
  for (const entity of entities) {
    if (entity.storeKey) (picked as Record<string, unknown>)[entity.storeKey] = state[entity.storeKey];
  }
  return { ...EMPTY_SYNC_STATE, ...picked };
}

interface UploadDeps {
  queue: SyncQueueApi;
  deleteRow: (table: string, id: string) => Promise<SaveResult>;
}

type Row = { id: string; version?: number };

// Saves one row live; on failure (offline, request error, or a throw) it goes
// to the outbox for later. A version conflict is not queued: the row already
// moved on server-side, so replaying this stale write could never succeed.
async function upsertRow(entity: SyncedEntity, row: Row, queue: SyncQueueApi): Promise<void> {
  const expectedVersion = entity.versioned ? row.version : undefined;
  const enqueue = () =>
    queue.enqueue({ kind: entity.kind, operation: 'upsert', entityId: row.id, payload: row, expectedVersion });

  try {
    const result = await entity.save(row, expectedVersion);
    if (result.conflict) return;
    if (result.success) {
      // This write is newer than anything queued earlier for the same row;
      // replaying the queued one later would overwrite it with stale data.
      queue.removeForEntity(entity.kind, row.id, 'upsert');
    } else {
      enqueue();
    }
  } catch {
    enqueue();
  }
}

async function deleteRow(entity: SyncedEntity, id: string, deps: UploadDeps): Promise<void> {
  const enqueue = () => deps.queue.enqueue({ kind: entity.kind, operation: 'delete', entityId: id });
  try {
    const result = await deps.deleteRow(entity.table, id);
    if (result.success) deps.queue.removeForEntity(entity.kind, id, 'delete');
    else if (!result.conflict) enqueue();
  } catch {
    enqueue();
  }
}

// Uploads everything that differs between `previous` and `next`, table by table in order.
export async function uploadChanges(
  previous: SyncState,
  next: SyncState,
  entities: SyncedEntity[],
  deps: UploadDeps
): Promise<void> {
  for (const entity of entities) {
    if (!entity.storeKey) continue;
    const { created, updated, deleted } = diffEntities<Row>(previous[entity.storeKey] as Row[], next[entity.storeKey] as Row[]);

    for (const row of [...created, ...updated]) {
      await upsertRow(entity, row, deps.queue);
    }
    if (entity.syncDeletes) {
      for (const row of deleted) {
        await deleteRow(entity, row.id, deps);
      }
    }
  }
}
