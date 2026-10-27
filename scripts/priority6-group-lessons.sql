-- ============================================
-- PRIORITY 6: GROUP LESSONS
-- Run in the Supabase SQL Editor AFTER priority1-5.
--
-- Group lessons are stored as one lesson per player (so payments, notes and
-- totals stay per player). Lessons that share a group_id are the same session.
-- Additive and idempotent: adds two nullable columns, a pair of checks and an
-- index. Existing lessons are untouched (both columns stay NULL).
-- ============================================

BEGIN;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS group_id UUID;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS group_capacity INTEGER;

ALTER TABLE lessons DROP CONSTRAINT IF EXISTS check_lesson_group_capacity;
ALTER TABLE lessons ADD CONSTRAINT check_lesson_group_capacity
  CHECK (group_capacity IS NULL OR group_capacity BETWEEN 2 AND 12);

-- A lesson is either an ordinary one (both NULL) or a group member (both set).
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS check_lesson_group_pair;
ALTER TABLE lessons ADD CONSTRAINT check_lesson_group_pair
  CHECK ((group_id IS NULL) = (group_capacity IS NULL));

CREATE INDEX IF NOT EXISTS idx_lessons_group_id ON lessons(group_id) WHERE group_id IS NOT NULL;

COMMIT;

-- Verify (expect two rows):
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'lessons' AND column_name IN ('group_id', 'group_capacity');
