# CoachOS — Launch Plan
**From current state → TestFlight beta → App Store**
**Updated:** March 2026

---

## Phase 0 — Foundation (Days 1–2)
*Get the house in order before anyone sees it*

### Database
- [ ] Run Supabase migrations in order (see SECURITY_CHECKLIST.md):
  1. `scripts/priority1-migration.sql` — CRITICAL, do this first
  2. `scripts/priority2-soft-deletes-migration.sql`
  3. `scripts/priority3-security-hardening.sql`
- [ ] Run `scripts/verifySupabaseMigrations.sql` to confirm all applied
- [ ] Verify public booking policy is locked to valid coaches only

### App Identity
- [ ] Rename app from `template-app-53` → `CoachOS` in `package.json` + `app.json`
- [ ] Set version to `1.0.0-beta.1`
- [ ] Confirm bundle identifier in `app.json` is production-ready (not a template ID)
- [ ] Confirm app icon and splash screen assets are in place

### Environment
- [ ] Confirm `.env` is NOT committed (`.gitignore` has it — verify)
- [ ] Confirm all API keys (Supabase, RevenueCat, Sentry, PostHog) are set in EAS secrets, not hardcoded
- [ ] Sentry DSN wired and error reporting verified with a test throw

---

## Phase 1 — UX Polish (Days 3–5)
*Fix the known issues from the UX audit before real coaches see it*

These are from the one-handed UX research (`UX-SIMPLICITY-RESEARCH.md`):

- [ ] **Today screen: "Next up" visible immediately** — the coach's first question is "who's next?"; it must be the dominant visual element, not buried in a list
- [ ] **Primary actions in bottom 50% of screen** — audit every screen against the thumb zone map; move any primary CTA that lives in the top 30%
- [ ] **Mark lesson paid: 1 tap** — verify swipe-to-pay gesture works reliably; test on physical device
- [ ] **Quick note: 2 taps max** — time yourself from Today screen to saving a note; if it's more than 2 taps, simplify
- [ ] **Booking approve/decline: 1 swipe** — confirm this is in place and intuitive without labels

**Design review:** Run `/product-design-critic` on TodayScreen and the student note flow before shipping.
**Persona test:** Run `/coach-persona-tester` on any new UI decisions.

---

## Phase 2 — TestFlight Closed Beta (Days 6–10)
*5–10 real coaches, zero polish pressure*

### Build
- [ ] Run `eas build --profile preview --platform ios`
- [ ] Confirm build succeeds and installs cleanly on a physical device
- [ ] Smoke test the full coach journey: sign up → add student → schedule lesson → add note → mark paid

### Recruit Beta Coaches
Target profile: independent tennis or sports coaches, iPhone users, 10–30 active students.

Find them via:
- [ ] Personal network — ask directly, not through a form
- [ ] USPTA (United States Professional Tennis Association) local chapters
- [ ] Tennis coach Facebook groups (search "tennis coach community", "tennis teaching professionals")
- [ ] Local tennis clubs — email the head pro, ask if any independent coaches use the facility

**Offer:** Free for life on the plan they test, in exchange for honest feedback and a 15-min call after Day 3.

### Feedback Collection
- Do NOT send a survey. Call them.
- Ask three questions only:
  1. "Walk me through the last time you opened the app. What did you do?"
  2. "What made you close it?"
  3. "What would make you open it every day?"
- Document verbatim responses — not paraphrases

---

## Phase 3 — Iteration (Days 11–18)
*Fix what the beta coaches actually break, not what you imagined they would*

- [ ] Triage feedback into: bugs / friction / missing features
- [ ] Fix all bugs
- [ ] Fix top 2 friction points (the ones that caused coaches to close the app)
- [ ] Defer all missing feature requests to post-launch roadmap unless they block core use
- [ ] Run a second smoke test with one beta coach — "is this better?"

---

## Phase 4 — TestFlight Public Beta (Days 19–25)
*Wider signal, still controlled*

- [ ] Build `eas build --profile production --platform ios`
- [ ] Submit to TestFlight — enable public link
- [ ] Post to:
  - [ ] USPTA community forums
  - [ ] r/tennis coaching subreddit
  - [ ] LinkedIn — post as founder, not as product
  - [ ] Twitter/X tennis coaching hashtags
- [ ] Set up a simple landing page (even a Notion page) with: what CoachOS does, who it's for, TestFlight link, and a "notify me at launch" email capture

### Metrics to watch (PostHog is already wired):
- Day 1 retention — do coaches come back the next day?
- Today screen → note creation funnel — where do coaches drop off?
- Lesson marked paid — is anyone completing the core loop?

---

## Phase 5 — App Store Submission (Days 26–35)
*Only when Phase 3 feedback confirms coaches are using it daily*

### Pre-submission
- [ ] App Store Connect account set up and app created
- [ ] Screenshots: iPhone 6.7" and 6.1" — show Today screen, student notes, lesson scheduling
- [ ] App description: lead with the job-to-be-done ("The scheduling and student management app built for independent sports coaches")
- [ ] Keywords: tennis coach app, sports coach scheduling, lesson booking, student notes, coaching software
- [ ] Privacy policy URL (required — even a simple one)
- [ ] RevenueCat subscription configured: free tier + paid tier (suggest $9.99/mo or $79.99/yr)

### Submission
- [ ] Submit for App Store review
- [ ] Prepare for rejection: have screenshot explanations ready for any payment flow questions
- [ ] Target review turnaround: 1–3 days (Apple averages 24hrs for most apps now)

---

## Phase 6 — Post-Launch (Weeks 6–12)
*Now build the moat*

Once coaches are using it daily and paying:

- [ ] **AI Lesson Summaries** — the PRD is already written, the APIs are already wired. This becomes the paywall feature that justifies the paid tier. Build it.
- [ ] **Parent communication** — one-tap share of AI summary to parent via SMS/email
- [ ] **Progress reports** — monthly auto-generated PDF per student (Elena persona's primary use case)
- [ ] Re-run `/app-store-opportunity-research` with 60 days of real usage data to find the next expansion opportunity

---

## Skills Available for This Process

| Skill | When to use |
|---|---|
| `/product-design-critic` | Before shipping any screen — ruthless UX review against the one-handed constraint |
| `/coach-persona-tester` | Before building any feature — would Sarah, Marcus, or Elena actually use this? |
| `/app-store-opportunity-research` | Post-launch (Week 6+) — find the next product expansion |

---

## The One Rule

> **Don't add features. Add coaches.**

Every day spent building something not yet validated by a real coach is a day of negative signal. Get 10 coaches using it, then build what they ask for. The AI layer, parent comms, progress reports — all of it waits until coaches are opening the app daily.
