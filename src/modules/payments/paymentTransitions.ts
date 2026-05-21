import type { PaymentStatus } from './paymentTypes';

export function requestPaymentStatus(current: PaymentStatus): PaymentStatus {
  if (current === 'PAID_CONFIRMED' || current === 'FAILED_OR_CANCELLED') {
    return current;
  }
  return 'REQUESTED';
}

export function sendReminderStatus(current: PaymentStatus): PaymentStatus {
  if (current === 'REQUESTED' || current === 'REMINDER_SENT') {
    return 'REMINDER_SENT';
  }
  return current;
}

export function confirmPaidStatus(): PaymentStatus {
  return 'PAID_CONFIRMED';
}

export function cancelPaymentStatus(): PaymentStatus {
  return 'FAILED_OR_CANCELLED';
}
