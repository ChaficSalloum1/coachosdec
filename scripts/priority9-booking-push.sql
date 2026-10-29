-- ============================================
-- PRIORITY 9: PUSH NOTIFICATION FOR NEW BOOKING REQUESTS
-- Run in the Supabase SQL Editor AFTER priority1-8.
--
-- When a student sends a request from the booking page, every phone the coach
-- is signed in on gets a notification ("New booking request" / Greek).
-- No Edge Function is needed: a database trigger posts to Expo's push service
-- through the pg_net extension.
--
-- Additive and idempotent. A failed push never blocks the booking itself.
-- ============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;

-- One row per phone the coach is signed in on (the app saves it after sign-in).
CREATE TABLE IF NOT EXISTS coach_push_tokens (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL CHECK (length(token) BETWEEN 10 AND 300),
  platform TEXT,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'el')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, token)
);

ALTER TABLE coach_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage their own push tokens" ON coach_push_tokens;
CREATE POLICY "Coaches manage their own push tokens" ON coach_push_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE ALL ON coach_push_tokens FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON coach_push_tokens TO authenticated;

CREATE OR REPLACE FUNCTION notify_coach_of_booking_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_device RECORD;
  v_title TEXT;
  v_body TEXT;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  FOR v_device IN
    SELECT token, language FROM coach_push_tokens WHERE user_id = NEW.coach_id
  LOOP
    IF v_device.language = 'el' THEN
      v_title := 'Νέο αίτημα κράτησης';
      v_body := NEW.student_name || ' · ' || to_char(NEW.requested_date, 'DD/MM') || ' ' || to_char(NEW.requested_time, 'HH24:MI');
    ELSE
      v_title := 'New booking request';
      v_body := NEW.student_name || ' · ' || trim(to_char(NEW.requested_date, 'Dy DD Mon')) || ' at ' || trim(to_char(NEW.requested_time, 'FMHH12:MI AM'));
    END IF;

    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      body := jsonb_build_object(
        'to', v_device.token,
        'title', v_title,
        'body', v_body,
        'sound', 'default',
        'data', jsonb_build_object('screen', 'Requests', 'requestId', NEW.id)
      )
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let a notification problem stop a student's booking from being saved.
  RAISE WARNING 'booking push failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION notify_coach_of_booking_request() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS booking_request_push ON booking_requests;
CREATE TRIGGER booking_request_push
  AFTER INSERT ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION notify_coach_of_booking_request();

COMMIT;

-- Verify (expect two rows):
-- SELECT tgname FROM pg_trigger WHERE tgname = 'booking_request_push';
-- SELECT to_regclass('public.coach_push_tokens');
