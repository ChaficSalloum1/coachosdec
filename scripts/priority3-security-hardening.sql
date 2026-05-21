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

-- Security-definer helper so anonymous booking inserts can validate a real
-- coach without requiring public SELECT access to the coaches table.
CREATE OR REPLACE FUNCTION public_coach_exists(p_coach_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM coaches
    WHERE id = p_coach_id
      AND deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public_coach_exists(UUID) TO anon, authenticated;

-- Public booking submissions now go through submit_public_booking_request()
-- below. Do not grant direct anonymous INSERT; the RPC applies validation and
-- rate limiting before writing as a security-definer function.

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
DROP POLICY IF EXISTS "rate_limits_coach_select" ON booking_rate_limits;
CREATE POLICY "rate_limits_coach_select" ON booking_rate_limits
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "rate_limits_public_upsert" ON booking_rate_limits;
DROP POLICY IF EXISTS "rate_limits_public_update" ON booking_rate_limits;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON booking_rate_limits(identifier, coach_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON booking_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Public booking submission must go through this server-side function so rate
-- limiting cannot be bypassed by direct client writes.
CREATE OR REPLACE FUNCTION submit_public_booking_request(p_request JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID := COALESCE((p_request->>'id')::UUID, uuid_generate_v4());
  v_coach_id UUID := (p_request->>'coach_id')::UUID;
  v_student_name TEXT := trim(COALESCE(p_request->>'student_name', ''));
  v_student_contact TEXT := trim(COALESCE(p_request->>'student_contact', ''));
  v_identifier TEXT := md5(lower(v_student_contact));
  v_rate booking_rate_limits%ROWTYPE;
BEGIN
  IF NOT public_coach_exists(v_coach_id) THEN
    RAISE EXCEPTION 'Invalid coach';
  END IF;

  IF length(v_student_name) < 2
    OR length(v_student_name) > 80
    OR length(v_student_contact) < 3
    OR length(v_student_contact) > 120
    OR length(trim(COALESCE(p_request->>'note', ''))) > 500
    OR (p_request->>'duration')::INTEGER NOT BETWEEN 15 AND 240 THEN
    RAISE EXCEPTION 'Invalid booking request';
  END IF;

  INSERT INTO booking_rate_limits (identifier, coach_id)
  VALUES (v_identifier, v_coach_id)
  ON CONFLICT (identifier, coach_id) DO UPDATE SET
    attempt_count = CASE
      WHEN booking_rate_limits.first_attempt_at < NOW() - INTERVAL '15 minutes' THEN 1
      ELSE booking_rate_limits.attempt_count + 1
    END,
    first_attempt_at = CASE
      WHEN booking_rate_limits.first_attempt_at < NOW() - INTERVAL '15 minutes' THEN NOW()
      ELSE booking_rate_limits.first_attempt_at
    END,
    last_attempt_at = NOW(),
    blocked_until = CASE
      WHEN booking_rate_limits.first_attempt_at >= NOW() - INTERVAL '15 minutes'
        AND booking_rate_limits.attempt_count >= 5
      THEN NOW() + INTERVAL '1 hour'
      ELSE booking_rate_limits.blocked_until
    END
  RETURNING * INTO v_rate;

  IF v_rate.blocked_until IS NOT NULL AND v_rate.blocked_until > NOW() THEN
    RAISE EXCEPTION 'Too many booking attempts. Please try again later.';
  END IF;

  INSERT INTO booking_requests (
    id,
    coach_id,
    student_name,
    student_contact,
    requested_date,
    requested_time,
    duration,
    note,
    status,
    area_id,
    facility_id,
    court_id
  ) VALUES (
    v_id,
    v_coach_id,
    v_student_name,
    v_student_contact,
    (p_request->>'requested_date')::DATE,
    (p_request->>'requested_time')::TIME,
    (p_request->>'duration')::INTEGER,
    NULLIF(trim(COALESCE(p_request->>'note', '')), ''),
    'pending',
    NULLIF(p_request->>'area_id', '')::UUID,
    NULLIF(p_request->>'facility_id', '')::UUID,
    NULLIF(p_request->>'court_id', '')::UUID
  );

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_public_booking_request(JSONB) TO anon, authenticated;

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
  CHECK (length(trim(student_contact)) BETWEEN 3 AND 120);

-- Validate booking request name
ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS check_booking_name_not_empty;
ALTER TABLE booking_requests ADD CONSTRAINT check_booking_name_not_empty
  CHECK (length(trim(student_name)) BETWEEN 2 AND 80);

-- Validate optional public booking note
ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS check_booking_note_length;
ALTER TABLE booking_requests ADD CONSTRAINT check_booking_note_length
  CHECK (note IS NULL OR length(trim(note)) <= 500);

-- Validate booking duration
ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS check_booking_duration_range;
ALTER TABLE booking_requests ADD CONSTRAINT check_booking_duration_range
  CHECK (duration BETWEEN 15 AND 240);

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
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
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
