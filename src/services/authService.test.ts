import { describe, expect, it } from 'vitest';

import { makeAuthError, normalizeAuthError, readableAuthError } from './authErrors';

describe('authService', () => {
  it('turns JSON parse failures into actionable auth copy', () => {
    const error = normalizeAuthError(new Error('JSON Parse error: Unexpected character: <'));

    expect(error.message).toContain('Authentication could not read the server response');
    expect(error.message).toContain('Supabase URL');
  });

  it('replaces an empty or blank server error with a readable message', () => {
    expect(normalizeAuthError(new Error('{}')).message).toBe('Authentication failed. Please try again.');
    expect(normalizeAuthError(new Error('  ')).message).toBe('Authentication failed. Please try again.');
  });

  it('replaces a blank error Supabase returned, and passes real ones through', () => {
    expect(readableAuthError(makeAuthError('{}'))?.message).toBe('Authentication failed. Please try again.');
    const real = makeAuthError('Invalid login credentials');
    expect(readableAuthError(real)).toBe(real);
    expect(readableAuthError(null)).toBeNull();
  });

  it('keeps normal auth errors readable', () => {
    const error = normalizeAuthError(new Error('Invalid login credentials'));

    expect(error.message).toBe('Invalid login credentials');
  });
});
