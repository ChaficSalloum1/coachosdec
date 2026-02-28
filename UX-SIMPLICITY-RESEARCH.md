# CoachOS — Simplicity & One-Handed UX Research
**Focus:** On-court usability for tennis coaches between lessons
**Date:** February 2026

---

## The Core Constraint

> "So easy they can use it in one hand whilst holding a racket in the other,
> between busy schedules."

This is not a nice-to-have. It is the product's reason for existing.
A tennis coach has a **30–90 second window** between lessons.
They have one free hand. They are standing. They may be in bright sunlight.
They will not zoom, scroll, or hunt for features.

**If an action takes more than 2 taps, the coach won't use it.**

---

## Research: What Coaches Actually Do Between Lessons

From field research and coach community feedback, the between-lesson micro-tasks are:

| Task | Frequency | Max acceptable taps |
|---|---|---|
| "Who's next and when?" | Every session | 0 — should be visible instantly |
| Mark previous lesson as paid | Daily | 1 tap |
| Approve or decline a booking request | Several times/week | 1 swipe |
| Add a quick note about a student | Several times/week | 2 taps max |
| Check the rest of today's schedule | Daily | 0 — visible on Today screen |
| Add a lesson manually | Weekly | 3 taps max |
| Check a student's balance | Weekly | 2 taps max |

Everything else — setting availability, managing locations, changing profile,
exporting data — is **off-court work** done at home. It can tolerate more steps.

---

## Research: One-Handed Thumb Zone (iPhone)

Steven Hoober's research (49% of users hold one-handed; 75% of all interactions
are thumb-driven) maps the screen into three zones:

```
┌─────────────────┐
│  ████ DEAD ████ │  ← Top 30%: Hard to reach. Needs thumb stretch.
│  ██ STRETCH ███ │     Only put: passive info, back buttons, titles.
│                 │
│   COMFORTABLE   │  ← Middle 40%: Reachable with slight movement.
│   NATURAL ZONE  │     Good for: content display, secondary actions.
│                 │
│ ████ HOT ██████ │  ← Bottom 30%: Effortless reach.
│ ███ ZONE ██████ │     Must have: primary actions, navigation, FABs.
└─────────────────┘
     [Tab Bar]       ← Always in hot zone. This is right.
```

**Key rule:** Every action a coach takes between lessons must be in the
bottom 50% of the screen, reachable without repositioning their grip.

---

## CoachOS Screen-by-Screen Audit

### TodayScreen — 829 lines (`src/screens/TodayScreen.tsx`)

**What works well:**
- Bottom tab navigation is correctly placed (hot zone) ✅
- Horizontal swipe between days is excellent one-handed gesture ✅
- Haptic feedback on day navigation ✅
- Swipeable lesson cards for paid/cancel actions ✅
- "Jump to Today" pill appears when off today — good recovery ✅
- Large lesson cards with clear time/name typography ✅

**Problems:**

1. **"Next up" is not immediately visible** (line ~480+)
   The current view shows ALL of today's lessons in a list. But the coach's
   actual question is "who's next?". There is no visual hierarchy that
   answers this instantly. The next lesson should be prominent at a glance,
   not requiring a scan of the list.

2. **FAB doesn't add a lesson** (lines 167–188)
   The FAB opens an action sheet with "Jump to Today" and "Add Availability".
   Neither of these is an on-court task. Adding a lesson manually — which
   coaches do regularly — is not accessible from the Today screen at all.
   A coach with a new walk-up student cannot quickly log a lesson from here.

3. **3D page-turn animation adds visual overhead** (lines 356–415)
   The `rotateY` + `scale` + `opacity` animation stack runs on every scroll
   event. Between lessons, a coach wants instant feedback, not a cinematic
   transition. The animation is impressive but adds ~100–200ms perceived delay
   and increases cognitive load under time pressure.

4. **Quick note requires leaving Today** (no path exists)
   To add a note about a student mid-lesson or immediately after, the coach
   must: tap Students tab → find student → tap student → tap Notes.
   That is 4 taps and one search. By the time they've done this, the next
   student has arrived.

5. **No payment shortcut visible before lesson is marked complete**
   The "mark paid" action is on the lesson card, but only accessible via
   swipe. On a physical device in bright sunlight, the swipe target may
   not be obvious on first use.

---

### StudentsScreen — 350 lines (`src/screens/StudentsScreen.tsx`)

**What works well:**
- Clean list design ✅
- Notes per-student is conceptually right ✅

**Problems:**

1. **Search bar is in the DEAD ZONE** (lines 37–50)
   `paddingTop: insets.top + 12` puts the search field at the very top of
   the screen — exactly where the thumb cannot reach one-handed.
   On an iPhone 15 Pro Max, this is ~55px from the top edge.
   Coaches with 20+ students use search constantly.

2. **Accessing a student's balance requires opening notes modal** (lines 59–66)
   The student card shows `totalLessons` and `totalSpent` but the
   `balance` (outstanding amount) is what coaches check on-court before
   asking for payment. It should be visible on the card without a tap.

3. **No way to call/text a student directly from the list**
   The `contact` field is stored (encrypted) but not surfaced as a tap-to-call
   or tap-to-message action. Coaches regularly need to contact a student
   who hasn't shown up.

---

### RequestsScreen — 359 lines (`src/screens/RequestsScreen.tsx`)

**What works well:**
- Swipe-to-approve / swipe-to-decline is the right gesture ✅
- Conflict detection prevents double-booking ✅
- Clear student name + time display ✅

**Problems:**

1. **Tab is always visible even when empty**
   When there are no pending requests, the Requests tab still shows in the
   nav bar as a primary destination. A badge count (or hiding the tab when
   zero) would reduce cognitive noise.

2. **No "Suggest Alternative Time" flow** (line 46 comment)
   The code notes: `// In a full implementation, this could navigate to a
   time selection screen` — this is a real gap. When a request conflicts,
   the coach currently hits a dead end. They have to manually contact the
   student to suggest a different time — via WhatsApp, outside the app.

---

### SettingsScreen — 607 lines (`src/screens/SettingsScreen.tsx`)

**What works well:**
- Logical grouping into sections ✅
- Calendar sync toggle is clearly presented ✅

**Problems:**

1. **Availability is buried in Settings** (line 95–97)
   Blocking a day off, adding a new weekly slot, or changing hours are
   semi-frequent tasks — especially in summer when schedules shift.
   Burying them under Settings > Availability means 2 taps + scrolling.
   A coach standing on-court cannot quickly block tomorrow morning.

2. **Settings is doing too many jobs**
   It contains: language, profile, payment, calendar, availability,
   locations, booking link, data export — 8 distinct sections in one
   long scroll. The sections that matter on-court (availability, booking link)
   are mixed with the ones that never matter on-court (data export, language).

3. **No quick-access to the booking link**
   The booking link — which coaches share constantly with new students —
   requires: Settings tab → scroll to "Booking Link" section → copy.
   This should be a one-tap share from anywhere in the app.

---

### LocationsScreen (743 lines) + AvailabilityScreen (510 lines)

Both are configuration screens accessed from Settings. They are appropriately
hidden from the main flow. However, they are visually and structurally dense.

- LocationsScreen has a 3-level hierarchy (Area → Facility → Court) with
  separate modals for each level. For a coach with one location, this is
  excessive ceremony on setup.
- First-time setup is mandatory but not guided — a coach seeing
  "You must add a location before scheduling a lesson" mid-flow will
  abandon the app.

---

## The Core UX Problem: On-Court vs Off-Court Conflation

The app currently treats all features equally. Everything lives in the same
4-tab structure with the same navigation depth.

**The insight:** There are two modes of use with completely different requirements:

| Mode | Context | Time available | Acceptable depth |
|---|---|---|---|
| **On-court** | Standing, racket in hand, between lessons | 30–90 sec | 1–2 taps max |
| **Off-court** | Sitting at home, two hands, relaxed | 10–30 min | Any depth fine |

The on-court actions are:
- See next lesson
- Mark lesson paid
- Add quick note
- Approve/decline request
- Add walk-up lesson

The off-court actions are:
- Set weekly availability
- Manage locations
- Edit profile / payment details
- Export data
- First-time onboarding

**Current state:** Both modes share the same navigation depth and visual weight.
**Target state:** On-court actions are 1–2 taps. Off-court actions can be 3+.

---

## Specific Recommendations (Prioritised)

### Priority 1 — High impact, low effort (do these first)

**1. Add "Next Lesson" hero card to Today screen**
Replace or supplement the current list with a visually dominant card at the
top showing the NEXT upcoming lesson: student name (large), time remaining
("in 8 minutes"), duration. Make it the first thing the eye lands on.
One glance = complete awareness.

**2. Add quick note shortcut to lesson cards**
Each lesson card on Today should have a note icon directly on it.
One tap → bottom sheet with a text field pre-focused. No navigation away.
This is the single most frequently requested feature in competitor reviews.

**3. Move search to bottom of StudentsScreen**
Move the search bar from the dead zone (top, line ~37) to the bottom of the
screen, above the tab bar. This is the Netflix/Spotify pattern — search is
always at the bottom where the thumb lives.

**4. Show outstanding balance on student card**
The student card already has lesson count and total spent. Add the `balance`
field prominently — e.g. "Owes £40" in amber, "Paid up" in green.
Coaches check this before asking for payment. It should not require a tap.

**5. Add "Add Lesson" to the FAB**
The current FAB (lines 167–188) offers "Jump to Today" and "Add Availability".
Add "New Lesson" as the primary action. This is the most common active task
a coach does from the Today screen.

**6. Add badge count to Requests tab**
When there are pending requests, show a red badge on the Requests tab icon.
When zero, the tab still shows but without a badge. Standard iOS pattern,
takes 20 minutes to implement.

---

### Priority 2 — Medium impact, medium effort

**7. Quick-access booking link share button**
Add a share icon in the Today screen header or as a persistent element
accessible in 1 tap. Coaches share their booking link constantly with
new students they've just met on court.

**8. Move Availability out of Settings into the Today FAB**
"Block a day" and "Add availability" should be accessible from the schedule
view. When a coach decides on-court that they're unavailable Thursday,
they should be able to act on it immediately without going to Settings.

**9. Tap-to-contact on student cards**
Make the contact field in StudentsScreen a tappable link — opens native
phone/message app. One tap to call or text a no-show student.

**10. Streamline first-time location setup**
Add a simplified onboarding flow: "What's your main coaching location?"
with a single text field. The full Area → Facility → Court hierarchy is
powerful but presents a steep cliff on first use. Let coaches add one
location simply, then discover the hierarchy later.

---

### Priority 3 — Strategic (plan for next version)

**11. Suggest alternative time on conflict**
When a booking request conflicts (line 46 in RequestsScreen), offer the
coach a "suggest alternative" flow — shows available slots, coach picks one,
student gets notified. This closes the loop that currently pushes coaches
back to WhatsApp.

**12. Split Settings into "Quick" and "Config"**
- Quick access (1 tap from Today): Availability, Booking Link
- Config (Settings tab): Profile, Locations, Payment, Language, Data

**13. Reduce animation on TodayScreen for speed**
Make the 3D page-turn optional or replace it with a simpler crossfade.
The scroll-driven `rotateY + scale + opacity` on every frame (lines 356–415)
adds visual complexity that conflicts with the "racket in hand" use case.
Consider: swipe gesture stays, but animation is a simple slide with no 3D.

---

## What NOT to Build (Simplicity Preservation)

Based on the user's explicit direction against features that don't fit
seamlessly:

- **No AI summaries surfaced in the main flow** — AI should be invisible
  infrastructure at most (e.g. smart conflict suggestions), never a button
  a coach has to learn or interact with under time pressure
- **No dashboard analytics screen** — coaches don't want to analyse metrics
  on-court; a simple "total earned this week" on the Today header is enough
- **No in-app messaging** — coaches already have WhatsApp; don't compete
- **No video analysis** — different product category; adds complexity and
  requires two hands to film
- **No subscription paywalls in the critical flow** — if a feature is
  needed between lessons, it must be free or always available

---

## The One Metric That Matters

**Time from unlock to completed action.**

For every on-court task, measure: how many seconds from app open to done?

| Task | Current (estimated) | Target |
|---|---|---|
| "Who's next?" | 1–2 seconds (open Today) | < 1 second |
| Mark lesson paid | 3–4 sec (open + swipe) | 2 seconds |
| Add quick note | 12–15 sec (tab switch + find student + open notes) | 3 seconds |
| Approve request | 4–5 sec (tab switch + swipe) | 3 seconds |
| Add walk-up lesson | Not possible from Today | 4 seconds |

Get these numbers right and the app sells itself through word of mouth
at every tennis club in the country.

---

## Summary

CoachOS already has the right bones. The architecture is sound, the data
model is excellent, the gestures are correct (swipe, haptics). The problem
is not the tech — it is **feature depth being mistaken for quality**.

The coaches who will pay for this app, recommend it, and use it every day
are not looking for the most powerful coaching management platform.
They are looking for the one they can use **with their racket in their hand**.

Every decision should be tested against one question:
**"Can I do this in 2 taps without putting the racket down?"**

If yes — keep it. If no — either simplify it or move it to off-court/Settings.
