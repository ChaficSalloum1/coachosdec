import { z } from 'zod';

export const paymentPreferenceSchema = z.enum([
  'REVOLUT',
  'IRIS',
  'IBAN',
  'CASH',
  'MULTIPLE',
]);

export const paymentStatusSchema = z.enum([
  'NOT_REQUESTED',
  'REQUESTED',
  'REMINDER_SENT',
  'PAID_CONFIRMED',
  'FAILED_OR_CANCELLED',
]);

// Returns a user-facing problem with a Revolut link, or null if it's fine.
// Empty is valid: the field is optional.
export function getRevolutLinkError(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return 'Enter the full link, like https://revolut.me/yourname';
  }

  if (url.protocol !== 'https:') {
    return 'The link must start with https://';
  }

  const host = url.hostname.toLowerCase();
  if (host !== 'revolut.me' && host !== 'www.revolut.me') {
    return 'This must be a revolut.me link';
  }

  if (url.pathname.replace(/\//g, '') === '') {
    return 'Add your Revolut username after revolut.me/';
  }

  return null;
}

export const revolutLinkSchema = z
  .string()
  .superRefine((value, ctx) => {
    const error = getRevolutLinkError(value);
    if (error) ctx.addIssue({ code: 'custom', message: error });
  });

export const coachPaymentSettingsSchema = z.object({
  paymentPreference: paymentPreferenceSchema.default('CASH'),
  revolutLink: revolutLinkSchema.optional(),
  irisAlias: z.string().min(2).max(80).optional().or(z.literal('')),
  iban: z.string().min(10).max(40).optional().or(z.literal('')),
  ibanBeneficiaryName: z.string().min(2).max(120).optional().or(z.literal('')),
  cancellationPolicy: z.string().max(600).optional().or(z.literal('')),
  cashEnabled: z.boolean().default(true),
  qrCode: z.string().optional(),
  phoneId: z.string().optional(),
});

export const paymentActionSchema = z.object({
  lessonId: z.string().min(1),
  paymentMethodRequested: paymentPreferenceSchema.optional(),
});
