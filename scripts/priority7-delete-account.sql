-- ============================================
-- PRIORITY 7: IN-APP ACCOUNT DELETION
-- Run in the Supabase SQL Editor AFTER priority1-6.
--
-- Apple requires apps with account creation to let users delete the account
-- inside the app. The app calls this function; it permanently removes the
-- signed-in coach and everything they own, then the login itself.
--
-- Additive and idempotent (CREATE OR REPLACE). Only the signed-in user can
-- delete themselves: the function uses auth.uid(), never a parameter.
-- ============================================

BEGIN;

CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
  END IF;

  -- Push tokens only exist if the notifications feature was set up.
  IF to_regclass('public.coach_push_tokens') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.coach_push_tokens WHERE user_id = $1' USING v_uid;
  END IF;

  -- Cascades to areas, facilities, courts, students, notes, lessons,
  -- booking requests, availability and blackout dates. audit_logs keep their
  -- rows with coach_id set to NULL.
  DELETE FROM public.coaches WHERE id = v_uid;

  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;

COMMIT;

-- Verify (expect one row, prosecdef = true):
-- SELECT proname, prosecdef FROM pg_proc WHERE proname = 'delete_my_account';
