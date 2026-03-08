-- ============================================
-- CLEANUP SCRIPT - Run this FIRST if you get errors
-- about triggers or policies already existing
-- ============================================
-- This script safely removes existing triggers and policies
-- so the main migration can run cleanly
-- ============================================

-- Drop all version triggers
DROP TRIGGER IF EXISTS increment_coaches_version ON coaches;
DROP TRIGGER IF EXISTS increment_students_version ON students;
DROP TRIGGER IF EXISTS increment_lessons_version ON lessons;
DROP TRIGGER IF EXISTS increment_booking_requests_version ON booking_requests;
DROP TRIGGER IF EXISTS increment_student_notes_version ON student_notes;

-- Drop all secure RLS policies (we'll recreate them in the main migration)
DROP POLICY IF EXISTS "coaches_select_own" ON coaches;
DROP POLICY IF EXISTS "coaches_update_own" ON coaches;
DROP POLICY IF EXISTS "coaches_insert_own" ON coaches;

DROP POLICY IF EXISTS "students_select_own_coach" ON students;
DROP POLICY IF EXISTS "students_insert_own_coach" ON students;
DROP POLICY IF EXISTS "students_update_own_coach" ON students;
DROP POLICY IF EXISTS "students_delete_own_coach" ON students;

DROP POLICY IF EXISTS "lessons_select_own_coach" ON lessons;
DROP POLICY IF EXISTS "lessons_insert_own_coach" ON lessons;
DROP POLICY IF EXISTS "lessons_update_own_coach" ON lessons;
DROP POLICY IF EXISTS "lessons_delete_own_coach" ON lessons;

DROP POLICY IF EXISTS "booking_requests_public_insert" ON booking_requests;
DROP POLICY IF EXISTS "booking_requests_coach_access" ON booking_requests;
DROP POLICY IF EXISTS "booking_requests_coach_update" ON booking_requests;
DROP POLICY IF EXISTS "booking_requests_coach_delete" ON booking_requests;

DROP POLICY IF EXISTS "student_notes_select_own_coach" ON student_notes;
DROP POLICY IF EXISTS "student_notes_insert_own_coach" ON student_notes;
DROP POLICY IF EXISTS "student_notes_update_own_coach" ON student_notes;
DROP POLICY IF EXISTS "student_notes_delete_own_coach" ON student_notes;

DROP POLICY IF EXISTS "areas_select_own_coach" ON areas;
DROP POLICY IF EXISTS "areas_insert_own_coach" ON areas;
DROP POLICY IF EXISTS "areas_update_own_coach" ON areas;
DROP POLICY IF EXISTS "areas_delete_own_coach" ON areas;

DROP POLICY IF EXISTS "facilities_select_own_coach" ON facilities;
DROP POLICY IF EXISTS "facilities_insert_own_coach" ON facilities;
DROP POLICY IF EXISTS "facilities_update_own_coach" ON facilities;
DROP POLICY IF EXISTS "facilities_delete_own_coach" ON facilities;

DROP POLICY IF EXISTS "courts_select_own_coach" ON courts;
DROP POLICY IF EXISTS "courts_insert_own_coach" ON courts;
DROP POLICY IF EXISTS "courts_update_own_coach" ON courts;
DROP POLICY IF EXISTS "courts_delete_own_coach" ON courts;

DROP POLICY IF EXISTS "availability_ranges_select_own_coach" ON availability_ranges;
DROP POLICY IF EXISTS "availability_ranges_insert_own_coach" ON availability_ranges;
DROP POLICY IF EXISTS "availability_ranges_update_own_coach" ON availability_ranges;
DROP POLICY IF EXISTS "availability_ranges_delete_own_coach" ON availability_ranges;

DROP POLICY IF EXISTS "blackout_dates_select_own_coach" ON blackout_dates;
DROP POLICY IF EXISTS "blackout_dates_insert_own_coach" ON blackout_dates;
DROP POLICY IF EXISTS "blackout_dates_update_own_coach" ON blackout_dates;
DROP POLICY IF EXISTS "blackout_dates_delete_own_coach" ON blackout_dates;

-- Success message
SELECT 'Cleanup complete! Now run priority1-migration.sql' AS status;

