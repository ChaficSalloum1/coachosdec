import { describe, expect, it } from 'vitest';

import {
  CURRENCY_CODES,
  DEFAULT_CURRENCY,
  formatMoney,
  formatMoneyFromCents,
  isCurrencyCode,
  resolveCurrency,
} from './currency';
import {
  buildPaymentRequestMessage,
  coachPaymentSettingsSchema,
  createInstructionFromSettings,
  normalizePaymentSettings,
} from './index';

describe('currency helpers', () => {
  it('recognises only supported codes and falls back to the default', () => {
    expect(isCurrencyCode('GBP')).toBe(true);
    expect(isCurrencyCode('XYZ')).toBe(false);
    expect(isCurrencyCode(undefined)).toBe(false);
    expect(resolveCurrency('USD')).toBe('USD');
    expect(resolveCurrency('nonsense')).toBe(DEFAULT_CURRENCY);
    expect(resolveCurrency(undefined)).toBe('EUR');
  });

  it('formats screen prices without decimals when whole', () => {
    expect(formatMoney(25, 'EUR')).toBe('€25');
    expect(formatMoney(22.5, 'EUR')).toBe('€22.50');
    expect(formatMoney(25, 'USD')).toBe('$25');
    expect(formatMoney(25, 'GBP')).toBe('£25');
  });

  it('formats payment amounts from cents with two decimals', () => {
    expect(formatMoneyFromCents(4500, 'EUR')).toBe('€45.00');
    expect(formatMoneyFromCents(4500, 'USD')).toBe('$45.00');
  });

  it('can format every supported currency', () => {
    for (const code of CURRENCY_CODES) {
      expect(formatMoney(25, code)).toContain('25');
    }
  });
});

describe('currency in payment settings', () => {
  it('keeps a chosen currency through normalization and defaults old data to EUR', () => {
    expect(normalizePaymentSettings({ paymentPreference: 'CASH', cashEnabled: true, currency: 'GBP' }).currency).toBe('GBP');
    expect(normalizePaymentSettings({ paymentPreference: 'CASH', cashEnabled: true }).currency).toBe('EUR');
    expect(normalizePaymentSettings(undefined).currency).toBe('EUR');
  });

  it('writes the coach currency into payment instructions and messages', () => {
    const instruction = createInstructionFromSettings({
      settings: { paymentPreference: 'CASH', cashEnabled: true, currency: 'USD' },
      amountCents: 4500,
      reference: 'REF1',
    });
    expect(instruction.currency).toBe('USD');
    expect(instruction.displayText).toContain('$45.00');

    const message = buildPaymentRequestMessage({
      coachName: 'Nikos',
      clientName: 'Ana',
      sessionTitle: 'lesson',
      startsAt: 'Monday',
      amountCents: 4500,
      currency: 'USD',
      paymentInstructions: instruction.displayText,
    });
    expect(message).toContain('Amount: $45.00');
  });

  it('only offers the bank-transfer QR for euros', () => {
    const bank = { paymentPreference: 'IBAN' as const, cashEnabled: true, iban: 'GR1601101250000000012300695', ibanBeneficiaryName: 'Nikos P' };
    expect(createInstructionFromSettings({ settings: { ...bank, currency: 'EUR' }, method: 'IBAN', amountCents: 4500, reference: 'R' }).qrPayload).toContain('EUR45.00');
    expect(createInstructionFromSettings({ settings: { ...bank, currency: 'GBP' }, method: 'IBAN', amountCents: 4500, reference: 'R' }).qrPayload).toBeUndefined();
  });

  it('accepts a supported currency in the settings schema and rejects others', () => {
    expect(() => coachPaymentSettingsSchema.parse({ cashEnabled: true, currency: 'USD' })).not.toThrow();
    expect(() => coachPaymentSettingsSchema.parse({ cashEnabled: true, currency: 'XYZ' })).toThrow();
  });
});
