import { describe, expect, it } from 'vitest';

import { diffEntities } from './syncDiff';

type Row = { id: string; name: string };
const row = (id: string, name = id): Row => ({ id, name });

describe('diffEntities', () => {
  it('finds created, updated and deleted rows by id', () => {
    const result = diffEntities<Row>([row('a'), row('b'), row('c')], [row('a'), row('b', 'B2'), row('d')]);
    expect(result.created).toEqual([row('d')]);
    expect(result.updated).toEqual([row('b', 'B2')]);
    expect(result.deleted).toEqual([row('c')]);
  });

  it('reports nothing for the same list or equal contents', () => {
    const list = [row('a')];
    expect(diffEntities(list, list)).toEqual({ created: [], updated: [], deleted: [] });
    expect(diffEntities([row('a')], [row('a')])).toEqual({ created: [], updated: [], deleted: [] });
  });

  it('treats everything as created against an empty baseline', () => {
    expect(diffEntities<Row>([], [row('a'), row('b')]).created).toHaveLength(2);
  });

  it('handles large lists without quadratic work', () => {
    const big = Array.from({ length: 20000 }, (_, i) => row(String(i)));
    const next = [...big.slice(0, 19999), row('20000')];
    const started = Date.now();
    const result = diffEntities(big, next);
    expect(Date.now() - started).toBeLessThan(500);
    expect(result.created).toHaveLength(1);
    expect(result.deleted).toHaveLength(1);
  });
});
