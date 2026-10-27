/*
One generic "save this row to its table" used by every synced table that only
needs the standard rules: the user must be signed in, the row must belong to
them, and (for versioned tables) a stale version is reported as a conflict.
The database client and user lookup are passed in so the rules are tested.
*/
import { toSnakeCase } from './caseConversion';
import type { SaveResult } from './syncTypes';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RowSaverDeps {
  getUserId: () => Promise<string | undefined>;
  getClient: () => any;
}

export interface RowSaverConfig<T> {
  table: string;
  label: string; // used in error messages, e.g. "student"
  versioned: boolean;
  // Last-moment changes before saving (for example encrypting a field).
  prepare?: (row: T) => T | Promise<T>;
}

export function makeRowSaver<T extends { coachId: string }>(config: RowSaverConfig<T>, deps: RowSaverDeps) {
  return async (row: T, expectedVersion?: number): Promise<SaveResult> => {
    try {
      const userId = await deps.getUserId();
      if (!userId) {
        return { success: false, error: `User must be authenticated to save ${config.label}` };
      }
      if (row.coachId !== userId) {
        return { success: false, error: `Cannot save ${config.label}: coach ID does not match authenticated user` };
      }

      const prepared = config.prepare ? await config.prepare(row) : row;
      let query = deps.getClient().from(config.table).upsert(toSnakeCase(prepared), { onConflict: 'id' });

      const checkVersion = config.versioned && expectedVersion !== undefined;
      if (checkVersion) query = query.eq('version', expectedVersion);

      // Asking for the saved row back lets us notice a version conflict (nothing was written).
      const { error, data } = checkVersion ? await query.select() : await query;

      if (error) {
        console.error(`Error saving ${config.label}:`, error);
        return { success: false, error: error.message };
      }
      if (checkVersion && (!data || data.length === 0)) {
        return { success: false, conflict: true, error: 'Version conflict: data was modified by another client' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };
}
