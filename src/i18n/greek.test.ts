import { afterEach, describe, expect, it } from 'vitest';

import { t, setLanguage } from './index';
import { formatLocalized, weekdayName } from './formatDate';
import { buildCancellationMessage, buildReminderMessage } from '../utils/cancellationMessage';
import { buildPaymentRequestMessage } from '../modules/payments';

describe('Greek', () => {
  afterEach(() => setLanguage('en'));

  it('picks the right plural form', async () => {
    await setLanguage('el');
    expect(t('students.lessonCount', { count: 1 })).toBe('1 μάθημα');
    expect(t('students.lessonCount', { count: 3 })).toBe('3 μαθήματα');
  });

  it('names weekdays and months in Greek', async () => {
    await setLanguage('el');
    expect(weekdayName(1, 'long')).toBe('Δευτέρα');
    expect(formatLocalized(new Date(2026, 0, 5), 'EEE d MMM')).toMatch(/Δευ/);
  });

  it('writes student messages in Greek', async () => {
    await setLanguage('el');
    const cancel = buildCancellationMessage({ studentName: 'Νίκος Π.', date: '2026-03-04', startTime: '18:00', coachName: 'Ελένη' });
    expect(cancel).toContain('Γεια σου Νίκος');
    expect(cancel).toContain('18:00');
    const reminder = buildReminderMessage({
      studentName: 'Νίκος',
      date: '2026-03-04',
      startTime: '18:00',
      now: new Date(2026, 2, 4, 9, 0),
    });
    expect(reminder).toContain('σήμερα');
    const payment = buildPaymentRequestMessage({
      coachName: 'Ελένη',
      clientName: 'Νίκος',
      sessionTitle: 'μάθημα',
      startsAt: '4 Μαρ, 18:00',
      amountCents: 4500,
      paymentInstructions: 'IBAN GR00',
    });
    expect(payment).toContain('Γεια σου Νίκος');
    expect(payment).toContain('€45.00');
  });
});
