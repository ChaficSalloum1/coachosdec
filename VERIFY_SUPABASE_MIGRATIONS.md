# How to Verify Your Supabase Migrations

## Quick Verification Steps

### Step 1: Run Verification Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `scripts/verifySupabaseMigrations.sql`
4. Paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

### Step 2: Check Results

The query will return 9 result sets. Here's what to look for:

---

## ✅ What You Should See (If Migrations Were Applied)

### Result Set 1: Version Columns
Should show 5 rows:
- coaches.version
- students.version
- lessons.version
- booking_requests.version
- student_notes.version

**If empty**: Version columns weren't added. Run Step 2 migration.

### Result Set 2: Version Triggers
Should show 5 triggers:
- increment_coaches_version
- increment_students_version
- increment_lessons_version
- increment_booking_requests_version
- increment_student_notes_version

**If empty**: Version triggers weren't created. Run Step 2 migration.

### Result Set 3: Constraints
Should show 5 constraints:
- check_lesson_times
- check_lesson_duration
- check_lesson_price
- check_price_per_hour
- check_availability_times

**If empty**: Constraints weren't added. Run Step 2 migration.

### Result Set 4: RLS Policies ⚠️ **MOST CRITICAL**

**Should NOT see:**
- ❌ "Allow all operations for authenticated users" with `USING (true)`

**Should see:**
- ✅ `coaches_select_own`
- ✅ `coaches_update_own`
- ✅ `coaches_insert_own`
- ✅ `students_select_own_coach`
- ✅ `students_insert_own_coach`
- ✅ `students_update_own_coach`
- ✅ `students_delete_own_coach`
- ✅ Similar policies for other tables

**If you see the old "Allow all operations" policies**: Your database is still insecure! You need to run Step 2 migration immediately.

### Result Set 5: Audit Logs Table
Should show columns:
- id, table_name, record_id, action, old_data, new_data, user_id, ip_address, user_agent, created_at

**If empty**: Audit logging wasn't set up. Run Step 4 migration.

### Result Set 6: Audit Triggers
Should show triggers:
- audit_lessons
- audit_students
- audit_coaches
- audit_booking_requests

**If empty**: Audit triggers weren't created. Run Step 4 migration.

### Result Set 7: Soft Delete Columns
Should show `deleted_at` column for:
- coaches, students, lessons, booking_requests, student_notes, areas, facilities, courts, availability_ranges, blackout_dates

**If empty**: Soft deletes weren't added. Run Step 3 migration.

### Result Set 8: Performance Indexes
Should show indexes:
- idx_lessons_coach_date
- idx_lessons_student_date
- idx_students_coach_name
- idx_booking_requests_coach_status_date
- idx_students_name_trgm (if text search was added)
- idx_coaches_payment_settings (if JSONB index was added)

**If missing some**: Run Step 5 migration for missing indexes.

### Result Set 9: Materialized View
Should show:
- coach_statistics materialized view

**If empty**: Analytics view wasn't created. Run Step 6 migration (optional).

---

## 🚨 Critical: Test RLS Policies Manually

Even if the verification script shows policies exist, **test them manually**:

1. **Create two test coach accounts** in Supabase Auth:
   - Coach A: `coach-a@test.com` / `password123`
   - Coach B: `coach-b@test.com` / `password123`

2. **In your app:**
   - Log in as Coach A
   - Create a student (e.g., "Coach A's Student")
   - Log out
   - Log in as Coach B
   - Navigate to Students screen

3. **Expected Result:**
   - ✅ Coach B should NOT see "Coach A's Student"
   - ✅ Coach B can create their own students

4. **If Coach B CAN see Coach A's student:**
   - ❌ RLS policies are NOT working correctly
   - Check that `coach.id` matches `auth.uid()` in your app
   - Verify policies were created correctly

---

## 📋 Migration Checklist

Use `SUPABASE_MIGRATION_STATUS.md` for a detailed checklist of what should be applied.

---

## 🔧 If Migrations Are Missing

If verification shows missing items:

1. **RLS Policies Missing/Insecure**: Run Step 2 from the migration guide (CRITICAL)
2. **Version Columns Missing**: Run Step 2 migration
3. **Constraints Missing**: Run Step 2 migration
4. **Audit Logging Missing**: Run Step 4 migration
5. **Soft Deletes Missing**: Run Step 3 migration
6. **Indexes Missing**: Run Step 5 migration

All SQL scripts are in `SUPABASE_DATABASE_AUDIT.md` at the specified line numbers.

---

## ✅ Success Criteria

Your Supabase database is secure and ready when:

- [ ] ✅ All version columns exist
- [ ] ✅ All version triggers exist
- [ ] ✅ All constraints exist
- [ ] ✅ OLD insecure RLS policies are DELETED
- [ ] ✅ NEW secure RLS policies are CREATED
- [ ] ✅ Manual RLS test passes (Coach B cannot see Coach A's data)
- [ ] ✅ Audit logging is set up (if you ran Step 4)
- [ ] ✅ Soft deletes are added (if you ran Step 3)

---

## 🆘 Need Help?

If verification shows issues:

1. Check `SUPABASE_DATABASE_AUDIT.md` for the exact SQL to run
2. Make sure you ran the migrations in order (Step 2 first!)
3. Check for error messages in Supabase SQL Editor
4. Verify your app uses `auth.uid()` for coach IDs (code is already updated)

