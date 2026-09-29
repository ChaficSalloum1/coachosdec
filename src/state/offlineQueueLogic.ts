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
  const entry: PendingMutation = { ...mutation, id: newId, createdAt: now, attempts: 0 };
  const sameRow = (m: PendingMutation) => m.kind === mutation.kind && m.entityId === mutation.entityId;

  // Deleting a row makes any still-queued upsert of it pointless.
  const base = mutation.operation === 'delete' ? queue.filter((m) => !(sameRow(m) && m.operation === 'upsert')) : queue;

  // A later edit to the same row supersedes the earlier queued one, and takes
  // its place in line: replay order matters because a child row (a lesson)
  // can't be written before its parent (the student) exists.
  const existingIndex = base.findIndex((m) => sameRow(m) && m.operation === mutation.operation);
  if (existingIndex === -1) {
    return [...base, entry];
  }
  return base.map((m, i) => (i === existingIndex ? entry : m));
}

export function applyRemove(queue: PendingMutation[], id: string): PendingMutation[] {
  return queue.filter((m) => m.id !== id);
}

// Once a live write for a row succeeds, anything queued earlier for that row
// is stale and must not be replayed over it.
export function applyRemoveForEntity(
  queue: PendingMutation[],
  kind: MutationKind,
  entityId: string,
  operation: MutationOperation
): PendingMutation[] {
  return queue.filter((m) => !(m.kind === kind && m.entityId === entityId && m.operation === operation));
}

export function applyRecordAttemptFailure(
  queue: PendingMutation[],
  id: string,
  error: string
): PendingMutation[] {
  return queue.map((m) => (m.id === id ? { ...m, attempts: m.attempts + 1, lastError: error } : m));
}
