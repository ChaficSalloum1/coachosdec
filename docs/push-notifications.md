# Push notification for new booking requests

When a student sends a request from the booking page, the coach's phone gets a
notification ("New booking request - Maria K - Wed 04 Nov at 6:00 PM"; Greek if
the coach's app is in Greek). Tapping it opens the Requests tab.

## How it works
1. After sign-in the app asks for notification permission and saves the phone's
   Expo push token in `coach_push_tokens` (with the app language).
2. A database trigger on `booking_requests` calls Expo's push service through the
   `pg_net` extension. No server or Edge Function is involved.
3. A failed push never blocks the booking: the trigger swallows the error and logs a warning.

## One-time setup
1. Run `scripts/priority9-booking-push.sql` in the Supabase SQL Editor (it enables `pg_net`).
2. Apple needs a push key linked to the app. Check with `npx eas-cli credentials`
   (iOS, production profile, Push Notifications). If no key is listed, let the tool create one.
3. On the phone, allow notifications when the app asks.

## Checking it
```sql
select user_id, platform, language, updated_at from coach_push_tokens;   -- your phone should be listed
select status_code, error_msg, created from net._http_response order by created desc limit 5;  -- results of recent pushes
```
Expo's reply for each push is in `net._http_response` (`"status":"ok"` in the content means Expo accepted it;
`DeviceNotRegistered` or `InvalidCredentials` tells you what to fix).

## Limits
- Only booking requests trigger a notification so far (not cancellations or payments).
- Tokens of phones that signed out or uninstalled stay in the table until the coach signs in again; Expo ignores them.
