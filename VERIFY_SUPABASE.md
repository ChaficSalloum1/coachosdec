# ✅ How to Verify Supabase is Properly Set Up

## Step 1: Check Environment Variables

Your `.env` file should have these two lines:

```bash
EXPO_PUBLIC_VIBECODE_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY=your_supabase_key
```

**To verify:**
1. Check that `.env` file exists in your project root
2. Make sure both variables are set (not empty)
3. Restart your Expo app after adding/changing these

---

## Step 2: Check Database Tables

Go to your Supabase dashboard and verify tables exist:

1. Go to https://app.supabase.com
2. Click on your project
3. Click **"Table Editor"** in the left sidebar
4. You should see these tables:
   - ✅ `coaches`
   - ✅ `students`
   - ✅ `lessons`
   - ✅ `booking_requests`
   - ✅ `student_notes`
   - ✅ `areas`
   - ✅ `facilities`
   - ✅ `courts`
   - ✅ `availability_ranges`
   - ✅ `blackout_dates`

**If tables are missing:** Run the `supabase-schema.sql` script in Supabase SQL Editor

---

## Step 3: Test the Connection

### Quick Test in Your App

1. **Start your Expo app** (if not already running)
2. **Check the console/logs** for these messages:
   - ✅ `🔄 Loading data from Supabase...` (when app starts)
   - ✅ `✅ Data loaded from Supabase` (if connection works)
   - ❌ `⚠️ Could not load data from Supabase` (if there's an issue)

### Test by Using the App

1. **Add a student** in your app
2. **Go to Supabase dashboard** → Table Editor → `students` table
3. **Check if the student appears** in the database
4. **Delete the student** in your app
5. **Check Supabase again** - the student should be deleted from the database

---

## Step 4: Check for Errors

### Common Issues:

**"Supabase credentials are required" error:**
- ❌ Environment variables not set
- ✅ Fix: Add them to `.env` and restart app

**"Table doesn't exist" error:**
- ❌ Database tables not created
- ✅ Fix: Run `supabase-schema.sql` in Supabase SQL Editor

**"Could not load data from Supabase" warning:**
- ❌ Connection issue or RLS policies blocking access
- ✅ Check Supabase project is active (not paused)
- ✅ Check RLS policies allow operations

**Data not syncing:**
- ❌ Check console for errors
- ✅ Make sure coach ID exists
- ✅ Verify Supabase connection is working

---

## Step 5: Verify Sync is Working

### Test Deletion Sync (New Feature!)

1. **Add an area** in your app
2. **Check Supabase** - it should appear in `areas` table
3. **Delete the area** in your app
4. **Check Supabase** - it should be removed from `areas` table ✅

Repeat for: facilities, courts, availability ranges, blackout dates

---

## Quick Verification Checklist

- [ ] `.env` file has Supabase credentials
- [ ] Expo app has been restarted after adding credentials
- [ ] All 10 database tables exist in Supabase
- [ ] App console shows "✅ Data loaded from Supabase" (or no errors)
- [ ] Adding data in app → appears in Supabase
- [ ] Deleting data in app → removed from Supabase
- [ ] No errors in console/logs

---

## Still Having Issues?

1. **Check Supabase project status** - make sure it's not paused
2. **Check RLS policies** - they should allow all operations (for now)
3. **Check network connection** - app needs internet to connect to Supabase
4. **Check console logs** - look for specific error messages
5. **Verify credentials** - make sure URL and key are correct (no extra spaces)

