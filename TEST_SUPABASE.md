# ✅ Test Your Supabase Setup

Now that tables are created, let's verify everything works!

## Step 1: Check Console Logs

When you restart your Expo app, look for these messages in the console:

### ✅ Success Messages:
- `✅ Supabase: Connection successful and tables exist!`

### ⚠️ Warning Messages (need fixing):
- `⚠️ Supabase: Credentials not configured` → Add to `.env` file
- `⚠️ Supabase: Credentials contain placeholders` → Replace with real values
- `⚠️ Supabase: Tables don't exist` → Run SQL script (you already did this!)
- `⚠️ Supabase: Connection error` → Check credentials and project status

---

## Step 2: Test Data Sync

### Test Adding Data:
1. **Open your app**
2. **Add a student** (or any data)
3. **Go to Supabase Dashboard** → Table Editor → `students` table
4. **Check if the student appears** in the database ✅

### Test Deleting Data:
1. **Delete an area/facility/court** in your app
2. **Go to Supabase Dashboard** → Table Editor → check the corresponding table
3. **Verify it's removed** from the database ✅

---

## Step 3: Verify All Tables Exist

Go to Supabase Dashboard → Table Editor, you should see:

- ✅ `coaches`
- ✅ `areas`
- ✅ `facilities`
- ✅ `courts`
- ✅ `students`
- ✅ `student_notes`
- ✅ `lessons`
- ✅ `booking_requests`
- ✅ `availability_ranges`
- ✅ `blackout_dates`

---

## Step 4: Check for Errors

If you see errors in console:

1. **"Table doesn't exist"** → Make sure you ran the full SQL script
2. **"Permission denied"** → Check RLS policies (they should allow all operations)
3. **"Connection failed"** → Check your Supabase project is active (not paused)
4. **"Invalid credentials"** → Verify `.env` file has correct URL and key

---

## 🎉 Success Checklist

- [ ] Console shows `✅ Supabase: Connection successful`
- [ ] All 10 tables visible in Supabase Table Editor
- [ ] Adding data in app → appears in Supabase
- [ ] Deleting data in app → removed from Supabase
- [ ] No errors in console

---

## Next Steps

Once everything is verified:
- Your app will automatically sync all data to Supabase
- Data will be backed up in the cloud
- Changes sync in real-time (with 2-second debounce)

Everything should be working now! 🚀

