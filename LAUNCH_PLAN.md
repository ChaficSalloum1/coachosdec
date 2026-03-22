# CoachOS — Launch Plan
**Path from current state → TestFlight beta → App Store**
**Updated:** March 2026

> **Where is this file?** `/LAUNCH_PLAN.md` in the repo root.

---

## Current State Snapshot

| Area | Status |
|---|---|
| Supabase | ✅ Keys configured, migrations not yet run |
| Sentry crash reporting | ❌ Account not created, DSN empty |
| PostHog analytics | ❌ Account not created, key empty |
| RevenueCat subscriptions | ❌ Project not created, keys not in .env |
| Expo Push Notifications | ❌ Expo project not linked |
| Maestro E2E tests | ⚠️ Bundle ID fixed, test accounts need real credentials |
| App name / version | ✅ "CoachOS", `1.0.0`, `app.coachos.mobile` |

---

## Phase 0 — Infrastructure (Days 1–2)
*Get every external service wired before anyone runs the app in anger*

### 0A — Supabase Migrations (Day 1, 30 min)
Run these in Supabase SQL Editor **in order**:
1. `scripts/priority1-migration.sql` — CRITICAL
2. `scripts/priority2-soft-deletes-migration.sql`
3. `scripts/priority3-security-hardening.sql`

Then run `scripts/verifySupabaseMigrations.sql` to confirm. You should see all checks pass.

---

### 0B — Sentry (Day 1, 15 min)
1. Go to [sentry.io](https://sentry.io) → New Project → **React Native** → name it `coachos`
2. Copy the DSN (format: `https://abc123@oXXX.ingest.sentry.io/456`)
3. Paste into `.env`: `EXPO_PUBLIC_SENTRY_DSN=<your-dsn>`
4. Add to `app.json` plugins array:
   ```json
   ["@sentry/react-native/expo", { "organization": "your-org", "project": "coachos" }]
   ```
5. Throw a test error in dev — confirm it appears in the Sentry dashboard

**Why now:** You need to know about crashes from the first beta coach. Flying blind is not an option.

---

### 0C — PostHog (Day 1, 15 min)
1. Go to [eu.posthog.com](https://eu.posthog.com) → New Project → name it `CoachOS`
2. Settings → Project API Key (starts with `phc_`)
3. Paste into `.env`:
   ```
   EXPO_PUBLIC_POSTHOG_KEY=phc_xxxx
   EXPO_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
   ```
4. Verify `App.tsx` wraps the app in `<PostHogProvider>` (see comment in `analyticsService.ts`)
5. Open the app → PostHog Live Events → confirm `signed_in` fires

**Why now:** Day 1 retention is the single most important beta metric. You need to be tracking from the first install.

---

### 0D — RevenueCat (Day 2, 1–2 hours)
This one takes the longest because it requires App Store Connect setup.

**Step 1 — App Store Connect**
1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → My Apps → New App
   - Bundle ID: `app.coachos.mobile`
   - Name: `CoachOS`
2. In App → In-App Purchases, create two subscriptions:
   - `coachos_pro_monthly` — $9.99/month
   - `coachos_pro_annual` — $79.99/year

**Step 2 — RevenueCat project**
1. [app.revenuecat.com](https://app.revenuecat.com) → New Project → "CoachOS"
2. Add iOS App → link to your App Store Connect app
3. API Keys → copy the iOS public SDK key (starts with `appl_`)
4. Create Entitlement: name it exactly `pro`
5. Add both products to the `pro` entitlement

**Step 3 — Wire keys**
```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxx
```
(Android key only needed if/when you ship Android)

**Step 4 — Test**
In dev, call `getCurrentOffering()` and confirm packages load. Use RevenueCat's sandbox environment for test purchases.

**Why now:** Without this, `hasProAccess()` always returns false and the paywall can't render. You can't validate the business model in beta if the payment flow doesn't exist.

---

### 0E — Expo Push Notifications (Day 2, 10 min)
1. [expo.dev](https://expo.dev) → log in → open or create `coachos` project
2. Settings → copy the Project ID (UUID)
3. Paste into `.env`: `EXPO_PUBLIC_PROJECT_ID=<uuid>`

---

### 0F — Maestro Test Accounts (Day 2, 15 min)
The bundle ID is now fixed (`app.coachos.mobile`). You still need real test credentials:
1. Create two coach accounts in Supabase: `coach-a@test.com` and `coach-b@test.com`
2. Copy their UUIDs from the `coaches` table
3. Update `.maestro.yaml` with real emails, passwords, and UUIDs
4. Run `maestro test maestro/navigation-test.yaml` to confirm Maestro can talk to the app
5. Run `maestro test maestro/rls-security-test.yaml` — this is the critical one

---

## Phase 1 — UX Polish (Days 3–5)
*Fix the known issues from the UX audit before real coaches see it*

Run `/product-design-critic` and `/coach-persona-tester` on any screen you're unsure about.

- [ ] **Today screen: "Next up" dominant** — coach's first question is "who's next?"; must be visible immediately, not below the fold
- [ ] **Primary CTAs in bottom 50%** — audit every screen against thumb zone; anything in top 30% gets moved
- [ ] **Mark lesson paid: 1 tap** — verify swipe-to-pay works on physical device
- [ ] **Quick note: 2 taps max** — time yourself from Today screen to saved note
- [ ] **Booking approve/decline: 1 swipe** — no hunting for buttons

---

## Phase 2 — TestFlight Closed Beta (Days 6–10)
*5–10 real coaches, zero polish pressure*

### Build
```bash
eas build --profile preview --platform ios
```
Smoke test the full loop on a physical device: sign up → add student → schedule lesson → add note → mark paid.

### Find Beta Coaches
- Personal network first — call, don't email
- USPTA local chapter coaches
- Tennis coach Facebook groups
- Local club head pros

**Offer:** Free for life on whatever plan they test, for honest feedback and a 15-min call on Day 3.

### Feedback Protocol
Do NOT send a survey. Call them. Ask only:
1. "Walk me through the last time you opened the app."
2. "What made you close it?"
3. "What would make you open it every day?"

---

## Phase 3 — Iteration (Days 11–18)
- Fix all bugs
- Fix top 2 friction points (the ones that made coaches close the app)
- Defer feature requests to post-launch roadmap
- One re-test call with a beta coach: "is this better?"

---

## Phase 4 — TestFlight Public Beta (Days 19–25)
Wider signal. Post to USPTA forums, LinkedIn, tennis coaching communities.
Set up a landing page (even a Notion page): what it does, who it's for, TestFlight link, email capture.

**Metrics to watch (PostHog):**
- Day 1 retention — do coaches come back tomorrow?
- Today screen → note creation funnel — where do they drop off?
- `lesson_completed` events — is anyone finishing the core loop?
- `paywall_viewed` — are coaches hitting the limit?

---

## Phase 5 — App Store Submission (Days 26–35)
*Only after Phase 3 confirms coaches use it daily*

- App Store Connect app already created (from Phase 0D)
- Screenshots: iPhone 6.7" and 6.1" — Today screen, student notes, scheduling
- Description: lead with job-to-be-done
- Privacy policy URL (required)
- RevenueCat subscription prices confirmed
- Submit → target 1–3 day review

---

## Phase 6 — Post-Launch (Weeks 6–12)
Once coaches are using it daily and paying:

- **AI Lesson Summaries** — the PRD is written, APIs are wired. This becomes the paywall feature. Build it.
- **Parent communication** — one-tap share of AI summary via SMS/email
- **Progress reports** — monthly PDF per student (Elena persona's core use case)
- Run `/app-store-opportunity-research` with 60 days of real usage data

---

## Skills to Use Throughout

| Skill | When |
|---|---|
| `/product-design-critic` | Before shipping any screen |
| `/coach-persona-tester` | Before building any feature |
| `/app-store-opportunity-research` | Post-launch (Week 6+) |

---

## The One Rule

> **Don't add features. Add coaches.**

Get 10 coaches using it daily, then build what they ask for. The AI layer, parent comms, progress reports — all of it waits.
