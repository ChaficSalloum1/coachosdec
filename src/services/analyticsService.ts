/**
 * PostHog analytics service for CoachOS
 *
 * Tracks coach behaviour to inform product decisions.
 * No student PII is sent — only coach-side actions.
 *
 * Setup:
 *  1. Create a project at https://posthog.com (EU cloud: https://eu.posthog.com)
 *  2. Add your keys to .env:
 *       EXPO_PUBLIC_POSTHOG_KEY=phc_xxxx
 *       EXPO_PUBLIC_POSTHOG_HOST=https://eu.posthog.com   # or https://app.posthog.com
 *  3. Re-enable the provider only after the core app startup path is stable.
 *
 * Analytics is intentionally disabled at startup while the TestFlight build is
 * stabilized. Reintroduce the provider only after the core app opens reliably.
 */

// posthog-react-native's event properties are JSON-serialisable values
type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
export const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com';

// ---------------------------------------------------------------------------
// Typed event catalogue
// ---------------------------------------------------------------------------

export const AnalyticsEvent = {
  // Auth
  SIGNED_IN: 'signed_in',
  SIGNED_OUT: 'signed_out',

  // Lessons
  LESSON_CREATED: 'lesson_created',
  LESSON_COMPLETED: 'lesson_completed',
  LESSON_CANCELLED: 'lesson_cancelled',

  // Students
  STUDENT_ADDED: 'student_added',
  STUDENT_NOTE_ADDED: 'student_note_added',

  // Bookings
  BOOKING_REQUEST_APPROVED: 'booking_request_approved',
  BOOKING_REQUEST_REJECTED: 'booking_request_rejected',

  // Subscriptions
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_RESTORED: 'subscription_restored',
  PAYWALL_VIEWED: 'paywall_viewed',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

// ---------------------------------------------------------------------------
// Hook — use inside React components / screens
// ---------------------------------------------------------------------------

/**
 * Returns a typed `track` function bound to the PostHog instance.
 *
 * Usage:
 *   const track = useAnalytics();
 *   track(AnalyticsEvent.LESSON_CREATED, { duration: 60 });
 */
export function useAnalytics() {
  return (
    _event: AnalyticsEventName,
    _properties?: AnalyticsProperties,
  ): void => {
    return;
  };
}

/** Identify the authenticated coach. Call after login. */
export function identifyCoach(
  _posthog: unknown,
  _userId: string,
  _properties?: AnalyticsProperties,
): void {
  return;
}

/** Reset identity on sign-out. */
export function resetAnalyticsUser(
  _posthog: unknown,
): void {
  return;
}
