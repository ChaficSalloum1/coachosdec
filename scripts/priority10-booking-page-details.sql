-- ============================================
-- PRIORITY 10: BOOKING PAGE SHOWS PRICE, CURRENCY AND PLACE
-- Run in the Supabase SQL Editor AFTER priority1-9.
--
-- The student booking page now shows what a lesson costs and where it takes
-- place. Two public functions gain one column each:
--   get_public_booking_profile      + currency (the coach's currency, EUR if unset)
--   get_public_booking_availability + place_name (facility name, else area name)
-- Only names the coach already shares through the booking page are exposed;
-- payment details (IBAN, links) are not.
--
-- Idempotent. The functions are dropped and recreated because their result
-- columns change; the grants are restored at the end.
-- ============================================

BEGIN;

DROP FUNCTION IF EXISTS get_public_booking_profile(TEXT);
CREATE FUNCTION get_public_booking_profile(p_booking_link TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sports TEXT[],
  price_per_hour DECIMAL,
  currency TEXT,
  booking_link TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.sports,
    c.price_per_hour,
    COALESCE(NULLIF(c.payment_settings->>'currency', ''), 'EUR'),
    c.booking_link
  FROM coaches c
  WHERE c.booking_link = p_booking_link
    AND c.deleted_at IS NULL;
$$;

DROP FUNCTION IF EXISTS get_public_booking_availability(UUID);
CREATE FUNCTION get_public_booking_availability(p_coach_id UUID)
RETURNS TABLE (
  kind TEXT,
  id UUID,
  day_of_week INTEGER,
  date DATE,
  start_time TIME,
  end_time TIME,
  area_id UUID,
  facility_id UUID,
  court_id UUID,
  place_name TEXT
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
    ar.court_id,
    COALESCE(f.name, a.name)
  FROM availability_ranges ar
  LEFT JOIN facilities f ON f.id = ar.facility_id AND f.deleted_at IS NULL
  LEFT JOIN areas a ON a.id = ar.area_id AND a.deleted_at IS NULL
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
    l.court_id,
    NULL::TEXT
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
    NULL::UUID,
    NULL::TEXT
  FROM blackout_dates b
  WHERE b.coach_id = p_coach_id
    AND b.deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION get_public_booking_profile(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_public_booking_availability(UUID) TO anon, authenticated;

COMMIT;

-- Verify (expect a currency column and a place_name column):
-- SELECT * FROM get_public_booking_profile('john-smith');
-- SELECT kind, day_of_week, start_time, place_name FROM get_public_booking_availability((SELECT id FROM coaches WHERE booking_link = 'john-smith')) WHERE kind = 'availability';
