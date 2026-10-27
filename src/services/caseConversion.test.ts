import { describe, expect, it } from 'vitest';

import { toCamelCase, toSnakeCase } from './caseConversion';

describe('case conversion', () => {
  it('converts keys deeply and leaves values alone', () => {
    expect(toSnakeCase({ coachId: 'c', paymentSettings: { cashEnabled: true }, list: [{ startTime: '10:00' }] })).toEqual({
      coach_id: 'c',
      payment_settings: { cash_enabled: true },
      list: [{ start_time: '10:00' }],
    });
    expect(toCamelCase({ coach_id: 'c', payment_settings: { cash_enabled: true }, list: [{ start_time: '10:00' }] })).toEqual({
      coachId: 'c',
      paymentSettings: { cashEnabled: true },
      list: [{ startTime: '10:00' }],
    });
  });

  it('passes through null, undefined and primitives', () => {
    expect(toSnakeCase(null)).toBeNull();
    expect(toCamelCase(undefined)).toBeUndefined();
    expect(toSnakeCase('fooBar')).toBe('fooBar');
  });
});
