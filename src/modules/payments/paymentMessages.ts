import { formatEuro } from './paymentUtils';

export function buildPaymentRequestMessage(params: {
  coachName: string;
  clientName: string;
  sessionTitle: string;
  startsAt: string;
  amountCents: number;
  paymentInstructions: string;
  cancellationPolicy?: string;
}): string {
  const policy = params.cancellationPolicy?.trim()
    ? `\nCancellation policy:\n${params.cancellationPolicy.trim()}`
    : '';

  return `Hi ${params.clientName}, your ${params.sessionTitle} with ${params.coachName} is scheduled for ${params.startsAt}.
Amount: ${formatEuro(params.amountCents)}
Payment instructions:
${params.paymentInstructions}${policy}`;
}

export function buildPaymentReminderMessage(params: {
  clientName: string;
  sessionTitle: string;
  amountCents: number;
  paymentInstructions: string;
}): string {
  return `Hi ${params.clientName}, quick reminder to complete payment for your ${params.sessionTitle}.
Amount: ${formatEuro(params.amountCents)}
Payment instructions:
${params.paymentInstructions}`;
}
