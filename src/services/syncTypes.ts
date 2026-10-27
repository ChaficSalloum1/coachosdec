import type { MutationKind, NewMutation } from '../state/offlineQueueLogic';
import type { CoachState } from '../state/slices';

export type SaveResult = { success: boolean; error?: string; conflict?: boolean };

// The lists in the store that are mirrored to the server.
export type SyncedStoreKey =
  | 'areas'
  | 'facilities'
  | 'courts'
  | 'students'
  | 'lessons'
  | 'bookingRequests'
  | 'studentNotes'
  | 'availabilityRanges'
  | 'blackoutDates';

export type SyncState = Pick<CoachState, SyncedStoreKey>;

// One kind of row the app syncs. Adding a new synced table means adding one
// entry to SYNCED_ENTITIES (src/services/syncRegistry.ts); nothing else changes.
export interface SyncedEntity {
  kind: MutationKind;
  table: string;
  // The store list this mirrors; absent for the coach profile, which is saved on its own.
  storeKey?: SyncedStoreKey;
  // Rows carry a version number that is sent with each update.
  versioned: boolean;
  // Removing a row locally also removes (soft-deletes) it on the server.
  syncDeletes: boolean;
  save: (entity: any, expectedVersion?: number) => Promise<SaveResult>;
}

export interface SyncQueueApi {
  enqueue: (mutation: NewMutation) => void;
  removeForEntity: (kind: MutationKind, entityId: string, operation: 'upsert' | 'delete') => void;
}
