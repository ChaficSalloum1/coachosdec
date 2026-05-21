-- ============================================
-- FIX PUBLIC BOOKING SUBMISSION
-- Run this in Supabase SQL Editor if anonymous booking requests fail.
--
-- Public clients should not have a direct INSERT policy on booking_requests.
-- They submit through submit_public_booking_request(), which validates the
-- coach, constrains input size, and rate-limits repeated attempts.
-- ============================================

BEGIN;

DROP POLICY IF EXISTS "booking_requests_public_insert" ON booking_requests;

CREATE TABLE IF NOT EXISTS booking_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  attempt_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(identifier, coach_id)
);

ALTER TABLE booking_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_public_upsert" ON booking_rate_limits;
DROP POLICY IF EXISTS "rate_limits_public_update" ON booking_rate_limits;

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON booking_rate_limits(identifier, coach_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON booking_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

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
  );
$$;

GRANT EXECUTE ON FUNCTION public_coach_exists(UUID) TO anon, authenticated;

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
  v_note TEXT := NULLIF(trim(COALESCE(p_request->>'note', '')), '');
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
    OR length(COALESCE(v_note, '')) > 500
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
    v_note,
    'pending',
    NULLIF(p_request->>'area_id', '')::UUID,
    NULLIF(p_request->>'facility_id', '')::UUID,
    NULLIF(p_request->>'court_id', '')::UUID
  );

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_public_booking_request(JSONB) TO anon, authenticated;

COMMIT;

SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'submit_public_booking_request';
