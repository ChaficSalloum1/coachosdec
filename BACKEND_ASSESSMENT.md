# Backend & Database Assessment

## High-risk findings
- **Authentication gap**: The `coaches` table lacked a link to `auth.users`, making it impossible to scope data by user identity and forcing permissive RLS rules that exposed all tenant data.
- **Overly permissive RLS defaults**: All tables used `FOR ALL USING (true)` policies, so any authenticated user could read/write every coach, student, lesson, or booking request record. Booking requests also needed an anonymous path, but there was no separation between public inserts and coach access.
- **Policy bugs in follow-up migrations**: Security hardening policies referenced `auth.uid() = id`, comparing the authenticated user ID to the coach UUID instead of a dedicated auth column. This silently granted zero protection for multi-tenant isolation.
- **Integrity blind spots**: Without unique ownership metadata, the schema could not enforce one-to-one mapping between an auth user and their coach profile, nor validate ownership across related tables.

## Improvements shipped
- Added an `auth_user_id` column to `coaches` (unique, defaults to `auth.uid()`, and references `auth.users`) with an index for performant lookups.
- Replaced permissive RLS policies with owner-scoped rules that restrict data access to the authenticated coach identity across all core tables and ensure booking requests have a valid coach.
- Updated security-hardening migrations to align with the new ownership model, preventing policy misreferences and keeping audit/rate-limit tables scoped to the correct coach.

## Remaining recommendations
- **Data migration/backfill**: When deploying, backfill `auth_user_id` for existing coaches (e.g., via a mapping table or manual updates) before enforcing the unique constraint in production environments with legacy data.
- **API mediation**: Introduce a thin backend or Supabase edge functions for booking requests to add rate limiting, spam detection, and email notifications without exposing database policies directly to the public form.
- **Observability**: Emit structured audit events from the mobile client (or edge functions) into the `audit_logs` table to trace who accessed or modified sensitive data.
- **Validation**: Add CHECK constraints for money fields (non-negative) and add NOT NULL constraints to critical foreign keys once seed data is cleaned up.
- **Testing**: Create regression SQL tests (e.g., pgTAP) that assert RLS denies cross-coach access and that anonymous inserts are limited to the booking request policy.
