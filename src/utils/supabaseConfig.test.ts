import { describe, expect, it } from 'vitest';

import { hasSupabaseCredentials } from './supabaseConfig';

describe('hasSupabaseCredentials', () => {
  it('accepts a real-looking url and key', () => {
    expect(hasSupabaseCredentials('https://abc.supabase.co', 'eyJhbGciOi')).toBe(true);
  });

  it('rejects missing or empty values', () => {
    expect(hasSupabaseCredentials(undefined, 'key')).toBe(false);
    expect(hasSupabaseCredentials('https://abc.supabase.co', undefined)).toBe(false);
    expect(hasSupabaseCredentials('', '')).toBe(false);
  });

  it('rejects the your_supabase placeholders in either value', () => {
    expect(hasSupabaseCredentials('https://your_supabase_url', 'eyJhbGciOi')).toBe(false);
    expect(hasSupabaseCredentials('https://abc.supabase.co', 'your_supabase_anon_key')).toBe(false);
  });
});
