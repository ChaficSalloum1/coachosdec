/*
The iPhone's JavaScript engine (Hermes) has no Intl.PluralRules. This reproduces
that: with it removed, counted texts must still pick the right form and money
formatting (Intl.NumberFormat) must still work.
*/
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('without Intl.PluralRules', () => {
  const original = Intl.PluralRules;

  beforeEach(() => {
    vi.resetModules();
    delete (Intl as { PluralRules?: unknown }).PluralRules;
  });

  afterEach(() => {
    Object.defineProperty(Intl, 'PluralRules', { value: original, configurable: true, writable: true });
  });

  it('still picks plural forms in English and Greek', async () => {
    const { t, setLanguage } = await import('./index');
    expect(t('students.lessonCount', { count: 1 })).toBe('1 lesson');
    expect(t('students.lessonCount', { count: 3 })).toBe('3 lessons');
    await setLanguage('el');
    expect(t('students.lessonCount', { count: 1 })).toBe('1 μάθημα');
    expect(t('students.lessonCount', { count: 3 })).toBe('3 μαθήματα');
  });

  it('does not break money and date formatting', async () => {
    await import('./index');
    expect(typeof Intl.NumberFormat).toBe('function');
    expect(typeof Intl.DateTimeFormat).toBe('function');
    const { formatMoney } = await import('../modules/payments/currency');
    expect(formatMoney(45, 'GBP')).toBe('£45');
  });
});
