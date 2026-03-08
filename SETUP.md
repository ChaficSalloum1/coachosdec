# CoachOS — Setup Checklist

> **How to use this file**
> Work through steps 1–5 in order. Each step tells you exactly where to click,
> what to copy, and where to paste it. Steps marked ✅ are already done.
> Steps marked ⚠️ require your action before the app works correctly.

---

## Step 1 — Supabase Database  ⚠️  DO THIS FIRST

**Why:** The app reads and writes all data (students, lessons, bookings) to Supabase.
Without the schema, every write is silently lost.

**Do this once:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select your project
   (`qtrrojhmgvlpmpchwjye`)
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase-schema.sql` in this repo
5. Copy the entire contents → paste into the SQL editor → click **Run**
6. You should see `Success. No rows returned` (or similar)

**Verify it worked:**

In Supabase → **Table Editor**, you should now see these tables:
`coaches`, `students`, `lessons`, `booking_requests`, `areas`, `facilities`,
`courts`, `availability_ranges`, `blackout_dates`, `student_notes`

> **Already have tables from an older schema?**
> Run the scripts in `/scripts/` in this order:
> 1. `cleanup-before-migration.sql`
> 2. `priority1-migration.sql`
> 3. `priority2-soft-deletes-migration.sql`
> 4. `priority3-security-hardening.sql`

---

## Step 2 — Supabase Credentials  ✅  ALREADY DONE

The `.env` file already contains your Supabase URL and anon key.
No action needed here.

---

## Step 3 — First Login & Profile Creation

**This is how you (the coach) first use the app:**

1. Build and run the app on your phone or simulator
2. The **CoachOS login screen** appears (not the main app)
3. Tap **Sign up**
4. Enter your real email + a strong password → tap **Create Account**
5. The **onboarding screen** appears — fill in your name, sport(s), price/hr
6. Tap **Get Started** → you're in

> **Important:** Your coach profile ID in the database is tied to your login.
> If you sign in with a different email, you'll get a fresh empty profile.
> Always use the same email.

---

## Step 4 — Push Notifications  (OPTIONAL but recommended)

**Why:** The app can send you a notification when a student submits a booking request.

### 4a — Expo Project ID

1. Go to [expo.dev](https://expo.dev) → log in
2. Create a new project (or use an existing one) — name it `CoachOS`
3. Go to **Project Settings** → copy the **Project ID** (a UUID)
4. Open `.env` → paste it as `EXPO_PUBLIC_PROJECT_ID=<paste here>`

### 4b — iOS Push Certificate

1. You need an [Apple Developer account](https://developer.apple.com) ($99/year)
2. Follow Expo's guide: [https://docs.expo.dev/push-notifications/push-notifications-setup/](https://docs.expo.dev/push-notifications/push-notifications-setup/)
3. Run `eas credentials` to configure certificates automatically

### 4c — Android (Firebase)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → Add Android app → package name: `app.coachos.mobile`
3. Download `google-services.json`
4. Place it in the root of this repo
5. Uncomment `"googleServicesFile": "./google-services.json"` in `app.json`

---

## Step 5 — Optional Services

Both are free tier. Skip any you don't want right now.

### Sentry (Crash Reporting)

1. [sentry.io](https://sentry.io) → New Project → React Native → name: `coachos`
2. Copy the DSN (looks like `https://abc@o123.ingest.sentry.io/456`)
3. Open `.env` → paste as `EXPO_PUBLIC_SENTRY_DSN=<paste here>`

### PostHog (Analytics — which screens coaches use most)

1. [eu.posthog.com](https://eu.posthog.com) → New Project → name: `CoachOS`
2. Settings → copy the **Project API Key** (starts with `phc_`)
3. Open `.env` → paste as `EXPO_PUBLIC_POSTHOG_KEY=<paste here>`

---

## Step 6 — E2E Tests (Maestro)  (Run after every major change)

**Why:** These tests catch regressions automatically — does login work, can a student
be added, are booking approvals creating lessons, is Coach B's data hidden from Coach A?

### 6a — One-time setup

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Build the app (iOS example)
npx expo run:ios
```

### 6b — Create test accounts in Supabase

In Supabase Dashboard → **Authentication** → **Users** → **Add user**:
- Email: `coach-a@test.com`  Password: `TestPassword123!`
- Email: `coach-b@test.com`  Password: `TestPassword123!`

Then open each account in **Authentication → Users** → click the user →
tick **"Email confirmed"** (skips confirmation email for test accounts).

> Update credentials in `maestro/.maestro.yaml` if you use different values.

### 6c — Run onboarding once per test account

Launch the app, sign in as `coach-a@test.com`, complete the onboarding form.
Repeat for `coach-b@test.com`. Both accounts need a coach profile before the
RLS security test will pass.

### 6d — Run the tests

```bash
# All tests (run on a connected device or simulator)
bun run test:maestro

# Individual tests
maestro test maestro/navigation-test.yaml
maestro test maestro/create-student-test.yaml
maestro test maestro/rls-security-test.yaml   # ← run this one after every schema change
```

---

## Security Notes

| What | Status |
|---|---|
| Row Level Security (RLS) | ✅ Enabled — coaches can only see their own data |
| Public booking requests | ✅ Students can submit bookings without an account |
| Coach data isolation | ⚠️ Verify with `rls-security-test.yaml` after schema changes |
| Auth credentials in source | ✅ `.env` is in `.gitignore` and never committed |
| AI API keys | ✅ Removed — no API cost for AI features |

---

## Quick Reference

| Thing | Where to find it |
|---|---|
| Supabase dashboard | [supabase.com/dashboard](https://supabase.com/dashboard) → project `qtrrojhmgvlpmpchwjye` |
| Supabase auth users | Dashboard → Authentication → Users |
| Supabase SQL editor | Dashboard → SQL Editor |
| Environment variables | `.env` in the root of this repo |
| E2E test config | `maestro/.maestro.yaml` |
| Database schema | `supabase-schema.sql` |
| App name / bundle ID | `app.json` |

---

## What each part of the app needs to work

| Feature | Needs |
|---|---|
| Coach login / signup | Supabase ✅ |
| Student / lesson management | Supabase + schema run ⚠️ |
| Public booking (QR / link) | Supabase + schema run ⚠️ |
| Booking push notifications | Expo Project ID + Apple/Firebase certs ⚠️ |
| Crash reports | Sentry DSN ⚠️ |
| Usage analytics | PostHog key ⚠️ |
| Calendar sync | iOS/Android calendar permission (asked at runtime) ✅ |
