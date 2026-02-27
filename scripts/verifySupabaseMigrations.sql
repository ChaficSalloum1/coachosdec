-- ============================================
-- VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to check what migrations were applied
-- ============================================

-- 1. Check if version columns exist
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'version'
  AND table_name IN ('coaches', 'students', 'lessons', 'booking_requests', 'student_notes')
ORDER BY table_name;

-- 2. Check if version increment triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%version%'
ORDER BY event_object_table, trigger_name;

-- 3. Check if constraints exist
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conname LIKE 'check_%'
ORDER BY conrelid::regclass, conname;

-- 4. Check RLS policies (CRITICAL - verify old insecure policies are gone)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('coaches', 'students', 'lessons', 'booking_requests', 'student_notes', 'areas', 'facilities', 'courts', 'availability_ranges', 'blackout_dates')
ORDER BY tablename, policyname;

-- 5. Check if audit_logs table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 6. Check if audit triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'audit_%'
ORDER BY event_object_table;

-- 7. Check if deleted_at columns exist (soft deletes)
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'deleted_at'
ORDER BY table_name;

-- 8. Check if performance indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_lessons_coach_date%' OR
    indexname LIKE 'idx_lessons_student_date%' OR
    indexname LIKE 'idx_students_coach_name%' OR
    indexname LIKE 'idx_booking_requests_coach_status_date%' OR
    indexname LIKE 'idx_students_name_trgm%' OR
    indexname LIKE 'idx_coaches_payment_settings%'
  )
ORDER BY tablename, indexname;

-- 9. Check if materialized view exists
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname = 'coach_statistics';

