import { describe, expect, it } from 'vitest';

import {
  buildPaymentReminderMessage,
  buildPaymentRequestMessage,
  buildSepaQrPayload,
  canSendPaymentReminder,
  coachPaymentSettingsSchema,
  createPaymentInstruction,
  formatEuro,
  generatePaymentReferenceCode,
  normalizePaymentStatus,
  requestPaymentStatus,
  sendReminderStatus,
} from './index';

describe('payment utilities', () => {
  it('generates a readable Coachiko reference', () => {
    expect(generatePaymentReferenceCode('Nikos Coach!', '8f3a21abcdef')).toBe('COACHIKO-NIKOSCOA-8F3A21');
  });

  it('formats EUR from cents', () => {
    expect(formatEuro(4500)).toBe('€45.00');
  });

  it('builds Revolut instructions without claiming automatic payment', () => {
    const instruction = createPaymentInstruction({
      method: 'REVOLUT',
      amountCents: 4500,
      reference: 'COACHIKO-NIKOS-8F3A21',
      revolutLink: 'https://revolut.me/coachname',
    });

    expect(instruction.externalUrl).toBe('https://revolut.me/coachname');
    expect(instruction.displayText).toContain('Use reference');
    expect(instruction.displayText).not.toContain('completed automatically');
  });

  it('builds IRIS as plain instructions', () => {
    const instruction = createPaymentInstruction({
      method: 'IRIS',
      amountCents: 4500,
      reference: 'COACHIKO-NIKOS-8F3A21',
      irisAlias: '@nikos',
    });

    expect(instruction.qrPayload).toContain('IRIS payment');
    expect(instruction.qrPayload).toContain('@nikos');
    expect(instruction.externalUrl).toBeUndefined();
  });

  it('builds EPC SEPA QR payload for IBAN', () => {
    const payload = buildSepaQrPayload({
      beneficiaryName: 'Nikos Coach',
      iban: 'GR16 0110 1250 0000 0001 2300 695',
      amountCents: 4500,
      reference: 'COACHIKO-NIKOS-8F3A21',
    });

    expect(payload.split('\n')[0]).toBe('BCD');
    expect(payload).toContain('SCT');
    expect(payload).toContain('GR1601101250000000012300695');
    expect(payload).toContain('EUR45.00');
  });

  it('validates payment settings with zod', () => {
    expect(() => coachPaymentSettingsSchema.parse({
      paymentPreference: 'REVOLUT',
      revolutLink: 'https://revolut.me/coachname',
      cashEnabled: true,
    })).not.toThrow();

    expect(() => coachPaymentSettingsSchema.parse({
      paymentPreference: 'REVOLUT',
      revolutLink: 'not-a-url',
      cashEnabled: true,
    })).toThrow();
  });

  it('moves through manual payment statuses', () => {
    expect(normalizePaymentStatus(undefined, false)).toBe('NOT_REQUESTED');
    expect(normalizePaymentStatus(undefined, true)).toBe('PAID_CONFIRMED');
    expect(requestPaymentStatus('NOT_REQUESTED')).toBe('REQUESTED');
    expect(sendReminderStatus('REQUESTED')).toBe('REMINDER_SENT');
    expect(canSendPaymentReminder('REQUESTED')).toBe(true);
  });

  it('builds request and reminder messages', () => {
    const request = buildPaymentRequestMessage({
      coachName: 'Nikos',
      clientName: 'Maria',
      sessionTitle: 'lesson',
      startsAt: '2026-05-21 at 10:00 AM',
      amountCents: 4500,
      paymentInstructions: 'Pay via IRIS.',
      cancellationPolicy: '24 hours notice.',
    });
    const reminder = buildPaymentReminderMessage({
      clientName: 'Maria',
      sessionTitle: 'lesson',
      amountCents: 4500,
      paymentInstructions: 'Pay via IRIS.',
    });

    expect(request).toContain('Cancellation policy');
    expect(reminder).toContain('quick reminder');
  });
});
