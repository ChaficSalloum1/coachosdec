import { describe, expect, it } from 'vitest';

import { ensurePluralRules } from './pluralFallback';

// Real Intl objects hide their members from enumeration, as here.
const intlWithoutPluralRules = () => {
  const intl = {};
  Object.defineProperty(intl, 'NumberFormat', { value: function NumberFormat() {}, enumerable: false });
  Object.defineProperty(intl, 'DateTimeFormat', { value: function DateTimeFormat() {}, enumerable: false });
  return intl as { NumberFormat: unknown; DateTimeFormat: unknown; PluralRules?: any };
};

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

  it('keeps the rest of Intl working (NumberFormat and DateTimeFormat survive)', () => {
    const intl = intlWithoutPluralRules();
    const { NumberFormat, DateTimeFormat } = intl;
    const target = { Intl: intl };
    ensurePluralRules(target);
    expect(target.Intl.NumberFormat).toBe(NumberFormat);
    expect(target.Intl.DateTimeFormat).toBe(DateTimeFormat);
    expect(new target.Intl.PluralRules('en').select(1)).toBe('one');
  });

  it('still keeps them when Intl is frozen and cannot be changed', () => {
    const intl = Object.freeze(intlWithoutPluralRules());
    const target = { Intl: intl as { PluralRules?: any } };
    ensurePluralRules(target);
    expect((target.Intl as any).NumberFormat).toBe(intl.NumberFormat);
    expect(new target.Intl.PluralRules('el').select(3)).toBe('other');
  });

  it('leaves a real implementation alone', () => {
    const real = class {};
    const target = { Intl: { PluralRules: real } };
    ensurePluralRules(target);
    expect(target.Intl.PluralRules).toBe(real);
  });
});
