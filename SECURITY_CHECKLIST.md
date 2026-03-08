# CoachOS Security Checklist & Production Readiness

## Security Audit Summary

**Last Updated:** December 2024
**Audit Level:** Deep security review
**Status:** Requires migrations before production

---

## CRITICAL: Migrations Required

Before going to production, run these SQL migrations in Supabase SQL Editor **in order**:

| Priority | File | Purpose |
|----------|------|---------|
| 1 | `scripts/priority1-migration.sql` | **CRITICAL** - Secure RLS policies, removes insecure defaults |
| 2 | `scripts/priority2-soft-deletes-migration.sql` | Adds `deleted_at` columns for data recovery |
| 3 | `scripts/priority3-security-hardening.sql` | Rate limiting, audit logs, input validation |

### Verification

Run `scripts/verifySupabaseMigrations.sql` to confirm all migrations are applied.

---

## Security Fixes Applied (This Audit)

### 1. Coach ID Validation on All Save Operations

**Issue:** Only `saveCoachToSupabase()` validated ownership. Other save functions relied solely on RLS.

**Fix:** Added explicit `coachId !== user.id` validation to:
- `saveStudentToSupabase()`
- `saveLessonToSupabase()`
- `saveStudentNoteToSupabase()`
- `saveAreaToSupabase()`
- `saveFacilityToSupabase()`
- `saveCourtToSupabase()`
- `saveAvailabilityRangeToSupabase()`
- `saveBlackoutDateToSupabase()`

### 2. Encryption Fail-Closed

**Issue:** Encryption returned plaintext on failure (fail-open).

**Fix:** `encryptField()` now throws on encryption failure instead of returning unencrypted data.

### 3. clearAllData() Missing Fields

**Issue:** `clearAllData()` didn't clear `studentNotes`, `availabilityRanges`, `blackoutDates`.

**Fix:** Added missing fields to ensure complete data wipe.

### 4. Public Booking Coach Validation (priority3 migration)

**Issue:** `booking_requests_public_insert` policy allowed ANY coach_id.

**Fix:** New policy validates `coach_id IN (SELECT id FROM coaches WHERE deleted_at IS NULL)`.

---

## Row Level Security (RLS) Status

| Table | RLS Enabled | Secure Policies | Client Validation |
|-------|-------------|-----------------|-------------------|
| coaches | Yes | `auth.uid() = id` | Yes |
| students | Yes | Coach-scoped | Yes |
| lessons | Yes | Coach-scoped | Yes |
| booking_requests | Yes | Coach-scoped + Validated Public INSERT | N/A (public) |
| student_notes | Yes | Coach-scoped | Yes |
| areas | Yes | Coach-scoped | Yes |
| facilities | Yes | Coach-scoped | Yes |
| courts | Yes | Coach-scoped | Yes |
| availability_ranges | Yes | Coach-scoped | Yes |
| blackout_dates | Yes | Coach-scoped | Yes |

---

## Known Security Limitations

### 1. Encryption is Obfuscation Only

**Current Implementation:**
```
enc:{hash_prefix}:{base64_encoded_data}
```

The "encryption" is base64 encoding with a hash prefix. Anyone with database access can decode by extracting the base64 portion. The hash provides integrity checking, not confidentiality.

**Recommendation:** For true encryption, implement AES-256-GCM using a native crypto module.

### 2. Client-Side ID Generation

Booking request IDs are generated client-side with predictable patterns:
```javascript
id: `request_${Date.now()}_${Math.random()...`
```

**Recommendation:** Use UUIDs generated server-side or use Supabase's `uuid_generate_v4()`.

### 3. No Request Rate Limiting

Public booking endpoint has no rate limiting, enabling potential spam attacks.

**Mitigation:** `priority3-security-hardening.sql` adds a `booking_rate_limits` table for tracking.

---

## Input Validation

### Server-Side (Database Constraints)

| Constraint | Table | Rule |
|------------|-------|------|
| check_lesson_times | lessons | `end_time > start_time` |
| check_lesson_duration | lessons | `0 < duration <= 480` |
| check_lesson_price | lessons | `price >= 0` |
| check_price_per_hour | coaches | `price_per_hour >= 0` |
| check_availability_times | availability_ranges | `end_time > start_time` |
| check_contact_not_empty | students | `length(trim(contact)) >= 3` |
| check_name_not_empty | students | `length(trim(name)) >= 2` |
| check_booking_contact_not_empty | booking_requests | `length(trim(student_contact)) >= 3` |
| check_booking_name_not_empty | booking_requests | `length(trim(student_name)) >= 2` |

### Client-Side (PublicBookingScreen)

- Email validation: Regex pattern
- Phone validation: Regex pattern
- Name validation: Minimum 2 characters
- Required field validation

---

## Authentication Security

| Feature | Status | Notes |
|---------|--------|-------|
| Email/Password Auth | Implemented | Via Supabase Auth |
| Session Persistence | Implemented | AsyncStorage with SecureStore encryption key |
| Auto Token Refresh | Enabled | Supabase handles automatically |
| Password Reset | Implemented | Email-based flow |
| Coach ID Validation | **All Operations** | Validates on every save |

---

## Data Protection

### Soft Deletes

All tables support soft deletes via `deleted_at` column:
- Records are never permanently deleted
- Queries filter out deleted records (`.is("deleted_at", null)`)
- `priority3` migration adds trigger to prevent undelete

### Optimistic Locking

Version columns prevent concurrent modification:
- coaches, students, lessons, booking_requests, student_notes
- Triggers auto-increment version on UPDATE

---

## Production Checklist

### Database Migrations (Required)

- [ ] Run `priority1-migration.sql` - Secure RLS policies
- [ ] Run `priority2-soft-deletes-migration.sql` - Soft delete columns
- [ ] Run `priority3-security-hardening.sql` - Additional hardening
- [ ] Run `verifySupabaseMigrations.sql` - Verify all applied

### Security Testing

- [ ] Test RLS isolation with two coach accounts
- [ ] Verify Coach A cannot see Coach B's data
- [ ] Test public booking flow (unauthenticated)
- [ ] Test booking with invalid coach_id (should fail)
- [ ] Verify encryption is applied to stored data

### Supabase Dashboard

- [ ] Configure password requirements (min 8 chars, complexity)
- [ ] Set up rate limits on Auth endpoints
- [ ] Enable database backups
- [ ] Review and configure email templates
- [ ] Enable RLS on all tables (should be done by migrations)

### Monitoring

- [ ] Set up alerts for failed auth attempts
- [ ] Monitor audit_logs table for suspicious activity
- [ ] Review slow query logs periodically

---

## Files Changed in This Audit

| File | Changes |
|------|---------|
| `src/services/supabaseSync.ts` | Added coach ID validation to all save functions |
| `src/utils/encryption.ts` | Changed to fail-closed on encryption errors |
| `src/state/coachStore.ts` | Fixed clearAllData() to clear all fields |
| `scripts/priority2-soft-deletes-migration.sql` | Created - adds deleted_at columns |
| `scripts/priority3-security-hardening.sql` | Created - rate limiting, audit logs, validation |

---

## Security Test Commands

### RLS Isolation Test
```bash
maestro test maestro/rls-security-test.yaml
```

### Manual Security Test

1. Create Coach A account, add a student
2. Create Coach B account
3. As Coach B, attempt to query Coach A's student via Supabase client
4. Verify RLS blocks the query

---

## Emergency Contacts

For security vulnerabilities, contact the development team immediately.
