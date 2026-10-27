import { describe, expect, it } from 'vitest';

import { isUuid } from './ids';

describe('isUuid', () => {
  it('accepts UUIDs in either case and rejects anything else', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440009')).toBe(true);
    expect(isUuid('550E8400-E29B-41D4-A716-446655440009')).toBe(true);
    expect(isUuid('coach_1')).toBe(false);
    expect(isUuid('')).toBe(false);
  });
});
