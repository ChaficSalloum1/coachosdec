import { describe, expect, it } from 'vitest';

import { ensurePluralRules } from './pluralFallback';

describe('ensurePluralRules', () => {
  it('adds a one/other rule when the engine has none', () => {
    const target: { Intl?: { PluralRules?: any } } = {};
    ensurePluralRules(target);
    const rules = new target.Intl!.PluralRules('el');
    expect(rules.select(1)).toBe('one');
    expect(rules.select(0)).toBe('other');
    expect(rules.select(2)).toBe('other');
    expect(rules.resolvedOptions().pluralCategories).toEqual(['one', 'other']);
  });

  it('leaves a real implementation alone', () => {
    const real = class {};
    const target = { Intl: { PluralRules: real } };
    ensurePluralRules(target);
    expect(target.Intl.PluralRules).toBe(real);
  });
});
