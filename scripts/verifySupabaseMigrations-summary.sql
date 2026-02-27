-- ============================================
-- VERIFICATION SUMMARY - Shows all results in one view
-- Run this in Supabase SQL Editor
-- ============================================

-- Summary of Priority 1 Migration Status
SELECT * FROM (
SELECT 
  '✅ Priority 1: Version Columns' AS category,
  COUNT(*) AS found_count,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE - Expected 5, found ' || COUNT(*)::text
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'version'
  AND table_name IN ('coaches', 'students', 'lessons', 'booking_requests', 'student_notes')

UNION ALL

SELECT 
  '✅ Priority 1: Version Triggers' AS category,
  COUNT(*) AS found_count,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE - Expected 5, found ' || COUNT(*)::text
  END AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%version%'

UNION ALL

SELECT 
  '✅ Priority 1: Constraints' AS category,
  COUNT(*) AS found_count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE - Expected 5+, found ' || COUNT(*)::text
  END AS status
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conname LIKE 'check_%'

UNION ALL

SELECT 
  '🚨 Priority 1: Old Insecure Policies (should be 0)' AS category,
  COUNT(*) AS found_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SECURE - All removed'
    ELSE '❌ INSECURE - ' || COUNT(*)::text || ' insecure policies still exist!'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname = 'Allow all operations for authenticated users'

UNION ALL

SELECT 
  '✅ Priority 1: New Secure Policies' AS category,
  COUNT(*) AS found_count,
  CASE 
    WHEN COUNT(*) >= 30 THEN '✅ COMPLETE'
    ELSE '⚠️ INCOMPLETE - Expected 30+, found ' || COUNT(*)::text
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    policyname LIKE '%_own%' OR 
    policyname LIKE '%_coach%' OR
    policyname = 'booking_requests_public_insert'
  )

UNION ALL

SELECT 
  '✅ Priority 1: Performance Indexes' AS category,
  COUNT(*) AS found_count,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ COMPLETE'
    ELSE '⚠️ INCOMPLETE - Expected 3+, found ' || COUNT(*)::text
  END AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_lessons_coach_date%' OR
    indexname LIKE 'idx_lessons_student_date%' OR
    indexname LIKE 'idx_students_coach_name%'
  )

UNION ALL

SELECT 
  'Priority 2: Audit Logging' AS category,
  COUNT(*) AS found_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '⏳ NOT YET IMPLEMENTED'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'

UNION ALL

SELECT 
  'Priority 2: Soft Deletes (deleted_at columns)' AS category,
  COUNT(*) AS found_count,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ COMPLETE'
    WHEN COUNT(*) > 0 THEN '⚠️ PARTIAL - ' || COUNT(*)::text || ' columns found'
    ELSE '⏳ NOT YET IMPLEMENTED'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'deleted_at'

UNION ALL

SELECT 
  'Priority 3: Materialized View' AS category,
  COUNT(*) AS found_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '⏳ NOT YET IMPLEMENTED'
  END AS status
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname = 'coach_statistics'
) AS all_checks
ORDER BY 
  CASE 
    WHEN category LIKE '🚨%' THEN 1
    WHEN category LIKE '✅ Priority 1%' THEN 2
    WHEN category LIKE 'Priority 2%' THEN 3
    WHEN category LIKE 'Priority 3%' THEN 4
    ELSE 5
  END,
  category;

