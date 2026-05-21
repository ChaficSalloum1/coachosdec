-- ============================================
-- PRIORITY 4: COACHIKO V1 PAYMENT TRACKING
-- Run this in Supabase SQL Editor after earlier migrations.
-- Adds manual payment request/status tracking. No payment processing.
-- ============================================

BEGIN;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'NOT_REQUESTED';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS payment_method_requested TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS payment_reference_code TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS payment_requested_at TIMESTAMPTZ;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS paid_confirmed_at TIMESTAMPTZ;

UPDATE lessons
SET payment_status = CASE
  WHEN is_paid IS TRUE THEN 'PAID_CONFIRMED'
  ELSE COALESCE(payment_status, 'NOT_REQUESTED')
END,
paid_confirmed_at = CASE
  WHEN is_paid IS TRUE THEN COALESCE(paid_confirmed_at, updated_at, created_at, NOW())
  ELSE paid_confirmed_at
END
WHERE payment_status IS NULL
   OR (is_paid IS TRUE AND payment_status <> 'PAID_CONFIRMED');

ALTER TABLE lessons ALTER COLUMN payment_status SET DEFAULT 'NOT_REQUESTED';
ALTER TABLE lessons ALTER COLUMN payment_status SET NOT NULL;

ALTER TABLE lessons DROP CONSTRAINT IF EXISTS check_lesson_payment_status;
ALTER TABLE lessons ADD CONSTRAINT check_lesson_payment_status
  CHECK (payment_status IN ('NOT_REQUESTED', 'REQUESTED', 'REMINDER_SENT', 'PAID_CONFIRMED', 'FAILED_OR_CANCELLED'));

ALTER TABLE lessons DROP CONSTRAINT IF EXISTS check_lesson_payment_method_requested;
ALTER TABLE lessons ADD CONSTRAINT check_lesson_payment_method_requested
  CHECK (payment_method_requested IS NULL OR payment_method_requested IN ('REVOLUT', 'IRIS', 'IBAN', 'CASH', 'MULTIPLE'));

CREATE INDEX IF NOT EXISTS idx_lessons_payment_status ON lessons(coach_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_lessons_payment_reference_code ON lessons(payment_reference_code);

COMMIT;
