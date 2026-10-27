import { formatMoneyFromCents, type CurrencyCode } from './currency';
import { t } from '../../i18n';

export function buildPaymentRequestMessage(params: {
  coachName: string;
  clientName: string;
  sessionTitle: string;
  startsAt: string;
  amountCents: number;
  currency?: CurrencyCode;
  paymentInstructions: string;
  cancellationPolicy?: string;
}): string {
  const policy = params.cancellationPolicy?.trim()
    ? t('payments.cancellationPolicy', { policy: params.cancellationPolicy.trim() })
    : '';

  return t('payments.requestMessage', {
    clientName: params.clientName,
    sessionTitle: params.sessionTitle,
    coachName: params.coachName,
    startsAt: params.startsAt,
    amount: formatMoneyFromCents(params.amountCents, params.currency),
    instructions: params.paymentInstructions,
    policy,
  });
}

export function buildPaymentReminderMessage(params: {
  clientName: string;
  sessionTitle: string;
  amountCents: number;
  currency?: CurrencyCode;
  paymentInstructions: string;
}): string {
  return t('payments.reminderMessage', {
    clientName: params.clientName,
    sessionTitle: params.sessionTitle,
    amount: formatMoneyFromCents(params.amountCents, params.currency),
    instructions: params.paymentInstructions,
  });
}
