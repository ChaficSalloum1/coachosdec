# 📤 How to Deploy Changes to Your Server

Since you're using a builder platform, here are the files that need to be updated on your server:

## Files Changed (3 files)

1. `src/hooks/useSupabaseSync.ts` - Added deletion sync logic
2. `SETUP_INSTRUCTIONS.md` - Removed hardcoded credentials  
3. `SUPABASE_SETUP.md` - Removed hardcoded credentials

## Method 1: Copy Files via SCP (Recommended)

From your local machine (not the SSH session), run these commands:

```bash
# Replace 'user@vibecodeapp.com' with your actual SSH connection details
# Replace '/path/to/project' with your actual project path on the server

# Copy the sync hook file
scp src/hooks/useSupabaseSync.ts user@vibecodeapp.com:/path/to/project/src/hooks/

# Copy the documentation files (optional - these are just docs)
scp SETUP_INSTRUCTIONS.md user@vibecodeapp.com:/path/to/project/
scp SUPABASE_SETUP.md user@vibecodeapp.com:/path/to/project/
```

## Method 2: Edit Files Directly via SSH

If you're already connected via SSH in Cursor:

1. Open the file: `src/hooks/useSupabaseSync.ts`
2. The changes are already in your local workspace
3. The file should sync automatically if you're editing it in Cursor

## Method 3: Check Builder Auto-Deploy

1. Go to your builder dashboard (vibecodeapp.com)
2. Look for "Deployments" or "Builds" section
3. Check if there's an auto-deploy from git enabled
4. If yes, the changes should deploy automatically after the git push

## What Changed?

### useSupabaseSync.ts
- Added `deleteFromSupabase` import
- Added deletion logic for: areas, facilities, courts, availabilityRanges, blackoutDates
- Now properly syncs deletions to Supabase (not just additions/updates)

### Documentation Files
- Removed hardcoded Supabase credentials
- Added placeholders and security warnings
- Added instructions on how to get credentials

## After Deploying

1. Restart your Expo app on the server (if needed)
2. Test that deletions work - delete an area/facility/court and verify it's removed from Supabase
3. Verify the app still works normally

