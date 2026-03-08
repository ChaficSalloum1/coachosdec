# Supabase Migration Status Checklist

Use this checklist to verify which migrations have been applied to your Supabase database.

## How to Verify

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `scripts/verifySupabaseMigrations.sql`
3. Run the query
4. Check the results against this checklist

---

## ✅ Priority 1: Critical Security Fixes

### Version Columns
- [ ] `coaches.version` column exists
- [ ] `students.version` column exists
- [ ] `lessons.version` column exists
- [ ] `booking_requests.version` column exists
- [ ] `student_notes.version` column exists

### Version Increment Triggers
- [ ] `increment_coaches_version` trigger exists
- [ ] `increment_students_version` trigger exists
- [ ] `increment_lessons_version` trigger exists
- [ ] `increment_booking_requests_version` trigger exists
- [ ] `increment_student_notes_version` trigger exists

### Database Constraints
- [ ] `check_lesson_times` constraint exists (end_time > start_time)
- [ ] `check_lesson_duration` constraint exists (duration > 0 AND <= 480)
- [ ] `check_lesson_price` constraint exists (price >= 0)
- [ ] `check_price_per_hour` constraint exists on coaches
- [ ] `check_availability_times` constraint exists

### RLS Policies (CRITICAL - Most Important!)
**Check that OLD insecure policies are REMOVED:**
- [ ] ❌ "Allow all operations for authenticated users" policy is **DELETED** from coaches
- [ ] ❌ "Allow all operations for authenticated users" policy is **DELETED** from students
- [ ] ❌ "Allow all operations for authenticated users" policy is **DELETED** from lessons
- [ ] ❌ "Allow all operations for authenticated users" policy is **DELETED** from all other tables

**Check that NEW secure policies are CREATED:**
- [ ] ✅ `coaches_select_own` policy exists
- [ ] ✅ `coaches_update_own` policy exists
- [ ] ✅ `coaches_insert_own` policy exists
- [ ] ✅ `students_select_own_coach` policy exists
- [ ] ✅ `students_insert_own_coach` policy exists
- [ ] ✅ `students_update_own_coach` policy exists
- [ ] ✅ `students_delete_own_coach` policy exists
- [ ] ✅ Similar policies exist for lessons, booking_requests, student_notes, areas, facilities, courts, availability_ranges, blackout_dates

### Performance Indexes
- [ ] `idx_lessons_coach_date` index exists
- [ ] `idx_lessons_student_date` index exists
- [ ] `idx_students_coach_name` index exists

---

## ✅ Priority 2: Audit Logging

- [ ] `audit_logs` table exists
- [ ] `audit_trigger_func()` function exists
- [ ] `audit_lessons` trigger exists
- [ ] `audit_students` trigger exists
- [ ] `audit_coaches` trigger exists
- [ ] `audit_booking_requests` trigger exists
- [ ] `audit_logs_coach_access` RLS policy exists

---

## ✅ Priority 2: Soft Deletes

- [ ] `coaches.deleted_at` column exists
- [ ] `students.deleted_at` column exists
- [ ] `lessons.deleted_at` column exists
- [ ] `booking_requests.deleted_at` column exists
- [ ] `student_notes.deleted_at` column exists
- [ ] `areas.deleted_at` column exists
- [ ] `facilities.deleted_at` column exists
- [ ] `courts.deleted_at` column exists
- [ ] `availability_ranges.deleted_at` column exists
- [ ] `blackout_dates.deleted_at` column exists

---

## ✅ Priority 2: Additional Performance Indexes

- [ ] `idx_booking_requests_coach_status_date` index exists
- [ ] `pg_trgm` extension is enabled
- [ ] `idx_students_name_trgm` GIN index exists
- [ ] `idx_coaches_payment_settings` GIN index exists

---

## ✅ Priority 3: Analytics View

- [ ] `coach_statistics` materialized view exists
- [ ] `refresh_coach_statistics()` function exists
- [ ] `idx_coach_statistics_coach_id` unique index exists

---

## 🚨 Critical Issues to Check

### If RLS Policies Are Still Insecure:
If you see policies like:
```sql
"Allow all operations for authenticated users" ... USING (true) WITH CHECK (true)
```

**STOP** - Your database is still insecure! You need to:
1. Drop these policies
2. Create the secure policies from Step 2 of the migration guide

### If Version Columns Are Missing:
Your app will have sync conflicts. Make sure all version columns and triggers are created.

### If Constraints Are Missing:
Invalid data can be inserted (negative prices, invalid times, etc.)

---

## Next Steps After Verification

1. **If everything is checked ✅**: Your database is secure and ready!
2. **If RLS policies are still insecure ❌**: Run Step 2 migration immediately
3. **If version columns are missing**: Run Step 2 migration (version columns section)
4. **If other items are missing**: Run the corresponding migration steps

---

## Test Your RLS Policies

After verifying migrations, test with two coach accounts:

1. Log in as Coach A → Create a student
2. Log out
3. Log in as Coach B → Should NOT see Coach A's student
4. If Coach B CAN see Coach A's student → RLS policies are NOT working!

