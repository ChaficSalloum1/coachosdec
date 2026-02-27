-- ============================================
-- PRIORITY 2: SOFT DELETES MIGRATION
-- Run this in Supabase SQL Editor AFTER priority1-migration.sql
-- This adds deleted_at columns for soft delete support
-- ============================================

BEGIN;

-- ============================================
-- 1. ADD deleted_at COLUMNS TO ALL TABLES
-- ============================================
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE student_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE availability_ranges ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE blackout_dates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- 2. CREATE INDEXES FOR SOFT DELETE QUERIES
-- These improve performance when filtering out deleted records
-- ============================================
CREATE INDEX IF NOT EXISTS idx_coaches_deleted_at ON coaches(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_deleted_at ON lessons(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_booking_requests_deleted_at ON booking_requests(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_notes_deleted_at ON student_notes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_areas_deleted_at ON areas(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_deleted_at ON facilities(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courts_deleted_at ON courts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_availability_ranges_deleted_at ON availability_ranges(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blackout_dates_deleted_at ON blackout_dates(deleted_at) WHERE deleted_at IS NULL;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
-- Quick verification query:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND column_name = 'deleted_at'
-- ORDER BY table_name;
