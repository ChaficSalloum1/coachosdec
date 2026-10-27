-- ============================================
-- PRIORITY 5: PUBLIC BOOKING RPCs RESPECT SOFT DELETES
-- Run in the Supabase SQL Editor AFTER priority1-4.
--
-- Bug: get_public_booking_profile / get_public_booking_availability ignored
-- deleted_at, so (a) a soft-deleted lesson or blackout date still blocked
-- public booking slots and (b) a soft-deleted coach's booking link still
-- resolved. Same signatures, so CREATE OR REPLACE is safe and idempotent.
-- Only replaces two read-only functions; touches no tables or data.
-- ============================================

BEGIN;

CREATE OR REPLACE FUNCTION get_public_booking_profile(p_booking_link TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sports TEXT[],
  price_per_hour DECIMAL,
  booking_link TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.sports, c.price_per_hour, c.booking_link
  FROM coaches c
  WHERE c.booking_link = p_booking_link
    AND c.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION get_public_booking_availability(p_coach_id UUID)
RETURNS TABLE (
  kind TEXT,
  id UUID,
  day_of_week INTEGER,
  date DATE,
  start_time TIME,
  end_time TIME,
  area_id UUID,
  facility_id UUID,
  court_id UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    'availability'::TEXT,
    ar.id,
    ar.day_of_week,
    NULL::DATE,
    ar.start_time,
    ar.end_time,
    ar.area_id,
    ar.facility_id,
    ar.court_id
  FROM availability_ranges ar
  WHERE ar.coach_id = p_coach_id
    AND ar.deleted_at IS NULL
  UNION ALL
  SELECT
    'lesson'::TEXT,
    l.id,
    NULL::INTEGER,
    l.date,
    l.start_time,
    l.end_time,
    l.area_id,
    l.facility_id,
    l.court_id
  FROM lessons l
  WHERE l.coach_id = p_coach_id
    AND l.status <> 'cancelled'
    AND l.deleted_at IS NULL
  UNION ALL
  SELECT
    'blackout'::TEXT,
    b.id,
    NULL::INTEGER,
    b.date,
    NULL::TIME,
    NULL::TIME,
    NULL::UUID,
    NULL::UUID,
    NULL::UUID
  FROM blackout_dates b
  WHERE b.coach_id = p_coach_id
    AND b.deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION get_public_booking_profile(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_public_booking_availability(UUID) TO anon, authenticated;

COMMIT;

-- Verify: soft-delete a test lesson, then this should no longer list it:
-- SELECT * FROM get_public_booking_availability('<coach uuid>');
