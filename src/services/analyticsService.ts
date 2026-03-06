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
 *  3. Wrap your app root with <PostHogProvider> (see App.tsx integration note below).
 *
 * App.tsx integration:
 *   import { PostHogProvider } from 'posthog-react-native';
 *   import { POSTHOG_KEY, POSTHOG_HOST } from './src/services/analyticsService';
 *
 *   export default function App() {
 *     return (
 *       <PostHogProvider apiKey={POSTHOG_KEY} options={{ host: POSTHOG_HOST }}>
 *         <RootNavigator />
 *       </PostHogProvider>
 *     );
 *   }
 */

import { usePostHog } from 'posthog-react-native';

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
  const posthog = usePostHog();

  return (
    event: AnalyticsEventName,
    properties?: AnalyticsProperties,
  ): void => {
    if (!POSTHOG_KEY) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog?.capture(event, properties as any);
  };
}

/** Identify the authenticated coach. Call after login. */
export function identifyCoach(
  posthog: ReturnType<typeof usePostHog>,
  userId: string,
  properties?: AnalyticsProperties,
): void {
  if (!POSTHOG_KEY || !posthog) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posthog.identify(userId, properties as any);
}

/** Reset identity on sign-out. */
export function resetAnalyticsUser(
  posthog: ReturnType<typeof usePostHog>,
): void {
  if (!posthog) return;
  posthog.reset();
}
