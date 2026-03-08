-- ============================================
-- PRIORITY 1: CRITICAL FIXES MIGRATION
-- Run this in Supabase SQL Editor
-- This fixes security vulnerabilities and adds data integrity
-- ============================================
--
-- TROUBLESHOOTING:
-- If you get an error about triggers or policies already existing:
-- 1. The script should handle this automatically with DROP IF EXISTS
-- 2. If errors persist, try running just the DROP statements first (lines 31-54 for triggers)
-- 3. Then run the full script again
-- ============================================

BEGIN;

-- ============================================
-- 1. ADD VERSION COLUMNS FOR OPTIMISTIC LOCKING
-- ============================================
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE students ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE student_notes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- ============================================
-- 2. CREATE VERSION INCREMENT FUNCTION & TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
-- Drop existing triggers first (in case migration was partially run)
DROP TRIGGER IF EXISTS increment_coaches_version ON coaches;
CREATE TRIGGER increment_coaches_version
  BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS increment_students_version ON students;
CREATE TRIGGER increment_students_version
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS increment_lessons_version ON lessons;
CREATE TRIGGER increment_lessons_version
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS increment_booking_requests_version ON booking_requests;
CREATE TRIGGER increment_booking_requests_version
  BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS increment_student_notes_version ON student_notes;
CREATE TRIGGER increment_student_notes_version
  BEFORE UPDATE ON student_notes
  FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================
-- 3. ADD BUSINESS LOGIC CONSTRAINTS
-- ============================================
-- Prevent invalid lesson times
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS check_lesson_times;
ALTER TABLE lessons ADD CONSTRAINT check_lesson_times
  CHECK (end_time > start_time);

-- Prevent invalid lesson duration (max 8 hours)
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS check_lesson_duration;
ALTER TABLE lessons ADD CONSTRAINT check_lesson_duration
  CHECK (duration > 0 AND duration <= 480);

-- Prevent negative prices
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS check_lesson_price;
ALTER TABLE lessons ADD CONSTRAINT check_lesson_price
  CHECK (price >= 0);

ALTER TABLE coaches DROP CONSTRAINT IF EXISTS check_price_per_hour;
ALTER TABLE coaches ADD CONSTRAINT check_price_per_hour
  CHECK (price_per_hour >= 0);

-- Prevent invalid availability times
ALTER TABLE availability_ranges DROP CONSTRAINT IF EXISTS check_availability_times;
ALTER TABLE availability_ranges ADD CONSTRAINT check_availability_times
  CHECK (end_time > start_time);

-- ============================================
-- 4. DROP INSECURE RLS POLICIES (CRITICAL!)
-- ============================================
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON coaches;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON students;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON lessons;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON booking_requests;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON student_notes;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON areas;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON facilities;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON courts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON availability_ranges;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON blackout_dates;

-- ============================================
-- 5. CREATE SECURE RLS POLICIES
-- Coaches can only access their own data
-- ============================================

-- COACHES table
DROP POLICY IF EXISTS "coaches_select_own" ON coaches;
CREATE POLICY "coaches_select_own" ON coaches
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "coaches_update_own" ON coaches;
CREATE POLICY "coaches_update_own" ON coaches
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "coaches_insert_own" ON coaches;
CREATE POLICY "coaches_insert_own" ON coaches
  FOR INSERT WITH CHECK (auth.uid() = id);

-- STUDENTS table
DROP POLICY IF EXISTS "students_select_own_coach" ON students;
CREATE POLICY "students_select_own_coach" ON students
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "students_insert_own_coach" ON students;
CREATE POLICY "students_insert_own_coach" ON students
  FOR INSERT WITH CHECK (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "students_update_own_coach" ON students;
CREATE POLICY "students_update_own_coach" ON students
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "students_delete_own_coach" ON students;
CREATE POLICY "students_delete_own_coach" ON students
  FOR DELETE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

-- LESSONS table
DROP POLICY IF EXISTS "lessons_select_own_coach" ON lessons;
CREATE POLICY "lessons_select_own_coach" ON lessons
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "lessons_insert_own_coach" ON lessons;
CREATE POLICY "lessons_insert_own_coach" ON lessons
  FOR INSERT WITH CHECK (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "lessons_update_own_coach" ON lessons;
CREATE POLICY "lessons_update_own_coach" ON lessons
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "lessons_delete_own_coach" ON lessons;
CREATE POLICY "lessons_delete_own_coach" ON lessons
  FOR DELETE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

-- BOOKING_REQUESTS table (special: allow public creation)
DROP POLICY IF EXISTS "booking_requests_public_insert" ON booking_requests;
CREATE POLICY "booking_requests_public_insert" ON booking_requests
  FOR INSERT WITH CHECK (true);  -- Anyone can create booking request

DROP POLICY IF EXISTS "booking_requests_coach_access" ON booking_requests;
CREATE POLICY "booking_requests_coach_access" ON booking_requests
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "booking_requests_coach_update" ON booking_requests;
CREATE POLICY "booking_requests_coach_update" ON booking_requests
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "booking_requests_coach_delete" ON booking_requests;
CREATE POLICY "booking_requests_coach_delete" ON booking_requests
  FOR DELETE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

-- STUDENT_NOTES table
DROP POLICY IF EXISTS "student_notes_select_own_coach" ON student_notes;
CREATE POLICY "student_notes_select_own_coach" ON student_notes
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "student_notes_insert_own_coach" ON student_notes;
CREATE POLICY "student_notes_insert_own_coach" ON student_notes
  FOR INSERT WITH CHECK (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "student_notes_update_own_coach" ON student_notes;
CREATE POLICY "student_notes_update_own_coach" ON student_notes
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "student_notes_delete_own_coach" ON student_notes;
CREATE POLICY "student_notes_delete_own_coach" ON student_notes
  FOR DELETE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

-- AREAS table
DROP POLICY IF EXISTS "areas_select_own_coach" ON areas;
CREATE POLICY "areas_select_own_coach" ON areas
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "areas_insert_own_coach" ON areas;
CREATE POLICY "areas_insert_own_coach" ON areas
  FOR INSERT WITH CHECK (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "areas_update_own_coach" ON areas;
CREATE POLICY "areas_update_own_coach" ON areas
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "areas_delete_own_coach" ON areas;
CREATE POLICY "areas_delete_own_coach" ON areas
  FOR DELETE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

-- FACILITIES table
DROP POLICY IF EXISTS "facilities_select_own_coach" ON facilities;
CREATE POLICY "facilities_select_own_coach" ON facilities
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "facilities_insert_own_coach" ON facilities;
CREATE POLICY "facilities_insert_own_coach" ON facilities
  FOR INSERT WITH CHECK (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "facilities_update_own_coach" ON facilities;
CREATE POLICY "facilities_update_own_coach" ON facilities
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "facilities_delete_own_coach" ON facilities;
CREATE POLICY "facilities_delete_own_coach" ON facilities
  FOR DELETE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

-- COURTS table
DROP POLICY IF EXISTS "courts_select_own_coach" ON courts;
CREATE POLICY "courts_select_own_coach" ON courts
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "courts_insert_own_coach" ON courts;
CREATE POLICY "courts_insert_own_coach" ON courts
  FOR INSERT WITH CHECK (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "courts_update_own_coach" ON courts;
CREATE POLICY "courts_update_own_coach" ON courts
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "courts_delete_own_coach" ON courts;
CREATE POLICY "courts_delete_own_coach" ON courts
  FOR DELETE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

-- AVAILABILITY_RANGES table
DROP POLICY IF EXISTS "availability_ranges_select_own_coach" ON availability_ranges;
CREATE POLICY "availability_ranges_select_own_coach" ON availability_ranges
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "availability_ranges_insert_own_coach" ON availability_ranges;
CREATE POLICY "availability_ranges_insert_own_coach" ON availability_ranges
  FOR INSERT WITH CHECK (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "availability_ranges_update_own_coach" ON availability_ranges;
CREATE POLICY "availability_ranges_update_own_coach" ON availability_ranges
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "availability_ranges_delete_own_coach" ON availability_ranges;
CREATE POLICY "availability_ranges_delete_own_coach" ON availability_ranges
  FOR DELETE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

-- BLACKOUT_DATES table
DROP POLICY IF EXISTS "blackout_dates_select_own_coach" ON blackout_dates;
CREATE POLICY "blackout_dates_select_own_coach" ON blackout_dates
  FOR SELECT USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "blackout_dates_insert_own_coach" ON blackout_dates;
CREATE POLICY "blackout_dates_insert_own_coach" ON blackout_dates
  FOR INSERT WITH CHECK (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "blackout_dates_update_own_coach" ON blackout_dates;
CREATE POLICY "blackout_dates_update_own_coach" ON blackout_dates
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

DROP POLICY IF EXISTS "blackout_dates_delete_own_coach" ON blackout_dates;
CREATE POLICY "blackout_dates_delete_own_coach" ON blackout_dates
  FOR DELETE USING (
    coach_id IN (SELECT id FROM coaches WHERE auth.uid() = id)
  );

-- ============================================
-- 6. ADD CRITICAL PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lessons_coach_date ON lessons(coach_id, date);
CREATE INDEX IF NOT EXISTS idx_lessons_student_date ON lessons(student_id, date);
CREATE INDEX IF NOT EXISTS idx_students_coach_name ON students(coach_id, name);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
-- After running, verify with: scripts/verifySupabaseMigrations.sql
-- 
-- Quick verification queries:
-- 
-- 1. Check version columns exist:
-- SELECT table_name, column_name FROM information_schema.columns 
-- WHERE table_schema = 'public' AND column_name = 'version';
--
-- 2. Check old insecure policies are gone:
-- SELECT policyname FROM pg_policies 
-- WHERE schemaname = 'public' AND policyname = 'Allow all operations for authenticated users';
-- (Should return 0 rows)
--
-- 3. Check new secure policies exist:
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE schemaname = 'public' AND policyname LIKE '%_own%' OR policyname LIKE '%_coach%'
-- ORDER BY tablename, policyname;
-- (Should show many rows with secure policies)

