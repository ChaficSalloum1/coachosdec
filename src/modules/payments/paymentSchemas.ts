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

export const coachPaymentSettingsSchema = z.object({
  paymentPreference: paymentPreferenceSchema.default('CASH'),
  revolutLink: z.string().url().optional().or(z.literal('')),
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
