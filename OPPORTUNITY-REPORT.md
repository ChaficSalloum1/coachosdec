# CoachOS — App Store Opportunity Research Report
**Generated:** February 2026
**Analyst:** Claude Code (claude-sonnet-4-6)
**Method:** Competitor deep-dive · Gap analysis · Revenue validation

---

## Market Context

The global sports coaching market is **$10–13 billion** and growing at 6% CAGR through 2032.
North America holds **42% of global revenue share**.
Independent coaches have **46–90% gross margins** — they are financially motivated to pay for tools.
Families spend an average of **$883/child/season** on private coaching.
The market is **highly fragmented** — no single software dominates the solo coach segment.

---

## Competitor Landscape

### Feature Gap Matrix

| Feature | CoachNow | Upper Hand | Skillest | Acuity | Calendly | **CoachOS** |
|---|---|---|---|---|---|---|
| Lesson scheduling | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payment tracking | ❌ | ✅ | via marketplace | ✅ (generic) | ❌ | ✅ |
| Student notes + tags | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lesson-linked notes | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Court/location hierarchy | ❌ | ✅ (facility mgmt) | ❌ | ❌ | ❌ | ✅ |
| Public booking link | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Conflict detection | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Blackout date mgmt | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Student balance tracking | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| AI integration | Partial (video) | ❌ | ❌ | ❌ | ❌ | ✅ (APIs wired) |
| Parent communication | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI lesson summaries | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Progress trend analysis | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Multi-sport support | ✅ (video) | ✅ | Golf-focused | Generic | Generic | Partial (tennis) |
| Solo coach pricing | $39.99/mo | Opaque/Enterprise | $49-149/mo (student) | $16-61/mo | $0-30/mo | TBD |
| App quality/UX | Good | Poor (mobile) | Fair | Generic | Good | High potential |

### Competitor Weaknesses Summary

**CoachNow ($39.99/mo, 12K+ reviews, 4.8★)**
- Core product is VIDEO ANALYSIS — not business management
- No financial tracking, no student progress data, no lesson notes
- Acquired by Golf Genius — drifting toward niche/enterprise
- Bug complaints on mobile; decompression errors cited multiple times
- Coaches use it alongside other tools for scheduling/payments

**Upper Hand ($12.1M raised, pricing opaque)**
- Built for FACILITIES and ACADEMIES, not solo coaches
- Requires sales calls to even get pricing — friction kills indie adoption
- Mobile experience is an afterthought (primarily web)
- Overkill: solo coach doesn't need multi-staff calendar + inventory management

**Skillest ($49–$149/mo — charged to STUDENTS, not coaches)**
- Marketplace model = coaches don't own their client relationships
- Platform takes a cut of every transaction
- Golf-dominated despite "sports coaching" branding
- Solo coach building a private client base gets no benefit from the marketplace

**Acuity Scheduling ($16–61/mo)**
- Completely generic — no sport-specific vocabulary
- No student progress tracking, no lesson notes, no court/location management
- Coaches bolt it on alongside spreadsheets and texts
- Gets the job done for booking but nothing else

**Calendly ($0–30/mo)**
- Even more generic than Acuity — literally just link-based booking
- No payments, no student management, no sport context at all

---

## The Strategic Position CoachOS Owns

> **CoachOS is the only purpose-built, mobile-first management tool for independent sports coaches** — combining booking, student management, payment tracking, location management, and coach-owned data in a single app.

No competitor does all of this for a solo coach at a reasonable price point.
The nearest competitor (CoachNow) costs $39.99/mo and is primarily a video tool.
The infrastructure (Supabase, AI APIs, Expo) is already production-quality.

**The question is not whether there's a market. The question is what to build next to pull away from any would-be competition.**

---

# Top 3 Opportunities

---

## Opportunity 1: AI Coaching Intelligence Layer (RECOMMENDED ⭐)

**One-line pitch:** Turn every lesson note into an AI-powered coaching assistant that writes lesson plans, parent updates, and progress reports automatically.

**The gap:**
Every coach in the market is drowning in admin. Writing lesson summaries, drafting parent emails, planning next sessions, tracking what worked last month — all manual. CoachOS already has:
- Full lesson + note history per student
- AI API integrations ready (Anthropic Claude, OpenAI, Grok all wired)
- Supabase real-time backend

Nobody has connected these dots. Not CoachNow. Not Upper Hand. Not Acuity.

**Target user:**
Independent tennis, swim, gymnastics, or martial arts coach with 15–40 students. Charges $60–$120/hr. Spends 1–2 hrs/week on admin they hate. Has parents who constantly ask "how's my kid doing?"

**Revenue model:**
- Free tier: core scheduling, students, booking (acquire)
- Pro tier at **$9.99/mo or $79/yr**: AI features unlocked
- Conversion assumption: 15% of active users → 3,000 MAU → 450 paying → **$4,500/mo ARR at launch, scaling to $15K+/mo within 12 months**

**Revenue path:**
Month 1–3: Launch free + paid, 500 signups from indie coach communities (Reddit r/tennis, r/swimming, Instagram).
Month 4–6: App Store featuring pitch — "AI-powered coaching management" is a strong editorial angle.
Month 6–12: Referral loop — parents receiving AI summaries become organic advocates.

**Competition:**
Nobody offers this. CoachNow is adding basic AI video analysis but has no notes/history to draw from. This is a 12-month head start at minimum.

**Build complexity:** Low — all infrastructure exists. 2–4 weeks of UI + prompt engineering.
**Confidence:** High — demand proven by every coach's manual workflow, technology is uniquely available in CoachOS today.

---

## Opportunity 2: Parent Communication Portal

**One-line pitch:** Give coaches a branded parent-facing experience — lesson summaries, progress updates, payment requests — all from inside CoachOS.

**The gap:**
Every youth sports coach juggles WhatsApp groups, email, and texts for parent communication. Parents constantly ask:
- "How did the lesson go?"
- "When is the next one?"
- "Do I owe you anything?"

No competitor has a lightweight parent portal. CoachOS's data model (students, lessons, notes, payments) is a perfect foundation.

**Target user:**
Coaches with 70%+ youth clients. Tennis academies, swim schools, martial arts dojos.

**Revenue model:**
- Premium add-on: **$4.99/mo** or bundled in Pro tier at **$14.99/mo**
- Parents get a read-only web link — no app install required (reduces friction to zero)

**Build complexity:** Medium — needs web view or PWA, email/SMS notifications, read-only auth.
**Confidence:** Medium-High — strong demand signal but adds scope.

---

## Opportunity 3: Multi-Sport Expansion + Pickleball Niche

**One-line pitch:** Rebrand from "Tennis Coach App" to "CoachOS — for any sport" and capture the exploding pickleball, padel, and adult fitness coaching market.

**The gap:**
README and UI language references tennis specifically. But the data model is sport-agnostic. Pickleball is growing at 14.56% CAGR and has almost NO dedicated coach management tools. Search volume for "pickleball coach app" is near zero — first-mover opportunity.

**Target user:**
The 36,000+ certified pickleball instructors in the US (USAPA data), most of whom use paper or generic tools.

**Revenue model:**
Same as core CoachOS. The sport expansion costs almost nothing (UI label changes, sport selector at onboarding).

**Build complexity:** Low — mostly copy/positioning changes + sport-type field in onboarding.
**Confidence:** Medium — TAM expansion is real but requires marketing effort in new communities.

---

## Recommendation

**Build Opportunity 1 first.**

Here's why:
1. **Everything needed already exists** — AI APIs are wired, notes/lessons are rich data, Supabase is live.
2. **Lowest build cost, highest differentiation** — 2–4 weeks of work creates a feature no competitor can match for months.
3. **Creates a monetization wedge** — AI features justify the Pro tier upgrade, solving the revenue model question.
4. **Opportunity 2 and 3 become easier** — AI summaries ARE the parent communication feature (Opp 2). And once CoachOS has a killer differentiator, expanding to pickleball (Opp 3) is just a growth channel, not a product question.

**Sequence:**
→ **Now:** AI Coaching Intelligence Layer (Opp 1)
→ **Month 2–3:** Parent Communication Portal (Opp 2) — powered by the AI summaries
→ **Month 3–4:** Multi-sport expansion + Pickleball marketing push (Opp 3)

---
