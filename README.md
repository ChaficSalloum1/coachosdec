# CoachOS

A phone app for padel and tennis coaches: today's lessons at a glance, one-handed lesson entry between sessions, students and who owes what, group and repeating lessons, payment requests, and a booking page students can use without an account. English and Greek.

Built with Expo / React Native, Zustand and Supabase.

## Run it

```bash
npm install
npx expo start          # app
npm run dev:booking     # student booking page (web/booking)
```

Checks (also run by CI on every PR):

```bash
npx tsc --noEmit
npx vitest run src
npm run build:booking
```

## Where things are

| Path | What |
| --- | --- |
| `src/screens`, `src/components` | UI. `screens/today` and `screens/settings` hold one component per file. |
| `src/state` | Zustand store, split into per-domain slices in `state/slices`. |
| `src/utils`, `src/modules/payments` | Pure logic (scheduling, cancellation, income, payments), unit tested. |
| `src/services`, `src/hooks/sync` | Supabase access and the table-driven sync (`syncRegistry.ts` lists what syncs). |
| `src/config/appSettings.ts` | Business constants (slot sizes, limits, timings). |
| `src/theme/palette.json` | Every colour. Raw colours elsewhere fail a test. |
| `src/i18n` | English and Greek text; see `docs/translations.md`. |
| `web/booking` | Static student booking page; see `docs/booking-page.md`. |
| `supabase-schema.sql`, `scripts/` | Database schema and one-off SQL migrations (run in the Supabase SQL editor). |

## Docs

- `docs/setup.md` - first-time Supabase and build setup
- `docs/booking-page.md` - deploying the student booking page
- `docs/translations.md` - adding text or a language
- `docs/security-checklist.md` - security review and production checklist
- `docs/supabase-database-audit.md` - older backend audit (background reading)
- `docs/privacy-policy.md` - draft privacy policy (must be filled in and hosted before release)
- `docs/PAYMENT_ARCHITECTURE.md` - how payment requests work
- `docs/research/` - market and UX research notes
