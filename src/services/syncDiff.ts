/*
What changed between two lists of rows, so the sync only uploads the
difference. Pure and keyed by id, so it is O(n) and testable.
*/

export interface EntityDiff<T> {
  created: T[];
  updated: T[];
  deleted: T[];
}

export function diffEntities<T extends { id: string }>(previous: T[], next: T[]): EntityDiff<T> {
  if (previous === next) return { created: [], updated: [], deleted: [] };

  const before = new Map(previous.map((row) => [row.id, row]));
  const after = new Set(next.map((row) => row.id));

  const created: T[] = [];
  const updated: T[] = [];
  for (const row of next) {
    const old = before.get(row.id);
    if (!old) created.push(row);
    else if (old !== row && JSON.stringify(old) !== JSON.stringify(row)) updated.push(row);
  }
  const deleted = previous.filter((row) => !after.has(row.id));
  return { created, updated, deleted };
}
