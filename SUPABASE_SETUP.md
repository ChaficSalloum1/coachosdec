# 🚀 Supabase Setup Guide

## ✅ What's Already Done

1. **Supabase Client Installed** - `@supabase/supabase-js` package is installed
2. **Client Configuration** - Created at `src/api/supabase.ts`
3. **Authentication Service** - Created at `src/services/authService.ts`
4. **Database Service** - Created at `src/services/databaseService.ts`

## 🔑 Next Steps: Environment Variables

You need to add your Supabase credentials to your environment variables. Based on your project's pattern, add these:

### Required Environment Variables

Add these to your `.env` file (replace with your own credentials):

```
EXPO_PUBLIC_VIBECODE_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**⚠️ Security Note:** Never commit your actual credentials to version control. Always use placeholders in documentation and add real credentials to `.env` (which should be in `.gitignore`).

### How to Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Click on your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `EXPO_PUBLIC_VIBECODE_SUPABASE_URL`
   - **anon/public key** → Use for `EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY`

### Where to Add Environment Variables

Since you're using Expo, you can add these in your Expo environment configuration (ENV tab in your development environment).

## 📖 Usage Examples

### Authentication

```typescript
import { signIn, signUp, signOut, getCurrentUser } from "./src/services/authService";

// Sign up a new user
const { user, session, error } = await signUp({
  email: "user@example.com",
  password: "securepassword",
  metadata: { name: "John Doe" }
});

// Sign in
const { user, session, error } = await signIn({
  email: "user@example.com",
  password: "securepassword"
});

// Get current user
const user = await getCurrentUser();

// Sign out
await signOut();
```

### Database Operations

```typescript
import { 
  fetchFromTable, 
  fetchById, 
  insertIntoTable, 
  updateTable, 
  deleteFromTable 
} from "./src/services/databaseService";

// Fetch all records from a table
const { data, error } = await fetchFromTable("students", {
  filters: { coachId: "123" },
  orderBy: { column: "name", ascending: true },
  limit: 10
});

// Fetch a single record
const { data, error } = await fetchById("students", "student-id");

// Insert a new record
const { data, error } = await insertIntoTable("students", {
  name: "John Doe",
  email: "john@example.com",
  coachId: "123"
});

// Update a record
const { data, error } = await updateTable("students", "student-id", {
  name: "Jane Doe"
});

// Delete a record
const { data, error } = await deleteFromTable("students", "student-id");
```

### Real-time Subscriptions

```typescript
import { subscribeToTable } from "./src/services/databaseService";

// Subscribe to changes in a table
const unsubscribe = subscribeToTable("lessons", (payload) => {
  console.log("Event:", payload.eventType);
  console.log("New data:", payload.new);
  console.log("Old data:", payload.old);
});

// Later, unsubscribe
unsubscribe();
```

### Direct Supabase Client Access

```typescript
import { getSupabaseClient } from "./src/api/supabase";

const supabase = getSupabaseClient();

// Use any Supabase feature directly
const { data, error } = await supabase
  .from("your_table")
  .select("*");
```

## 🔒 Security Notes

- **Never commit your Supabase keys to version control**
- The `anon` key is safe to use in client-side code (it's public)
- For server-side operations, use the `service_role` key (keep it secret!)
- Always use Row Level Security (RLS) policies in Supabase to protect your data

## 📚 Next Steps

1. Add your environment variables
2. Set up your database tables in Supabase
3. Configure Row Level Security (RLS) policies
4. Start using the services in your app!

## 🆘 Troubleshooting

### "Supabase credentials are required" error
- Make sure you've added both environment variables
- Restart your Expo development server after adding env vars
- Check that variable names match exactly (case-sensitive)

### Authentication not working
- Verify your Supabase project has authentication enabled
- Check that email/password auth is enabled in Supabase dashboard
- Ensure your redirect URLs are configured in Supabase settings

### Database queries failing
- Verify your table names match exactly
- Check that RLS policies allow your operations
- Ensure your user is authenticated if RLS is enabled

