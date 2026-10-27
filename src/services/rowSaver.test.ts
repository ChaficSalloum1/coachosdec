import { describe, expect, it, vi } from 'vitest';

import { makeRowSaver } from './rowSaver';

// A stand-in for the database client: records the upsert and what was chained on it.
const fakeClient = (result: { error?: { message: string } | null; data?: unknown[] } = { error: null, data: [{}] }) => {
  const log: { table?: string; row?: unknown; options?: unknown; eq?: [string, unknown]; selected?: boolean } = {};
  const query = {
    eq: (column: string, value: unknown) => ((log.eq = [column, value]), query),
    select: () => ((log.selected = true), Promise.resolve({ error: result.error ?? null, data: result.data })),
    then: (resolve: (r: unknown) => void) => resolve({ error: result.error ?? null, data: result.data }),
  };
  const client = {
    from: (table: string) => ({
      upsert: (row: unknown, options: unknown) => ((log.table = table), (log.row = row), (log.options = options), query),
    }),
  };
  return { client, log };
};

const row = { id: 'l1', coachId: 'c1', startTime: '10:00' };

describe('makeRowSaver', () => {
  it('upserts the snake_case row into its table', async () => {
    const { client, log } = fakeClient();
    const save = makeRowSaver({ table: 'lessons', label: 'lesson', versioned: true }, { getUserId: async () => 'c1', getClient: () => client });
    expect(await save(row)).toEqual({ success: true });
    expect(log).toMatchObject({ table: 'lessons', row: { id: 'l1', coach_id: 'c1', start_time: '10:00' }, options: { onConflict: 'id' } });
    expect(log.selected).toBeUndefined(); // no version given: plain upsert
  });

  it('refuses when signed out or when the row belongs to someone else', async () => {
    const { client } = fakeClient();
    const base = { table: 'lessons', label: 'lesson', versioned: true };
    expect(await makeRowSaver(base, { getUserId: async () => undefined, getClient: () => client })(row)).toMatchObject({ success: false, error: expect.stringContaining('authenticated') });
    expect(await makeRowSaver(base, { getUserId: async () => 'someone-else', getClient: () => client })(row)).toMatchObject({ success: false, error: expect.stringContaining('does not match') });
  });

  it('checks the version on versioned tables and reports a conflict when nothing was written', async () => {
    const stale = fakeClient({ error: null, data: [] });
    const save = makeRowSaver({ table: 'lessons', label: 'lesson', versioned: true }, { getUserId: async () => 'c1', getClient: () => stale.client });
    expect(await save(row, 3)).toMatchObject({ success: false, conflict: true });
    expect(stale.log.eq).toEqual(['version', 3]);

    const fresh = fakeClient({ error: null, data: [{}] });
    const ok = makeRowSaver({ table: 'lessons', label: 'lesson', versioned: true }, { getUserId: async () => 'c1', getClient: () => fresh.client });
    expect(await ok(row, 3)).toEqual({ success: true });
  });

  it('ignores a version on tables that are not versioned', async () => {
    const { client, log } = fakeClient();
    const save = makeRowSaver({ table: 'courts', label: 'court', versioned: false }, { getUserId: async () => 'c1', getClient: () => client });
    expect(await save(row, 9)).toEqual({ success: true });
    expect(log.eq).toBeUndefined();
  });

  it('applies prepare before saving and reports database errors', async () => {
    const { client, log } = fakeClient({ error: { message: 'boom' } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const save = makeRowSaver<typeof row & { contact?: string }>(
      { table: 'students', label: 'student', versioned: true, prepare: (r) => ({ ...r, contact: 'enc(' + r.contact + ')' }) },
      { getUserId: async () => 'c1', getClient: () => client }
    );
    expect(await save({ ...row, contact: 'x' })).toEqual({ success: false, error: 'boom' });
    expect(log.row).toMatchObject({ contact: 'enc(x)' });
  });

  it('turns a throw into a failed result', async () => {
    const save = makeRowSaver({ table: 'lessons', label: 'lesson', versioned: false }, { getUserId: async () => { throw new Error('network'); }, getClient: () => ({}) });
    expect(await save(row)).toEqual({ success: false, error: 'network' });
  });
});
