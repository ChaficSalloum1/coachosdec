import type {
  CoachPaymentSettings,
  PaymentInstruction,
  PaymentMethod,
  PaymentPreference,
  PaymentStatus,
} from './paymentTypes';

export function centsToEuro(amountCents: number): number {
  return amountCents / 100;
}

export function eurosToCents(amountEur: number): number {
  return Math.round(amountEur * 100);
}

export function formatEuro(amountCents: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(centsToEuro(amountCents));
}

export function generatePaymentReferenceCode(
  coachName: string,
  lessonId: string,
): string {
  const cleanName = coachName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'COACH';

  return `COACHIKO-${cleanName}-${lessonId.slice(0, 6).toUpperCase()}`;
}

export function buildSepaQrPayload(params: {
  beneficiaryName: string;
  iban: string;
  amountCents: number;
  reference: string;
}): string {
  const amountEur = centsToEuro(params.amountCents).toFixed(2);
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    '',
    params.beneficiaryName,
    params.iban.replace(/\s/g, ''),
    `EUR${amountEur}`,
    '',
    '',
    params.reference,
    '',
  ].join('\n');
}

export function normalizePaymentSettings(
  settings?: Partial<CoachPaymentSettings>,
): CoachPaymentSettings {
  return {
    paymentPreference: settings?.paymentPreference ?? 'CASH',
    revolutLink: settings?.revolutLink,
    irisAlias: settings?.irisAlias,
    iban: settings?.iban,
    ibanBeneficiaryName: settings?.ibanBeneficiaryName,
    cancellationPolicy: settings?.cancellationPolicy,
    cashEnabled: settings?.cashEnabled ?? true,
    qrCode: settings?.qrCode,
    phoneId: settings?.phoneId,
  };
}

export function getAvailablePaymentMethods(
  settings?: Partial<CoachPaymentSettings>,
): PaymentMethod[] {
  const normalized = normalizePaymentSettings(settings);
  const methods: PaymentMethod[] = [];

  if (normalized.paymentPreference === 'REVOLUT' || normalized.paymentPreference === 'MULTIPLE') {
    if (normalized.revolutLink) methods.push('REVOLUT');
  }
  if (normalized.paymentPreference === 'IRIS' || normalized.paymentPreference === 'MULTIPLE') {
    if (normalized.irisAlias) methods.push('IRIS');
  }
  if (normalized.paymentPreference === 'IBAN' || normalized.paymentPreference === 'MULTIPLE') {
    if (normalized.iban && normalized.ibanBeneficiaryName) methods.push('IBAN');
  }
  if (
    normalized.paymentPreference === 'CASH' ||
    normalized.paymentPreference === 'MULTIPLE' ||
    normalized.cashEnabled
  ) {
    methods.push('CASH');
  }

  return methods.length > 0 ? methods : ['CASH'];
}

export function getDefaultPaymentMethod(
  preference: PaymentPreference | undefined,
  settings?: Partial<CoachPaymentSettings>,
): PaymentMethod {
  const available = getAvailablePaymentMethods(settings);
  if (preference && preference !== 'MULTIPLE' && available.includes(preference)) {
    return preference;
  }
  return available[0];
}

export function createPaymentInstruction(params: {
  method: PaymentMethod;
  amountCents: number;
  reference: string;
  revolutLink?: string;
  irisAlias?: string;
  iban?: string;
  ibanBeneficiaryName?: string;
}): PaymentInstruction {
  const amount = formatEuro(params.amountCents);

  if (params.method === 'REVOLUT') {
    return {
      method: 'REVOLUT',
      title: 'Pay with Revolut',
      amountCents: params.amountCents,
      currency: 'EUR',
      reference: params.reference,
      externalUrl: params.revolutLink,
      qrPayload: params.revolutLink,
      displayText: `Pay ${amount} via Revolut. Use reference: ${params.reference}`,
    };
  }

  if (params.method === 'IRIS') {
    return {
      method: 'IRIS',
      title: 'Pay with IRIS',
      amountCents: params.amountCents,
      currency: 'EUR',
      reference: params.reference,
      qrPayload: `IRIS payment\nAlias: ${params.irisAlias ?? ''}\nAmount: ${amount}\nReference: ${params.reference}`,
      displayText: `Pay ${amount} via IRIS to ${params.irisAlias ?? 'your coach alias'}. Use reference: ${params.reference}.`,
    };
  }

  if (params.method === 'IBAN') {
    const qrPayload =
      params.iban && params.ibanBeneficiaryName
        ? buildSepaQrPayload({
            beneficiaryName: params.ibanBeneficiaryName,
            iban: params.iban,
            amountCents: params.amountCents,
            reference: params.reference,
          })
        : undefined;

    return {
      method: 'IBAN',
      title: 'Pay by Bank Transfer',
      amountCents: params.amountCents,
      currency: 'EUR',
      reference: params.reference,
      qrPayload,
      displayText: `Pay ${amount} to IBAN ${params.iban ?? ''}. Beneficiary: ${params.ibanBeneficiaryName ?? ''}. Use reference: ${params.reference}.`,
    };
  }

  return {
    method: 'CASH',
    title: 'Pay in Cash',
    amountCents: params.amountCents,
    currency: 'EUR',
    reference: params.reference,
    displayText: `Pay ${amount} directly to the coach. Reference: ${params.reference}.`,
  };
}

export function createInstructionFromSettings(params: {
  settings: Partial<CoachPaymentSettings>;
  method?: PaymentPreference;
  amountCents: number;
  reference: string;
}): PaymentInstruction {
  const settings = normalizePaymentSettings(params.settings);
  const method = getDefaultPaymentMethod(params.method, settings);

  return createPaymentInstruction({
    method,
    amountCents: params.amountCents,
    reference: params.reference,
    revolutLink: settings.revolutLink,
    irisAlias: settings.irisAlias,
    iban: settings.iban,
    ibanBeneficiaryName: settings.ibanBeneficiaryName,
  });
}

export function getPaymentStatusLabel(status: PaymentStatus | undefined, isPaid?: boolean): string {
  const normalized = normalizePaymentStatus(status, isPaid);
  switch (normalized) {
    case 'REQUESTED':
      return 'Payment requested';
    case 'REMINDER_SENT':
      return 'Reminder sent';
    case 'PAID_CONFIRMED':
      return 'Marked as paid by coach';
    case 'FAILED_OR_CANCELLED':
      return 'Payment cancelled';
    case 'NOT_REQUESTED':
    default:
      return 'Payment not requested';
  }
}

export function normalizePaymentStatus(
  status: PaymentStatus | undefined,
  isPaid?: boolean,
): PaymentStatus {
  if (status) return status;
  return isPaid ? 'PAID_CONFIRMED' : 'NOT_REQUESTED';
}

export function canSendPaymentReminder(status: PaymentStatus | undefined): boolean {
  return status === 'REQUESTED' || status === 'REMINDER_SENT';
}
