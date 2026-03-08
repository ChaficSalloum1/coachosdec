# CoachOS Payment Architecture

## Overview

CoachOS has two distinct payment flows that serve different purposes and require different providers.

---

## 1. Coach Subscriptions (App Store / Play Store)

**Provider: RevenueCat**

Coaches pay for the CoachOS app via standard in-app purchases on iOS and Android. RevenueCat manages the entitlement state across both stores.

### Why RevenueCat?

- Apple and Google require subscription payments for SaaS apps to go through their payment systems (30% / 15% cut applies).
- RevenueCat handles receipt validation, entitlement syncing, webhook delivery, and subscription lifecycle events across both platforms from a single dashboard.
- Eliminates the need to build our own receipt validation backend.

### Plans (configure in App Store Connect + Google Play Console)

| Product ID | Billing | Price (approx) |
|---|---|---|
| `coachos_pro_monthly` | Monthly | €9.99 |
| `coachos_pro_annual` | Annual | €79.99 (~33% off) |

### Entitlement

A single entitlement `"pro"` gates all premium features:
- Unlimited students
- AI coaching assistant
- Supabase cloud sync
- Calendar integration
- Analytics exports

### Implementation

See `src/services/revenueCatService.ts`.

```
App.tsx → initRevenueCat(userId)
SubscriptionScreen → getCurrentOffering() → purchasePackage(pkg)
Auth flow → identifyUser(userId) on sign-in, resetUser() on sign-out
```

### RevenueCat Setup Checklist

- [ ] Create RevenueCat project → get iOS + Android API keys
- [ ] Add `EXPO_PUBLIC_REVENUECAT_IOS_KEY` to EAS secrets
- [ ] Add `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` to EAS secrets
- [ ] Create products in App Store Connect (`coachos_pro_monthly`, `coachos_pro_annual`)
- [ ] Create products in Google Play Console
- [ ] Map products to RevenueCat entitlement `"pro"`
- [ ] Set up RevenueCat webhooks → Supabase Edge Function to sync subscription status

---

## 2. Client-to-Coach Payments (Future)

**This flow handles a student paying a coach for a lesson.** This is not an in-app purchase — it is a direct money transfer between two parties and must NOT go through the App Store.

Apple's guidelines explicitly allow peer-to-peer payment flows outside IAP when real services are exchanged between users.

### Options Under Consideration

#### Option A: Stripe
- Industry standard payment processing
- Supports Connect (marketplace payments with automatic splits/payouts to coaches)
- Strong European coverage, SCA-compliant
- Best for: card payments, future subscription billing for client→coach recurring sessions
- SDK: `@stripe/stripe-react-native`

#### Option B: Revolut Business / Revolut Pay
- Very popular in Greece and across Europe
- Revolut Pay button has near-zero friction for Revolut users
- Revolut Business API supports payment links and splits
- Best for: European coaches and clients already on Revolut
- Integration: Generate a Revolut payment link server-side, open in-app browser

#### Option C: IRIS (Greek Instant Payments via DIAS)
- Greek national instant payment scheme (interbank, like UK Faster Payments)
- Payments triggered via QR code or phone number / IBAN alias
- Zero transaction fees for amounts under €10k
- Best for: Greek market — many coaches and parents already use IRIS via their banking app
- Integration: Generate an IRIS QR code (ISO 20022 `pain.001` payload encoded as QR) → display in-app for student to scan with their bank app

### Recommended Approach

**Phase 1 (MVP):** Manual payment tracking — coach marks lesson as paid in-app; no money moves through CoachOS.

**Phase 2:** IRIS QR code display — generate a QR code with the coach's IBAN and lesson amount. Zero fees, no third-party dependency. The student pays with their own bank app. CoachOS detects payment via a Supabase webhook triggered by coach confirmation.

**Phase 3:** Revolut Pay / Stripe — integrate a proper payment button for coaches who want automated payment collection and reconciliation.

### IRIS QR Code Format (reference)

```
IRIS QR payload follows the EPC QR code standard (ISO 20022):
BCD          ← service tag
002          ← version
1            ← encoding (UTF-8)
SCT          ← identification (SEPA Credit Transfer)
BANKGR...    ← BIC of coach's bank
Coach Name   ← beneficiary name
GR...        ← IBAN of coach
EUR60.00     ← amount
             ← purpose code (optional)
             ← remittance info reference (optional)
Lesson 2024-03-06  ← remittance info (free text, shown to payer)
```

`react-native-qrcode-svg` is already installed and can render this QR code directly.

### Implementation Sketch (IRIS QR)

```typescript
// src/services/irisPaymentService.ts
export function buildIrisQRPayload(params: {
  coachIban: string;
  coachBic: string;
  coachName: string;
  amountEur: number;
  reference: string;
}): string {
  return [
    'BCD', '002', '1', 'SCT',
    params.coachBic,
    params.coachName,
    params.coachIban,
    `EUR${params.amountEur.toFixed(2)}`,
    '', '', // purpose, structured reference
    params.reference,
  ].join('\n');
}
// Then render: <QRCode value={buildIrisQRPayload(...)} size={200} />
```

---

## Summary

| Flow | Provider | When |
|---|---|---|
| Coach pays for CoachOS | RevenueCat (IAP) | Now (Phase 1) |
| Client pays coach (manual) | In-app tracking only | Now (Phase 1) |
| Client pays coach (QR) | IRIS QR code | Phase 2 |
| Client pays coach (card) | Revolut Pay or Stripe | Phase 3 |
