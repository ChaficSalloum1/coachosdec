import { describe, expect, it } from 'vitest';

import { normalizeAuthError } from './authErrors';

describe('authService', () => {
  it('turns JSON parse failures into actionable auth copy', () => {
    const error = normalizeAuthError(new Error('JSON Parse error: Unexpected character: <'));

    expect(error.message).toContain('Authentication could not read the server response');
    expect(error.message).toContain('Supabase URL');
  });

  it('keeps normal auth errors readable', () => {
    const error = normalizeAuthError(new Error('Invalid login credentials'));

    expect(error.message).toBe('Invalid login credentials');
  });
});
