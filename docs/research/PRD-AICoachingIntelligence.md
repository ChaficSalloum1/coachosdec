# PRD: AI Coaching Intelligence Layer
**Product:** CoachOS — AI Coaching Intelligence
**Version:** MVP 1.0
**Date:** February 2026
**Status:** Ready for Development

---

## 1. Executive Summary

CoachOS already captures everything that matters about a coach's practice: every lesson scheduled, every payment tracked, every student note written. But that data sits inert — coaches still write parent emails by hand, still plan next sessions from memory, still summarize progress on sticky notes.

The AI Coaching Intelligence Layer connects the existing rich data to Claude AI, producing three high-value outputs automatically: **post-lesson summaries**, **AI-generated lesson plans**, and **student progress reports**. No competitor offers this. The AI APIs are already wired into the codebase. This is a 2–4 week build with a 12-month competitive moat.

---

## 2. Market Opportunity

**Problem:** Independent sports coaches spend 1–2 hours/week on administrative tasks they consider low-value:
- Writing lesson summaries (for their records and for parents)
- Planning the next session based on what happened this one
- Drafting "how's your kid doing" responses to parents
- Reviewing progress across multiple students to prioritize focus

**Market size:** ~500,000 independent sports coaches in the US alone. At $9.99/mo, capturing 1% = **$600K ARR**. Realistic 12-month target of 3,000 paying users = **$360K ARR**.

**Competitive landscape:** No direct competitor combines lesson history + student notes + AI generation. CoachNow added basic video AI analysis in 2025 but has no notes data to draw from. This is a clear first-mover position.

**Revenue validation:**
- Coaches pay $16–62/mo for generic tools that don't do this
- CoachNow charges $39.99/mo without AI coaching intelligence
- $9.99/mo for a tool that saves 1hr/week of admin is a trivial decision

---

## 3. Target Users

### Persona 1: Sarah — The Serious Tennis Coach
- 34, runs her own coaching practice at a local tennis club
- 25 active students, mix of youth and adults
- Charges $85/hr, earns $6,000–8,000/month
- Uses CoachOS for scheduling; writes lesson notes in the app
- Pain: Parents of her youth students constantly ask for progress updates; she spends Sunday evenings writing individual emails
- Willing to pay: $10–15/mo easily — saves her 90 min/week

### Persona 2: Marcus — The Swim Coach
- 41, teaches private swimming lessons + group clinics
- 35 students, mostly ages 8–16 (parents pay)
- Charges $70/hr
- Currently uses a notebook for session notes
- Pain: Can't remember what he worked on 3 sessions ago without digging; lesson planning is "winging it based on memory"
- Willing to pay: $10/mo — "if it remembers everything for me that's worth it"

### Persona 3: Elena — The Martial Arts Instructor
- 28, teaches karate at a rented studio
- 40 students, belt progression system creates natural milestone moments
- Uses spreadsheets for notes
- Pain: Writing promotion justifications and parent reports takes her 3–4 hours before every belt test
- Willing to pay: $15/mo — saves hours per test cycle

---

## 4. MVP Feature Set

### Feature 1: Post-Lesson AI Summary
**What it does:** After a coach marks a lesson as complete and saves notes, a one-tap button generates a polished 2–3 paragraph summary of the session.

**UI behavior:**
- On the lesson completion screen (or from lesson detail), show "Generate Summary" button
- Tapping triggers an API call with: student name, lesson date/duration, lesson notes, last 3 lessons' notes for context
- Shows a loading state ("Generating summary…")
- Displays the generated summary in an editable text field
- Coach can edit before saving/sharing
- "Copy" button and "Send to Parent" button (opens native share sheet with text pre-filled)
- Summary saved to lesson record

**Prompt structure (internal):**
```
You are a sports coach writing a brief, encouraging parent update.
Student: {name}, Sport: {sport}, Lesson: {date}, Duration: {duration}
Today's notes: {notes}
Recent context: {last_3_lesson_notes}
Write a 2–3 paragraph update that: (1) summarizes what was worked on, (2) highlights a positive, (3) mentions what to practice before next session. Warm, professional tone. No jargon.
```

**Edge cases:**
- No notes written → prompt coach to add at least a brief note first (don't generate from nothing)
- AI API unavailable → show "Try again" with graceful error message
- Student has no prior lessons → summary uses only current lesson notes

---

### Feature 2: AI Lesson Plan Generator
**What it does:** Before a lesson, one tap generates a structured lesson plan based on recent session notes and student progress.

**UI behavior:**
- From student profile or upcoming lesson detail, show "Plan Next Lesson" button
- Pulls last 5 lessons' notes + any open "goal" tags from student notes
- Generates a structured plan: warm-up (5 min), main drill 1 (15 min), main drill 2 (15 min), game/application (15 min), cool-down/review (5 min)
- Each segment has: activity name, coaching cue, what to watch for
- Editable before saving — coach can adjust timings and activities
- Plan saved as a draft note linked to the upcoming lesson

**Prompt structure (internal):**
```
You are an experienced {sport} coach creating a 60-minute lesson plan.
Student: {name}, Level: inferred from notes history
Recent session notes (last 5 lessons): {notes}
Open goals/tags: {goal_tags}
Create a structured lesson plan with 5 segments. For each: activity name, duration, key coaching point, what to look for. Keep it practical — these are real drills a solo coach can run. Sport: {sport}.
```

**Edge cases:**
- Fewer than 2 prior lessons → generate a "first lessons" plan appropriate for new students
- No sport set → prompt coach to set sport in profile first

---

### Feature 3: Student Progress Report
**What it does:** On demand, generate a 1-page progress report for a student covering a selectable time period (last month, last 3 months, all time).

**UI behavior:**
- From student profile, "Progress Report" button
- Date range picker (last 30 days / last 90 days / custom)
- Generates: attendance summary, skills developed (derived from note tags), key achievements, areas for continued focus, coach's overall assessment paragraph
- Rendered as a formatted in-app view
- Export as PDF (using react-native-html-to-pdf or expo-print)
- Coach can add a personal note at the bottom before exporting

**Prompt structure (internal):**
```
You are writing a student progress report for a parent and student.
Student: {name}, Sport: {sport}, Period: {date_range}
Lessons attended: {count} of {scheduled}
All session notes in period: {notes}
Tags used: {tags}
Write a structured progress report with sections: Overview, Skills Developed, Achievements, Focus Areas, Next Steps. Professional and encouraging. 400–600 words.
```

---

### Feature 4: Smart Payment Reminder Draft
**What it does:** When a student has an outstanding balance, one tap drafts a polite, personalized payment reminder message.

**UI behavior:**
- Students screen: unpaid balance badge triggers "Send Reminder" shortcut
- Generates a short, friendly 2–3 sentence message: acknowledges recent lessons, states balance, provides payment method
- Pre-fills native share sheet (SMS, WhatsApp, email)
- Logs reminder as sent in student record (with timestamp)

---

### Feature 5: Pro Tier Paywall + Upgrade Flow
**What it does:** Gates all AI features behind the Pro subscription.

**UI behavior:**
- Free users see AI buttons with a lock icon and "Pro" badge
- Tapping shows a bottom sheet: feature preview + pricing
- "Start 7-Day Free Trial" CTA → App Store subscription flow
- Pro: $9.99/mo or $79.99/yr (save 33%)
- Existing users with data automatically qualify for a 7-day free trial of Pro

---

## 5. Screen Map

```
App (existing navigation preserved)
├── Today Screen (existing)
│   └── Lesson Card → Complete Lesson → [NEW] Generate Summary button
├── Students Screen (existing)
│   └── Student Profile
│       ├── Lessons tab → Lesson Detail → [NEW] Summary / Plan buttons
│       ├── Notes tab (existing)
│       └── [NEW] Progress Report button → Report Preview → Export PDF
├── Requests Screen (existing)
├── Availability Screen (existing)
└── Settings Screen (existing)
    └── [NEW] Pro Subscription section
        ├── Current plan status
        ├── Upgrade / Manage Subscription
        └── AI Usage stats (summaries generated this month)
```

---

## 6. Primary User Flow

```
Coach completes lesson → marks as "Complete"
→ Lesson notes prompt (if empty, soft nudge)
→ "Generate AI Summary" button visible
→ Tap → loading (1–3 seconds)
→ Summary displayed, editable
→ Tap "Send to Parent" → share sheet opens with text
→ Parent receives summary via WhatsApp/SMS/email
→ Summary saved to lesson record
→ Next session: tap "Plan Next Lesson" on student profile
→ AI generates structured plan based on history
→ Coach edits, saves as lesson note
→ Monthly: tap "Progress Report" on student
→ PDF exported, sent to parent
→ Parent replies: "This is incredible, we love this coach"
```

---

## 7. Monetization

### Free Tier
- All existing CoachOS features (scheduling, students, payments, notes, booking)
- 3 AI generations/month (sampler — lets coaches experience the value)
- AI summary and lesson plan buttons visible but limited

### Pro Tier — $9.99/mo or $79.99/yr
- Unlimited AI summaries
- Unlimited lesson plan generation
- Unlimited progress reports
- PDF export
- Smart payment reminders
- Priority support

### Revenue Projections
| Month | MAU | Pro Conversions (15%) | MRR |
|---|---|---|---|
| 3 | 500 | 75 | $750 |
| 6 | 1,500 | 225 | $2,250 |
| 9 | 2,500 | 375 | $3,750 |
| 12 | 4,000 | 600 | $6,000 |
| 18 | 8,000 | 1,200 | $12,000 |

**Path to $10K MRR: ~8 months post-launch with consistent content marketing**

---

## 8. Tech Stack

**Existing (no changes needed):**
- React Native / Expo SDK 53
- Zustand + Supabase for state/backend
- Anthropic Claude API — already integrated at `src/api/anthropic.ts`
- OpenAI API — already integrated at `src/api/openai.ts`
- NativeWind for styling

**New additions:**
- `expo-print` or `react-native-html-to-pdf` — PDF generation for progress reports
- RevenueCat SDK — subscription management (handles App Store + Play Store)
- `src/services/aiCoachingService.ts` — new service wrapping AI calls with prompt templates

**AI provider strategy:**
- Primary: Anthropic Claude (claude-haiku-4-5 for speed/cost, claude-sonnet-4-6 for progress reports)
- Fallback: OpenAI GPT-4o-mini
- Cost per generation: ~$0.001–0.005 — negligible at this scale

---

## 9. AI Features Detail

**What AI does:**
- Generates natural language summaries from structured data (notes, dates, durations)
- Infers skill development from note content and tags
- Produces sport-appropriate language from context (the sport field on the Coach profile)
- Maintains consistent, encouraging tone regardless of input quality

**What AI does NOT do:**
- Does not store or train on coach/student data (stateless API calls)
- Does not provide medical or injury advice
- Does not replace the coach's judgment (all outputs are editable before use)

**Privacy:**
- Student names are sent to the AI API; contact information and financial data are NOT included in prompts
- Add a Privacy Notice in Settings explaining what data is sent to AI providers
- Comply with App Store privacy nutrition labels: "Data Used to Track You — None"

---

## 10. Data Models

```typescript
// New fields on existing Lesson interface
interface Lesson {
  // ... existing fields
  aiSummary?: string;        // Generated post-lesson summary
  aiSummaryGeneratedAt?: string; // ISO timestamp
  lessonPlan?: string;       // Generated pre-lesson plan
}

// New: AI Usage tracking for paywall
interface AIUsageStats {
  coachId: string;
  monthYear: string;         // "2026-02"
  summariesGenerated: number;
  plansGenerated: number;
  reportsGenerated: number;
}

// New: Subscription status (managed by RevenueCat, cached locally)
interface SubscriptionStatus {
  coachId: string;
  tier: 'free' | 'pro';
  expiresAt?: string;
  trialEndsAt?: string;
}
```

---

## 11. Design Direction

**Palette (inherits existing CoachOS design):**
- AI feature accent: `#6366F1` (indigo) — distinguishes AI features from core UI
- AI button background: `#EEF2FF` (indigo-50) in light mode
- Loading animation: pulsing indigo gradient
- Pro badge: `#F59E0B` (amber) — premium feel, attention-grabbing

**UI components:**
- AI action buttons: slightly rounded pill shape, indigo accent, sparkle (✦) icon prefix
- Generated content: displayed in a lightly tinted card with "AI Generated" label + edit icon
- Paywall bottom sheet: clean white card, feature list with checkmarks, bold CTA

**Tone:**
- All AI-generated content uses warm, encouraging coaching language
- UI copy is direct: "Generate Summary", "Plan Next Lesson", "Export Report"
- No AI jargon in user-facing strings

---

## 12. Launch Strategy

### Week 1–2: Soft launch to existing users
- Push update with AI features behind free trial
- Email/push notification: "New: AI-powered lesson summaries"
- Monitor generation quality and edit rates (high edit rate = prompt needs tuning)

### Week 3–4: Content marketing kickoff
- Post demo video on Instagram/TikTok: coach taps button, parent receives beautiful summary in 3 seconds
- Target: r/tennis, r/swimming, r/martialarts subreddits
- Reach out to tennis/swim coaching Facebook groups (100K+ members combined)

### Month 2: App Store optimization
- Update screenshots to showcase AI features
- Add "AI coaching assistant" to keywords
- Submit for App Store editorial consideration ("Apps We Love" — AI tools in professional services are a strong pitch)

### Month 3+: Referral loop activation
- Parents who receive AI summaries see "Powered by CoachOS" footer
- Add: "Your coach uses CoachOS — Download the free version" link in summary
- This turns every parent communication into a viral acquisition channel

### Partnership angle:
- USTA (United States Tennis Association) has 700K+ members, many are coaches
- USAPA (Pickleball) has 36K+ certified instructors
- Approach both with "official tool" partnership conversations once product is live

---

## 13. Success Metrics (Month 6 Targets)

| Metric | Target |
|---|---|
| Monthly Active Coaches | 1,500 |
| AI generations per active user/month | 12+ |
| Pro conversion rate | 15% |
| MRR | $2,250 |
| Summary → Parent send rate | >60% (proves value) |
| 30-day retention | >65% |
| App Store rating | 4.7+ |
| Avg edit rate on AI output | <40% (measures quality) |

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI output quality is poor/requires heavy editing | Medium | High | Invest in prompt engineering before launch; A/B test prompts; seed with 10 real coach sessions |
| RevenueCat integration complexity delays launch | Low | Medium | Use Expo IAP as fallback; Rev Cat has solid Expo docs |
| AI API costs spike unexpectedly | Low | Medium | Claude Haiku is $0.25/M input tokens; even 100K generations/month = ~$25. Non-issue. |
| Coaches don't trust AI with student data | Medium | Medium | Clear privacy disclosure; "AI never sees payments or contact info" messaging |
| Competitor copies the feature | Medium | Low | CoachOS has the data advantage — richer notes history = better outputs. Moat deepens over time. |

---

## 15. Compliance

**App Store:**
- Add Privacy Nutrition Label: Data Linked to You → None (AI prompts do not include PII beyond first names)
- Subscription must use Apple IAP — RevenueCat handles this
- No subscription upsell shown at app launch (App Store guideline 3.1.2)

**GDPR / Privacy:**
- Add AI data processing disclosure to Privacy Policy
- Student first names are sent to AI provider; full contact/payment data is never included
- Coach can opt out of AI features entirely in Settings

**COPPA:**
- CoachOS is for coaches, not children. No child data is collected directly.
- Student contact info (collected from coaches) is encrypted at rest — already implemented.

---

## 16. Future Roadmap (Post-MVP)

**V2 — Parent Portal (Month 3–4)**
- Parents get a read-only link to their child's progress
- AI summaries are auto-pushed after each lesson
- Parent can reply with questions → coach sees in-app

**V3 — Multi-Coach / Small Academy (Month 6–9)**
- Multiple coaches under one account
- Head coach sees AI-generated cross-coach student reports
- Pricing: $29.99/mo for up to 3 coaches

**V4 — Pickleball & Padel Expansion (Month 4+)**
- Sport-specific onboarding flow
- Sport-specific AI prompts (pickleball vocabulary, scoring context)
- Community: coaches can opt in to a "coach directory" for discovery

**V5 — Video Analysis Integration (Month 9–12)**
- Coach uploads lesson clip → AI identifies technique patterns
- Combined with notes for richer summaries
- Positions CoachOS as the full CoachNow replacement

---

## Implementation Priority

1. `src/services/aiCoachingService.ts` — core AI call wrapper with all 4 prompts
2. Post-lesson summary UI — highest daily visibility, quickest to ship
3. RevenueCat subscription + paywall
4. Lesson plan generator
5. Progress report + PDF export
6. Payment reminder draft

**Estimated dev time:**
- aiCoachingService + summary UI: 4–5 days
- RevenueCat + paywall: 2–3 days
- Lesson plan generator: 2 days
- Progress report + PDF: 3–4 days
- Payment reminder: 1 day
- QA + prompt tuning: 3 days

**Total: ~3 weeks to full MVP**
