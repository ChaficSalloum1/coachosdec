-- ============================================
-- CoachOS Database Schema for Supabase
-- ============================================
-- Run this SQL in your Supabase SQL Editor to create all tables + secure RLS.
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste this > Run
--
-- IMPORTANT: Run this ONCE on a fresh project. If you already ran an older
-- version, use the migration scripts in /scripts/ instead.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COACHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY,  -- Must equal auth.uid() — set in the app during onboarding
  name TEXT NOT NULL,
  photo TEXT,
  sports TEXT[] DEFAULT '{}',
  price_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_settings JSONB DEFAULT '{"cashEnabled": true}',
  availability JSONB DEFAULT '{}',
  blackout_dates TEXT[] DEFAULT '{}',
  booking_link TEXT UNIQUE,
  calendar_sync_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. AREAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. FACILITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. COURTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sport TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. STUDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  total_lessons INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  balance DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  last_lesson_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. STUDENT_NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  lesson_id UUID,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. LESSONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. BOOKING_REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_contact TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. AVAILABILITY_RANGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS availability_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. BLACKOUT_DATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blackout_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_students_coach_id ON students(coach_id);
CREATE INDEX IF NOT EXISTS idx_students_contact ON students(contact);
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_coach_id ON student_notes(coach_id);
CREATE INDEX IF NOT EXISTS idx_lessons_coach_id ON lessons(coach_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date);
CREATE INDEX IF NOT EXISTS idx_booking_requests_coach_id ON booking_requests(coach_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_availability_ranges_coach_id ON availability_ranges(coach_id);
CREATE INDEX IF NOT EXISTS idx_availability_ranges_day ON availability_ranges(day_of_week);
CREATE INDEX IF NOT EXISTS idx_blackout_dates_coach_id ON blackout_dates(coach_id);
CREATE INDEX IF NOT EXISTS idx_blackout_dates_date ON blackout_dates(date);
CREATE INDEX IF NOT EXISTS idx_areas_coach_id ON areas(coach_id);
CREATE INDEX IF NOT EXISTS idx_facilities_coach_id ON facilities(coach_id);
CREATE INDEX IF NOT EXISTS idx_facilities_area_id ON facilities(area_id);
CREATE INDEX IF NOT EXISTS idx_courts_coach_id ON courts(coach_id);
CREATE INDEX IF NOT EXISTS idx_courts_facility_id ON courts(facility_id);
CREATE INDEX IF NOT EXISTS idx_coaches_booking_link ON coaches(booking_link);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Philosophy:
--   • A coach can only read/write their OWN rows (auth.uid() = coach_id / id)
--   • Students (anonymous) can INSERT booking_requests via QR/link — no login needed
--   • Public can SELECT coaches, availability, lessons, areas, facilities, courts
--     to power the public booking page (read-only, no PII on students/notes)
-- ============================================

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;

-- ---- COACHES ----
-- Full access to own profile only
CREATE POLICY "coaches_own_profile" ON coaches
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public booking page: anyone can read any coach profile (to display name/price)
CREATE POLICY "coaches_public_read" ON coaches
  FOR SELECT USING (true);

-- ---- AREAS ----
CREATE POLICY "areas_own_data" ON areas
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Public booking page: read-only
CREATE POLICY "areas_public_read" ON areas
  FOR SELECT USING (true);

-- ---- FACILITIES ----
CREATE POLICY "facilities_own_data" ON facilities
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "facilities_public_read" ON facilities
  FOR SELECT USING (true);

-- ---- COURTS ----
CREATE POLICY "courts_own_data" ON courts
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "courts_public_read" ON courts
  FOR SELECT USING (true);

-- ---- STUDENTS (private — no public read) ----
CREATE POLICY "students_own_data" ON students
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- ---- STUDENT NOTES (private) ----
CREATE POLICY "student_notes_own_data" ON student_notes
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- ---- LESSONS ----
CREATE POLICY "lessons_own_data" ON lessons
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Public can read lesson date/time/status to check slot availability
CREATE POLICY "lessons_public_availability_read" ON lessons
  FOR SELECT USING (true);

-- ---- BOOKING REQUESTS ----
-- Coach manages their own requests
CREATE POLICY "booking_requests_own_data" ON booking_requests
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Anyone (student via QR/link, no account required) can submit a booking request
CREATE POLICY "booking_requests_public_insert" ON booking_requests
  FOR INSERT WITH CHECK (true);

-- ---- AVAILABILITY RANGES ----
CREATE POLICY "availability_own_data" ON availability_ranges
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Public booking page: read to generate available slots
CREATE POLICY "availability_public_read" ON availability_ranges
  FOR SELECT USING (true);

-- ---- BLACKOUT DATES ----
CREATE POLICY "blackout_dates_own_data" ON blackout_dates
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Public booking page: read to exclude blacked-out days
CREATE POLICY "blackout_dates_public_read" ON blackout_dates
  FOR SELECT USING (true);

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_notes_updated_at BEFORE UPDATE ON student_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_requests_updated_at BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_ranges_updated_at BEFORE UPDATE ON availability_ranges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Your database is ready.
-- ============================================
