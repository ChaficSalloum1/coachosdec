# 🚀 Simple Setup Instructions - Do These 3 Steps

## ✅ Step 1: Add Your Supabase Credentials (2 minutes)

**What to do:**
1. Look for a file called `.env` in your project root (the main folder)
   - If it doesn't exist, create a new file called `.env`
2. Open the `.env` file and add these two lines (replace with your own Supabase credentials):

```
EXPO_PUBLIC_VIBECODE_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**How to get your credentials:**
- Go to https://app.supabase.com
- Click on your project
- Go to **Settings** → **API**
- Copy the **Project URL** and **anon/public key**
- Replace the placeholders above with your actual credentials

3. **Save the file**
4. **Stop your Expo app** (if it's running) and **restart it**
   - This is important! The app needs to restart to see the new environment variables

---

## ✅ Step 2: Create Database Tables (5 minutes)

**What to do:**
1. Go to https://app.supabase.com in your web browser
2. Sign in and click on your project
3. In the left sidebar, click **"SQL Editor"** (it has a database icon)
4. Click the **"New query"** button at the top
5. In this project folder, open the file called `supabase-schema.sql`
6. Select ALL the text in that file:
   - Click at the very beginning
   - Hold Shift and click at the very end
   - Or press Ctrl+A (Windows/Linux) or Cmd+A (Mac)
7. Copy it (Ctrl+C or Cmd+C)
8. Go back to Supabase and paste it into the big text box (Ctrl+V or Cmd+V)
9. Click the **"Run"** button (green button at the bottom right)
   - Or press Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
10. Wait a few seconds - you should see a green checkmark ✅ and "Success. No rows returned"
    - This means it worked!

**That's it!** Your database now has all the tables your app needs.

---

## ✅ Step 3: Test It Works (1 minute)

**What to do:**
1. Make sure your Expo app is running (restart it if you haven't already)
2. Use your app normally - add a student, create a lesson, etc.
3. Go back to Supabase dashboard
4. Click **"Table Editor"** in the left sidebar
5. You should see all your tables listed (coaches, students, lessons, etc.)
6. Click on any table (like "students") to see your data!

**If you see your data in Supabase, it's working! 🎉**

---

## 🎉 You're Done!

Your app is now connected to Supabase. All your data (students, lessons, bookings, etc.) will be:
- ✅ Saved in the cloud automatically
- ✅ Synced across all your devices
- ✅ Backed up safely
- ✅ Available even if you delete and reinstall the app

**The app works exactly the same as before** - you don't need to do anything different. The sync happens automatically in the background!

---

## ❓ Troubleshooting

**"Supabase credentials are required" error:**
- Make sure you added the environment variables
- Make sure you restarted your Expo server after adding them
- Check that the variable names match exactly (case-sensitive)

**"Table doesn't exist" error:**
- Go back to Step 2 and make sure you ran the SQL script
- Check in Supabase Dashboard > Table Editor to see if tables were created

**Still having issues?**
- Check the console/logs for specific error messages
- Make sure your Supabase project is active (not paused)

