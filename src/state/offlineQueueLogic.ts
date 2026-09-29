/*
Pure queue transitions for the offline mutation outbox, kept separate from
the Zustand/AsyncStorage wiring in offlineQueueStore.ts so they're testable
without touching native storage.
*/

export type MutationKind =
  | 'coach'
  | 'student'
  | 'lesson'
  | 'bookingRequest'
  | 'studentNote'
  | 'area'
  | 'facility'
  | 'court'
  | 'availabilityRange'
  | 'blackoutDate';

export type MutationOperation = 'upsert' | 'delete';

export interface PendingMutation {
  id: string;
  kind: MutationKind;
  operation: MutationOperation;
  entityId: string;
  payload?: any; // entity object, required for 'upsert', unused for 'delete'
  expectedVersion?: number;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export type NewMutation = Omit<PendingMutation, 'id' | 'createdAt' | 'attempts' | 'lastError'>;

export function applyEnqueue(
  queue: PendingMutation[],
  mutation: NewMutation,
  newId: string,
  now: string
): PendingMutation[] {
  // A later edit to the same row supersedes an earlier queued one - no
  // point replaying stale intermediate writes.
  const withoutExisting = queue.filter(
    (m) =>
      !(m.kind === mutation.kind && m.entityId === mutation.entityId && m.operation === mutation.operation)
  );
  return [...withoutExisting, { ...mutation, id: newId, createdAt: now, attempts: 0 }];
}

export function applyRemove(queue: PendingMutation[], id: string): PendingMutation[] {
  return queue.filter((m) => m.id !== id);
}

export function applyRecordAttemptFailure(
  queue: PendingMutation[],
  id: string,
  error: string
): PendingMutation[] {
  return queue.map((m) => (m.id === id ? { ...m, attempts: m.attempts + 1, lastError: error } : m));
}
