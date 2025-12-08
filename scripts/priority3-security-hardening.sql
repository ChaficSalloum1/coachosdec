-- ============================================
-- PRIORITY 3: SECURITY HARDENING
-- Run this in Supabase SQL Editor AFTER priority1 and priority2 migrations
-- This adds additional security measures
-- ============================================

BEGIN;

-- ============================================
-- 1. FIX PUBLIC BOOKING INSERT POLICY
-- The current policy allows inserting with ANY coach_id
-- This change validates the coach_id exists
-- ============================================
DROP POLICY IF EXISTS "booking_requests_public_insert" ON booking_requests;

-- New policy: Only allow insert if coach_id references an existing coach
-- This prevents spam attacks with fake coach IDs
CREATE POLICY "booking_requests_public_insert" ON booking_requests
  FOR INSERT
  WITH CHECK (
    -- Verify the coach exists
    coach_id IN (SELECT id FROM coaches WHERE deleted_at IS NULL)
  );

-- ============================================
-- 2. ADD RATE LIMITING TABLE FOR PUBLIC BOOKINGS
-- Track booking attempts per IP/contact to prevent abuse
-- ============================================
CREATE TABLE IF NOT EXISTS booking_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP address or contact info hash
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  attempt_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(identifier, coach_id)
);

-- Enable RLS on rate limits table
ALTER TABLE booking_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only coaches can view their own rate limit data
CREATE POLICY "rate_limits_coach_select" ON booking_rate_limits
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
  );

-- Allow public insert/update for rate tracking
CREATE POLICY "rate_limits_public_upsert" ON booking_rate_limits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "rate_limits_public_update" ON booking_rate_limits
  FOR UPDATE USING (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON booking_rate_limits(identifier, coach_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON booking_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- ============================================
-- 3. ADD INPUT VALIDATION CONSTRAINTS
-- ============================================

-- Validate student contact format (basic check)
ALTER TABLE students DROP CONSTRAINT IF EXISTS check_contact_not_empty;
ALTER TABLE students ADD CONSTRAINT check_contact_not_empty
  CHECK (length(trim(contact)) >= 3);

-- Validate student name
ALTER TABLE students DROP CONSTRAINT IF EXISTS check_name_not_empty;
ALTER TABLE students ADD CONSTRAINT check_name_not_empty
  CHECK (length(trim(name)) >= 2);

-- Validate booking request contact
ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS check_booking_contact_not_empty;
ALTER TABLE booking_requests ADD CONSTRAINT check_booking_contact_not_empty
  CHECK (length(trim(student_contact)) >= 3);

-- Validate booking request name
ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS check_booking_name_not_empty;
ALTER TABLE booking_requests ADD CONSTRAINT check_booking_name_not_empty
  CHECK (length(trim(student_name)) >= 2);

-- Validate coach name
ALTER TABLE coaches DROP CONSTRAINT IF EXISTS check_coach_name_not_empty;
ALTER TABLE coaches ADD CONSTRAINT check_coach_name_not_empty
  CHECK (length(trim(name)) >= 2);

-- ============================================
-- 4. ADD AUDIT LOG TABLE
-- Track security-relevant events
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- 'login', 'logout', 'data_access', 'data_modify', 'booking_request'
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  table_name TEXT,
  record_id UUID,
  action TEXT, -- 'select', 'insert', 'update', 'delete'
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Coaches can only view their own audit logs
CREATE POLICY "audit_logs_coach_select" ON audit_logs
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
  );

-- System can insert audit logs (no user restriction)
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Index for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_coach_id ON audit_logs(coach_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);

-- ============================================
-- 5. SECURE THE DELETE OPERATION
-- Ensure soft deletes can't be reversed by non-owners
-- ============================================

-- Function to prevent undelete by checking ownership
CREATE OR REPLACE FUNCTION prevent_undelete()
RETURNS TRIGGER AS $$
BEGIN
  -- If trying to set deleted_at back to NULL (undelete)
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    RAISE EXCEPTION 'Undelete operation not permitted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with soft delete
DROP TRIGGER IF EXISTS prevent_undelete_coaches ON coaches;
CREATE TRIGGER prevent_undelete_coaches
  BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION prevent_undelete();

DROP TRIGGER IF EXISTS prevent_undelete_students ON students;
CREATE TRIGGER prevent_undelete_students
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION prevent_undelete();

DROP TRIGGER IF EXISTS prevent_undelete_lessons ON lessons;
CREATE TRIGGER prevent_undelete_lessons
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION prevent_undelete();

DROP TRIGGER IF EXISTS prevent_undelete_booking_requests ON booking_requests;
CREATE TRIGGER prevent_undelete_booking_requests
  BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION prevent_undelete();

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
--
-- Check new policies exist:
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' AND policyname LIKE '%public_insert%';
--
-- Check constraints exist:
-- SELECT conname, conrelid::regclass FROM pg_constraint
-- WHERE connamespace = 'public'::regnamespace AND conname LIKE 'check_%';
--
-- Check audit_logs table:
-- SELECT * FROM information_schema.tables WHERE table_name = 'audit_logs';
