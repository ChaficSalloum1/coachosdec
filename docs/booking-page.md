# Student booking page

A static page (no server) where students pick a free time and send a lesson
request. It reads the coach's open times and sends requests through the same
Supabase functions the app already uses; the coach sees requests in the app's
Requests tab.

- Source: `web/booking/` (page) and `src/utils/publicBooking.ts` (slot logic, tested)
- Link format students open: `https://<your-host>/book/<coach-booking-link>`
- You do **not** need a custom domain to start: a free `*.pages.dev` address works.

## What students see
The coach's name and sports, the price of a lesson in the coach's currency, the lesson length, and
where it takes place (the facility, else the area, from the coach's availability). The place is
saved with the request, so the lesson the coach approves already has its location. This needs
`scripts/priority10-booking-page-details.sql` (run it **before** deploying a new page build;
without it the page works but shows euros and no place).

After approving or declining, the app offers to message the student in one tap
(SMS for a phone number, email otherwise), in the coach's language.

## Build and test locally

```bash
npm install
npm run build:booking          # output: web/booking/dist
npm run dev:booking            # local dev server, open /?c=<booking-link>
```

The build reads the Supabase URL and publishable key from `eas.json`
(production env). To override, set `BOOKING_SUPABASE_URL` and
`BOOKING_SUPABASE_KEY`. These values are public by design.

Find a real booking link to test with:

```sql
select name, booking_link from coaches where deleted_at is null;
```

## Deploy (Cloudflare Pages, free)

```bash
npm run build:booking
npx wrangler login
npx wrangler pages deploy web/booking/dist --project-name coachos-booking
```

It prints an address like `https://coachos-booking.pages.dev`. Test
`https://coachos-booking.pages.dev/book/<booking-link>` on your phone.
(Netlify works too: drag `web/booking/dist` into Netlify Drop; `_redirects`
is included.)

## Point the app at the page

The app builds the link it shares from one setting. Until it is set, the app
shows "booking page not switched on yet" and hides the link and QR code, so
coaches never share a dead link. Add this under `build.production.env` in
`eas.json`, then build a new app version:

```json
"EXPO_PUBLIC_BOOKING_BASE_URL": "https://coachos-booking.pages.dev/book"
```

When you later buy a domain, add it in the Cloudflare Pages dashboard
(Custom domains), change this one value and rebuild the app. Old links keep
working as long as the old address stays up.

## Known limits (first version)

- Lessons are requested as 60 minutes; the coach confirms in the app.
- Times are shown in the viewer's own timezone, so it assumes student and coach are in the same one.
- Requests for a time that already has a pending request are allowed; the coach picks.
- No price shown (the public function does not return the coach's currency yet).
- Group lessons cannot be joined from the page.
