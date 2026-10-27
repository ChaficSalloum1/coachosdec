-- ============================================
-- PRIORITY 8: RECURRING LESSON SERIES
-- Run in the Supabase SQL Editor AFTER priority1-7.
--
-- "Repeat weekly" creates one ordinary lesson per week. Lessons created
-- together share a series_id so the coach can cancel "this and all later"
-- in one tap. Additive and idempotent: one nullable column and an index.
-- Existing lessons are untouched (series_id stays NULL).
-- Without this script, only lessons created with "Repeat weekly" fail to save
-- (they wait in the offline queue); everything else keeps working.
-- ============================================

BEGIN;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS series_id UUID;

CREATE INDEX IF NOT EXISTS idx_lessons_series_id ON lessons(series_id) WHERE series_id IS NOT NULL;

COMMIT;

-- Verify (expect one row):
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'lessons' AND column_name = 'series_id';
