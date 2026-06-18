export type PaymentPreference =
  | 'REVOLUT'
  | 'IRIS'
  | 'IBAN'
  | 'CASH'
  | 'MULTIPLE';

export type PaymentMethod = Exclude<PaymentPreference, 'MULTIPLE'>;

export type PaymentStatus =
  | 'NOT_REQUESTED'
  | 'REQUESTED'
  | 'REMINDER_SENT'
  | 'PAID_CONFIRMED'
  | 'FAILED_OR_CANCELLED';

export type PaymentInstruction = {
  method: PaymentMethod;
  title: string;
  amountCents: number;
  currency: 'EUR';
  reference: string;
  displayText: string;
  externalUrl?: string;
  qrPayload?: string;
};

export type CoachPaymentSettings = {
  paymentPreference: PaymentPreference;
  revolutLink?: string;
  irisAlias?: string;
  iban?: string;
  ibanBeneficiaryName?: string;
  cancellationPolicy?: string;
  cashEnabled: boolean;
  qrCode?: string;
  phoneId?: string;
};
