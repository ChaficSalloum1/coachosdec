import { DEFAULT_CURRENCY, formatMoneyFromCents, resolveCurrency, type CurrencyCode } from './currency';
import type {
  CoachPaymentSettings,
  PaymentInstruction,
  PaymentMethod,
  PaymentPreference,
  PaymentStatus,
} from './paymentTypes';
import { t } from '../../i18n';

export function centsToEuro(amountCents: number): number {
  return amountCents / 100;
}

export function eurosToCents(amountEur: number): number {
  return Math.round(amountEur * 100);
}

export function formatEuro(amountCents: number): string {
  return formatMoneyFromCents(amountCents, 'EUR');
}

export function generatePaymentReferenceCode(
  coachName: string,
  lessonId: string,
): string {
  const cleanName = coachName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'COACH';

  return `COACHOS-${cleanName}-${lessonId.slice(0, 6).toUpperCase()}`;
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
    currency: resolveCurrency(settings?.currency),
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
  currency?: CurrencyCode;
}): PaymentInstruction {
  const currency = params.currency ?? DEFAULT_CURRENCY;
  const amount = formatMoneyFromCents(params.amountCents, currency);

  if (params.method === 'REVOLUT') {
    return {
      method: 'REVOLUT',
      title: t('payments.payWithRevolut'),
      amountCents: params.amountCents,
      currency,
      reference: params.reference,
      externalUrl: params.revolutLink,
      qrPayload: params.revolutLink,
      displayText: t('payments.revolutText', { amount, reference: params.reference }),
    };
  }

  if (params.method === 'IRIS') {
    return {
      method: 'IRIS',
      title: t('payments.payWithIris'),
      amountCents: params.amountCents,
      currency,
      reference: params.reference,
      qrPayload: t('payments.irisQr', { alias: params.irisAlias ?? '', amount, reference: params.reference }),
      displayText: t('payments.irisText', {
        amount,
        alias: params.irisAlias ?? t('payments.coachAlias'),
        reference: params.reference,
      }),
    };
  }

  if (params.method === 'IBAN') {
    // The SEPA QR format only exists for euros; other currencies show the IBAN text only.
    const qrPayload =
      currency === 'EUR' && params.iban && params.ibanBeneficiaryName
        ? buildSepaQrPayload({
            beneficiaryName: params.ibanBeneficiaryName,
            iban: params.iban,
            amountCents: params.amountCents,
            reference: params.reference,
          })
        : undefined;

    return {
      method: 'IBAN',
      title: t('payments.payByBank'),
      amountCents: params.amountCents,
      currency,
      reference: params.reference,
      qrPayload,
      displayText: t('payments.ibanText', {
        amount,
        iban: params.iban ?? '',
        beneficiary: params.ibanBeneficiaryName ?? '',
        reference: params.reference,
      }),
    };
  }

  return {
    method: 'CASH',
    title: t('payments.payInCash'),
    amountCents: params.amountCents,
    currency,
    reference: params.reference,
    displayText: t('payments.cashText', { amount, reference: params.reference }),
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
    currency: settings.currency,
  });
}

export function getPaymentStatusLabel(status: PaymentStatus | undefined, isPaid?: boolean): string {
  const normalized = normalizePaymentStatus(status, isPaid);
  switch (normalized) {
    case 'REQUESTED':
      return t('payments.statusRequested');
    case 'REMINDER_SENT':
      return t('payments.statusReminderSent');
    case 'PAID_CONFIRMED':
      return t('payments.statusPaid');
    case 'FAILED_OR_CANCELLED':
      return t('payments.statusCancelled');
    case 'NOT_REQUESTED':
    default:
      return t('payments.statusNotRequested');
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
